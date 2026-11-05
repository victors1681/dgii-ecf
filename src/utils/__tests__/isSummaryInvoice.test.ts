import {
  isSummaryInvoice,
  parseMontoTotal,
  SUMMARY_INVOICE_LIMIT,
} from '../isSummaryInvoice';

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
    // Unusable totals are never a summary (Number('') would be 0)
    ['E320000000001', 'not a number', false],
    ['E320000000001', 'N/A', false],
    ['E320000000001', '', false],
    ['E320000000001', '   ', false],
    ['E320000000001', null, false],
    ['E320000000001', undefined, false],
    ['E320000000001', NaN, false],
    ['E320000000001', -Infinity, false],
  ])('%s with total %p -> %p', (encf, total, expected) => {
    expect(isSummaryInvoice(encf, total)).toBe(expected);
  });
});

describe('parseMontoTotal', () => {
  it.each([
    [637.2, 637.2],
    [0, 0],
    ['318600.00', 318600],
    [' 1000 ', 1000],
    ['', undefined],
    ['   ', undefined],
    ['N/A', undefined],
    [null, undefined],
    [undefined, undefined],
    [NaN, undefined],
    [Infinity, undefined],
  ])('%p -> %p', (input, expected) => {
    expect(parseMontoTotal(input)).toBe(expected);
  });
});
