import { transformeLowercasePayloadToCamelcase } from '../customTransformers';

describe('Custom Transformer ', () => {
  const lowercasePayload = {
    ecf: {
      encabezado: {
        version: '1.0',
        iddoc: {
          tipoecf: '31',
          encf: 'E310000009175',
          fechavencimientosecuencia: '31-12-2025',
          indicadorenviodiferido: '1',
          indicadormontogravado: '0',
          tipoingresos: '05',
          tipopago: '2',
          fechalimitepago: '07-08-2026',
          totalpaginas: 1,
        },
        emisor: {
          rncemisor: '123',
          razonsocialemisor: 'MSeller',
          direccionemisor: 'DireccionEmisor1',
          fechaemision: '14-05-2025',
        },
        comprador: {
          rnccomprador: '101023122',
          razonsocialcomprador: 'Cliente Prueba SRL',
        },
        totales: {
          montogravadototal: 540.0,
          montogravadoi1: 540.0,
          montoexento: 0,
          itbis1: 18,
          totalitbis: 97.2,
          totalitbis1: 97.2,
          montototal: 637.2,
          montonofacturable: 0,
        },
      },
      detallesitems: {
        item: [
          {
            numerolinea: '1',
            indicadorfacturacion: '1',
            nombreitem: 'Producto 1',
            indicadorbienoservicio: '1',
            cantidaditem: 24,
            unidadmedida: '43',
            preciounitarioitem: 25.0,
            descuentomonto: 60.0,
            tablasubdescuento: {
              subdescuento: {
                tiposubdescuento: '%',
                subdescuentoporcentaje: 10.0,
                montosubdescuento: 60.0,
              },
            },
            montoitem: 540.0,
          },
        ],
      },
      paginacion: {
        pagina: [
          {
            paginano: 1,
            nolineadesde: 1,
            nolineahasta: 1,
            subtotalmontogravadopagina: 540.0,
            subtotalmontogravado1pagina: 540.0,
            subtotalexentopagina: 0,
            subtotalitbispagina: 97.2,
            subtotalitbis1pagina: 97.2,
            montosubtotalpagina: 637.2,
            subtotalmontonofacturablepagina: 0,
          },
        ],
      },
      fechahorafirma: '15-07-2023 05:07:00',
    },
  };
  it('Transform Lowercase payload to Uppercase', () => {
    const code = transformeLowercasePayloadToCamelcase(lowercasePayload);
    expect(code).toMatchObject({
      ECF: {
        DetallesItems: {
          Item: [
            {
              CantidadItem: 24,
              DescuentoMonto: 60,
              IndicadorBienoServicio: '1',
              IndicadorFacturacion: '1',
              MontoItem: 540,
              NombreItem: 'Producto 1',
              NumeroLinea: '1',
              PrecioUnitarioItem: 25,
              TablaSubDescuento: {
                SubDescuento: {
                  montosubdescuento: 60,
                  subdescuentoporcentaje: 10,
                  tiposubdescuento: '%',
                },
              },
              UnidadMedida: '43',
            },
          ],
        },
        Encabezado: {
          Comprador: {
            RNCComprador: '101023122',
            RazonSocialComprador: 'Cliente Prueba SRL',
          },
          Emisor: {
            DireccionEmisor: 'DireccionEmisor1',
            FechaEmision: '14-05-2025',
            RNCEmisor: '123',
            RazonSocialEmisor: 'MSeller',
          },
          IdDoc: {
            FechaLimitePago: '07-08-2026',
            IndicadorEnvioDiferido: '1',
            IndicadorMontoGravado: '0',
            TipoIngresos: '05',
            TipoPago: '2',
            TipoeCF: '31',
            TotalPaginas: 1,
            eNCF: 'E310000009175',
            fechavencimientosecuencia: '31-12-2025',
          },
          Totales: {
            ITBIS1: 18,
            MontoExento: 0,
            MontoGravadoI1: 540,
            MontoGravadoTotal: 540,
            MontoNoFacturable: 0,
            MontoTotal: 637.2,
            TotalITBIS: 97.2,
            TotalITBIS1: 97.2,
          },
          Version: '1.0',
        },
        FechaHoraFirma: '15-07-2023 05:07:00',
        Paginacion: {
          Pagina: [
            {
              MontoSubtotalPagina: 637.2,
              NoLineaDesde: 1,
              NoLineaHasta: 1,
              PaginaNo: 1,
              SubtotalExentoPagina: 0,
              SubtotalItbis1Pagina: 97.2,
              SubtotalItbisPagina: 97.2,
              SubtotalMontoGravado1Pagina: 540,
              SubtotalMontoGravadoPagina: 540,
              SubtotalMontoNoFacturablePagina: 0,
            },
          ],
        },
      },
    });
  });
});
