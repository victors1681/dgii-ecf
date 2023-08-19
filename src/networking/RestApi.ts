import { ENVIRONMENT } from '../networking';
import { BaseUrl, restClient, setAuthToken } from './restClient';
import FormData from 'form-data';
import axios, { AxiosError } from 'axios';
import string2fileStream from 'string-to-file-stream';

import streamLength from 'stream-length';
import {
  TrackingStatusResponse,
  AuthToken,
  InvoiceResponse,
  ServiceDirectoryResponse,
  SummaryTrackingStatusResponse,
  InvoiceSummaryResponse,
  InquiryStatusResponse,
  InquiryInvoiceSummary,
  Opperation,
  StatusOperation,
  ServiceStatusResponse,
  MaintenanceResponse,
  VerificationResponse,
} from './types';
export enum ENDPOINTS {
  SEED = 'Autenticacion/api/Autenticacion/Semilla',
  VALIDATE_SEED = 'autenticacion/api/Autenticacion/ValidarSemilla',
  SEND_INVOICE = 'recepcion/api/FacturasElectronicas',
  SEND_SUMMARY = 'recepcionfc/api/recepcion/ecf', //use with the https:fc.dgii... domain
  INQUIRY_INVOICE_SUMMARY = '/consultarfce/api/Consultas/Consulta', //Only works on PROD environment https://fc.dgii.gov.do/ecf/consultarfce/help/index.html
  COMMERCIAL_APPROVAL = 'aprobacionComercial/api/AprobacionComercial', //https://ecf.dgii.gov.do/testecf/aprobacioncomercial/help/index.html
  TRACK_RESULT_STATUS = 'consultaresultado/api/Consultas/Estado',
  INQUIRY_STATUS = 'consultaestado/api/Consultas/Estado', //https://ecf.dgii.gov.do/testecf/consultaestado/help/index.html
  ALL_TACKING_ECF = 'ConsultaTrackIds/api/TrackIds/Consulta', //https://ecf.dgii.gov.do/testecf/consultatrackids/help/index.html
  DIRECTORY_PROD = 'consultadirectorio/api/consultas/obtenerdirectorioporrnc',
  DIRECTORY_TEST_CERT = 'consultadirectorio/api/consultas/listado',
  VOID = 'anulacionrangos/api/operaciones/anularrango',
  SERVICE_STATUS = 'api/estatusservicios/obtenerestatus', //Require API KEY
  SERVICE_MAINTENANCE = 'api/estatusservicios/obtenerventanasmantenimiento', //Require API KEY
  SERVICE_VERIFICATION = 'api/estatusservicios/verificarestado', //Require API KEY
}

export const isErrorResponse = <T>(
  response: T | AxiosError
): response is AxiosError => {
  return (response as AxiosError).status !== 200;
};

class RestApi {
  private env: ENVIRONMENT = ENVIRONMENT.DEV;

  constructor(env: ENVIRONMENT, accessToken?: string) {
    this.env = env;
    if (accessToken) {
      setAuthToken(accessToken);
    }
  }

  private get baseApi() {
    return `/${this.env}`;
  }

  private getResource(endpoint: ENDPOINTS) {
    return `${this.baseApi}/${endpoint}`;
  }

  /**
   * Get an initial XML payload called seed, should be signed using the certificate .p12
   * @returns
   */
  getSeedApi = async (): Promise<string | undefined> => {
    try {
      const resource = this.getResource(ENDPOINTS.SEED);
      const response = await restClient.get(resource);

      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };
  /**
   * Return the token from a signed seed
   * @param signedSeed the seed should be signed in order to get the token
   * @returns promise with the access token
   */

  getAuthTokenApi = async (
    signedSeed: string
  ): Promise<AuthToken | undefined> => {
    try {
      const resource = this.getResource(ENDPOINTS.VALIDATE_SEED);

      //Stream Readable
      const stream = string2fileStream(signedSeed, { path: 'signed.xml' });

      const formData = new FormData();
      formData.append('xml', stream);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
          ...formData.getHeaders(),
        },
      };

      const response = await restClient.postForm(resource, formData, config);

      return response.data as AuthToken;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };

  /**
   * Send the signed invoice to DGII
   * @param signedXml XML signed invoice
   * @param fileName the composition of the file name should be RNC+e-NCF.xml example: “101672919E3100000001.xml”
   * @returns
   */
  sendElectronicInvoiceApi = async (
    signedInvoice: string,
    fileName: string
  ): Promise<InvoiceResponse | undefined> => {
    try {
      const resource = this.getResource(ENDPOINTS.SEND_INVOICE);

      const stream = string2fileStream(signedInvoice, {
        path: fileName,
      });

      const sLength = await streamLength(stream);

      const options = {
        knownLength: sLength, //Super important!! the DGII server need the Calculation of the content-length otherwise will reject the request saying "Multipart cannot be empty"
      };

      const formData = new FormData();
      formData.append('xml', stream, options);

      const response = await restClient.post(resource, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync(), //Super important calculate dynamically! I spent so much time figuring this out! OHHHHHH I'm dead!
        },
      });

      return response.data as InvoiceResponse;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };

  /**
   * Sign any XML document and perform the opperation like void document, receipt, commercial approval
   * @param signedDocument
   * @param fileName
   * @param opperation Opperation Enum
   * @returns
   */

  sendSignedDocumentApi = async <T>(
    signedDocument: string,
    fileName: string,
    opperation: Opperation
  ): Promise<T | undefined> => {
    try {
      let resource = '';
      switch (opperation) {
        case Opperation.VOID_DOCUMENT:
          resource = this.getResource(ENDPOINTS.VOID);
          break;
        case Opperation.COMMERCIAL_APPROVAL:
          resource = this.getResource(ENDPOINTS.COMMERCIAL_APPROVAL);
          break;
        default:
          throw new Error('Opperation not found');
      }

      const stream = string2fileStream(signedDocument, {
        path: fileName,
      });

      const sLength = await streamLength(stream);

      const options = {
        knownLength: sLength, //Super important!! the DGII server need the Calculation of the content-length otherwise will reject the request saying "Multipart cannot be empty"
      };

      const formData = new FormData();
      formData.append('xml', stream, options);

      const response = await restClient.post(resource, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync(), //Super important calculate dynamically! I spent so much time figuring this out! OHHHHHH I'm dead!
        },
      });

      return response.data as T;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };

  /**
   * Send the signed summary invoice to DGII (Factura de consumo)
   * @param signedXml XML signed invoice
   * @param fileName the composition of the file name should be RNC+e-NCF.xml example: “101672919E3100000001.xml”
   * @returns
   */
  sendSummaryApi = async (
    signedInvoice: string,
    fileName: string
  ): Promise<InvoiceSummaryResponse | undefined> => {
    try {
      const resource = this.getResource(ENDPOINTS.SEND_SUMMARY);

      const stream = string2fileStream(signedInvoice, {
        path: fileName,
      });

      const sLength = await streamLength(stream);

      const options = {
        knownLength: sLength, //Super important!! the DGII server need the Calculation of the content-length otherwise will reject the request saying "Multipart cannot be empty"
      };

      const formData = new FormData();
      formData.append('xml', stream, options);

      const response = await restClient.post(resource, formData, {
        baseURL: BaseUrl.CF, //use FC endpoint
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync(), //Super important calculate dynamically! I spent so much time figuring this out! OHHHHHH I'm dead!
        },
      });

      return response.data as InvoiceSummaryResponse;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };

  /**
   * Get the status using the track id generated after send a new invoice or other document
   * @param trackId string
   * @returns promise with the tracking status
   */

  statusTrackIdApi = async (
    trackId: string
  ): Promise<TrackingStatusResponse | undefined> => {
    try {
      const resource = this.getResource(ENDPOINTS.TRACK_RESULT_STATUS);

      const response = await restClient.get(resource, { params: { trackId } });

      return response.data as TrackingStatusResponse;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };
  /**
   * Consulta de estado e‐CF (CONSUMO Y CRÉDITO FISCAL)
   *Servicio web responsable de responder la validez o estado de un e‐CF a un receptor o 
   incluso a un emisor, a través de la presentación del RNC emisor, e‐NCF y dos campos
   condicionales a la vigencia del comprobante, RNC Comprador y el código de seguridad.

   * @param rncEmisor
   * @param ncfElectronico
   * @param rncComprador optional solo factura de consumo
   * @param codigoSeguridad  CONSUMO: 6 digitos asignado en el resumen. CREDITO FISCAL >>> codigoSeguridad: extraído de los primeros seis (6) dígitos del
   * hash generado en el SignatureValue de la firma digital del e-CFrecibido. Factura de credito fiscal
   * @returns
   */
  inquiryStatusApi = async (
    rncEmisor: string,
    ncfElectronico: string,
    rncComprador?: string,
    codigoSeguridad?: string
  ): Promise<InquiryStatusResponse | undefined> => {
    try {
      const resource = this.getResource(ENDPOINTS.INQUIRY_STATUS);

      const response = await restClient.get(resource, {
        params: { rncEmisor, ncfElectronico, rncComprador, codigoSeguridad },
      });

      return response.data as InquiryStatusResponse;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };

  /**
   * Return all the tracking associated with a NCF
   * @param rncEmisor Receiver RNC
   * @param encf electronic NCF
   * @returns
   */
  getAllTrackingncfApi = async (
    rncEmisor: string,
    encf: string
  ): Promise<SummaryTrackingStatusResponse[] | undefined> => {
    try {
      const resource = this.getResource(ENDPOINTS.ALL_TACKING_ECF);

      const response = await restClient.get(resource, {
        params: { rncEmisor, encf },
      });

      return response.data as SummaryTrackingStatusResponse[];
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };

  /**
   * Return the URLs for the customer if the customer is authorize to receive and approve electronic eCF
   * for low environment it return the default DGII URL automatically
   * @param rnc
   * @returns Promise ServiceDirectory array of URL
   */
  getCustomerDirectoryApi = async (
    rnc: string
  ): Promise<ServiceDirectoryResponse | undefined> => {
    try {
      const resource =
        this.env === ENVIRONMENT.PROD
          ? this.getResource(ENDPOINTS.DIRECTORY_PROD)
          : this.getResource(ENDPOINTS.DIRECTORY_TEST_CERT);

      const response = await restClient.get(resource, {
        params: { rnc },
      });

      return response.data as ServiceDirectoryResponse;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };

  /**
   * Consulta de Resumen de Factura (RFCE)
   * Servicio web responsable de responder la validez o estado de un ENCF a un receptor o
   * incluso a un emisor, a través de la presentación del RNC emisor, e‐NCF y el código de seguridad.
   * >>>>>>>>>>>>>> ONLY AVAILABLE ON PRODUCTION ENVIRONEMNT <<<<<<<<<<<<<<<
   * @param rnc_emisor
   * @param encf
   * @param cod_seguridad_eCF CONSUMO: 6 digitos asignado en el resumen.
   * @returns
   */
  getSummaryInvoiceInquiryApi = async (
    rnc_emisor: string,
    encf: string,
    cod_seguridad_eCF: string
  ): Promise<InquiryInvoiceSummary> => {
    try {
      const resource = this.getResource(ENDPOINTS.INQUIRY_INVOICE_SUMMARY); // >>>>>>>>>>>>>> ONLY AVAILABLE ON PRODUCTION ENVIRONEMNT <<<<<<<<<<<<<<<

      const response = await restClient.get(resource, {
        params: { rnc_emisor, encf, cod_seguridad_eCF },
        baseURL: BaseUrl.CF, //use FC endpoint
      });

      return response.data as InquiryInvoiceSummary;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };

  /**
   * This method combine 3 different endpoint to get the status of the service
   * In order to consume it need the API key given by the DGII
   * @param statusOperation
   * @param apiKey
   * @returns
   */
  dgiiCloudServicesStatusApi = async <
    T = ServiceStatusResponse | MaintenanceResponse | VerificationResponse
  >(
    statusOperation: StatusOperation,
    apiKey: string
  ): Promise<T | undefined> => {
    try {
      let resource = '';
      let params = {};
      switch (statusOperation) {
        case StatusOperation.SERVICES_STATUS:
          resource = this.getResource(ENDPOINTS.SERVICE_STATUS);
          break;
        case StatusOperation.SERVICE_MAINTENANCE_WINDOW:
          resource = this.getResource(ENDPOINTS.SERVICE_MAINTENANCE);
          break;
        case StatusOperation.SERVICE_VERIFICATION:
          resource = this.getResource(ENDPOINTS.SERVICE_VERIFICATION);
          const currentEnv = {
            [ENVIRONMENT.DEV]: 1,
            [ENVIRONMENT.PROD]: 2,
            [ENVIRONMENT.CERT]: 3,
          };

          params = { ambiente: currentEnv[this.env] };

          break;
        default:
          throw new Error('Opperation not found');
      }

      const response = await restClient.get(resource, {
        params,
        headers: {
          Authorization: apiKey,
        },
        baseURL: BaseUrl.STATUS,
      });

      return response.data as T;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw err.response?.data;
      }
      throw err;
    }
  };
}

export default RestApi;
