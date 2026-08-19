import axios, { isAxiosError } from 'axios';
import https from 'https';
import { toDgiiApiError } from './DgiiApiError';

export enum ENVIRONMENT {
  DEV = 'TesteCF',
  CERT = 'CerteCF',
  PROD = 'eCF',
}

export enum BaseUrl {
  ECF = 'https://ecf.dgii.gov.do', //Crédito fiscal
  CF = 'https://fc.dgii.gov.do', //Factura de consumo < 250K
  STATUS = 'https://statusecf.dgii.gov.do', //status
}

export const restClient = axios.create({
  baseURL: BaseUrl.ECF,
  httpsAgent: new https.Agent({
    keepAlive: true,
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    ciphers: [
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'DHE-RSA-AES128-GCM-SHA256',
      'DHE-RSA-AES256-GCM-SHA384',
    ].join(':'),
    honorCipherOrder: true,
  }),
});

restClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      // DGII sometimes explains why the credentials were rejected in the body;
      // keep that description instead of replacing it with a generic message.
      throw toDgiiApiError(error, {
        fallbackMessage:
          'ERROR 401: Unauthorized, please check your credentials',
      });
    }
    throw error;
  }
);

export const setAuthToken = (token: string) => {
  restClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export default restClient;
