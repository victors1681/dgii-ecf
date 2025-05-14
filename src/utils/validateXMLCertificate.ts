import * as crypto from 'crypto';
import * as xpath from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import { SignedXml } from 'xml-crypto';

interface ValidateXMLOptions {
  silent?: boolean; // This option helps to avoid printing the error message, Clean unit test output :)
}

interface ValidationResponse {
  isValid: boolean;
  cert?: crypto.X509Certificate; // This is the certificate object with public key and other properties
  error?: string;
}

/**
 * This function validates the XML signature of a given XML string.
 * 1. Extracts the Signature node from the XML.
 * 2. Validates the signature.
 * 3. Validates the certificate.
 * 4. Checks if the certificate is expired.
 * 5. Returns the validation response including the certificate object with the customer data
 * @param xml
 * @param options Optional
 * @returns ValidationResponse
 */
export const validateXMLCertificate = (
  xml: string,
  options: ValidateXMLOptions = {}
): ValidationResponse => {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  try {
    // Extract the Signature node
    const signatureNode = xpath.select(
      "//*[local-name(.)='Signature']",
      doc
    )[0];
    if (!signatureNode) {
      throw new Error('Signature not found in the XML.');
    }

    const response = validateXmlCertificate(xml, options);
    return response;
  } catch (error) {
    return {
      isValid: false,
      cert: undefined,
      error: error instanceof Error ? error.message : 'Invalid certificate',
    };
  }
};
function validateXmlCertificate(
  xml: string,
  options: ValidateXMLOptions = {}
): ValidationResponse {
  try {
    const doc = new DOMParser().parseFromString(xml);
    const signatureNode = xpath.select(
      "//*[local-name(.)='Signature']",
      doc
    )[0];

    if (!signatureNode) {
      throw new Error('Signature not found in XML.');
    }

    const sig = new SignedXml();
    sig.keyInfoProvider = {
      file: '',
      getKeyInfo: () => '<X509Data></X509Data>',
      getKey(keyInfo: Node) {
        if (!keyInfo) {
          throw new Error('KeyInfo is undefined.');
        }
        const certificateNode = xpath.select(
          "string(//*[local-name(.)='X509Certificate'])",

          (keyInfo as unknown as Node[])[0]
        );

        const certificateString = certificateNode.toString();

        if (typeof certificateString !== 'string' || !certificateString) {
          throw new Error('Invalid certificate content');
        }

        const cleanCert = certificateString.replace(/[\n\r\s]/g, '');
        if (!cleanCert.match(/^[A-Za-z0-9+/=]+$/)) {
          throw new Error('Invalid base64 certificate');
        }
        const pemCert = `-----BEGIN CERTIFICATE-----\n${cleanCert}\n-----END CERTIFICATE-----`;
        return Buffer.from(pemCert);
      },
    };

    sig.loadSignature(signatureNode.toString());
    const isValid = sig.checkSignature(xml);

    if (!isValid) {
      throw new Error(
        `Signature validation failed: ${sig.validationErrors.join(', ')}`
      );
    }

    const certificateNode = xpath.select(
      "//*[local-name(.)='X509Certificate']",
      doc
    )[0];
    if (!certificateNode) {
      throw new Error('Certificate node not found in XML.');
    }
    const certBase64 = (certificateNode as Node).textContent?.trim();
    if (!certBase64) {
      throw new Error('Certificate content is missing.');
    }
    const certPEM = `-----BEGIN CERTIFICATE-----\n${certBase64
      .match(/.{1,64}/g)
      ?.join('\n')}\n-----END CERTIFICATE-----`;

    const cert = new crypto.X509Certificate(certPEM);

    const now = new Date();
    const certValidToPlusOneDay = new Date(
      new Date(cert.validTo).getTime() + 24 * 60 * 60 * 1000
    );
    if (new Date(cert.validFrom) > now || certValidToPlusOneDay < now) {
      throw new Error('Certificate is expired or not yet valid.');
    }
    return { isValid: true, cert };
  } catch (error: unknown) {
    if (!options.silent && error instanceof Error) {
      console.error('Error validating XML certificate:', error.message);
    } else if (!options.silent) {
      console.error('Error validating XML certificate:', error);
    }
    return {
      isValid: false,
      cert: undefined,
      error: error instanceof Error ? error.message : 'Invalid certificate',
    };
  }
}
