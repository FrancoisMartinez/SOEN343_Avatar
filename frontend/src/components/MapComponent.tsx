import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Marker as LeafletMarker } from 'leaflet';
import type { CarData } from '../services/vehicleService';
import { carIcon, carIconHighlighted } from './carMarkerIcon';

interface MapComponentProps {
  vehicles?: CarData[];
  selectedCarId?: number | null;
  carFocusEvent?: {
    id: number;
    carId: number | null;
    openPopup: boolean;
    forceRecenter: boolean;
  };
  onSelectCar?: (carId: number | null) => void;
  pickingMode?: boolean;
  draftLocation?: { lat: number; lng: number } | null;
  onLocationPick?: (lat: number, lng: number) => void;
}

function FlyToSelected({
  vehicles,
  focusEvent,
}: {
  vehicles: CarData[];
  focusEvent: {
    id: number;
    carId: number | null;
    forceRecenter: boolean;
  };
}) {
  const map = useMap();
  const lastTargetRef = useRef<string | null>(null);
  const prevFocusEventIdRef = useRef<number>(0);

  useEffect(() => {
    const focusRequested = prevFocusEventIdRef.current !== focusEvent.id;
    prevFocusEventIdRef.current = focusEvent.id;

    if (!focusRequested) {
      return;
    }

    const selectedCarId = focusEvent.carId;

    if (selectedCarId == null) {
      lastTargetRef.current = null;
      return;
    }

    const car = vehicles.find((v) => v.id === selectedCarId);
    if (car?.latitude != null && car?.longitude != null) {
      const targetKey = `${selectedCarId}:${car.latitude.toFixed(6)}:${car.longitude.toFixed(6)}`;
      if (!focusEvent.forceRecenter && lastTargetRef.current === targetKey) {
        return;
      }

      const target: [number, number] = [car.latitude, car.longitude];
      const currentCenter = map.getCenter();
      const distanceToTargetMeters = map.distance(currentCenter, target);
      const isAlreadyFocused = distanceToTargetMeters < 1;

      if (isAlreadyFocused && !focusEvent.forceRecenter) {
        lastTargetRef.current = targetKey;
        return;
      }

      // If the marker is already visible, recenter smoothly without changing zoom.
      if (map.getBounds().contains(target)) {
        lastTargetRef.current = targetKey;
        map.stop();
        map.panTo(target, { animate: true, duration: 0.35 });
        return;
      }

      lastTargetRef.current = targetKey;
      map.stop();
      map.flyTo(target, 17, { duration: 1 });
    }
  }, [focusEvent, vehicles, map]);

  return null;
}

function FlyToDraft({ draftLocation }: { draftLocation: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    const target: [number, number] = [draftLocation.lat, draftLocation.lng];
    const currentCenter = map.getCenter();
    const distanceToTargetMeters = map.distance(currentCenter, target);

    // Skip no-op animations to prevent marker jitter while editing.
    if (distanceToTargetMeters < 1 && map.getZoom() === 17) {
      return;
    }

    map.stop();

    if (map.getBounds().contains(target)) {
      map.panTo(target, { animate: true, duration: 0.35 });
      return;
    }

    map.flyTo(target, 17, { duration: 0.8 });
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
  carFocusEvent = { id: 0, carId: null, openPopup: false, forceRecenter: false },
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
  const visibleCars = carsWithCoords.filter((car) => {
    // In edit/picking mode, the draft marker represents the selected car position.
    // Hide the selected car marker to prevent double-render overlap.
    if (pickingMode && draftLocation && selectedCarId != null && car.id === selectedCarId) {
      return false;
    }
    return true;
  });
  const markerRefs = useRef<Record<number, LeafletMarker | null>>({});
  const draftMarkerRef = useRef<LeafletMarker | null>(null);
  const wasPickingModeRef = useRef<boolean>(pickingMode);
  const selectedCar = carsWithCoords.find((car) => car.id === selectedCarId) ?? null;

  useEffect(() => {
    if (selectedCarId == null) return;
    if (!carFocusEvent.openPopup) return;
    if (carFocusEvent.id === 0) return;
    if (pickingMode && draftLocation && selectedCarId != null) {
      draftMarkerRef.current?.openPopup();
      return;
    }

    markerRefs.current[selectedCarId]?.openPopup();
  }, [selectedCarId, carFocusEvent, pickingMode, draftLocation]);

  useEffect(() => {
    const wasPickingMode = wasPickingModeRef.current;
    wasPickingModeRef.current = pickingMode;

    // When returning from add/edit mode, reopen the selected marker popup
    // after normal markers are mounted again.
    if (wasPickingMode && !pickingMode && selectedCarId != null) {
      const timeoutId = window.setTimeout(() => {
        markerRefs.current[selectedCarId]?.openPopup();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [pickingMode, selectedCarId]);

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
          <FlyToSelected
            vehicles={carsWithCoords}
            focusEvent={{
              id: carFocusEvent.id,
              carId: selectedCarId,
              forceRecenter: carFocusEvent.forceRecenter,
            }}
          />
        )}

        {pickingMode && onLocationPick && (
          <>
            <PickingClickHandler onPick={onLocationPick} />
            <PickingCursor />
          </>
        )}

        {pickingMode && draftLocation && (
          <>
            <Marker
              position={[draftLocation.lat, draftLocation.lng]}
              icon={carIconHighlighted}
              ref={(ref) => {
                draftMarkerRef.current = ref;
              }}
            >
              <Popup autoPan={false}>
                <div style={{ fontFamily: 'inherit', minWidth: 140 }}>
                  <strong>{selectedCar?.makeModel ?? 'Selected Vehicle'}</strong>
                  <br />
                  <span style={{ fontSize: '0.85em', opacity: 0.8 }}>{selectedCar?.location ?? 'Adjusting location'}</span>
                  <br />
                  {selectedCar ? (
                    <span style={{ fontSize: '0.85em' }}>${selectedCar.hourlyRate.toFixed(2)}/hr</span>
                  ) : (
                    <span style={{ fontSize: '0.85em' }}>{draftLocation.lat.toFixed(5)}, {draftLocation.lng.toFixed(5)}</span>
                  )}
                </div>
              </Popup>
            </Marker>
            <FlyToDraft draftLocation={draftLocation} />
          </>
        )}

        {visibleCars.map((car) => (
          <Marker
            key={car.id}
            position={[car.latitude!, car.longitude!]}
            icon={car.id === selectedCarId ? carIconHighlighted : carIcon}
            interactive={!pickingMode}
            ref={(ref) => {
              if (car.id != null) {
                markerRefs.current[car.id] = ref;
              }
            }}
            eventHandlers={{
              click: () => {
                if (!pickingMode) {
                  onSelectCar?.(car.id ?? null);
                }
              },
            }}
          >
            <Popup autoPan={false}>
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
