import { ENVIRONMENT } from 'src/networking';
import RestApi, { AuthToken } from 'src/networking/RestApi';
import { P12ReaderData } from 'src/P12Reader';
import Signature from 'src/Signature/Signature';

class Auth {
  private _api: RestApi;
  private _p12ReaderData: P12ReaderData;

  constructor(p12ReaderData: P12ReaderData) {
    this._api = new RestApi(ENVIRONMENT.DEV);
    this._p12ReaderData = p12ReaderData;
  }
  getAccessToken = async (): Promise<AuthToken | undefined> => {
    try {
      const seedXml = await this._api.getSeedApi();
      //Sign the seed

      if (!seedXml) {
        throw new Error('Xml seed is not defined');
      }

      if (
        typeof this._p12ReaderData.key === 'undefined' ||
        typeof this._p12ReaderData.cert === 'undefined'
      ) {
        throw new Error('Certificate key and Pem are not defined');
      }

      const signature = new Signature(
        this._p12ReaderData.key,
        this._p12ReaderData.cert
      );
      const seedSigned = signature.signXml(seedXml, 'SemillaModel');

      //Get the token
      const tokenData = this._api.getAuthTokenApi(seedSigned);

      if (!tokenData) {
        throw new Error('Token is not defined');
      }

      return tokenData;
    } catch (err) {
      throw new Error(`${err}`);
    }
  };
}

export default Auth;
