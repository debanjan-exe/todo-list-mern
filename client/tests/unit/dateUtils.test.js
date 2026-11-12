// Unit tests for the week logic (weeks start on Monday and end on Sunday).
import { describe, it, expect } from 'vitest';
import {
  startOfWeek, getWeekDays, isSameDay, isInWeek, groupTasksByWeek,
  formatTimeText, toDateInput, toTimeInput, formatWeekRange,
} from '../../src/utils/dateUtils';

// Local dates (month is 0-based): 12 Nov 2026 is a Thursday
const thu = new Date(2026, 10, 12, 15, 30);
const sun = new Date(2026, 10, 15, 23, 59);
const mon = new Date(2026, 10, 9, 0, 0);

describe('startOfWeek', () => {
  it('goes back to Monday 00:00', () => {
    const start = startOfWeek(thu);
    expect(start.getDay()).toBe(1); // Monday
    expect(start.getDate()).toBe(9);
    expect(start.getHours()).toBe(0);
  });

  it('treats Sunday as the END of the week, not the start', () => {
    expect(startOfWeek(sun).getDate()).toBe(9);
  });

  it('keeps a Monday as it is', () => {
    expect(startOfWeek(mon).getDate()).toBe(9);
  });
});

describe('getWeekDays', () => {
  it('gives 7 days, Monday to Sunday', () => {
    const days = getWeekDays(thu);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.getDate())).toEqual([9, 10, 11, 12, 13, 14, 15]);
  });
});

describe('isSameDay / isInWeek', () => {
  it('compares the day only, not the time', () => {
    expect(isSameDay(new Date(2026, 10, 12, 1), new Date(2026, 10, 12, 23))).toBe(true);
    expect(isSameDay(thu, sun)).toBe(false);
  });

  it('knows Sunday and Monday of the next week are in different weeks', () => {
    expect(isInWeek(sun, thu)).toBe(true);
    expect(isInWeek(new Date(2026, 10, 16), thu)).toBe(false);
  });
});

describe('groupTasksByWeek', () => {
  const tasks = [
    { _id: '1', dateTime: new Date(2026, 10, 10).toISOString(), status: 'Completed' },
    { _id: '2', dateTime: new Date(2026, 10, 15).toISOString(), status: 'In Progress' },
    { _id: '3', dateTime: new Date(2026, 10, 3).toISOString(), status: 'In Progress' },
  ];

  it('makes one group per week, newest week first', () => {
    const weeks = groupTasksByWeek(tasks);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].weekStart.getDate()).toBe(9);
    expect(weeks[1].weekStart.getDate()).toBe(2);
  });

  it('counts open and completed tasks in each week', () => {
    const [thisWeek, lastWeek] = groupTasksByWeek(tasks);
    expect(thisWeek).toMatchObject({ open: 1, completed: 1 });
    expect(lastWeek).toMatchObject({ open: 1, completed: 0 });
  });

  it('gives an empty list for no tasks', () => {
    expect(groupTasksByWeek([])).toEqual([]);
  });
});

describe('formatting', () => {
  it('turns "14:30" into "02:30 PM"', () => {
    expect(formatTimeText('14:30')).toBe('02:30 PM');
    expect(formatTimeText('')).toBe('');
  });

  it('makes values for date and time inputs', () => {
    expect(toDateInput(thu)).toBe('2026-11-12');
    expect(toTimeInput(thu)).toBe('15:30');
  });

  it('shows a week range like "9 Nov - 15 Nov"', () => {
    expect(formatWeekRange(startOfWeek(thu))).toBe('9 Nov - 15 Nov');
  });
});
