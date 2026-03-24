import { useEffect, useRef, useState } from 'react';
import VehicleCard from './VehicleCard';
import VehicleFormModal from './VehicleFormModal';
import AvailabilityPanel from './AvailabilityPanel';
import type { DraftLocation, VehicleFormDraft } from './VehicleFormModal';
import type { CarData } from '../services/vehicleService';
import type { AvailabilitySlot } from '../types/availability';
import './VehicleSidebar.css';

interface VehicleSidebarProps {
  vehicles: CarData[];
  loading: boolean;
  error: string | null;
  selectedCarId: number | null;
  draftLocation: DraftLocation | null;
  onAddVehicle: (data: Omit<CarData, 'id'>) => Promise<CarData>;
  onSetVehicleAvailability: (carId: number, slots: AvailabilitySlot[]) => Promise<void>;
  onUpdateVehicle: (carId: number, data: Omit<CarData, 'id'>) => Promise<void>;
  onDeleteVehicle: (carId: number) => Promise<void>;
  onLocateCar: (carId: number) => void;
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
  onSetVehicleAvailability,
  onUpdateVehicle,
  onDeleteVehicle,
  onLocateCar,
  onRetry,
  onFormOpen,
  onFormClose,
  onLocationChange,
}: VehicleSidebarProps) {
  type AvailabilityReturnState = {
    view: 'list' | 'form';
    car: CarData | null;
  };

  const [formOpen, setFormOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityCarId, setAvailabilityCarId] = useState<number | null>(null);
  const [availabilityReturnState, setAvailabilityReturnState] = useState<AvailabilityReturnState>({
    view: 'list',
    car: null,
  });
  const [editingCar, setEditingCar] = useState<CarData | null>(null);
  const [addFormDraft, setAddFormDraft] = useState<VehicleFormDraft | null>(null);
  const [addDraftAvailability, setAddDraftAvailability] = useState<AvailabilitySlot[]>([]);
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
    setAvailabilityOpen(false);
    setAvailabilityCarId(null);
    setAddFormDraft(null);
    setAddDraftAvailability([]);
    setFormOpen(true);
    onFormOpen(null);
  };

  const handleEdit = (car: CarData) => {
    setEditingCar(car);
    setAvailabilityOpen(false);
    setAvailabilityCarId(null);
    setFormOpen(true);
    onFormOpen(car);
  };

  const handleClose = () => {
    setFormOpen(false);
    setAvailabilityOpen(false);
    setAvailabilityCarId(null);
    setAvailabilityReturnState({ view: 'list', car: null });
    setEditingCar(null);
    setAddFormDraft(null);
    setAddDraftAvailability([]);
    onFormClose();
  };

  const handleDelete = async (carId: number) => {
    await onDeleteVehicle(carId);
  };

  const handleOpenAvailability = (carId?: number, returnTo: 'list' | 'form' = 'list') => {
    setAvailabilityReturnState({
      view: returnTo,
      car: returnTo === 'form' ? editingCar : null,
    });
    setFormOpen(false);
    setEditingCar(null);
    setAvailabilityCarId(carId ?? null);
    setAvailabilityOpen(true);
    onFormClose();
  };

  const handleCloseAvailability = () => {
    if (availabilityReturnState.view === 'form') {
      setAvailabilityOpen(false);
      setAvailabilityCarId(null);
      setFormOpen(true);
      setEditingCar(availabilityReturnState.car);
      setAvailabilityReturnState({ view: 'list', car: null });
      onFormOpen(availabilityReturnState.car);
      return;
    }

    handleClose();
  };

  const handleSubmit = async (data: Omit<CarData, 'id'>, editAvailabilityAfterSave = false) => {
    if (editingCar) {
      await onUpdateVehicle(editingCar.id!, data);
      handleClose();
    } else {
      const createdCar = await onAddVehicle(data);
      if (createdCar.id != null && addDraftAvailability.length > 0) {
        await onSetVehicleAvailability(createdCar.id, addDraftAvailability);
      }

      if (editAvailabilityAfterSave && createdCar.id != null) {
        handleOpenAvailability(createdCar.id, 'list');
        return;
      }

      setAddFormDraft(null);
      setAddDraftAvailability([]);
      handleClose();
    }
  };

  if (formOpen) {
    return (
      <aside className="vehicle-sidebar">
        <VehicleFormModal
          car={editingCar}
          draftLocation={draftLocation}
          draftForm={editingCar ? null : addFormDraft}
          onDraftChange={setAddFormDraft}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onLocationChange={onLocationChange}
          onEditAvailability={(carId) => handleOpenAvailability(carId, 'form')}
        />
      </aside>
    );
  }

  if (availabilityOpen) {
    return (
      <AvailabilityPanel
        carId={availabilityCarId ?? undefined}
        initialSlots={availabilityCarId == null ? addDraftAvailability : undefined}
        onSaveDraft={availabilityCarId == null ? setAddDraftAvailability : undefined}
        onClose={handleCloseAvailability}
      />
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
            onOpenAvailability={handleOpenAvailability}
            onLocate={onLocateCar}
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
