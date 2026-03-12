import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent() {
  // Centered somewhere near downtown Montreal (Concordia University roughly)
  const center: [number, number] = [45.4947, -73.5779];

  const tileUrl = "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png";

  return (
    <div
      style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
    >
      <MapContainer
        center={center}
        zoom={15}
        minZoom={10}
        maxZoom={18}
        attributionControl={false}
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        <TileLayer
          key={tileUrl}
          url={tileUrl}
        />
      </MapContainer>
    </div>
  );
}
