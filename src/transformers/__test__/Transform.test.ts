import path from 'path';
import Transformer from '../Transformer';
import fs from 'fs';
import { IARECF } from 'src/src/types/IARECF';
import { IACECF } from 'src/src/types/IACECF';
import { getXmlFromBodyResponse } from '../../utils/getXmlFromBodyResponse';

describe('Testing transform class', () => {
  it('XMl to JSON', () => {
    const xml = fs.readFileSync(
      path.resolve(__dirname, './sample/customer_receipt.xml'),
      'utf8'
    );

    const transform = new Transformer();
    const json = transform.xml2Json<IARECF>(xml);
    expect(json.ARECF.DetalleAcusedeRecibo.Estado._text).toBe('0');
  });

  it('ACECF XMl to JSON', () => {
    const dgiiContent = fs.readFileSync(
      path.resolve(__dirname, './sample/commercial_approval_response.xml'),
      'utf8'
    );

    const xml = getXmlFromBodyResponse(dgiiContent) || '';

    const transform = new Transformer();
    const json = transform.xml2Json<IACECF>(xml);
    expect(json.ACECF.DetalleAprobacionComercial.eNCF._text).toBe(
      'E450000000001'
    );
  });
});
