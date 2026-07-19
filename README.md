# ParkSmart — AI-Based Hybrid Parking Management System

A full-stack SaaS parking platform with real-time availability, Uber-style instant booking, and a provider dashboard.

---

## Tech Stack

| Layer      | Technology                             |
|------------|----------------------------------------|
| Frontend   | React 18 + Vite + Recharts + Leaflet   |
| Backend    | FastAPI (Python) + APScheduler         |
| Database   | PostgreSQL                             |
| Maps       | OpenStreetMap (Leaflet)                |
| Auth       | JWT (provider) / phone-based (customer)|

---

## Project Structure

```
parking-system/
├── backend/
│   ├── app/
│   │   ├── core/          # config, security (JWT)
│   │   ├── routers/       # users, providers, locations, bookings, analytics, surveillance
│   │   ├── services/      # availability engine, booking logic, surveillance_service (YOLO)
│   │   ├── models.py      # SQLAlchemy ORM
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── database.py    # DB engine + session
│   │   └── main.py        # FastAPI app entry
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/           # Centralized API layer (api.js)
│   │   ├── context/       # ThemeContext, AuthContext
│   │   ├── styles/        # global.css design system
│   │   ├── components/
│   │   │   ├── common/    # Header, Sidebar, layouts, badges, timer
│   │   │   └── map/       # ParkingMap (Leaflet + OSM)
│   │   └── pages/
│   │       ├── customer/  # FindParking, Book, Ticket, Session, History, Profile
│   │       └── provider/  # Login, Dashboard, Locations, Bookings, Analytics, Surveillance
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── schema.sql
```

---

## Quick Start

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE parking_db;"

# Run schema (tables + indexes)
psql -U postgres -d parking_db -f schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL and SECRET_KEY

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
Swagger docs: `http://localhost:8000/docs`

### 3. AI Model Setup (Surveillance Feature)

The AI Surveillance feature requires the YOLOv8x model. Since the API server is already running in your current terminal, open a **new terminal window**, activate your virtual environment, and download the model into the `backend/models/` folder:

```bash
cd backend
# Activate venv (Windows)
venv\Scripts\activate
# Activate venv (Mac/Linux)
# source venv/bin/activate

# Download the model (caches to your user folder)
python -c "from ultralytics import YOLO; YOLO('yolov8x.pt')"

# Move the downloaded model into the local models directory
move %USERPROFILE%\.cache\ultralytics\yolov8x.pt models\yolov8x.pt
```
*Note: The model is large (~150MB) and is ignored by git (via `backend/models/.gitignore`) to keep the repository clean.*

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:3000`

---

## Key Features

### Customer Flow
1. **Find Parking** — Search by city/area or use GPS. Interactive OSM map with color-coded markers.
2. **Instant Booking (Park Now)** — Reserve immediately. 30-min TTL countdown shown on digital ticket.
3. **Advance Booking (Reserve Later)** — Select future time window. Capacity validated before confirmation.
4. **Start Session** — Activates the booking. Slot confirmed, timer starts.
5. **End Session** — Calculates price based on actual duration. Offline payment summary shown.
6. **History** — Look up past bookings by phone number, resume active sessions.

### Provider Flow
1. **Login / Register** — JWT-authenticated provider account.
2. **Dashboard** — Real-time stats: revenue, occupancy, active sessions, booking distribution, recent activity.
3. **Locations** — Add/edit parking locations with pricing. Enable/disable, manage slots per location.
4. **Bookings** — Filter by status, mark completed bookings as paid.
5. **Analytics** — Revenue trend, hourly occupancy heatmap, location performance breakdown.

---

## Booking State Machine

```
RESERVED → ACTIVE → COMPLETED
RESERVED → CANCELLED (manual)
RESERVED → EXPIRED  (TTL elapsed — background job)
ACTIVE   → OVERSTAY (scheduled_end exceeded — background job)
OVERSTAY → COMPLETED (user ends session)
```

### TTL Expiry Job
- Runs every 2 minutes via APScheduler
- Expires INSTANT bookings past 30-minute TTL
- Marks ACTIVE sessions as OVERSTAY when `scheduled_end` is exceeded

---

## API Overview

```
POST /api/providers/login          — Provider login
POST /api/providers/register       — Provider registration
GET  /api/providers/me             — Provider profile

GET  /api/locations/search         — Search locations (city, area, lat/lon)
GET  /api/locations/{id}           — Location detail + availability
POST /api/locations/               — Create location (provider only)
PATCH /api/locations/{id}          — Update location/pricing (provider only)
GET  /api/locations/provider/my-locations — Provider's locations

POST /api/bookings/instant         — Create instant booking
POST /api/bookings/advance         — Create advance booking
GET  /api/bookings/{id}            — Get booking detail
POST /api/bookings/{id}/start      — Start session
POST /api/bookings/{id}/end        — End session
POST /api/bookings/{id}/cancel     — Cancel booking
GET  /api/bookings/                — List bookings (provider only)
POST /api/bookings/{id}/mark-paid  — Mark as paid (provider only)

GET  /api/users/by-phone/{phone}   — Look up user
GET  /api/users/history/by-phone/{phone} — Booking history

GET  /api/analytics/dashboard      — Dashboard stats
GET  /api/analytics/revenue        — Revenue trend
GET  /api/analytics/occupancy-by-hour — Hourly occupancy
GET  /api/analytics/location-stats — Per-location breakdown
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                     | Default                     | Description              |
|------------------------------|-----------------------------|--------------------------|
| `DATABASE_URL`               | postgresql://...            | PostgreSQL connection    |
| `SECRET_KEY`                 | (required)                  | JWT signing key          |
| `ALGORITHM`                  | HS256                       | JWT algorithm            |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| 10080 (7 days)              | Token lifetime           |
| `INSTANT_BOOKING_TTL_MINUTES`| 30                          | Instant booking TTL      |
| `DEFAULT_SESSION_DURATION_HOURS` | 3                       | Default session window   |

---

## Design System

- **Fonts**: Syne (display/headings) + DM Sans (body)
- **Theme**: Full dark/light mode via CSS variables (`data-theme` attribute)
- **Colors**: Clean neutral base with blue accent, semantic success/warning/danger
- **Layout**: Fixed sidebar (240px) + scrollable main content
- **Animations**: Fade-in, slide-up on page transitions; shimmer skeleton loaders; smooth chart animations

---

## Notes

- All prices stored in **paise** (₹1 = 100 paise) for precision
- Availability computed **dynamically** on every request — never stored
- Slot assignment uses `SELECT FOR UPDATE SKIP LOCKED` to prevent race conditions
- No external auth service required — customers identified by phone number
