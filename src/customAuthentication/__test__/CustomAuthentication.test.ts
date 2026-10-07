import CustomAuthentication from '../CustomAuthentication';
import path from 'path';
import fs from 'fs';
import {
  hasTestCertificate,
  readTestCertificate,
} from '../../test_cert/hasTestCertificate';

const describeWithCertificate = hasTestCertificate() ? describe : describe.skip;

describeWithCertificate('Custom Authentication', () => {
  let customAuthentication: CustomAuthentication;

  // Constructed in a hook rather than at `describe` scope: the constructor
  // rejects empty key material, and Jest evaluates a `describe` body even when
  // the suite is skipped. Hooks only run for suites that actually execute.
  beforeAll(() => {
    customAuthentication = new CustomAuthentication(readTestCertificate());
  });

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
