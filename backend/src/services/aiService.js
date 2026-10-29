const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * Calls the Python FastAPI microservice to get ML-predicted delivery ETA
 */
async function predictDeliveryETA({ distanceKm, activeOrders = 0, hourOfDay = null, trafficMultiplier = 1.0 }) {
    try {
        const currentHour = hourOfDay !== null ? hourOfDay : new Date().getHours();

        const response = await fetch(`${ML_SERVICE_URL}/predict-eta`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                distance_km: Math.max(distanceKm, 0.1),
                hour_of_day: currentHour,
                traffic_multiplier: trafficMultiplier,
                active_orders: activeOrders,
            }),
        });

        if (!response.ok) {
            throw new Error(`AI service responded with HTTP status ${response.status}`);
        }

        const data = await response.json(); // will get data from app 
        return data.predictedEtaMinutes;
    } catch (error) {
        // Resilient Fallback: If Python service is temporarily down, use simple linear heuristic
        console.warn("⚠️ [AI Service] ML ETA prediction failed, using fallback heuristic:", error.message);
        const fallbackEta = 5.0 + distanceKm * 4.0 + activeOrders * 5.0;
        return Math.round(fallbackEta * 10) / 10;
    }
}

module.exports = { predictDeliveryETA };