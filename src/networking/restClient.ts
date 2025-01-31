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

export const restClient = axios.create({
  baseURL: BaseUrl.ECF,
  // httpsAgent: new https.Agent({
  //   // node 18x
  //   // https://stackoverflow.com/questions/74324019/allow-legacy-renegotiation-for-nodejs/74600467#74600467
  //   // rejectUnauthorized: false,
  //   // allow legacy server
  //   secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  // }), //? this is making the request to fail with the error: "Error: write EPROTO 140735259084352:error:14094410:SSL routines:ssl3_read_bytes:sslv3 alert handshake failure:../deps/openssl/openssl/ssl/record/rec_layer_s3.c:1407:SSL alert number 40"
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
