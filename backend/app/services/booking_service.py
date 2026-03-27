from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, not_
from fastapi import HTTPException, status

from ..models import (
    Booking, BookingStatus, BookingType, PaymentStatus,
    Slot, User, Location, PricingPolicy
)
from ..schemas import InstantBookingCreate, AdvanceBookingCreate
from ..core.config import settings
from .availability import get_available_capacity, get_occupied_slot_ids


def get_or_create_user(
    phone: str, name: str, email: str, vehicle_number: str, db: Session
) -> User:
    """Fetch existing user by phone or create a new one."""
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(
            name=name,
            phone=phone,
            email=email,
            vehicle_number=vehicle_number,
        )
        db.add(user)
        db.flush()
    else:
        # Update details if provided
        if name:
            user.name = name
        if email:
            user.email = email
        if vehicle_number:
            user.vehicle_number = vehicle_number
        db.flush()
    return user


def assign_slot_concurrency_safe(location_id: str, db: Session) -> Slot:
    """
    Pick an available slot using SELECT FOR UPDATE SKIP LOCKED to prevent
    race conditions under concurrent booking requests.
    """
    occupied_ids = get_occupied_slot_ids(location_id, db)

    query = (
        select(Slot)
        .where(
            and_(
                Slot.location_id == location_id,
                Slot.is_active == True,
                Slot.slot_id.not_in(occupied_ids) if occupied_ids else True,
            )
        )
        .with_for_update(skip_locked=True)
        .limit(1)
    )

    slot = db.execute(query).scalars().first()
    return slot


def create_instant_booking(data: InstantBookingCreate, db: Session) -> Booking:
    """
    Create an INSTANT booking with temporary slot binding and 30-min TTL.
    """
    now = datetime.utcnow()
    scheduled_start = now
    scheduled_end = now + timedelta(hours=settings.DEFAULT_SESSION_DURATION_HOURS)

    # Validate location exists and is active
    location = db.query(Location).filter(
        Location.location_id == data.location_id,
        Location.is_active == True,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found or inactive")

    # Check availability
    available = get_available_capacity(
        data.location_id, scheduled_start, scheduled_end, db
    )
    if available <= 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No slots available at this location",
        )

    # Assign slot (concurrency-safe)
    slot = assign_slot_concurrency_safe(data.location_id, db)
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No slots available — all slots are occupied",
        )

    # Get or create user
    user = get_or_create_user(
        data.phone, data.user_name, data.email, data.vehicle_number, db
    )

    # Create booking
    booking = Booking(
        user_id=user.user_id,
        location_id=data.location_id,
        slot_id=slot.slot_id,
        booking_type=BookingType.INSTANT,
        status=BookingStatus.RESERVED,
        scheduled_start=scheduled_start,
        scheduled_end=scheduled_end,
        payment_status=PaymentStatus.PENDING,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def create_advance_booking(data: AdvanceBookingCreate, db: Session) -> Booking:
    """
    Create an ADVANCE booking for a future time slot.
    """
    now = datetime.utcnow()
    if data.scheduled_start <= now:
        raise HTTPException(
            status_code=400, detail="Advance booking must be for a future time"
        )
    if data.scheduled_end <= data.scheduled_start:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    location = db.query(Location).filter(
        Location.location_id == data.location_id,
        Location.is_active == True,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found or inactive")

    available = get_available_capacity(
        data.location_id, data.scheduled_start, data.scheduled_end, db
    )
    if available <= 0:
        raise HTTPException(
            status_code=409, detail="No slots available for the selected time window"
        )

    slot = assign_slot_concurrency_safe(data.location_id, db)
    if not slot:
        raise HTTPException(
            status_code=409, detail="No slots available — please try another time"
        )

    user = get_or_create_user(
        data.phone, data.user_name, data.email, data.vehicle_number, db
    )

    booking = Booking(
        user_id=user.user_id,
        location_id=data.location_id,
        slot_id=slot.slot_id,
        booking_type=BookingType.ADVANCE,
        status=BookingStatus.RESERVED,
        scheduled_start=data.scheduled_start,
        scheduled_end=data.scheduled_end,
        payment_status=PaymentStatus.PENDING,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def start_session(booking_id: str, db: Session) -> Booking:
    """
    Transition booking from RESERVED → ACTIVE.
    Validates TTL for INSTANT bookings.
    """
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.RESERVED:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start session — booking status is {booking.status.value}",
        )

    # TTL check for INSTANT bookings
    if booking.booking_type == BookingType.INSTANT:
        ttl_expiry = booking.created_at + timedelta(
            minutes=settings.INSTANT_BOOKING_TTL_MINUTES
        )
        if datetime.utcnow() > ttl_expiry:
            booking.status = BookingStatus.EXPIRED
            db.commit()
            raise HTTPException(
                status_code=410,
                detail="Booking has expired — please create a new booking",
            )

    now = datetime.utcnow()
    booking.actual_start = now
    booking.status = BookingStatus.ACTIVE
    db.commit()
    db.refresh(booking)
    return booking


def end_session(booking_id: str, db: Session) -> Booking:
    """
    Transition booking from ACTIVE/OVERSTAY → COMPLETED.
    Calculates total_price based on actual duration.
    """
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status not in [BookingStatus.ACTIVE, BookingStatus.OVERSTAY]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot end session — booking status is {booking.status.value}",
        )

    now = datetime.utcnow()
    booking.actual_end = now

    # Calculate price
    start = booking.actual_start or booking.scheduled_start
    duration_hours = (now - start).total_seconds() / 3600

    pricing = (
        db.query(PricingPolicy)
        .filter(PricingPolicy.location_id == booking.location_id)
        .order_by(PricingPolicy.created_at.desc())
        .first()
    )

    if pricing:
        booking.total_price = int(duration_hours * pricing.hourly_rate)
    else:
        booking.total_price = 0

    booking.status = BookingStatus.COMPLETED
    booking.payment_status = PaymentStatus.PENDING
    db.commit()
    db.refresh(booking)
    return booking


def cancel_booking(booking_id: str, db: Session) -> Booking:
    """Cancel a RESERVED booking."""
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.RESERVED:
        raise HTTPException(
            status_code=400,
            detail="Only RESERVED bookings can be cancelled",
        )
    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    return booking


def mark_payment(booking_id: str, db: Session) -> Booking:
    """Mark a booking as paid offline."""
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.payment_status = PaymentStatus.PAID_OFFLINE
    db.commit()
    db.refresh(booking)
    return booking
