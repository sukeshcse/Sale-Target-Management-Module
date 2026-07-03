import { getPeriodBounds, isPeriodWithinRange, validatePeriodTypeSpan } from './period.util';

describe('period.util', () => {
  describe('getPeriodBounds', () => {
    it('parses a Monthly label into calendar month bounds', () => {
      const bounds = getPeriodBounds('Monthly', '2024-Jan');
      expect(bounds).not.toBeNull();
      expect(bounds!.start.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(bounds!.end.toISOString()).toBe('2024-01-31T23:59:59.999Z');
    });

    it('parses a Weekly label into an ISO week', () => {
      const bounds = getPeriodBounds('Weekly', '2024-W01');
      expect(bounds).not.toBeNull();
      // ISO week 1 of 2024 starts Monday 2024-01-01.
      expect(bounds!.start.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(bounds!.end.toISOString()).toBe('2024-01-07T23:59:59.999Z');
    });

    it('rejects a Weekly label whose week number does not exist in that ISO week-year', () => {
      expect(getPeriodBounds('Weekly', '2025-W53')).toBeNull();
    });

    it('parses a Quarterly label into a 3-month span', () => {
      const bounds = getPeriodBounds('Quarterly', '2024-Q2');
      expect(bounds).not.toBeNull();
      expect(bounds!.start.toISOString()).toBe('2024-04-01T00:00:00.000Z');
      expect(bounds!.end.toISOString()).toBe('2024-06-30T23:59:59.999Z');
    });

    it('returns null for a malformed label', () => {
      expect(getPeriodBounds('Monthly', '2024-13')).toBeNull();
      expect(getPeriodBounds('Monthly', 'not-a-period')).toBeNull();
    });
  });

  describe('validatePeriodTypeSpan', () => {
    it('flags a Weekly plan spanning 2+ years', () => {
      const error = validatePeriodTypeSpan('Weekly', new Date('2020-01-01'), new Date('2024-01-01'));
      expect(error).toMatch(/cannot span/);
    });

    it('allows a Weekly plan spanning a single quarter', () => {
      expect(validatePeriodTypeSpan('Weekly', new Date('2024-01-01'), new Date('2024-03-31'))).toBeNull();
    });
  });

  describe('isPeriodWithinRange', () => {
    it('accepts a period fully inside the range', () => {
      expect(
        isPeriodWithinRange(new Date('2024-02-01'), new Date('2024-02-29'), new Date('2024-01-01'), new Date('2024-03-31')),
      ).toBe(true);
    });

    it('rejects a period that extends past the range end', () => {
      expect(
        isPeriodWithinRange(new Date('2024-03-01'), new Date('2024-04-30'), new Date('2024-01-01'), new Date('2024-03-31')),
      ).toBe(false);
    });
  });
});
