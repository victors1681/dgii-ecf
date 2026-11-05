export enum Opperation {
  VOID_DOCUMENT,
  COMMERCIAL_APPROVAL,
}
export interface Mensaje {
  valor: string;
  codigo: number;
}
export type TrackStatusCode = 0 | 1 | 2 | 3 | 4; //No encontrado, Aceptado, Rechazado, En Proceso, Aceptado Condicional
export interface TrackingStatusResponse {
  trackId: string;
  codigo: TrackStatusCode;
  estado: TrackStatusEnum;
  rnc: string;
  encf: string;
  secuenciaUtilizada: boolean;
  fechaRecepcion: string;
  mensajes?: Mensaje[];
}

export type StatusCode = 0 | 1 | 2; //'No encontrado' | 'Aceptado' | 'Rechazado';
export type Status = 'No encontrado' | 'Aceptado' | 'Rechazado';
export interface InquiryStatusResponse {
  codigo: StatusCode;
  estado: Status;
  rncEmisor?: string;
  ncfElectronico?: string;
  montoTotal?: number;
  totalITBIS?: number;
  fechaEmision?: string;
  fechaFirma?: string;
  rncComprador?: string;
  codigoSeguridad?: string;
  idExtranjero?: string;
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
  mensajes?: Mensaje[];
}

export interface InvoiceSummaryResponse {
  codigo: number;
  estado: 'Aceptado' | 'Rechazado' | 'Aceptado Condicional';
  mensajes?: Mensaje[];
  encf: string;
  secuenciaUtilizada: boolean;
}

export enum TrackStatusEnum {
  NOT_FOUND = 'No encontrado',
  ACCEPTED = 'Aceptado',
  REJECTED = 'Rechazado',
  IN_PROCESS = 'En Proceso',
  CONDITIONAL_ACCEPTED = 'Aceptado Condicional',
}
/** Parameters for `ECF.checkDocumentStatus`. */
export interface CheckDocumentStatusParams {
  /** RNC of the issuer that sent the document. */
  rncEmisor: string;
  /** Electronic NCF, e.g. `E310000000001`. */
  encf: string;
  /**
   * Buyer RNC. Only used for an RFCE summary (e-CF 32 < RD$250,000), where
   * DGII requires it together with `codigoSeguridad`.
   */
  rncComprador?: string;
  /**
   * Security code (`CodigoSeguridadeCF`) sent in the RFCE summary. Required to
   * find an e-CF 32 < RD$250,000: summaries never get a trackId, so without it
   * an accepted summary is reported as `No encontrado`.
   */
  codigoSeguridad?: string;
  /**
   * Invoice total (`Totales.MontoTotal`). Optional; when given, only the
   * service that can answer is asked: ConsultaEstado for an RFCE summary
   * (see `isSummaryInvoice`), ConsultaTrackIds for everything else.
   */
  montoTotal?: number | string;
}

/** DGII service that answered `ECF.checkDocumentStatus`. */
export type DocumentStatusSource = 'ConsultaTrackIds' | 'ConsultaEstado';

/** Result of `ECF.checkDocumentStatus`. */
export interface DocumentStatusResult {
  /**
   * Overall status of the e-NCF. When it was sent more than once, an accepted
   * submission wins over later rejected resends.
   * `No encontrado` means DGII has no record of the document, with one
   * exception: an RFCE summary (e-CF 32 < RD$250,000) checked without its
   * exact `codigoSeguridad` is reported as `No encontrado` even when DGII
   * accepted it, so that result does not prove it is safe to resend.
   */
  status: TrackStatusEnum;
  /** trackId of the submission that decided `status`, when there is one. */
  trackId?: string;
  /** Service that answered. */
  source: DocumentStatusSource;
  /** Every submission DGII has for the e-NCF (ConsultaTrackIds). */
  trackIds?: SummaryTrackingStatusResponse[];
  /** ConsultaEstado response, when the RFCE summary lookup was used. */
  inquiry?: InquiryStatusResponse;
}

export enum CustomTrackStatusEnum {
  IN_QUEUE = 'En Cola',
  SENT_TO_DGII = 'Enviado a la DGII',
  ERROR = 'Error',
}

export type ExtendedTrackStatusEnum = TrackStatusEnum | CustomTrackStatusEnum;

export interface ServiceDirectoryResponse {
  nombre: string;
  rnc: string;
  urlRecepcion: string;
  urlAceptacion: string;
  urlOpcional: string;
}

export interface InquiryInvoiceSummary {
  rnc: string;
  encf: string;
  secuenciaUtilizada: boolean;
  codigo: StatusCode;
  estado: Status;
  mensajes?: Mensaje[];
}

export interface CommercialApprovalResponse {
  codigo: '01' | '02';
  estado: 'Aprobación Comercial Aprobada.' | 'Aprobacion Comercial Rechazada.';
  mensaje: string[];
}

export interface VoidNCFResponse {
  rnc: string;
  codigo: string;
  nombre: string;
  mensajes: string[];
}

export type ServicesStatusName =
  | 'Autenticación'
  | 'Recepción'
  | 'Consulta Resultado'
  | 'Consulta Estado'
  | 'Consulta Directorio'
  | 'Consulta TrackIds'
  | 'Aprobación Comercial'
  | 'Anulación Rangos'
  | 'Recepción FC';

export type ServiceStatusResponse = ServiceStatus[];
export interface ServiceStatus {
  servicio: ServicesStatusName;
  estatus: 'Disponible' | 'No Disponible';
  ambiente: string;
}

export interface MaintenanceResponse {
  ventanaMantenimientos: MaintenanceWindow[];
}

export interface MaintenanceWindow {
  ambiente: string;
  horaInicio: string;
  horaFin: string;
  dias: string[];
}

export interface VerificationResponse {
  estado: 'Disponible' | 'No Disponible';
}

export enum StatusOperation {
  SERVICES_STATUS,
  SERVICE_MAINTENANCE_WINDOW,
  SERVICE_VERIFICATION,
}
