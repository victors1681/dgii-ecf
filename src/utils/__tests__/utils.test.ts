import fs from 'fs';
import path from 'path';
import { getCodeSixDigitfromSignature } from '../getCodeSixDigitfromSignature';
import { editXmlValue } from '../editXmlValue';
import cf32 from './sample/cf_json_data_32.json';
import { Transformer } from '../../transformers';
import { DOMParser } from '@xmldom/xmldom';
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
});
