"""
Surveillance Router — API endpoints for AI-powered parking detection.

POST /api/surveillance/detect
  Accepts image + polygon regions, returns per-slot occupancy status.
"""

import json
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from ..routers.providers import get_current_provider
from ..models import Provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/surveillance", tags=["surveillance"])

# Maximum upload size: 10MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024


@router.post("/detect")
async def detect_occupancy(
    image: UploadFile = File(..., description="Parking area image"),
    regions: str = Form(..., description="JSON string: [{slot_name, polygon: [[x,y],...]}]"),
    current: Provider = Depends(get_current_provider),
):
    """
    Run YOLOv8 vehicle detection on an uploaded image and determine
    occupancy status for each defined polygon region.

    - **image**: Parking lot image (JPEG/PNG, max 10MB)
    - **regions**: JSON string containing list of slot regions.
      Each region has `slot_name` (str) and `polygon` (list of [x, y] normalized coordinates 0-1).

    Returns per-slot status (occupied/vacant) with confidence scores.
    """
    # Validate image type
    if image.content_type not in ("image/jpeg", "image/png", "image/jpg", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are accepted")

    # Read image bytes
    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file")

    # Parse regions JSON
    try:
        regions_data = json.loads(regions)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in 'regions' field")

    if not isinstance(regions_data, list) or len(regions_data) == 0:
        raise HTTPException(status_code=400, detail="At least one region is required")

    # Validate each region
    for i, region in enumerate(regions_data):
        if "slot_name" not in region or "polygon" not in region:
            raise HTTPException(
                status_code=400,
                detail=f"Region {i} must have 'slot_name' and 'polygon' fields",
            )
        if not isinstance(region["polygon"], list) or len(region["polygon"]) < 3:
            raise HTTPException(
                status_code=400,
                detail=f"Region '{region['slot_name']}' polygon must have at least 3 points",
            )

    # Run detection
    try:
        from ..services.surveillance_service import detect_occupancy as run_detection

        result = run_detection(image_bytes, regions_data)
        return result
    except Exception as e:
        logger.error(f"Detection failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
