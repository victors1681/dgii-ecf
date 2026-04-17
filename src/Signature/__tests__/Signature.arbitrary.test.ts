import Signature from '../Signature';
import fs from 'fs';
import path from 'path';
import P12Reader from '../../P12Reader';
import { DOMParser } from '@xmldom/xmldom';
import xpath from 'xpath';

describe('Sign Arbitrary XML Documents', () => {
  it('Should sign Postulacion XML document', () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(
        __dirname,
        `../../test_cert/${process.env.CERTIFICATE_NAME || ''}`
      )
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    const postulacionXml = fs.readFileSync(
      path.resolve(__dirname, 'sample/Postulacion.xml'),
      'utf-8'
    );

    const signature = new Signature(certs.key, certs.cert);

    // Sign arbitrary XML document with custom root element name
    const signedXml = signature.signXml(postulacionXml, 'Postulacion');

    // Verify the signature was embedded in the document
    const doc = new DOMParser().parseFromString(signedXml) as any;

    // Check that Signature element exists
    const signatureNodes = xpath.select(
      "//*[local-name(.)='Signature']",
      doc
    ) as any;
    expect(signatureNodes.length).toBeGreaterThan(0);

    // Check that DigestValue exists
    const digestNodes = xpath.select(
      "//*[local-name(.)='DigestValue']",
      doc
    ) as any;
    expect(digestNodes.length).toBeGreaterThan(0);
    expect(digestNodes[0].firstChild.data).toBeTruthy();

    // Check that SignatureValue exists
    const signatureValueNodes = xpath.select(
      "//*[local-name(.)='SignatureValue']",
      doc
    ) as any;
    expect(signatureValueNodes.length).toBeGreaterThan(0);
    expect(signatureValueNodes[0].firstChild.data).toBeTruthy();

    // Verify original content is preserved
    const postulacionNodes = xpath.select(
      "//*[local-name(.)='Postulacion']",
      doc
    ) as any;
    expect(postulacionNodes.length).toBe(1);

    const postulacionIDNodes = xpath.select(
      "//*[local-name(.)='PostulacionID']",
      doc
    ) as any;
    expect(postulacionIDNodes[0].firstChild.data).toBe('12345');
  });

  it('Should sign any custom XML root element', () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(
        __dirname,
        `../../test_cert/${process.env.CERTIFICATE_NAME || ''}`
      )
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    // Create a custom XML document
    const customXml = `<?xml version="1.0" encoding="utf-8"?>
<CustomDocument>
  <DocumentID>12345</DocumentID>
  <Title>Test Document</Title>
  <Content>This is a test</Content>
</CustomDocument>`;

    const signature = new Signature(certs.key, certs.cert);

    // Sign with custom root element name
    const signedXml = signature.signXml(customXml, 'CustomDocument');

    // Verify the signature was embedded
    const doc = new DOMParser().parseFromString(signedXml) as any;

    const signatureNodes = xpath.select(
      "//*[local-name(.)='Signature']",
      doc
    ) as any;
    expect(signatureNodes.length).toBeGreaterThan(0);

    // Verify original content is preserved
    const customDocNodes = xpath.select(
      "//*[local-name(.)='CustomDocument']",
      doc
    ) as any;
    expect(customDocNodes.length).toBe(1);
  });

  it('Should auto-detect root element from Postulacion XML', () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(
        __dirname,
        `../../test_cert/${process.env.CERTIFICATE_NAME || ''}`
      )
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    const postulacionXml = fs.readFileSync(
      path.resolve(__dirname, 'sample/Postulacion.xml'),
      'utf-8'
    );

    const signature = new Signature(certs.key, certs.cert);

    // Sign without specifying root element - should auto-detect 'Postulacion'
    const signedXml = signature.signXml(postulacionXml);

    // Verify the signature was embedded
    const doc = new DOMParser().parseFromString(signedXml) as any;

    const signatureNodes = xpath.select(
      "//*[local-name(.)='Signature']",
      doc
    ) as any;
    expect(signatureNodes.length).toBeGreaterThan(0);

    // Verify original content is preserved
    const postulacionNodes = xpath.select(
      "//*[local-name(.)='Postulacion']",
      doc
    ) as any;
    expect(postulacionNodes.length).toBe(1);

    const postulacionIDNodes = xpath.select(
      "//*[local-name(.)='PostulacionID']",
      doc
    ) as any;
    expect(postulacionIDNodes[0].firstChild.data).toBe('12345');
  });

  it('Should auto-detect root element from any custom XML', () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(
        __dirname,
        `../../test_cert/${process.env.CERTIFICATE_NAME || ''}`
      )
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    // Create a custom XML document
    const customXml = `<?xml version="1.0" encoding="utf-8"?>
<MyCustomRoot>
  <Field1>Value1</Field1>
  <Field2>Value2</Field2>
</MyCustomRoot>`;

    const signature = new Signature(certs.key, certs.cert);

    // Sign without specifying root element - should auto-detect 'MyCustomRoot'
    const signedXml = signature.signXml(customXml);

    // Verify the signature was embedded
    const doc = new DOMParser().parseFromString(signedXml) as any;

    const signatureNodes = xpath.select(
      "//*[local-name(.)='Signature']",
      doc
    ) as any;
    expect(signatureNodes.length).toBeGreaterThan(0);

    // Verify original content is preserved
    const rootNodes = xpath.select(
      "//*[local-name(.)='MyCustomRoot']",
      doc
    ) as any;
    expect(rootNodes.length).toBe(1);
  });

  it('Should handle malformed XML gracefully when root element can be detected', () => {
    const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

    const reader = new P12Reader(secret);
    const certs = reader.getKeyFromFile(
      path.resolve(
        __dirname,
        `../../test_cert/${process.env.CERTIFICATE_NAME || ''}`
      )
    );

    if (!certs.key || !certs.cert) {
      return;
    }

    // Malformed but parseable XML - xmldom is lenient and will recover
    const malformedXml = `<?xml version="1.0" encoding="utf-8"?>
<Document>
  <Field1>Value1</Field1>
  <Field2>Value2
</Document>`;

    const signature = new Signature(certs.key, certs.cert);

    // Should still work as xmldom can parse it (even though it's malformed)
    // The error handler will catch warnings but not prevent signing
    const signedXml = signature.signXml(malformedXml);
    expect(signedXml).toContain('<Signature');
    expect(signedXml).toContain('<Document>');
  });
});
