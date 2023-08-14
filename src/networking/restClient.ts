import axios from 'axios';
export enum ENVIRONMENT {
  DEV = 'TesteCF',
  CERT = 'CerteCF',
  PROD = 'eCF',
}

export enum BaseUrl {
  ECF = 'https://ecf.dgii.gov.do', //Crédito fiscal
  CF = 'https://fc.dgii.gov.do', //Factura de consumo < 250K
}

export const restClient = axios.create({
  baseURL: BaseUrl.ECF,
});

export const setAuthToken = (token: string) => {
  restClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export default restClient;
