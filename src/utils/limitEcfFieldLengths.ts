/**
 * Maximum length of the descriptive free-text fields of an e-CF, taken from
 * the DGII XSD (e-CF 31 v1.0 `AlfNum<N>Type`; `RazonModificacion` from the
 * e-CF 33/34 XSD).
 *
 * The DGII rejects the whole document when one of these is too long
 * ("The actual length is greater than the MaxLength value") and still marks
 * its e-NCF as used, so the number is lost. Cutting the text is always better
 * than that: the full text of an item can travel in `DescripcionItem` (1000).
 *
 * Only names, addresses, contacts and descriptions are listed. Identifiers
 * (`CodigoItem`, `TipoCodigo`, `CodigoVendedor`, `CodigoInternoComprador`,
 * `NumeroFacturaInterna`, `NumeroOrdenCompra`, `Sucursal`, `Placa`, …) and
 * formatted fields (emails, URLs, dates, RNC, amounts) are deliberately NOT
 * listed: two codes that share a prefix would collide once cut, and a cut
 * formatted value is just a different invalid value. An over-long identifier
 * must be fixed at its source.
 */
export const ECF_FIELD_MAX_LENGTHS: Readonly<Record<string, number>> = {
  // Emisor
  RazonSocialEmisor: 150,
  NombreComercial: 150,
  DireccionEmisor: 100,
  ActividadEconomica: 100,
  InformacionAdicionalEmisor: 250,
  // Comprador
  RazonSocialComprador: 150,
  ContactoComprador: 80,
  DireccionComprador: 100,
  InformacionAdicionalComprador: 150,
  DireccionEntrega: 100,
  ContactoEntrega: 100,
  // Detalle
  NombreItem: 80,
  DescripcionItem: 1000,
  DescripcionSubtotal: 40,
  DescripcionDescuentooRecargo: 45,
  // Información de referencia (notas de crédito/débito)
  RazonModificacion: 90,
};

/** A field that was cut to fit the DGII limit. */
export interface TruncatedEcfField {
  field: string;
  maxLength: number;
  original: string;
  truncated: string;
}

export interface LimitEcfFieldLengthsOptions {
  /** Called once per field that had to be cut, e.g. to log it. */
  onFieldTruncated?: (info: TruncatedEcfField) => void;
}

/**
 * Trims `value` and cuts it to `maxLength` characters. Counts Unicode code
 * points, not UTF-16 units, so an emoji or other astral character is never
 * split in half. A cut never leaves a trailing space.
 */
export const truncateEcfText = (value: string, maxLength: number): string => {
  const trimmed = value.trim();
  const chars = Array.from(trimmed);
  if (chars.length <= maxLength) {
    return trimmed;
  }
  return chars.slice(0, maxLength).join('').trimEnd();
};

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;

const textOf = (el: Element): string | null => {
  let text = '';
  for (let i = 0; i < el.childNodes.length; i++) {
    const child = el.childNodes[i];
    if (child.nodeType === ELEMENT_NODE) {
      return null; // not a leaf: nothing to cut here
    }
    if (child.nodeType === TEXT_NODE || child.nodeType === CDATA_SECTION_NODE) {
      text += child.nodeValue ?? '';
    }
  }
  return text;
};

const setText = (el: Element, value: string) => {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
  el.appendChild(el.ownerDocument.createTextNode(value));
};

/**
 * Cuts, in place, every free-text field of a parsed e-CF that exceeds its DGII
 * limit (see {@link ECF_FIELD_MAX_LENGTHS}). Returns the fields it cut.
 */
export const limitEcfFieldLengthsInDocument = (
  doc: Document,
  options: LimitEcfFieldLengthsOptions = {}
): TruncatedEcfField[] => {
  const truncated: TruncatedEcfField[] = [];

  const visit = (el: Element) => {
    const name = el.localName || el.nodeName;
    const maxLength = ECF_FIELD_MAX_LENGTHS[name];
    if (maxLength !== undefined) {
      const original = textOf(el);
      if (original !== null && Array.from(original).length > maxLength) {
        const value = truncateEcfText(original, maxLength);
        setText(el, value);
        const info = { field: name, maxLength, original, truncated: value };
        truncated.push(info);
        options.onFieldTruncated?.(info);
        return;
      }
    }
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === ELEMENT_NODE) {
        visit(child as Element);
      }
    }
  };

  if (doc.documentElement) {
    visit(doc.documentElement);
  }
  return truncated;
};

/**
 * Same as {@link limitEcfFieldLengthsInDocument} for the JSON payload given to
 * `Transformer.json2xml()` (compact xml-js form: a field is a string, a number,
 * or `{ _text: string }`). A number longer than its field's limit becomes the
 * cut string. Returns a new object; the input is not modified.
 */
export const limitEcfFieldLengths = <T>(
  payload: T,
  options: LimitEcfFieldLengthsOptions = {}
): T => {
  const walk = (node: unknown, key?: string): unknown => {
    const maxLength =
      key !== undefined ? ECF_FIELD_MAX_LENGTHS[key] : undefined;

    if (maxLength !== undefined && typeof node === 'string') {
      return cut(key as string, node, maxLength);
    }
    // A number in a text field is written as its string form by json2xml, so
    // it is measured (and, if too long, cut) as that same text.
    if (maxLength !== undefined && typeof node === 'number') {
      const text = String(node);
      return Array.from(text).length > maxLength
        ? cut(key as string, text, maxLength)
        : node;
    }
    if (Array.isArray(node)) {
      return node.map((item) => walk(item, key));
    }
    if (node !== null && typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      if (maxLength !== undefined && typeof obj._text === 'string') {
        return { ...obj, _text: cut(key as string, obj._text, maxLength) };
      }
      return Object.keys(obj).reduce((acc, k) => {
        acc[k] = walk(obj[k], k);
        return acc;
      }, {} as Record<string, unknown>);
    }
    return node;
  };

  const cut = (field: string, original: string, maxLength: number): string => {
    if (Array.from(original).length <= maxLength) {
      return original;
    }
    const value = truncateEcfText(original, maxLength);
    options.onFieldTruncated?.({
      field,
      maxLength,
      original,
      truncated: value,
    });
    return value;
  };

  return walk(payload) as T;
};
