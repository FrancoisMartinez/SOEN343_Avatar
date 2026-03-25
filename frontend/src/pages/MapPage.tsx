import { useState, useEffect, useCallback } from 'react';
import MapComponent from '../components/MapComponent';
import VehicleSidebar from '../components/VehicleSidebar';
import NavigationPanel from '../components/NavigationPanel';
import ParkingPanel from '../components/ParkingPanel';
import { useAuth } from '../contexts/AuthContext';
import type { CarData } from '../services/vehicleService';
import { fetchVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/vehicleService';
import { updateWeeklyAvailability } from '../services/availabilityService';
import { reverseGeocode } from '../services/geocodingService';
import type { DraftLocation } from '../components/VehicleFormModal';
import type { AvailabilitySlot } from '../types/availability';
import type { ParkingSpot } from '../services/parkingService';

type CarFocusOptions = {
  openPopup?: boolean;
  forceRecenter?: boolean;
};

export default function MapPage() {
  const { isAuthenticated, role, userId } = useAuth();
  const isCarProvider = isAuthenticated && role === 'CAR_PROVIDER';

  const [vehicles, setVehicles] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [carFocusEvent, setCarFocusEvent] = useState({
    id: 0,
    carId: null as number | null,
    openPopup: false,
    forceRecenter: false,
  });

  const [pickingMode, setPickingMode] = useState(false);
  const [draftLocation, setDraftLocation] = useState<DraftLocation | null>(null);
  const [routePolyline, setRoutePolyline] = useState<[number, number][] | null>(null);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [parkingActive, setParkingActive] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({ lat: 45.4947, lon: -73.5779 });
  const [navigateToDestination, setNavigateToDestination] = useState<{ lat: number; lon: number; name: string } | null>(null);

  const loadVehicles = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVehicles(userId);
      setVehicles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isCarProvider) {
      loadVehicles();
    }
  }, [isCarProvider, loadVehicles]);

  const handleAddVehicle = async (data: Omit<CarData, 'id'>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }
    const created = await createVehicle(userId, data);
    setVehicles((prev) => [...prev, created]);
    return created;
  };

  const handleUpdateVehicle = async (carId: number, data: Omit<CarData, 'id'>) => {
    if (!userId) return;
    const updated = await updateVehicle(userId, carId, data);
    setVehicles((prev) => prev.map((c) => (c.id === carId ? updated : c)));
  };

  const handleSetVehicleAvailability = async (carId: number, slots: AvailabilitySlot[]) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    await updateWeeklyAvailability(userId, carId, { slots });
    setVehicles((prev) => prev.map((car) => (car.id === carId ? { ...car, available: slots.length > 0 } : car)));
  };

  const handleDeleteVehicle = async (carId: number) => {
    if (!userId) return;
    await deleteVehicle(userId, carId);
    setVehicles((prev) => prev.filter((c) => c.id !== carId));
    if (selectedCarId === carId) {
      setSelectedCarId(null);
    }
  };

  const handleCarFocus = useCallback((carId: number | null, options: CarFocusOptions = {}) => {
    const openPopup = Boolean(options.openPopup) && carId != null;
    const forceRecenter = Boolean(options.forceRecenter) && carId != null;

    setSelectedCarId(carId);
    setCarFocusEvent((prev) => ({
      id: prev.id + 1,
      carId,
      openPopup,
      forceRecenter,
    }));
  }, []);

  const handleFormOpen = (car: CarData | null) => {
    setPickingMode(true);

    // When editing an existing car, reuse locate behavior so focus/selection stays consistent.
    if (car?.id != null) {
      handleCarFocus(car.id, { openPopup: true, forceRecenter: true });
    } else {
      handleCarFocus(null);
    }

    if (car?.latitude != null && car?.longitude != null) {
      setDraftLocation({ lat: car.latitude, lng: car.longitude, address: car.location });
    } else {
      setDraftLocation(null);
    }
  };

  const handleFormClose = () => {
    setPickingMode(false);
    setDraftLocation(null);

    // If a vehicle remains selected, re-open its popup once we return to normal map mode.
    if (selectedCarId != null) {
      handleCarFocus(selectedCarId, { openPopup: true, forceRecenter: false });
    }
  };

  const handleLocationChange = (loc: DraftLocation) => {
    setDraftLocation(loc);
  };

  const handleLocateCar = (carId: number) => {
    handleCarFocus(carId, { openPopup: true, forceRecenter: true });
  };

  useEffect(() => {
    if (selectedCarId == null) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const clickedCarElement = target.closest(
        '.vehicle-card, .leaflet-marker-icon, .leaflet-popup, .leaflet-popup-content, .leaflet-popup-content-wrapper'
      );

      if (clickedCarElement) {
        return;
      }

      handleCarFocus(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [selectedCarId, handleCarFocus]);

  const handleMapLocationPick = useCallback(async (lat: number, lng: number) => {
    setDraftLocation({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    try {
      const address = await reverseGeocode(lat, lng);
      setDraftLocation({ lat, lng, address });
    } catch {
      // keep the coordinate-based fallback already set above
    }
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {isCarProvider && (
        <VehicleSidebar
          vehicles={vehicles}
          loading={loading}
          error={error}
          selectedCarId={selectedCarId}
          draftLocation={draftLocation}
          onAddVehicle={handleAddVehicle}
          onSetVehicleAvailability={handleSetVehicleAvailability}
          onUpdateVehicle={handleUpdateVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onLocateCar={handleLocateCar}
          onRetry={loadVehicles}
          onFormOpen={handleFormOpen}
          onFormClose={handleFormClose}
          onLocationChange={handleLocationChange}
        />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', boxSizing: 'border-box', position: 'relative' }}>
        <main style={{ flex: 1, width: '100%', position: 'relative' }}>
          <MapComponent
            vehicles={isCarProvider ? vehicles : []}
            selectedCarId={selectedCarId}
            carFocusEvent={carFocusEvent}
            onSelectCar={(carId) => handleCarFocus(carId)}
            pickingMode={pickingMode}
            draftLocation={draftLocation}
            onLocationPick={handleMapLocationPick}
            routePolyline={routePolyline}
            parkingSpots={parkingSpots}
            onCenterChange={(lat, lon) => setMapCenter({ lat, lon })}
            onNavigateToParking={(lat, lon, name) => setNavigateToDestination({ lat, lon, name })}
          />
          {isAuthenticated && (
            <>
              <NavigationPanel
                onRoute={(polyline) => setRoutePolyline(polyline)}
                onClear={() => setRoutePolyline(null)}
                navigateTo={navigateToDestination}
              />
              <ParkingPanel
                mapCenter={mapCenter}
                onParkingSpots={setParkingSpots}
                onNavigateTo={(lat, lon, name) => setNavigateToDestination({ lat, lon, name })}
                active={parkingActive}
                onToggle={setParkingActive}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
