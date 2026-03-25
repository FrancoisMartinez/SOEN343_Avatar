import { useState, useEffect, useCallback } from 'react';
import MapComponent from '../components/MapComponent';
import VehicleSidebar from '../components/VehicleSidebar';
import { useAuth } from '../contexts/AuthContext';
import type { CarData, SearchFilters } from '../services/vehicleService';
import { fetchVehicles, createVehicle, updateVehicle, deleteVehicle, searchVehicles } from '../services/vehicleService';
import { updateWeeklyAvailability } from '../services/availabilityService';
import { reverseGeocode } from '../services/geocodingService';
import type { DraftLocation } from '../components/VehicleFormModal';
import type { AvailabilitySlot } from '../types/availability';

type CarFocusOptions = {
  openPopup?: boolean;
  forceRecenter?: boolean;
};

export default function MapPage() {
  const { isAuthenticated, role, userId } = useAuth();
  const isCarProvider = isAuthenticated && role === 'CAR_PROVIDER';
  const isLearner = isAuthenticated && role === 'LEARNER';

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
  const [pickingPurpose, setPickingPurpose] = useState<'search' | 'vehicle'>('vehicle');
  const [draftLocation, setDraftLocation] = useState<DraftLocation | null>(null);
  const [searchCenter, setSearchCenter] = useState<DraftLocation | null>(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 45.4947, lng: -73.5779 });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleSearchVehicles = useCallback(async (filters: SearchFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const finalFilters = { ...filters };
      // Only include radius if we have a center, otherwise radius is meaningless for a broad search
      if (!finalFilters.lat || !finalFilters.lng) {
        finalFilters.radius = undefined;
        finalFilters.lat = undefined;
        finalFilters.lng = undefined;
      }

      const data = await searchVehicles(finalFilters);
      setVehicles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
      },
      (err) => {
        console.warn('Location watcher error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const [hasInitialSearchPerformed, setHasInitialSearchPerformed] = useState(false);

  useEffect(() => {
    if (isLearner && !hasInitialSearchPerformed) {
      setHasInitialSearchPerformed(true);
      // Default initial search is broad (anywhere)
      handleSearchVehicles({});
      
      // If we have user location, we can center the map but don't force filter yet
      if (userLocation) {
        setMapCenter(userLocation);
      }
    }
  }, [isLearner, hasInitialSearchPerformed, handleSearchVehicles, userLocation]);

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

  const handleRecenter = () => {
    if (userLocation) {
      setCarFocusEvent((prev) => ({
        id: prev.id + 1,
        carId: 999999,
        openPopup: false,
        forceRecenter: true,
      }));
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setCarFocusEvent((prev) => ({
          id: prev.id + 1,
          carId: 999999,
          openPopup: false,
          forceRecenter: true,
        }));
      }, (err) => {
        console.warn('Recenter geolocation error:', err);
        alert('Could not get your location. Please check your browser permissions.');
      });
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleFormOpen = useCallback((car: CarData | null, purpose: 'search' | 'vehicle' = 'vehicle') => {
    setPickingMode(true);
    setPickingPurpose(purpose);

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
  }, [handleCarFocus]);

  const handleSearchFormOpen = useCallback((car: CarData | null) => {
    handleFormOpen(car, 'search');
  }, [handleFormOpen]);

  const handleVehicleFormOpen = useCallback((car: CarData | null) => {
    handleFormOpen(car, 'vehicle');
  }, [handleFormOpen]);

  const handleFormClose = useCallback(() => {
    setPickingMode(false);
    setDraftLocation(null);

    if (selectedCarId != null) {
      handleCarFocus(selectedCarId, { openPopup: true, forceRecenter: false });
    }
  }, [selectedCarId, handleCarFocus]);

  const handleLocationChange = (loc: DraftLocation) => {
    if (!loc.address) {
      setDraftLocation(null);
      if (isLearner || pickingPurpose === 'search') {
        setSearchCenter(null);
      }
    } else {
      setDraftLocation(loc);
      if (isLearner || pickingPurpose === 'search') {
        setSearchCenter(loc);
      }
    }
  };

  const handleLocateCar = (carId: number) => {
    handleCarFocus(carId, { openPopup: true, forceRecenter: true });
  };

  const handleClearSearch = useCallback(() => {
    setSearchCenter(null);
    setSearchRadius(5);
    handleSearchVehicles({}); // Broad search
  }, [handleSearchVehicles]);

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
    const loc = { lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
    setDraftLocation(loc);
    if (pickingPurpose === 'search') {
      setSearchCenter(loc);
    }

    try {
      const address = await reverseGeocode(lat, lng);
      const updatedLoc = { lat, lng, address };
      setDraftLocation(updatedLoc);
      if (pickingPurpose === 'search') {
        setSearchCenter(updatedLoc);
      }
    } catch {
    }
  }, [pickingPurpose]);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {isCarProvider && (
        <VehicleSidebar
          mode="manage"
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
          onFormOpen={handleVehicleFormOpen}
          onFormClose={handleFormClose}
          onLocationChange={handleLocationChange}
        />
      )}
      {isLearner && (
        <VehicleSidebar
          mode="search"
          vehicles={vehicles}
          loading={loading}
          error={error}
          selectedCarId={selectedCarId}
          draftLocation={draftLocation}
          searchCenter={searchCenter}
          searchRadius={searchRadius}
          onSearchRadiusChange={setSearchRadius}
          onSearch={(filters) => {
            handleSearchVehicles(filters);
          }}
          onClearSearch={handleClearSearch}
          onLocateCar={handleLocateCar}
          onRetry={() => handleSearchVehicles()}
          onFormOpen={handleSearchFormOpen}
          onFormClose={handleFormClose}
          onLocationChange={handleLocationChange}
        />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', boxSizing: 'border-box', position: 'relative' }}>
        <main style={{ flex: 1, width: '100%', position: 'relative' }}>
          <MapComponent
            vehicles={isCarProvider || isLearner ? vehicles : []}
            selectedCarId={selectedCarId}
            userLocation={userLocation}
            searchCenter={searchCenter}
            searchRadius={searchRadius}
            carFocusEvent={carFocusEvent}
            onSelectCar={(carId) => handleCarFocus(carId)}
            pickingMode={pickingMode}
            pickingPurpose={pickingPurpose}
            draftLocation={draftLocation}
            onLocationPick={handleMapLocationPick}
            onMapMove={(lat, lng) => setMapCenter({ lat, lng })}
            onRecenter={handleRecenter}
          />
        </main>
      </div>
    </div>
  );
}
