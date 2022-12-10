import { HashAlgorithm } from 'xml-crypto';
import crypto from 'crypto';
import { DOMParser } from '@xmldom/xmldom';

export class Digest {
  getHash = function (xml: string) {
    console.log(xml);

    const doc = new DOMParser().parseFromString(xml) as any;
    const attrs = doc.childNodes[0].attributes;
    const tem = attrs[0];
    attrs[0] = attrs[1];
    attrs[1] = tem;
    Object.assign(doc.childNodes[0].attributes, attrs);
    //change the order of the namespace
    const shasum = crypto.createHash('sha256');
    shasum.update(doc.toString(), 'utf8');
    const res = shasum.digest('base64');

    return res;
  };

  getAlgorithmName = function () {
    return 'http://www.w3.org/2001/04/xmlenc#sha256';
  };
}

export default Digest;
