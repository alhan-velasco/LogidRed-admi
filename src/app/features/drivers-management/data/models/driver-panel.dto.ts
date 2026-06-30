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
