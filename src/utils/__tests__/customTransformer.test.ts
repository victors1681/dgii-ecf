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
              subdescuento: [
                {
                  tiposubdescuento: '%',
                  subdescuentoporcentaje: 10.0,
                  montosubdescuento: 60.0,
                },
              ],
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
                SubDescuento: [
                  {
                    MontoSubDescuento: 60,
                    SubDescuentoPorcentaje: 10,
                    TipoSubDescuento: '%',
                  },
                ],
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
            FechaVencimientoSecuencia: '31-12-2025',
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

  it('Transform payload with 7 items - all items should use camelCase', () => {
    // This test verifies the fix for arrays with more items than the reference template
    // Previously, items beyond index 2 would remain lowercase
    const payloadWith7Items = {
      ecf: {
        encabezado: {
          version: '1.0',
          iddoc: {
            tipoecf: 31,
            encf: 'E310000037737',
            fechavencimientosecuencia: '31-12-2026',
            indicadorenviodiferido: 1,
            indicadormontogravado: 0,
            tipoingresos: '01',
            tipopago: 2,
            fechalimitepago: '25-11-2025',
          },
          emisor: {
            rncemisor: '102320705',
            razonsocialemisor: 'Test Company SRL',
            nombrecomercial: 'Test Company SRL',
            direccionemisor: 'Calle Principal 123',
            municipio: '130100',
            provincia: '130000',
            website: 'www.testcompany.com.do',
            codigovendedor: '90000010',
            fechaemision: '25-11-2025',
          },
          comprador: {
            rnccomprador: '04000072423',
            razonsocialcomprador: 'Cliente Test SRL',
            direccioncomprador: 'Avenida Central No. 46',
            fechaentrega: '25-11-2025',
          },
          totales: {
            montogravadototal: 7394.36,
            montogravadoi1: 7394.36,
            montogravadoi2: 0,
            montoexento: 0,
            itbis1: 18,
            totalitbis: 1330.98,
            totalitbis1: 1330.98,
            totalitbis2: 0,
            montototal: 8725.34,
            montonofacturable: 0,
          },
        },
        detallesitems: {
          item: [
            {
              numerolinea: 1,
              indicadorfacturacion: 1,
              nombreitem: 'Product A - 24 Pack',
              indicadorbienoservicio: 1,
              descripcionitem: 'Product A - 24 Pack',
              cantidaditem: 2,
              unidadmedida: 6,
              preciounitarioitem: 794.12,
              descuentomonto: 0,
              tablasubdescuento: {
                subdescuento: [
                  {
                    tiposubdescuento: '%',
                    subdescuentoporcentaje: 18,
                    montosubdescuento: 285.88,
                  },
                ],
              },
              montoitem: 1588.24,
            },
            {
              numerolinea: 2,
              indicadorfacturacion: 1,
              nombreitem: 'Product B - 24 Pack',
              indicadorbienoservicio: 1,
              descripcionitem: 'Product B - 24 Pack',
              cantidaditem: 2,
              unidadmedida: 6,
              preciounitarioitem: 635.81,
              descuentomonto: 0,
              tablasubdescuento: {
                subdescuento: [
                  {
                    tiposubdescuento: '%',
                    subdescuentoporcentaje: 18,
                    montosubdescuento: 228.89,
                  },
                ],
              },
              montoitem: 1271.62,
            },
            {
              numerolinea: 3,
              indicadorfacturacion: 1,
              nombreitem: 'Product C - 8 OZ 24 Units',
              indicadorbienoservicio: 1,
              descripcionitem: 'Product C - 8 OZ 24 Units',
              cantidaditem: 2,
              unidadmedida: 6,
              preciounitarioitem: 476.64,
              descuentomonto: 0,
              tablasubdescuento: {
                subdescuento: [
                  {
                    tiposubdescuento: '%',
                    subdescuentoporcentaje: 18,
                    montosubdescuento: 171.59,
                  },
                ],
              },
              montoitem: 953.28,
            },
            {
              numerolinea: 4,
              indicadorfacturacion: 1,
              nombreitem: 'Product D - 24/8.5',
              indicadorbienoservicio: 1,
              descripcionitem: 'Product D - 24/8.5',
              cantidaditem: 6,
              unidadmedida: 43,
              preciounitarioitem: 210.53,
              descuentomonto: 0,
              tablasubdescuento: {
                subdescuento: [
                  {
                    tiposubdescuento: '%',
                    subdescuentoporcentaje: 18,
                    montosubdescuento: 227.37,
                  },
                ],
              },
              montoitem: 1263.18,
            },
            {
              numerolinea: 5,
              indicadorfacturacion: 1,
              nombreitem: 'Product E - Medium Size',
              indicadorbienoservicio: 1,
              descripcionitem: 'Product E - Medium Size',
              cantidaditem: 2,
              unidadmedida: 6,
              preciounitarioitem: 397.49,
              descuentomonto: 0,
              tablasubdescuento: {
                subdescuento: [
                  {
                    tiposubdescuento: '%',
                    subdescuentoporcentaje: 18,
                    montosubdescuento: 143.1,
                  },
                ],
              },
              montoitem: 794.98,
            },
            {
              numerolinea: 6,
              indicadorfacturacion: 1,
              nombreitem: 'Product F - 12 Pack',
              indicadorbienoservicio: 1,
              descripcionitem: 'Product F - 12 Pack',
              cantidaditem: 1,
              unidadmedida: 6,
              preciounitarioitem: 807.02,
              descuentomonto: 0,
              tablasubdescuento: {
                subdescuento: [
                  {
                    tiposubdescuento: '%',
                    subdescuentoporcentaje: 18,
                    montosubdescuento: 145.26,
                  },
                ],
              },
              montoitem: 807.02,
            },
            {
              numerolinea: 7,
              indicadorfacturacion: 1,
              nombreitem: 'Product G - 540/20',
              indicadorbienoservicio: 1,
              descripcionitem: 'Product G - 540/20',
              cantidaditem: 36,
              unidadmedida: 43,
              preciounitarioitem: 19.89,
              descuentomonto: 0,
              tablasubdescuento: {
                subdescuento: [
                  {
                    tiposubdescuento: '%',
                    subdescuentoporcentaje: 18,
                    montosubdescuento: 128.89,
                  },
                ],
              },
              montoitem: 716.04,
            },
          ],
        },
        fechahorafirma: '25-11-2025 14:42:41',
      },
    };

    const result = transformeLowercasePayloadToCamelcase(payloadWith7Items);

    // Verify all 7 items are properly transformed to camelCase
    expect(result.ECF.DetallesItems.Item).toHaveLength(7);

    // Check that ALL items have camelCase properties (not lowercase)
    result.ECF.DetallesItems.Item.forEach((item: any) => {
      expect(item).toHaveProperty('NumeroLinea');
      expect(item).toHaveProperty('NombreItem');
      expect(item).toHaveProperty('UnidadMedida');
      expect(item).toHaveProperty('IndicadorFacturacion');
      expect(item).toHaveProperty('CantidadItem');
      expect(item).toHaveProperty('PrecioUnitarioItem');

      // Ensure lowercase properties don't exist
      expect(item).not.toHaveProperty('numerolinea');
      expect(item).not.toHaveProperty('nombreitem');
      expect(item).not.toHaveProperty('unidadmedida');
      expect(item).not.toHaveProperty('indicadorfacturacion');
    });

    // Verify specific items (especially items 4-7 which were previously broken)
    expect(result.ECF.DetallesItems.Item[3]).toMatchObject({
      NumeroLinea: 4,
      NombreItem: 'Product D - 24/8.5',
      UnidadMedida: 43,
      CantidadItem: 6,
    });

    expect(result.ECF.DetallesItems.Item[6]).toMatchObject({
      NumeroLinea: 7,
      NombreItem: 'Product G - 540/20',
      UnidadMedida: 43,
      CantidadItem: 36,
    });

    // Verify nested arrays are also properly transformed
    result.ECF.DetallesItems.Item.forEach((item: any) => {
      expect(item.TablaSubDescuento.SubDescuento[0]).toHaveProperty(
        'TipoSubDescuento'
      );
      expect(item.TablaSubDescuento.SubDescuento[0]).toHaveProperty(
        'SubDescuentoPorcentaje'
      );
      expect(item.TablaSubDescuento.SubDescuento[0]).toHaveProperty(
        'MontoSubDescuento'
      );
    });
  });
});
