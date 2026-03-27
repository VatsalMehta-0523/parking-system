from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ..database import get_db
from ..models import (
    Booking, BookingStatus, BookingType, PaymentStatus,
    Location, Slot, Provider
)
from ..schemas import DashboardStats, RevenueDataPoint, OccupancyDataPoint, BookingResponse
from ..routers.providers import get_current_provider
from ..routers.bookings import _enrich_booking
from ..services.availability import get_available_capacity

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def get_provider_location_ids(provider_id: str, db: Session) -> list:
    return [
        loc.location_id
        for loc in db.query(Location).filter(
            Location.provider_id == provider_id
        ).all()
    ]


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    loc_ids = get_provider_location_ids(current.provider_id, db)

    # Location stats
    all_locations = db.query(Location).filter(
        Location.provider_id == current.provider_id
    ).all()
    total_locations = len(all_locations)
    active_locations = sum(1 for l in all_locations if l.is_active)

    # Slot stats
    total_slots = (
        db.query(func.count(Slot.slot_id))
        .filter(Slot.location_id.in_(loc_ids))
        .scalar() or 0
    )
    active_slots = (
        db.query(func.count(Slot.slot_id))
        .filter(Slot.location_id.in_(loc_ids), Slot.is_active == True)
        .scalar() or 0
    )

    # Active sessions
    active_sessions = (
        db.query(func.count(Booking.booking_id))
        .filter(
            Booking.location_id.in_(loc_ids),
            Booking.status.in_([BookingStatus.ACTIVE, BookingStatus.OVERSTAY]),
        )
        .scalar() or 0
    )

    # Current occupancy
    current_occupancy = active_sessions

    # Today's stats
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    today_bookings = (
        db.query(func.count(Booking.booking_id))
        .filter(
            Booking.location_id.in_(loc_ids),
            Booking.created_at >= today_start,
            Booking.created_at < today_end,
        )
        .scalar() or 0
    )

    revenue_today = (
        db.query(func.coalesce(func.sum(Booking.total_price), 0))
        .filter(
            Booking.location_id.in_(loc_ids),
            Booking.status == BookingStatus.COMPLETED,
            Booking.actual_end >= today_start,
            Booking.actual_end < today_end,
        )
        .scalar() or 0
    )

    # This month
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    revenue_month = (
        db.query(func.coalesce(func.sum(Booking.total_price), 0))
        .filter(
            Booking.location_id.in_(loc_ids),
            Booking.status == BookingStatus.COMPLETED,
            Booking.actual_end >= month_start,
        )
        .scalar() or 0
    )

    # Booking type distribution
    instant_count = (
        db.query(func.count(Booking.booking_id))
        .filter(
            Booking.location_id.in_(loc_ids),
            Booking.booking_type == BookingType.INSTANT,
        )
        .scalar() or 0
    )
    advance_count = (
        db.query(func.count(Booking.booking_id))
        .filter(
            Booking.location_id.in_(loc_ids),
            Booking.booking_type == BookingType.ADVANCE,
        )
        .scalar() or 0
    )

    # Recent bookings
    recent = (
        db.query(Booking)
        .filter(Booking.location_id.in_(loc_ids))
        .order_by(Booking.created_at.desc())
        .limit(10)
        .all()
    )

    return DashboardStats(
        total_locations=total_locations,
        active_locations=active_locations,
        total_slots=total_slots,
        active_slots=active_slots,
        current_occupancy=current_occupancy,
        total_bookings_today=today_bookings,
        revenue_today=int(revenue_today),
        revenue_this_month=int(revenue_month),
        active_sessions=active_sessions,
        booking_type_distribution={
            "INSTANT": instant_count,
            "ADVANCE": advance_count,
        },
        recent_bookings=[_enrich_booking(b, db) for b in recent],
    )


@router.get("/revenue", response_model=list[RevenueDataPoint])
def get_revenue_trend(
    days: int = 30,
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    loc_ids = get_provider_location_ids(current.provider_id, db)
    result = []
    now = datetime.utcnow()

    for i in range(days - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)

        revenue = (
            db.query(func.coalesce(func.sum(Booking.total_price), 0))
            .filter(
                Booking.location_id.in_(loc_ids),
                Booking.status == BookingStatus.COMPLETED,
                Booking.actual_end >= day_start,
                Booking.actual_end < day_end,
            )
            .scalar() or 0
        )

        bookings_count = (
            db.query(func.count(Booking.booking_id))
            .filter(
                Booking.location_id.in_(loc_ids),
                Booking.created_at >= day_start,
                Booking.created_at < day_end,
            )
            .scalar() or 0
        )

        result.append(
            RevenueDataPoint(
                date=day_start.strftime("%b %d"),
                revenue=int(revenue),
                bookings=bookings_count,
            )
        )

    return result


@router.get("/occupancy-by-hour", response_model=list[OccupancyDataPoint])
def get_occupancy_by_hour(
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    loc_ids = get_provider_location_ids(current.provider_id, db)
    total_slots = (
        db.query(func.count(Slot.slot_id))
        .filter(Slot.location_id.in_(loc_ids), Slot.is_active == True)
        .scalar() or 1
    )

    result = []
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    for hour in range(24):
        count = (
            db.query(func.count(Booking.booking_id))
            .filter(
                Booking.location_id.in_(loc_ids),
                Booking.status.in_([BookingStatus.ACTIVE, BookingStatus.COMPLETED, BookingStatus.OVERSTAY]),
                func.extract("hour", Booking.actual_start) == hour,
                Booking.actual_start >= week_ago,
            )
            .scalar() or 0
        )
        rate = min(100.0, round((count / (total_slots * 7)) * 100, 1))
        result.append(OccupancyDataPoint(hour=hour, occupancy_rate=rate))

    return result


@router.get("/location-stats")
def get_location_stats(
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    from ..services.availability import get_available_capacity
    locations = db.query(Location).filter(
        Location.provider_id == current.provider_id
    ).all()

    now = datetime.utcnow()
    result = []
    for loc in locations:
        total_slots = (
            db.query(func.count(Slot.slot_id))
            .filter(Slot.location_id == loc.location_id, Slot.is_active == True)
            .scalar() or 0
        )
        available = get_available_capacity(
            loc.location_id, now, now + timedelta(hours=1), db
        )
        occupied = total_slots - available
        occupancy_rate = round((occupied / total_slots * 100) if total_slots > 0 else 0, 1)

        total_revenue = (
            db.query(func.coalesce(func.sum(Booking.total_price), 0))
            .filter(
                Booking.location_id == loc.location_id,
                Booking.status == BookingStatus.COMPLETED,
            )
            .scalar() or 0
        )

        result.append({
            "location_id": loc.location_id,
            "name": loc.name,
            "area": loc.area,
            "total_slots": total_slots,
            "available_slots": available,
            "occupied_slots": occupied,
            "occupancy_rate": occupancy_rate,
            "total_revenue": int(total_revenue),
            "is_active": loc.is_active,
        })

    return result
