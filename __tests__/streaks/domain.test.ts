import {
  deriveHistory,
  getReviewDate,
  getStreakSummary,
  getWeekCalendar,
  type ReviewLike,
} from '../../src/streaks/domain';

const review = (localDate: string): ReviewLike => ({ localDate });
const status = (reviews: ReviewLike[], currentDate: string) =>
  deriveHistory(reviews, currentDate).map(day => `${day.localDate}:${day.status}`);

describe('streak domain', () => {
  it('uses the configured timezone for the review date', () => {
    expect(getReviewDate(Date.UTC(2026, 9, 11, 2), 'America/La_Paz')).toBe('2026-10-10');
  });

  it('applies one rest day, then breaks on the second omission', () => {
    const reviews = [review('2025-01-06'), review('2025-01-07'), review('2025-01-09')];
    expect(status(reviews, '2025-01-08')).toEqual([
      '2025-01-06:CONFIRMED',
      '2025-01-07:CONFIRMED',
      '2025-01-08:TODAY_PENDING',
    ]);
    expect(status(reviews, '2025-01-10')).toEqual([
      '2025-01-06:CONFIRMED',
      '2025-01-07:CONFIRMED',
      '2025-01-08:REST',
      '2025-01-09:CONFIRMED',
      '2025-01-10:TODAY_PENDING',
    ]);
    expect(getStreakSummary(deriveHistory(reviews, '2025-01-11'), '2025-01-11')).toMatchObject({
      currentStreak: 0,
      bestStreak: 3,
      continuity: 'BROKEN',
    });
  });

  it('allows consecutive rests across different weeks and starts the next streak at one', () => {
    const reviews = [review('2025-01-11'), review('2025-01-14')];
    const history = deriveHistory(reviews, '2025-01-14');
    expect(history.filter(day => day.status === 'REST').map(day => day.localDate)).toEqual([
      '2025-01-12',
      '2025-01-13',
    ]);
    expect(getStreakSummary(history, '2025-01-14')).toMatchObject({ currentStreak: 2, bestStreak: 2 });
  });

  it('keeps an active streak while today is pending', () => {
    const history = deriveHistory([review('2025-01-06')], '2025-01-07');
    expect(getStreakSummary(history, '2025-01-07')).toMatchObject({
      currentStreak: 1,
      todayConfirmed: false,
      continuity: 'ACTIVE',
    });
  });

  it('does not mark future week days as missed', () => {
    expect(getWeekCalendar([review('2025-01-06')], '2025-01-07').slice(-5).every(day => day.status === 'FUTURE')).toBe(true);
  });
});
