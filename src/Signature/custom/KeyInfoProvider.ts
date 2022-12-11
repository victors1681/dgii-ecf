import forge from 'node-forge';
import { FileKeyInfo } from 'xml-crypto';

class KeyInfoProvider extends FileKeyInfo {
  _certificatePEM = '';

  constructor(certificatePEM?: string | null | undefined) {
    super();

    if (Buffer.isBuffer(certificatePEM)) {
      certificatePEM = certificatePEM.toString('ascii');
    }

    if (certificatePEM == null || typeof certificatePEM !== 'string') {
      throw new Error(
        'certificatePEM must be a valid certificate in PEM format'
      );
    }

    this._certificatePEM = certificatePEM;
  }

  getKeyInfo = (key: any, prefix: string) => {
    let keyInfoXml;

    prefix = prefix || '';
    prefix = prefix ? prefix + ':' : prefix;

    const certBodyInB64 = forge.util.encode64(
      forge.pem.decode(this._certificatePEM)[0].body
    );

    keyInfoXml = '<' + prefix + 'X509Data>';

    keyInfoXml += '<' + prefix + 'X509Certificate>';
    keyInfoXml += certBodyInB64;
    keyInfoXml += '</' + prefix + 'X509Certificate>';

    keyInfoXml += '</' + prefix + 'X509Data>';

    return keyInfoXml;
  };

  getKey = (keyInfo?: Node): Buffer => {
    return Buffer.from(this._certificatePEM);
  };
}

export default KeyInfoProvider;
