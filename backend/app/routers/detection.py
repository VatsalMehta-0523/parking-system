from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
import json
from typing import List, Dict, Any
from starlette.concurrency import run_in_threadpool
from ..services.detection import run_vehicle_detection
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/detect-slots",
    tags=["Detection"]
)

@router.post("")
async def detect_slots(
    image: UploadFile = File(...),
    slots: str = Form(...) # JSON string
):
    """
    Run YOLOv8 object detection to find vehicles and determine slot occupancy.
    Expects multipart/form-data with 'image' file and 'slots' JSON string.
    """
    try:
        slots_data = json.loads(slots)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON for slots parameter")
        
    if not isinstance(slots_data, list):
        raise HTTPException(status_code=400, detail="Slots parameter must be a list of slot objects")

    try:
        image_bytes = await image.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    try:
        results = await run_in_threadpool(run_vehicle_detection, image_bytes, slots_data)
        return results
    except Exception as e:
        logger.error(f"Detection failed: {e}", exc_info=True)
        return {"error": "Detection failed, try again"}
