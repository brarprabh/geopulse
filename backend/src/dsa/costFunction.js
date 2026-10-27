/**
 * Calculates a weighted cost score for a candidate delivery agent.
 * Lower score means a better match.
 */
function calculateCostScore(agent, order) {
    // Weights for our multi-variable cost function
    const w1 = 0.4; // Distance weight
    const w2 = 0.3; // Active load weight (how many orders they already have)
    const w3 = 0.2; // SLA urgency weight
    const w4 = 0.1; // Acceptance probability weight

    // Normalized variables (assuming max distance is 5km, max load is 3 orders)
    const normDistance = Math.min(agent.distanceKm / 5.0, 1.0);
    const normLoad = Math.min((agent.activeOrders || 0) / 3.0, 1.0);
    const slaUrgency = order.slaUrgency || 0.5; // 0 to 1 scale
    const acceptanceProb = agent.acceptanceProb || 0.9; // 0 to 1 scale

    // Cost Score Equation
    const costScore =
        (w1 * normDistance) +
        (w2 * normLoad) +
        (w3 * slaUrgency) -
        (w4 * acceptanceProb);

    return Number(costScore.toFixed(4)); // Keep 4 decimal places cleanly
}

module.exports = { calculateCostScore };