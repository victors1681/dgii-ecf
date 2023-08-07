import { ENVIRONMENT } from '../networking';
import RestApi from '../networking/RestApi';
import { P12ReaderData } from '../P12Reader';
import Signature from '../Signature/Signature';
import { setAuthToken } from '../networking/restClient';
import { AuthToken } from '../networking/types';
class ECF {
  private _api: RestApi;
  private _p12ReaderData: P12ReaderData;

  constructor(
    p12ReaderData: P12ReaderData,
    environment: ENVIRONMENT = ENVIRONMENT.DEV,
    accessToken?: string
  ) {
    this._api = new RestApi(environment, accessToken);
    this._p12ReaderData = p12ReaderData;
  }
  authenticate = async (): Promise<AuthToken | undefined> => {
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
      const tokenData = await this._api.getAuthTokenApi(seedSigned);

      if (!tokenData) {
        throw new Error('Unable to get the token');
      }
      //set token on axios
      setAuthToken(tokenData?.token);

      if (!tokenData) {
        throw new Error('Token is not defined');
      }

      return tokenData;
    } catch (err) {
      throw new Error(`${err}`);
    }
  };

  /**
   * Send the signed invoice to DGII
   * @param signedXml XML signed invoice
   * @param fileName the composition of the file name should be RNC+e-NCF.xml example: “101672919E3100000001.xml”
   * @returns
   */
  sendInvoice = async (signedXml: string, fileName: string) => {
    try {
      const response = await this._api.sendElectronicInvoiceApi(
        signedXml,
        fileName
      );
      return response;
    } catch (err) {
      throw new Error(`${err}`);
    }
  };

  statusTrackId = async (trackId: string) => {
    try {
      const response = await this._api.statusTrackIdApi(trackId);
      return response;
    } catch (error) {
      throw new Error(`${error}`);
    }
  };
}

export default ECF;
