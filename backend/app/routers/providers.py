from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Provider, Location, Slot, Booking, BookingStatus
from ..schemas import (
    ProviderCreate, ProviderLogin, ProviderResponse, TokenResponse,
    SlotCreate, SlotUpdate, SlotResponse
)
from ..core.security import verify_password, get_password_hash, create_access_token, decode_token

router = APIRouter(prefix="/api/providers", tags=["providers"])
security = HTTPBearer()


def get_current_provider(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Provider:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    provider_id = payload.get("sub")
    provider = db.query(Provider).filter(Provider.provider_id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=401, detail="Provider not found")
    return provider


@router.post("/register", response_model=TokenResponse, status_code=201)
def register_provider(data: ProviderCreate, db: Session = Depends(get_db)):
    existing = db.query(Provider).filter(Provider.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    provider = Provider(
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        phone=data.phone,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    token = create_access_token({"sub": provider.provider_id})
    return TokenResponse(access_token=token, provider=ProviderResponse.model_validate(provider))


@router.post("/login", response_model=TokenResponse)
def login_provider(data: ProviderLogin, db: Session = Depends(get_db)):
    provider = db.query(Provider).filter(Provider.email == data.email).first()
    if not provider or not verify_password(data.password, provider.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": provider.provider_id})
    return TokenResponse(access_token=token, provider=ProviderResponse.model_validate(provider))


@router.get("/me", response_model=ProviderResponse)
def get_profile(current: Provider = Depends(get_current_provider)):
    return current


# ─── Slot Management ──────────────────────────────────────────────────────────

@router.post("/locations/{location_id}/slots", response_model=SlotResponse, status_code=201)
def add_slot(
    location_id: str,
    data: SlotCreate,
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    location = db.query(Location).filter(
        Location.location_id == location_id,
        Location.provider_id == current.provider_id,
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    slot = Slot(
        location_id=location_id,
        slot_name=data.slot_name,
        slot_type=data.slot_type,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return _slot_with_occupancy(slot, db)


@router.patch("/slots/{slot_id}", response_model=SlotResponse)
def update_slot(
    slot_id: str,
    data: SlotUpdate,
    db: Session = Depends(get_db),
    current: Provider = Depends(get_current_provider),
):
    slot = (
        db.query(Slot)
        .join(Location)
        .filter(Slot.slot_id == slot_id, Location.provider_id == current.provider_id)
        .first()
    )
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if data.is_active is not None:
        slot.is_active = data.is_active
    if data.slot_name is not None:
        slot.slot_name = data.slot_name
    db.commit()
    db.refresh(slot)
    return _slot_with_occupancy(slot, db)


def _slot_with_occupancy(slot: Slot, db: Session) -> SlotResponse:
    occupied = db.query(Booking).filter(
        Booking.slot_id == slot.slot_id,
        Booking.status.in_([BookingStatus.ACTIVE, BookingStatus.OVERSTAY, BookingStatus.RESERVED]),
    ).first()
    resp = SlotResponse.model_validate(slot)
    resp.is_occupied = occupied is not None
    return resp
