/**
 * El swagger de LogiRed_Web_API no tipa el cuerpo de /admin/rides* (lo declara
 * como additionalProp1/2/3 genérico), así que estos DTOs son deliberadamente
 * laxos: se muestran todas las llaves que el backend realmente devuelva en
 * lugar de asumir nombres de campo. Los helpers de abajo intentan resolver
 * los alias más comunes (id_trip/id_ride/id, id_driver/driver_id, etc.) para
 * poder ligar viajes -> conductor -> vehículo sin inventar datos.
 */
export type RideRecord = Record<string, unknown>;

export interface DriverReviewDTO {
  id_review: number;
  comment: string;
  rating: string;
}

/** GET /admin/drivers/{id}/profile — entities.DriverProfile */
export interface DriverProfileDTO {
  id_user: number;
  name: string;
  lastname: string;
  email: string;
  numberphone: string;
  image_url: string;
  approved: boolean;
  global_rating: number;
  total_reviews: number;
  reviews: DriverReviewDTO[];
}

export interface PaginatedRidesDTO {
  items: RideRecord[];
  page: number;
  limit: number;
  total?: number;
}

export const RIDE_STATUS_LABELS: Record<number, string> = {
  1: 'Asignado',
  2: 'En camino',
  3: 'En proceso',
  4: 'Cancelado',
  5: 'Completado',
  6: 'Pendiente',
};

const RIDE_ID_KEYS = ['id_trip', 'id_ride', 'id_viaje', 'id'];
const DRIVER_ID_KEYS = ['id_driver', 'driver_id', 'id_conductor', 'id_user'];
const STATUS_ID_KEYS = ['id_status', 'status_id', 'id_estatus'];

function firstDefined(record: RideRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
}

export function getRideId(ride: RideRecord): number | null {
  const value = firstDefined(ride, RIDE_ID_KEYS);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getRideDriverId(ride: RideRecord): number | null {
  const value = firstDefined(ride, DRIVER_ID_KEYS);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getRideStatusId(ride: RideRecord): number | null {
  const value = firstDefined(ride, STATUS_ID_KEYS);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getRideStatusLabel(ride: RideRecord): string {
  const id = getRideStatusId(ride);
  if (id != null && RIDE_STATUS_LABELS[id]) {
    return RIDE_STATUS_LABELS[id];
  }
  const raw = firstDefined(ride, ['status', 'estatus']);
  return typeof raw === 'string' ? raw : 'Desconocido';
}

const LAT_KEYS = ['lat', 'latitude', 'Lat', 'Latitude', 'lat_deg'];
const LNG_KEYS = ['lng', 'lon', 'long', 'longitude', 'Lng', 'Longitude'];

/** Intenta extraer { lat, lng } de un punto de tracking sin asumir un nombre de campo fijo. */
export function getLatLng(point: RideRecord): { lat: number; lng: number } | null {
  const nested = (point['location'] ?? point['coords'] ?? point['coordinates']) as RideRecord | number[] | undefined;

  if (Array.isArray(nested) && nested.length >= 2) {
    const [a, b] = nested;
    if (Number.isFinite(a) && Number.isFinite(b)) {
      // GeoJSON usa [lng, lat]; si el segundo valor parece más una latitud (-90..90) lo tratamos así.
      return Math.abs(b) <= 90 ? { lat: Number(b), lng: Number(a) } : { lat: Number(a), lng: Number(b) };
    }
  }

  const source = nested && typeof nested === 'object' && !Array.isArray(nested) ? (nested as RideRecord) : point;

  const lat = firstDefined(source, LAT_KEYS);
  const lng = firstDefined(source, LNG_KEYS);
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (Number.isFinite(latNum) && Number.isFinite(lngNum) && (latNum !== 0 || lngNum !== 0)) {
    return { lat: latNum, lng: lngNum };
  }

  return null;
}

/** Convierte un registro plano en pares [llave legible, valor] para renderizar sin asumir el esquema. */
export function toDisplayEntries(record: RideRecord | null | undefined): Array<{ key: string; value: string }> {
  if (!record) return [];
  return Object.entries(record)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ({
      key: prettifyKey(key),
      value: formatValue(value),
    }));
}

function prettifyKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
