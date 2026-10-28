from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. Initialize the FastAPI app instance
app = FastAPI(
    title="GeoPulse AI Microservice",
    description="ETA Prediction and Telemetry Anomaly Detection Engine",
    version="1.0.0",
)

# 2. Add CORS middleware so Node.js or React can talk to this service without restrictions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Simple health check route
@app.get("/health") #decorator
def health_check():
    return {
        "status": "healthy",
        "service": "GeoPulse-AI",
        "engine": "FastAPI + scikit-learn"
    }