import { getCodeSixDigitfromSignature } from './getCodeSixDigitfromSignature';
import Transformer from '../transformers';
import { IECF, ImpuestoAdicional } from '../types/IECF';

/**
 * This function allow to create a RFCE from a ECF 32 to send to the DGII
 * @param rcf32Xml XML string from the original document ECF 32 with signature
 * @returns
 */
export function convertECF32ToRFCE(rcf32Xml: string): {
  xml: string;
  securityCode: string;
} {
  const transform = new Transformer();

  const rcf32 = transform.xml2Json(rcf32Xml) as IECF;

  //Get the first 6 digits of the SignatureValue
  const CodigoSeguridadeCF = getCodeSixDigitfromSignature(rcf32Xml);

  if (!CodigoSeguridadeCF) {
    throw new Error('Unable to get the first 6 digits of the SignatureValue');
  }

  // Create RFCE structure
  const rfce = removeEmptyValues({
    RFCE: {
      Encabezado: {
        Version: rcf32.ECF.Encabezado.Version,
        IdDoc: {
          TipoeCF: rcf32.ECF.Encabezado.IdDoc.TipoeCF,
          eNCF: rcf32.ECF.Encabezado.IdDoc.eNCF,
          TipoIngresos: rcf32.ECF.Encabezado.IdDoc.TipoIngresos,
          TipoPago: rcf32.ECF.Encabezado.IdDoc.TipoPago,
          TablaFormasPago: rcf32.ECF.Encabezado.IdDoc.TablaFormasPago,
        },
        Emisor: {
          RNCEmisor: rcf32.ECF.Encabezado.Emisor.RNCEmisor,
          RazonSocialEmisor: rcf32.ECF.Encabezado.Emisor.RazonSocialEmisor,
          FechaEmision: rcf32.ECF.Encabezado.Emisor.FechaEmision,
        },
        Comprador: {
          RNCComprador: rcf32.ECF.Encabezado.Comprador.RNCComprador,
          IdentificadorExtranjero:
            rcf32.ECF.Encabezado.Comprador.IdentificadorExtranjero,
          RazonSocialComprador:
            rcf32.ECF.Encabezado.Comprador.RazonSocialComprador,
        },
        Totales: {
          MontoGravadoTotal: rcf32.ECF.Encabezado.Totales.MontoGravadoTotal,
          MontoGravadoI1: rcf32.ECF.Encabezado.Totales.MontoGravadoI1,
          MontoGravadoI2: rcf32.ECF.Encabezado.Totales.MontoGravadoI2,
          MontoGravadoI3: rcf32.ECF.Encabezado.Totales.MontoGravadoI3,
          MontoExento: rcf32.ECF.Encabezado.Totales.MontoExento,
          TotalITBIS: rcf32.ECF.Encabezado.Totales.TotalITBIS,
          TotalITBIS1: rcf32.ECF.Encabezado.Totales.TotalITBIS1,
          TotalITBIS2: rcf32.ECF.Encabezado.Totales.TotalITBIS2,
          TotalITBIS3: rcf32.ECF.Encabezado.Totales.TotalITBIS3,
          MontoImpuestoAdicional:
            rcf32.ECF.Encabezado.Totales.MontoImpuestoAdicional,
          ImpuestosAdicionales: {
            ImpuestoAdicional:
              rcf32.ECF.Encabezado.Totales.ImpuestosAdicionales.ImpuestoAdicional.map(
                (impuesto: ImpuestoAdicional) => ({
                  TipoImpuesto: impuesto.TipoImpuesto,
                  MontoImpuestoSelectivoConsumoEspecifico:
                    impuesto.MontoImpuestoSelectivoConsumoEspecifico,
                  MontoImpuestoSelectivoConsumoAdvalorem:
                    impuesto.MontoImpuestoSelectivoConsumoAdvalorem,
                  OtrosImpuestosAdicionales: impuesto.OtrosImpuestosAdicionales,
                })
              ),
          },
          MontoTotal: rcf32.ECF.Encabezado.Totales.MontoTotal,
          MontoNoFacturable: rcf32.ECF.Encabezado.Totales.MontoNoFacturable,
          MontoPeriodo: rcf32.ECF.Encabezado.Totales.MontoPeriodo,
        },
        CodigoSeguridadeCF: CodigoSeguridadeCF, // Required for RFCE
      },
    },
  });

  return { xml: transform.json2xml(rfce), securityCode: CodigoSeguridadeCF }; //'<?xml version="1.0" encoding="utf-8"?>\n' + builder.build(rfce);
}

const removeEmptyValues = (obj: any): any => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === null || value === undefined || value === '') {
      return acc;
    }

    if (Array.isArray(value)) {
      const filtered = value.filter(
        (item) => item !== null && item !== undefined && item !== ''
      );
      if (filtered.length > 0) {
        acc[key] = filtered;
      }
      return acc;
    }

    if (typeof value === 'object') {
      const cleaned = removeEmptyValues(value);
      if (Object.keys(cleaned).length > 0) {
        acc[key] = cleaned;
      }
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {} as any);
};
