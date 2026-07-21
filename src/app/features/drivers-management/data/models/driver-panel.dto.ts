export interface PendingDriverDTO {
  id_user: number;
  name: string;
  lastname: string;
  email: string;
  numberphone: string;
  image_url: string;
  approved: boolean;
}

export interface DriverDocumentDTO {
  id_document: number;
  id_document_type: number;
  url: string;
}

export interface DriverCarDTO {
  id_car: number;
  brand: string;
  model: string;
  color: string;
  car_registration: string;
  max_capacity: number;
  frontview_image: string;
  backview_image: string;
  leftview_image: string;
  rightview_image: string;
  space_image: string;
  plates_image: string;
}

export interface DriverDetailDTO {
  id_user: number;
  name: string;
  lastname: string;
  email: string;
  numberphone: string;
  image_url: string;
  approved: boolean;
  birthdate: string;
  cars: DriverCarDTO[];
  documents: DriverDocumentDTO[];
}

/** Muestra fechas de nacimiento sin convertirlas a UTC, evitando cambiar el día por zona horaria. */
export function formatBirthdate(value: string | null | undefined): string {
  if (!value) return 'Sin registro';

  const isoDate = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const localDate = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const [year, month, day] = isoDate
    ? [Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3])]
    : localDate
      ? [Number(localDate[3]), Number(localDate[2]), Number(localDate[1])]
      : [NaN, NaN, NaN];

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return value;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return value;

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
