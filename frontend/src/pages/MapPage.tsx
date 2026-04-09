import { useState, useEffect, useCallback, useMemo } from 'react';
import MapComponent from '../components/MapComponent';
import VehicleSidebar from '../components/VehicleSidebar';
import InstructorSearchSidebar from '../components/InstructorSearchSidebar';
import AutoMatchPanel from '../components/AutoMatchPanel';
import NavigationPanel from '../components/NavigationPanel';
import ParkingPanel from '../components/ParkingPanel';
import { searchVehicles, fetchProviderVehicles, type SearchFilters, type CarData } from '../services/vehicleService';
import { fetchInstructorsNearby, type InstructorData } from '../services/instructorService';
import { type ParkingSpot } from '../services/parkingService';
import { useAuth } from '../contexts/AuthContext';
import { type DraftLocation } from '../components/VehicleFormModal';
import { type MatchResultData } from '../services/matchingService';
import './MapPage.css';

type ServiceType = 'car' | 'class' | 'package';

interface FocusOptions {
  openPopup?: boolean;
  forceRecenter?: boolean;
}

export default function MapPage() {
  const { userId, role, isAuthenticated } = useAuth();
  const isCarProvider = role === 'CAR_PROVIDER';
  const isLearner = role === 'LEARNER';

  const [serviceType, setServiceType] = useState<ServiceType>(isCarProvider ? 'car' : 'car');
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
  const [searchRadius, setSearchRadius] = useState(50);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [routePolyline, setRoutePolyline] = useState<[number, number][] | null>(null);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [parkingActive, setParkingActive] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({ lat: 45.4947, lon: -73.5779 });
  const [navigateToDestination, setNavigateToDestination] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [autoMatchResults, setAutoMatchResults] = useState<MatchResultData[]>([]);

  const handleAutoMatchResults = useCallback((results: MatchResultData[]) => {
    setAutoMatchResults(results);
  }, []);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to search vehicles';
      setError(message);
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
    const numericId = carId != null ? Number(carId) : null;
    setSelectedCarId(numericId);
    setSelectedInstructorId(null);
    setFocusEvent((prev) => ({
      id: prev.id + 1,
      carId: numericId,
      instructorId: null,
      openPopup: (options.openPopup !== undefined ? options.openPopup : true) && numericId != null,
      forceRecenter: Boolean(options.forceRecenter) && numericId != null,
    }));
  }, []);

  const handleInstructorFocus = useCallback((instructorId: number | null, options: FocusOptions = {}) => {
    const numericId = instructorId != null ? Number(instructorId) : null;
    setSelectedInstructorId(numericId);
    setSelectedCarId(null);
    setFocusEvent((prev) => ({
      id: prev.id + 1,
      carId: null,
      instructorId: numericId,
      openPopup: (options.openPopup !== undefined ? options.openPopup : true) && numericId != null,
      forceRecenter: Boolean(options.forceRecenter) && numericId != null,
    }));
  }, []);

  const handleFormClose = useCallback(() => {
    setPickingMode(false);
    setDraftLocation(null);
  }, []);

  const handleFormOpen = useCallback((item: any, purpose: 'search' | 'vehicle' | 'instructor' = 'vehicle') => {
    setPickingPurpose(purpose);
    setPickingMode(true);
    if (item && item.latitude != null && item.longitude != null) {
      setDraftLocation({ lat: item.latitude, lng: item.longitude, address: item.location || '' });
    }
    else if (purpose === 'search' && searchCenter) setDraftLocation(searchCenter);
    else setDraftLocation(null);
  }, [searchCenter]);

  const handleLocationChange = (loc: DraftLocation | null) => {
    if (!loc || !loc.address) {
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

  const handleAutoMatchSelect = useCallback(
    (result: MatchResultData) => {
      handleCarFocus(result.carId, { openPopup: true, forceRecenter: true });
    },
    [handleCarFocus]
  );

  const handleClearSearch = useCallback(() => {
    setSearchCenter(null);
    setSearchRadius(50);
    handleSearchVehicles({}); // Broad search
  }, [handleSearchVehicles]);

  useEffect(() => {
    if (isAuthenticated && isCarProvider) {
      void loadVehicles();
    } else if (isAuthenticated && isLearner) {
      void handleSearchVehicles();
      void handleSearchInstructors();
    }
  }, [isAuthenticated, isCarProvider, isLearner, loadVehicles, handleSearchVehicles, handleSearchInstructors]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.error('Geolocation error:', err)
      );
    }
  }, []);

  const handleMapLocationPick = (lat: number, lng: number) => {
    if (!pickingMode) return;
    setDraftLocation({ lat, lng, address: `Selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}` });
  };

  const handleRecenter = () => {
    if (userLocation) {
      handleCarFocus(999999, { forceRecenter: true });
    }
  };

  const displayedVehicles = useMemo(() => {
    if (serviceType === 'package') {
      const matchedVehicles = autoMatchResults.map(r => ({
        id: r.carId,
        makeModel: r.makeModel,
        transmissionType: r.transmissionType,
        location: r.location,
        latitude: r.latitude,
        longitude: r.longitude,
        available: true,
        hourlyRate: r.hourlyRate
      }));
      // Remove duplicates by ID
      const seen = new Set<number>();
      return matchedVehicles.filter(v => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });
    }
    return vehicles;
  }, [serviceType, vehicles, autoMatchResults]);

  const displayedInstructors = useMemo(() => {
    if (serviceType === 'package') {
      const matchedInstructors = autoMatchResults.map(r => ({
        id: r.instructorId,
        fullName: r.instructorName,
        email: '',
        latitude: r.instructorLatitude || 0,
        longitude: r.instructorLongitude || 0,
        hourlyRate: r.instructorHourlyRate,
        rating: r.instructorRating
      })).filter(i => i.latitude !== 0);
      
      const seen = new Set<number>();
      return matchedInstructors.filter(i => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });
    }
    return instructors;
  }, [serviceType, instructors, autoMatchResults]);

  return (
    <div className="map-page" style={{ display: 'flex', flex: 1, width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {isAuthenticated && (
        <div className="learner-sidebar-container">
          {isLearner && (
            <div className="service-tabs">
              <button className={`tab-btn ${serviceType === 'car' ? 'active' : ''}`} onClick={() => setServiceType('car')}>Car Only</button>
              <button className={`tab-btn ${serviceType === 'class' ? 'active' : ''}`} onClick={() => setServiceType('class')}>Class Only</button>
              <button className={`tab-btn ${serviceType === 'package' ? 'active' : ''}`} onClick={() => setServiceType('package')}>Auto-Match</button>
            </div>
          )}
          <div className="sidebar-content">
            {serviceType === 'car' && (
              <VehicleSidebar
                mode={isCarProvider ? 'manage' : 'search'}
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
                userLocation={userLocation}
                onClose={() => setServiceType('car')}
                onLocateCar={handleLocateCar}
                draftLocation={draftLocation}
                searchCenter={searchCenter}
                searchRadius={searchRadius}
                onSearchRadiusChange={setSearchRadius}
                onFormOpen={handleFormOpen}
                onFormClose={handleFormClose}
                onLocationChange={handleLocationChange}
                onClearSearch={handleClearSearch}
                onResults={handleAutoMatchResults}
                selectedCarId={selectedCarId}
                selectedInstructorId={selectedInstructorId}
              />
            )}
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', boxSizing: 'border-box', position: 'relative', height: '100%', minHeight: 0 }}>
        <main style={{ flex: 1, width: '100%', position: 'relative', height: '100%', minHeight: 0 }}>
          <MapComponent
            vehicles={displayedVehicles}
            instructors={displayedInstructors}
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
            onNavigateToTarget={(lat, lon, name) => setNavigateToDestination({ lat, lon, name })}
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
