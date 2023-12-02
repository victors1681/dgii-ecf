import path from 'path';
import P12Reader from '../../P12Reader';
import ECF from '../../ecf/ECF';
import { ENVIRONMENT, restClient } from '../../networking';
import Signature from '../../Signature/Signature';
import fs from 'fs';
import {
  genrateACECFXml,
  getCommercialApprovalData,
} from '../commercialApproval';

describe('Sending Commercial Approvall', () => {
  it('Sending commercial approval', async () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const rnc = '130862346'; //Customer RNC
    const noEcf = 'E310005000201'; //Sequence

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(__dirname, '../../test_cert/4303328_identity.p12')
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    const ecf = new ECF(certs, ENVIRONMENT.CERT);
    const auth = await ecf.authenticate();

    //console.log(auth);

    //Sign invoice
    const signature = new Signature(certs.key, certs.cert);

    const csvPath = path.resolve(__dirname, './data/ACEEECF.csv');

    const data = await getCommercialApprovalData(csvPath);
    const xmls = genrateACECFXml(data);

    for (const { xml, comprador, encf } of xmls) {
      const fileName = `${comprador}${encf}.xml`;
      const signedXml = signature.signXml(xml, 'ACECF');

      console.log('Signed', signedXml);
      const response = await ecf.sendCommercialApproval(signedXml, fileName);

      console.log(response);
    }

    expect(xmls).toBe('');
  });
});
