import path from 'path';
import P12Reader from 'src/P12Reader';
import Auth from '../Auth';

describe('Test Authentication flow', () => {
  it('Testing path', async () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(__dirname, 'sample/4303328_identity.p12')
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    const auth = new Auth(certs);
    const token = await auth.getAccessToken();
    expect(token).toBeTruthy();
  });
});
