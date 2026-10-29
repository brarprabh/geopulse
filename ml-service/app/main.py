import os
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import math

def calculate_haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth's radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# 1. Initialize FastAPI Application
app = FastAPI(
    title="GeoPulse AI Microservice",
    description="Context-Aware ETA Prediction & Telemetry Anomaly Detection",
    version="1.0.0",
)

# 2. CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Load Trained Model Artifact on Startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "eta_model.joblib")
model = None

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print(f"✅ [ML Service] Loaded ETA model successfully from: {MODEL_PATH}")
else:
    print(f"⚠️ [ML Service] Model file not found at: {MODEL_PATH}. Run train_model.py first!")

# 4. Define Request Validation Schema using Pydantic
class ETARequest(BaseModel):
    distance_km: float = Field(..., gt=0.0, description="Delivery route distance in kilometers")
    hour_of_day: int = Field(default=14, ge=0, le=23, description="Hour of the day (0-23)")
    traffic_multiplier: float = Field(default=1.0, ge=1.0, le=3.0, description="Traffic congestion factor (1.0 to 3.0)")
    active_orders: int = Field(default=0, ge=0, description="Number of orders already held by the rider")

class TelemetryPing(BaseModel):
    agent_id: str
    prev_coords: dict = Field(..., description="Previous coordinate: {'lat': float, 'lng': float}")
    curr_coords: dict = Field(..., description="Current coordinate: {'lat': float, 'lng': float}")
    time_delta_seconds: float = Field(..., gt=0.0, description="Seconds elapsed between pings")
    stationary_duration_seconds: float = Field(default=0.0, ge=0.0, description="Cumulative stationary time")
    is_assigned: bool = Field(default=False, description="Whether the rider has an active order")


# 5. Root & Health Check Routes
@app.get("/")
def read_root():
    return {"message": "GeoPulse AI Microservice is online! Visit /docs for Swagger UI."}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "GeoPulse-AI",
        "model_loaded": model is not None,
    }

# 6. Online Inference Route: POST /predict-eta
@app.post("/predict-eta")
def predict_eta(payload: ETARequest):
    if model is None:
        raise HTTPException(status_code=503, detail="ETA model artifact is not loaded on this server.")
    
    # Format input array matching our training columns: [distance, hour, traffic, active_orders]
    features = np.array([[
        payload.distance_km,
        payload.hour_of_day,
        payload.traffic_multiplier,
        payload.active_orders
    ]])
    
    # Run instant prediction
    prediction = model.predict(features)[0]
    predicted_eta_minutes = round(float(prediction), 1)

    return {
        "success": True,
        "predictedEtaMinutes": predicted_eta_minutes,
        "inputFeatures": {
            "distanceKm": payload.distance_km,
            "hourOfDay": payload.hour_of_day,
            "trafficMultiplier": payload.traffic_multiplier,
            "activeOrders": payload.active_orders
        }
    }

@app.post("/detect-anomaly")
def detect_anomaly(ping: TelemetryPing):
    prev_lat = ping.prev_coords.get("lat")
    prev_lng = ping.prev_coords.get("lng")
    curr_lat = ping.curr_coords.get("lat")
    curr_lng = ping.curr_coords.get("lng")

    # 1. Compute distance traversed
    distance_km = calculate_haversine_km(prev_lat, prev_lng, curr_lat, curr_lng)

    # 2. Compute implied speed in km/h: (distance / seconds) * 3600
    hours_elapsed = ping.time_delta_seconds / 3600.0
    speed_kmh = distance_km / hours_elapsed if hours_elapsed > 0 else 0.0

    # Rule 1: GPS Spoofing / Teleportation (> 120 km/h in city traffic)
    if speed_kmh > 120.0:
        return {
            "isAnomaly": True,
            "anomalyType": "GPS_SPOOFED",
            "agentId": ping.agent_id,
            "speedKmh": round(speed_kmh, 2),
            "distanceKm": round(distance_km, 3),
            "action": "FLAG_AND_REASSIGN",
            "reason": f"Agent moved {round(distance_km, 2)}km in {ping.time_delta_seconds}s ({round(speed_kmh, 1)} km/h)"
        }

    # Rule 2: Stalled Delivery (> 480 seconds / 8 mins stationary while carrying an active order)
    if ping.is_assigned and ping.stationary_duration_seconds > 480:
        return {
            "isAnomaly": True,
            "anomalyType": "STALLED_DELIVERY",
            "agentId": ping.agent_id,
            "stationarySeconds": ping.stationary_duration_seconds,
            "action": "TRIGGER_REROUTE_CHECK",
            "reason": f"Agent stationary for {round(ping.stationary_duration_seconds / 60, 1)} mins during active delivery"
        }

    # Clean telemetry ping
    return {
        "isAnomaly": False,
        "anomalyType": None,
        "agentId": ping.agent_id,
        "speedKmh": round(speed_kmh, 2),
        "distanceKm": round(distance_km, 3),
        "action": "NONE"
    }