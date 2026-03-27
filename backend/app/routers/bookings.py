from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Booking, BookingStatus, Provider
from ..schemas import (
    InstantBookingCreate, AdvanceBookingCreate,
    BookingResponse, PaymentMarkRequest
)
from ..services.booking_service import (
    create_instant_booking, create_advance_booking,
    start_session, end_session, cancel_booking, mark_payment
)
from ..routers.providers import get_current_provider

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _enrich_booking(booking: Booking, db: Session) -> BookingResponse:
    resp = BookingResponse.model_validate(booking)
    if booking.slot:
        resp.slot_name = booking.slot.slot_name
    if booking.location:
        resp.location_name = booking.location.name
        resp.location_area = booking.location.area
        if booking.location.pricing_policies:
            resp.hourly_rate = booking.location.pricing_policies[-1].hourly_rate
    if booking.user:
        resp.user_name = booking.user.name
        resp.user_phone = booking.user.phone
    return resp


@router.post("/instant", response_model=BookingResponse, status_code=201)
def instant_booking(data: InstantBookingCreate, db: Session = Depends(get_db)):
    booking = create_instant_booking(data, db)
    db.refresh(booking)
    # Reload with relationships
    booking = db.query(Booking).filter(Booking.booking_id == booking.booking_id).first()
    return _enrich_booking(booking, db)


@router.post("/advance", response_model=BookingResponse, status_code=201)
def advance_booking(data: AdvanceBookingCreate, db: Session = Depends(get_db)):
    booking = create_advance_booking(data, db)
    booking = db.query(Booking).filter(Booking.booking_id == booking.booking_id).first()
    return _enrich_booking(booking, db)


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _enrich_booking(booking, db)


@router.post("/{booking_id}/start", response_model=BookingResponse)
def start_booking_session(booking_id: str, db: Session = Depends(get_db)):
    booking = start_session(booking_id, db)
    booking = db.query(Booking).filter(Booking.booking_id == booking.booking_id).first()
    return _enrich_booking(booking, db)


@router.post("/{booking_id}/end", response_model=BookingResponse)
def end_booking_session(booking_id: str, db: Session = Depends(get_db)):
    booking = end_session(booking_id, db)
    booking = db.query(Booking).filter(Booking.booking_id == booking.booking_id).first()
    return _enrich_booking(booking, db)


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking_endpoint(booking_id: str, db: Session = Depends(get_db)):
    booking = cancel_booking(booking_id, db)
    booking = db.query(Booking).filter(Booking.booking_id == booking.booking_id).first()
    return _enrich_booking(booking, db)


# Provider-only endpoints
@router.get("/", response_model=list[BookingResponse])
def list_bookings(
    location_id: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    from ..models import Location
    provider_location_ids = [
        loc.location_id
        for loc in db.query(Location).filter(
            Location.provider_id == current.provider_id
        ).all()
    ]

    query = db.query(Booking).filter(
        Booking.location_id.in_(provider_location_ids)
    )
    if location_id:
        query = query.filter(Booking.location_id == location_id)
    if status:
        try:
            query = query.filter(Booking.status == BookingStatus(status))
        except ValueError:
            pass

    bookings = query.order_by(Booking.created_at.desc()).limit(100).all()
    return [_enrich_booking(b, db) for b in bookings]


@router.post("/{booking_id}/mark-paid", response_model=BookingResponse)
def mark_paid(
    booking_id: str,
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    booking = mark_payment(booking_id, db)
    booking = db.query(Booking).filter(Booking.booking_id == booking.booking_id).first()
    return _enrich_booking(booking, db)
