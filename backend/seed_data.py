"""
ParkSmart — Seed Data Script
Populates the database with realistic Indian parking data.
Run:  python seed_data.py   (from the backend/ directory, with venv active)
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import bcrypt
import uuid
from datetime import datetime
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def uid():
    return str(uuid.uuid4())

def hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# Static ID for provider so we don't recreate them if they exist
P1 = '36f1c524-a1cf-43dc-95f5-6089b85415af'

AHMEDABAD_LOTS = [
    {
        "name": "Alpha One Mall Parking",
        "area": "Vastrapur",
        "city": "Ahmedabad",
        "latitude": 23.0396,
        "longitude": 72.5307,
        "price_per_hour": 50.0,
        "total_slots": 200,
    },
    {
        "name": "Palladium Mall Parking",
        "area": "SG Highway",
        "city": "Ahmedabad",
        "latitude": 23.0489,
        "longitude": 72.5065,
        "price_per_hour": 80.0,
        "total_slots": 300,
    },
    {
        "name": "Riverfront Multi-level Parking",
        "area": "Sabarmati Riverfront",
        "city": "Ahmedabad",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "price_per_hour": 30.0,
        "total_slots": 500,
    },
    {
        "name": "CG Square Parking",
        "area": "CG Road",
        "city": "Ahmedabad",
        "latitude": 23.0284,
        "longitude": 72.5564,
        "price_per_hour": 40.0,
        "total_slots": 100,
    },
    {
        "name": "Prahlad Nagar Garden Parking",
        "area": "Prahlad Nagar",
        "city": "Ahmedabad",
        "latitude": 23.0120,
        "longitude": 72.5100,
        "price_per_hour": 25.0,
        "total_slots": 50,
    },
]

def seed():
    with engine.begin() as conn:
        print("Clearing old locations and related data...")
        conn.execute(text("TRUNCATE TABLE locations CASCADE;"))

        # Check if provider exists by email
        res = conn.execute(text("SELECT provider_id FROM providers WHERE email = 'rajesh@parksmart.in'"))
        row = res.fetchone()
        
        if not row:
            print("Creating provider...")
            conn.execute(text("""
                INSERT INTO providers (provider_id, name, email, password_hash, phone, is_verified, created_at)
                VALUES
                  (:p1, 'Rajesh Mehta', 'rajesh@parksmart.in', :pw, '9876543210', TRUE, NOW())
            """), {"p1": P1, "pw": hash_pw("Test@1234")})
            active_provider_id = P1
        else:
            print("Provider already exists.")
            active_provider_id = row[0]

        print("Inserting Ahmedabad parking locations & slots (this may take a moment)...")
        total_slots_inserted = 0

        for lot in AHMEDABAD_LOTS:
            location_id = uid()
            conn.execute(text("""
                INSERT INTO locations (location_id, provider_id, name, area, city, latitude, longitude, is_active, created_at)
                VALUES
                  (:lid, :pid, :name, :area, :city, :latitude, :longitude, TRUE, NOW())
            """), {
                "lid": location_id,
                "pid": active_provider_id,
                "name": lot["name"],
                "area": lot["area"],
                "city": lot["city"],
                "latitude": lot["latitude"],
                "longitude": lot["longitude"]
            })

            # Pricing Policy (price in paise)
            policy_id = uid()
            hourly_rate = int(lot["price_per_hour"] * 100)
            conn.execute(text("""
                INSERT INTO pricing_policies (policy_id, location_id, hourly_rate, reservation_fee, created_at)
                VALUES
                  (:pol_id, :lid, :hrate, 1000, NOW())
            """), {"pol_id": policy_id, "lid": location_id, "hrate": hourly_rate})

            # Slots
            slots_to_insert = []
            for i in range(lot["total_slots"]):
                slots_to_insert.append({
                    "sid": uid(),
                    "lid": location_id,
                    "sname": f"P{i+1}",
                    "stype": "CAR"
                })

            # Bulk insert slots 
            conn.execute(text("""
                INSERT INTO slots (slot_id, location_id, slot_name, slot_type, is_active, created_at)
                VALUES (:sid, :lid, :sname, :stype, TRUE, NOW())
            """), slots_to_insert)

            total_slots_inserted += lot["total_slots"]

    print("Seed data inserted successfully!")
    print(f"  Locations: {len(AHMEDABAD_LOTS)} (all linked to Rajesh Mehta)")
    print(f"  Total Slots: {total_slots_inserted}")


if __name__ == "__main__":
    seed()
