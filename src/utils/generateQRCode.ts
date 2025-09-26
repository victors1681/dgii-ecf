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
  // Encode individual parameters that may contain special characters
  const encodedRncemisor = encodeURIComponent(rncemisor);
  const encodedEncf = encodeURIComponent(encf);
  const encodedMontototal = encodeURIComponent(montototal);
  const encodedCodigoseguridad = encodeURIComponent(codigoseguridad);

  return `${BaseUrl.CF}/${env.toLowerCase()}/consultatimbrefc?rncemisor=${encodedRncemisor}&encf=${encodedEncf}&montototal=${encodedMontototal}&codigoseguridad=${encodedCodigoseguridad}`;
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
  // Encode individual parameters that may contain special characters
  const encodedRncemisor = encodeURIComponent(rncemisor);
  const encodedEncf = encodeURIComponent(encf);
  const encodedMontototal = encodeURIComponent(montototal);
  const encodedFechaEmision = encodeURIComponent(fechaEmision);
  const encodedFechaFirma = encodeURIComponent(fechaFirma);
  const encodedCodigoseguridad = encodeURIComponent(codigoseguridad);

  let rncCompradorParam = '';
  if (rncComprador && !/E43/i.test(encf) && !/E47/i.test(encf)) {
    const encodedRncComprador = encodeURIComponent(rncComprador);
    rncCompradorParam = `RncComprador=${encodedRncComprador}&`;
  }

  return `${BaseUrl.ECF}/${env.toLowerCase()}/consultatimbre?rncemisor=${encodedRncemisor}&${rncCompradorParam}encf=${encodedEncf}&fechaemision=${encodedFechaEmision}&montototal=${encodedMontototal}&fechafirma=${encodedFechaFirma}&codigoseguridad=${encodedCodigoseguridad}`;
};