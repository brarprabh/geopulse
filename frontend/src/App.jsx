import { useState, useEffect } from "react";
import { socket } from "./services/socket";
import LiveMap from "./components/Map/LiveMap";
import StressTestControls from "./components/Chaos/StressTestControls";
import DecisionAuditDrawer from "./components/Drawer/DecisionAuditDrawer";

export default function App() {
  const [latestDispatch, setLatestDispatch] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ [Socket] Connected to Backend! ID:", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  const handleOrderDispatched = (result) => {
    console.log("📦 Order successfully dispatched from UI:", result);
    setLatestDispatch(result); // Store result to open the Audit Drawer!
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
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