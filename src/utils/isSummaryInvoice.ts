/**
 * Total (`MontoTotal`, RD$) from which an e-CF 32 (Factura de Consumo) must be
 * sent as a full e-CF. Below it, only the RFCE summary is sent to DGII.
 */
export const SUMMARY_INVOICE_LIMIT = 250000;

/**
 * Reads an invoice total (`Totales.MontoTotal`) as a number.
 *
 * `Number()` alone is not enough: it turns `''`, `' '` and `null` into `0`,
 * which would make any e-CF 32 look like a summary.
 *
 * @returns The total, or `undefined` when it is missing, blank, not numeric
 * or not finite
 */
export const parseMontoTotal = (
  montoTotal: number | string | null | undefined
): number | undefined => {
  if (typeof montoTotal === 'number') {
    return Number.isFinite(montoTotal) ? montoTotal : undefined;
  }
  if (typeof montoTotal !== 'string' || montoTotal.trim() === '') {
    return undefined;
  }
  const total = Number(montoTotal.trim());
  return Number.isFinite(total) ? total : undefined;
};

/**
 * Whether an e-CF is sent to DGII as an RFCE summary: an e-CF 32 with a total
 * below RD$250,000. A total of exactly RD$250,000 is sent as a full e-CF.
 *
 * Use the same rule to route a document (`sendSummary` vs
 * `sendElectronicDocument`) and to check it later (`checkDocumentStatus`), so
 * the two never disagree. A missing, blank or non-numeric total is never a
 * summary.
 *
 * @param encf Electronic NCF, e.g. `E320000000001`
 * @param montoTotal Invoice total (`Totales.MontoTotal`)
 */
export const isSummaryInvoice = (
  encf: string,
  montoTotal: number | string | null | undefined
): boolean => {
  const total = parseMontoTotal(montoTotal);
  return (
    /^E32/i.test(encf) && total !== undefined && total < SUMMARY_INVOICE_LIMIT
  );
};
