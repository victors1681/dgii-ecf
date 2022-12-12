import { SignedXml } from 'xml-crypto';
import KeyInfoProvider from './custom/KeyInfoProvider';
import Digest from './custom/Digest';
import { DOMParser } from '@xmldom/xmldom';

export type XMLTag = 'SemillaModel' | 'ECF';

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
    SignedXml.HashAlgorithms['http://myDigestAlgorithm'] = Digest;

    const sig = new SignedXml();

    sig.signatureAlgorithm =
      'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
    sig.keyInfoProvider = new KeyInfoProvider(this._certificatePEM);
    sig.canonicalizationAlgorithm =
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';

    sig.addReference(
      `//*[local-name(.)='${rootElName}']`,
      ['http://www.w3.org/2000/09/xmldsig#enveloped-signature'],
      'http://myDigestAlgorithm',
      undefined,
      undefined,
      undefined,
      true
    );

    sig.signingKey = this._privateKey;

    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    //clean xml
    this.cleanNodes(doc);
    //sign
    sig.computeSignature(doc.toString());
    const signedXml = sig.getSignedXml();
    return signedXml;
  };
}

export default Signature;
