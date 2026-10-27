const express = require("express");
const router = express.Router();

const { findNearbyAgents } = require("../services/geoService");
const { dispatchOrder } = require("../services/dispatchService");

// 1. GET /api/orders/test-radar (Test 3km Redis Geo Search)
router.get("/test-radar", async (req, res) => {
    const nearbyRiders = await findNearbyAgents(77.6408, 12.9784, 3);
    res.json({
        store: "Indiranagar Hub",
        totalFound: nearbyRiders.length,
        riders: nearbyRiders,
    });
});

// 2. GET /api/orders/test-dispatch (Quick browser test for Store 1)
router.get("/test-dispatch", async (req, res) => {
    const dummyOrder = {
        orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        storeId: "STORE-1",
        pickupCoords: { lat: 12.9784, lng: 77.6408 },
        slaUrgency: 0.8,
    };
    const result = await dispatchOrder(dummyOrder);
    res.json(result);
});

// 3. POST /api/orders/dispatch (Production route triggered from React UI)
router.post("/dispatch", async (req, res) => {
    const { storeId, storeName, lat, lng } = req.body;

    const newOrder = {
        orderId: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        storeId: storeId || "STORE-1",
        storeName: storeName || "Indiranagar Hub",
        pickupCoords: {
            lat: lat || 12.9784,
            lng: lng || 77.6408,
        },
        slaUrgency: Number((0.5 + Math.random() * 0.45).toFixed(2)),
    };

    const result = await dispatchOrder(newOrder); // do all the calculations and stuff..

    res.json({
        ...result,
        orderDetails: newOrder,
    });
});

module.exports = router;