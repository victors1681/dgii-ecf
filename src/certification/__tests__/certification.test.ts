import path from 'path';
import ECF from '../../ecf/ECF';
import { ENVIRONMENT } from '../../networking';
import Signature from '../../Signature/Signature';
import fs from 'fs';
import {
  genrateACECFXml,
  getCommercialApprovalData,
} from '../commercialApproval';
import {
  hasTestCertificate,
  readTestCertificate,
} from '../../test_cert/hasTestCertificate';

const describeWithCertificate = hasTestCertificate() ? describe : describe.skip;

describeWithCertificate('Sending Commercial Approvall', () => {
  it('Sending commercial approval', async () => {
    const certs = readTestCertificate();

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
