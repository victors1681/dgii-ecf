import AxiosMockAdapter from 'axios-mock-adapter';
import { ENVIRONMENT, restClient } from '../../networking';
import { TrackStatusEnum } from '../../networking/types';
import ECF from '../ECF';

const TRACK_IDS = '/TesteCF/ConsultaTrackIds/api/TrackIds/Consulta';
const INQUIRY_STATUS = '/TesteCF/consultaestado/api/Consultas/Estado';

const rncEmisor = '130862346';
const rncComprador = '401506254';
const trackIdNotFound = { codigo: 0, estado: 'TrackId no encontrado.' };

const entry = (trackId: string, estado: TrackStatusEnum) => ({
  trackId,
  estado,
  fechaRecepcion: '05/11/2026',
});

describe('ECF.checkDocumentStatus', () => {
  const mock = new AxiosMockAdapter(restClient);
  const ecf = new ECF({ key: undefined, cert: undefined }, ENVIRONMENT.DEV);

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('reports an accepted e-CF from ConsultaTrackIds', async () => {
    const encf = 'E310000000001';
    const accepted = entry('track-1', TrackStatusEnum.ACCEPTED);
    mock
      .onGet(TRACK_IDS, { params: { rncEmisor, encf } })
      .reply(200, [accepted]);

    await expect(ecf.checkDocumentStatus({ rncEmisor, encf })).resolves.toEqual(
      {
        status: TrackStatusEnum.ACCEPTED,
        trackId: 'track-1',
        source: 'ConsultaTrackIds',
        trackIds: [accepted],
      }
    );
  });

  it('keeps the accepted submission when a later resend was rejected', async () => {
    const encf = 'E310000000002';
    mock
      .onGet(TRACK_IDS)
      .reply(200, [
        entry('resend', TrackStatusEnum.REJECTED),
        entry('original', TrackStatusEnum.ACCEPTED),
      ]);

    const result = await ecf.checkDocumentStatus({ rncEmisor, encf });

    expect(result.status).toBe(TrackStatusEnum.ACCEPTED);
    expect(result.trackId).toBe('original');
    expect(result.trackIds).toHaveLength(2);
  });

  it('reports a pending submission over a rejected one', async () => {
    mock
      .onGet(TRACK_IDS)
      .reply(200, [
        entry('rejected', TrackStatusEnum.REJECTED),
        entry('pending', TrackStatusEnum.IN_PROCESS),
      ]);

    const result = await ecf.checkDocumentStatus({
      rncEmisor,
      encf: 'E310000000003',
    });

    expect(result.status).toBe(TrackStatusEnum.IN_PROCESS);
    expect(result.trackId).toBe('pending');
  });

  it('reports a conditionally accepted submission over pending and rejected ones', async () => {
    mock
      .onGet(TRACK_IDS)
      .reply(200, [
        entry('rejected', TrackStatusEnum.REJECTED),
        entry('pending', TrackStatusEnum.IN_PROCESS),
        entry('conditional', TrackStatusEnum.CONDITIONAL_ACCEPTED),
      ]);

    const result = await ecf.checkDocumentStatus({
      rncEmisor,
      encf: 'E310000000008',
    });

    expect(result.status).toBe(TrackStatusEnum.CONDITIONAL_ACCEPTED);
    expect(result.trackId).toBe('conditional');
  });

  it('reports a rejected e-CF when every submission was rejected', async () => {
    mock
      .onGet(TRACK_IDS)
      .reply(200, [entry('rejected', TrackStatusEnum.REJECTED)]);

    const result = await ecf.checkDocumentStatus({
      rncEmisor,
      encf: 'E310000000004',
    });

    expect(result.status).toBe(TrackStatusEnum.REJECTED);
    expect(result.trackId).toBe('rejected');
  });

  it('resolves "No encontrado" instead of throwing when DGII has no trackId', async () => {
    mock.onGet(TRACK_IDS).reply(400, trackIdNotFound);

    await expect(
      ecf.checkDocumentStatus({ rncEmisor, encf: 'E310000000005' })
    ).resolves.toEqual({
      status: TrackStatusEnum.NOT_FOUND,
      source: 'ConsultaTrackIds',
      trackIds: [],
    });
    expect(mock.history.get).toHaveLength(1);
  });

  it('does not query ConsultaEstado for an E32 without a security code', async () => {
    mock.onGet(TRACK_IDS).reply(400, trackIdNotFound);

    const result = await ecf.checkDocumentStatus({
      rncEmisor,
      encf: 'E320000000001',
    });

    expect(result.status).toBe(TrackStatusEnum.NOT_FOUND);
    expect(result.source).toBe('ConsultaTrackIds');
    expect(mock.history.get).toHaveLength(1);
  });

  it('falls back to ConsultaEstado for an RFCE summary (E32 < RD$250,000)', async () => {
    const encf = 'E320000000002';
    const codigoSeguridad = 'sEEYI9';
    const inquiry = {
      codigo: 1,
      estado: 'Aceptado',
      rncEmisor,
      ncfElectronico: encf,
      montoTotal: 637.2,
      rncComprador,
      codigoSeguridad,
    };
    mock.onGet(TRACK_IDS).reply(400, trackIdNotFound);
    mock
      .onGet(INQUIRY_STATUS, {
        params: {
          rncEmisor,
          ncfElectronico: encf,
          rncComprador,
          codigoSeguridad,
        },
      })
      .reply(200, inquiry);

    await expect(
      ecf.checkDocumentStatus({
        rncEmisor,
        encf,
        rncComprador,
        codigoSeguridad,
      })
    ).resolves.toEqual({
      status: TrackStatusEnum.ACCEPTED,
      source: 'ConsultaEstado',
      trackIds: [],
      inquiry,
    });
  });

  it('reports "No encontrado" when ConsultaEstado does not know the summary', async () => {
    mock.onGet(TRACK_IDS).reply(400, trackIdNotFound);
    mock
      .onGet(INQUIRY_STATUS)
      .reply(200, { codigo: 0, estado: 'No encontrado' });

    const result = await ecf.checkDocumentStatus({
      rncEmisor,
      encf: 'E320000000003',
      rncComprador,
      codigoSeguridad: 'ZZZ999',
    });

    expect(result.status).toBe(TrackStatusEnum.NOT_FOUND);
    expect(result.source).toBe('ConsultaEstado');
  });

  it('does not use ConsultaEstado when ConsultaTrackIds found an E32', async () => {
    // A full e-CF 32 >= RD$250,000 goes through recepcion and has a trackId.
    mock
      .onGet(TRACK_IDS)
      .reply(200, [entry('track-32', TrackStatusEnum.ACCEPTED)]);

    const result = await ecf.checkDocumentStatus({
      rncEmisor,
      encf: 'E320000000004',
      rncComprador,
      codigoSeguridad: 'ABC123',
    });

    expect(result.status).toBe(TrackStatusEnum.ACCEPTED);
    expect(result.source).toBe('ConsultaTrackIds');
    expect(mock.history.get).toHaveLength(1);
  });

  describe('with montoTotal', () => {
    it('asks only ConsultaEstado for an RFCE summary (one request)', async () => {
      mock.onGet(INQUIRY_STATUS).reply(200, { codigo: 1, estado: 'Aceptado' });

      const result = await ecf.checkDocumentStatus({
        rncEmisor,
        encf: 'E320000000010',
        rncComprador,
        codigoSeguridad: 'ABC123',
        montoTotal: 637.2,
      });

      expect(result.status).toBe(TrackStatusEnum.ACCEPTED);
      expect(result.source).toBe('ConsultaEstado');
      expect(mock.history.get.map((req) => req.url)).toEqual([INQUIRY_STATUS]);
    });

    it('throws without a security code for an RFCE summary, without calling DGII', async () => {
      await expect(
        ecf.checkDocumentStatus({
          rncEmisor,
          encf: 'E320000000011',
          rncComprador,
          montoTotal: '1000.00',
        })
      ).rejects.toThrow(/codigoSeguridad is required/);
      expect(mock.history.get).toHaveLength(0);
    });

    it('asks only ConsultaTrackIds for an e-CF 32 of RD$250,000 or more', async () => {
      mock.onGet(TRACK_IDS).reply(400, trackIdNotFound);

      const result = await ecf.checkDocumentStatus({
        rncEmisor,
        encf: 'E320000000012',
        rncComprador,
        codigoSeguridad: 'ABC123',
        montoTotal: 250000,
      });

      expect(result).toEqual({
        status: TrackStatusEnum.NOT_FOUND,
        source: 'ConsultaTrackIds',
        trackIds: [],
      });
      expect(mock.history.get.map((req) => req.url)).toEqual([TRACK_IDS]);
    });

    it('ignores montoTotal for other e-CF types', async () => {
      mock
        .onGet(TRACK_IDS)
        .reply(200, [entry('track-31', TrackStatusEnum.ACCEPTED)]);

      const result = await ecf.checkDocumentStatus({
        rncEmisor,
        encf: 'E310000000010',
        montoTotal: 100,
      });

      expect(result.status).toBe(TrackStatusEnum.ACCEPTED);
      expect(result.source).toBe('ConsultaTrackIds');
    });

    it.each([['N/A'], [''], ['   ']])(
      'treats an unusable total (%p) as unknown and still reaches ConsultaEstado',
      async (montoTotal) => {
        mock.onGet(TRACK_IDS).reply(400, trackIdNotFound);
        mock
          .onGet(INQUIRY_STATUS)
          .reply(200, { codigo: 1, estado: 'Aceptado' });

        const result = await ecf.checkDocumentStatus({
          rncEmisor,
          encf: 'E320000000013',
          rncComprador,
          codigoSeguridad: 'ABC123',
          montoTotal,
        });

        expect(result.status).toBe(TrackStatusEnum.ACCEPTED);
        expect(result.source).toBe('ConsultaEstado');
        expect(mock.history.get.map((req) => req.url)).toEqual([
          TRACK_IDS,
          INQUIRY_STATUS,
        ]);
      }
    );

    it('does not route a full e-CF 32 with a blank total as a summary', async () => {
      // Number('') is 0, which would wrongly mark it as a summary and throw
      // for the missing codigoSeguridad.
      mock
        .onGet(TRACK_IDS)
        .reply(200, [entry('track-32', TrackStatusEnum.ACCEPTED)]);

      const result = await ecf.checkDocumentStatus({
        rncEmisor,
        encf: 'E320000000014',
        montoTotal: '',
      });

      expect(result.status).toBe(TrackStatusEnum.ACCEPTED);
      expect(result.trackId).toBe('track-32');
    });
  });

  it('rethrows errors that do not mean "not found"', async () => {
    mock.onGet(TRACK_IDS).reply(401);

    await expect(
      ecf.checkDocumentStatus({ rncEmisor, encf: 'E310000000006' })
    ).rejects.toMatchObject({ status: 401 });
  });

  it('rethrows an HTTP 400 that is not "TrackId no encontrado."', async () => {
    const validationError = { codigo: 99, estado: 'RNC emisor inválido.' };
    mock.onGet(TRACK_IDS).reply(400, validationError);

    await expect(
      ecf.checkDocumentStatus({ rncEmisor, encf: 'E310000000007' })
    ).rejects.toMatchObject({ status: 400, data: validationError });
  });

  it('rethrows ConsultaEstado errors for an RFCE summary', async () => {
    mock.onGet(TRACK_IDS).reply(400, trackIdNotFound);
    mock.onGet(INQUIRY_STATUS).reply(401);

    await expect(
      ecf.checkDocumentStatus({
        rncEmisor,
        encf: 'E320000000020',
        rncComprador,
        codigoSeguridad: 'ABC123',
      })
    ).rejects.toMatchObject({ status: 401 });
  });

  it.each([
    ['an empty body', ''],
    ['a body without codigo', { estado: 'Aceptado' }],
    ['a null codigo', { codigo: null, estado: 'No encontrado' }],
    ['an unknown codigo', { codigo: 7, estado: 'Desconocido' }],
  ])(
    'throws instead of reporting "No encontrado" when ConsultaEstado returns %s',
    async (_label, body) => {
      mock.onGet(INQUIRY_STATUS).reply(200, body);

      await expect(
        ecf.checkDocumentStatus({
          rncEmisor,
          encf: 'E320000000021',
          rncComprador,
          codigoSeguridad: 'ABC123',
          montoTotal: 637.2,
        })
      ).rejects.toThrow(/unrecognized codigo/);
    }
  );
});
