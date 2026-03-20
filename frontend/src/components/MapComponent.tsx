import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Marker as LeafletMarker } from 'leaflet';
import type { CarData } from '../services/vehicleService';
import { carIcon, carIconHighlighted } from './carMarkerIcon';

interface MapComponentProps {
  vehicles?: CarData[];
  selectedCarId?: number | null;
  onSelectCar?: (carId: number | null) => void;
  pickingMode?: boolean;
  draftLocation?: { lat: number; lng: number } | null;
  onLocationPick?: (lat: number, lng: number) => void;
}

function FlyToSelected({ vehicles, selectedCarId }: { vehicles: CarData[]; selectedCarId: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCarId == null) return;
    const car = vehicles.find((v) => v.id === selectedCarId);
    if (car?.latitude != null && car?.longitude != null) {
      map.flyTo([car.latitude, car.longitude], 17, { duration: 1 });
    }
  }, [selectedCarId, vehicles, map]);

  return null;
}

function FlyToDraft({ draftLocation }: { draftLocation: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([draftLocation.lat, draftLocation.lng], 17, { duration: 0.8 });
  }, [draftLocation.lat, draftLocation.lng, map]);

  return null;
}

function PickingClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function PickingCursor() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    container.classList.add('map--picking');
    return () => container.classList.remove('map--picking');
  }, [map]);
  return null;
}

export default function MapComponent({
  vehicles = [],
  selectedCarId = null,
  onSelectCar,
  pickingMode = false,
  draftLocation = null,
  onLocationPick,
}: MapComponentProps) {
  const center: [number, number] = [45.4947, -73.5779];
  const tileUrl = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png';

  const carsWithCoords = vehicles.filter(
    (v) => v.latitude != null && v.longitude != null
  );

  const markerRefs = useRef<Record<number, LeafletMarker | null>>({});

  useEffect(() => {
    if (selectedCarId == null) return;
    markerRefs.current[selectedCarId]?.openPopup();
  }, [selectedCarId]);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      {pickingMode && (
        <div className="map-picking-banner">
          Click on the map to set the vehicle location
        </div>
      )}

      <MapContainer
        center={center}
        zoom={15}
        minZoom={10}
        maxZoom={18}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer key={tileUrl} url={tileUrl} />

        {!pickingMode && (
          <FlyToSelected vehicles={carsWithCoords} selectedCarId={selectedCarId} />
        )}

        {pickingMode && onLocationPick && (
          <>
            <PickingClickHandler onPick={onLocationPick} />
            <PickingCursor />
          </>
        )}

        {pickingMode && draftLocation && (
          <>
            <Marker position={[draftLocation.lat, draftLocation.lng]} icon={carIconHighlighted} />
            <FlyToDraft draftLocation={draftLocation} />
          </>
        )}

        {carsWithCoords.map((car) => (
          <Marker
            key={car.id}
            position={[car.latitude!, car.longitude!]}
            icon={car.id === selectedCarId ? carIconHighlighted : carIcon}
            ref={(ref) => {
              if (car.id != null) {
                markerRefs.current[car.id] = ref;
              }
            }}
            eventHandlers={{
              click: () => onSelectCar?.(car.id ?? null),
              popupclose: () => {
                if (car.id === selectedCarId) {
                  onSelectCar?.(null);
                }
              },
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'inherit', minWidth: 140 }}>
                <strong>{car.makeModel}</strong>
                <br />
                <span style={{ fontSize: '0.85em', opacity: 0.8 }}>{car.location}</span>
                <br />
                <span style={{ fontSize: '0.85em' }}>${car.hourlyRate.toFixed(2)}/hr</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
