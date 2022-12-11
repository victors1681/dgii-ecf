import crypto from 'crypto';
import { DOMParser } from '@xmldom/xmldom';

export class Digest {
  sortElements = (elements: any) => {
    const comparator = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0);
    const items = Array.from(elements);
    const sorted = items.sort(comparator);
    return sorted;
  };

  getHash = (xml: string) => {
    const doc = new DOMParser().parseFromString(xml) as any;
    const attrs = doc.childNodes[0].attributes;

    /*
    Hack - in order to get the right digest value calculation I had to sort the node attribute to change the order of
    SemillaModel xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    to
    SemillaModel xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    that trick took me tree days to figure why the digested value did not match the digested value coming from c# app and dgii server.
    */
    const items = this.sortElements(attrs);
    Object.assign(doc.childNodes[0].attributes, items);

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
