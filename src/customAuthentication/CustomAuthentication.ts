import crypto from 'crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import * as xpath from 'xpath';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
class CustomAuthentication {
  private privateKey: string;
  private publicKey: string;

  constructor(privateKey: string, publicKey: string) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  generateSeed() {
    // Generate base64 encoded random value
    const randomBytes = crypto.randomBytes(128);
    const randomValue = randomBytes.toString('base64');

    // Generate formatted date with timezone offset
    const date = new Date();
    const offset = -4; // UTC-4 for Dominican Republic
    const localDate = new Date(date.getTime() + offset * 3600 * 1000);
    const formattedDate = localDate.toISOString().replace('Z', '-04:00');

    const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
    <SemillaModel xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <valor>${randomValue}</valor>
        <fecha>${formattedDate}</fecha>
    </SemillaModel>`;

    return sampleXml;
  }

  async verifySignedSeed(signedXml: string): Promise<string> {
    try {
      const doc = new DOMParser().parseFromString(signedXml, 'application/xml');

      // Extract elements
      const valorNode = xpath.select1('string(//SemillaModel/valor)', doc);
      const digestValue = xpath.select1(
        "string(//*[local-name(.)='DigestValue'])",
        doc
      );
      const signatureValue = xpath.select1(
        "string(//*[local-name(.)='SignatureValue'])",
        doc
      );

      if (!valorNode || !digestValue || !signatureValue) {
        throw new Error('Required XML elements not found');
      }

      // Calculate digest with updated canonicalization
      const canonicalXml = this.canonicalizeXmlFn(signedXml);

      const shasum = crypto.createHash('sha256');
      shasum.update(canonicalXml.toString(), 'utf8');
      const calculatedDigest = shasum.digest('base64');

      const expectedDigest = digestValue.toString().trim();

      if (calculatedDigest !== expectedDigest) {
        throw new Error(
          `Digest mismatch.\nCalculated: ${calculatedDigest}\nExpected: ${expectedDigest}`
        );
      }

      // Generate bearer token if validation passes
      const token = jwt.sign(
        {
          valor: valorNode.toString(),
          timestamp: new Date().toISOString(),
        },
        this.privateKey,
        {
          algorithm: 'RS256',
          expiresIn: '1h',
        }
      );

      return `Bearer ${token}`;
    } catch (error: any) {
      throw new Error(`Verification failed: ${error?.message}`);
    }
  }

  private canonicalizeXmlFn(signedXml: string): string {
    const signedSeed = fs.readFileSync(
      path.resolve(__dirname, './__test__/data/seed-test.xml'),
      'utf8'
    );

    const doc = new DOMParser().parseFromString(signedSeed, 'application/xml');

    const signatureNode = xpath.select1(
      "//*[local-name(.)='Signature']",
      doc
    ) as Node;
    if (signatureNode?.parentNode) {
      signatureNode.parentNode.removeChild(signatureNode);
    }

    // Create string from remaining document
    const serializer = new XMLSerializer();
    const xmlWithoutSignature = serializer.serializeToString(doc);

    console.log('signatureNode', signedSeed);
    return signedSeed;
  }
}

export default CustomAuthentication;
