import { isSummaryInvoice, SUMMARY_INVOICE_LIMIT } from '../isSummaryInvoice';

describe('isSummaryInvoice', () => {
  it('is RD$250,000', () => {
    expect(SUMMARY_INVOICE_LIMIT).toBe(250000);
  });

  it.each([
    ['E320000000001', 637.2, true],
    ['E320000000001', 249999.99, true],
    ['E320000000001', '1000.00', true],
    ['e320000000001', 100, true],
    // Exactly RD$250,000 is sent as a full e-CF
    ['E320000000001', 250000, false],
    ['E320000000001', 318600, false],
    ['E310000000001', 100, false],
    ['E340000000001', 100, false],
    ['E320000000001', 'not a number', false],
  ])('%s with total %p -> %p', (encf, total, expected) => {
    expect(isSummaryInvoice(encf, total)).toBe(expected);
  });
});
