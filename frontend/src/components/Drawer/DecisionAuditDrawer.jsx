import React from "react";

export default function DecisionAuditDrawer({ auditData, onClose }) {
  if (!auditData) return null;

  const { orderId, assignedAgentId, dispatchAudit } = auditData;

  return (
    <div className="absolute bottom-5 left-5 z-[1000] bg-white p-5 rounded-xl shadow-2xl font-sans w-96 border border-slate-200 backdrop-blur-md bg-white/95 animate-slideUp">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="m-0 text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>📊</span> Decision Audit Trail
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Summary Stats */}
      <div className="py-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 p-2 rounded border border-slate-100">
          <span className="text-slate-500 block">Order ID</span>
          <span className="font-mono font-bold text-slate-700">{orderId}</span>
        </div>
        <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
          <span className="text-emerald-600 block">Winner Agent</span>
          <span className="font-mono font-bold text-emerald-800">{assignedAgentId}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded border border-slate-100">
          <span className="text-slate-500 block">Candidates Scanned</span>
          <span className="font-bold text-slate-700">{dispatchAudit.evaluatedCount} Riders</span>
        </div>
        <div className="bg-slate-50 p-2 rounded border border-slate-100">
          <span className="text-slate-500 block">Engine Latency</span>
          <span className="font-mono font-bold text-blue-600">{dispatchAudit.executionTimeMs} ms</span>
        </div>

        {/* 🤖 NEW: Python ML Model ETA Output */}
        <div className="bg-purple-50 p-2 rounded border border-purple-100 col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🤖</span>
            <div>
              <span className="text-purple-600 font-semibold block text-[11px]">AI-Predicted Delivery ETA</span>
              <span className="text-[10px] text-purple-400">RandomForest Regressor (FastAPI)</span>
            </div>
          </div>
          <span className="font-mono font-extrabold text-sm text-purple-700">
            {auditData.predictedEtaMinutes ? `${auditData.predictedEtaMinutes} mins` : "Calculating..."}
          </span>
        </div>
      </div>


      {/* Min-Heap Top 3 Leaderboard */}
      <div className="mt-2">
        <h4 className="text-xs font-semibold text-slate-700 mb-2">
          🏆 Min-Heap Top Candidate Rankings:
        </h4>
        <div className="space-y-2">
          {dispatchAudit.topCandidates.map((candidate, index) => (
            <div
              key={candidate.agentId}
              className={`p-2 rounded-lg text-xs border flex items-center justify-between ${
                candidate.agentId === assignedAgentId
                  ? "bg-emerald-50/80 border-emerald-300 shadow-sm"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">#{index + 1}</span>
                <div>
                  <span className="font-mono font-bold text-slate-800">{candidate.agentId}</span>
                  <div className="text-[10px] text-slate-500">
                    Dist: {candidate.distanceKm}km | Load: {candidate.activeOrders}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">Cost Score</span>
                <span className="font-bold text-blue-600">{candidate.costScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}