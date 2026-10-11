export type ReviewMethod = 'reviewed' | 'no_movements';
export type DerivedDayStatus = 'BEFORE_START' | 'CONFIRMED' | 'REST' | 'MISSED' | 'TODAY_PENDING' | 'FUTURE';
export type Continuity = 'NOT_STARTED' | 'ACTIVE' | 'BROKEN';

export interface ReviewLike {
  localDate: string;
  confirmedAtUtc?: number;
  method?: ReviewMethod;
}

export interface DerivedDay {
  localDate: string;
  weekKey: string;
  status: DerivedDayStatus;
  review?: ReviewLike;
}

export interface StreakSummary {
  currentStreak: number;
  bestStreak: number;
  totalReviewedDays: number;
  continuity: Continuity;
  weeklyRestUsed: boolean;
  todayConfirmed: boolean;
}

export interface ReviewClock {
  nowUtc(): number;
  timeZone(): string;
}

export function getReviewDate(nowUtc: number, reviewTimeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: reviewTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(nowUtc));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function parseDate(localDate: string): Date {
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(localDate: string, amount: number): string {
  const date = parseDate(localDate);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDate(date);
}

function weekKey(localDate: string): string {
  const date = parseDate(localDate);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return formatDate(date);
}

export function deriveHistory(
  reviews: ReviewLike[],
  currentDate: string,
  evaluationBoundary = currentDate,
): DerivedDay[] {
  const validReviews = reviews
    .filter(review => review.localDate <= evaluationBoundary)
    .sort((a, b) => a.localDate.localeCompare(b.localDate));
  const firstDate = validReviews[0]?.localDate;
  if (!firstDate || firstDate > currentDate) {
    return [];
  }
  const byDate = new Map(validReviews.map(review => [review.localDate, review]));
  const days: DerivedDay[] = [];
  const restWeeks = new Set<string>();
  let active = false;
  let date = firstDate;
  while (date <= currentDate) {
    const review = byDate.get(date);
    const key = weekKey(date);
    if (review) {
      active = true;
      days.push({ localDate: date, weekKey: key, status: 'CONFIRMED', review });
    } else if (date === currentDate) {
      days.push({ localDate: date, weekKey: key, status: 'TODAY_PENDING' });
    } else if (active && !restWeeks.has(key)) {
      restWeeks.add(key);
      days.push({ localDate: date, weekKey: key, status: 'REST' });
    } else {
      active = false;
      days.push({ localDate: date, weekKey: key, status: 'MISSED' });
    }
    date = addDays(date, 1);
  }
  return days;
}

export function getStreakSummary(history: DerivedDay[], currentDate?: string): StreakSummary {
  let currentStreak = 0;
  let bestStreak = 0;
  let totalReviewedDays = 0;
  let run = 0;
  let lastConfirmedIndex = -1;

  history.forEach((day, index) => {
    if (day.status === 'CONFIRMED') {
      run += 1;
      totalReviewedDays += 1;
      bestStreak = Math.max(bestStreak, run);
      lastConfirmedIndex = index;
    } else if (day.status === 'MISSED') {
      run = 0;
    }
  });
  currentStreak = run;

  const latestDate = currentDate ?? history[history.length - 1]?.localDate;
  const todayConfirmed = Boolean(
    latestDate && history.some(day => day.localDate === latestDate && day.status === 'CONFIRMED'),
  );
  const weeklyRestUsed = Boolean(
    latestDate && history.some(day => day.weekKey === weekKey(latestDate) && day.status === 'REST'),
  );
  const hasMissedAfterLatestReview = history.slice(lastConfirmedIndex + 1).some(day => day.status === 'MISSED');
  const continuity: Continuity = totalReviewedDays === 0
    ? 'NOT_STARTED'
    : hasMissedAfterLatestReview
      ? 'BROKEN'
      : 'ACTIVE';

  return { currentStreak, bestStreak, totalReviewedDays, continuity, weeklyRestUsed, todayConfirmed };
}

export function getWeekCalendar(
  reviews: ReviewLike[],
  currentDate: string,
): DerivedDay[] {
  const start = weekKey(currentDate);
  const end = addDays(start, 6);
  const history = deriveHistory(reviews, currentDate);
  const byDate = new Map(history.map(day => [day.localDate, day]));
  const days: DerivedDay[] = [];
  let date = start;
  while (date <= end) {
    days.push({
      localDate: date,
      weekKey: start,
      status: date > currentDate ? 'FUTURE' : byDate.get(date)?.status ?? 'BEFORE_START',
      review: byDate.get(date)?.review,
    });
    date = addDays(date, 1);
  }
  return days;
}

export function getMilestoneForStreak(streak: number): 'first' | 'three' | 'seven' | 'thirty' | null {
  if (streak >= 30) { return 'thirty'; }
  if (streak >= 7) { return 'seven'; }
  if (streak >= 3) { return 'three'; }
  if (streak >= 1) { return 'first'; }
  return null;
}
