import React, { useState } from "react";
import { triggerOrderDispatch } from "../../services/apiService";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function StressTestControls({ onOrderDispatched }) {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // 1. Normal Order Injection (Calls your existing apiService)
  const handleInjectOrder = async () => {
    setLoading(true);
    const targetStore = {
      id: "STORE-1",
      name: "Indiranagar Hub",
      lat: 12.9784,
      lng: 77.6408,
    };

    const result = await triggerOrderDispatch(targetStore);
    setLoading(false);
    setLastResult(result);

    if (result.success && onOrderDispatched) {
      onOrderDispatched(result);
    }
  };

  // 2. Dynamic Spoof Route (Uses dynamic BACKEND_URL for production)
  const handleTriggerSpoof = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/orders/chaos/spoof-gps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "AGT-101" }),
      });
    } catch (err) {
      console.error("Failed to trigger spoof:", err);
    }
  };

  return (
    <div className="absolute top-5 right-5 z-[1000] bg-white p-4 rounded-xl shadow-xl font-sans w-72 border border-slate-100 backdrop-blur-md bg-white/95">
      <h3 className="m-0 mb-3 text-sm font-bold text-slate-800 flex items-center gap-2">
        <span>⚡</span> Dispatch Engine Controls
      </h3>

      {/* 📦 Inject Order Button */}
      <button
        onClick={handleInjectOrder}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white font-semibold py-2.5 px-4 rounded-lg w-full text-xs shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin text-sm">⏳</span> Computing Min-Heap...
          </>
        ) : (
          "📦 Inject Order (Store 1)"
        )}
      </button>

      {/* 🚨 Chaos Test Button */}
      <button
        onClick={handleTriggerSpoof}
        className="w-full mt-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all text-white font-semibold py-2 px-3 rounded-lg text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
      >
        <span>🚨</span> Trigger GPS Spoof (AGT-101)
      </button>

      {/* Result Card */}
      {lastResult && (
        <div className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          {lastResult.success ? (
            <div>
              <p className="m-0 mb-1 text-emerald-600 font-bold flex items-center justify-between">
                <span>✅ Assigned</span>
                <span className="font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  {lastResult.assignedAgentId}
                </span>
              </p>
              <p className="m-0 text-slate-600">Order ID: <span className="font-mono">{lastResult.orderId}</span></p>
              <p className="m-0 text-slate-600">Latency: <span className="font-mono">{lastResult.dispatchAudit.executionTimeMs}ms</span></p>
            </div>
          ) : (
            <p className="m-0 text-rose-600 font-medium">❌ Failed: {lastResult.reason}</p>
          )}
        </div>
      )}
    </div>
  );
}