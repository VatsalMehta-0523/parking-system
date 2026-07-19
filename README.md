# ParkSmart - AI-Powered Parking Management System

ParkSmart is a full-stack platform that helps parking providers manage locations, bookings, and analytics while offering an AI surveillance dashboard to monitor slot occupancy in real-time.

## Project Structure

The repository is structured into two main components:

- **`frontend/`**: A React + Vite application that serves as the Provider Console. It includes real-time dashboards, interactive parking lot surveillance mapping, and analytics.
- **`backend/`**: A FastAPI + PostgreSQL backend that handles user authentication, bookings, pricing policies, and AI video/image processing via YOLOv8.

## Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (14+)

---

## 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # Mac/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the `backend/` directory with your PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/parksmart
   SECRET_KEY=your_super_secret_jwt_key
   ```

5. **Initialize Database & Seed Data:**
   Run the seed script to populate the database with realistic demo data (Providers, Locations, Slots, Bookings):
   ```bash
   python seed_data.py
   ```

6. **AI Surveillance Model (YOLOv8x/YOLO11x):**
   The backend automatically downloads the required AI model the first time you run a surveillance detection. You do NOT need to download it manually.
   If you wish to download it in advance, run:
   ```bash
   python -c "from ultralytics import YOLO; YOLO('yolo11x.pt')"
   ```
   The model `yolo11x.pt` will be saved in the backend directory. Large `.pt` files are correctly ignored by `.gitignore`.

7. **Start the API Server:**
   ```bash
   uvicorn app.main:app --reload
   ```

---

## 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The Provider Console will be available at `http://localhost:3000`. 
   *Note: Use the demo credentials provided by the `seed_data.py` script to log in.*
