import { SignedXml } from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';
import Digest from './custom/Digest';

/**
 * Common DGII electronic document types.
 * You can also pass any custom XML root element name as a string.
 */
export type DGIIDocumentType =
  | 'SemillaModel'
  | 'ECF'
  | 'RFCE'
  | 'ARECF'
  | 'ACECF'
  | 'ANECF';

/**
 * @deprecated Use DGIIDocumentType instead
 */
export type XMLTag = DGIIDocumentType;

class Signature {
  private _privateKey = '';
  private _certificatePEM = '';

  constructor(privateKey: string, _certificatePEM: string) {
    this._privateKey = privateKey;
    this._certificatePEM = _certificatePEM;
  }

  /**
   * Remove empty spaces and new lines
   * @param node
   */
  private cleanNodes = (node: any) => {
    for (let n = 0; n < node.childNodes.length; n++) {
      const child = node.childNodes[n];
      if (
        child.nodeType === 8 ||
        (child.nodeType === 3 && !/\S/.test(child.nodeValue))
      ) {
        node.removeChild(child);
        n--;
      } else if (child.nodeType === 1) {
        this.cleanNodes(child);
      }
    }
  };

  /**
   * Extracts the root element name from an XML document.
   * @param xml - The XML document as a string
   * @returns The local name of the root element
   */
  private getRootElementName = (xml: string): string => {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const rootElement = doc.documentElement;

    if (!rootElement) {
      throw new Error('Unable to parse XML or find root element');
    }

    return rootElement.localName || rootElement.nodeName;
  };

  /**
   * Signs an XML document with DGII-compliant digital signature.
   *
   * @param xml - The XML document to sign as a string
   * @param rootElName - Optional root element name. If not provided, it will be auto-detected from the XML.
   *                     Common DGII types: 'ECF', 'RFCE', 'ARECF', 'ACECF', 'ANECF', 'SemillaModel'
   *                     Can also be any custom element like 'Postulacion', 'CustomDocument', etc.
   * @returns The signed XML document with embedded <Signature> element
   *
   * @example
   * // Auto-detect root element (recommended for simplicity)
   * const signedXml = signature.signXml(xmlString);
   *
   * @example
   * // Explicitly specify root element
   * const signedECF = signature.signXml(xmlString, 'ECF');
   *
   * @example
   * // Sign any arbitrary XML document
   * const signedPostulacion = signature.signXml(postulacionXml);
   */
  signXml = (xml: string, rootElName?: DGIIDocumentType | string): string => {
    // Auto-detect root element if not provided
    const elementName = rootElName || this.getRootElementName(xml);
    const sig = new SignedXml({
      privateKey: this._privateKey,
      publicCert: this._certificatePEM,
      signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
      canonicalizationAlgorithm:
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    });

    // DGII requires a digest over the canonicalized form with sorted xmlns
    // attributes — see Digest.ts for why. Registered under a custom URI so
    // xml-crypto will invoke our implementation instead of its built-in sha256.
    sig.HashAlgorithms['http://myDigestAlgorithm'] = Digest;

    sig.addReference({
      xpath: `//*[local-name(.)='${elementName}']`,
      transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
      digestAlgorithm: 'http://myDigestAlgorithm',
      isEmptyUri: true,
    });

    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    this.cleanNodes(doc);
    sig.computeSignature(doc.toString());
    return sig.getSignedXml();
  };
}

export default Signature;
