export interface IECF {
  ECF: Ecf;
}

export interface Ecf {
  Encabezado: Encabezado;
  DetallesItems: DetallesItems;
  Subtotales: Subtotales;
  DescuentosORecargos: DescuentosOrecargos;
  Paginacion: Paginacion;
  InformacionReferencia: InformacionReferencia;
  FechaHoraFirma: string;
}

export interface Encabezado {
  Version: number;
  IdDoc: IdDoc;
  Emisor: Emisor;
  Comprador: Comprador;
  InformacionesAdicionales: InformacionesAdicionales;
  Transporte: Transporte;
  Totales: Totales;
  OtraMoneda: OtraMoneda;
}

export interface IdDoc {
  TipoeCF: number;
  eNCF: string;
  FechaVencimientoSecuencia: string;
  IndicadorEnvioDiferido: number;
  IndicadorMontoGravado: number;
  IndicadorServicioTodoIncluido: number;
  TipoIngresos: string;
  TipoPago: number;
  FechaLimitePago: string;
  TerminoPago: string;
  TablaFormasPago: TablaFormasPago;
  TipoCuentaPago: string;
  NumeroCuentaPago: string;
  BancoPago: string;
  FechaDesde: string;
  FechaHasta: string;
  TotalPaginas: number;
}

export interface TablaFormasPago {
  FormaDePago: FormaDePago[];
}

export interface FormaDePago {
  FormaPago: number;
  MontoPago: number;
}

export interface Emisor {
  RNCEmisor: string;
  RazonSocialEmisor: string;
  NombreComercial: string;
  Sucursal: string;
  DireccionEmisor: string;
  Municipio: string;
  Provincia: string;
  TablaTelefonoEmisor: TablaTelefonoEmisor;
  CorreoEmisor: string;
  WebSite: string;
  ActividadEconomica: string;
  CodigoVendedor: string;
  NumeroFacturaInterna: string;
  NumeroPedidoInterno: number;
  ZonaVenta: string;
  RutaVenta: string;
  InformacionAdicionalEmisor: string;
  FechaEmision: string;
}

export interface TablaTelefonoEmisor {
  TelefonoEmisor: string[];
}

export interface Comprador {
  RNCComprador: string;
  RazonSocialComprador: string;
  ContactoComprador: string;
  CorreoComprador: string;
  DireccionComprador: string;
  MunicipioComprador: string;
  ProvinciaComprador: string;
  FechaEntrega: string;
  ContactoEntrega: string;
  DireccionEntrega: string;
  TelefonoAdicional: string;
  FechaOrdenCompra: string;
  NumeroOrdenCompra: string;
  CodigoInternoComprador: string;
  ResponsablePago: ResponsablePago;
  InformacionAdicionalComprador: string;
}

export type ResponsablePago = Object;

export interface InformacionesAdicionales {
  FechaEmbarque: string;
  NumeroEmbarque: string;
  NumeroContenedor: string;
  NumeroReferencia: number;
  PesoBruto: number;
  PesoNeto: number;
  UnidadPesoBruto: number;
  UnidadPesoNeto: number;
  CantidadBulto: number;
  UnidadBulto: number;
  VolumenBulto: number;
  UnidadVolumen: number;
}

export interface Transporte {
  Conductor: string;
  DocumentoTransporte: number;
  Ficha: string;
  Placa: string;
  RutaTransporte: string;
  ZonaTransporte: string;
  NumeroAlbaran: string;
}

export interface Totales {
  MontoGravadoTotal: number;
  MontoGravadoI1: number;
  MontoGravadoI2: number;
  MontoGravadoI3: number;
  MontoExento: number;
  ITBIS1: number;
  ITBIS2: number;
  ITBIS3: number;
  TotalITBIS: number;
  TotalITBIS1: number;
  TotalITBIS2: number;
  TotalITBIS3: number;
  MontoImpuestoAdicional: number;
  ImpuestosAdicionales: ImpuestosAdicionales;
  MontoTotal: number;
  MontoNoFacturable: number;
  MontoPeriodo: number;
  SaldoAnterior: number;
  MontoAvancePago: number;
  ValorPagar: number;
  TotalITBISRetenido: number;
  TotalISRRetencion: number;
  TotalITBISPercepcion: number;
  TotalISRPercepcion: number;
}

export interface ImpuestosAdicionales {
  ImpuestoAdicional: ImpuestoAdicional[];
}

export interface ImpuestoAdicional {
  TipoImpuesto: string;
  TasaImpuestoAdicional: number;
  MontoImpuestoSelectivoConsumoEspecifico: number;
  MontoImpuestoSelectivoConsumoAdvalorem: number;
  OtrosImpuestosAdicionales: number;
}

export interface OtraMoneda {
  TipoMoneda: string;
  TipoCambio: number;
  MontoGravadoTotalOtraMoneda: number;
  MontoGravado1OtraMoneda: number;
  MontoGravado2OtraMoneda: number;
  MontoGravado3OtraMoneda: number;
  MontoExentoOtraMoneda: number;
  TotalITBISOtraMoneda: number;
  TotalITBIS1OtraMoneda: number;
  TotalITBIS2OtraMoneda: number;
  TotalITBIS3OtraMoneda: number;
  MontoImpuestoAdicionalOtraMoneda: number;
  ImpuestosAdicionalesOtraMoneda: ImpuestosAdicionalesOtraMoneda;
  MontoTotalOtraMoneda: number;
}

export interface ImpuestosAdicionalesOtraMoneda {
  ImpuestoAdicionalOtraMoneda: ImpuestoAdicionalOtraMoneda[];
}

export interface ImpuestoAdicionalOtraMoneda {
  TipoImpuestoOtraMoneda: string;
  TasaImpuestoAdicionalOtraMoneda: number;
  MontoImpuestoSelectivoConsumoEspecificoOtraMoneda: number;
  MontoImpuestoSelectivoConsumoAdvaloremOtraMoneda: number;
  OtrosImpuestosAdicionalesOtraMoneda: number;
}

export interface DetallesItems {
  Item: Item[];
}

export interface Item {
  NumeroLinea: number;
  TablaCodigosItem: TablaCodigosItem;
  IndicadorFacturacion: number;
  Retencion: Retencion;
  NombreItem: string;
  IndicadorBienoServicio: number;
  DescripcionItem: string;
  CantidadItem: number;
  UnidadMedida: number;
  CantidadReferencia: number;
  UnidadReferencia: number;
  TablaSubcantidad: TablaSubcantidad;
  GradosAlcohol: number;
  PrecioUnitarioReferencia: number;
  FechaElaboracion: string;
  FechaVencimientoItem: string;
  PrecioUnitarioItem: number;
  DescuentoMonto: number;
  TablaSubDescuento: TablaSubDescuento;
  RecargoMonto: number;
  TablaSubRecargo: TablaSubRecargo;
  TablaImpuestoAdicional: TablaImpuestoAdicional;
  OtraMonedaDetalle: OtraMonedaDetalle;
  MontoItem: number;
}

export interface TablaCodigosItem {
  CodigosItem: CodigosItem[];
}

export interface CodigosItem {
  TipoCodigo: string;
  CodigoItem: string;
}

export interface Retencion {
  IndicadorAgenteRetencionoPercepcion: number;
  MontoITBISRetenido: number;
  MontoISRRetenido: number;
}

export interface TablaSubcantidad {
  SubcantidadItem: SubcantidadItem[];
}

export interface SubcantidadItem {
  Subcantidad: number;
  CodigoSubcantidad: number;
}

export interface TablaSubDescuento {
  SubDescuento: SubDescuento[];
}

export interface SubDescuento {
  TipoSubDescuento: string;
  SubDescuentoPorcentaje: number;
  MontoSubDescuento: number;
}

export interface TablaSubRecargo {
  SubRecargo: SubRecargo[];
}

export interface SubRecargo {
  TipoSubRecargo: string;
  SubRecargoPorcentaje: number;
  MontoSubRecargo: number;
}

export interface TablaImpuestoAdicional {
  ImpuestoAdicional: ImpuestoAdicional2[];
}

export interface ImpuestoAdicional2 {
  TipoImpuesto: string;
}

export interface OtraMonedaDetalle {
  PrecioOtraMoneda: number;
  DescuentoOtraMoneda: number;
  RecargoOtraMoneda: number;
  MontoItemOtraMoneda: number;
}

export interface Subtotales {
  Subtotal: Subtotal[];
}

export interface Subtotal {
  NumeroSubTotal: number;
  DescripcionSubtotal: string;
  Orden: number;
  SubTotalMontoGravadoTotal: number;
  SubTotalMontoGravadoI1: number;
  SubTotalMontoGravadoI2: number;
  SubTotalMontoGravadoI3: number;
  SubTotaITBIS: number;
  SubTotaITBIS1: number;
  SubTotaITBIS2: number;
  SubTotaITBIS3: number;
  SubTotalImpuestoAdicional: number;
  SubTotalExento: number;
  MontoSubTotal: number;
  Lineas: number;
}

export interface DescuentosOrecargos {
  DescuentoORecargo: DescuentoOrecargo[];
}

export interface DescuentoOrecargo {
  NumeroLinea: number;
  TipoAjuste: string;
  IndicadorNorma1007: number;
  DescripcionDescuentooRecargo: string;
  TipoValor: string;
  ValorDescuentooRecargo: number;
  MontoDescuentooRecargo: number;
  MontoDescuentooRecargoOtraMoneda: number;
  IndicadorFacturacionDescuentooRecargo: number;
}

export interface Paginacion {
  Pagina: Pagina[];
}

export interface Pagina {
  PaginaNo: number;
  NoLineaDesde: number;
  NoLineaHasta: number;
  SubtotalMontoGravadoPagina: number;
  SubtotalMontoGravado1Pagina: number;
  SubtotalMontoGravado2Pagina: number;
  SubtotalMontoGravado3Pagina: number;
  SubtotalExentoPagina: number;
  SubtotalItbisPagina: number;
  SubtotalItbis1Pagina: number;
  SubtotalItbis2Pagina: number;
  SubtotalItbis3Pagina: number;
  SubtotalImpuestoAdicionalPagina: number;
  SubtotalImpuestoAdicional: SubtotalImpuestoAdicional;
  MontoSubtotalPagina: number;
  SubtotalMontoNoFacturablePagina: number;
}

export interface SubtotalImpuestoAdicional {
  SubtotalImpuestoSelectivoConsumoEspecificoPagina: number;
  SubtotalOtrosImpuesto: number;
}

export interface InformacionReferencia {
  NCFModificado: string;
  RNCOtroContribuyente: string;
  FechaNCFModificado: string;
  CodigoModificacion: number;
}
