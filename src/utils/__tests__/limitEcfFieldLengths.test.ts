import forge from 'node-forge';
import { DOMParser } from '@xmldom/xmldom';
import Signature from '../../Signature/Signature';
import Transformer from '../../transformers/Transformer';
import {
  ECF_FIELD_MAX_LENGTHS,
  limitEcfFieldLengths,
  limitEcfFieldLengthsInDocument,
  truncateEcfText,
  TruncatedEcfField,
} from '../limitEcfFieldLengths';

// Rejected by the DGII as E340000000008: NombreItem longer than 80 (AlfaNum80).
const NOMBRE_LARGO =
  'TCL 65pulg 144hz Q77K 4K UHD HDR QLED Smart TV, Google TV ¿ 65Q77K. GAMING TV 144HZ PUERTO 2.1 ';

const ecfJson = (nombreItem: string) => ({
  ECF: {
    Encabezado: {
      Version: '1.0',
      IdDoc: { TipoeCF: '34', eNCF: 'E340000000011' },
      Emisor: {
        RNCEmisor: '132797264',
        RazonSocialEmisor: 'Minayatech',
        CorreoEmisor: 'ventas@example.com',
      },
    },
    DetallesItems: {
      Item: [
        {
          NumeroLinea: '1',
          NombreItem: nombreItem,
          DescripcionItem: nombreItem,
        },
        { NumeroLinea: '2', NombreItem: 'Corto' },
      ],
    },
    InformacionReferencia: {
      NCFModificado: 'E310000000001',
      RazonModificacion: 'x'.repeat(120),
    },
  },
});

const textOf = (xml: string, tag: string): string[] => {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const nodes = doc.getElementsByTagName(tag);
  const values: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    values.push(nodes[i].textContent ?? '');
  }
  return values;
};

describe('truncateEcfText', () => {
  it('cuts to the limit and never leaves a trailing space', () => {
    const value = truncateEcfText(NOMBRE_LARGO, 80);
    expect(Array.from(value).length).toBeLessThanOrEqual(80);
    expect(value).toBe(value.trimEnd());
    expect(value.startsWith('TCL 65pulg 144hz Q77K')).toBe(true);
  });

  it('leaves a short value as is (trimmed)', () => {
    expect(truncateEcfText('  Pago local  ', 80)).toBe('Pago local');
  });

  it('counts code points, so an emoji is never split', () => {
    const value = truncateEcfText('ab😀cd', 3);
    expect(value).toBe('ab😀');
  });
});

describe('ECF_FIELD_MAX_LENGTHS', () => {
  it('uses the DGII XSD limits for the fields that get rejected most', () => {
    expect(ECF_FIELD_MAX_LENGTHS.NombreItem).toBe(80);
    expect(ECF_FIELD_MAX_LENGTHS.DescripcionItem).toBe(1000);
    expect(ECF_FIELD_MAX_LENGTHS.RazonSocialComprador).toBe(150);
    expect(ECF_FIELD_MAX_LENGTHS.DireccionComprador).toBe(100);
    expect(ECF_FIELD_MAX_LENGTHS.RazonModificacion).toBe(90);
  });

  it('does not cut fields with a format, such as emails', () => {
    expect(ECF_FIELD_MAX_LENGTHS.CorreoEmisor).toBeUndefined();
    expect(ECF_FIELD_MAX_LENGTHS.CorreoComprador).toBeUndefined();
  });
});

describe('limitEcfFieldLengths (JSON)', () => {
  it('cuts long fields in every item and reports them', () => {
    const reported: TruncatedEcfField[] = [];
    const payload = ecfJson(NOMBRE_LARGO);

    const result = limitEcfFieldLengths(payload, {
      onFieldTruncated: (info) => reported.push(info),
    });

    const item = result.ECF.DetallesItems.Item[0];
    expect(Array.from(item.NombreItem).length).toBeLessThanOrEqual(80);
    expect(item.DescripcionItem).toBe(NOMBRE_LARGO); // fits in 1000
    expect(result.ECF.DetallesItems.Item[1].NombreItem).toBe('Corto');
    expect(result.ECF.InformacionReferencia.RazonModificacion).toHaveLength(90);
    expect(reported.map((r) => r.field).sort()).toEqual([
      'NombreItem',
      'RazonModificacion',
    ]);
    // The input is not modified.
    expect(payload.ECF.DetallesItems.Item[0].NombreItem).toBe(NOMBRE_LARGO);
  });

  it('handles the { _text } form', () => {
    const result = limitEcfFieldLengths({
      ECF: { DetallesItems: { Item: { NombreItem: { _text: NOMBRE_LARGO } } } },
    });
    expect(
      Array.from(result.ECF.DetallesItems.Item.NombreItem._text).length
    ).toBeLessThanOrEqual(80);
  });
});

describe('limitEcfFieldLengthsInDocument (XML)', () => {
  it('cuts long leaf fields of a parsed e-CF', () => {
    const xml = new Transformer().json2xml(ecfJson(NOMBRE_LARGO));
    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    const cut = limitEcfFieldLengthsInDocument(doc as unknown as Document);

    expect(cut.map((c) => c.field).sort()).toEqual([
      'NombreItem',
      'RazonModificacion',
    ]);
    const nombres = textOf(doc.toString(), 'NombreItem');
    expect(Array.from(nombres[0]).length).toBeLessThanOrEqual(80);
    expect(nombres[1]).toBe('Corto');
  });
});

describe('Signature.signXml limits e-CF field lengths', () => {
  // Throwaway self-signed certificate: these tests must not depend on the
  // private test certificate.
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const attrs = [{ name: 'commonName', value: 'dgii-ecf-test' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);
  const signature = new Signature(
    forge.pki.privateKeyToPem(keys.privateKey),
    forge.pki.certificateToPem(cert)
  );

  const xml = new Transformer().json2xml(ecfJson(NOMBRE_LARGO));

  it('cuts NombreItem to 80 before signing an ECF, by default', () => {
    const reported: string[] = [];
    const signed = signature.signXml(xml, 'ECF', {
      onFieldTruncated: (info) => reported.push(info.field),
    });

    const nombre = textOf(signed, 'NombreItem')[0];
    expect(Array.from(nombre).length).toBeLessThanOrEqual(80);
    expect(textOf(signed, 'DescripcionItem')[0]).toBe(NOMBRE_LARGO);
    expect(reported).toContain('NombreItem');
    expect(textOf(signed, 'SignatureValue')[0].length).toBeGreaterThan(0);
  });

  it('also applies when the root is auto-detected', () => {
    const signed = signature.signXml(xml);
    expect(
      Array.from(textOf(signed, 'NombreItem')[0]).length
    ).toBeLessThanOrEqual(80);
  });

  it('signs the document as given when limitFieldLengths is false', () => {
    const signed = signature.signXml(xml, 'ECF', { limitFieldLengths: false });
    expect(textOf(signed, 'NombreItem')[0]).toBe(NOMBRE_LARGO);
  });

  it('never touches documents other than ECF', () => {
    const otro = xml.replace(/ECF>/g, 'Postulacion>');
    const signed = signature.signXml(otro, 'Postulacion');
    expect(textOf(signed, 'NombreItem')[0]).toBe(NOMBRE_LARGO);
  });
});
