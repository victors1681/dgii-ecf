import { ENVIRONMENT } from '../networking';
import { BaseUrl, restClient, setAuthToken } from './restClient';
import FormData from 'form-data';
import { AxiosError } from 'axios';
import string2fileStream from 'string-to-file-stream';

import streamLength from 'stream-length';
import {
  TrackingStatusResponse,
  AuthToken,
  InvoiceResponse,
  ServiceDirectoryResponse,
  SummaryTrackingStatusResponse,
  InvoiceSummaryResponse,
} from './types';
export enum ENDPOINTS {
  SEED = 'Autenticacion/api/Autenticacion/Semilla',
  VALIDATE_SEED = 'autenticacion/api/Autenticacion/ValidarSemilla',
  SEND_INVOICE = 'recepcion/api/FacturasElectronicas',
  SEND_SUMMARY = 'recepcionfc/api/recepcion/ecf', //use with the https:fc.dgii... domain
  STATUS_OF_SUMMARY_INVOICE = '/consultarfce/api/Consultas/Consulta', //Only works on PROD environment https://fc.dgii.gov.do/ecf/consultarfce/help/index.html
  COMMERCIAL_APPROVE = 'aprobacionComercial/api/AprobacionComercial', //https://ecf.dgii.gov.do/testecf/aprobacioncomercial/help/index.html
  TRACK_STATUS = 'consultaresultado/api/Consultas/Estado',
  ALL_TACKING_ECF = 'ConsultaTrackIds/api/TrackIds/Consulta', //https://ecf.dgii.gov.do/testecf/consultatrackids/help/index.html
  DIRECTORY_PROD = 'consultadirectorio/api/consultas/obtenerdirectorioporrnc',
  DIRECTORY_TEST_CERT = 'consultadirectorio/api/consultas/listado',
}

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

      if (response.status === 200) {
        return response.data;
      }
    } catch (err) {
      throw new Error(JSON.stringify(err));
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

      if (response.status === 200) {
        return response.data as AuthToken;
      }
    } catch (err) {
      const error = err as AxiosError;
      console.log('err', error.response?.data);
      throw new Error(`${JSON.stringify(error)}`);
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

      if (response.status === 200) {
        return response.data as InvoiceResponse;
      }
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(`${JSON.stringify(error)}`);
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

      if (response.status === 200) {
        return response.data as InvoiceSummaryResponse;
      }
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(`${JSON.stringify(error)}`);
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
      const resource = this.getResource(ENDPOINTS.TRACK_STATUS);

      const response = await restClient.get(resource, { params: { trackId } });

      if (response.status === 200) {
        return response.data as TrackingStatusResponse;
      }
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(`${JSON.stringify(error)}`);
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

      if (response.status === 200) {
        return response.data as SummaryTrackingStatusResponse[];
      }
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(`${JSON.stringify(error)}`);
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

      if (response.status === 200) {
        return response.data as ServiceDirectoryResponse;
      }
    } catch (err) {
      const error = err as AxiosError;
      throw new Error(`${JSON.stringify(error)}`);
    }
  };
}

export default RestApi;
