import logging

logger = logging.getLogger(__name__)

# We will lazy-load the model to prevent server startup slowdowns
model = None

def get_yolo_model():
    global model
    if model is None:
        logger.info("Lazy loading YOLO model...")
        
        # Defer heavy imports to prevent slowing down the rest of the application
        import torch
        from ultralytics import YOLO
        
        # Fix PyTorch 2.6+ security update blocking Ultralytics model loading
        _original_torch_load = torch.load

        def _patched_torch_load(*args, **kwargs):
            kwargs['weights_only'] = False
            return _original_torch_load(*args, **kwargs)

        torch.load = _patched_torch_load

        try:
            # Use yolov8n for speed, it will download automatically if not present
            model = YOLO("yolov8n.pt")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            model = None
        finally:
            # Restore original torch.load
            torch.load = _original_torch_load
            
    return model

# COCO classes for vehicles
VEHICLE_CLASSES = [2, 3, 5, 7] # car, motorcycle, bus, truck

def run_vehicle_detection(image_bytes: bytes, slots: list) -> dict:
    """
    Run YOLOv8 on the image and check overlap with provided slot polygons.
    
    slots format: [{"id": "A1", "polygon": [[x1, y1], [x2, y2], ...]}, ...]
    """
    import cv2
    import numpy as np
    from shapely.geometry import Polygon, box

    current_model = get_yolo_model()
    if current_model is None:
        raise RuntimeError("YOLO model not loaded")

    # 1. Read image from bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Failed to decode image")

    # 2. Run inference
    results = current_model(image, verbose=False)
    
    # Extract vehicle bounding boxes
    vehicle_boxes = []
    if len(results) > 0:
        boxes = results[0].boxes
        for b in boxes:
            cls_id = int(b.cls[0].item())
            if cls_id in VEHICLE_CLASSES:
                # Get xyxy coordinates
                x1, y1, x2, y2 = b.xyxy[0].tolist()
                vehicle_boxes.append(box(x1, y1, x2, y2))
                
    # 3. Check overlap for each slot
    occupancy_results = []
    available_count = 0
    
    for slot in slots:
        slot_id = slot.get("id")
        polygon_points = slot.get("polygon")
        
        if not slot_id or not polygon_points or len(polygon_points) < 3:
            continue
            
        try:
            slot_poly = Polygon(polygon_points)
            if not slot_poly.is_valid:
                slot_poly = slot_poly.buffer(0) # Attempt to fix invalid geometries
        except Exception as e:
            logger.warning(f"Invalid polygon for slot {slot_id}: {e}")
            continue
            
        is_occupied = False
        for v_box in vehicle_boxes:
            # Check if vehicle box intersects significantly with the slot
            intersection_area = slot_poly.intersection(v_box).area
            # Consider occupied if intersection is > 10% of the box area or > 10% of the slot area
            # Adjust these thresholds as needed for better accuracy
            if intersection_area > 0:
                if (intersection_area / v_box.area > 0.1) or (intersection_area / slot_poly.area > 0.1):
                    is_occupied = True
                    break
                    
        status = "occupied" if is_occupied else "free"
        if not is_occupied:
            available_count += 1
            
        occupancy_results.append({
            "slot_id": slot_id,
            "status": status
        })
        
    return {
        "results": occupancy_results,
        "available_slots": available_count
    }
