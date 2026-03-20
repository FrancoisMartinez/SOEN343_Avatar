import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type Marker as LeafletMarker } from 'leaflet';
import type { CarData } from '../services/vehicleService';
import { CAR_SVG, carIcon, carIconHighlighted } from './carMarkerIcon';

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

      // If forceRecenter (Locate), always zoom to 17, even if visible.
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

function DeselectOnMapClick({ onDeselect }: { onDeselect: () => void }) {
  useMapEvents({
    click() {
      onDeselect();
    },
  });

  return null;
}

function createClusterIcon(count: number, hasSelectedCar: boolean) {
  const frontIconClass = hasSelectedCar
    ? 'car-marker__inner car-marker__inner--highlighted'
    : 'car-marker__inner';

  return L.divIcon({
    html: `<div class="car-cluster__stack">
      <div class="car-cluster__car car-cluster__car--back">
        <div class="car-marker__inner">${CAR_SVG}</div>
      </div>
      <div class="car-cluster__car car-cluster__car--front">
        <div class="${frontIconClass}">${CAR_SVG}</div>
      </div>
      <span class="car-cluster__badge">${count}</span>
    </div>`,
    className: 'car-cluster',
    iconSize: L.point(36, 36, true),
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function getClusterRadiusPx(zoom: number) {
  if (zoom <= 11) return 64;
  if (zoom <= 13) return 52;
  if (zoom <= 15) return 42;
  return 34;
}

type ClusteredEntry = {
  center: [number, number];
  cars: CarData[];
};

function ClusteredCarMarkers({
  cars,
  selectedCarId,
  markerRefs,
  onSelectCar,
}: {
  cars: CarData[];
  selectedCarId: number | null;
  markerRefs: MutableRefObject<Record<number, LeafletMarker | null>>;
  onSelectCar?: (carId: number | null) => void;
}) {
  const map = useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });
  const [zoom, setZoom] = useState<number>(map.getZoom());

  const clusteredEntries = useMemo<ClusteredEntry[]>(() => {
    if (cars.length === 0) {
      return [];
    }

    // At high zoom, show each marker independently for precise selection.
    if (zoom >= 17) {
      return cars.map((car) => ({
        center: [car.latitude!, car.longitude!],
        cars: [car],
      }));
    }

    const radiusPx = getClusterRadiusPx(zoom);
    const clusters: Array<{ x: number; y: number; cars: CarData[] }> = [];

    for (const car of cars) {
      const point = map.project([car.latitude!, car.longitude!], zoom);
      let nearestCluster: { x: number; y: number; cars: CarData[] } | null = null;
      let nearestDistanceSq = Number.POSITIVE_INFINITY;

      for (const cluster of clusters) {
        const dx = point.x - cluster.x;
        const dy = point.y - cluster.y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq <= radiusPx * radiusPx && distanceSq < nearestDistanceSq) {
          nearestCluster = cluster;
          nearestDistanceSq = distanceSq;
        }
      }

      if (nearestCluster) {
        nearestCluster.cars.push(car);
        const count = nearestCluster.cars.length;
        nearestCluster.x = (nearestCluster.x * (count - 1) + point.x) / count;
        nearestCluster.y = (nearestCluster.y * (count - 1) + point.y) / count;
      } else {
        clusters.push({ x: point.x, y: point.y, cars: [car] });
      }
    }

    return clusters.map((cluster) => {
      const center = map.unproject(L.point(cluster.x, cluster.y), zoom);
      return {
        center: [center.lat, center.lng],
        cars: cluster.cars,
      };
    });
  }, [cars, map, zoom]);

  const handleClusterClick = (clusterCars: CarData[]) => {
    const bounds = L.latLngBounds(clusterCars.map((car) => [car.latitude!, car.longitude!] as [number, number]));
    if (!bounds.isValid()) {
      return;
    }

    const currentZoom = map.getZoom();
    map.flyToBounds(bounds.pad(0.25), {
      padding: [48, 48],
      duration: 0.45,
      maxZoom: Math.min(map.getMaxZoom(), currentZoom + 2),
    });
  };

  return (
    <>
      {clusteredEntries.map((entry) => {
        if (entry.cars.length === 1) {
          const car = entry.cars[0];
          return (
            <Marker
              key={`car-${car.id ?? `${car.latitude}-${car.longitude}`}`}
              position={[car.latitude!, car.longitude!]}
              icon={car.id === selectedCarId ? carIconHighlighted : carIcon}
              ref={(ref) => {
                if (car.id != null) {
                  markerRefs.current[car.id] = ref;
                  // --- Patch: Open popup if this is the selected car and popup is requested ---
                  // Use window.requestAnimationFrame to ensure marker is mounted
                  if (
                    ref &&
                    car.id === selectedCarId &&
                    typeof window !== 'undefined'
                  ) {
                    window.requestAnimationFrame(() => {
                      // Find the latest popup request from carFocusEvent
                      // We can't access carFocusEvent directly here, so rely on markerRefs and openPopup state
                      // Instead, always try to open if marker is mounted and popup isn't already open
                      if (ref.isPopupOpen && !ref.isPopupOpen()) {
                        ref.openPopup();
                      }
                    });
                  }
                }
              }}
              eventHandlers={{
                click: () => {
                  onSelectCar?.(car.id ?? null);
                },
                popupclose: () => {
                  if (car.id === selectedCarId) {
                    onSelectCar?.(null);
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
          );
        }

        const clusterKey = entry.cars
          .map((car) => car.id ?? `${car.latitude}-${car.longitude}`)
          .sort((a, b) => String(a).localeCompare(String(b)))
          .join('-');

        return (
          <Marker
            key={`cluster-${clusterKey}`}
            position={entry.center}
            icon={createClusterIcon(
              entry.cars.length,
              selectedCarId != null && entry.cars.some((car) => car.id === selectedCarId)
            )}
            eventHandlers={{
              click: () => {
                handleClusterClick(entry.cars);
              },
            }}
          />
        );
      })}
    </>
  );
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

  // Always open popup after a Locate event, even if marker is mounted after zoom (e.g., after cluster split)
  useEffect(() => {
    if (selectedCarId == null) return;
    if (!carFocusEvent.openPopup) return;
    if (carFocusEvent.id === 0) return;
    if (pickingMode && draftLocation && selectedCarId != null) {
      draftMarkerRef.current?.openPopup();
      return;
    }

    // Try to open popup immediately, and again after a short delay in case marker is mounted after zoom
    const tryOpen = () => markerRefs.current[selectedCarId]?.openPopup();
    tryOpen();
    const timeoutId = window.setTimeout(tryOpen, 350); // after zoom animation
    return () => window.clearTimeout(timeoutId);
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

        {!pickingMode && onSelectCar && (
          <DeselectOnMapClick onDeselect={() => onSelectCar(null)} />
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

        {!pickingMode && (
          <ClusteredCarMarkers
            cars={visibleCars}
            selectedCarId={selectedCarId}
            markerRefs={markerRefs}
            onSelectCar={onSelectCar}
          />
        )}

        {pickingMode && visibleCars.map((car) => (
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
