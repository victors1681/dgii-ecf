import {
  getCurrentFormattedDate,
  getCurrentFormattedDateTime,
} from '../getCurrentFormattedDateTime';

describe('getCurrentFormattedDateTime', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats morning hours using the 24-hour clock', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-17T12:15:30.000Z'));

    expect(getCurrentFormattedDateTime()).toBe('17-08-2026 08:15:30');
  });

  it('formats afternoon hours using the 24-hour clock', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-17T17:05:06.000Z'));

    expect(getCurrentFormattedDateTime()).toBe('17-08-2026 13:05:06');
  });

  it('formats midnight as hour 00', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-17T04:05:06.000Z'));

    expect(getCurrentFormattedDateTime()).toBe('17-08-2026 00:05:06');
  });

  it('formats the output in the GMT-4 time zone', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T02:30:45.000Z'));

    expect(getCurrentFormattedDateTime()).toBe('17-08-2026 22:30:45');
  });
});

describe('getCurrentFormattedDate', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats the current date as DD-MM-YYYY', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-17T12:15:30.000Z'));

    expect(getCurrentFormattedDate()).toBe('17-08-2026');
  });

  it('formats the date in GMT-4 when UTC is on the next day', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T02:30:45.000Z'));

    expect(getCurrentFormattedDate()).toBe('17-08-2026');
  });
});
