from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models import Booking, BookingStatus, BookingType
from ..core.config import settings
from ..database import SessionLocal
import logging

logger = logging.getLogger(__name__)


def expire_stale_bookings():
    """
    Background job: expire INSTANT bookings whose TTL has elapsed
    and mark ACTIVE sessions as OVERSTAY if they exceeded scheduled_end.
    Called periodically by APScheduler.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        ttl_cutoff = now - timedelta(minutes=settings.INSTANT_BOOKING_TTL_MINUTES)

        # Expire INSTANT bookings past TTL
        expired_count = (
            db.query(Booking)
            .filter(
                Booking.status == BookingStatus.RESERVED,
                Booking.booking_type == BookingType.INSTANT,
                Booking.created_at <= ttl_cutoff,
            )
            .update({"status": BookingStatus.EXPIRED}, synchronize_session=False)
        )

        # Mark ACTIVE sessions as OVERSTAY if scheduled_end has passed
        overstay_count = (
            db.query(Booking)
            .filter(
                Booking.status == BookingStatus.ACTIVE,
                Booking.scheduled_end <= now,
                Booking.actual_end.is_(None),
            )
            .update({"status": BookingStatus.OVERSTAY}, synchronize_session=False)
        )

        db.commit()

        if expired_count > 0:
            logger.info(f"Expired {expired_count} stale INSTANT bookings")
        if overstay_count > 0:
            logger.info(f"Marked {overstay_count} bookings as OVERSTAY")

    except Exception as e:
        logger.error(f"Error in expiry job: {e}")
        db.rollback()
    finally:
        db.close()
