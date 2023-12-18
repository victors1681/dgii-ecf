import fs from 'fs';
import path from 'path';
import { getCodeSixDigitfromSignature } from '../getCodeSixDigitfromSignature';
import { editXmlValue } from '../editXmlValue';
import cf32 from './sample/cf_json_data_32.json';
import { Transformer } from '../../transformers';
import { DOMParser } from '@xmldom/xmldom';
import { generateEcfQRCodeURL } from '../generateQRCode';
import { ENVIRONMENT } from '../../../src/networking';
describe('Test util function ', () => {
  it('get six digit from the signature', () => {
    const xml = fs.readFileSync(
      path.resolve(__dirname, './sample/signedXml.xml'),
      'utf8'
    );
    const code = getCodeSixDigitfromSignature(xml);
    expect(code).toBe('gG/XYZ');
  });

  it('update attribute xml', () => {
    const transform = new Transformer();
    const xml = transform.json2xml(cf32);
    const newXml = editXmlValue(xml, 'CodigoSeguridadeCF', '1231231');

    const generatedXml = new DOMParser().parseFromString(newXml, 'text/xml');
    const value =
      generatedXml.getElementsByTagName('CodigoSeguridadeCF')[0].textContent;

    expect(value).toBe('1231231');
  });

  it('Generate QR Code', () => {
    const url = generateEcfQRCodeURL(
      '130862346',
      '111111',
      'E310004567002',
      '180000.00',
      '13-11-2022',
      '14-11-2023 03:05:27',
      'BucMq7',
      ENVIRONMENT.DEV
    );
    expect(url).toBe(
      'https://ecf.dgii.gov.do/TesteCF/consultatimbre?rncemisor=130862346&RncComprador=111111&encf=E310004567002&FechaEmision=13-11-2022&montototal=180000.00&FechaFirma=14-11-2023%2003:05:27&codigoseguridad=BucMq7'
    );
  });

  it('Generate QR Code and remove RNCComprador', () => {
    const url = generateEcfQRCodeURL(
      '130862346',
      '111111',
      'E470004567002',
      '180000.00',
      '13-11-2022',
      '14-11-2023 03:05:27',
      'BucMq7',
      ENVIRONMENT.DEV
    );
    expect(url).toBe(
      'https://ecf.dgii.gov.do/TesteCF/consultatimbre?rncemisor=130862346&encf=E470004567002&FechaEmision=13-11-2022&montototal=180000.00&FechaFirma=14-11-2023%2003:05:27&codigoseguridad=BucMq7'
    );
  });
});
