import fs from 'fs';
import forge from 'node-forge';

export interface P12ReaderData {
  key: string | undefined;
  cert: string | undefined;
}

class P12Reader {
  private passphrase = '';
  constructor(passphrase: string) {
    this.passphrase = passphrase;
  }

  private getCertificateFromP12 = (
    p12: forge.pkcs12.Pkcs12Pfx
  ): string | undefined => {
    const certData = p12.getBags({ bagType: forge.pki.oids.certBag });

    const certificates = certData[forge.pki.oids.certBag];
    if (certificates?.length) {
      const certificate = certificates[0];
      if (certificate.cert) {
        const pemCertificate = forge.pki.certificateToPem(certificate.cert);

        if (typeof pemCertificate === 'undefined') {
          throw new Error('Unable to get pen certificate.');
        }

        return pemCertificate;
      } else {
        throw new Error('Certificate not found');
      }
    } else {
      console.error('Certificate bags not found')
      throw new Error('Certificate bags not found');
    }
  };

  private getKeyFromP12 = (p12: forge.pkcs12.Pkcs12Pfx): string | undefined => {
    const certData = p12.getBags({
      bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    });
    const pkcs8Keys = certData[forge.pki.oids.pkcs8ShroudedKeyBag];
    let pkcs8Key = pkcs8Keys ? pkcs8Keys[0] : undefined;

    if (typeof pkcs8Key === 'undefined') {
      const certificates = certData[forge.pki.oids.certBag];
      if (certificates?.length) {
        const certificate = certificates[0];
        pkcs8Key = certificate;
      }
    }

    if (typeof pkcs8Key === 'undefined') {
      console.error('Unable to get private key.')
      throw new Error('Unable to get private key.');
    }

    const pemKey = pkcs8Key.key && forge.pki.privateKeyToPem(pkcs8Key.key);
    //pemKey = pemKey.replace(/\r\n/g, '');

    return pemKey;
  };

  /**
   * Get the certificate Key from a .p12 file
   * @param fileName filename.p12 with the full file path
   */
  getKeyFromFile = (fileName: string): P12ReaderData => {
    try {
      const p12File = fs.readFileSync(fileName, 'base64');
      const p12Der = forge.util.decode64(p12File);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, this.passphrase);

      const key = this.getKeyFromP12(p12);
      const cert = this.getCertificateFromP12(p12);

      return {
        key,
        cert,
      };
    } catch (err) {
      throw new Error(
        `${err}: use path.resolve(__dirname, filename) if needed`
      );
    }
  };

  /**
   * Instead to read the file from the file system we can get from s3 bucket encoded
   * @param p12file
   * @returns
   */

  getKeyFromStringBase64 = (p12file: string): P12ReaderData => {
    try {
      const p12Der = forge.util.decode64(p12file);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, this.passphrase);
      console.log("p12 completed", p12)
      const key = this.getKeyFromP12(p12);
      console.log("key", key)
      const cert = this.getCertificateFromP12(p12);
      console.log("cert from p12", cert)
      return {
        key,
        cert,
      };
    } catch (err) {
      console.error(err)
      throw new Error(`${err}`);
    }
  };
}

export default P12Reader;
