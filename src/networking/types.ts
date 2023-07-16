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
  NOT_FOUND = 'No encontrado.',
  ACCEPTED = 'Aceptado',
  IN_PROCESS = 'En Proceso',
  CONDITIONAL_ACCEPTED = 'Aceptado Condicional',
  REJECTED = 'Rechazado',
}
