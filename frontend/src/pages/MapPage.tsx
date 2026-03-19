import { useState, useEffect, useCallback } from 'react';
import MapComponent from '../components/MapComponent';
import VehicleSidebar from '../components/VehicleSidebar';
import { useAuth } from '../contexts/AuthContext';
import type { CarData } from '../services/vehicleService';
import { fetchVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/vehicleService';
import { reverseGeocode } from '../services/geocodingService';
import type { DraftLocation } from '../components/VehicleFormModal';

export default function MapPage() {
  const { isAuthenticated, role, userId } = useAuth();
  const isCarProvider = isAuthenticated && role === 'CAR_PROVIDER';

  const [vehicles, setVehicles] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);

  const [pickingMode, setPickingMode] = useState(false);
  const [draftLocation, setDraftLocation] = useState<DraftLocation | null>(null);

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
    if (!userId) return;
    const created = await createVehicle(userId, data);
    setVehicles((prev) => [...prev, created]);
  };

  const handleUpdateVehicle = async (carId: number, data: Omit<CarData, 'id'>) => {
    if (!userId) return;
    const updated = await updateVehicle(userId, carId, data);
    setVehicles((prev) => prev.map((c) => (c.id === carId ? updated : c)));
  };

  const handleDeleteVehicle = async (carId: number) => {
    if (!userId) return;
    await deleteVehicle(userId, carId);
    setVehicles((prev) => prev.filter((c) => c.id !== carId));
    if (selectedCarId === carId) setSelectedCarId(null);
  };

  const handleFormOpen = (car: CarData | null) => {
    setPickingMode(true);
    setSelectedCarId(null);
    if (car?.latitude != null && car?.longitude != null) {
      setDraftLocation({ lat: car.latitude, lng: car.longitude, address: car.location });
    } else {
      setDraftLocation(null);
    }
  };

  const handleFormClose = () => {
    setPickingMode(false);
    setDraftLocation(null);
  };

  const handleLocationChange = (loc: DraftLocation) => {
    setDraftLocation(loc);
  };

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
          onUpdateVehicle={handleUpdateVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onSelectCar={setSelectedCarId}
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
            onSelectCar={setSelectedCarId}
            pickingMode={pickingMode}
            draftLocation={draftLocation}
            onLocationPick={handleMapLocationPick}
          />
        </main>
      </div>
    </div>
  );
}
