import { ENVIRONMENT } from '../networking';
import RestApi from '../networking/RestApi';
import { P12ReaderData } from '../P12Reader';
import Signature from '../Signature/Signature';
import { setAuthToken } from '../networking/restClient';
import {
  AuthToken,
  CheckDocumentStatusParams,
  CommercialApprovalResponse,
  DocumentStatusResult,
  InvoiceResponse,
  Opperation,
  ServiceDirectoryResponse,
  SummaryTrackingStatusResponse,
  TrackStatusEnum,
  VoidNCFResponse,
} from '../networking/types';
import { isSummaryInvoice } from '../utils/isSummaryInvoice';
import { DgiiApiError } from '../networking/DgiiApiError';

/**
 * Order used to pick the overall status when an e-NCF was submitted more than
 * once: an accepted submission wins, and a pending one beats a rejection
 * because DGII may still accept it.
 */
const TRACK_STATUS_PRIORITY: TrackStatusEnum[] = [
  TrackStatusEnum.ACCEPTED,
  TrackStatusEnum.CONDITIONAL_ACCEPTED,
  TrackStatusEnum.IN_PROCESS,
  TrackStatusEnum.REJECTED,
];

/**
 * `ConsultaTrackIds` answers an unknown e-NCF with HTTP 400 and
 * `{ codigo: 0, estado: 'TrackId no encontrado.' }` instead of an empty list.
 */
const isTrackIdNotFound = (err: unknown): boolean => {
  const { status, data } = (err ?? {}) as { status?: number; data?: unknown };
  const estado = (data as { estado?: unknown } | undefined)?.estado;
  return (
    status === 400 &&
    typeof estado === 'string' &&
    /no encontrado/i.test(estado)
  );
};

const pickTrackStatus = (
  entries: SummaryTrackingStatusResponse[]
): SummaryTrackingStatusResponse | undefined => {
  for (const status of TRACK_STATUS_PRIORITY) {
    const match = entries.find((entry) => entry.estado === status);
    if (match) {
      return match;
    }
  }
  return entries[0];
};

const INQUIRY_STATUS_BY_CODE: Record<number, TrackStatusEnum> = {
  0: TrackStatusEnum.NOT_FOUND,
  1: TrackStatusEnum.ACCEPTED,
  2: TrackStatusEnum.REJECTED,
};

class ECF {
  private _api: RestApi;
  private _p12ReaderData: P12ReaderData;

  constructor(
    p12ReaderData: P12ReaderData,
    environment: ENVIRONMENT = ENVIRONMENT.DEV,
    accessToken?: string
  ) {
    this._api = new RestApi(environment, accessToken);
    this._p12ReaderData = p12ReaderData;
  }
  /**
   * Authentication againt DGII or Buyers
   * @param buyerHost optional - If buyerHost is defined the authentication will be againt the buyer HOST to stablish the communication Sender<->Receiver
   * @returns string Bearer Token
   */
  authenticate = async (buyerHost?: string): Promise<AuthToken | undefined> => {
    try {
      const seedXml = await this._api.getSeedApi(buyerHost);
      //Sign the seed

      if (!seedXml) {
        throw Error('Xml seed is not defined');
      }

      if (
        typeof this._p12ReaderData.key === 'undefined' ||
        typeof this._p12ReaderData.cert === 'undefined'
      ) {
        throw Error('Certificate key and Pem are not defined');
      }

      const signature = new Signature(
        this._p12ReaderData.key,
        this._p12ReaderData.cert
      );
      const seedSigned = signature.signXml(seedXml, 'SemillaModel');

      //Get the token
      const tokenData = await this._api.getAuthTokenApi(seedSigned, buyerHost);

      if (!tokenData) {
        throw Error('Unable to get the token');
      }
      //set token on axios
      setAuthToken(tokenData?.token);

      if (!tokenData) {
        throw Error('Token is not defined');
      }

      return tokenData;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Send the signed invoice to DGII
   * @param signedXml XML signed invoice
   * @param fileName the composition of the file name should be RNC+e-NCF.xml example: “101672919E3100000001.xml”
   * @param buyerHost optional - If buyerHost is defined the authentication will be againt the buyer HOST to stablish the communication Sender<->Receiver
   * @returns
   */
  sendElectronicDocument = async <T = InvoiceResponse>(
    signedXml: string,
    fileName: string,
    buyerHost?: string
  ) => {
    try {
      const response = await this._api.sendElectronicDocumentApi<T>(
        signedXml,
        fileName,
        buyerHost
      );
      return response;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Send summary for invoice < 250K pesos
   * @param signedXml
   * @param fileName
   * @returns
   */
  sendSummary = async (signedXml: string, fileName: string) => {
    try {
      const response = await this._api.sendSummaryApi(signedXml, fileName);
      return response;
    } catch (err) {
      throw err;
    }
  };

  /**
   * Get the status using the track id generated after send a new invoice or other document
   * @param trackId string
   * @returns promise with the tracking status
   */

  statusTrackId = async (trackId: string) => {
    try {
      const response = await this._api.statusTrackIdApi(trackId);
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Servicio web responsable de responder la validez o estado de un e‐CF a un receptor o
   * incluso a un emisor, a través de la presentación del RNC emisor, e‐NCF y dos campos
   * condicionales a la vigencia del comprobante, RNC Comprador y el código de seguridad.
   *
   * NOTE: Only works for me for intake invoice with security code
   * @param rncEmisor
   * @param ncfElectronico
   * @param rncComprador
   * @param codigoSeguridad
   * @returns
   */
  inquiryStatus = async (
    rncEmisor: string,
    ncfElectronico: string,
    rncComprador?: string,
    codigoSeguridad?: string
  ) => {
    try {
      const response = await this._api.inquiryStatusApi(
        rncEmisor,
        ncfElectronico,
        rncComprador,
        codigoSeguridad
      );
      return response;
    } catch (error) {
      throw error;
    }
  };
  /**
   * Get all tracking
   * @param rncEmisor
   * @param encf
   * @returns
   */

  trackStatuses = async (rncEmisor: string, encf: string) => {
    try {
      const response = await this._api.getAllTrackingncfApi(rncEmisor, encf);
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Checks whether DGII already received an e-NCF, choosing the right service
   * for the way the document was sent. Use it before retrying a submission
   * whose response was lost: resending a document DGII already received
   * returns `Rechazado`.
   *
   * 1. `ConsultaTrackIds` (RNC emisor + e-NCF): every document sent with
   *    `sendElectronicDocument`, including e-CF 32 >= RD$250,000. When the
   *    e-NCF was sent more than once, an accepted submission wins over later
   *    rejected resends, and `En Proceso` wins over `Rechazado`.
   * 2. `ConsultaEstado` (`inquiryStatus`): RFCE summaries (e-CF 32 <
   *    RD$250,000), which never get a trackId.
   *
   * Pass `montoTotal` when you know it: the method then asks only the service
   * that can answer (see `isSummaryInvoice`), one request instead of two for
   * a summary. Without it, ConsultaTrackIds is asked first and ConsultaEstado
   * is only used for an `E32` e-NCF it does not know, when `codigoSeguridad`
   * is given.
   *
   * A document DGII has no record of resolves to `No encontrado` instead of
   * throwing; other errors (authentication, network, missing RNC comprador)
   * are thrown as `DgiiApiError`.
   *
   * @throws Error when `montoTotal` marks an RFCE summary and
   * `codigoSeguridad` is missing: the summary cannot be found without it.
   * @returns The overall status, the deciding trackId, and the raw responses
   */
  checkDocumentStatus = async (
    params: CheckDocumentStatusParams
  ): Promise<DocumentStatusResult> => {
    const { encf, montoTotal, codigoSeguridad } = params;
    const knowsTotal = montoTotal !== undefined && montoTotal !== null;

    if (knowsTotal && isSummaryInvoice(encf, montoTotal)) {
      if (!codigoSeguridad) {
        throw new Error(
          `codigoSeguridad is required to check the RFCE summary ${encf} (e-CF 32 < RD$250,000)`
        );
      }
      return this.checkSummaryStatus(params);
    }

    const byTrackIds = await this.checkTrackIdsStatus(params);
    const canBeSummary = !knowsTotal && /^E32/i.test(encf) && !!codigoSeguridad;

    if (byTrackIds.status !== TrackStatusEnum.NOT_FOUND || !canBeSummary) {
      return byTrackIds;
    }

    return this.checkSummaryStatus(params);
  };

  /** `checkDocumentStatus` through ConsultaTrackIds (RNC emisor + e-NCF). */
  private checkTrackIdsStatus = async ({
    rncEmisor,
    encf,
  }: CheckDocumentStatusParams): Promise<DocumentStatusResult> => {
    try {
      const trackIds =
        (await this._api.getAllTrackingncfApi(rncEmisor, encf)) ?? [];
      const decisive = pickTrackStatus(trackIds);

      if (decisive) {
        return {
          status: decisive.estado as TrackStatusEnum,
          trackId: decisive.trackId,
          source: 'ConsultaTrackIds',
          trackIds,
        };
      }
    } catch (err) {
      if (!isTrackIdNotFound(err)) {
        throw err;
      }
    }

    return {
      status: TrackStatusEnum.NOT_FOUND,
      source: 'ConsultaTrackIds',
      trackIds: [],
    };
  };

  /** `checkDocumentStatus` through ConsultaEstado, for RFCE summaries. */
  private checkSummaryStatus = async ({
    rncEmisor,
    encf,
    rncComprador,
    codigoSeguridad,
  }: CheckDocumentStatusParams): Promise<DocumentStatusResult> => {
    const inquiry = await this._api.inquiryStatusApi(
      rncEmisor,
      encf,
      rncComprador,
      codigoSeguridad
    );

    // Only codigo 0 means "No encontrado". An empty or unexpected body must
    // not read as "not found", since callers treat that as safe to resend.
    const codigo: unknown = inquiry?.codigo;
    const hasCodigo =
      typeof codigo === 'number' ||
      (typeof codigo === 'string' && codigo.trim() !== '');
    const status = hasCodigo
      ? INQUIRY_STATUS_BY_CODE[Number(codigo)]
      : undefined;
    if (!status) {
      throw new DgiiApiError(
        `ConsultaEstado returned an unrecognized codigo for ${encf}`,
        { data: inquiry }
      );
    }

    return {
      status,
      source: 'ConsultaEstado',
      trackIds: [],
      inquiry,
    };
  };

  /**
   * Gets the service directory entries for an RNC.
   *
   * The DGII directory service is inconsistent about the response shape: some
   * environments/records return an array of directory entries while others return a
   * single entry object (see PR #24). This method always resolves to an array so
   * consumers never have to branch on the response shape, preserving the existing
   * `ServiceDirectoryResponse[]` contract.
   *
   * @param rnc Customer RNC to look up
   * @returns The service directory entries, or `undefined` when the service returns no body
   */
  getCustomerDirectory = async (
    rnc: string
  ): Promise<ServiceDirectoryResponse[] | undefined> => {
    try {
      const response = await this._api.getCustomerDirectoryApi(rnc);
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Consulta de Resumen de Factura (RFCE)
   * Servicio web responsable de responder la validez o estado de un ENCF a un receptor o
   * incluso a un emisor, a través de la presentación del RNC emisor, e‐NCF y el código de seguridad.
   * >>>>>>>>>>>>>> ONLY AVAILABLE ON PRODUCTION ENVIRONEMNT <<<<<<<<<<<<<<<
   * @param rnc_emisor
   * @param encf
   * @param cod_seguridad_eCF
   * @returns
   */

  getSummaryInvoiceInquiry = async (
    rnc_emisor: string,
    encf: string,
    cod_seguridad_eCF: string
  ) => {
    try {
      const response = await this._api.getSummaryInvoiceInquiryApi(
        rnc_emisor,
        encf,
        cod_seguridad_eCF
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Servicio web responsable de recibir aprobaciones comerciales emitidas por
   * contribuyentes receptores, la cual consiste en la conformidad con una transacción
   * llevada a cabo entre dos contribuyentes y de la cual se recibió un comprobante
   * electrónico de un emisor.
   * @param signedXml
   * @param fileName
   * @returns
   */
  sendCommercialApproval = async (signedXml: string, fileName: string) => {
    try {
      const response =
        await this._api.sendSignedDocumentApi<CommercialApprovalResponse>(
          signedXml,
          fileName,
          Opperation.COMMERCIAL_APPROVAL
        );
      return response;
    } catch (err) {
      throw err;
    }
  };
  /**
   * Servicio web responsable de recibir y anular los rangos de secuencias no utilizados
   * (e‐NCF) a través de un XML de solicitud que contiene el código de comprobante
   * electrónico, una serie de rangos, desde y hasta, así como un token asociado a una
   * sesión válida.
   * @param signedXml
   * @param fileName
   * @returns
   */
  voidENCF = async (signedXml: string, fileName: string) => {
    try {
      const response = await this._api.sendSignedDocumentApi<VoidNCFResponse>(
        signedXml,
        fileName,
        Opperation.VOID_DOCUMENT
      );
      return response;
    } catch (err) {
      throw err;
    }
  };
}

export default ECF;
