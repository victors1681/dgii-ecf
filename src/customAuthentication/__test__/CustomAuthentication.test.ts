import P12Reader from '../../P12Reader';
import CustomAuthentication from '../CustomAuthentication';
import path from 'path';
import fs from 'fs';
import Signature from '../../Signature/Signature';

describe('Custom Authentication', () => {
  const privateKey = 'YOUR_XYZ_RANDOM_KEY';

  const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

  const reader = new P12Reader(secret);
  const certs = reader.getKeyFromFile(
    path.resolve(__dirname, '../../test_cert/4303328_identity.p12')
  );
  const publicKey = certs.cert!;
  const customAuthentication = new CustomAuthentication(privateKey, publicKey);

  it('Generate a ramdom seed file ', () => {
    const seed = customAuthentication.generateSeed();
    expect(seed).toBeDefined();
  });
  it('Validate Seed', async () => {
    // const seed = fs.readFileSync(
    //   path.resolve(__dirname, './data/seed-test.xml'),
    //   'utf8'
    // );

    const signedSeed = fs.readFileSync(
      path.resolve(__dirname, './data/seed-test_140133.xml'),
      'utf8'
    );

    //const signedSeed = await customAuthentication.verifySignedSeed(seed);
    const result = await customAuthentication.verifySignedSeed(signedSeed);
    expect(result).toBe('');
  });
});
