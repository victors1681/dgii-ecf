import fs from 'fs';
import path from 'path';
import { getCodeSixDigitfromSignature } from '../getCodeSixDigitfromSignature';

describe('Test util function ', () => {
  it('get six digit from the signature', () => {
    const data = fs.readFileSync(
      path.resolve(__dirname, './sample/signedXml.xml'),
      'utf8'
    );
    const code = getCodeSixDigitfromSignature(data);
    expect(code).toBe('gG/XYZ');
  });
});
