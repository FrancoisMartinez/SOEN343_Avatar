import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import VehicleCard from './VehicleCard';
import VehicleFormModal from './VehicleFormModal';
import type { CarData } from '../services/vehicleService';
import { fetchVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/vehicleService';
import './VehicleSidebar.css';

export default function VehicleSidebar() {
  const { userId } = useAuth();
  const [vehicles, setVehicles] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarData | null>(null);

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
    loadVehicles();
  }, [loadVehicles]);

  const handleAdd = () => {
    setEditingCar(null);
    setModalOpen(true);
  };

  const handleEdit = (car: CarData) => {
    setEditingCar(car);
    setModalOpen(true);
  };

  const handleDelete = async (carId: number) => {
    if (!userId) return;
    try {
      await deleteVehicle(userId, carId);
      setVehicles((prev) => prev.filter((c) => c.id !== carId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (data: Omit<CarData, 'id'>) => {
    if (!userId) return;
    try {
      if (editingCar) {
        const updated = await updateVehicle(userId, editingCar.id!, data);
        setVehicles((prev) => prev.map((c) => (c.id === editingCar.id ? updated : c)));
      } else {
        const created = await createVehicle(userId, data);
        setVehicles((prev) => [...prev, created]);
      }
      setModalOpen(false);
      setEditingCar(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <aside className="vehicle-sidebar">
      <div className="vehicle-sidebar__header">
        <h2 className="vehicle-sidebar__title">My Vehicles</h2>
        <button className="vehicle-sidebar__add-btn" onClick={handleAdd}>
          + Add Vehicle
        </button>
      </div>

      <div className="vehicle-sidebar__list">
        {loading && (
          <div className="vehicle-sidebar__status">
            <div className="vehicle-sidebar__spinner" />
            Loading vehicles…
          </div>
        )}

        {error && (
          <div className="vehicle-sidebar__status vehicle-sidebar__status--error">
            {error}
            <button className="vehicle-sidebar__retry-btn" onClick={loadVehicles}>Retry</button>
          </div>
        )}

        {!loading && !error && vehicles.length === 0 && (
          <div className="vehicle-sidebar__status vehicle-sidebar__status--empty">
            <p>No vehicles yet.</p>
            <p>Click <strong>+ Add Vehicle</strong> to get started.</p>
          </div>
        )}

        {vehicles.map((car) => (
          <VehicleCard
            key={car.id}
            car={car}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <VehicleFormModal
        isOpen={modalOpen}
        car={editingCar}
        onClose={() => { setModalOpen(false); setEditingCar(null); }}
        onSubmit={handleSubmit}
      />
    </aside>
  );
}
