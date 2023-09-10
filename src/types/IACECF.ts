export interface IACECF {
  _declaration: Declaration;
  ACECF: Acecf;
}

export interface Declaration {
  _attributes: Attributes;
}

export interface Attributes {
  version: string;
  encoding: string;
}

export interface Acecf {
  DetalleAprobacionComercial: DetalleAprobacionComercial;
  Signature: Signature;
}

export interface DetalleAprobacionComercial {
  Version: Version;
  RNCEmisor: Rncemisor;
  eNCF: ENcf;
  FechaEmision: FechaEmision;
  MontoTotal: MontoTotal;
  RNCComprador: Rnccomprador;
  Estado: Estado;
  DetalleMotivoRechazo: DetalleMotivoRechazo;
  FechaHoraAprobacionComercial: FechaHoraAprobacionComercial;
}

export interface Version {
  _text: string;
}

export interface Rncemisor {
  _text: string;
}

export interface ENcf {
  _text: string;
}

export interface FechaEmision {
  _text: string;
}

export interface MontoTotal {
  _text: string;
}

export interface Rnccomprador {
  _text: string;
}

export interface Estado {
  _text: string;
}

export interface DetalleMotivoRechazo {
  _text: String | null;
}

export interface FechaHoraAprobacionComercial {
  _text: string;
}

export interface Signature {
  _attributes: Attributes2;
  SignedInfo: SignedInfo;
  SignatureValue: SignatureValue;
  KeyInfo: KeyInfo;
}

export interface Attributes2 {
  xmlns: string;
}

export interface SignedInfo {
  CanonicalizationMethod: CanonicalizationMethod;
  SignatureMethod: SignatureMethod;
  Reference: Reference;
}

export interface CanonicalizationMethod {
  _attributes: Attributes3;
}

export interface Attributes3 {
  Algorithm: string;
}

export interface SignatureMethod {
  _attributes: Attributes4;
}

export interface Attributes4 {
  Algorithm: string;
}

export interface Reference {
  _attributes: Attributes5;
  Transforms: Transforms;
  DigestMethod: DigestMethod;
  DigestValue: DigestValue;
}

export interface Attributes5 {
  URI: string;
}

export interface Transforms {
  Transform: Transform;
}

export interface Transform {
  _attributes: Attributes6;
}

export interface Attributes6 {
  Algorithm: string;
}

export interface DigestMethod {
  _attributes: Attributes7;
}

export interface Attributes7 {
  Algorithm: string;
}

export interface DigestValue {
  _text: string;
}

export interface SignatureValue {
  _text: string;
}

export interface KeyInfo {
  X509Data: X509Data;
}

export interface X509Data {
  X509Certificate: X509Certificate;
}

export interface X509Certificate {
  _text: string;
}
