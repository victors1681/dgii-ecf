import axios from 'axios';
export enum ENVIRONMENT {
  DEV = 'TesteCF',
  CERT = 'CerteCF',
  PROD = 'eCF',
}

export const BASE_URL = 'https://ecf.dgii.gov.do';

export const restClient = axios.create({
  baseURL: BASE_URL,
});

export const setAuthToken = (token: string) => {
  restClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export default restClient;
