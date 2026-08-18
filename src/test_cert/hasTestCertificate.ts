import fs from 'fs';
import path from 'path';

import P12Reader, { P12ReaderData } from '../P12Reader';

/**
 * The DGII test certificate is a private artifact: `*.p12` is git-ignored, and
 * CI downloads it from a private repository using `CERTIFICATE_ACCESS_TOKEN`.
 * It is therefore absent in a fresh clone and in pull requests opened from
 * forks, which GitHub does not give repository secrets to.
 *
 * Suites that need to sign or authenticate against DGII use these helpers to
 * skip themselves when the certificate is missing, instead of failing on an
 * unreadable path. Everything that does not need the certificate still runs, so
 * a contributor without it gets a meaningful result rather than a red build.
 *
 * @returns Absolute path to the certificate, or `null` when it is unavailable.
 */
export const getTestCertificatePath = (): string | null => {
  const certificateName = process.env.CERTIFICATE_NAME;

  if (!certificateName) {
    return null;
  }

  const certificatePath = path.resolve(__dirname, certificateName);

  return fs.existsSync(certificatePath) ? certificatePath : null;
};

/**
 * Whether the DGII test certificate is available to the current test run.
 *
 * @see getTestCertificatePath
 */
export const hasTestCertificate = (): boolean =>
  getTestCertificatePath() !== null;

/**
 * Loads the DGII test certificate, or empty key material when it is
 * unavailable.
 *
 * Returning rather than throwing is deliberate: Jest evaluates a `describe`
 * body during collection even when the suite is skipped, so a suite that loads
 * the certificate at `describe` scope would still blow up on a missing file.
 * Empty key material also keeps the existing `if (!certs.key || !certs.cert)`
 * guards inside individual tests meaningful.
 */
export const readTestCertificate = (): P12ReaderData => {
  const certificatePath = getTestCertificatePath();

  if (!certificatePath) {
    return { key: undefined, cert: undefined, publicKey: undefined };
  }

  const reader = new P12Reader(process.env.CERTIFICATE_TEST_PASSWORD || '');

  return reader.getKeyFromFile(certificatePath);
};
