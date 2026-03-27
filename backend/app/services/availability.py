from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from ..models import Slot, Booking, BookingStatus, BookingType


def get_available_capacity(
    location_id: str,
    start_time: datetime,
    end_time: datetime,
    db: Session,
    exclude_booking_id: str = None,
) -> int:
    """
    Dynamically compute available capacity for a location in a given time window.

    Available = total_active_slots
                - active_sessions
                - overstays
                - upcoming_advance_bookings overlapping the window
    """
    total_active_slots = (
        db.query(func.count(Slot.slot_id))
        .filter(Slot.location_id == location_id, Slot.is_active == True)
        .scalar()
        or 0
    )

    # Active sessions and overstays count against capacity at all times
    occupied_query = db.query(func.count(Booking.booking_id)).filter(
        Booking.location_id == location_id,
        Booking.status.in_([BookingStatus.ACTIVE, BookingStatus.OVERSTAY]),
    )
    if exclude_booking_id:
        occupied_query = occupied_query.filter(
            Booking.booking_id != exclude_booking_id
        )
    occupied = occupied_query.scalar() or 0

    # RESERVED bookings (both INSTANT and ADVANCE) that overlap the requested window
    reserved_query = db.query(func.count(Booking.booking_id)).filter(
        Booking.location_id == location_id,
        Booking.status == BookingStatus.RESERVED,
        Booking.scheduled_start < end_time,
        Booking.scheduled_end > start_time,
    )
    if exclude_booking_id:
        reserved_query = reserved_query.filter(
            Booking.booking_id != exclude_booking_id
        )
    reserved = reserved_query.scalar() or 0

    available = total_active_slots - occupied - reserved
    return max(0, available)


def get_occupied_slot_ids(location_id: str, db: Session) -> list:
    """Return slot_ids currently occupied (ACTIVE, OVERSTAY, or RESERVED)."""
    result = (
        db.query(Booking.slot_id)
        .filter(
            Booking.location_id == location_id,
            Booking.slot_id.isnot(None),
            Booking.status.in_(
                [BookingStatus.ACTIVE, BookingStatus.OVERSTAY, BookingStatus.RESERVED]
            ),
        )
        .all()
    )
    return [r[0] for r in result]
