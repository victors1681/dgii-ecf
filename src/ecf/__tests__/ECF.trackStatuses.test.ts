import AxiosMockAdapter from 'axios-mock-adapter';
import { ENVIRONMENT, restClient } from '../../networking';
import { SummaryTrackingStatusResponse } from '../../networking/types';
import ECF from '../ECF';

const rncEmisor = '131880681';
const encf = 'E310005000201';

const DEV_RESOURCE = '/TesteCF/ConsultaTrackIds/api/TrackIds/Consulta';
const PROD_RESOURCE = '/eCF/ConsultaTrackIds/api/TrackIds/Consulta';

const trackingDetail: SummaryTrackingStatusResponse = {
  trackId: '5f0a4e4f-1f4e-4b3a-8a9c-2f0b1c3d4e5f',
  estado: 'Aceptado',
  fechaRecepcion: '18-08-2026 09:15:03',
};

const secondTrackingDetail: SummaryTrackingStatusResponse = {
  trackId: '7d2b6c8a-3e5d-4c1b-9f7e-8a6b5c4d3e2f',
  estado: 'Rechazado',
  fechaRecepcion: '18-08-2026 09:18:47',
};

describe('ECF.trackStatuses (Consulta de trackId e-CF)', () => {
  const mock = new AxiosMockAdapter(restClient);
  const credentials = { key: undefined, cert: undefined };

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('returns every TrackId associated with the e-NCF', async () => {
    mock
      .onGet(DEV_RESOURCE, { params: { rncEmisor, encf } })
      .reply(200, [trackingDetail, secondTrackingDetail]);

    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(ecf.trackStatuses(rncEmisor, encf)).resolves.toEqual([
      trackingDetail,
      secondTrackingDetail,
    ]);
  });

  it('queries the production environment resource', async () => {
    mock
      .onGet(PROD_RESOURCE, { params: { rncEmisor, encf } })
      .reply(200, [trackingDetail]);

    const ecf = new ECF(credentials, ENVIRONMENT.PROD);

    await expect(ecf.trackStatuses(rncEmisor, encf)).resolves.toEqual([
      trackingDetail,
    ]);
  });

  it('wraps a single TrackingDetalle object in an array', async () => {
    // DGII documents the response as a single object even though the service can
    // return several TrackIds for the same e-NCF.
    mock
      .onGet(DEV_RESOURCE, { params: { rncEmisor, encf } })
      .reply(200, trackingDetail);

    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(ecf.trackStatuses(rncEmisor, encf)).resolves.toEqual([
      trackingDetail,
    ]);
  });

  it('returns undefined when the service responds with no body', async () => {
    mock.onGet(DEV_RESOURCE, { params: { rncEmisor, encf } }).reply(200, null);

    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(ecf.trackStatuses(rncEmisor, encf)).resolves.toBeUndefined();
  });

  it('trims the parameters before sending them to DGII', async () => {
    mock
      .onGet(DEV_RESOURCE, { params: { rncEmisor, encf } })
      .reply(200, [trackingDetail]);

    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(
      ecf.trackStatuses(` ${rncEmisor} `, ` ${encf} `)
    ).resolves.toEqual([trackingDetail]);
  });

  it('rejects a missing RNC Emisor without calling DGII', async () => {
    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(ecf.trackStatuses('', encf)).rejects.toThrow(
      'El campo RNC Emisor es requerido.'
    );
    expect(mock.history.get).toHaveLength(0);
  });

  it('rejects a missing ENCF without calling DGII', async () => {
    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(ecf.trackStatuses(rncEmisor, '   ')).rejects.toThrow(
      'El campo ENCF es requerido.'
    );
    expect(mock.history.get).toHaveLength(0);
  });

  it('rejects an RNC Emisor with an invalid length', async () => {
    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(ecf.trackStatuses('1318806', encf)).rejects.toThrow(
      'La longitud del RNC Emisor es inválida.'
    );
    expect(mock.history.get).toHaveLength(0);
  });

  it('accepts an 11 digit RNC/Cédula as issuer', async () => {
    const cedulaEmisor = '00112345678';

    mock
      .onGet(DEV_RESOURCE, { params: { rncEmisor: cedulaEmisor, encf } })
      .reply(200, [trackingDetail]);

    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(ecf.trackStatuses(cedulaEmisor, encf)).resolves.toEqual([
      trackingDetail,
    ]);
  });

  it('rejects an ENCF with an invalid length', async () => {
    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(ecf.trackStatuses(rncEmisor, 'E31000500')).rejects.toThrow(
      'La longitud del ENCF es inválida.'
    );
    expect(mock.history.get).toHaveLength(0);
  });

  it('propagates the DGII error body when the token is not delegated', async () => {
    const dgiiError = {
      mensaje:
        'El RNC del token no está autorizado a consultar el trackid de este e-NCF, favor verificar que se encuentre delegado por el emisor y volver a intentarlo.',
    };

    mock
      .onGet(DEV_RESOURCE, { params: { rncEmisor, encf } })
      .reply(400, dgiiError);

    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(ecf.trackStatuses(rncEmisor, encf)).rejects.toEqual(dgiiError);
  });
});
