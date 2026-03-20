import { useEffect, useRef, useState } from 'react';
import VehicleCard from './VehicleCard';
import VehicleFormModal from './VehicleFormModal';
import type { DraftLocation } from './VehicleFormModal';
import type { CarData } from '../services/vehicleService';
import './VehicleSidebar.css';

interface VehicleSidebarProps {
  vehicles: CarData[];
  loading: boolean;
  error: string | null;
  selectedCarId: number | null;
  draftLocation: DraftLocation | null;
  onAddVehicle: (data: Omit<CarData, 'id'>) => Promise<void>;
  onUpdateVehicle: (carId: number, data: Omit<CarData, 'id'>) => Promise<void>;
  onDeleteVehicle: (carId: number) => Promise<void>;
  onSelectCar: (carId: number | null) => void;
  onRetry: () => void;
  onFormOpen: (car: CarData | null) => void;
  onFormClose: () => void;
  onLocationChange: (loc: DraftLocation) => void;
}

export default function VehicleSidebar({
  vehicles,
  loading,
  error,
  selectedCarId,
  draftLocation,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onSelectCar,
  onRetry,
  onFormOpen,
  onFormClose,
  onLocationChange,
}: VehicleSidebarProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarData | null>(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedCarId == null) return;
    const selectedCard = cardRefs.current[selectedCarId];
    if (!selectedCard) return;

    selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    selectedCard.focus({ preventScroll: true });
  }, [selectedCarId]);

  const handleAdd = () => {
    setEditingCar(null);
    setFormOpen(true);
    onFormOpen(null);
  };

  const handleEdit = (car: CarData) => {
    setEditingCar(car);
    setFormOpen(true);
    onFormOpen(car);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingCar(null);
    onFormClose();
  };

  const handleDelete = async (carId: number) => {
    await onDeleteVehicle(carId);
  };

  const handleSubmit = async (data: Omit<CarData, 'id'>) => {
    if (editingCar) {
      await onUpdateVehicle(editingCar.id!, data);
    } else {
      await onAddVehicle(data);
    }
    handleClose();
  };

  if (formOpen) {
    return (
      <aside className="vehicle-sidebar">
        <VehicleFormModal
          car={editingCar}
          draftLocation={draftLocation}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onLocationChange={onLocationChange}
        />
      </aside>
    );
  }

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
            Loading vehicles...
          </div>
        )}

        {error && (
          <div className="vehicle-sidebar__status vehicle-sidebar__status--error">
            {error}
            <button className="vehicle-sidebar__retry-btn" onClick={onRetry}>Retry</button>
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
            isSelected={car.id === selectedCarId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLocate={(id) => onSelectCar(id)}
            cardRef={(el) => {
              if (car.id != null) {
                cardRefs.current[car.id] = el;
              }
            }}
          />
        ))}
      </div>
    </aside>
  );
}
