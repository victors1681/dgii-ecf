import P12Reader from '../P12Reader';
import path from 'path';
import fs from 'fs';

const PASSPHRASE = 'pass123';

describe('Testing certificate and getting data', () => {
  it('Reading certificate key and cert from file system', () => {
    const certificate = new P12Reader(PASSPHRASE);
    const p12 = certificate.getKeyFromFile(
      path.resolve(__dirname, 'sample/SAMPLE_CERT.p12')
    );

    expect(p12.key?.includes('-----BEGIN RSA PRIVATE KEY-----')).toBeTruthy();
    expect(p12.cert?.includes('-----BEGIN CERTIFICATE-----')).toBeTruthy();
  });
  it('Read certificate key and cert from base64 string', () => {
    const certificate = new P12Reader(PASSPHRASE);
    const base64 = fs.readFileSync(
      path.resolve(__dirname, 'sample/SAMPLE_CERT.p12'),
      'base64'
    );
    const p12 = certificate.getKeyFromStringBase64(base64);

    expect(p12.key?.includes('-----BEGIN RSA PRIVATE KEY-----')).toBeTruthy();
    expect(p12.cert?.includes('-----BEGIN CERTIFICATE-----')).toBeTruthy();
  });
});
