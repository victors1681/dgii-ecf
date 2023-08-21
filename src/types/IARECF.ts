export interface IARECF {
  _declaration: Declaration;
  ARECF: Arecf;
}

export interface Declaration {
  _attributes: Attributes;
}

export interface Attributes {
  version: string;
  encoding: string;
}

export interface Arecf {
  _attributes: Attributes2;
  DetalleAcusedeRecibo: DetalleAcusedeRecibo;
  Signature: Signature;
}

export interface Attributes2 {
  'xmlns:xsi': string;
  'xmlns:xsd': string;
}

export interface DetalleAcusedeRecibo {
  Version: Version;
  RNCEmisor: Rncemisor;
  RNCComprador: Rnccomprador;
  eNCF: ENcf;
  Estado: Estado;
  FechaHoraAcuseRecibo: FechaHoraAcuseRecibo;
}

export interface Version {
  _text: string;
}

export interface Rncemisor {
  _text: string;
}

export interface Rnccomprador {
  _text: string;
}

export interface ENcf {
  _text: string;
}

export interface Estado {
  _text: string;
}

export interface FechaHoraAcuseRecibo {
  _text: string;
}

export interface Signature {
  _attributes: Attributes3;
  SignedInfo: SignedInfo;
  SignatureValue: SignatureValue;
  KeyInfo: KeyInfo;
}

export interface Attributes3 {
  xmlns: string;
}

export interface SignedInfo {
  CanonicalizationMethod: CanonicalizationMethod;
  SignatureMethod: SignatureMethod;
  Reference: Reference;
}

export interface CanonicalizationMethod {
  _attributes: Attributes4;
}

export interface Attributes4 {
  Algorithm: string;
}

export interface SignatureMethod {
  _attributes: Attributes5;
}

export interface Attributes5 {
  Algorithm: string;
}

export interface Reference {
  _attributes: Attributes6;
  Transforms: Transforms;
  DigestMethod: DigestMethod;
  DigestValue: DigestValue;
}

export interface Attributes6 {
  URI: string;
}

export interface Transforms {
  Transform: Transform;
}

export interface Transform {
  _attributes: Attributes7;
}

export interface Attributes7 {
  Algorithm: string;
}

export interface DigestMethod {
  _attributes: Attributes8;
}

export interface Attributes8 {
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
