import P12Reader from '../../P12Reader';
import CustomAuthentication from '../CustomAuthentication';
import path from 'path';
import fs from 'fs';

describe('Custom Authentication', () => {
  const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

  const reader = new P12Reader(secret);
  const certs = reader.getKeyFromFile(
    path.resolve(
      __dirname,
      `../../test_cert/${process.env.CERTIFICATE_NAME || ''}`
    )
  );
  const customAuthentication = new CustomAuthentication(certs);

  it('Generate a random seed file ', () => {
    const seed = customAuthentication.generateSeed();
    expect(seed).toBeDefined();
  });

  it('Validate Seed', async () => {
    const signedSeed = fs.readFileSync(
      path.resolve(__dirname, './data/seed-test_140133.xml'),
      'utf8'
    );

    const token = await customAuthentication.verifySignedSeed(signedSeed);

    const verification = await customAuthentication.verifyToken(token);
    expect(verification.isExpired).toBeFalsy();
  });

  it('Validate Seed with failed response', async () => {
    const signedSeed = fs.readFileSync(
      path.resolve(__dirname, './data/seed-test_140133.xml'),
      'utf8'
    );

    const token = await customAuthentication.verifySignedSeed(signedSeed);

    await expect(
      customAuthentication.verifyToken(token + '1')
    ).rejects.toThrow();
  });
});
