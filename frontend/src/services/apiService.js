const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/**
 * Sends a POST request to trigger an order dispatch at a specific Dark Store.
 */
export async function triggerOrderDispatch(store) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/orders/dispatch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                storeId: store.id,
                storeName: store.name,
                lat: store.lat,
                lng: store.lng,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to dispatch order from server");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("❌ [API] Dispatch error:", error);
        return { success: false, reason: "NETWORK_ERROR" };
    }
}