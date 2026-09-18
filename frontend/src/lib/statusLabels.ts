import type { AppointmentStatus, ReservationStatus } from './types';

/**
 * Nazivi i vizualna semantika statusa.
 *
 * Odvojeni od komponenti jer ih koriste i padajući izbornici i poruke, a ne
 * samo oznake. Oblik je jednako važan kao boja: korisnik koji ne razlikuje boje
 * status prepoznaje po obliku, kao na prometnom znaku.
 */
export type StatusTone = 'signal' | 'work' | 'go' | 'stop' | 'neutral';
export type StatusShape = 'rect' | 'triangle' | 'circle';

type StatusConfig = { label: string; tone: StatusTone; shape: StatusShape };

export const APPOINTMENT_STATUS: Record<AppointmentStatus, StatusConfig> = {
  PENDING: { label: 'Na čekanju', tone: 'work', shape: 'triangle' },
  CONFIRMED: { label: 'Potvrđen', tone: 'signal', shape: 'rect' },
  IN_PROGRESS: { label: 'U tijeku', tone: 'signal', shape: 'rect' },
  COMPLETED: { label: 'Završen', tone: 'go', shape: 'circle' },
  CANCELLED: { label: 'Otkazan', tone: 'stop', shape: 'circle' },
  NO_SHOW: { label: 'Nije došao', tone: 'stop', shape: 'circle' },
};

export const RESERVATION_STATUS: Record<ReservationStatus, StatusConfig> = {
  PENDING: { label: 'Na čekanju', tone: 'work', shape: 'triangle' },
  CONFIRMED: { label: 'Potvrđena', tone: 'signal', shape: 'rect' },
  FULFILLED: { label: 'Preuzeto', tone: 'go', shape: 'circle' },
  CANCELLED: { label: 'Otkazana', tone: 'stop', shape: 'circle' },
};

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS[status].label;
}

export function reservationStatusLabel(status: ReservationStatus): string {
  return RESERVATION_STATUS[status].label;
}
