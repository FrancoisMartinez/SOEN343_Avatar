import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type Marker as LeafletMarker } from 'leaflet';
import type { CarData } from '../services/vehicleService';
import type { InstructorData } from '../services/instructorService';
import type { ParkingSpot } from '../services/parkingService';
import { CAR_SVG, INSTRUCTOR_SVG, carIcon, carIconHighlighted, instructorIcon, instructorIconHighlighted, userLocationIcon, reticleIcon } from './carMarkerIcon';

const parkingIcon = L.divIcon({
  html: '<div style="background:#1565c0;color:#fff;border-radius:4px;padding:2px 5px;font-size:12px;font-weight:700;border:2px solid #0d47a1;white-space:nowrap">P</div>',
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});

const LOCATE_ZOOM_LEVEL = 17;
// const CLUSTER_FIT_PADDING: [number, number] = [48, 48];

interface MapComponentProps {
  vehicles?: CarData[];
  selectedCarId?: number | null;
  instructors?: InstructorData[];
  selectedInstructorId?: number | null;
  serviceType?: 'car' | 'class' | 'package';
  userLocation?: { lat: number; lng: number } | null;
  searchCenter?: { lat: number; lng: number; address?: string } | null;
  searchRadius?: number;
  carFocusEvent?: {
    id: number;
    carId: number | null;
    instructorId?: number | null;
    openPopup: boolean;
    forceRecenter: boolean;
  };
  onSelectCar?: (carId: number | null) => void;
  onSelectInstructor?: (id: number | null) => void;
  pickingMode?: boolean;
  pickingPurpose?: 'search' | 'vehicle' | 'instructor';
  draftLocation?: { lat: number; lng: number; address?: string } | null;
  onLocationPick?: (lat: number, lng: number) => void;
  onRecenter?: () => void;
  routePolyline?: [number, number][] | null;
  parkingSpots?: ParkingSpot[];
  onCenterChange?: (lat: number, lon: number) => void;
  onNavigateToParking?: (lat: number, lon: number, name: string) => void;
  onNavigateToCar?: (lat: number, lon: number, name: string) => void;
  onNavigateToTarget?: (lat: number, lon: number, name: string) => void;
}

function FlyToSelected({
  vehicles,
  instructors = [],
  focusEvent,
  userLocation,
}: {
  vehicles: CarData[];
  instructors?: InstructorData[];
  focusEvent: {
    id: number;
    carId: number | null;
    instructorId?: number | null;
    forceRecenter: boolean;
  };
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const lastTargetRef = useRef<string | null>(null);
  const lastProcessedEventIdRef = useRef<number>(0);

  useEffect(() => {
    const selectedCarId = focusEvent.carId;
    const selectedInstructorId = focusEvent.instructorId;

    if (selectedCarId == null && selectedInstructorId == null) {
      lastTargetRef.current = null;
      lastProcessedEventIdRef.current = focusEvent.id;
      return;
    }

    let target: [number, number] | null = null;
    let targetKey = '';

    if (selectedCarId === 999999 && userLocation) {
      target = [userLocation.lat, userLocation.lng];
      targetKey = `user:${userLocation.lat.toFixed(6)}:${userLocation.lng.toFixed(6)}`;
    } else if (selectedCarId != null) {
      const car = vehicles.find((v) => v.id === selectedCarId);
      if (car?.latitude != null && car?.longitude != null) {
        target = [car.latitude, car.longitude];
        targetKey = `car:${selectedCarId}:${car.latitude.toFixed(6)}:${car.longitude.toFixed(6)}`;
      }
    } else if (selectedInstructorId != null) {
      const instructor = instructors.find((i) => i.id === selectedInstructorId);
      if (instructor?.latitude != null && instructor?.longitude != null) {
        target = [instructor.latitude, instructor.longitude];
        targetKey = `instructor:${selectedInstructorId}:${instructor.latitude.toFixed(6)}:${instructor.longitude.toFixed(6)}`;
      }
    }

    // If we have a target, check if we should fly
    if (target) {
      const isNewEvent = lastProcessedEventIdRef.current !== focusEvent.id;
      const isNewTarget = lastTargetRef.current !== targetKey;

      if (isNewEvent || (focusEvent.forceRecenter && isNewTarget)) {
        const currentCenter = map.getCenter();
        const distanceToTargetMeters = map.distance(currentCenter, target);
        const isAlreadyFocused = distanceToTargetMeters < 1;

        if (isAlreadyFocused && !focusEvent.forceRecenter && !isNewEvent) {
          return;
        }

        lastTargetRef.current = targetKey;
        lastProcessedEventIdRef.current = focusEvent.id;
        map.stop();
        map.flyTo(target, LOCATE_ZOOM_LEVEL, { duration: 1 });
      }
    }
  }, [focusEvent, vehicles, instructors, map, userLocation]);

  return null;
}

function FlyToDraft({ draftLocation }: { draftLocation: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    const target: [number, number] = [draftLocation.lat, draftLocation.lng];
    const currentCenter = map.getCenter();
    const distanceToTargetMeters = map.distance(currentCenter, target);
    if (distanceToTargetMeters < 1 && map.getZoom() === LOCATE_ZOOM_LEVEL) return;
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
    if (centerChanged) targetZoom = 17;
    else if (radiusChanged) targetZoom = Math.max(10, Math.min(18, Math.floor(15.2 - Math.log2(searchRadius))));
    else return;
    if (searchRadius <= 0.5) targetZoom = 15;
    const currentCenter = map.getCenter();
    const distanceToTargetMeters = map.distance(currentCenter, target);
    const currentZoom = map.getZoom();
    if (distanceToTargetMeters < 1 && currentZoom === targetZoom) return;
    map.stop();
    if (distanceToTargetMeters < 10) map.setZoom(targetZoom, { animate: true });
    else map.flyTo(target, targetZoom, { duration: 0.8 });
  }, [searchCenter.lat, searchCenter.lng, searchRadius, map]);
  return null;
}

function PickingClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
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
  useMapEvents({ click() { onDeselect(); } });
  return null;
}

function createClusterIcon(count: number, hasSelectedCar: boolean) {
  const frontIconClass = hasSelectedCar ? 'car-marker__inner car-marker__inner--highlighted' : 'car-marker__inner';
  return L.divIcon({
    html: `<div class="car-cluster__stack">
      <div class="car-cluster__car car-cluster__car--back"><div class="car-marker__inner">${CAR_SVG}</div></div>
      <div class="car-cluster__car car-cluster__car--front"><div class="${frontIconClass}">${CAR_SVG}</div></div>
      <span class="car-cluster__badge">${count}</span>
    </div>`,
    className: 'car-cluster',
    iconSize: L.point(36, 36, true),
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function createInstructorClusterIcon(count: number, hasSelectedInstructor: boolean) {
  const frontIconClass = hasSelectedInstructor ? 'car-marker__inner car-marker__inner--highlighted' : 'car-marker__inner';
  return L.divIcon({
    html: `<div class="car-cluster__stack instructor-marker">
      <div class="car-cluster__car car-cluster__car--back"><div class="car-marker__inner">${INSTRUCTOR_SVG}</div></div>
      <div class="car-cluster__car car-cluster__car--front"><div class="${frontIconClass}">${INSTRUCTOR_SVG}</div></div>
      <span class="car-cluster__badge" style="background: #1976d2;">${count}</span>
    </div>`,
    className: 'car-cluster instructor-cluster',
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

function ClusteredCarMarkers({ cars, selectedCarId, markerRefs, onSelectCar, onNavigateToCar, selectedCarIdRef }: {
  cars: CarData[];
  selectedCarId: number | null;
  markerRefs: MutableRefObject<Record<string, LeafletMarker | null>>;
  onSelectCar?: (carId: number | null) => void;
  onNavigateToCar?: (lat: number, lon: number, name: string) => void;
  selectedCarIdRef: MutableRefObject<number | null>;
}) {
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const [zoom, setZoom] = useState<number>(map.getZoom());
  
  const selectedCar = useMemo(() => cars.find(c => Number(c.id) === Number(selectedCarId)), [cars, selectedCarId]);
  const otherCars = useMemo(() => cars.filter(c => Number(c.id) !== Number(selectedCarId)), [cars, selectedCarId]);

  const clusteredEntries = useMemo(() => {
    if (otherCars.length === 0) return [];
    if (zoom >= 17) return otherCars.map(car => ({ center: [car.latitude!, car.longitude!], cars: [car] }));
    const radiusPx = getClusterRadiusPx(zoom);
    const clusters: Array<{ x: number; y: number; cars: CarData[] }> = [];
    for (const car of otherCars) {
      const point = map.project([car.latitude!, car.longitude!], zoom);
      let nearestCluster = null;
      let nearestDistanceSq = Number.POSITIVE_INFINITY;
      for (const cluster of clusters) {
        const dx = point.x - cluster.x; const dy = point.y - cluster.y; const distanceSq = dx * dx + dy * dy;
        if (distanceSq <= radiusPx * radiusPx && distanceSq < nearestDistanceSq) { nearestCluster = cluster; nearestDistanceSq = distanceSq; }
      }
      if (nearestCluster) {
        nearestCluster.cars.push(car); const count = nearestCluster.cars.length;
        nearestCluster.x = (nearestCluster.x * (count - 1) + point.x) / count;
        nearestCluster.y = (nearestCluster.y * (count - 1) + point.y) / count;
      } else { clusters.push({ x: point.x, y: point.y, cars: [car] }); }
    }
    return clusters.map(cluster => ({ center: map.unproject(L.point(cluster.x, cluster.y), zoom), cars: cluster.cars }));
  }, [otherCars, map, zoom]);

  return (
    <>
      {selectedCar && (
        <Marker
          key={`car-${selectedCar.id}`}
          position={[selectedCar.latitude!, selectedCar.longitude!]}
          icon={carIconHighlighted}
          ref={(ref) => { if (selectedCar.id != null) { markerRefs.current[`car-${selectedCar.id}`] = ref; if (ref) ref.openPopup(); } }}
          eventHandlers={{ 
            click: () => onSelectCar?.(selectedCar.id),
            popupclose: () => {
              if (Number(selectedCar.id) === Number(selectedCarIdRef.current)) {
                onSelectCar?.(null);
              }
            }
          }}
        >
          <Popup autoPan={false}>
            <div style={{ fontFamily: 'inherit', minWidth: 140 }}>
              <strong>{selectedCar.makeModel}</strong><br />
              <span style={{ fontSize: '0.85em', opacity: 0.8 }}>{selectedCar.location}</span><br />
              <span style={{ fontSize: '0.85em' }}>${selectedCar.hourlyRate?.toFixed(2) ?? '0.00'}/hr</span>
              {onNavigateToCar && (
                <><br /><button style={{ marginTop: 6, fontSize: '0.82em', cursor: 'pointer' }} onClick={() => onNavigateToCar(selectedCar.latitude!, selectedCar.longitude!, selectedCar.makeModel)}>Directions here</button></>
              )}
            </div>
          </Popup>
        </Marker>
      )}
      {clusteredEntries.map((entry: any) => {
        if (entry.cars.length === 1) {
          const car = entry.cars[0];
          return (
            <Marker
              key={`car-${car.id}`}
              position={[car.latitude!, car.longitude!]}
              icon={carIcon}
              ref={(ref) => { if (car.id != null) markerRefs.current[`car-${car.id}`] = ref; }}
              eventHandlers={{ click: () => onSelectCar?.(car.id) }}
            >
              <Popup autoPan={false}>
                <div style={{ fontFamily: 'inherit', minWidth: 140 }}>
                  <strong>{car.makeModel}</strong><br />
                  <span style={{ fontSize: '0.85em', opacity: 0.8 }}>{car.location}</span><br />
                  <span style={{ fontSize: '0.85em' }}>${car.hourlyRate?.toFixed(2) ?? '0.00'}/hr</span>
                  {onNavigateToCar && (
                    <><br /><button style={{ marginTop: 6, fontSize: '0.82em', cursor: 'pointer' }} onClick={() => onNavigateToCar(car.latitude!, car.longitude!, car.makeModel)}>Directions here</button></>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        }
        return (
          <Marker
            key={`cluster-${entry.cars.map((c: any) => c.id).join('-')}`}
            position={[entry.center.lat, entry.center.lng]}
            icon={createClusterIcon(entry.cars.length, false)}
            eventHandlers={{ click: () => { const bounds = L.latLngBounds(entry.cars.map((c: any) => [c.latitude, c.longitude])); map.flyTo(bounds.getCenter(), Math.min(map.getBoundsZoom(bounds), LOCATE_ZOOM_LEVEL)); } }}
          />
        );
      })}
    </>
  );
}

function ClusteredInstructorMarkers({ instructors, selectedInstructorId, markerRefs, onSelectInstructor, onNavigateToTarget, selectedInstructorIdRef }: {
  instructors: InstructorData[];
  selectedInstructorId: number | null;
  markerRefs: MutableRefObject<Record<string, LeafletMarker | null>>;
  onSelectInstructor?: (id: number | null) => void;
  onNavigateToTarget?: (lat: number, lon: number, name: string) => void;
  selectedInstructorIdRef: MutableRefObject<number | null>;
}) {
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const [zoom, setZoom] = useState<number>(map.getZoom());

  const selectedInstructor = useMemo(() => instructors.find(i => Number(i.id) === Number(selectedInstructorId)), [instructors, selectedInstructorId]);
  const otherInstructors = useMemo(() => instructors.filter(i => Number(i.id) !== Number(selectedInstructorId)), [instructors, selectedInstructorId]);

  const clusteredEntries = useMemo(() => {
    if (otherInstructors.length === 0) return [];
    if (zoom >= 17) return otherInstructors.map(inst => ({ center: [inst.latitude!, inst.longitude!], instructors: [inst] }));
    const radiusPx = getClusterRadiusPx(zoom);
    const clusters: Array<{ x: number; y: number; instructors: InstructorData[] }> = [];
    for (const inst of otherInstructors) {
      const point = map.project([inst.latitude!, inst.longitude!], zoom);
      let nearestCluster = null;
      let nearestDistanceSq = Number.POSITIVE_INFINITY;
      for (const cluster of clusters) {
        const dx = point.x - cluster.x; const dy = point.y - cluster.y; const distanceSq = dx * dx + dy * dy;
        if (distanceSq <= radiusPx * radiusPx && distanceSq < nearestDistanceSq) { nearestCluster = cluster; nearestDistanceSq = distanceSq; }
      }
      if (nearestCluster) {
        nearestCluster.instructors.push(inst); const count = nearestCluster.instructors.length;
        nearestCluster.x = (nearestCluster.x * (count - 1) + point.x) / count;
        nearestCluster.y = (nearestCluster.y * (count - 1) + point.y) / count;
      } else { clusters.push({ x: point.x, y: point.y, instructors: [inst] }); }
    }
    return clusters.map(cluster => ({ center: map.unproject(L.point(cluster.x, cluster.y), zoom), instructors: cluster.instructors }));
  }, [otherInstructors, map, zoom]);

  return (
    <>
      {selectedInstructor && (
        <Marker
          key={`instructor-${selectedInstructor.id}`}
          position={[selectedInstructor.latitude!, selectedInstructor.longitude!]}
          icon={instructorIconHighlighted}
          ref={(ref) => { if (selectedInstructor.id != null) { markerRefs.current[`inst-${selectedInstructor.id}`] = ref; if (ref) ref.openPopup(); } }}
          eventHandlers={{ 
            click: () => onSelectInstructor?.(selectedInstructor.id),
            popupclose: () => {
              if (Number(selectedInstructor.id) === Number(selectedInstructorIdRef.current)) {
                onSelectInstructor?.(null);
              }
            }
          }}
        >
          <Popup autoPan={false}>
            <div style={{ fontFamily: 'inherit', minWidth: 140 }}>
              <strong>{selectedInstructor.fullName}</strong><br />
              <span style={{ fontSize: '0.85em' }}>Driving Instructor</span><br />
              <span style={{ fontSize: '0.85em' }}>${selectedInstructor.hourlyRate.toFixed(2)}/hr</span>
              {onNavigateToTarget && (
                <><br /><button style={{ marginTop: 6, fontSize: '0.82em', cursor: 'pointer' }} onClick={() => onNavigateToTarget(selectedInstructor.latitude!, selectedInstructor.longitude!, selectedInstructor.fullName)}>Directions here</button></>
              )}
            </div>
          </Popup>
        </Marker>
      )}
      {clusteredEntries.map((entry: any) => {
        if (entry.instructors.length === 1) {
          const inst = entry.instructors[0];
          return (
            <Marker
              key={`instructor-${inst.id}`}
              position={[inst.latitude!, inst.longitude!]}
              icon={instructorIcon}
              ref={(ref) => { if (inst.id != null) markerRefs.current[`inst-${inst.id}`] = ref; }}
              eventHandlers={{ click: () => onSelectInstructor?.(inst.id) }}
            >
              <Popup autoPan={false}>
                <div style={{ fontFamily: 'inherit', minWidth: 140 }}>
                  <strong>{inst.fullName}</strong><br />
                  <span style={{ fontSize: '0.85em' }}>Driving Instructor</span><br />
                  <span style={{ fontSize: '0.85em' }}>${inst.hourlyRate.toFixed(2)}/hr</span>
                  {onNavigateToTarget && (
                    <><br /><button style={{ marginTop: 6, fontSize: '0.82em', cursor: 'pointer' }} onClick={() => onNavigateToTarget(inst.latitude!, inst.longitude!, inst.fullName)}>Directions here</button></>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        }
        return (
          <Marker
            key={`inst-cluster-${entry.instructors.map((i: any) => i.id).join('-')}`}
            position={[entry.center.lat, entry.center.lng]}
            icon={createInstructorClusterIcon(entry.instructors.length, false)}
            eventHandlers={{ click: () => { const bounds = L.latLngBounds(entry.instructors.map((i: any) => [i.latitude, i.longitude])); map.flyTo(bounds.getCenter(), Math.min(map.getBoundsZoom(bounds), LOCATE_ZOOM_LEVEL)); } }}
          />
        );
      })}
    </>
  );
}


function MapCenterTracker({ onCenterChange }: { onCenterChange: (lat: number, lon: number) => void }) {
  const map = useMapEvents({ moveend: () => { const c = map.getCenter(); onCenterChange(c.lat, c.lng); } });
  return null;
}

function FitRouteBounds({ polyline }: { polyline: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (polyline.length < 2) return;
    const bounds = L.latLngBounds(polyline); map.fitBounds(bounds, { padding: [48, 48] });
  }, [polyline, map]);
  return null;
}

export default function MapComponent({
  vehicles = [], selectedCarId = null, instructors = [], selectedInstructorId = null, serviceType = 'car', userLocation = null, searchCenter = null, searchRadius = 20, carFocusEvent = { id: 0, carId: null, instructorId: null, openPopup: false, forceRecenter: false }, onSelectCar, onSelectInstructor, pickingMode = false, pickingPurpose = 'vehicle', draftLocation = null, onLocationPick, onRecenter, routePolyline = null, parkingSpots = [], onCenterChange, onNavigateToParking, onNavigateToCar, onNavigateToTarget
}: MapComponentProps) {
  const center: [number, number] = [45.4947, -73.5779];
  const tileUrl = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png';
  const carsWithCoords = vehicles.filter(v => v.latitude != null && v.longitude != null);
  const instructorsWithCoords = instructors.filter(i => i.latitude != null && i.longitude != null);
  const visibleCars = carsWithCoords.filter(car => !(pickingMode && draftLocation && selectedCarId != null && car.id === selectedCarId));
  const visibleInstructors = instructorsWithCoords.filter(inst => !(pickingMode && draftLocation && selectedInstructorId != null && inst.id === selectedInstructorId));
  const markerRefs = useRef<Record<string, LeafletMarker | null>>({});
  const draftMarkerRef = useRef<LeafletMarker | null>(null);
  const wasPickingModeRef = useRef<boolean>(pickingMode);
  const selectedCar = carsWithCoords.find(car => Number(car.id) === Number(selectedCarId)) ?? null;

  useEffect(() => {
    const isCar = selectedCarId != null;
    const activeId = selectedCarId ?? selectedInstructorId;
    if (activeId == null || !carFocusEvent.openPopup || carFocusEvent.id === 0) return;
    
    if (pickingMode && draftLocation) { 
      draftMarkerRef.current?.openPopup(); 
      return; 
    }

    const tryOpen = () => {
      const key = isCar ? `car-${activeId}` : `inst-${activeId}`;
      const marker = markerRefs.current[key];
      if (marker) {
        marker.openPopup();
        return true;
      }
      return false;
    };

    if (!tryOpen()) {
      // Retry more aggressively and for longer to account for fly durations
      const timers = [100, 300, 600, 1000, 1500].map(ms => window.setTimeout(tryOpen, ms));
      return () => timers.forEach(clearTimeout);
    }
  }, [selectedCarId, selectedInstructorId, carFocusEvent, pickingMode, draftLocation, vehicles, instructors]);

  useEffect(() => {
    const wasPickingMode = wasPickingModeRef.current; wasPickingModeRef.current = pickingMode;
    const activeId = selectedCarId ?? selectedInstructorId;
    const isCar = selectedCarId != null;
    if (wasPickingMode && !pickingMode && activeId != null) {
      window.setTimeout(() => {
        const key = isCar ? `car-${activeId}` : `inst-${activeId}`;
        markerRefs.current[key]?.openPopup();
      }, 0);
    }
  }, [pickingMode, selectedCarId, selectedInstructorId]);

  const pickingBannerText = useMemo(() => {
    if (pickingPurpose === 'vehicle') return 'Click on the map to set the vehicle location';
    if (pickingPurpose === 'instructor') return 'Click on the map to set the instructor location';
    if (pickingPurpose === 'search') {
      return serviceType === 'class'
        ? 'Click on the map to set the instructor location'
        : 'Click on the map to set your search center';
    }
    return 'Click on the map';
  }, [pickingPurpose, serviceType]);

  const draftIcon = useMemo(() => {
    if (pickingPurpose === 'search') {
      return reticleIcon;
    }
    if (pickingPurpose === 'instructor' || (pickingPurpose === 'vehicle' && serviceType === 'class')) {
      return instructorIconHighlighted;
    }
    return carIconHighlighted;
  }, [pickingPurpose, serviceType]);

  const selectedCarIdRef = useRef<number | null>(selectedCarId);
  const selectedInstructorIdRef = useRef<number | null>(selectedInstructorId);

  useEffect(() => {
    selectedCarIdRef.current = selectedCarId;
  }, [selectedCarId]);

  useEffect(() => {
    selectedInstructorIdRef.current = selectedInstructorId;
  }, [selectedInstructorId]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      {pickingMode && <div className="map-picking-banner">{pickingBannerText}</div>}
      {onRecenter && (
        <button onClick={(e) => { e.stopPropagation(); onRecenter(); }} className="map-recenter-btn" style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 1000, width: '48px', height: '48px', borderRadius: '10px', background: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#646cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" fill="#646cff" fillOpacity="0.3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9" strokeOpacity="0.5"/></svg>
        </button>
      )}
      <MapContainer center={center} zoom={15} minZoom={10} maxZoom={18} attributionControl={false} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer key={tileUrl} url={tileUrl} />
        {onCenterChange && <MapCenterTracker onCenterChange={onCenterChange} />}
        {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} zIndexOffset={1000}><Popup><strong>You are here</strong></Popup></Marker>}
        {routePolyline && routePolyline.length >= 2 && (<><Polyline positions={routePolyline} color="#646cff" weight={5} opacity={0.85} /><FitRouteBounds polyline={routePolyline} /></>)}
        {parkingSpots.map(spot => (
          <Marker key={`parking-${spot.lat}-${spot.lon}`} position={[spot.lat, spot.lon]} icon={parkingIcon}>
            <Popup autoPan={false}>
              <div style={{ fontFamily: 'inherit', minWidth: 120 }}>
                <strong>{spot.name}</strong>
                {onNavigateToParking && (
                  <><br /><button style={{ marginTop: 6, fontSize: '0.82em', cursor: 'pointer' }} onClick={() => onNavigateToParking(spot.lat, spot.lon, spot.name)}>Directions here</button></>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {!pickingMode && <FlyToSelected vehicles={carsWithCoords} instructors={instructorsWithCoords} focusEvent={carFocusEvent} userLocation={userLocation} />}
        {!pickingMode && onSelectCar && <DeselectOnMapClick onDeselect={() => { onSelectCar(null); onSelectInstructor?.(null); }} />}
        {!pickingMode && searchCenter && (
          <><Marker position={[searchCenter.lat, searchCenter.lng]} icon={reticleIcon}><Popup><strong>Search Center</strong></Popup></Marker>
          {serviceType !== 'class' && searchRadius < 50 && (
            <Circle 
              center={[searchCenter.lat, searchCenter.lng]} 
              radius={searchRadius * 1000} 
              pathOptions={{ color: '#646cff', fillColor: '#646cff', fillOpacity: 0.1, weight: 2, dashArray: '5, 10' }} 
            />
          )}
          <FlyToSearchCenter searchCenter={searchCenter} searchRadius={serviceType === 'class' ? 2 : searchRadius} /></>
        )}
        {pickingMode && onLocationPick && <><PickingClickHandler onPick={onLocationPick} /><PickingCursor /></>}
        {pickingMode && draftLocation && (
          <><Marker position={[draftLocation.lat, draftLocation.lng]} icon={draftIcon} ref={(ref) => { draftMarkerRef.current = ref; }}><Popup autoPan={false}><strong>{pickingPurpose === 'vehicle' ? (selectedCar?.makeModel ?? 'New Vehicle') : pickingPurpose === 'instructor' ? 'Instructor Location' : 'Search Center'}</strong></Popup></Marker>
          {pickingPurpose === 'search' && (
            <>
              {serviceType !== 'class' && searchRadius < 50 && (
                <Circle 
                  center={[draftLocation.lat, draftLocation.lng]} 
                  radius={searchRadius * 1000} 
                  pathOptions={{ color: '#646cff', fillColor: '#646cff', fillOpacity: 0.1, weight: 2, dashArray: '5, 10' }} 
                />
              )}
              <FlyToSearchCenter searchCenter={draftLocation} searchRadius={serviceType === 'class' ? 2 : searchRadius} />
            </>
          )}
          <FlyToDraft draftLocation={draftLocation} /></>
        )}
        {!pickingMode && <ClusteredCarMarkers cars={visibleCars} selectedCarId={selectedCarId} markerRefs={markerRefs} onSelectCar={onSelectCar} onNavigateToCar={onNavigateToCar} selectedCarIdRef={selectedCarIdRef} />}
        {!pickingMode && <ClusteredInstructorMarkers instructors={visibleInstructors} selectedInstructorId={selectedInstructorId} markerRefs={markerRefs} onSelectInstructor={onSelectInstructor} onNavigateToTarget={onNavigateToTarget} selectedInstructorIdRef={selectedInstructorIdRef} />}
      </MapContainer>
    </div>
  );
}
