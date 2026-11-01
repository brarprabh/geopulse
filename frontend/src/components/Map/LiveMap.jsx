import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MAP_CENTER, DEFAULT_ZOOM, DARK_STORES } from "../../constants/mapConfig";
import { socket } from "../../services/socket";
import "leaflet/dist/leaflet.css";

// 1. Production-safe Delivery Rider Marker (Zero external image dependencies)
const riderIcon = new L.DivIcon({
  className: "custom-rider-pin",
  html: `<div style="
    background-color: #10B981;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    user-select: none;
  ">🛵</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// 2. Production-safe Dark Store Hub Marker (Zero external image dependencies)
const storeIcon = new L.DivIcon({
  className: "custom-store-pin",
  html: `<div style="
    background-color: #3B82F6;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    user-select: none;
  ">🏬</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

export default function LiveMap() {
  const [riders, setRiders] = useState([]);

  useEffect(() => {
    socket.on("fleet_update", (updatedRiders) => {
      setRiders(updatedRiders);
    });

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
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* Dark Stores */}
      {DARK_STORES.map((store) => (
        <Marker key={store.id} position={[store.lat, store.lng]} icon={storeIcon}>
          <Popup>
            <strong>🏬 {store.name}</strong> <br />
            ID: {store.id}
          </Popup>
        </Marker>
      ))}

      {/* Moving Fleet Agents */}
      {riders.map((rider) => (
        <Marker key={rider.agentId} position={[rider.lat, rider.lng]} icon={riderIcon}>
          <Popup>
            <strong>🛵 Agent: {rider.agentId}</strong> <br />
            Status: {rider.status} <br />
            Speed: {rider.speedKmh} km/h <br />
            Battery: {rider.battery}% <br />
            Active Orders: {rider.activeOrders || 0}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}