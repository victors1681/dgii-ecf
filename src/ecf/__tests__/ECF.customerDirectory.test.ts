import AxiosMockAdapter from 'axios-mock-adapter';
import { ENVIRONMENT, restClient } from '../../networking';
import { ServiceDirectoryResponse } from '../../networking/types';
import ECF from '../ECF';

const rnc = '131880681';
const directoryEntry: ServiceDirectoryResponse = {
  nombre: 'DGII',
  rnc,
  urlAceptacion: 'https://ecf.dgii.gov.do/testecf/emisorreceptor',
  urlOpcional: 'https://ecf.dgii.gov.do/Testecf/autenticacion',
  urlRecepcion: 'https://ecf.dgii.gov.do/testecf/emisorreceptor',
};

describe('ECF.getCustomerDirectory', () => {
  const mock = new AxiosMockAdapter(restClient);
  const credentials = { key: undefined, cert: undefined };

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('returns the array as-is when the service responds with an array', async () => {
    mock
      .onGet('/TesteCF/consultadirectorio/api/consultas/listado', {
        params: { rnc },
      })
      .reply(200, [directoryEntry]);

    const ecf = new ECF(credentials, ENVIRONMENT.DEV);

    await expect(ecf.getCustomerDirectory(rnc)).resolves.toEqual([
      directoryEntry,
    ]);
  });

  it('wraps a single object response in an array (production eCF shape)', async () => {
    mock
      .onGet('/eCF/consultadirectorio/api/consultas/obtenerdirectorioporrnc', {
        params: { rnc },
      })
      .reply(200, directoryEntry);

    const ecf = new ECF(credentials, ENVIRONMENT.PROD);

    // The production directory service returns a single object; getCustomerDirectory
    // normalizes it to an array so consumers always get ServiceDirectoryResponse[].
    await expect(ecf.getCustomerDirectory(rnc)).resolves.toEqual([
      directoryEntry,
    ]);
  });

  it('returns undefined when the service responds with no body', async () => {
    mock
      .onGet('/eCF/consultadirectorio/api/consultas/obtenerdirectorioporrnc', {
        params: { rnc },
      })
      .reply(200, null);

    const ecf = new ECF(credentials, ENVIRONMENT.PROD);

    await expect(ecf.getCustomerDirectory(rnc)).resolves.toBeUndefined();
  });
});
