import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MAP_CENTER, DEFAULT_ZOOM, DARK_STORES } from "../../constants/mapConfig";
import "leaflet/dist/leaflet.css";

export default function LiveMap() {
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

      {DARK_STORES.map((store) => (
        <Marker key={store.id} position={[store.lat, store.lng]}>
          <Popup>
            <strong>🏬 {store.name}</strong> <br />
            ID: {store.id}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}