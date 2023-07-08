# DGII-eCF

[![npm version](https://badge.fury.io/js/dgii-ecf.svg)](https://badge.fury.io/js/dgii-ecf)
[![Node.js CI](https://github.com/victors1681/dgii-ecf/actions/workflows/main.yaml/badge.svg)](https://github.com/victors1681/dgii-ecf/actions/workflows/main.yaml)

DGII-eCF
(**DGII**) - Dirección General de Impuestos Internos de República Dominicana.

- Este paquete contiene las herramientas necesarias para autenticar y firmar archivos eletrónicos para realizar la facturación electrónica para aplicaciones nodejs.

- This package contains the necessary tools to authenticate and sign electronic files to perform electronic invoicing for nodejs applications.

*Do not try to use on frontend application like Reactjs, only use it on the server side due to sensitive informations*

[>> Video Tutorial <<](https://youtu.be/G_ENM5fB9VA)

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

const secret = 'certificate_passphrase'

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
import ECF, { P12Reader } from 'dgii-ecf'

const auth = new ECF(certs);
const tokenData = await auth.authenticate();

```
The method `authenticate` will perform two API requests: 
- Get the initial XML called `SEED`
- After getting the seed, the method will sign the document using `Signature` and will make another API request to get the access token

`auth.authenticate` return an optional object with the token and expiration, however, internally the token gets set into the header of every following request, `Authorization: access token`.

#### Target diferent environment

By default the `ECF` class init target the development environment, currently the class support the three environment supported by DGII:
- `TesteCF` Test environment
- `CerteCF` Certification environment
- `eCF` Production

```javascript
import ECF, { ENVIRONMENT } from 'dgii-ecf'

const auth = new ECF(certs, ENVIRONMENT.PROD); //PRODUCTION ENV
```

### Options

`Signature` this class help to sign XML documents.

```javascript
import { Signature } from 'dgii-ecf'

//Read the certificate
const reader = new P12Reader(secret);
const certs = reader.getKeyFromFile(
    path.resolve(__dirname, '../../test_cert/4303328_identity.p12')
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

## Run Test local environment

This repo performs the unit test connecting to the DGII test environment

- First:  In order to pass the test locally the first step is to plate your certificate into the directory `src/test_cert` current emtpy, for security reason `.p12` gets ignored.
- Second: create a `.env` file and set a variable `CERTIFICATE_TEST_PASSWORD=''` with the passphrase secret of your certificate.

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
