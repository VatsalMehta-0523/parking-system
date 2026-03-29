"""
ParkSmart — Seed Data Script
Populates the database with realistic Indian parking data.
Run:  python seed_data.py   (from the backend/ directory, with venv active)
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import bcrypt
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)


def uid():
    return str(uuid4())


def hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# ──────────────────────────────────────────────────────────────────────────────
#  Static IDs (so foreign keys link correctly)
# ──────────────────────────────────────────────────────────────────────────────

# Providers
P1 = uid()  # Rajesh Mehta
P2 = uid()  # Priya Sharma

# Users
U1 = uid()  # Aarav Patel
U2 = uid()  # Sneha Iyer
U3 = uid()  # Kunal Desai
U4 = uid()  # Meera Joshi

# Locations
L1 = uid()  # CG Road Parking Hub
L2 = uid()  # SG Highway Tower Parking
L3 = uid()  # Koregaon Park Lot
L4 = uid()  # Connaught Place Basement

# Pricing
PR1 = uid()
PR2 = uid()
PR3 = uid()
PR4 = uid()

# Slots — 5 per location = 20 total
SLOTS_L1 = [uid() for _ in range(5)]
SLOTS_L2 = [uid() for _ in range(5)]
SLOTS_L3 = [uid() for _ in range(5)]
SLOTS_L4 = [uid() for _ in range(5)]

# Bookings
B1 = uid()
B2 = uid()
B3 = uid()
B4 = uid()
B5 = uid()
B6 = uid()


def seed():
    now = datetime.utcnow()

    with engine.begin() as conn:
        # ── 1. Providers ─────────────────────────────────────────────────
        conn.execute(text("""
            INSERT INTO providers (provider_id, name, email, password_hash, phone, is_verified)
            VALUES
              (:p1, 'Rajesh Mehta',  'rajesh@parksmart.in',  :pw, '9876543210', TRUE),
              (:p2, 'Priya Sharma',  'priya@parksmart.in',   :pw, '9823456789', TRUE)
            ON CONFLICT DO NOTHING
        """), {"p1": P1, "p2": P2, "pw": hash_pw("Test@1234")})

        # ── 2. Users ─────────────────────────────────────────────────────
        conn.execute(text("""
            INSERT INTO users (user_id, name, phone, email, vehicle_number, is_verified)
            VALUES
              (:u1, 'Aarav Patel',   '9898012345', 'aarav.p@gmail.com',   'GJ-01-AB-1234', TRUE),
              (:u2, 'Sneha Iyer',    '9876501234', 'sneha.iyer@gmail.com','MH-12-CD-5678', TRUE),
              (:u3, 'Kunal Desai',   '9988776655', 'kunal.d@outlook.com', 'GJ-05-EF-9012', TRUE),
              (:u4, 'Meera Joshi',   '9112233445', 'meera.j@yahoo.com',   'DL-03-GH-3456', TRUE)
            ON CONFLICT DO NOTHING
        """), {"u1": U1, "u2": U2, "u3": U3, "u4": U4})

        # ── 3. Locations ─────────────────────────────────────────────────
        conn.execute(text("""
            INSERT INTO locations (location_id, provider_id, name, area, city, latitude, longitude, map_link, is_active)
            VALUES
              (:l1, :p1, 'CG Road Parking Hub',         'Navrangpura',     'Ahmedabad', 23.03060000, 72.56150000, 'https://maps.google.com/?q=23.0306,72.5615', TRUE),
              (:l2, :p1, 'SG Highway Tower Parking',     'Bodakdev',        'Ahmedabad', 23.04670000, 72.51180000, 'https://maps.google.com/?q=23.0467,72.5118', TRUE),
              (:l3, :p2, 'Koregaon Park Lot',            'Koregaon Park',   'Pune',      18.53650000, 73.89310000, 'https://maps.google.com/?q=18.5365,73.8931', TRUE),
              (:l4, :p2, 'Connaught Place Basement',     'Connaught Place', 'New Delhi', 28.63290000, 77.21950000, 'https://maps.google.com/?q=28.6329,77.2195', TRUE)
            ON CONFLICT DO NOTHING
        """), {"l1": L1, "l2": L2, "l3": L3, "l4": L4, "p1": P1, "p2": P2})

        # ── 4. Pricing Policies ──────────────────────────────────────────
        # Rates in paise  (₹40/hr = 4000 paise)
        conn.execute(text("""
            INSERT INTO pricing_policies (policy_id, location_id, hourly_rate, reservation_fee)
            VALUES
              (:pr1, :l1, 4000,  500),
              (:pr2, :l2, 6000, 1000),
              (:pr3, :l3, 5000,  500),
              (:pr4, :l4, 8000, 1500)
            ON CONFLICT DO NOTHING
        """), {"pr1": PR1, "pr2": PR2, "pr3": PR3, "pr4": PR4,
               "l1": L1, "l2": L2, "l3": L3, "l4": L4})

        # ── 5. Slots ────────────────────────────────────────────────────
        slot_rows = []
        for i, sid in enumerate(SLOTS_L1):
            slot_rows.append({"sid": sid, "lid": L1, "sname": f"A{i+1}", "stype": "CAR" if i < 4 else "BIKE"})
        for i, sid in enumerate(SLOTS_L2):
            slot_rows.append({"sid": sid, "lid": L2, "sname": f"B{i+1}", "stype": "CAR" if i < 3 else "EV"})
        for i, sid in enumerate(SLOTS_L3):
            slot_rows.append({"sid": sid, "lid": L3, "sname": f"C{i+1}", "stype": "CAR" if i < 4 else "BIKE"})
        for i, sid in enumerate(SLOTS_L4):
            slot_rows.append({"sid": sid, "lid": L4, "sname": f"D{i+1}", "stype": "CAR" if i < 3 else "EV"})

        for s in slot_rows:
            conn.execute(text("""
                INSERT INTO slots (slot_id, location_id, slot_name, slot_type, is_active)
                VALUES (:sid, :lid, :sname, :stype, TRUE)
                ON CONFLICT DO NOTHING
            """), s)

        # ── 6. Bookings ─────────────────────────────────────────────────
        bookings = [
            # Completed booking — Aarav at CG Road, 2 hrs ago
            {
                "bid": B1, "uid": U1, "lid": L1, "sid": SLOTS_L1[0],
                "btype": "INSTANT", "status": "COMPLETED",
                "ss": now - timedelta(hours=4), "se": now - timedelta(hours=2),
                "astart": now - timedelta(hours=4), "aend": now - timedelta(hours=2),
                "price": 8000, "pay": "PAID_OFFLINE",
            },
            # Active session — Sneha at SG Highway
            {
                "bid": B2, "uid": U2, "lid": L2, "sid": SLOTS_L2[1],
                "btype": "INSTANT", "status": "ACTIVE",
                "ss": now - timedelta(hours=1), "se": now + timedelta(hours=2),
                "astart": now - timedelta(hours=1), "aend": None,
                "price": None, "pay": "PENDING",
            },
            # Reserved (upcoming) — Kunal at Koregaon Park
            {
                "bid": B3, "uid": U3, "lid": L3, "sid": SLOTS_L3[2],
                "btype": "ADVANCE", "status": "RESERVED",
                "ss": now + timedelta(hours=3), "se": now + timedelta(hours=6),
                "astart": None, "aend": None,
                "price": None, "pay": "PENDING",
            },
            # Completed — Meera at CP Basement, yesterday
            {
                "bid": B4, "uid": U4, "lid": L4, "sid": SLOTS_L4[0],
                "btype": "ADVANCE", "status": "COMPLETED",
                "ss": now - timedelta(days=1, hours=5), "se": now - timedelta(days=1, hours=2),
                "astart": now - timedelta(days=1, hours=5), "aend": now - timedelta(days=1, hours=2),
                "price": 24000, "pay": "PAID_OFFLINE",
            },
            # Cancelled — Aarav cancelled a booking
            {
                "bid": B5, "uid": U1, "lid": L3, "sid": None,
                "btype": "ADVANCE", "status": "CANCELLED",
                "ss": now - timedelta(days=2), "se": now - timedelta(days=2) + timedelta(hours=2),
                "astart": None, "aend": None,
                "price": None, "pay": "PENDING",
            },
            # Active — Kunal at CG Road right now
            {
                "bid": B6, "uid": U3, "lid": L1, "sid": SLOTS_L1[3],
                "btype": "INSTANT", "status": "ACTIVE",
                "ss": now - timedelta(minutes=45), "se": now + timedelta(hours=2, minutes=15),
                "astart": now - timedelta(minutes=45), "aend": None,
                "price": None, "pay": "PENDING",
            },
        ]

        for b in bookings:
            conn.execute(text("""
                INSERT INTO bookings
                  (booking_id, user_id, location_id, slot_id, booking_type, status,
                   scheduled_start, scheduled_end, actual_start, actual_end,
                   total_price, payment_status)
                VALUES
                  (:bid, :uid, :lid, :sid, CAST(:btype AS booking_type_enum), CAST(:status AS booking_status_enum),
                   :ss, :se, :astart, :aend,
                   :price, CAST(:pay AS payment_status_enum))
                ON CONFLICT DO NOTHING
            """), b)

    print("✅ Seed data inserted successfully!")
    print()
    print("  Providers:  2  (login: rajesh@parksmart.in / Test@1234)")
    print("  Users:      4")
    print("  Locations:  4  (Ahmedabad ×2, Pune ×1, Delhi ×1)")
    print("  Slots:     20  (5 per location)")
    print("  Bookings:   6  (2 completed, 2 active, 1 reserved, 1 cancelled)")


if __name__ == "__main__":
    seed()
