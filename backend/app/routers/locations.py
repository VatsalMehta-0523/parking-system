import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Location, Slot, Booking, BookingStatus, PricingPolicy, Provider
from ..schemas import (
    LocationCreate, LocationUpdate, LocationResponse, LocationSearchResult,
    SlotResponse
)
from ..services.availability import get_available_capacity
from ..routers.providers import get_current_provider
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/locations", tags=["locations"])


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _build_location_response(loc: Location, db: Session, lat: float = None, lon: float = None) -> dict:
    total_slots = db.query(func.count(Slot.slot_id)).filter(
        Slot.location_id == loc.location_id, Slot.is_active == True
    ).scalar() or 0

    now = datetime.utcnow()
    available = get_available_capacity(
        loc.location_id, now, now + timedelta(hours=1), db
    )

    pricing = (
        db.query(PricingPolicy)
        .filter(PricingPolicy.location_id == loc.location_id)
        .order_by(PricingPolicy.created_at.desc())
        .first()
    )

    result = {
        "location_id": loc.location_id,
        "name": loc.name,
        "area": loc.area,
        "city": loc.city,
        "latitude": float(loc.latitude),
        "longitude": float(loc.longitude),
        "hourly_rate": pricing.hourly_rate if pricing else 0,
        "reservation_fee": pricing.reservation_fee if pricing else 0,
        "available_slots": available,
        "total_slots": total_slots,
    }

    if lat is not None and lon is not None:
        result["distance_km"] = round(
            _haversine_km(lat, lon, float(loc.latitude), float(loc.longitude)), 2
        )

    return result


# ─── Public Endpoints ─────────────────────────────────────────────────────────

@router.get("/search", response_model=list[LocationSearchResult])
def search_locations(
    city: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    radius_km: float = Query(default=10.0),
    db: Session = Depends(get_db),
):
    query = db.query(Location).filter(Location.is_active == True)
    if city:
        query = query.filter(Location.city.ilike(f"%{city}%"))
    if area:
        query = query.filter(Location.area.ilike(f"%{area}%"))

    locations = query.all()

    results = []
    for loc in locations:
        if lat is not None and lon is not None:
            dist = _haversine_km(lat, lon, float(loc.latitude), float(loc.longitude))
            if dist > radius_km:
                continue
        results.append(_build_location_response(loc, db, lat, lon))

    # Sort by distance if coordinates provided, else by name
    if lat is not None and lon is not None:
        results.sort(key=lambda x: x.get("distance_km", 9999))

    return results


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(location_id: str, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.location_id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    total_slots = db.query(func.count(Slot.slot_id)).filter(
        Slot.location_id == loc.location_id, Slot.is_active == True
    ).scalar() or 0

    now = datetime.utcnow()
    available = get_available_capacity(
        loc.location_id, now, now + timedelta(hours=1), db
    )

    resp = LocationResponse.model_validate(loc)
    resp.total_slots = total_slots
    resp.active_slots = total_slots
    resp.available_slots = available
    return resp


@router.get("/{location_id}/slots", response_model=list[SlotResponse])
def get_location_slots(location_id: str, db: Session = Depends(get_db)):
    from ..routers.providers import _slot_with_occupancy
    slots = db.query(Slot).filter(Slot.location_id == location_id).all()
    return [_slot_with_occupancy(s, db) for s in slots]


# ─── Provider-Protected Endpoints ────────────────────────────────────────────

@router.post("/", response_model=LocationResponse, status_code=201)
def create_location(
    data: LocationCreate,
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    loc = Location(
        provider_id=current.provider_id,
        name=data.name,
        area=data.area,
        city=data.city,
        latitude=data.latitude,
        longitude=data.longitude,
        map_link=data.map_link,
    )
    db.add(loc)
    db.flush()

    pricing = PricingPolicy(
        location_id=loc.location_id,
        hourly_rate=data.hourly_rate,
        reservation_fee=data.reservation_fee,
    )
    db.add(pricing)
    db.commit()
    db.refresh(loc)

    resp = LocationResponse.model_validate(loc)
    resp.total_slots = 0
    resp.active_slots = 0
    resp.available_slots = 0
    return resp


@router.patch("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: str,
    data: LocationUpdate,
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    loc = db.query(Location).filter(
        Location.location_id == location_id,
        Location.provider_id == current.provider_id,
    ).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    if data.name is not None:
        loc.name = data.name
    if data.area is not None:
        loc.area = data.area
    if data.is_active is not None:
        loc.is_active = data.is_active

    if data.hourly_rate is not None or data.reservation_fee is not None:
        pricing = (
            db.query(PricingPolicy)
            .filter(PricingPolicy.location_id == location_id)
            .order_by(PricingPolicy.created_at.desc())
            .first()
        )
        if pricing:
            if data.hourly_rate is not None:
                pricing.hourly_rate = data.hourly_rate
            if data.reservation_fee is not None:
                pricing.reservation_fee = data.reservation_fee

    db.commit()
    db.refresh(loc)

    total_slots = db.query(func.count(Slot.slot_id)).filter(
        Slot.location_id == loc.location_id, Slot.is_active == True
    ).scalar() or 0
    now = datetime.utcnow()
    available = get_available_capacity(loc.location_id, now, now + timedelta(hours=1), db)
    resp = LocationResponse.model_validate(loc)
    resp.total_slots = total_slots
    resp.active_slots = total_slots
    resp.available_slots = available
    return resp


@router.get("/provider/my-locations", response_model=list[LocationResponse])
def get_my_locations(
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    locations = db.query(Location).filter(
        Location.provider_id == current.provider_id
    ).all()

    result = []
    now = datetime.utcnow()
    for loc in locations:
        total_slots = db.query(func.count(Slot.slot_id)).filter(
            Slot.location_id == loc.location_id
        ).scalar() or 0
        active_slots = db.query(func.count(Slot.slot_id)).filter(
            Slot.location_id == loc.location_id, Slot.is_active == True
        ).scalar() or 0
        available = get_available_capacity(loc.location_id, now, now + timedelta(hours=1), db)
        resp = LocationResponse.model_validate(loc)
        resp.total_slots = total_slots
        resp.active_slots = active_slots
        resp.available_slots = available
        result.append(resp)

    return result
