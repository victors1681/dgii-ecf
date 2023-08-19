import { ENVIRONMENT } from '../networking';
import RestApi from '../networking/RestApi';
import { P12ReaderData } from '../P12Reader';
import Signature from '../Signature/Signature';
import { setAuthToken } from '../networking/restClient';
import {
  AuthToken,
  CommercialApprovalResponse,
  Opperation,
  VoidNCFResponse,
} from '../networking/types';
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
  authenticate = async (): Promise<AuthToken | undefined> => {
    try {
      const seedXml = await this._api.getSeedApi();
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
      const tokenData = await this._api.getAuthTokenApi(seedSigned);

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
   * @returns
   */
  sendInvoice = async (signedXml: string, fileName: string) => {
    try {
      const response = await this._api.sendElectronicInvoiceApi(
        signedXml,
        fileName
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

  getCustomerDirectory = async (rnc: string) => {
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
