import * as fs from 'fs';
import csvParser from 'csv-parser';
import Transformer from '../transformers';

interface CommercialApprovalData {
  Version: string;
  RNCEmisor: string;
  eNCF: string;
  FechaEmision: string;
  MontoTotal: number;
  RNCComprador: string;
  Estado: string;
  DetalleMotivoRechazo: string;
  FechaHoraAprobacionComercial: string;
}

export const getCommercialApprovalData = (
  csvFilePath: string
): Promise<CommercialApprovalData[]> => {
  return new Promise((resolve, reject) => {
    const results: CommercialApprovalData[] = [];

    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (data: CommercialApprovalData) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

interface GenerateACECFXmlResult {
  xml: string;
  comprador: string;
  encf: string;
}
export const genrateACECFXml = (
  data: CommercialApprovalData[]
): GenerateACECFXmlResult[] => {
  const results: GenerateACECFXmlResult[] = [];
  for (const record of data) {
    const object = {
      ACECF: {
        DetalleAprobacionComercial: {
          Version: '1.0',
          RNCEmisor: record.RNCEmisor,
          eNCF: record.eNCF,
          FechaEmision: record.FechaEmision,
          MontoTotal: record.MontoTotal,
          RNCComprador: record.RNCComprador,
          Estado: record.Estado,
          FechaHoraAprobacionComercial: '13-11-2023 19:40:32',
        },
      },
    };
    const transform = new Transformer();

    const xml = transform.json2xml(object);
    results.push({ xml, comprador: record.RNCComprador, encf: record.eNCF });
  }
  return results;
};
