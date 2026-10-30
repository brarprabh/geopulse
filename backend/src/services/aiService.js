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

        const data = await response.json();
        return data.predictedEtaMinutes;
    } catch (error) {
        console.warn("⚠️ [AI Service] ML ETA prediction failed, using fallback heuristic:", error.message);
        const fallbackEta = 5.0 + distanceKm * 4.0 + activeOrders * 5.0;
        return Math.round(fallbackEta * 10) / 10;
    }
}

/**
 * Calls the Python FastAPI microservice to verify GPS telemetry validity
 */
async function checkTelemetryAnomaly({
    agentId,
    prevCoords,
    currCoords,
    timeDeltaSeconds = 2.0,
    stationaryDurationSeconds = 0.0,
    isAssigned = false,
}) {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/detect-anomaly`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                agent_id: agentId,
                prev_coords: { lat: prevCoords.lat, lng: prevCoords.lng },
                curr_coords: { lat: currCoords.lat, lng: currCoords.lng },
                time_delta_seconds: timeDeltaSeconds,
                stationary_duration_seconds: stationaryDurationSeconds,
                is_assigned: isAssigned,
            }),
        });

        if (!response.ok) {
            throw new Error(`AI anomaly detector responded with HTTP status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        // High-availability fallback: do not block telemetry stream if AI service blips
        return {
            isAnomaly: false,
            anomalyType: null,
            agentId,
            action: "NONE",
            error: error.message,
        };
    }
}

module.exports = { predictDeliveryETA, checkTelemetryAnomaly };