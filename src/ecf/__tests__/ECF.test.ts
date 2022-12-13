import path from 'path';
import P12Reader from 'src/P12Reader';
import ECF from '../ECF';
import { ENVIRONMENT, restClient } from 'src/networking';
import Signature from 'src/Signature/Signature';
import fs from 'fs';
import { TrackStatusEnum } from 'src/networking/types';
describe('Test Authentication flow', () => {
  const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

  const reader = new P12Reader(secret);
  const certs = reader.getKeyFromFile(
    path.resolve(__dirname, '../../test_cert/4303328_identity.p12')
  );

  it('Testing authentication', async () => {
    if (!certs.key || !certs.cert) {
      return;
    }

    const auth = new ECF(certs, ENVIRONMENT.DEV);
    const tokenData = await auth.authenticate();
    expect(tokenData?.token).toBeDefined();
    expect(restClient.defaults.headers.common['Authorization']).toBeDefined();
  });

  it('Testing  sending signed invoice to DGII', async () => {
    if (!certs.key || !certs.cert) {
      return;
    }

    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    const auth = await ecf.authenticate();

    //console.log(auth);

    //Sign invoice
    const signature = new Signature(certs.key, certs.cert);
    const xmlFile = fs.readFileSync(
      path.resolve(__dirname, 'sample/ECF.xml'),
      'utf-8'
    );

    //Stream Readable
    const rnc = '130862346'; //Customer RNC
    const noEcf = '000000001'; //Sequence
    const fileName = `${rnc}${noEcf}.xml`;
    const signedXml = signature.signXml(xmlFile, 'ECF');
    const response = await ecf.sendInvoice(signedXml, fileName);

    expect(response?.trackId).toBeDefined();
    //console.log(response);
  });

  it('Test TrackingID status', async () => {
    const trackId = '49a5fdde-b9be-4844-aee9-a085a5596d59';
    const ecf = new ECF(certs, ENVIRONMENT.DEV);

    const response = await ecf.statusTrackId(trackId);

    expect(response?.estado).toBe(TrackStatusEnum.REJECTED);
  });
});
