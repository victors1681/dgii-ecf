import { SignedXml } from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';
import Digest from './custom/Digest';

export type XMLTag =
  | 'SemillaModel'
  | 'ECF'
  | 'RFCE'
  | 'ARECF'
  | 'ACECF'
  | 'ANECF';

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

  signXml = (xml: string, rootElName: XMLTag | string): string => {
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
      xpath: `//*[local-name(.)='${rootElName}']`,
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
