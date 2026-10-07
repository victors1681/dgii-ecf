/**
 * Formato de Anulación de e-NCF (ANECF).
 *
 * Estructura del documento XML que se envía al servicio
 * `anulacionrangos/api/operaciones/anularrango` de la DGII para anular rangos
 * de secuencias de e-NCF que no fueron (ni serán) utilizadas.
 *
 * Estas interfaces describen el resultado de `Transformer.xml2Json<IANECF>()`
 * (formato "compact" de `xml-js`, donde cada valor escalar viaja dentro de
 * `_text`). Para construir el XML a partir de un objeto plano use
 * `IANECFPlain` junto a `Transformer.json2xml()`.
 */
export interface IANECF {
  _declaration: Declaration;
  ANECF: Anecf;
}

export interface Declaration {
  _attributes: Attributes;
}

export interface Attributes {
  version: string;
  encoding: string;
}

export interface Anecf {
  Encabezado: Encabezado;
  DetalleAnulacion: DetalleAnulacion;
  Signature?: Signature;
}

export interface Encabezado {
  /** Versión del formato de anulación. Valor fijo: `1.0` */
  Version: TextValue;
  /** RNC del emisor que solicita la anulación (9 u 11 dígitos) */
  RncEmisor: TextValue;
  /** Sumatoria de e-NCF anulados en todo el detalle */
  CantidadeNCFAnulados: TextValue;
  /** Fecha y hora de generación, en formato `dd-MM-yyyy HH:mm:ss` */
  FechaHoraAnulacioneNCF: TextValue;
}

export interface DetalleAnulacion {
  /**
   * Un bloque por cada tipo de e-CF a anular. La DGII admite hasta 10
   * repeticiones (una por tipo de comprobante).
   */
  Anulacion: Anulacion | Anulacion[];
}

export interface Anulacion {
  /** Número de línea, de 1 a 10 */
  NoLinea: TextValue;
  /** Tipo de e-CF: 31, 32, 33, 34, 41, 43, 44, 45, 46 o 47 */
  TipoeCF: TextValue;
  TablaRangoSecuenciasAnuladaseNCF: TablaRangoSecuenciasAnuladaseNCF;
  /** Cantidad de e-NCF anulados en este bloque */
  CantidadeNCFAnulados: TextValue;
}

export interface TablaRangoSecuenciasAnuladaseNCF {
  /** Hasta 10,000 rangos consecutivos por tipo de e-CF */
  Secuencias: Secuencias | Secuencias[];
}

export interface Secuencias {
  /** e-NCF inicial del rango. Ej.: `E310000000001` */
  SecuenciaeNCFDesde: TextValue;
  /** e-NCF final del rango, mayor o igual al inicial */
  SecuenciaeNCFHasta: TextValue;
}

export interface TextValue {
  _text: string;
}

export interface Signature {
  _attributes: SignatureAttributes;
  SignedInfo: SignedInfo;
  SignatureValue: TextValue;
  KeyInfo: KeyInfo;
}

export interface SignatureAttributes {
  xmlns: string;
}

export interface SignedInfo {
  CanonicalizationMethod: AlgorithmElement;
  SignatureMethod: AlgorithmElement;
  Reference: Reference;
}

export interface AlgorithmElement {
  _attributes: { Algorithm: string };
}

export interface Reference {
  _attributes: { URI: string };
  Transforms: Transforms;
  DigestMethod: AlgorithmElement;
  DigestValue: TextValue;
}

export interface Transforms {
  Transform: AlgorithmElement;
}

export interface KeyInfo {
  X509Data: X509Data;
}

export interface X509Data {
  X509Certificate: TextValue;
}

/**
 * Representación plana (JSON) del formato ANECF, tal como se entrega a
 * `Transformer.json2xml()` para producir el XML antes de firmarlo.
 */
export interface IANECFPlain {
  ANECF: AnecfPlain;
}

export interface AnecfPlain {
  Encabezado: EncabezadoPlain;
  DetalleAnulacion: DetalleAnulacionPlain;
}

export interface EncabezadoPlain {
  Version: string;
  RncEmisor: string;
  CantidadeNCFAnulados: number;
  FechaHoraAnulacioneNCF: string;
}

export interface DetalleAnulacionPlain {
  Anulacion: AnulacionPlain[];
}

export interface AnulacionPlain {
  NoLinea: number;
  TipoeCF: string;
  TablaRangoSecuenciasAnuladaseNCF: {
    Secuencias: SecuenciasPlain[];
  };
  CantidadeNCFAnulados: number;
}

export interface SecuenciasPlain {
  SecuenciaeNCFDesde: string;
  SecuenciaeNCFHasta: string;
}
