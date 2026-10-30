import { useState, useEffect } from "react";
import { socket } from "./services/socket";
import LiveMap from "./components/Map/LiveMap";
import StressTestControls from "./components/Chaos/StressTestControls";
import DecisionAuditDrawer from "./components/Drawer/DecisionAuditDrawer";

export default function App() {
  const [latestDispatch, setLatestDispatch] = useState(null);
  const [anomalyAlert, setAnomalyAlert] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ [Socket] Connected to Backend! ID:", socket.id);
    });

    // 🚨 Listen for real-time telemetry anomalies from backend
    socket.on("telemetry_anomaly", (anomalyData) => {
      console.warn("🚨 Telemetry Anomaly received:", anomalyData);
      setAnomalyAlert(anomalyData);

      // Auto-hide the banner after 6 seconds
      setTimeout(() => {
        setAnomalyAlert(null);
      }, 3000);
    });

    return () => {
      socket.off("connect");
      socket.off("telemetry_anomaly");
    };
  }, []);

  const handleOrderDispatched = (result) => {
    console.log("📦 Order successfully dispatched from UI:", result);
    setLatestDispatch(result); // Store result to open the Audit Drawer!
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* 🚨 Floating Operational Anomaly Alert Banner */}
      {anomalyAlert && (
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-[1000] bg-rose-600/95 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-3 backdrop-blur-md border border-rose-400 animate-bounce">
          <span className="text-base">🚨</span>
          <div>
            <strong className="font-bold uppercase tracking-wider block text-[10px] text-rose-200">
              Operational Anomaly Flagged ({anomalyAlert.anomalyType})
            </strong>
            <span>{anomalyAlert.reason}</span>
          </div>
          <button
            onClick={() => setAnomalyAlert(null)}
            className="ml-2 text-rose-200 hover:text-white font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Full-screen interactive Leaflet map with moving riders */}
      <LiveMap />

      {/* 2. Floating Chaos & Stress-Test Control Panel */}
      <StressTestControls onOrderDispatched={handleOrderDispatched} />

      {/* 3. Min-Heap Decision Audit Drawer */}
      <DecisionAuditDrawer 
        auditData={latestDispatch} 
        onClose={() => setLatestDispatch(null)} 
      />
    </div>
  );
}