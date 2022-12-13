import path from 'path';
import P12Reader from 'src/P12Reader';
import ECF from '../ECF';
import { ENVIRONMENT, restClient } from 'src/networking';
import Signature from 'src/Signature/Signature';
import fs from 'fs';
describe('Test Authentication flow', () => {
  it('Testing authentication', async () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(__dirname, '../../test_cert/4303328_identity.p12')
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    const auth = new ECF(certs, ENVIRONMENT.DEV);
    const tokenData = await auth.authenticate();
    expect(tokenData?.token).toBeDefined();
    expect(restClient.defaults.headers.common['Authorization']).toBeDefined();
  });

  it('Testing  sending signed invoice to DGII', async () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(__dirname, '../../test_cert/4303328_identity.p12')
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    await ecf.authenticate();

    //Sign invoice
    const signature = new Signature(certs.key, certs.cert);
    const xmlFile = fs.readFileSync(
      path.resolve(__dirname, 'sample/ECF.xml'),
      'utf-8'
    );

    //Stream Readable
    const rnc = '04600236253'; //Customer RNC
    const noEcf = '000000001'; //Sequence
    const fileName = `${rnc}${noEcf}.xml`;
    const signedXml = signature.signXml(xmlFile, 'ECF');
    const response = await ecf.sendInvoice(signedXml, fileName);

    expect(response?.trackId).toBeDefined();
  });
});
