import { DOMParser } from '@xmldom/xmldom';
/**
 * Código de Seguridad. Debe ser indicado en palabras, debajo del código QR, los
primeros seis (6) dígitos del hash del SignatureValue de la factura de consumo
electrónica menor a DOP$250 mil.
 * @param signedXml 
 */
export const getCodeSixDigitfromSignature = (signedXml: string) => {
  const resDom = new DOMParser().parseFromString(signedXml, 'text/xml');

  const match = signedXml.match(/<SignatureValue>(.*?)<\/SignatureValue>/);
  if (!match) {
    throw new Error('SignatureValue not found');
  }
  const signatureValue =
    resDom.getElementsByTagName('SignatureValue')[0].textContent;

  return signatureValue?.slice(0, 6);
};
