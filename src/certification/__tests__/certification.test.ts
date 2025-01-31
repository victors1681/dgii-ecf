import path from 'path';
import P12Reader from '../../P12Reader';
import ECF from '../../ecf/ECF';
import { ENVIRONMENT } from '../../networking';
import Signature from '../../Signature/Signature';
import fs from 'fs';
import {
  genrateACECFXml,
  getCommercialApprovalData,
} from '../commercialApproval';

describe('Sending Commercial Approvall', () => {
  it('Sending commercial approval', async () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(
        __dirname,
        `../../test_cert/${process.env.CERTIFICATE_NAME || ''}`
      )
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    const ecf = new ECF(certs, ENVIRONMENT.CERT);
    const auth = await ecf.authenticate();

    //Sign invoice
    const signature = new Signature(certs.key, certs.cert);

    const csvPath = path.resolve(__dirname, './data/ACEEECF.csv');

    const data = await getCommercialApprovalData(csvPath);
    const xmls = genrateACECFXml(data);

    /* ENABLE to Send each file to the certification process

    for (const { xml, comprador, encf } of xmls) {
      const fileName = `${comprador}${encf}.xml`;
      const signedXml = signature.signXml(xml, 'ACECF');
      const response = await ecf.sendCommercialApproval(signedXml, fileName);
    }
    */

    expect(xmls).toBeDefined();
  });
});
