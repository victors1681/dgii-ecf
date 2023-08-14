export interface Mensaje {
  valor: string;
  codigo: number;
}

export interface TrackingStatusResponse {
  trackId: string;
  codigo: string;
  estado: TrackStatusEnum;
  rnc: string;
  encf: string;
  secuenciaUtilizada: boolean;
  fechaRecepcion: string;
  mensajes: Mensaje[];
}

export interface SummaryTrackingStatusResponse {
  trackId: string;
  estado: string;
  fechaRecepcion: string;
}

export interface AuthToken {
  token: string;
  expira: string;
  expedido: string;
}

export interface InvoiceResponse {
  trackId?: string;
  error?: string;
  mensaje?: string;
}

export enum TrackStatusEnum {
  IN_QUEUE = 'In Queue', // not from the dgii that's an aditional initial status
  NOT_FOUND = 'No encontrado',
  ACCEPTED = 'Aceptado',
  IN_PROCESS = 'En Proceso',
  CONDITIONAL_ACCEPTED = 'Aceptado Condicional',
  REJECTED = 'Rechazado',
}
export interface ServiceDirectoryResponse {
  nombre: string;
  rnc: string;
  urlRecepcion: string;
  urlAceptacion: string;
  urlOpcional: string;
}
