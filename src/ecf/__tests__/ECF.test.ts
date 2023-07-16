import path from 'path';
import P12Reader from 'src/P12Reader';
import ECF from '../ECF';
import { ENVIRONMENT, restClient } from 'src/networking';
import Signature from 'src/Signature/Signature';
import fs from 'fs';
import { TrackStatusEnum } from 'src/networking/types';
import Transformer from 'src/transformers';
import JsonECF31Invoice from "./sample/ecf_json_data_31.json";

describe('Test Authentication flow', () => {
  const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';
  let testTrackingNo = ''
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
    const noEcf = 'E310005000100'; //Sequence 
    JsonECF31Invoice.ECF.Encabezado.IdDoc.eNCF = noEcf
    const transformer = new Transformer()
    const xml = transformer.json2xml(JsonECF31Invoice);
    const fileName = `${rnc}${noEcf}.xml`;
    const signedXml = signature.signXml(xml, 'ECF');
    const response = await ecf.sendInvoice(signedXml, fileName);

   
    testTrackingNo = response?.trackId as string;
    expect(response?.trackId).toBeDefined();
    console.log(response);
  });

  it('Test TrackingID status', async () => {
    const trackId = testTrackingNo;
    const ecf = new ECF(certs, ENVIRONMENT.DEV);

    const response = await ecf.statusTrackId(trackId);

    expect(response?.estado).toBe(TrackStatusEnum.REJECTED);
  });
});
