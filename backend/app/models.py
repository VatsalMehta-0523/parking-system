import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, BigInteger,
    DateTime, ForeignKey, Text, Numeric, Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class BookingType(str, enum.Enum):
    INSTANT = "INSTANT"
    ADVANCE = "ADVANCE"


class BookingStatus(str, enum.Enum):
    RESERVED = "RESERVED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    OVERSTAY = "OVERSTAY"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID_OFFLINE = "PAID_OFFLINE"


class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    vehicle_number = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="user")


class Provider(Base):
    __tablename__ = "providers"

    provider_id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    locations = relationship("Location", back_populates="provider")


class Location(Base):
    __tablename__ = "locations"

    location_id = Column(String, primary_key=True, default=gen_uuid)
    provider_id = Column(String, ForeignKey("providers.provider_id"), nullable=False)
    name = Column(String(255), nullable=False)
    area = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    map_link = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("Provider", back_populates="locations")
    slots = relationship("Slot", back_populates="location")
    pricing_policies = relationship("PricingPolicy", back_populates="location")
    bookings = relationship("Booking", back_populates="location")


class PricingPolicy(Base):
    __tablename__ = "pricing_policies"

    policy_id = Column(String, primary_key=True, default=gen_uuid)
    location_id = Column(String, ForeignKey("locations.location_id"), nullable=False)
    hourly_rate = Column(BigInteger, nullable=False)       # in paise
    reservation_fee = Column(BigInteger, nullable=False, default=0)  # in paise
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="pricing_policies")


class Slot(Base):
    __tablename__ = "slots"

    slot_id = Column(String, primary_key=True, default=gen_uuid)
    location_id = Column(String, ForeignKey("locations.location_id"), nullable=False)
    slot_name = Column(String(50), nullable=False)
    roi_coordinates = Column(JSONB, nullable=True)
    slot_type = Column(String(50), nullable=True, default="CAR")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")


class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    location_id = Column(String, ForeignKey("locations.location_id"), nullable=False)
    slot_id = Column(String, ForeignKey("slots.slot_id"), nullable=True)

    booking_type = Column(SAEnum(BookingType), nullable=False)
    status = Column(SAEnum(BookingStatus), nullable=False, default=BookingStatus.RESERVED)

    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)

    total_price = Column(BigInteger, nullable=True)          # in paise
    payment_status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookings")
    location = relationship("Location", back_populates="bookings")
    slot = relationship("Slot", back_populates="bookings")
