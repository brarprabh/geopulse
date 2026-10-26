import { useEffect } from "react";
import { socket } from "./services/socket";
import LiveMap from "./components/Map/LiveMap";

export default function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ [Socket] Connected to Backend! ID:", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <LiveMap />
    </div>
  );
}