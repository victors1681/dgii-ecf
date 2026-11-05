# DGII-eCF

[![npm version](https://badge.fury.io/js/dgii-ecf.svg)](https://badge.fury.io/js/dgii-ecf)
[![Node.js CI](https://github.com/victors1681/dgii-ecf/actions/workflows/main.yaml/badge.svg)](https://github.com/victors1681/dgii-ecf/actions/workflows/main.yaml)

DGII-eCF
(**DGII**) - Dirección General de Impuestos Internos de República Dominicana.

- Este paquete contiene las herramientas necesarias para autenticar y firmar archivos eletrónicos para realizar la facturación electrónica para aplicaciones nodejs.

- This package contains the necessary tools to authenticate and sign electronic files to perform electronic invoicing for nodejs applications.

_Do not try to use on frontend application like Reactjs, only use it on the server side due to sensitive informations_

[>> Video Tutorial <<](https://youtu.be/J_D2VBJscxI)

If you want to save time adapting your software use my new cloud service [ecf.mseller.app](https://ecf.mseller.app)

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
const signedXml = signature.signXml(seedXml);
```

#### Sign Arbitrary XML Documents

The `Signature` class can sign **any XML document**, not just DGII electronic invoices. The root element is automatically detected, so you don't need to specify it:

```ts
import { Signature } from 'dgii-ecf';

const signature = new Signature(certs.key, certs.cert);

// Simplest usage - auto-detects root element (recommended)
const signedECF = signature.signXml(ecfXml);
const signedPostulacion = signature.signXml(postulacionXml);
const signedCustom = signature.signXml(anyXmlDocument);

// Or explicitly specify the root element name if needed
const signedWithExplicitRoot = signature.signXml(ecfXml, 'ECF');
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
//Add the signature to the XML (root element auto-detected)
const signedXml = signature.signXml(xml);
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
// response is always ServiceDirectoryResponse[] (or undefined) regardless of environment
```

> **Note — inconsistent DGII response shape.** The DGII directory service does
> not always return the same JSON shape: for some records/environments it
> responds with an **array** of directory entries, while for others it responds
> with a **single entry object**. This was surfaced from production logs where
> the same directory endpoint returned both shapes
> (discovered in [PR #24](https://github.com/victors1681/dgii-ecf/pull/24)).
>
> To keep the contract stable for every consumer, `getCustomerDirectory` (and
> the underlying `getCustomerDirectoryApi`) **normalizes the response internally**:
> a single-object response is wrapped in an array, so the method **always**
> resolves to `ServiceDirectoryResponse[]` (or `undefined` when the service
> returns no body). Consumers can iterate the result directly without checking
> whether the payload was an array or an object.

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

Return all the tracking associated with a NCF (`ConsultaTrackIds`, RNC emisor + e-NCF). Every time the e-NCF was sent produces an entry, so a resend shows up next to the original submission.

```ts
const ecf = new ECF(certs, ENVIRONMENT.DEV);
const response = await ecf.trackStatuses(rnc, noEcf);
```

```json
[
  {
    "trackId": "bfa49ac2-9404-4fbd-8baa-d482aac7129a",
    "estado": "Aceptado",
    "fechaRecepcion": "05/11/2026"
  }
]
```

> **Note:** an e-NCF DGII has no trackId for is answered with HTTP 400 and
> `{ "codigo": 0, "estado": "TrackId no encontrado." }`, so `trackStatuses`
> throws a `DgiiApiError` (read `err.data.estado`). RFCE summaries (e-CF 32 <
> RD$250,000) never get a trackId and are always reported this way, use
> `inquiryStatus` or `checkDocumentStatus` for them.

###### Check Document Status (before retrying a submission)

When the connection drops after sending an e-CF, the trackId may never arrive. Resending blindly is not safe: if DGII already received the e-NCF, the resend comes back `Rechazado`. `checkDocumentStatus` tells you whether DGII already has the document, and picks the right service for how it was sent:

| Document                       | Sent with                | Checked with                                            |
| ------------------------------ | ------------------------ | ------------------------------------------------------- |
| e-CF 31, 32 >= 250K, others    | `sendElectronicDocument` | `ConsultaTrackIds` (RNC emisor + e-NCF)                 |
| e-CF 32 < 250K (RFCE summary)  | `sendSummary`            | `ConsultaEstado` (+ RNC comprador + security code)      |

```ts
import { TrackStatusEnum } from 'dgii-ecf';

const ecf = new ECF(certs, ENVIRONMENT.DEV);
await ecf.authenticate();

const result = await ecf.checkDocumentStatus({
  rncEmisor,
  encf,
  // Optional: with the total only the service that can answer is asked
  montoTotal,
  // Only needed for an RFCE summary (e-CF 32 < 250K):
  rncComprador,
  codigoSeguridad,
});

switch (result.status) {
  case TrackStatusEnum.NOT_FOUND:
    // DGII has no record of the e-NCF: safe to send it again
    break;
  case TrackStatusEnum.IN_PROCESS:
    // DGII is still validating it: wait and check again, do not resend
    break;
  case TrackStatusEnum.ACCEPTED:
  case TrackStatusEnum.CONDITIONAL_ACCEPTED:
    // Already accepted: store result.trackId, do not resend
    break;
  case TrackStatusEnum.REJECTED:
    // Every submission was rejected: fix the document before sending again
    break;
}
```

```json
{
  "status": "Aceptado",
  "trackId": "bfa49ac2-9404-4fbd-8baa-d482aac7129a",
  "source": "ConsultaTrackIds",
  "trackIds": [
    {
      "trackId": "bfa49ac2-9404-4fbd-8baa-d482aac7129a",
      "estado": "Aceptado",
      "fechaRecepcion": "05/11/2026"
    }
  ]
}
```

How the status is decided:

- When the e-NCF was sent more than once, an accepted submission wins over later rejected resends, and `En Proceso` wins over `Rechazado`. `trackId` is the submission that decided the status.
- With `montoTotal`, only one service is asked: `ConsultaEstado` for an RFCE summary, `ConsultaTrackIds` for everything else. A summary then costs one request instead of two, and a missing `codigoSeguridad` throws before calling DGII.
- Without `montoTotal`, `ConsultaTrackIds` is asked first, and `ConsultaEstado` is only used for an `E32` e-NCF it does not know, when `codigoSeguridad` is given. Its response is returned in `inquiry`.
- "Not found" resolves to `No encontrado` instead of throwing. Other errors (authentication, network, missing RNC comprador) are still thrown as `DgiiApiError`.

> **Important for RFCE summaries:** store the `CodigoSeguridadeCF` you send in
> each summary. Without it, or with a different code, DGII answers
> `No encontrado` even for an accepted summary, and a resend would be rejected.

###### Summary or full e-CF 32 (`isSummaryInvoice`)

An e-CF 32 with a total below RD$250,000 is sent as an RFCE summary (`sendSummary`); from RD$250,000 (inclusive) it is sent as a full e-CF (`sendElectronicDocument`). Use the same helper to route a document and to check it, so the two never disagree:

```ts
import { isSummaryInvoice, SUMMARY_INVOICE_LIMIT } from 'dgii-ecf';

isSummaryInvoice('E320000000001', 249999.99); // true  -> sendSummary
isSummaryInvoice('E320000000001', 250000); // false -> sendElectronicDocument
isSummaryInvoice('E310000000001', 100); // false (only e-CF 32)
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

Transform a JSON payload with lowercase keys to camelCase keys based on a reference JSON object.

```ts
import { transformeLowercasePayloadToCamelcase } from 'dgii-ecf';
// const transformedPayload = transformeLowercasePayloadToCamelcase(sourcePayload, referenceObject);
// Example with internal ECF reference
const transformedPayload = transformeLowercasePayloadToCamelcase(sourcePayload);
```

### Sender Receiver

Contain methods that allow to format the responses for the communication between sender and receptos and commertial approvals. It validate `ecfType`, `format`, `customer RNC`

```ts
const senderReceiver = new SenderReceiver();
const response = senderReceiver.getECFDataFromXML(
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

## Custom Authentication

The `CustomAuthentication` class provides methods to create a custom authentication, generate a seed, validate a seed, verify XML signatures, as well as generate and verify JWT tokens.

### Usage

#### Step One | Initialize the class

Initialize the `CustomAuthentication` class with the necessary certificate.

```typescript
import { CustomAuthentication, P12Reader } from 'dgii-ecf';

const secret = process.env.CERTIFICATE_TEST_PASSWORD || '';

const reader = new P12Reader(secret);
const certs = reader.getKeyFromFile(
  path.resolve(__dirname, `../../test_cert/'your certificate'}`)
);

const customAuth = new CustomAuthentication(cert);
```

#### Step Two | Generate and send the seed

Generate a seed and send it to the client. Ensure the client can accesses the seed via the endpoint following the DGII standard:
`{your_host}/fe/autenticacion/api/semilla`

```ts
const seed = customAuth.generateSeed();
```

#### Step Three | Validate the Seed

Create an endpoint to validate the seed submitted by the client. The endpoint URL should follow the DGII standard:
`{your_host}/fe/autenticacion/api/validacioncertificado`

```ts
const token = await customAuth.verifySignedSeed(seed);
```

#### Step Four | Validate the Seed

Once the authentication flow is complete, restrict the client’s access to your resources. Validate the access token before allowing access to the protected endpoint like `/fe/recepción/api/ecf`

```ts
try {
  const decoded = await customAuth.verifyToken(token);
} catch (error) {
  console.error('Token verification failed:', error.message);
}
```

### Read Certificate Information from Base64

You can extract basic information (subject, issuer, expiration date, etc.) from a base64-encoded `.p12` certificate using the `P12Reader` class:

```typescript
import { P12Reader } from 'dgii-ecf';
import fs from 'fs';

const secret = 'certificate_passphrase';
const reader = new P12Reader(secret);

// Read the .p12 file as base64 string
const p12Base64 = fs.readFileSync(
  path.resolve(__dirname, '../../test_cert/[your_identity.p12]'),
  'base64'
);

// Get certificate info from base64 string
const certInfo = reader.getCertificateInfoFromBase64(p12Base64);

console.log('Subject:', certInfo.subject);
console.log('Issuer:', certInfo.issuer);
console.log('Valid From:', certInfo.validFrom);
console.log('Valid To:', certInfo.validTo);
console.log('Serial Number:', certInfo.serialNumber);
```

This method is useful if you receive the certificate as a base64 string (for example, from an S3 bucket or environment variable) and want to extract its metadata without saving it to disk.

## Run Integration Test local environment

This repo performs the unit/integration tests connecting to the DGII test environment

- First: In order to pass the test locally the first step is to place your certificate into the directory `src/test_cert` current emtpy, for security reason `.p12` gets ignored.
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
