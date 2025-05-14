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

  it('should extract certificate info correctly', () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const certificate = new P12Reader(secret);
    const certInfo = certificate.getCertificateInfo(
      path.resolve(__dirname, `../test_cert/${process.env.CERTIFICATE_NAME}`)
    );

    expect(certInfo).toHaveProperty('subject');
    expect(certInfo).toHaveProperty('issuer');
    expect(certInfo).toHaveProperty('validFrom');
    expect(certInfo).toHaveProperty('validTo');
    expect(certInfo).toHaveProperty('serialNumber');
    expect(typeof certInfo.subject).toBe('string');
    expect(typeof certInfo.issuer).toBe('string');
    expect(certInfo.validFrom instanceof Date).toBe(true);
    expect(certInfo.validTo instanceof Date).toBe(true);
    expect(typeof certInfo.serialNumber).toBe('string');
  });

  it('should throw error for invalid file path in getKeyFromFile', () => {
    const certificate = new P12Reader(PASSPHRASE);
    expect(() =>
      certificate.getKeyFromFile('invalid/path/to/file.p12')
    ).toThrow();
  });

  it('should extract certificate info from base64 string', () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';
    const certificate = new P12Reader(secret);
    const base64 = fs.readFileSync(
      path.resolve(__dirname, `../test_cert/${process.env.CERTIFICATE_NAME}`),
      'base64'
    );
    const certInfo = certificate.getCertificateInfoFromBase64(base64);

    expect(certInfo).toHaveProperty('subject');
    expect(certInfo).toHaveProperty('issuer');
    expect(certInfo).toHaveProperty('validFrom');
    expect(certInfo).toHaveProperty('validTo');
    expect(certInfo).toHaveProperty('serialNumber');
    expect(typeof certInfo.subject).toBe('string');
    expect(typeof certInfo.issuer).toBe('string');
    expect(certInfo.validFrom instanceof Date).toBe(true);
    expect(certInfo.validTo instanceof Date).toBe(true);
    expect(typeof certInfo.serialNumber).toBe('string');
  });
});
