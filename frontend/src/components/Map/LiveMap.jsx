import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MAP_CENTER, DEFAULT_ZOOM, DARK_STORES } from "../../constants/mapConfig";
import { socket } from "../../services/socket";
import "leaflet/dist/leaflet.css";

export default function LiveMap() {
  // State to hold the live list of riders coming from the backend
  const [riders, setRiders] = useState([]);

  useEffect(() => {
    // Listen for live GPS updates broadcasted every 2 seconds by the backend simulator
    socket.on("fleet_update", (updatedRiders) => {
      setRiders(updatedRiders);
    });

    // Cleanup listener when component unmounts
    return () => {
      socket.off("fleet_update");
    };
  }, []);

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Visual Street Map Background */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* 1. Render Dark Stores (Warehouses) */}
      {DARK_STORES.map((store) => (
        <Marker key={store.id} position={[store.lat, store.lng]}>
          <Popup>
            <strong>🏬 {store.name}</strong> <br />
            ID: {store.id}
          </Popup>
        </Marker>
      ))}

      {/* 2. Render Live Moving Riders */}
      {riders.map((rider) => (
        <Marker key={rider.agentId} position={[rider.lat, rider.lng]}>
          <Popup>
            <strong>🛵 Agent: {rider.agentId}</strong> <br />
            Status: {rider.status} <br />
            Speed: {rider.speedKmh} km/h <br />
            Battery: {rider.battery}%
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}