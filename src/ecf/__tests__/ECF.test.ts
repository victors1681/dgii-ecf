import path from 'path';
import P12Reader from '../../P12Reader';
import ECF from '../ECF';
import { ENVIRONMENT, restClient } from '../../networking';
import Signature from '../../Signature/Signature';
import fs from 'fs';
import { TrackStatusEnum } from '../../networking/types';
import Transformer from '../../transformers';
import JsonECF31Invoice from "./sample/ecf_json_data_31.json";

describe('Test Authentication flow', () => {
  const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';
  let testTrackingNo = ''
  const reader = new P12Reader(secret);
  // const certs = reader.getKeyFromFile(
  //   path.resolve(__dirname, '../../test_cert/4303328_identity.p12')
  // );
  const certs = reader.getKeyFromStringBase64("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")
  it('Testing authentication', async () => {
    if (!certs.key || !certs.cert) {
      return;
    }

    const auth = new ECF(certs, ENVIRONMENT.DEV);
    const tokenData = await auth.authenticate();
    expect(tokenData?.token).toBeDefined();
    console.log("tokenData?.tokentokenData?.tokentokenData?.token",tokenData?.token)
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
