import { BaseUrl, ENVIRONMENT } from '../networking';

export const generateQRCodeURL = (
  rncemisor: string,
  encf: string,
  montototal: number,
  codigoseguridad: string,
  env: ENVIRONMENT
): string => {
  return `${BaseUrl.CF}/${env}/consultatimbrefc?rncemisor=${rncemisor}&encf=${encf}&montototal=${montototal}&codigoseguridad=${codigoseguridad}`;
};
