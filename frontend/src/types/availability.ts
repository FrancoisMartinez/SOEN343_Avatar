export type DayName =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface AvailabilitySlot {
  id?: number;
  dayOfWeek: DayName;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface WeeklyAvailability {
  carId: number;
  available: boolean;
  slots: AvailabilitySlot[];
}

export interface WeeklyAvailabilityRequest {
  slots: AvailabilitySlot[];
}
