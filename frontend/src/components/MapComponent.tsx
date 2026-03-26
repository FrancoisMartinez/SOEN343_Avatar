import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type Marker as LeafletMarker } from 'leaflet';
import type { CarData } from '../services/vehicleService';
import { CAR_SVG, carIcon, carIconHighlighted, userLocationIcon, reticleIcon } from './carMarkerIcon';

const LOCATE_ZOOM_LEVEL = 17;
const CLUSTER_FIT_PADDING: [number, number] = [48, 48];

interface MapComponentProps {
  vehicles?: CarData[];
  selectedCarId?: number | null;
  userLocation?: { lat: number; lng: number } | null;
  searchCenter?: { lat: number; lng: number; address?: string } | null;
  searchRadius?: number;
  carFocusEvent?: {
    id: number;
    carId: number | null;
    openPopup: boolean;
    forceRecenter: boolean;
  };
  onSelectCar?: (carId: number | null) => void;
  pickingMode?: boolean;
  pickingPurpose?: 'search' | 'vehicle';
  draftLocation?: { lat: number; lng: number; address?: string } | null;
  onLocationPick?: (lat: number, lng: number) => void;
  onRecenter?: () => void;
  routePolyline?: [number, number][] | null;
}

function FlyToSelected({
  vehicles,
  focusEvent,
  userLocation,
}: {
  vehicles: CarData[];
  focusEvent: {
    id: number;
    carId: number | null;
    forceRecenter: boolean;
  };
  userLocation: { lat: number; lng: number } | null;
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

    let target: [number, number] | null = null;
    let targetKey = '';

    if (selectedCarId === 999999 && userLocation) {
      target = [userLocation.lat, userLocation.lng];
      targetKey = `user:${userLocation.lat.toFixed(6)}:${userLocation.lng.toFixed(6)}`;
    } else {
      const car = vehicles.find((v) => v.id === selectedCarId);
      if (car?.latitude != null && car?.longitude != null) {
        target = [car.latitude, car.longitude];
        targetKey = `${selectedCarId}:${car.latitude.toFixed(6)}:${car.longitude.toFixed(6)}`;
      }
    }

    if (target) {
      if (!focusEvent.forceRecenter && lastTargetRef.current === targetKey) {
        return;
      }

      const currentCenter = map.getCenter();
      const distanceToTargetMeters = map.distance(currentCenter, target);
      const isAlreadyFocused = distanceToTargetMeters < 1;

      if (isAlreadyFocused && !focusEvent.forceRecenter) {
        lastTargetRef.current = targetKey;
        return;
      }

      // If forceRecenter (Locate), always zoom to locate level, even if visible.
      lastTargetRef.current = targetKey;
      map.stop();
      map.flyTo(target, LOCATE_ZOOM_LEVEL, { duration: 1 });
    }
  }, [focusEvent, vehicles, map, userLocation]);

  return null;
}

function FlyToDraft({ draftLocation }: { draftLocation: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    const target: [number, number] = [draftLocation.lat, draftLocation.lng];
    const currentCenter = map.getCenter();
    const distanceToTargetMeters = map.distance(currentCenter, target);

    // Skip no-op animations to prevent marker jitter while editing.
    if (distanceToTargetMeters < 1 && map.getZoom() === LOCATE_ZOOM_LEVEL) {
      return;
    }

    map.stop();

    if (map.getBounds().contains(target)) {
      map.panTo(target, { animate: true, duration: 0.35 });
      return;
    }

    map.flyTo(target, LOCATE_ZOOM_LEVEL, { duration: 0.8 });
  }, [draftLocation.lat, draftLocation.lng, map]);

  return null;
}

function FlyToSearchCenter({ searchCenter, searchRadius }: { searchCenter: { lat: number; lng: number }; searchRadius: number }) {
  const map = useMap();
  const lastCenterRef = useRef<string | null>(null);
  const lastRadiusRef = useRef<number>(searchRadius);

  useEffect(() => {
    const target: [number, number] = [searchCenter.lat, searchCenter.lng];
    const centerKey = `${searchCenter.lat.toFixed(6)},${searchCenter.lng.toFixed(6)}`;
    
    const centerChanged = lastCenterRef.current !== centerKey;
    const radiusChanged = lastRadiusRef.current !== searchRadius;
    
    lastCenterRef.current = centerKey;
    lastRadiusRef.current = searchRadius;

    let targetZoom: number;

    if (centerChanged) {
      // Selecting a location should always focus in (Priority 1)
      targetZoom = 17;
    } else if (radiusChanged) {
      // Adjusting slider should zoom out/in to fit radius (Priority 2)
      // Z = 15.2 - log2(R)
      // 0.5km -> 16.2 -> 16
      // 1km   -> 15.2 -> 15
      // 5km   -> 15.2 - 2.3 = 12.9 -> 12
      // 35km  -> 15.2 - 5.1 = 10.1 -> 10
      // 50km  -> 15.2 - 5.6 = 9.6  -> 9 -> (min 10)
      targetZoom = Math.max(10, Math.min(18, Math.floor(15.2 - Math.log2(searchRadius))));
      
      // Special case: if radius is very small, we might want 15
      if (searchRadius <= 0.5) targetZoom = 15;
    } else {
      return;
    }

    const currentCenter = map.getCenter();
    const distanceToTargetMeters = map.distance(currentCenter, target);
    const currentZoom = map.getZoom();

    if (distanceToTargetMeters < 1 && currentZoom === targetZoom) {
      return;
    }

    map.stop();
    
    // Smooth transition if we're already at the center
    if (distanceToTargetMeters < 10) {
      map.setZoom(targetZoom, { animate: true });
    } else {
      map.flyTo(target, targetZoom, { duration: 0.8 });
    }
  }, [searchCenter.lat, searchCenter.lng, searchRadius, map]);

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

    const paddingPoint = L.point(CLUSTER_FIT_PADDING[0], CLUSTER_FIT_PADDING[1]);
    const maxAllowedZoom = Math.min(map.getMaxZoom(), LOCATE_ZOOM_LEVEL);
    const boundsZoom = map.getBoundsZoom(bounds, false, paddingPoint);
    const targetZoom = Math.min(maxAllowedZoom, boundsZoom);

    map.stop();
    map.flyTo(bounds.getCenter(), targetZoom, {
      duration: 0.45,
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

function FitRouteBounds({ polyline }: { polyline: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (polyline.length < 2) return;
    const bounds = L.latLngBounds(polyline);
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [polyline, map]);
  return null;
}

export default function MapComponent({
  vehicles = [],
  selectedCarId = null,
  userLocation = null,
  searchCenter = null,
  searchRadius = 20,
  carFocusEvent = { id: 0, carId: null, openPopup: false, forceRecenter: false },
  onSelectCar,
  pickingMode = false,
  pickingPurpose = 'vehicle',
  draftLocation = null,
  onLocationPick,
  onRecenter,
  routePolyline = null,
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
          {pickingPurpose === 'vehicle'
            ? 'Click on the map to set the vehicle location'
            : 'Click on the map to set your search center'}
        </div>
      )}

      {onRecenter && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRecenter();
          }}
          className="map-recenter-btn"
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          title="Recenter to my location"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#222';
            e.currentTarget.style.borderColor = 'rgba(100, 108, 255, 0.8)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(100, 108, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1a1a1a';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#646cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" fill="#646cff" fillOpacity="0.3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            <circle cx="12" cy="12" r="9" strokeOpacity="0.5"/>
          </svg>
        </button>
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

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} zIndexOffset={1000}>
            <Popup>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>You are here</div>
            </Popup>
          </Marker>
        )}

        {routePolyline && routePolyline.length >= 2 && (
          <>
            <Polyline positions={routePolyline} color="#646cff" weight={5} opacity={0.85} />
            <FitRouteBounds polyline={routePolyline} />
          </>
        )}

        {!pickingMode && (
          <FlyToSelected
            vehicles={carsWithCoords}
            focusEvent={{
              id: carFocusEvent.id,
              carId: carFocusEvent.carId,
              forceRecenter: carFocusEvent.forceRecenter,
            }}
            userLocation={userLocation}
          />
        )}

        {!pickingMode && onSelectCar && (
          <DeselectOnMapClick onDeselect={() => onSelectCar(null)} />
        )}

        {!pickingMode && searchCenter && (
          <>
            <Marker position={[searchCenter.lat, searchCenter.lng]} icon={reticleIcon}>
              <Popup>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Search Center</div>
                <div style={{ fontSize: '12px' }}>{searchCenter.address}</div>
              </Popup>
            </Marker>
            <Circle
              center={[searchCenter.lat, searchCenter.lng]}
              radius={searchRadius * 1000}
              pathOptions={{
                color: '#646cff',
                fillColor: '#646cff',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 10',
              }}
            />
            <FlyToSearchCenter searchCenter={searchCenter} searchRadius={searchRadius} />
          </>
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
              icon={
                pickingPurpose === 'search'
                  ? reticleIcon
                  : (selectedCarId != null || selectedCar ? carIconHighlighted : carIcon)
              }
              ref={(ref) => {
                draftMarkerRef.current = ref;
              }}
            >
              <Popup autoPan={false}>
                <div style={{ fontFamily: 'inherit', minWidth: 140 }}>
                  <strong>
                    {pickingPurpose === 'vehicle'
                      ? (selectedCar?.makeModel ?? 'New Vehicle')
                      : 'Search Center'}
                  </strong>
                  <br />
                  <span style={{ fontSize: '0.85em', opacity: 0.8 }}>
                    {pickingPurpose === 'vehicle'
                      ? (selectedCar?.location ?? 'Set vehicle location')
                      : draftLocation.address}
                  </span>
                  <br />
                  {pickingPurpose === 'vehicle' && selectedCar ? (
                    <span style={{ fontSize: '0.85em' }}>${selectedCar.hourlyRate.toFixed(2)}/hr</span>
                  ) : pickingPurpose === 'search' ? (
                    <span style={{ fontSize: '0.85em' }}>{draftLocation.lat.toFixed(5)}, {draftLocation.lng.toFixed(5)}</span>
                  ) : null}
                </div>
              </Popup>
            </Marker>
            {pickingPurpose === 'search' && (
              <>
                <Circle
                  center={[draftLocation.lat, draftLocation.lng]}
                  radius={searchRadius * 1000}
                  pathOptions={{
                    color: '#646cff',
                    fillColor: '#646cff',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 10',
                  }}
                />
                <FlyToSearchCenter searchCenter={draftLocation} searchRadius={searchRadius} />
              </>
            )}
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
