import path from 'path';
import Transformer from '../Transformer';
import fs from 'fs';
import { IARECF } from 'src/src/types/IARECF';

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
});
