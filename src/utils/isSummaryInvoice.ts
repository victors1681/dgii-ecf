/**
 * Total (`MontoTotal`, RD$) from which an e-CF 32 (Factura de Consumo) must be
 * sent as a full e-CF. Below it, only the RFCE summary is sent to DGII.
 */
export const SUMMARY_INVOICE_LIMIT = 250000;

/**
 * Whether an e-CF is sent to DGII as an RFCE summary: an e-CF 32 with a total
 * below RD$250,000. A total of exactly RD$250,000 is sent as a full e-CF.
 *
 * Use the same rule to route a document (`sendSummary` vs
 * `sendElectronicDocument`) and to check it later (`checkDocumentStatus`), so
 * the two never disagree.
 *
 * @param encf Electronic NCF, e.g. `E320000000001`
 * @param montoTotal Invoice total (`Totales.MontoTotal`)
 */
export const isSummaryInvoice = (
  encf: string,
  montoTotal: number | string
): boolean => {
  const total = Number(montoTotal);
  return (
    /^E32/i.test(encf) &&
    Number.isFinite(total) &&
    total < SUMMARY_INVOICE_LIMIT
  );
};
