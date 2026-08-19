import AxiosMockAdapter from 'axios-mock-adapter';
import { ENVIRONMENT, restClient } from '../../networking';
import {
  DgiiApiError,
  extractDgiiErrorMessage,
  toDgiiApiError,
} from '../DgiiApiError';
import RestApi from '../RestApi';

const DELEGATION_ERROR =
  'El RNC 00112233445 del certificado no está delegado para realizar transaciones.';

describe('extractDgiiErrorMessage', () => {
  it('returns the body when DGII answers with a bare string', () => {
    expect(extractDgiiErrorMessage(DELEGATION_ERROR)).toBe(DELEGATION_ERROR);
  });

  it('unwraps a JSON encoded string served as text', () => {
    expect(extractDgiiErrorMessage(JSON.stringify(DELEGATION_ERROR))).toBe(
      DELEGATION_ERROR
    );
  });

  it('parses a JSON body delivered as a string', () => {
    expect(
      extractDgiiErrorMessage(JSON.stringify({ mensaje: DELEGATION_ERROR }))
    ).toBe(DELEGATION_ERROR);
  });

  it('joins the `mensajes` list returned by the reception services', () => {
    expect(
      extractDgiiErrorMessage({
        mensajes: [
          { valor: 'Fecha de emisión inválida', codigo: 2 },
          { valor: 'e-NCF duplicado', codigo: 3 },
        ],
      })
    ).toBe('Fecha de emisión inválida | e-NCF duplicado');
  });

  it('supports `mensajes` returned as plain strings', () => {
    expect(extractDgiiErrorMessage({ mensajes: ['Rango no disponible'] })).toBe(
      'Rango no disponible'
    );
  });

  it('reads the usual ASP.NET message keys', () => {
    expect(extractDgiiErrorMessage({ Message: 'Token expirado' })).toBe(
      'Token expirado'
    );
    expect(extractDgiiErrorMessage({ error: 'invalid_grant' })).toBe(
      'invalid_grant'
    );
  });

  it('flattens ModelState validation errors', () => {
    expect(
      extractDgiiErrorMessage({
        title: 'One or more validation errors occurred.',
        errors: { xml: ['El campo xml es requerido.'] },
      })
    ).toBe('One or more validation errors occurred.');

    expect(
      extractDgiiErrorMessage({
        errors: { xml: ['El campo xml es requerido.'] },
      })
    ).toBe('xml: El campo xml es requerido.');
  });

  it('reduces an HTML error page to its text', () => {
    const html =
      '<html><head><title>500</title></head><body><h1>Error del servidor</h1></body></html>';
    expect(extractDgiiErrorMessage(html)).toBe('500 Error del servidor');
  });

  it('decodes a buffered body', () => {
    expect(extractDgiiErrorMessage(Buffer.from(DELEGATION_ERROR, 'utf8'))).toBe(
      DELEGATION_ERROR
    );
  });

  it('returns undefined when there is nothing to report', () => {
    expect(extractDgiiErrorMessage(undefined)).toBeUndefined();
    expect(extractDgiiErrorMessage(null)).toBeUndefined();
    expect(extractDgiiErrorMessage('   ')).toBeUndefined();
    expect(extractDgiiErrorMessage({})).toBeUndefined();
  });
});

describe('toDgiiApiError', () => {
  it('keeps an existing DgiiApiError untouched', () => {
    const error = new DgiiApiError('already normalized');
    expect(toDgiiApiError(error)).toBe(error);
  });

  it('uses the fallback message when DGII sent no description', () => {
    const error = toDgiiApiError(new Error(''), {
      fallbackMessage: 'ERROR 401: Unauthorized, please check your credentials',
    });
    expect(error.message).toBe(
      'ERROR 401: Unauthorized, please check your credentials'
    );
  });

  it('normalizes a raw DGII payload thrown by older code paths', () => {
    const error = toDgiiApiError({
      mensajes: [{ valor: 'e-NCF vencido', codigo: 4 }],
    });
    expect(error).toBeInstanceOf(DgiiApiError);
    expect(error.message).toBe('e-NCF vencido');
    expect(error.mensajes).toEqual([{ valor: 'e-NCF vencido', codigo: 4 }]);
  });

  it('does not recurse forever on a cyclic payload', () => {
    // Anything can be thrown at `toDgiiApiError`; a self-referencing payload
    // used to recurse until the stack overflowed, hiding the real failure.
    const cyclic: Record<string, unknown> = { errors: {} };
    (cyclic.errors as Record<string, unknown>).self = cyclic;
    cyclic.list = [cyclic];

    expect(() => toDgiiApiError(cyclic)).not.toThrow();
    expect(toDgiiApiError(cyclic).message).toBe('DGII request failed');
  });

  it('serializes the useful fields with JSON.stringify', () => {
    const error = new DgiiApiError(DELEGATION_ERROR, {
      status: 400,
      statusText: 'Bad Request',
      resource: '/TesteCF/autenticacion/api/Autenticacion/ValidarSemilla',
      data: DELEGATION_ERROR,
    });

    expect(JSON.parse(JSON.stringify(error))).toMatchObject({
      name: 'DgiiApiError',
      message: DELEGATION_ERROR,
      status: 400,
      statusText: 'Bad Request',
      data: DELEGATION_ERROR,
    });
  });
});

describe('RestApi error propagation', () => {
  const mock = new AxiosMockAdapter(restClient);
  const api = new RestApi(ENVIRONMENT.DEV);

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('reports the DGII text returned by ValidarSemilla instead of the axios message', async () => {
    mock
      .onPost('/TesteCF/autenticacion/api/Autenticacion/ValidarSemilla')
      .reply(400, DELEGATION_ERROR);

    expect.assertions(5);
    try {
      await api.getAuthTokenApi('<SemillaModel />');
    } catch (err) {
      const error = err as DgiiApiError;
      expect(error).toBeInstanceOf(DgiiApiError);
      // Regression: this used to be `Request failed with status code 400`.
      expect(error.message).toBe(DELEGATION_ERROR);
      expect(error.status).toBe(400);
      expect(error.data).toBe(DELEGATION_ERROR);
      expect(error.resource).toBe(
        '/TesteCF/autenticacion/api/Autenticacion/ValidarSemilla'
      );
    }
  });

  it('reports the DGII text returned by the seed endpoint', async () => {
    mock
      .onGet('/TesteCF/Autenticacion/api/Autenticacion/Semilla')
      .reply(500, 'Servicio de autenticación no disponible');

    await expect(api.getSeedApi()).rejects.toThrow(
      'Servicio de autenticación no disponible'
    );
  });

  it('falls back to the status when DGII returns an empty body', async () => {
    mock
      .onPost('/TesteCF/autenticacion/api/Autenticacion/ValidarSemilla')
      .reply(400);

    await expect(api.getAuthTokenApi('<SemillaModel />')).rejects.toThrow(
      'DGII request failed with status code 400'
    );
  });

  it('keeps the 401 hint when DGII does not explain the rejection', async () => {
    mock.onGet('/TesteCF/consultaresultado/api/Consultas/Estado').reply(401);

    await expect(api.statusTrackIdApi('track-id')).rejects.toThrow(
      'ERROR 401: Unauthorized, please check your credentials'
    );
  });

  it('prefers the DGII description over the generic 401 hint', async () => {
    mock
      .onGet('/TesteCF/consultaresultado/api/Consultas/Estado')
      .reply(401, 'Token vencido');

    await expect(api.statusTrackIdApi('track-id')).rejects.toThrow(
      'Token vencido'
    );
  });

  it('exposes the `mensajes` returned when sending a document', async () => {
    mock
      .onPost('/TesteCF/recepcion/api/FacturasElectronicas')
      .reply(400, { mensajes: [{ valor: 'e-NCF duplicado', codigo: 3 }] });

    expect.assertions(2);
    try {
      await api.sendElectronicDocumentApi('<ECF />', '101E310000001.xml');
    } catch (err) {
      const error = err as DgiiApiError;
      expect(error.message).toBe('e-NCF duplicado');
      expect(error.mensajes).toEqual([{ valor: 'e-NCF duplicado', codigo: 3 }]);
    }
  });

  it('surfaces transport errors with their axios code', async () => {
    mock.onGet('/TesteCF/consultaresultado/api/Consultas/Estado').timeout();

    expect.assertions(3);
    try {
      await api.statusTrackIdApi('track-id');
    } catch (err) {
      const error = err as DgiiApiError;
      expect(error).toBeInstanceOf(DgiiApiError);
      expect(error.status).toBeUndefined();
      expect(error.code).toBe('ECONNABORTED');
    }
  });
});
