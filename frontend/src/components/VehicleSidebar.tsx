import { useEffect, useRef, useState,  } from 'react';
import VehicleCard from './VehicleCard';
import VehicleFormModal from './VehicleFormModal';
import AvailabilityPanel from './AvailabilityPanel';
import AutoMatchPanel from './AutoMatchPanel';
import type { DraftLocation, VehicleFormDraft } from './VehicleFormModal';
import type { CarData, SearchFilters } from '../services/vehicleService';
import type { MatchResultData } from '../services/matchingService';
import type { AvailabilitySlot, DayName } from '../types/availability';
import LocationPicker from './LocationPicker';
import './VehicleSidebar.css';

interface VehicleSidebarProps {
  mode?: 'manage' | 'search';
  onSearch?: (filters: SearchFilters) => void;
  onClearSearch?: () => void;
  vehicles: CarData[];
  loading: boolean;
  error: string | null;
  selectedCarId: number | null;
  draftLocation?: DraftLocation | null;
  searchCenter?: DraftLocation | null;
  searchRadius?: number;
  onSearchRadiusChange?: (radius: number) => void;
  onAddVehicle?: (data: Omit<CarData, 'id' | 'providerId'>) => Promise<CarData>;
  onSetVehicleAvailability?: (carId: number, slots: AvailabilitySlot[]) => Promise<void>;
  onUpdateVehicle?: (carId: number, data: Omit<CarData, 'id' | 'providerId'>) => Promise<void>;
  onDeleteVehicle?: (carId: number) => Promise<void>;
  onLocateCar?: (carId: number) => void;
  onRetry: () => void;
  onFormOpen?: (car: CarData | null, purpose?: 'search' | 'vehicle' | 'instructor') => void;
  onFormClose?: () => void;
  onLocationChange?: (loc: DraftLocation) => void;
  userLocation?: { lat: number; lng: number } | null;
  onAutoMatchSelect?: (result: MatchResultData) => void;
}

const DAYS: DayName[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let minute = 0; minute < 24 * 60; minute += 30) {
    const hour = Math.floor(minute / 60);
    const mins = minute % 60;
    options.push(`${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
  }
  return options;
}
const TIME_OPTIONS = buildTimeOptions();

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1h 30m', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '2h 30m', value: 150 },
  { label: '3 hours', value: 180 },
  { label: '3h 30m', value: 210 },
  { label: '4 hours', value: 240 },
  { label: '1 day', value: 1440 },
  { label: '2 days', value: 2880 },
  { label: '3 days', value: 4320 },
  { label: '4 days', value: 5760 },
  { label: '5 days', value: 7200 },
  { label: '6 days', value: 8640 },
  { label: '1 week', value: 10080 },
];

function parseMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export default function VehicleSidebar({
  mode = 'manage',
  onSearch,
  onClearSearch,
  vehicles,
  loading,
  error,
  selectedCarId,
  draftLocation,
  searchCenter,
  searchRadius = 5,
  onSearchRadiusChange,
  onAddVehicle,
  onSetVehicleAvailability,
  onUpdateVehicle,
  onDeleteVehicle,
  onLocateCar,
  onRetry,
  onFormOpen,
  onFormClose,
  onLocationChange,
  userLocation,
  onAutoMatchSelect,
}: VehicleSidebarProps) {
  type AvailabilityReturnState = {
    view: 'list' | 'form';
    car: CarData | null;
  };

  const [formOpen, setFormOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityCarId, setAvailabilityCarId] = useState<number | null>(null);
  const [autoMatchOpen, setAutoMatchOpen] = useState(false);
  const [availabilityReturnState, setAvailabilityReturnState] = useState<AvailabilityReturnState>({
    view: 'list',
    car: null,
  });
  const [editingCar, setEditingCar] = useState<CarData | null>(null);
  const [addFormDraft, setAddFormDraft] = useState<VehicleFormDraft | null>(null);
  const [addDraftAvailability, setAddDraftAvailability] = useState<AvailabilitySlot[]>([]);
  
  // Search filters state
  const [transmissionType, setTransmissionType] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50);
  const [showFilters, setShowFilters] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  // Time-based search state
  const [searchDate, setSearchDate] = useState('');
  const [searchStartTime, setSearchStartTime] = useState('');
  const [searchEndTime, setSearchEndTime] = useState('');
  const [searchDuration, setSearchDuration] = useState(0);

  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const toSliderValue = (r: number) => (r === 0.5 ? 0 : r);
  const fromSliderValue = (v: number) => (v === 0 ? 0.5 : v);

  // Consolidated Picking Mode Activation - only trigger on actual state transitions
  const lastShowFilters = useRef(showFilters);
  const lastFormOpen = useRef(formOpen);

  useEffect(() => {
    if (mode === 'search' && showFilters !== lastShowFilters.current) {
      if (showFilters) {
        onFormOpen?.(null, 'search');
      } else {
        onFormClose?.();
      }
      lastShowFilters.current = showFilters;
    }
  }, [mode, showFilters, onFormOpen, onFormClose]);

  useEffect(() => {
    if (mode === 'manage' && formOpen !== lastFormOpen.current) {
      if (formOpen) {
        onFormOpen?.(editingCar);
      } else {
        onFormClose?.();
      }
      lastFormOpen.current = formOpen;
    }
  }, [mode, formOpen, editingCar, onFormOpen, onFormClose]);


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
  };

  const handleEdit = (car: CarData) => {
    setEditingCar(car);
    setAvailabilityOpen(false);
    setAvailabilityCarId(null);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setAvailabilityOpen(false);
    setAvailabilityCarId(null);
    setAvailabilityReturnState({ view: 'list', car: null });
    setEditingCar(null);
    setAddFormDraft(null);
    setAddDraftAvailability([]);
  };

  const handleDelete = async (carId: number) => {
    await onDeleteVehicle?.(carId);
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
  };

  const handleCloseAvailability = () => {
    if (availabilityReturnState.view === 'form') {
      setAvailabilityOpen(false);
      setAvailabilityCarId(null);
      setFormOpen(true);
      setEditingCar(availabilityReturnState.car);
      setAvailabilityReturnState({ view: 'list', car: null });
      return;
    }

    handleClose();
  };

  const handleSubmit = async (data: Omit<CarData, 'id' | 'providerId'>, editAvailabilityAfterSave = false) => {
    if (editingCar) {
      await onUpdateVehicle?.(editingCar.id!, data);
      handleClose();
    } else {
      const createdCar = await onAddVehicle?.(data);
      if (createdCar?.id != null && addDraftAvailability.length > 0) {
        await onSetVehicleAvailability?.(createdCar.id, addDraftAvailability);
      }

      if (editAvailabilityAfterSave && createdCar?.id != null) {
        handleOpenAvailability(createdCar.id, 'list');
        return;
      }

      setAddFormDraft(null);
      setAddDraftAvailability([]);
      handleClose();
    }
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxPrice - 5);
    setMinPrice(val);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minPrice + 5);
    setMaxPrice(val);
  };

  const handleClearAll = () => {
    setTransmissionType('');
    setMinPrice(0);
    setMaxPrice(50);
    setSearchDate('');
    setSearchStartTime('');
    setSearchEndTime('');
    setSearchDuration(0);
    setSearchKey(prev => prev + 1);
    
    // Mimic exact events from the X button
    onLocationChange?.(null);
    onClearSearch?.();
  };

  const handleSearch = () => {
    let dayOfWeek: DayName | undefined;
    if (searchDate) {
      const dateObj = new Date(searchDate + 'T12:00:00');
      const dayIndex = (dateObj.getDay() + 6) % 7;
      dayOfWeek = DAYS[dayIndex];
    }

    let startMinute: number | undefined;
    let endMinute: number | undefined;

    if (searchStartTime) {
      startMinute = parseMinutes(searchStartTime);
      
      const intervalEndMin = searchEndTime ? parseMinutes(searchEndTime) : 0;
      const durationEndMin = searchDuration ? (startMinute + searchDuration) : 0;
      
      if (intervalEndMin > 0 || durationEndMin > 0) {
        endMinute = Math.max(intervalEndMin, durationEndMin);
      } else {
        endMinute = startMinute + 30;
      }
    }

    onSearch?.({
      transmissionType: transmissionType || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice === 50 ? undefined : maxPrice,
      isAvailable: true,
      radius: (userLocation && userLocation.address) ? searchRadius : undefined,
      lat: (userLocation && userLocation.address) ? userLocation.lat : undefined,
      lng: (userLocation && userLocation.address) ? userLocation.lng : undefined,
      dayOfWeek,
      startMinute,
      endMinute,
    });
    
    setShowFilters(false);
  };

  if (formOpen && mode === 'manage') {
    return (
      <aside className="vehicle-sidebar">
        <VehicleFormModal
          car={editingCar}
          draftLocation={draftLocation!}
          draftForm={editingCar ? null : addFormDraft}
          onDraftChange={setAddFormDraft}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onLocationChange={onLocationChange!}
          onEditAvailability={(carId) => handleOpenAvailability(carId, 'form')}


        />
      </aside>
    );
  }

  if (availabilityOpen) {
    return (
      <AvailabilityPanel
        entityId={availabilityCarId ?? undefined}
        entityType="car"
        initialSlots={availabilityCarId == null ? addDraftAvailability : undefined}
        onSaveDraft={availabilityCarId == null ? setAddDraftAvailability : undefined}
        onClose={handleCloseAvailability}
      />
    );
  }

  return (
    <aside className="vehicle-sidebar">
      <div className="vehicle-sidebar__header">
        <h2 className="vehicle-sidebar__title">
          {mode === 'search' ? (showFilters ? 'Filter Vehicles' : 'Vehicles Available') : 'My Vehicles'}
        </h2>
        <div className="vehicle-sidebar__header-actions">
          {mode === 'search' && (
            <>
              <button
                className="vehicle-sidebar__header-btn"
                onClick={() => setAutoMatchOpen(true)}
                title="Auto-match cars"
              >
                Auto-Match
              </button>
              <button
                className="vehicle-sidebar__header-btn"
                onClick={() => setShowFilters(!showFilters)}
                title={showFilters ? 'Show vehicles' : 'Edit filters'}
              >
                {showFilters ? 'Vehicles' : 'Filters'}
              </button>
            </>
          )}
          {mode === 'manage' && (
            <button className="vehicle-sidebar__add-btn" onClick={handleAdd}>
              + Add Vehicle
            </button>
          )}
        </div>
      </div>

      {mode === 'search' && autoMatchOpen && (
        <AutoMatchPanel
          userLocation={userLocation}
          onClose={() => setAutoMatchOpen(false)}
          onMatchSelect={(result) => {
            setAutoMatchOpen(false);
            onAutoMatchSelect?.(result);
          }}
        />
      )}

      {mode === 'search' && !autoMatchOpen && showFilters ? (
        <div className="vehicle-sidebar__filters vehicle-sidebar__filters--full">
          <div className="vehicle-sidebar__filter-group">
            <span className="vehicle-sidebar__filter-label">Transmission</span>
            <select
              className="vehicle-sidebar__filter-select"
              value={transmissionType}
              onChange={(e) => setTransmissionType(e.target.value)}
            >
              <option value="">Any Transmission</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <div className="vehicle-sidebar__filter-group">
            <div className="vehicle-sidebar__price-label">
              <span className="vehicle-sidebar__filter-label">Hourly Price</span>
              <span className="vehicle-sidebar__price-current">
                ${minPrice} — {maxPrice === 50 ? 'Any' : `$${maxPrice}`}
              </span>
            </div>
            <div className="vehicle-sidebar__price-slider">
              <div className="vehicle-sidebar__price-slider-track" />
              <div
                className="vehicle-sidebar__price-slider-progress"
                style={{
                  left: `${(minPrice / 50) * 100}%`,
                  right: `${100 - (maxPrice / 50) * 100}%`,
                }}
              />
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={minPrice}
                onChange={handleMinPriceChange}
              />
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={maxPrice}
                onChange={handleMaxPriceChange}
              />
            </div>
          </div>

          <div className="vehicle-sidebar__filter-group">
            <span className="vehicle-sidebar__filter-label">Date</span>
            <input
              type="date"
              className="vehicle-sidebar__filter-input"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>

          <div className="vehicle-sidebar__filter-group">
            <span className="vehicle-sidebar__filter-label">Time Interval</span>
            <div className="vehicle-sidebar__filter-row">
              <select
                className="vehicle-sidebar__filter-select"
                value={searchStartTime}
                onChange={(e) => setSearchStartTime(e.target.value)}
              >
                <option value="">Any Start</option>
                {TIME_OPTIONS.map((time) => (
                  <option key={`start-${time}`} value={time}>{time}</option>
                ))}
              </select>
              <select
                className="vehicle-sidebar__filter-select"
                value={searchEndTime}
                onChange={(e) => setSearchEndTime(e.target.value)}
              >
                <option value="">Any End</option>
                {TIME_OPTIONS.map((time) => (
                  <option key={`end-${time}`} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="vehicle-sidebar__filter-group">
            <span className="vehicle-sidebar__filter-label">Duration</span>
            <select
              className="vehicle-sidebar__filter-select"
              value={searchDuration}
              onChange={(e) => setSearchDuration(Number(e.target.value))}
            >
              <option value="0">Any Duration</option>
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <LocationPicker
            key={searchKey}
            initialAddress={userLocation?.address || ''}
            draftLocation={showFilters ? (draftLocation || null) : (userLocation ? { lat: userLocation.lat, lng: userLocation.lng, address: userLocation.address || '' } : null)}
            onLocationChange={(loc) => {
              onLocationChange?.(loc);
            }}
            onClear={() => {
              onLocationChange?.(null);
              onClearSearch?.();
            }}
            label="Search Center"
            placeholder="Search address to center..."
          />

          <div className="vehicle-sidebar__filter-group">
            <div className="vehicle-sidebar__price-label">
              <span className="vehicle-sidebar__filter-label">Search Radius</span>
              <span className="vehicle-sidebar__price-current">{searchRadius} km</span>
            </div>
            <div className="vehicle-sidebar__price-slider">
              <div className="vehicle-sidebar__price-slider-track" />
              <div
                className="vehicle-sidebar__price-slider-progress"
                style={{
                  left: '0%',
                  right: `${100 - (toSliderValue(searchRadius) / 50) * 100}%`,
                }}
              />
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={toSliderValue(searchRadius)}
                onChange={(e) => onSearchRadiusChange?.(fromSliderValue(Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="vehicle-sidebar__filter-actions">
            <button className="vehicle-sidebar__search-btn" onClick={handleSearch}>
              Search Vehicles
            </button>
            <button className="vehicle-sidebar__clear-all-btn" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
        </div>
      ) : (
        <>
          {mode === 'search' && !loading && vehicles.length > 0 && (
            <div className="vehicle-sidebar__results-header">
              Vehicles Available ({vehicles.length})
            </div>
          )}

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
                <p>No vehicles found.</p>
                <button 
                  className="vehicle-sidebar__retry-btn" 
                  onClick={() => setShowFilters(true)}
                  style={{ color: '#646cff', borderColor: '#646cff' }}
                >
                  Adjust Filters
                </button>
              </div>
            )}

            {vehicles.map((car) => (
              <VehicleCard
                key={car.id}
                car={car}
                mode={mode}
                isSelected={car.id === selectedCarId}
                onEdit={mode === 'manage' ? handleEdit : undefined}
                onDelete={mode === 'manage' ? handleDelete : undefined}
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
        </>
      )}
    </aside>
  );
}
