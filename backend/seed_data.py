"""
ParkSmart — Pitch Demo Seed Data Script
Generates a highly realistic, presentation-ready dataset for Vatsal Mehta.
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import bcrypt
import random
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def uid():
    return str(uuid4())

def hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# Fixed IDs so script is idempotent for the provider and locations
P1 = "550e8400-e29b-41d4-a716-446655440000"

# Fixed location IDs
L1 = "660e8400-e29b-41d4-a716-446655440001"
L2 = "660e8400-e29b-41d4-a716-446655440002"
L3 = "660e8400-e29b-41d4-a716-446655440003"
L4 = "660e8400-e29b-41d4-a716-446655440004"
L5 = "660e8400-e29b-41d4-a716-446655440005"

# Pricing policies
PR1 = "770e8400-e29b-41d4-a716-446655440001"
PR2 = "770e8400-e29b-41d4-a716-446655440002"
PR3 = "770e8400-e29b-41d4-a716-446655440003"
PR4 = "770e8400-e29b-41d4-a716-446655440004"
PR5 = "770e8400-e29b-41d4-a716-446655440005"

# Fixed Users
U1 = "880e8400-e29b-41d4-a716-446655440001"
U2 = "880e8400-e29b-41d4-a716-446655440002"
U3 = "880e8400-e29b-41d4-a716-446655440003"
U4 = "880e8400-e29b-41d4-a716-446655440004"
U5 = "880e8400-e29b-41d4-a716-446655440005"
U6 = "880e8400-e29b-41d4-a716-446655440006"

def seed():
    now = datetime.utcnow()

    with engine.begin() as conn:
        # Don't truncate to preserve old data
        
        # ── 1. Provider ─────────────────────────────────────────────────
        conn.execute(text("""
            INSERT INTO providers (provider_id, name, email, password_hash, phone, is_verified)
            VALUES
              (:p1, 'Vatsal Mehta',  'vatsal@parksmart.in',  :pw, '9876543210', TRUE)
            ON CONFLICT (provider_id) DO NOTHING
        """), {"p1": P1, "pw": hash_pw("Test@1234")})

        # ── 2. Users ─────────────────────────────────────────────────────
        conn.execute(text("""
            INSERT INTO users (user_id, name, phone, email, vehicle_number, is_verified)
            VALUES
              (:u1, 'Demo User 1', '9000000001', 'demo1@parksmart.in', 'GJ-11-AA-0001', TRUE),
              (:u2, 'Demo User 2', '9000000002', 'demo2@parksmart.in', 'GJ-11-AA-0002', TRUE),
              (:u3, 'Demo User 3', '9000000003', 'demo3@parksmart.in', 'GJ-11-AA-0003', TRUE),
              (:u4, 'Demo User 4', '9000000004', 'demo4@parksmart.in', 'GJ-11-AA-0004', TRUE),
              (:u5, 'Demo User 5', '9000000005', 'demo5@parksmart.in', 'GJ-11-AA-0005', TRUE),
              (:u6, 'Demo User 6', '9000000006', 'demo6@parksmart.in', 'GJ-11-AA-0006', TRUE)
            ON CONFLICT (user_id) DO NOTHING
        """), {"u1": U1, "u2": U2, "u3": U3, "u4": U4, "u5": U5, "u6": U6})

        # ── 3. Locations (Vatsal's Ahmedabad Empire) ─────────────────────────────────────────────────
        conn.execute(text("""
            INSERT INTO locations (location_id, provider_id, name, area, city, latitude, longitude, map_link, is_active)
            VALUES
              (:l1, :p1, 'SG Highway Tower Parking',     'SG Highway',      'Ahmedabad', 23.046700, 72.511800, 'https://maps.google.com/?q=23.0467,72.5118', TRUE),
              (:l2, :p1, 'Sindhu Bhavan Premium Lot',    'Sindhu Bhavan',   'Ahmedabad', 23.040000, 72.502000, 'https://maps.google.com/?q=23.0400,72.5020', TRUE),
              (:l3, :p1, 'Prahlad Nagar Corporate Park', 'Prahlad Nagar',   'Ahmedabad', 23.012500, 72.508500, 'https://maps.google.com/?q=23.0125,72.5085', TRUE),
              (:l4, :p1, 'Vastrapur Lake Surface',       'Vastrapur',       'Ahmedabad', 23.036000, 72.529000, 'https://maps.google.com/?q=23.0360,72.5290', TRUE),
              (:l5, :p1, 'Navrangpura Hub',              'Navrangpura',     'Ahmedabad', 23.030600, 72.561500, 'https://maps.google.com/?q=23.0306,72.5615', TRUE)
            ON CONFLICT (location_id) DO NOTHING
        """), {"l1": L1, "l2": L2, "l3": L3, "l4": L4, "l5": L5, "p1": P1})

        # ── 4. Pricing Policies ──────────────────────────────────────────
        conn.execute(text("""
            INSERT INTO pricing_policies (policy_id, location_id, hourly_rate, reservation_fee)
            VALUES
              (:pr1, :l1, 6000, 1000),  -- ₹60/hr
              (:pr2, :l2, 8000, 1500),  -- ₹80/hr
              (:pr3, :l3, 5000, 1000),  -- ₹50/hr
              (:pr4, :l4, 4000,  500),  -- ₹40/hr
              (:pr5, :l5, 5500,  800)   -- ₹55/hr
            ON CONFLICT (policy_id) DO NOTHING
        """), {"pr1": PR1, "pr2": PR2, "pr3": PR3, "pr4": PR4, "pr5": PR5,
               "l1": L1, "l2": L2, "l3": L3, "l4": L4, "l5": L5})

        # ── 5. Slots ────────────────────────────────────────────────────
        location_slots = {
            L1: {"count": 30, "prefix": "SGH-"},
            L2: {"count": 25, "prefix": "SBR-"},
            L3: {"count": 40, "prefix": "PNC-"},
            L4: {"count": 20, "prefix": "VLP-"},
            L5: {"count": 15, "prefix": "NVH-"}
        }
        
        all_slots = []
        for loc_id, data in location_slots.items():
            for i in range(data["count"]):
                slot_id = f"{loc_id[:-5]}{i:05d}" # deterministic slot id
                slot_type = "EV" if i < 3 else ("BIKE" if i > data["count"] - 6 else "CAR")
                all_slots.append({
                    "sid": slot_id,
                    "lid": loc_id,
                    "sname": f'{data["prefix"]}{i+1}',
                    "stype": slot_type
                })
                
        for s in all_slots:
            conn.execute(text("""
                INSERT INTO slots (slot_id, location_id, slot_name, slot_type, is_active)
                VALUES (:sid, :lid, :sname, :stype, TRUE)
                ON CONFLICT (slot_id) DO NOTHING
            """), s)

        # ── 6. Realistic Analytics Bookings (Past 30 Days) ───────────────
        users = [U1, U2, U3, U4, U5, U6]
        booking_types = ["INSTANT", "ADVANCE"]
        status_weights = ["COMPLETED"] * 18 + ["ACTIVE"] + ["CANCELLED"]
        rates = {L1: 60, L2: 80, L3: 50, L4: 40, L5: 55}
        
        for _ in range(220):
            loc_id = random.choice([L1, L2, L3, L4, L5])
            valid_slots = [s["sid"] for s in all_slots if s["lid"] == loc_id]
            
            status = random.choice(status_weights)
            
            days_ago = random.randint(0, 30)
            if random.random() > 0.3:
                hours_ago = random.randint(10, 20)
            else:
                hours_ago = random.randint(0, 23)
                
            scheduled_start = now - timedelta(days=days_ago, hours=hours_ago, minutes=random.randint(0, 59))
            duration_hours = random.uniform(0.5, 4.5)
            scheduled_end = scheduled_start + timedelta(hours=duration_hours)
            
            actual_start = scheduled_start + timedelta(minutes=random.randint(-5, 10)) if status != "CANCELLED" else None
            actual_end = actual_start + timedelta(hours=duration_hours * random.uniform(0.8, 1.2)) if status == "COMPLETED" else None
            
            if status == "ACTIVE":
                scheduled_start = now - timedelta(hours=random.uniform(0.1, 3.0))
                actual_start = scheduled_start
                scheduled_end = scheduled_start + timedelta(hours=random.uniform(1.0, 5.0))
                actual_end = None
                days_ago = 0
                
            if status == "COMPLETED" and actual_start and actual_end:
                duration_in_hours = (actual_end - actual_start).total_seconds() / 3600
                price_paise = int((duration_in_hours * rates[loc_id]) * 100)
            else:
                price_paise = None

            # FIXED: Postgres payment_status_enum only accepts 'PENDING' or 'PAID_OFFLINE'
            payment_status = "PAID_OFFLINE" if status == "COMPLETED" else "PENDING"
                
            conn.execute(text("""
                INSERT INTO bookings
                  (booking_id, user_id, location_id, slot_id, booking_type, status,
                   scheduled_start, scheduled_end, actual_start, actual_end,
                   total_price, payment_status)
                VALUES
                  (:bid, :uid, :lid, :sid, CAST(:btype AS booking_type_enum), CAST(:status AS booking_status_enum),
                   :ss, :se, :astart, :aend,
                   :price, CAST(:pay AS payment_status_enum))
                ON CONFLICT (booking_id) DO NOTHING
            """), {
                "bid": uid(),
                "uid": random.choice(users),
                "lid": loc_id,
                "sid": random.choice(valid_slots) if status != "CANCELLED" else None,
                "btype": random.choice(booking_types),
                "status": status,
                "ss": scheduled_start,
                "se": scheduled_end,
                "astart": actual_start,
                "aend": actual_end,
                "price": price_paise,
                "pay": payment_status
            })

    print("✅ Seed data appended successfully! Original data preserved.")
    print("--------------------------------------------------")
    print("  Provider:   Vatsal Mehta")
    print("  Login:      vatsal@parksmart.in")
    print("  Password:   Test@1234")
    print("--------------------------------------------------")
    print("  Added Locations: 5 (Ahmedabad)")
    print("  Added Bookings:  220 randomized entries")
    print("--------------------------------------------------")

if __name__ == "__main__":
    seed()
