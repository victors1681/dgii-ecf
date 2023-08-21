export interface IRFCE {
  RFCE: Rfce;
}

export interface Rfce {
  Encabezado: Encabezado;
}

export interface Encabezado {
  Version: string;
  IdDoc: IdDoc;
  Emisor: Emisor;
  Comprador: Comprador;
  Totales: Totales;
  CodigoSeguridadeCF: string;
}

export interface IdDoc {
  TipoeCF: number;
  eNCF: string;
  TipoIngresos: string;
  TipoPago: number;
  TablaFormasPago: TablaFormasPago;
}

export interface TablaFormasPago {
  FormaDePago: FormaDePago;
}

export interface FormaDePago {
  FormaPago: number;
  MontoPago: number;
}

export interface Emisor {
  RNCEmisor: string;
  RazonSocialEmisor: string;
  FechaEmision: string;
}

export interface Comprador {
  RNCComprador: string;
  RazonSocialComprador: string;
}

export interface Totales {
  MontoGravadoTotal: number;
  MontoGravadoI1: number;
  MontoExento: number;
  TotalITBIS: number;
  TotalITBIS1: number;
  MontoTotal: number;
  MontoNoFacturable: number;
  MontoPeriodo: number;
}
