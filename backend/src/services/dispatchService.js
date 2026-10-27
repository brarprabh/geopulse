const { findNearbyAgents } = require("./geoService");
const { calculateCostScore } = require("../dsa/costFunction");
const { rankAgentsWithHeap } = require("../dsa/MinHeap");
const { acquireAgentLock, releaseAgentLock } = require("./lockService");

/**
 * Core Dispatch Engine Workflow
 */
async function dispatchOrder(order) {
    const startTime = Date.now();
    console.log(`\n📦 [Dispatch] Processing order ${order.orderId} for store ${order.storeId}...`);

    // 1. Query Redis RAM for nearby agents within 3km radius
    const rawNearby = await findNearbyAgents(order.pickupCoords.lng, order.pickupCoords.lat, 3);

    if (!rawNearby || rawNearby.length === 0) {
        console.log(`⚠️ [Dispatch] No agents found within 3km for order ${order.orderId}`);
        return { success: false, reason: "NO_AGENTS_NEARBY" };
    }

    // Format raw Redis geo results into candidate objects
    const candidates = rawNearby.map((item) => ({
        agentId: item.member,
        distanceKm: parseFloat(item.distance || 0),
        activeOrders: 0, // Default simulated load
        acceptanceProb: 0.95,
    }));

    // 2. Score each candidate using our Multi-Variable Cost Function
    const scoredCandidates = candidates.map((agent) => ({
        ...agent,
        costScore: calculateCostScore(agent, order),
    }));

    // 3. Rank candidates using our Custom Min-Heap
    const rankedCandidates = rankAgentsWithHeap(scoredCandidates);
    console.log(`📊 [Dispatch] Ranked ${rankedCandidates.length} candidates via Min-Heap.`);

    // 4. Try locking the best available agent (Atomic Concurrency Check)
    let assignedAgent = null;
    let topCandidatesAudit = [];

    for (const candidate of rankedCandidates) {
        // Keep top 3 for the frontend audit drawer later!
        if (topCandidatesAudit.length < 3) {
            topCandidatesAudit.push(candidate);
        }

        // Attempt Redis atomic lock (SET NX)
        const locked = await acquireAgentLock(candidate.agentId);
        if (locked) {
            assignedAgent = candidate;
            break; // Successfully locked the best agent!
        } else {
            console.log(`🔒 [Lock Conflict] Agent ${candidate.agentId} was just grabbed by another concurrent order. Trying next best...`);
        }
    }

    if (!assignedAgent) {
        return { success: false, reason: "ALL_TOP_AGENTS_LOCKED" };
    }

    const executionTimeMs = Date.now() - startTime;
    console.log(`✅ [Dispatch Success] Assigned Agent ${assignedAgent.agentId} to Order ${order.orderId} in ${executionTimeMs}ms!`);

    return {
        success: true,
        orderId: order.orderId,
        assignedAgentId: assignedAgent.agentId,
        dispatchAudit: {
            evaluatedCount: rankedCandidates.length,
            executionTimeMs,
            topCandidates: topCandidatesAudit,
        },
    };
}

module.exports = { dispatchOrder };