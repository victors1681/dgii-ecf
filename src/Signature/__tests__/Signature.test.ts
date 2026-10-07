import Signature from '../Signature';
import fs from 'fs';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';
import xpath from 'xpath';
import {
  hasTestCertificate,
  readTestCertificate,
} from '../../test_cert/hasTestCertificate';

const describeWithCertificate = hasTestCertificate() ? describe : describe.skip;

describeWithCertificate('Sign Documents', () => {
  it('Sign Seed', () => {
    const certs = readTestCertificate();

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
