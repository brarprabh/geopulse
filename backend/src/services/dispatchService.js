const { findNearbyAgents } = require("./geoService");
const { calculateCostScore } = require("../dsa/costFunction");
const { rankAgentsWithHeap } = require("../dsa/MinHeap");
const { acquireAgentLock } = require("./lockService");
const { getRiderById, assignOrderToRider } = require("../simulator/fleetBotEngine"); // <-- NEW: Import helpers

async function dispatchOrder(order) {
    const startTime = Date.now();
    console.log(`\n📦 [Dispatch] Processing order ${order.orderId} for store ${order.storeId}...`);

    // 1. Query Redis RAM for nearby agents within 3km radius
    const rawNearby = await findNearbyAgents(order.pickupCoords.lng, order.pickupCoords.lat, 3);

    if (!rawNearby || rawNearby.length === 0) {
        return { success: false, reason: "NO_AGENTS_NEARBY" };
    }

    // 2. Format candidates using their REAL live activeOrders and acceptanceProb
    const candidates = rawNearby.map((item) => {
        const liveRider = getRiderById(item.member) || {}; // <-- NEW: Look up live rider stats
        return {
            agentId: item.member,
            distanceKm: parseFloat(item.distance || 0.5),
            activeOrders: liveRider.activeOrders || 0,       // <-- Uses real activeOrders!
            acceptanceProb: liveRider.acceptanceProb || 0.9, // <-- Uses real acceptanceProb!
        };
    });

    // 3. Score each candidate using our Cost Function
    const scoredCandidates = candidates.map((agent) => ({
        ...agent,
        costScore: calculateCostScore(agent, order),
    }));

    // 4. Rank candidates using our Custom Min-Heap
    const rankedCandidates = rankAgentsWithHeap(scoredCandidates);

    // 5. Try locking the best available agent
    let assignedAgent = null;
    let topCandidatesAudit = [];

    for (const candidate of rankedCandidates) {
        if (topCandidatesAudit.length < 3) {
            topCandidatesAudit.push(candidate);
        }

        const locked = await acquireAgentLock(candidate.agentId);
        if (locked) {
            assignedAgent = candidate;
            assignOrderToRider(candidate.agentId); // <-- NEW: Increase winner's activeOrders by +1!
            break;
        }
    }

    if (!assignedAgent) {
        return { success: false, reason: "ALL_TOP_AGENTS_LOCKED" };
    }

    const executionTimeMs = Date.now() - startTime;

    return {
        success: true,
        orderId: order.orderId,
        storeId: order.storeId,
        assignedAgentId: assignedAgent.agentId,
        dispatchAudit: {
            evaluatedCount: rankedCandidates.length,
            executionTimeMs,
            topCandidates: topCandidatesAudit,
        },
    };
}

module.exports = { dispatchOrder };