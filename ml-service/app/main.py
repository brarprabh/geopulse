import os
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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