import path from 'path';
import P12Reader from '../../P12Reader';
import ECF from '../ECF';
import { ENVIRONMENT, restClient } from '../../networking';
import Signature from '../../Signature/Signature';
import fs from 'fs';
import { TrackStatusEnum } from '../../networking/types';
import Transformer from '../../transformers';
import JsonECF31Invoice from './sample/ecf_json_data_31.json';
import JsonECF32Summary from './sample/cf_json_data_32.json';
import { generateRandomAlphaNumeric } from '../../utils/generateRandomAlphaNumeric';

describe('Test Authentication flow', () => {
  const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';
  let testTrackingNo = '';
  const rnc = '130862346'; //Customer RNC
  const noEcf = 'E310005000100'; //Sequence

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
    console.log('Token:', tokenData?.token);
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

    JsonECF31Invoice.ECF.Encabezado.IdDoc.eNCF = noEcf;
    const transformer = new Transformer();
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

    expect(response?.estado).toBe(
      TrackStatusEnum.REJECTED ||
        TrackStatusEnum.IN_PROCESS ||
        TrackStatusEnum.ACCEPTED
    );
  });

  it('Test get all tracking id status', async () => {
    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    const response = await ecf.trackStatuses(rnc, noEcf);
    expect(response?.length).toBeGreaterThan(0);
  });

  it('Test get all tracking id status', async () => {
    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    const rnc = 'any rnc';
    const response = await ecf.getCustomerDirectory(rnc);
    expect(response).toMatchObject([
      {
        nombre: 'DGII',
        rnc: '131880738',
        urlAceptacion: 'https://ecf.dgii.gov.do/testecf/emisorreceptor',
        urlOpcional: 'https://ecf.dgii.gov.do/Testecf/emisorreceptor',
        urlRecepcion: 'https://ecf.dgii.gov.do/testecf/emisorreceptor',
      },
    ]);
  });

  it('Testing sending signed summary to DGII', async () => {
    if (!certs.key || !certs.cert) {
      return;
    }

    const noEcf = 'E320005000100'; //Sequence

    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    const auth = await ecf.authenticate();

    //console.log(auth);

    //Sign invoice
    const signature = new Signature(certs.key, certs.cert);

    //Stream Readable

    JsonECF32Summary.RFCE.Encabezado.IdDoc.eNCF = noEcf;
    //Adding ramdom security code
    JsonECF32Summary.RFCE.Encabezado.CodigoSeguridadeCF =
      generateRandomAlphaNumeric();
    const transformer = new Transformer();
    const xml = transformer.json2xml(JsonECF32Summary);

    const fileName = `${rnc}${noEcf}.xml`;
    const signedXml = signature.signXml(xml, 'RFCE');
    const response = await ecf.sendSummary(signedXml, fileName);

    expect(response).toBeDefined();
  });
});
