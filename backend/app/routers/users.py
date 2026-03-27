from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Booking, BookingStatus
from ..schemas import UserCreate, UserResponse, UserUpdate, BookingResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/by-phone/{phone}", response_model=UserResponse)
def get_user_by_phone(phone: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.name:
        user.name = data.name
    if data.email:
        user.email = data.email
    if data.vehicle_number:
        user.vehicle_number = data.vehicle_number
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}/bookings", response_model=list[BookingResponse])
def get_user_bookings(user_id: str, db: Session = Depends(get_db)):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    result = []
    for b in bookings:
        resp = BookingResponse.model_validate(b)
        if b.slot:
            resp.slot_name = b.slot.slot_name
        if b.location:
            resp.location_name = b.location.name
            resp.location_area = b.location.area
            if b.location.pricing_policies:
                resp.hourly_rate = b.location.pricing_policies[0].hourly_rate
        if b.user:
            resp.user_name = b.user.name
            resp.user_phone = b.user.phone
        result.append(resp)
    return result


@router.get("/history/by-phone/{phone}", response_model=list[BookingResponse])
def get_history_by_phone(phone: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        return []
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user.user_id)
        .order_by(Booking.created_at.desc())
        .limit(50)
        .all()
    )
    result = []
    for b in bookings:
        resp = BookingResponse.model_validate(b)
        if b.slot:
            resp.slot_name = b.slot.slot_name
        if b.location:
            resp.location_name = b.location.name
            resp.location_area = b.location.area
            if b.location.pricing_policies:
                resp.hourly_rate = b.location.pricing_policies[0].hourly_rate
        resp.user_name = user.name
        resp.user_phone = user.phone
        result.append(resp)
    return result
