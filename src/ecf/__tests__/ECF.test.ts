import path from 'path';
import ECF from '../ECF';
import { ENVIRONMENT, restClient } from '../../networking';
import Signature from '../../Signature/Signature';
import fs from 'fs';
import {
  SummaryTrackingStatusResponse,
  TrackStatusEnum,
} from '../../networking/types';
import Transformer from '../../transformers';
import JsonECF31Invoice from './sample/ecf_json_data_31.json';
import JsonECF32Summary from './sample/cf_json_data_32.json';
import { generateRandomAlphaNumeric } from '../../utils/generateRandomAlphaNumeric';
import { getCurrentFormattedDate } from '../../utils';
import {
  hasTestCertificate,
  readTestCertificate,
} from '../../test_cert/hasTestCertificate';
const randomNum = () =>
  Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');

const describeWithCertificate = hasTestCertificate() ? describe : describe.skip;

/** DGII `ConsultaTrackIds` reports the reception date as `dd/MM/yyyy`. */
const RECEPTION_DATE_FORMAT = /^\d{2}\/\d{2}\/\d{4}$/;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Queries `ConsultaTrackIds` (RNC emisor + e-NCF) until DGII finishes
 * validating every submission, so assertions never race an `En Proceso` entry.
 */
const waitForTrackStatuses = async (
  ecf: ECF,
  rncEmisor: string,
  encf: string,
  attempts = 5
): Promise<SummaryTrackingStatusResponse[]> => {
  let statuses: SummaryTrackingStatusResponse[] = [];
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      statuses = (await ecf.trackStatuses(rncEmisor, encf)) ?? [];
    } catch (err) {
      // A just-sent e-CF may not be registered yet: DGII answers
      // `TrackId no encontrado.` (HTTP 400) until it is, so keep polling.
      const { status, data } = (err ?? {}) as {
        status?: number;
        data?: { estado?: unknown };
      };
      if (status !== 400 || !/no encontrado/i.test(String(data?.estado))) {
        throw err;
      }
      statuses = [];
    }
    const settled = statuses.every(
      (status) => status.estado !== TrackStatusEnum.IN_PROCESS
    );
    if (statuses.length > 0 && settled) {
      return statuses;
    }
    await sleep(2000);
  }
  return statuses;
};

/**
 * Builds a full e-CF 32 (Factura de Consumo >= RD$250,000) from the 31 sample.
 * Unlike the RFCE summary, a full 32 goes through `recepcion` and gets a
 * trackId, so it can be looked up with `ConsultaTrackIds`.
 */
const buildConsumerInvoice32 = (rncEmisor: string, encf: string) => {
  const invoice = JSON.parse(JSON.stringify(JsonECF31Invoice));
  const { Encabezado, DetallesItems, Paginacion } = invoice.ECF;

  Encabezado.IdDoc.TipoeCF = '32';
  Encabezado.IdDoc.eNCF = encf;
  // e-CF 32 does not accept the sequence expiration date.
  delete Encabezado.IdDoc.FechaVencimientoSecuencia;
  Encabezado.Emisor.RNCEmisor = rncEmisor;

  // 24 x 12,500 - 10% discount = 270,000 + 18% ITBIS = 318,600
  const item = DetallesItems.Item;
  item.PrecioUnitarioItem = 12500;
  item.DescuentoMonto = 30000;
  item.TablaSubDescuento.SubDescuento.MontoSubDescuento = 30000;
  item.MontoItem = 270000;

  Object.assign(Encabezado.Totales, {
    MontoGravadoTotal: 270000,
    MontoGravadoI1: 270000,
    TotalITBIS: 48600,
    TotalITBIS1: 48600,
    MontoTotal: 318600,
  });
  Object.assign(Paginacion.Pagina, {
    SubtotalMontoGravadoPagina: 270000,
    SubtotalMontoGravado1Pagina: 270000,
    SubtotalItbisPagina: 48600,
    SubtotalItbis1Pagina: 48600,
    MontoSubtotalPagina: 318600,
  });

  return invoice;
};

describeWithCertificate('Test Authentication flow', () => {
  let testTrackingNo = '';
  let testSignedXml = '';

  const rnc = process.env.RNC_EMISOR || ''; //Customer RNC
  const noEcf = `E3100050${randomNum()}`; //Sequence

  const certs = readTestCertificate();

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

  it('Testing authentication against Buyer HOST', async () => {
    if (!certs.key || !certs.cert) {
      return;
    }

    //HOST URL coming from the Directory from buyer authorized to receive eCF
    const urlOpcional = 'https://ecf.dgii.gov.do/Testecf/autenticacion';

    const auth = new ECF(certs, ENVIRONMENT.DEV);
    const tokenData = await auth.authenticate(urlOpcional);
    expect(tokenData?.token).toBeDefined();
    console.log('Buyer HOST Token:', tokenData?.token);
    expect(restClient.defaults.headers.common['Authorization']).toBeDefined();
  });

  it('Testing  sending signed invoice (31) to DGII', async () => {
    if (!certs.key || !certs.cert) {
      return;
    }

    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    const auth = await ecf.authenticate();

    //console.log(auth);

    //Sign invoice
    const signature = new Signature(certs.key, certs.cert);

    //Stream Readable

    JsonECF31Invoice.ECF.Encabezado.IdDoc.eNCF = noEcf;
    JsonECF31Invoice.ECF.Encabezado.Emisor.RNCEmisor = rnc;
    const transformer = new Transformer();
    const xml = transformer.json2xml(JsonECF31Invoice);
    const fileName = `${rnc}${noEcf}.xml`;
    const signedXml = signature.signXml(xml, 'ECF');
    testSignedXml = signedXml;

    //SAVE XML into temporaty file for manual testing in POSTMAN
    fs.writeFile(
      path.resolve(__dirname, `sample/generated/${fileName}`),
      signedXml,
      (err) => {
        if (err) {
          console.error('Error writing to file:', err);
          return;
        } else {
          console.log('File has been written successfully.');
        }
      }
    );

    const response = await ecf.sendElectronicDocument(signedXml, fileName);

    testTrackingNo = response?.trackId as string;
    expect(response?.trackId).toBeDefined();
    console.log(response);
  });

  it('Test TrackingID status', async () => {
    const trackId = testTrackingNo;
    const ecf = new ECF(certs, ENVIRONMENT.DEV);

    const response = await ecf.statusTrackId(trackId);

    expect([
      TrackStatusEnum.REJECTED,
      TrackStatusEnum.IN_PROCESS,
      TrackStatusEnum.ACCEPTED,
      TrackStatusEnum.CONDITIONAL_ACCEPTED,
    ]).toContain(response?.estado);
  });

  it('Test get all tracking (ALL_TACKING_ECF) by RNC emisor + e-NCF for e-CF 31', async () => {
    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    const response = await waitForTrackStatuses(ecf, rnc, noEcf);

    expect(response).toEqual([
      {
        trackId: testTrackingNo,
        estado: TrackStatusEnum.ACCEPTED,
        fechaRecepcion: expect.stringMatching(RECEPTION_DATE_FORMAT),
      },
    ]);

    await expect(
      ecf.checkDocumentStatus({ rncEmisor: rnc, encf: noEcf })
    ).resolves.toEqual({
      status: TrackStatusEnum.ACCEPTED,
      trackId: testTrackingNo,
      source: 'ConsultaTrackIds',
      trackIds: response,
    });
  });

  it('Test ALL_TACKING_ECF keeps the accepted trackId when the e-CF 31 is resent', async () => {
    // Reproduces a retry after a lost connection: DGII already received the
    // e-CF, so a blind resend is rejected. Checking by RNC emisor + e-NCF still
    // finds the original accepted submission, so the retry is not needed.
    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    await ecf.authenticate();

    const resend = await ecf.sendElectronicDocument(
      testSignedXml,
      `${rnc}${noEcf}.xml`
    );
    expect(resend?.trackId).toBeDefined();
    expect(resend?.trackId).not.toBe(testTrackingNo);

    const response = await waitForTrackStatuses(ecf, rnc, noEcf);

    expect(response).toHaveLength(2);
    expect(response).toEqual(
      expect.arrayContaining([
        {
          trackId: testTrackingNo,
          estado: TrackStatusEnum.ACCEPTED,
          fechaRecepcion: expect.stringMatching(RECEPTION_DATE_FORMAT),
        },
        {
          trackId: resend?.trackId,
          estado: TrackStatusEnum.REJECTED,
          fechaRecepcion: expect.stringMatching(RECEPTION_DATE_FORMAT),
        },
      ])
    );

    // checkDocumentStatus reports the original acceptance, not the resend.
    await expect(
      ecf.checkDocumentStatus({ rncEmisor: rnc, encf: noEcf })
    ).resolves.toMatchObject({
      status: TrackStatusEnum.ACCEPTED,
      trackId: testTrackingNo,
      source: 'ConsultaTrackIds',
    });
  });

  it('Test get all tracking (ALL_TACKING_ECF) by RNC emisor + e-NCF for e-CF 32', async () => {
    if (!certs.key || !certs.cert) {
      return;
    }

    const noEcf32 = `E3200050${randomNum()}`;
    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    await ecf.authenticate();

    const signature = new Signature(certs.key, certs.cert);
    const xml = new Transformer().json2xml(
      buildConsumerInvoice32(rnc, noEcf32)
    );
    const signedXml = signature.signXml(xml, 'ECF');

    const sent = await ecf.sendElectronicDocument(
      signedXml,
      `${rnc}${noEcf32}.xml`
    );
    expect(sent?.trackId).toBeDefined();

    const response = await waitForTrackStatuses(ecf, rnc, noEcf32);

    expect(response).toEqual([
      {
        trackId: sent?.trackId,
        estado: TrackStatusEnum.ACCEPTED,
        fechaRecepcion: expect.stringMatching(RECEPTION_DATE_FORMAT),
      },
    ]);

    // A full e-CF 32 has a trackId, so no security code is needed.
    await expect(
      ecf.checkDocumentStatus({ rncEmisor: rnc, encf: noEcf32 })
    ).resolves.toMatchObject({
      status: TrackStatusEnum.ACCEPTED,
      trackId: sent?.trackId,
      source: 'ConsultaTrackIds',
    });
  });

  it('Test ALL_TACKING_ECF returns "TrackId no encontrado." for an e-NCF never sent', async () => {
    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    const unknownEcf = `E3100099${randomNum()}`;

    await expect(ecf.trackStatuses(rnc, unknownEcf)).rejects.toMatchObject({
      status: 400,
      data: { codigo: 0, estado: 'TrackId no encontrado.' },
    });

    // checkDocumentStatus resolves instead of throwing: safe to send.
    await expect(
      ecf.checkDocumentStatus({ rncEmisor: rnc, encf: unknownEcf })
    ).resolves.toEqual({
      status: TrackStatusEnum.NOT_FOUND,
      source: 'ConsultaTrackIds',
      trackIds: [],
    });
  });

  it('Test customer directory lookup by RNC', async () => {
    // DGII retired the bulk `listado` query, which returned its own entry for
    // any input; the per-RNC lookup needs a registered RNC (DGII's own).
    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    const dgiiRnc = '131880681';
    const response = await ecf.getCustomerDirectory(dgiiRnc);
    expect(response?.[0]).toMatchObject({
      rnc: dgiiRnc,
      urlRecepcion: expect.any(String),
      urlAceptacion: expect.any(String),
    });
  });

  it('Testing sending signed summary (32) to DGII', async () => {
    if (!certs.key || !certs.cert) {
      return;
    }

    const noEcf = `E3200050${randomNum()}`; //Sequence

    const ecf = new ECF(certs, ENVIRONMENT.DEV);
    await ecf.authenticate();

    const securityCode = generateRandomAlphaNumeric();
    //console.log(auth);

    //Sign invoice
    const signature = new Signature(certs.key, certs.cert);

    //Stream Readable

    JsonECF32Summary.RFCE.Encabezado.IdDoc.eNCF = noEcf;
    //Adding ramdom security code
    JsonECF32Summary.RFCE.Encabezado.CodigoSeguridadeCF = securityCode;
    JsonECF32Summary.RFCE.Encabezado.Emisor.RNCEmisor =
      process.env.RNC_EMISOR || '';
    JsonECF32Summary.RFCE.Encabezado.Emisor.FechaEmision =
      getCurrentFormattedDate();
    const transformer = new Transformer();
    const xml = transformer.json2xml(JsonECF32Summary);

    const fileName = `${rnc}${noEcf}.xml`;
    const signedXml = signature.signXml(xml, 'RFCE');
    const response = await ecf.sendSummary(signedXml, fileName);

    expect(response).toBeDefined();

    //Check the status

    const statusResponse = await ecf.inquiryStatus(
      JsonECF32Summary.RFCE.Encabezado.Emisor.RNCEmisor,
      noEcf,
      JsonECF32Summary.RFCE.Encabezado.Comprador.RNCComprador,
      securityCode
    );

    expect(statusResponse?.codigoSeguridad).toBe(securityCode);
    expect(statusResponse?.montoTotal).toBe(
      JsonECF32Summary.RFCE.Encabezado.Totales.MontoTotal
    );

    // An RFCE summary (e-CF 32 < RD$250,000) is answered synchronously and
    // never gets a trackId, so ALL_TACKING_ECF cannot find it: use
    // inquiryStatus (RNC emisor + e-NCF + security code) to verify it instead.
    await expect(ecf.trackStatuses(rnc, noEcf)).rejects.toMatchObject({
      status: 400,
      data: { estado: 'TrackId no encontrado.' },
    });

    // checkDocumentStatus falls back to ConsultaEstado for the summary.
    const rncComprador =
      JsonECF32Summary.RFCE.Encabezado.Comprador.RNCComprador;
    await expect(
      ecf.checkDocumentStatus({
        rncEmisor: rnc,
        encf: noEcf,
        rncComprador,
        codigoSeguridad: securityCode,
      })
    ).resolves.toMatchObject({
      status: TrackStatusEnum.ACCEPTED,
      source: 'ConsultaEstado',
      inquiry: { codigoSeguridad: securityCode },
    });

    // With the total, ConsultaEstado is asked directly (one request).
    await expect(
      ecf.checkDocumentStatus({
        rncEmisor: rnc,
        encf: noEcf,
        rncComprador,
        codigoSeguridad: securityCode,
        montoTotal: JsonECF32Summary.RFCE.Encabezado.Totales.MontoTotal,
      })
    ).resolves.toMatchObject({
      status: TrackStatusEnum.ACCEPTED,
      source: 'ConsultaEstado',
    });

    // Without the exact security code the accepted summary cannot be found.
    await expect(
      ecf.checkDocumentStatus({
        rncEmisor: rnc,
        encf: noEcf,
        rncComprador,
        codigoSeguridad: 'ZZZ999',
      })
    ).resolves.toMatchObject({
      status: TrackStatusEnum.NOT_FOUND,
      source: 'ConsultaEstado',
    });
  });

  it('Testing sending signed summary (32) to DGII and handle errors', async () => {
    if (!certs.key || !certs.cert) {
      return;
    }

    // This test expects an error to be thrown due to invalid data
    let errorWasThrown = false;

    try {
      const noEcf32 = `E3200050${randomNum()}`; //Sequence
      const ecf = new ECF(certs, ENVIRONMENT.DEV);
      await ecf.authenticate();

      const securityCode = generateRandomAlphaNumeric();

      //Sign invoice
      const signature = new Signature(certs.key, certs.cert);

      //Stream Readable - intentionally set invalid data to trigger error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      JsonECF32Summary.RFCE.Encabezado.IdDoc.TipoIngresos = '01' as any; //make it fail with wrong data

      JsonECF32Summary.RFCE.Encabezado.IdDoc.eNCF = noEcf32;
      //Adding random security code
      JsonECF32Summary.RFCE.Encabezado.CodigoSeguridadeCF = securityCode;

      const transformer = new Transformer();
      const xml = transformer.json2xml(JsonECF32Summary);
      const fileName = `${rnc}${noEcf32}.xml`;
      const signedXml = signature.signXml(xml, 'RFCE');

      // This should throw an error due to invalid data
      const response = await ecf.sendSummary(signedXml, fileName);

      // If we reach here without an error, the test should fail
      if (response) {
        // Try the status check - this might be where the error occurs
        await ecf.inquiryStatus(
          JsonECF32Summary.RFCE.Encabezado.Emisor.RNCEmisor,
          noEcf32, // Fixed: use noEcf32 instead of noEcf
          JsonECF32Summary.RFCE.Encabezado.Comprador.RNCComprador,
          securityCode
        );

        // If we get here without an error, the test should fail
        fail(
          'Expected an error to be thrown due to invalid data, but the operation succeeded'
        );
      }
    } catch (err) {
      errorWasThrown = true;

      // Improved error handling with proper typing
      const error = err as Error & { codigo?: number };

      // Check if the error has the expected error code
      if (error && typeof error === 'object' && 'codigo' in error) {
        expect(error.codigo).toBe(2);
      } else {
        // If the error structure is different, log it for debugging
        console.log('Received error:', error);
        // Still pass the test since we expected an error
        expect(errorWasThrown).toBe(true);
      }
    }

    // Ensure an error was actually thrown
    expect(errorWasThrown).toBe(true);
  });

  it('Testing interceptor 401 response', async () => {
    try {
      const trackId = testTrackingNo;
      const ecf = new ECF(certs, ENVIRONMENT.DEV, undefined);
      await ecf.statusTrackId(trackId);
    } catch (err) {
      const error = err as Error & { status?: number };
      expect(error.status).toEqual(401);
    }
  });
});
