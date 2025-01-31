import axios, { isAxiosError } from 'axios';
import crypto from 'crypto';
import https from 'https';

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
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.OPENSSL_CONF = '/dev/null';
export const restClient = axios.create({
  baseURL: BaseUrl.ECF,
  httpsAgent: new https.Agent({
    secureOptions:
      crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
      crypto.constants.SSL_OP_NO_TLSv1,
    ciphers: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'DHE-RSA-AES128-GCM-SHA256',
      'RC4-SHA',
      'RC4',
    ].join(':'),
    minVersion: 'TLSv1',
    maxVersion: 'TLSv1.2',
    rejectUnauthorized: false,
    keepAlive: true,
    timeout: 10000,
  }),
});

restClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      throw {
        status: 401,
        message: 'ERROR 401: Unauthorized, please check your credentials',
      };
    }
    throw error;
  }
);

export const setAuthToken = (token: string) => {
  restClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export default restClient;
