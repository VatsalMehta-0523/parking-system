"""
Surveillance Service — YOLOv8 vehicle detection + polygon occupancy analysis.

Loads the YOLOv8l model lazily (singleton), runs inference on uploaded images,
and checks whether detected vehicles overlap user-defined polygon regions.
"""

import logging
import io
import numpy as np
from PIL import Image
from pathlib import Path

logger = logging.getLogger(__name__)

# ─── Lazy Model Singleton ─────────────────────────────────────────────────────

_model = None
_MODEL_NAME = "yolo11x.pt"

# COCO class IDs for vehicles
# Note: 67 (cell phone) is added as a hack for top-down aerial images where cars look like smartphones
VEHICLE_CLASSES = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck", 67: "car"}


def _get_model():
    """Load YOLO model lazily on first call."""
    global _model
    if _model is None:
        logger.info(f"Loading {_MODEL_NAME} model (first-time may download large file)...")
        from ultralytics import YOLO

        # Check common locations for the model file
        model_paths = [
            Path(__file__).parent.parent.parent / "models" / _MODEL_NAME,  # backend/models/
            Path(_MODEL_NAME),  # current directory
        ]

        model_path = None
        for p in model_paths:
            if p.exists():
                model_path = str(p)
                break

        if model_path:
            logger.info(f"Loading model from: {model_path}")
            _model = YOLO(model_path)
        else:
            # Fallback: ultralytics will auto-download to ~/.cache/ultralytics/
            logger.info("Model not found locally, ultralytics will auto-download...")
            _model = YOLO(_MODEL_NAME)

        logger.info(f"{_MODEL_NAME} loaded successfully.")
    return _model


# ─── Point-in-Polygon (Ray Casting) ──────────────────────────────────────────

def point_in_polygon(x: float, y: float, polygon: list[list[float]]) -> bool:
    """
    Ray-casting algorithm to determine if a point (x, y)
    lies inside a polygon defined as [[x1,y1], [x2,y2], ...].
    """
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def bbox_polygon_overlap(bbox: list[float], polygon: list[list[float]], threshold: float = 0.3) -> bool:
    """
    Check if a bounding box overlaps a polygon region.

    Uses multiple sample points within the bbox — if enough points
    fall inside the polygon, we consider it overlapping.

    bbox: [x1, y1, x2, y2] in pixel coordinates
    polygon: [[x1,y1], [x2,y2], ...] in pixel coordinates
    threshold: fraction of sample points that must be inside polygon
    """
    x1, y1, x2, y2 = bbox
    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2

    # Check center point first (fast path)
    if point_in_polygon(cx, cy, polygon):
        return True

    # Sample a grid of points within the bbox
    sample_points = [
        (cx, cy),                          # center
        (x1, y1), (x2, y1),               # top-left, top-right
        (x1, y2), (x2, y2),               # bottom-left, bottom-right
        ((x1 + cx) / 2, (y1 + cy) / 2),   # mid-top-left
        ((cx + x2) / 2, (y1 + cy) / 2),   # mid-top-right
        ((x1 + cx) / 2, (cy + y2) / 2),   # mid-bottom-left
        ((cx + x2) / 2, (cy + y2) / 2),   # mid-bottom-right
    ]

    inside_count = sum(1 for px, py in sample_points if point_in_polygon(px, py, polygon))
    return (inside_count / len(sample_points)) >= threshold


# ─── Main Detection Function ─────────────────────────────────────────────────

def detect_occupancy(
    image_bytes: bytes,
    regions: list[dict],
    confidence_threshold: float = 0.15,
) -> dict:
    """
    Run YOLOv8 vehicle detection on an image and check each polygon region.

    Args:
        image_bytes: Raw image file bytes
        regions: List of dicts with 'slot_name' and 'polygon' ([[x,y], ...])
                 Polygon coordinates are in NORMALIZED form (0-1 range relative to image)
        confidence_threshold: Minimum detection confidence

    Returns:
        dict with:
          - 'slots': list of {slot_name, status, confidence, vehicles_detected}
          - 'total_detections': total vehicles found in image
          - 'image_size': {width, height}
    """
    model = _get_model()

    # Load image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_w, img_h = image.size

    # Run YOLOv8 inference
    # Use imgsz=1280 for better detection on aerial/top-down views
    results = model(image, conf=confidence_threshold, imgsz=1280, verbose=False)

    # Extract vehicle detections
    detections = []
    if results and len(results) > 0:
        result = results[0]
        for box in result.boxes:
            cls_id = int(box.cls[0])
            if cls_id in VEHICLE_CLASSES:
                conf = float(box.conf[0])
                # xyxy format: [x1, y1, x2, y2] in pixel coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append({
                    "bbox": [x1, y1, x2, y2],
                    "class": VEHICLE_CLASSES[cls_id],
                    "confidence": round(conf, 3),
                })

    logger.info(f"Detected {len(detections)} vehicles in image ({img_w}x{img_h})")

    # Log all detections for debugging
    for d in detections:
        logger.info(f"  → {d['class']} ({d['confidence']:.0%}) at bbox {[round(c) for c in d['bbox']]}")

    # Also log non-vehicle detections at debug level for troubleshooting
    if results and len(results) > 0:
        all_classes = {}
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            cls_name = results[0].names.get(cls_id, f"class_{cls_id}")
            all_classes[cls_name] = all_classes.get(cls_name, 0) + 1
        if all_classes:
            logger.info(f"  All detections by class: {all_classes}")

    # Check each region for occupancy
    slot_results = []
    for region in regions:
        slot_name = region["slot_name"]
        # Convert normalized polygon coordinates (0-1) to pixel coordinates
        polygon_norm = region["polygon"]
        polygon_px = [[pt[0] * img_w, pt[1] * img_h] for pt in polygon_norm]

        # Check which detections overlap this polygon
        overlapping = []
        for det in detections:
            if bbox_polygon_overlap(det["bbox"], polygon_px):
                overlapping.append(det)

        is_occupied = len(overlapping) > 0
        best_conf = max((d["confidence"] for d in overlapping), default=0.0)

        slot_results.append({
            "slot_name": slot_name,
            "status": "occupied" if is_occupied else "vacant",
            "confidence": round(best_conf, 3),
            "vehicles_detected": len(overlapping),
        })

    return {
        "slots": slot_results,
        "total_detections": len(detections),
        "image_size": {"width": img_w, "height": img_h},
        "all_detections": [
            {
                "bbox": [round(c, 1) for c in d["bbox"]],
                "class": d["class"],
                "confidence": d["confidence"],
            }
            for d in detections
        ],
    }
