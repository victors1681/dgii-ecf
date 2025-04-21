import { BaseUrl, ENVIRONMENT } from '../networking';

/**
 * Generate FC QR Url
 * @param rncemisor
 * @param encf
 * @param montototal
 * @param codigoseguridad
 * @param env
 * @returns
 */
export const generateFcQRCodeURL = (
  rncemisor: string,
  encf: string,
  montototal: number,
  codigoseguridad: string,
  env: ENVIRONMENT
): string => {
  return encodeURI(
    `${
      BaseUrl.CF
    }/${env.toLocaleLowerCase()}/consultatimbrefc?rncemisor=${rncemisor}&encf=${encf}&montototal=${montototal}&codigoseguridad=${codigoseguridad}`
  );
};

/**
 * Generate eFC QR Url
 * @param rncemisor
 * @param rncComprador
 * @param encf
 * @param montototal
 * @param fechaEmision
 * @param fechaFirma
 * @param codigoseguridad
 * @param env
 * @returns
 */
export const generateEcfQRCodeURL = (
  rncemisor: string,
  rncComprador: string,
  encf: string,
  montototal: string,
  fechaEmision: string,
  fechaFirma: string,
  codigoseguridad: string,
  env: ENVIRONMENT
): string => {
  let rncCompradorParam = `RncComprador=${rncComprador}&`;

  if (/E43/i.test(encf) || /E47/i.test(encf) || !rncComprador) {
    rncCompradorParam = ''; //remove from the URL
  }

  return encodeURI(
    `${
      BaseUrl.ECF
    }/${env.toLocaleLowerCase()}/consultatimbre?rncemisor=${rncemisor}&${rncCompradorParam}encf=${encf}&FechaEmision=${fechaEmision}&montototal=${montototal}&FechaFirma=${fechaFirma}&codigoseguridad=${codigoseguridad}`
  );
};
