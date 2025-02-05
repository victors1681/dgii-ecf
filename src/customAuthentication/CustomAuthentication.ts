import { DOMParser } from '@xmldom/xmldom';
import * as xpath from 'xpath';
import * as crypto from 'crypto';
import { Signature } from '../index';
import jwt from 'jsonwebtoken';
import { P12ReaderData } from '../P12Reader';
interface DecodedToken {
  valor: string;
  timestamp: string;
  iat: number;
  exp: number;
}
/**
 * Custom Authentication class for generating and verifying tokens
 */
class CustomAuthentication {
  private cert: P12ReaderData;

  constructor(cert: P12ReaderData) {
    if (!cert.key || !cert.publicKey) {
      throw new Error('Certificate key and Pem are not defined');
    }
    this.cert = cert;
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
      const calculatedDigest = await this.canonicalizeXmlFn(signedXml);

      const expectedDigest = digestValue.toString().trim();

      if (calculatedDigest !== expectedDigest) {
        throw new Error(
          `Digest mismatch.\nCalculated: ${calculatedDigest}\nExpected: ${expectedDigest}`
        );
      }

      if (!this.cert.key) {
        throw new Error('Certificate key is not defined');
      }
      // Generate bearer token if validation passes
      const token = jwt.sign(
        {
          valor: valorNode.toString(),
          timestamp: new Date().toISOString(),
        },
        this.cert.key,
        {
          algorithm: 'RS256',
          expiresIn: '1h',
        }
      );

      return token;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Verification failed: ${error?.message}`);
      } else {
        throw new Error(`Verification failed: ${error}`);
      }
    }
  }

  /**
   * This function get the original XML and remove the signature node, then it signs the original XML again to extract the digest value
   * I had a hard time trying to figure out how to calculate the digest value to avoid to sign the document, but the calculated value always return a different value from the original one.
   * @param signedXml
   * @returns
   */
  private async canonicalizeXmlFn(signedXml: string) {
    try {
      const doc = new DOMParser().parseFromString(signedXml, 'application/xml');
      // Remove the signature node
      const signatureNode = xpath.select1(
        "//*[local-name(.)='Signature']",
        doc
      ) as Node | null;
      if (signatureNode && signatureNode.parentNode) {
        signatureNode.parentNode.removeChild(signatureNode);
      }

      const originalXMLDoc = doc.toString();

      if (!this.cert.key || !this.cert.cert) {
        throw new Error('Certificate key and Pem are not defined');
      }
      // Resign the original XML to get the digest value
      const signature = new Signature(this.cert.key, this.cert.cert);
      const newSignedXml = signature.signXml(originalXMLDoc, 'SemillaModel');
      const newDoc = new DOMParser().parseFromString(
        newSignedXml,
        'application/xml'
      );

      const digestValue = xpath.select1(
        "string(//*[local-name(.)='DigestValue'])",
        newDoc
      );
      return digestValue;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Verification failed: ${error.message}`);
      } else {
        throw new Error('Verification failed: Unknown error');
      }
    }
  }
  /**
   * Access token validation
   * @param token
   * @returns
   */
  public async verifyToken(
    token: string
  ): Promise<{ decoded: DecodedToken; isExpired: boolean }> {
    try {
      if (!this.cert.publicKey) {
        throw new Error('Public key is not defined');
      }
      const decoded = jwt.verify(token, this.cert.publicKey, {
        algorithms: ['RS256'],
      }) as DecodedToken;

      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = (decoded as jwt.JwtPayload).exp
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (decoded as jwt.JwtPayload).exp! < currentTime
        : true;

      return { decoded, isExpired };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Token verification failed: ${error.message}`);
      } else {
        throw new Error('Token verification failed: Unknown error');
      }
    }
  }
}

export default CustomAuthentication;
