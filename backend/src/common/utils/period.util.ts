import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isoWeek from 'dayjs/plugin/isoWeek';
import { PeriodType } from '@prisma/client';

dayjs.extend(utc);
dayjs.extend(isoWeek);

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Maximum sensible date-range span per periodType, in days. Guards against e.g. a
// "Weekly" plan accidentally spanning several years. Deliberately generous/simple
// thresholds — documented in the README as a tunable assumption, not a hard business rule.
const MAX_SPAN_DAYS: Record<PeriodType, number> = {
  Weekly: 730, // ~2 years
  Monthly: 1826, // ~5 years
  Quarterly: 7305, // ~20 years
};

export interface PeriodBounds {
  start: Date;
  end: Date;
}

/**
 * Parses a period label ("2024-Jan" | "2024-W01" | "2024-Q1") for the given periodType
 * into inclusive UTC start/end Date bounds. Returns null when the label doesn't match
 * the expected format for that periodType, or refers to a non-existent period (e.g. a
 * week number that doesn't exist in that ISO week-year).
 */
export function getPeriodBounds(periodType: PeriodType, label: string): PeriodBounds | null {
  switch (periodType) {
    case 'Monthly': {
      const match = /^(\d{4})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/.exec(label);
      if (!match) return null;
      const year = Number(match[1]);
      const monthIndex = MONTH_ABBR.indexOf(match[2]);
      const start = dayjs.utc(`${year}-${String(monthIndex + 1).padStart(2, '0')}-01`).startOf('month');
      return { start: start.toDate(), end: start.endOf('month').toDate() };
    }
    case 'Weekly': {
      const match = /^(\d{4})-W(\d{2})$/.exec(label);
      if (!match) return null;
      const year = Number(match[1]);
      const week = Number(match[2]);
      if (week < 1 || week > 53) return null;
      // Jan 4th always falls in ISO week 1 of its ISO week-year; walk forward (week - 1) weeks from there.
      const week1Start = dayjs.utc(`${year}-01-04`).startOf('isoWeek');
      const start = week1Start.add(week - 1, 'week');
      // dayjs clamps out-of-range week numbers into a neighboring week rather than erroring;
      // re-check the round trip so e.g. "W53" in a 52-week year is rejected instead of silently
      // resolving to week 1 of the following year.
      if (start.isoWeekYear() !== year || start.isoWeek() !== week) return null;
      return { start: start.toDate(), end: start.endOf('isoWeek').toDate() };
    }
    case 'Quarterly': {
      const match = /^(\d{4})-Q([1-4])$/.exec(label);
      if (!match) return null;
      const year = Number(match[1]);
      const quarter = Number(match[2]);
      const startMonth = (quarter - 1) * 3;
      const start = dayjs.utc(`${year}-${String(startMonth + 1).padStart(2, '0')}-01`).startOf('month');
      const end = start.add(2, 'month').endOf('month');
      return { start: start.toDate(), end: end.toDate() };
    }
    default:
      return null;
  }
}

/** Returns an error message if [startDate, endDate] is an unreasonable span for periodType, else null. */
export function validatePeriodTypeSpan(periodType: PeriodType, startDate: Date, endDate: Date): string | null {
  const days = dayjs.utc(endDate).diff(dayjs.utc(startDate), 'day');
  const limit = MAX_SPAN_DAYS[periodType];
  if (days >= limit) {
    return `periodType "${periodType}" cannot span ${Math.floor(limit / 365)}+ years (requested range is ${days} days)`;
  }
  return null;
}

/** True if [periodStart, periodEnd] falls fully within [rangeStart, rangeEnd] (inclusive). */
export function isPeriodWithinRange(periodStart: Date, periodEnd: Date, rangeStart: Date, rangeEnd: Date): boolean {
  return periodStart.getTime() >= rangeStart.getTime() && periodEnd.getTime() <= rangeEnd.getTime();
}

/**
 * A plan's endDate is a calendar day ("2024-03-31" means "through the end of March 31st"),
 * but Date parsing of a bare ISO date string yields UTC midnight. Without normalizing to the
 * end of that day, a period ending later that same day (e.g. a Monthly period's
 * 2024-03-31T23:59:59.999Z bound) would incorrectly compare as past the range end.
 */
export function endOfUtcDay(date: Date): Date {
  return dayjs.utc(date).endOf('day').toDate();
}
