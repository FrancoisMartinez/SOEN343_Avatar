import { useState, useEffect, useCallback } from 'react';
import MapComponent from '../components/MapComponent';
import VehicleSidebar from '../components/VehicleSidebar';
import InstructorSidebar from '../components/InstructorSidebar';
import InstructorSearchSidebar from '../components/InstructorSearchSidebar';
import NavigationPanel from '../components/NavigationPanel';
import ParkingPanel from '../components/ParkingPanel';
import AutoMatchPanel from '../components/AutoMatchPanel';
import { useAuth } from '../contexts/AuthContext';
import type { CarData, SearchFilters } from '../services/vehicleService';
import { fetchProviderVehicles, createVehicle, updateVehicle, deleteVehicle, searchVehicles } from '../services/vehicleService';
import type { InstructorData } from '../services/instructorService';
import { fetchInstructorsNearby } from '../services/instructorService';
import { updateWeeklyAvailability } from '../services/availabilityService';
import { reverseGeocode } from '../services/geocodingService';
import type { DraftLocation } from '../components/VehicleFormModal';
import type { AvailabilitySlot } from '../types/availability';
import type { ParkingSpot } from '../services/parkingService';
import type { MatchResultData } from '../services/matchingService';
import './MapPage.css';

type FocusOptions = {
  openPopup?: boolean;
  forceRecenter?: boolean;
};

type ServiceType = 'car' | 'class' | 'package';

export default function MapPage() {
  const { isAuthenticated, role, userId } = useAuth();
  const isCarProvider = isAuthenticated && role === 'CAR_PROVIDER';
  const isLearner = isAuthenticated && role === 'LEARNER';
  const isInstructor = isAuthenticated && role === 'INSTRUCTOR';

  const [serviceType, setServiceType] = useState<ServiceType>('car');
  const [vehicles, setVehicles] = useState<CarData[]>([]);
  const [instructors, setInstructors] = useState<InstructorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);

  const [focusEvent, setFocusEvent] = useState({
    id: 0,
    carId: null as number | null,
    instructorId: null as number | null,
    openPopup: false,
    forceRecenter: false,
  });

  const [pickingMode, setPickingMode] = useState(false);
  const [pickingPurpose, setPickingPurpose] = useState<'search' | 'vehicle' | 'instructor'>('vehicle');
  const [draftLocation, setDraftLocation] = useState<DraftLocation | null>(null);
  const [searchCenter, setSearchCenter] = useState<DraftLocation | null>(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routePolyline, setRoutePolyline] = useState<[number, number][] | null>(null);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [parkingActive, setParkingActive] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({ lat: 45.4947, lon: -73.5779 });
  const [navigateToDestination, setNavigateToDestination] = useState<{ lat: number; lon: number; name: string } | null>(null);

  const handleSearchVehicles = useCallback(async (filters: SearchFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const finalFilters = { ...filters };
      if (!finalFilters.lat || !finalFilters.lng) {
        finalFilters.radius = undefined;
        finalFilters.lat = undefined;
        finalFilters.lng = undefined;
      }
      
      // Default to only available cars unless explicitly requested otherwise
      if (finalFilters.isAvailable === undefined) {
        finalFilters.isAvailable = true;
      }
      
      const data = await searchVehicles(finalFilters);
      setVehicles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchInstructors = useCallback(async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const instructorFilters = {
        lat: filters.lat || 45.5,
        lng: filters.lng || -73.6,
        radius: filters.radius || 10,
        ...filters
      };
      
      const data = await fetchInstructorsNearby(instructorFilters);
      setInstructors(data);
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
      const data = await fetchProviderVehicles(userId);
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleCarFocus = useCallback((carId: number | null, options: FocusOptions = {}) => {
    setSelectedCarId(carId);
    setSelectedInstructorId(null);
    setFocusEvent((prev) => ({
      id: prev.id + 1,
      carId,
      instructorId: null,
      openPopup: Boolean(options.openPopup) && carId != null,
      forceRecenter: Boolean(options.forceRecenter) && carId != null,
    }));
  }, []);

  const handleInstructorFocus = useCallback((instructorId: number | null, options: FocusOptions = {}) => {
    setSelectedInstructorId(instructorId);
    setSelectedCarId(null);
    setFocusEvent((prev) => ({
      id: prev.id + 1,
      carId: null,
      instructorId,
      openPopup: Boolean(options.openPopup) && instructorId != null,
      forceRecenter: Boolean(options.forceRecenter) && instructorId != null,
    }));
  }, []);

  const handleFormClose = useCallback(() => {
    setPickingMode(false);
    setDraftLocation(null);
    if (selectedCarId != null) handleCarFocus(selectedCarId, { openPopup: true });
    else if (selectedInstructorId != null) handleInstructorFocus(selectedInstructorId, { openPopup: true });
  }, [selectedCarId, selectedInstructorId, handleCarFocus, handleInstructorFocus]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn('Location watcher error:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (isLearner) {
      if (serviceType === 'car') {
        handleSearchVehicles({});
      } else if (serviceType === 'class') {
        handleSearchInstructors({});
      }
      // Reset picking mode and search center when switching between service tabs 
      // to prevent search reticles or placement markers from lingering.
      handleFormClose();
      setSearchCenter(null);
    }
  }, [isLearner, serviceType, handleSearchVehicles, handleSearchInstructors, handleFormClose]);

  useEffect(() => {
    if (isCarProvider) {
      loadVehicles();
    }
  }, [isCarProvider, loadVehicles]);

  const handleAddVehicle = async (data: Omit<CarData, 'id' | 'providerId'>) => {
    if (!userId) throw new Error('User not authenticated');
    const created = await createVehicle({ ...data, providerId: userId });
    setVehicles((prev) => [...prev, created]);
    return created;
  };

  const handleUpdateVehicle = async (carId: number, data: Omit<CarData, 'id' | 'providerId'>) => {
    if (!userId) return;
    const updated = await updateVehicle(userId, carId, data);
    setVehicles((prev) => prev.map((c) => (c.id === carId ? updated : c)));
  };

  const handleSetVehicleAvailability = async (carId: number, slots: AvailabilitySlot[]) => {
    if (!userId) throw new Error('User not authenticated');
    await updateWeeklyAvailability(userId, carId, { slots });
    setVehicles((prev) => prev.map((car) => (car.id === carId ? { ...car, available: slots.length > 0 } : car)));
  };

  const handleDeleteVehicle = async (carId: number) => {
    if (!userId) return;
    await deleteVehicle(userId, carId);
    setVehicles((prev) => prev.filter((c) => c.id !== carId));
    if (selectedCarId === carId) setSelectedCarId(null);
  };

  const handleRecenter = () => {
    const coords = userLocation || { lat: 45.4947, lng: -73.5779 };
    setFocusEvent((prev) => ({
      id: prev.id + 1,
      carId: 999999,
      instructorId: null,
      openPopup: false,
      forceRecenter: true,
    }));
    setUserLocation(coords);
  };

  const handleFormOpen = useCallback((item: CarData | InstructorData | null, purpose: 'search' | 'vehicle' | 'instructor' = 'vehicle') => {
    setPickingMode(true);
    
    // Auto-detect instructor purpose if purpose is 'vehicle' but we are in class mode or have an instructor item
    let finalPurpose = purpose;
    if (purpose === 'vehicle' && (serviceType === 'class' || (item && 'travelRadius' in item))) {
      finalPurpose = 'instructor';
    }
    setPickingPurpose(finalPurpose);

    if (item?.id != null) {
      if (serviceType === 'car') handleCarFocus(item.id, { openPopup: true, forceRecenter: true });
      else handleInstructorFocus(item.id, { openPopup: true, forceRecenter: true });
    } else {
      setSelectedCarId(null);
      setSelectedInstructorId(null);
    }

    const lat = (item as any)?.latitude;
    const lng = (item as any)?.longitude;
    const loc = (item as any)?.location || (item as any)?.fullName || '';
    if (lat != null && lng != null) setDraftLocation({ lat, lng, address: loc });
    else setDraftLocation(null);
  }, [handleCarFocus, handleInstructorFocus, serviceType]);

  const handleLocationChange = (loc: DraftLocation) => {
    if (!loc.address) {
      setDraftLocation(null);
      if (isLearner || pickingPurpose === 'search') setSearchCenter(null);
    } else {
      setDraftLocation(loc);
      if (isLearner || pickingPurpose === 'search') setSearchCenter(loc);
    }
  };

  const handleLocateCar = (carId: number) => {
    handleCarFocus(carId, { openPopup: true, forceRecenter: true });
  };

  const handleAutoMatchSelect = (result: MatchResultData) => {
    const matchedCar = vehicles.find((v) => v.id === result.carId);
    if (matchedCar) {
      handleCarFocus(result.carId, { openPopup: true, forceRecenter: true });
    } else {
      // Car not in vehicles list, add it
      const newCar: CarData = {
        id: result.carId,
        makeModel: result.makeModel,
        transmissionType: result.transmissionType,
        location: result.location,
        latitude: result.latitude,
        longitude: result.longitude,
        available: true,
        hourlyRate: result.hourlyRate,
      };
      setVehicles([...vehicles, newCar]);
      handleCarFocus(result.carId, { openPopup: true, forceRecenter: true });
    }
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
    if (pickingPurpose === 'search') setSearchCenter(loc);
    try {
      const address = await reverseGeocode(lat, lng);
      const updatedLoc = { lat, lng, address };
      setDraftLocation(updatedLoc);
      if (pickingPurpose === 'search') setSearchCenter(updatedLoc);
    } catch {}
  }, [pickingPurpose]);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {isInstructor && <InstructorSidebar />}
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
          onLocateCar={handleCarFocus}
          onRetry={loadVehicles}
          onFormOpen={handleFormOpen}
          onFormClose={handleFormClose}
          onLocationChange={handleLocationChange}
        />
      )}
      {isLearner && (
        <div className="learner-sidebar-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="service-type-toggle" style={{ display: 'flex', gap: '4px', padding: '8px', background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {(['car', 'class', 'package'] as ServiceType[]).map((type) => (
              <button
                key={type}
                onClick={() => setServiceType(type)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: '1px solid',
                  cursor: 'pointer',
                  background: serviceType === type ? '#646cff' : 'transparent',
                  color: serviceType === type ? '#fff' : 'rgba(255,255,255,0.6)',
                  borderColor: serviceType === type ? '#646cff' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize'
                }}
              >
                {type === 'car' ? 'Car Only' : type === 'class' ? 'Class Only' : 'AutoMatch'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {serviceType === 'car' && (
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
                onSearch={handleSearchVehicles}
                onClearSearch={handleClearSearch}
                onLocateCar={handleLocateCar}
                onRetry={() => handleSearchVehicles()}
                onFormOpen={handleFormOpen}
                onFormClose={handleFormClose}
                onLocationChange={handleLocationChange}
                userLocation={userLocation}
                onAutoMatchSelect={handleAutoMatchSelect}
              />
            )}
            {serviceType === 'class' && (
              <InstructorSearchSidebar
                instructors={instructors}
                loading={loading}
                error={error}
                selectedInstructorId={selectedInstructorId}
                draftLocation={draftLocation}
                searchCenter={searchCenter}
                onSearch={handleSearchInstructors}
                onClearSearch={() => handleSearchInstructors({})}
                onLocateInstructor={handleInstructorFocus}
                onRetry={() => handleSearchInstructors()}
                onFormOpen={handleFormOpen}
                onFormClose={handleFormClose}
                onLocationChange={handleLocationChange}
              />
            )}
            {serviceType === 'package' && (
              <AutoMatchPanel
                vehicles={vehicles}
                onAutoMatchSelect={handleAutoMatchSelect}
                onClearSearch={handleClearSearch}
              />
            )}
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', boxSizing: 'border-box', position: 'relative' }}>
        <main style={{ flex: 1, width: '100%', position: 'relative' }}>
          <MapComponent
            vehicles={isCarProvider || (isLearner && serviceType === 'car') ? vehicles : []}
            instructors={isLearner && serviceType === 'class' ? instructors : []}
            serviceType={serviceType}
            selectedCarId={selectedCarId}
            selectedInstructorId={selectedInstructorId}
            userLocation={userLocation}
            searchCenter={searchCenter}
            searchRadius={searchRadius}
            carFocusEvent={{
              id: focusEvent.id,
              carId: focusEvent.carId,
              instructorId: focusEvent.instructorId,
              openPopup: focusEvent.openPopup,
              forceRecenter: focusEvent.forceRecenter
            }}
            onSelectCar={(carId) => handleCarFocus(carId)}
            onSelectInstructor={(id) => handleInstructorFocus(id)}
            pickingMode={pickingMode}
            pickingPurpose={pickingPurpose}
            draftLocation={draftLocation}
            onLocationPick={handleMapLocationPick}
            onRecenter={handleRecenter}
            routePolyline={routePolyline}
            parkingSpots={parkingSpots}
            onCenterChange={(lat, lon) => setMapCenter({ lat, lon })}
            onNavigateToParking={(lat, lon, name) => setNavigateToDestination({ lat, lon, name })}
            onNavigateToCar={(lat, lon, name) => setNavigateToDestination({ lat, lon, name })}
          />
          {isAuthenticated && (
            <div className="map-controls-overlay">
              <NavigationPanel onRoute={setRoutePolyline} navigateTo={navigateToDestination} />
              <ParkingPanel mapCenter={mapCenter} onParkingSpots={setParkingSpots} active={parkingActive} onToggle={setParkingActive} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
