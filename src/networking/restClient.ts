import axios, { isAxiosError } from 'axios';

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
