from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import Optional, List
from datetime import datetime
from .models import BookingType, BookingStatus, PaymentStatus


# ─── User Schemas ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    vehicle_number: Optional[str] = None


class UserResponse(BaseModel):
    user_id: str
    name: str
    phone: str
    email: Optional[str]
    vehicle_number: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    vehicle_number: Optional[str] = None


# ─── Provider Schemas ─────────────────────────────────────────────────────────

class ProviderCreate(BaseModel):
    name: str
    email: str
    password: str = Field(..., max_length=72)
    phone: Optional[str] = None


class ProviderLogin(BaseModel):
    email: str
    password: str = Field(..., max_length=72)


class ProviderResponse(BaseModel):
    provider_id: str
    name: str
    email: str
    phone: Optional[str]
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    provider: ProviderResponse


# ─── Location Schemas ─────────────────────────────────────────────────────────

class PricingPolicyCreate(BaseModel):
    hourly_rate: int       # in paise
    reservation_fee: int = 0


class PricingPolicyResponse(BaseModel):
    policy_id: str
    hourly_rate: int
    reservation_fee: int
    created_at: datetime

    class Config:
        from_attributes = True


class LocationCreate(BaseModel):
    name: str
    area: Optional[str] = None
    city: str
    latitude: float
    longitude: float
    map_link: Optional[str] = None
    hourly_rate: int       # in paise
    reservation_fee: int = 0


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[str] = None
    is_active: Optional[bool] = None
    hourly_rate: Optional[int] = None
    reservation_fee: Optional[int] = None


class LocationResponse(BaseModel):
    location_id: str
    provider_id: str
    name: str
    area: Optional[str]
    city: str
    latitude: float
    longitude: float
    map_link: Optional[str]
    is_active: bool
    created_at: datetime
    pricing_policies: List[PricingPolicyResponse] = []
    total_slots: int = 0
    active_slots: int = 0
    available_slots: int = 0

    class Config:
        from_attributes = True


class LocationSearchResult(BaseModel):
    location_id: str
    name: str
    area: Optional[str]
    city: str
    latitude: float
    longitude: float
    hourly_rate: int
    reservation_fee: int
    available_slots: int
    total_slots: int
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True


# ─── Slot Schemas ─────────────────────────────────────────────────────────────

class SlotCreate(BaseModel):
    slot_name: str
    slot_type: str = "CAR"


class SlotUpdate(BaseModel):
    is_active: Optional[bool] = None
    slot_name: Optional[str] = None


class SlotResponse(BaseModel):
    slot_id: str
    location_id: str
    slot_name: str
    slot_type: str
    is_active: bool
    is_occupied: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Booking Schemas ──────────────────────────────────────────────────────────

class InstantBookingCreate(BaseModel):
    location_id: str
    user_name: str
    phone: str
    email: Optional[str] = None
    vehicle_number: Optional[str] = None


class AdvanceBookingCreate(BaseModel):
    location_id: str
    scheduled_start: datetime
    scheduled_end: datetime
    user_name: str
    phone: str
    email: Optional[str] = None
    vehicle_number: Optional[str] = None


class BookingResponse(BaseModel):
    booking_id: str
    user_id: str
    location_id: str
    slot_id: Optional[str]
    booking_type: BookingType
    status: BookingStatus
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: Optional[datetime]
    actual_end: Optional[datetime]
    total_price: Optional[int]
    payment_status: PaymentStatus
    created_at: datetime
    slot_name: Optional[str] = None
    location_name: Optional[str] = None
    location_area: Optional[str] = None
    hourly_rate: Optional[int] = None
    user_name: Optional[str] = None
    user_phone: Optional[str] = None

    class Config:
        from_attributes = True


class StartSessionRequest(BaseModel):
    pass  # No extra data needed


class EndSessionRequest(BaseModel):
    pass


class PaymentMarkRequest(BaseModel):
    booking_id: str


# ─── Analytics Schemas ────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_locations: int
    active_locations: int
    total_slots: int
    active_slots: int
    current_occupancy: int
    total_bookings_today: int
    revenue_today: int        # in paise
    revenue_this_month: int   # in paise
    active_sessions: int
    booking_type_distribution: dict
    recent_bookings: List[BookingResponse] = []


class RevenueDataPoint(BaseModel):
    date: str
    revenue: int
    bookings: int


class OccupancyDataPoint(BaseModel):
    hour: int
    occupancy_rate: float
