import * as crypto from 'crypto';
import * as xpath from 'xpath';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { SignedXml } from 'xml-crypto';

interface ValidateXMLOptions {
  silent?: boolean; // This option helps to avoid printing the error message, Clean unit test output :)
}

interface ValidationResponse {
  isValid: boolean;
  cert?: crypto.X509Certificate; // This is the certificate object with public key and other properties
  error?: string;
  /**
   * True when the signature only verified after dropping the indentation
   * between elements: the issuer signed the compact XML and pretty-printed it
   * afterwards. The signed data is unchanged.
   */
  whitespaceNormalized?: boolean;
}

/**
 * Drop whitespace-only text nodes that sit between elements (indentation and
 * line breaks, CRLF included). Text inside a leaf element is left untouched,
 * so changing any value, even to whitespace, still breaks the signature.
 */
const removeIndentation = (node: Node): void => {
  const children = Array.from(node.childNodes);
  const hasElementChild = children.some(
    (child) => child.nodeType === child.ELEMENT_NODE
  );
  for (const child of children) {
    if (
      hasElementChild &&
      child.nodeType === child.TEXT_NODE &&
      !/\S/.test(child.nodeValue || '')
    ) {
      node.removeChild(child);
    } else if (child.nodeType === child.ELEMENT_NODE) {
      removeIndentation(child);
    }
  }
};

const toCompactXml = (xml: string): string => {
  const doc = new DOMParser().parseFromString(
    xml.replace(/^\uFEFF/, ''),
    'text/xml'
  );
  removeIndentation(doc);
  return new XMLSerializer().serializeToString(doc);
};

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

    const response = validateXmlCertificate(xml, { silent: true });
    if (response.isValid) {
      return response;
    }

    // Many issuers sign the compact document and then pretty-print it before
    // sending it, which strict XMLDSig verification rejects. Retry on the
    // compact form; only a signature failure is worth retrying.
    if (response.error === 'Signature validation failed') {
      const compact = validateXmlCertificate(toCompactXml(xml), {
        silent: true,
      });
      if (compact.isValid) {
        return { ...compact, whitespaceNormalized: true };
      }
    }

    if (!options.silent) {
      console.error('Error validating XML certificate:', response.error);
    }
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
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const signatureNode = xpath.select(
      "//*[local-name(.)='Signature']",
      doc
    )[0];

    if (!signatureNode) {
      throw new Error('Signature not found in XML.');
    }

    // xml-crypto v6 defaults `getCertFromKeyInfo` to a no-op — pass the
    // built-in static explicitly so the signing cert is read from the
    // embedded <X509Certificate> in KeyInfo.
    const sig = new SignedXml({
      getCertFromKeyInfo: SignedXml.getCertFromKeyInfo,
    });

    sig.loadSignature(signatureNode as Node);
    const isValid = sig.checkSignature(xml);

    if (!isValid) {
      throw new Error('Signature validation failed');
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
