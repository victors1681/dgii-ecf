# DGII-eCF

[![npm version](https://badge.fury.io/js/dgii-ecf.svg)](https://badge.fury.io/js/dgii-ecf)
[![Node.js CI](https://github.com/victors1681/dgii-ecf/actions/workflows/main.yaml/badge.svg)](https://github.com/victors1681/dgii-ecf/actions/workflows/main.yaml)

DGII-eCF
(**DGII**) - Dirección General de Impuestos Internos de República Dominicana.

- Este paquete contiene las herramientas necesarias para autenticar y firmar archivos eletrónicos para realizar la facturación electrónica para aplicaciones nodejs.

- This package contains the necessary tools to authenticate and sign electronic files to perform electronic invoicing for nodejs applications.

_Do not try to use on frontend application like Reactjs, only use it on the server side due to sensitive informations_

[>> Video Tutorial <<](https://youtu.be/J_D2VBJscxI)

## Installation

Install dgii-ecf with npm

```bash
  npm install dgii-ecf
```

## Usage/Examples

This package expose three main clases `ECF`, `P12Reader`, `Signature`

#### Requirements

You need a valid certificate if you don't have one you need to request a new one your business or client business [DigiFirma](https://www.camarasantodomingo.do/digifirma/FormularioWeb/)

#### Step One

Use `P12Reader` to read the certificate `.p12`

```javascript
import { P12Reader } from 'dgii-ecf';

const secret = 'certificate_passphrase';

const reader = new P12Reader(secret);
const certs = reader.getKeyFromFile(
  path.resolve(__dirname, '../../test_cert/[your_identity.p12]')
);
```

`certs` will contain a object P12ReaderData with

```
{ cert: string, key: string }
```

#### Step two

Use the cert object to initialize the `ECF` object, is important to pass this object, with the certificate we will be able to authenticate with the DGII, sign documents and interact with the api.

```javascript
import ECF, { P12Reader } from 'dgii-ecf';

const auth = new ECF(certs);
const tokenData = await auth.authenticate();
```

The method `authenticate` will perform two API requests:

- Get the initial XML called `SEED`
- After getting the seed, the method will sign the document using `Signature` and will make another API request to get the access token
- buyerHost?: string Optional parameter, allow to use the same method to perform authentication againt a buyer authorized to receive eCF `const tokenData = await auth authenticate('https://ecf.dgii.gov.do/Testecf/emisorreceptor');`

`auth.authenticate` return an optional object with the token and expiration, however, internally the token gets set into the header of every following request, `Authorization: access token`.

#### Target diferent environment

By default the `ECF` class init target the development environment, currently the class support the three environment supported by DGII:

- `TesteCF` Test environment
- `CerteCF` Certification environment
- `eCF` Production

```javascript
import ECF, { ENVIRONMENT } from 'dgii-ecf';

const auth = new ECF(certs, ENVIRONMENT.PROD); //PRODUCTION ENV
```

### Transformers

Convert the JSON to a XML

```javascript
const transformer = new Transformer();
const xml = transformer.json2xml(anyJsonDocument);
```

### Options

`Signature` this class help to sign XML documents.

```ts
import { Signature } from 'dgii-ecf';

//Read the certificate
const reader = new P12Reader(secret);
const certs = reader.getKeyFromFile(
  path.resolve(
    __dirname,
    `../../test_cert/${process.env.CERTIFICATE_NAME || ''}`
  )
);

if (!certs.key || !certs.cert) {
  return;
}

//Get the XML file to add the signature

const seedXml = fs.readFileSync(
  path.resolve(__dirname, 'sample/seed.xml'),
  'utf-8'
);

//Sign the document
const signature = new Signature(certs.key, certs.cert);
const signedXml = signature.signXml(seedXml, 'SemillaModel');
```

### Send Electronic Document eFC

Send credit invoice using the api method

```ts
//Authentication
const ecf = new ECF(certs, ENVIRONMENT.DEV); // select the environment TEST, CERT, PROD
const auth = await ecf.authenticate();

//Sign invoice
const signature = new Signature(certs.key, certs.cert);
// Optional If the input is JSON transform it to XML
const transformer = new Transformer();
const xml = transformer.json2xml(JsonECF31Invoice);
//------------------------------------------------

//Create the name convention RNCEmisor + eCF.xml
const fileName = `${rnc}${noEcf}.xml`;
//Add the signature to the XML targetting the main wrapper in this case `ECF` (credito fiscal) it can be | ECF | ARECF | ACECF | ANECF | RFCE
const signedXml = signature.signXml(xml, 'ECF');
//SEND the document to the DGII
const response = await ecf.sendElectronicDocument(signedXml, fileName); //Optional third parameter is buyerHost?:string to send the invoice to the buyer
```

### API Methods

###### Track ID

Get response by track ID

```ts
const ecf = new ECF(certs, ENVIRONMENT.DEV);
const response = await ecf.statusTrackId(trackId);
```

```json
{
  "trackId": "d2b6e27c-3908-46f3-afaa-2207b9501b4b",
  "codigo": "1",
  "estado": "Aceptado",
  "rnc": "130862346",
  "encf": "E310005000201",
  "secuenciaUtilizada": true,
  "fechaRecepcion": "8/15/2023 6:06:57 AM",
  "mensajes": [
    {
      "valor": "",
      "codigo": 0
    }
  ]
}
```

###### Customer Directory

Return the URL availables for the customers who can receive ECF online, for low environment the API will swift to a test default DGII

```ts
const ecf = new ECF(certs, ENVIRONMENT.DEV);
const rnc = 'any rnc';
const response = await ecf.getCustomerDirectory(rnc);
```

###### Summary Invoice (Factura de consumo < 250K)

Send invoice summary (32) less than 250k Pesos.

```ts
const ecf = new ECF(certs, ENVIRONMENT.DEV);
await ecf.authenticate();

const signature = new Signature(certs.key, certs.cert);
const transformer = new Transformer();
const xml = transformer.json2xml(JsonECF32Summary);

// 1) Add the signature to the document
const signedEcfXml = signature.signXml(xml, 'ECF');

// Doc signedEcfXml is the regular ecf, Save it in your system for your record

// This function create a XML not signed yet including the security code
const DataRFCE = convertECF32ToRFCE(signedEcfXml); //Return the xml and the securityCode (first 6 digits from the signed document)

const fileName = `${rnc}${noEcf}.xml`;

const signedRFCEXml = signature.signXml(DataRFCE.xml, 'RFCE');

//Only send the summary to tho the DGII
const response = await ecf.sendSummary(signedRFCEXml, fileName);
```

###### Validate XML Certificate

Function that validates digital signatures and certificates in XML documents. Returns detailed validation information including the certificate object.

**Steps:**

1. Extracts Signature node from XML
2. Validates signature
3. Validates certificate format and content
4. Checks certificate expiration
5. Returns ValidationResponse response with certificate data

```ts
import { validateXMLCertificate } from 'dgii-ecf';

interface ValidationResponse {
  isValid: boolean;
  cert?: crypto.X509Certificate; // Return the certificate public information
  error?: string;
}

// Basic usage
const xmlString = fs.readFileSync('signed-document.xml', 'utf8');
const result = validateXMLCertificate(xmlString);

if (result.isValid) {
  // Access certificate details
  console.log('Certificate Subject:', result.cert?.subject);
  console.log('Valid Until:', result.cert?.validTo);
} else {
  console.log('Validation failed:', result.error);
}

// With silent option (suppress console errors)
const silentResult = validateXMLCertificate(xmlString, { silent: true });
```

###### Get all the tracks IDs

Return all the tracking associated with a NCF

```ts
const ecf = new ECF(certs, ENVIRONMENT.DEV);
const response = await ecf.trackStatuses(rnc, noEcf);
```

###### Inquiry Status

Web service responsible for responding to the validity or status of an e-CF to a receiver or even to an issuer, through the presentation of the issuing RNC, e-NCF and two conditional fields to the validity of the voucher, RNC Buyer and the code of security

```ts
const ecf = new ECF(certs, ENVIRONMENT.DEV);
const statusResponse = await ecf.inquiryStatus(
  RNCEmisor,
  noEcf,
  RNCComprador,
  securityCode
);
```

###### Commercial approval

Web service responsible for receiving commercial approvals issued by receiving taxpayers, which consists of the approval of a transaction carried out between two taxpayers and for which an electronic receipt was received from an issuer.

```ts
const ecf = new ECF(certs, ENVIRONMENT.DEV);
await ecf.sendCommercialApproval(signedXml, fileName);
```

###### Void eCF

Web service responsible for receiving and voiding unused sequence ranges (e‐NCF) through a request XML containing the electronic receipt code, a series of ranges, from and to, as well as a token associated with a session valid.

```ts
const ecf = new ECF(certs, ENVIRONMENT.DEV);
await ecf.voidENCF(signedXml, fileName);
```

### Utils

Get the security code getting the first 6 digits of the signature hash value

```ts
import { getCodeSixDigitfromSignature } from 'dgii-ecf';
const securityCode = getCodeSixDigitfromSignature(xml);
```

Convert a xml ECF documento to RFCE document to send it to the DGII as a summary

```ts
import { convertECF32ToRFCE } from 'dgii-ecf';
//Note: ecf32Xml should be a valid ECF with the signature
const { xml, securityCode } = convertECF32ToRFCE(ecf32Xml);
```

```ts
import { getCurrentFormattedDateTime } from 'dgii-ecf';
getCurrentFormattedDateTime();
```

```ts
//DEPRECATED DO NOT USE IT
import { generateRandomAlphaNumeric } from 'dgii-ecf';
generateRandomAlphaNumeric(length);
```

Generate Code QR URL for FC

```ts
import { generateFcQRCodeURL } from "dgii-ecf";
generateFcQRCodeURL(rncemisor: string, encf: string, montototal: number, codigoseguridad: string, env: ENVIRONMENT)

```

```ts
import { generateEcfQRCodeURL } from "dgii-ecf";
generateEcfQRCodeURL(rncemisor: string, rncComprador: string, encf: string, montototal: number, fechaEmision: string, fechaFirma: string, codigoseguridad: string, env: ENVIRONMENT)
```

This utility is invaluable for processing commercial approvals. When receiving commercial approval from DGII, this tool facilitates the extraction of XML content from the response body.

```ts
import { getXmlFromBodyResponse } from "dgii-ecf";
//lasTagName default ACECF
getXmlFromBodyResponse(rawBody: string, lasTagName?:string)
```

Generate alphenumeric 6 digit random password, default lenth `length = 6`

```ts
//DEPRECATED DO NOT USE IT
import { generateRandomAlphaNumeric } from 'dgii-ecf';
generateRandomAlphaNumeric(length);
```

### Sender Receiver

Contain methods that allow to format the responses for the communication between sender and receptos and commertial approvals. It validate `ecfType`, `format`, `customer RNC`

```ts
const senderReciver = new SenderReceiver();
const response = senderReciver.getECFDataFromXML(
  data,
  '130862346',
  ReveivedStatus['e-CF Recibido']
);
```

```ts
export enum NoReceivedCode {
  'Error de especificación' = '1',
  'Error de Firma Digital' = '2',
  'Envío duplicado' = '3',
  'RNC Comprador no corresponde' = '4',
}
export enum ReveivedStatus {
  'e-CF Recibido' = '0',
  'e-CF No Recibido' = '1',
}
```

Formatter

```xml
  <ARECF>
          <DetalleAcusedeRecibo>
              <Version>1.0</Version>
              <RNCEmisor>131880738</RNCEmisor>
              <RNCComprador>130862346</RNCComprador>
              <eNCF>E310000000007</eNCF>
              <Estado>0</Estado>
              <CodigoMotivoNoRecibido/>
              <FechaHoraAcuseRecibo>15-04-2023 15:21:55</FechaHoraAcuseRecibo>
          </DetalleAcusedeRecibo>
      </ARECF>
```

[More Information ARECF](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Documentacin%20sobre%20eCF/Formatos%20XML/Formato%20Acuse%20de%20Recibo%20v%201.0.pdf)

## Run Test local environment

This repo performs the unit test connecting to the DGII test environment

- First: In order to pass the test locally the first step is to plate your certificate into the directory `src/test_cert` current emtpy, for security reason `.p12` gets ignored.
- Second: create a `.env` file and set a variables:

```
CERTIFICATE_NAME='your_certificate.p12'
CERTIFICATE_TEST_PASSWORD=''
RNC_EMISOR=''
```

Install dependencies

```bash
  npm install
```

Run the test

```bash
  npm run test
```

Test watcher

```bash
  npm run test:watch
```

## Authors

- [Victor Santos](https://www.github.com/victors1681)

## 🔗 Links

[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://vsantos.info)
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/victors1681/)
[![twitter](https://img.shields.io/badge/twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/victors1681)

## Related

For more technical documentation related with Electronic Invoice:

- [DGII official documentation (Facturación Electrónica)](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/default.aspx)
- [DGII Technical Doc](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/documentacionSobreE-CF.aspx)
