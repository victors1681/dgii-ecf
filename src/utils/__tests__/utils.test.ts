import fs from 'fs';
import path from 'path';
import { getCodeSixDigitfromSignature } from '../getCodeSixDigitfromSignature';
import { editXmlValue } from '../editXmlValue';
import cf32 from './sample/cf_json_data_32.json';
import { Transformer } from '../../transformers';
import { DOMParser } from '@xmldom/xmldom';
import { generateEcfQRCodeURL } from '../generateQRCode';
import { ENVIRONMENT } from '../../../src/networking';
import { getXmlFromBodyResponse } from '../getXmlFromBodyResponse';
import { convertECF32ToRFCE } from '../convertECF32ToRFCE';
import { validateXMLCertificate } from '../validateXMLCertificate';

describe('Test util function ', () => {
  it('get six digit from the signature', () => {
    const xml = fs.readFileSync(
      path.resolve(__dirname, './sample/signedXml.xml'),
      'utf8'
    );
    const code = getCodeSixDigitfromSignature(xml);
    expect(code).toBe('gG/XYZ');
  });

  it('update attribute xml', () => {
    const transform = new Transformer();
    const xml = transform.json2xml(cf32);
    const newXml = editXmlValue(xml, 'CodigoSeguridadeCF', '1231231');

    const generatedXml = new DOMParser().parseFromString(newXml, 'text/xml');
    const value =
      generatedXml.getElementsByTagName('CodigoSeguridadeCF')[0].textContent;

    expect(value).toBe('1231231');
  });

  it('Generate QR Code', () => {
    const url = generateEcfQRCodeURL(
      '130862346',
      '111111',
      'E310004567002',
      '180000.00',
      '13-11-2022',
      '14-11-2023 03:05:27',
      'BucMq7',
      ENVIRONMENT.DEV
    );
    expect(url).toBe(
      'https://ecf.dgii.gov.do/testecf/consultatimbre?rncemisor=130862346&RncComprador=111111&encf=E310004567002&fechaemision=13-11-2022&montototal=180000.00&fechafirma=14-11-2023%2003%3A05%3A27&codigoseguridad=BucMq7'
    );
  });

  it('Generate QR Code and remove RNCComprador', () => {
    const url = generateEcfQRCodeURL(
      '130862346',
      '111111',
      'E470004567002',
      '180000.00',
      '13-11-2022',
      '14-11-2023 03:05:27',
      'BucMq7',
      ENVIRONMENT.DEV
    );
    expect(url).toBe(
      'https://ecf.dgii.gov.do/testecf/consultatimbre?rncemisor=130862346&encf=E470004567002&fechaemision=13-11-2022&montototal=180000.00&fechafirma=14-11-2023%2003%3A05%3A27&codigoseguridad=BucMq7'
    );
  });

  it('Extract the XML from the body', () => {
    const rawData = fs.readFileSync(
      path.resolve(__dirname, './sample/commercial_approval_raw_response.txt'),
      'utf8'
    );

    const xml = getXmlFromBodyResponse(rawData);
    expect(xml).toBe(
      '<?xml version="1.0"?><ACECF xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><DetalleAprobacionComercial><Version>1.0</Version><RNCEmisor>130862346</RNCEmisor><eNCF>E450000000001</eNCF><FechaEmision>01-04-2020</FechaEmision><MontoTotal>35400</MontoTotal><RNCComprador>131880657</RNCComprador><Estado>1</Estado><FechaHoraAprobacionComercial>13-11-2023 19:40:32</FechaHoraAprobacionComercial></DetalleAprobacionComercial><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" /><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" /><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" /></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" /><DigestValue>yOO0Jm/g9RuAT/ayc31xP++7jmjb6gjYNNeXxE7na4I=</DigestValue></Reference></SignedInfo><SignatureValue>LIO4O3Kcbgc0dWdwxNttiNJJ/NDduzvG8w4T6kKwIVOoqPBaGzHR+37xgYTSiqvCMhpUYpZHfXgeIcw5OEAwVqtWXUqVhAB0t1H2dPQikiTxvZ4gl6nom7ghbV7jept7Gb5ljwtkyCgiUd98DcOBK4jcut7Bv0Iuog/UWuUFqxe5fdq5q5IsmpT1e5FZu+7gpU2yTwFwG3MUswWzAJ5WVyZa+OU/lQGGEmH9bMwFgzeB/5UWnUBzJ4r3sY/nj4soi04sUOI+y2/cme2TQH2xS9K/7YDURjEH4Z2xi8PbHojhKO/d9HXSsSQH8N/SquyCLl9aQc3tI0fDyyQ20j61Bg==</SignatureValue><KeyInfo><X509Data><X509Certificate>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</X509Certificate></X509Data></KeyInfo></Signature></ACECF>'
    );
  });

  it('Convert ECF32 to RFCE', () => {
    const ecf32Xml = fs.readFileSync(
      path.resolve(__dirname, './sample/convertion/signedECF32.xml'),
      'utf8'
    );
    const rfceXml = fs.readFileSync(
      path.resolve(__dirname, './sample/convertion/rfce.xml'),
      'utf8'
    );

    const rfce = convertECF32ToRFCE(ecf32Xml);

    expect(rfce.xml).toBe(rfceXml);
    expect(rfce.securityCode).toBe('m+tPLr');
  });

  it('Convert ECF32 to RFCE without aditional taxes', () => {
    const ecf32Xml = fs.readFileSync(
      path.resolve(
        __dirname,
        './sample/convertion/signedECF32-without-tax.xml'
      ),
      'utf8'
    );
    const rfceXml = fs.readFileSync(
      path.resolve(__dirname, './sample/convertion/rfceWithoutAditionaTax.xml'),
      'utf8'
    );

    const rfce = convertECF32ToRFCE(ecf32Xml);

    expect(rfce.xml).toBe(rfceXml);
    expect(rfce.securityCode).toBe('m+tPLr');
  });

  it('Verify valid  XML Signature', () => {
    const xmlSigned = fs.readFileSync(
      path.resolve(__dirname, './sample/130359334E310000008928.xml'),
      'utf8'
    );

    const result = validateXMLCertificate(xmlSigned);
    expect(result.isValid).toBeTruthy();
    expect(result.cert).toBeDefined();
  });

  it('Verify invalid  XML Signature', () => {
    const xmlSigned = fs.readFileSync(
      path.resolve(__dirname, './sample/130359334E310000008928-invalid.xml'),
      'utf8'
    );

    const result = validateXMLCertificate(xmlSigned, { silent: true });
    expect(result.isValid).toBeFalsy();
  });
});
