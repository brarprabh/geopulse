import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { io } from "socket.io-client";
import "leaflet/dist/leaflet.css";

const socket = io("http://localhost:4000");

// 1. Our 3 fixed Dark Stores (Warehouses) in Bengaluru
const DARK_STORES = [
  { id: "STORE-1", name: "Indiranagar Hub", lat: 12.9784, lng: 77.6408 },
  { id: "STORE-2", name: "Koramangala Hub", lat: 12.9352, lng: 77.6245 },
  { id: "STORE-3", name: "MG Road Central Hub", lat: 12.9756, lng: 77.6066 },
];

export default function App() {
  // Center point of the map so all 3 stores fit nicely on screen
  const mapCenter = [12.9630, 77.6240];

  // 4. ONE FUNCTION: Listen for when the phone call connects
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to Backend! My Socket ID is:", socket.id);
    });

    // Clean up listener if the page closes
    return () => {
      socket.off("connect");
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Loads the actual visual street map from OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Loops through our 3 Dark Stores and drops a pin for each one */}
        {DARK_STORES.map((store) => (
          <Marker key={store.id} position={[store.lat, store.lng]}>
            <Popup>
              <strong>{store.name}</strong> <br />
              ID: {store.id}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}