import { DOMParser } from '@xmldom/xmldom';
import { js2xml } from 'xml-js';
import { getCurrentFormattedDateTime } from '../utils/getCurrentFormattedDateTime';

//https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Documentacin%20sobre%20eCF/Formatos%20XML/Formato%20Acuse%20de%20Recibo%20v%201.0.pdf
export enum NoReceivedCode {
  'Error de especificación' = '1',
  'Error de Firma Digital' = '2',
  'Envío duplicado' = '3',
  'RNC Comprador no corresponde' = '4',
}

export enum ReveivedStatus {
  'e-CF Recibido' = '0',
  'e-CF No Recibido' = '1',
}

/**
 * We should not receive documents Encf
 */
export const excludedEncfType = ['32', '41', '43', '45', '46', '47'];
export const validEncfType = ['31', '33', '34', '44'];

/**
 * Mathod to transform, validate and respond for the sender-receiver communication
 */
export class SenderReceiver {
  /**
   * Parse XML Resonse to XML DOM
   * @param xmlString
   * @returns
   */
  parseBody = (xmlString: string) => {
    try {
      const startIdx = xmlString.indexOf('<?xml');
      const endIdx = xmlString.lastIndexOf('</ECF>') + '</ECF>'.length;

      // Extract the XML content
      const result = xmlString.substring(startIdx, endIdx);

      const parser = new DOMParser();

      // // Parse the XML string
      return parser.parseFromString(result, 'text/xml');
    } catch (err) {
      throw new Error(JSON.stringify(err));
    }
  };
  /**
   * Create an XML response for the receiver endpont
   * @param xml
   * @param receptorRNC
   * @param status
   * @param code
   * @returns NOT Signed Received format XML
   */
  getECFDataFromXML = (
    xml: string | Document,
    receptorRNC: string,
    status: ReveivedStatus,
    code?: NoReceivedCode
  ) => {
    const xmlDoc =
      typeof xml === 'string'
        ? new DOMParser().parseFromString(xml, 'text/xml')
        : xml;

    const eNCF = xmlDoc.getElementsByTagName('eNCF')[0].textContent;
    const TipoeCF = xmlDoc.getElementsByTagName('TipoeCF')[0].textContent;
    const RNCEmisor = xmlDoc.getElementsByTagName('RNCEmisor')[0].textContent;
    const RNCComprador =
      xmlDoc.getElementsByTagName('RNCComprador')[0].textContent;

    if (TipoeCF && excludedEncfType.includes(TipoeCF)) {
      code = NoReceivedCode['Error de especificación']; //Document not valid
      status = ReveivedStatus['e-CF No Recibido'];
    }

    if (receptorRNC != RNCComprador) {
      code = NoReceivedCode['RNC Comprador no corresponde']; //Document not valid
      status = ReveivedStatus['e-CF No Recibido'];
    }
    const data = {};
    Object.assign(data, {
      _declaration: { _attributes: { version: '1.0', encoding: 'utf-8' } },
    });

    const response = {
      ARECF: {
        DetalleAcusedeRecibo: {
          Version: '1.0',
          RNCEmisor,
          RNCComprador,
          eNCF,
          Estado: status,
          CodigoMotivoNoRecibido: code,
          FechaHoraAcuseRecibo: getCurrentFormattedDateTime(),
        },
      },
    };

    Object.assign(data, response);
    const options = { compact: true, ignoreComment: true, spaces: 4 };
    return js2xml(data, options);
  };
}
