import AxiosMockAdapter from 'axios-mock-adapter';
import { ENVIRONMENT, restClient } from '../../networking';
import ECF from '../ECF';

describe('ECF.getSummaryInvoiceInquiry', () => {
  const mock = new AxiosMockAdapter(restClient);
  const credentials = { key: undefined, cert: undefined };

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('requests the RFCE inquiry without a double slash in the path', async () => {
    // fc.dgii.gov.do answers `/eCF//consultarfce/...` with a malformed response
    const params = {
      rnc_emisor: '131880681',
      encf: 'E320000000001',
      cod_seguridad_eCF: 'ABC123',
    };
    mock
      .onGet('/eCF/consultarfce/api/Consultas/Consulta', { params })
      .reply(200, { encf: params.encf });

    const ecf = new ECF(credentials, ENVIRONMENT.PROD);

    await expect(
      ecf.getSummaryInvoiceInquiry(
        params.rnc_emisor,
        params.encf,
        params.cod_seguridad_eCF
      )
    ).resolves.toEqual({ encf: params.encf });
  });
});
