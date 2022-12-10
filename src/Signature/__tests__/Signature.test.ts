import Signature from '../Signature';
import fs from 'fs';
import path from 'path';
import P12Reader from 'src/P12Reader';
import { DOMParser } from '@xmldom/xmldom';
import xpath from 'xpath';

describe('Sign Documents', () => {
  it('Sign Seed', () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(__dirname, 'sample/4303328_identity.p12')
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    const seedXml = fs.readFileSync(
      path.resolve(__dirname, 'sample/seed.xml'),
      'utf-8'
    );

    const signature = new Signature(certs.key, certs.cert);

    const signedXml = signature.signXml(seedXml, 'SemillaModel');

    //Convert back to dom to check the digest value
    const doc = new DOMParser().parseFromString(signedXml) as any;

    const nodes = xpath.select("//*[local-name(.)='DigestValue']", doc) as any;
    const digestValue = nodes[0].firstChild.data;

    expect(digestValue).toBe('0OGl/9Xvybi3ZVXP9oteBl/m5/dNvx94brb3v7H9QeA=');
  });
});
