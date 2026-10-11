import { Q, type Database } from '@nozbe/watermelondb';
import type Transaction from './models/Transaction';
import DailyReview from './models/DailyReview';
import MilestoneUnlock, { type Milestone } from './models/MilestoneUnlock';
import StreakSettings from './models/StreakSettings';
import {
  deriveHistory,
  deviceTimeZone,
  getMilestoneForStreak,
  getReviewDate,
  getStreakSummary,
  getWeekCalendar,
  type DerivedDay,
  type ReviewClock,
  type ReviewLike,
  type ReviewMethod,
  type StreakSummary,
} from '../streaks/domain';

export const STREAK_SETTINGS_ID = 'streak-settings-default';
const MILESTONES: Array<{ key: Milestone; threshold: number }> = [
  { key: 'first', threshold: 1 },
  { key: 'three', threshold: 3 },
  { key: 'seven', threshold: 7 },
  { key: 'thirty', threshold: 30 },
];

export const systemClock: ReviewClock = {
  nowUtc: () => Date.now(),
  timeZone: deviceTimeZone,
};

export interface StreakState {
  settings: StreakSettings;
  reviews: DailyReview[];
  history: DerivedDay[];
  week: DerivedDay[];
  summary: StreakSummary;
  currentDate: string;
  clockRewound: boolean;
}

export interface ConfirmReviewResult {
  summary: StreakSummary;
  alreadyConfirmed: boolean;
  newMilestones: Milestone[];
  clockRewound: boolean;
}

export class StreakError extends Error {
  constructor(public readonly code: 'disabled' | 'movements_exist' | 'clock_rewound') {
    super(code);
  }
}

export async function getOrCreateStreakSettings(
  db: Database,
  clock: ReviewClock = systemClock,
): Promise<StreakSettings> {
  const existing = await db.get<StreakSettings>('streak_settings').query(Q.take(1)).fetch();
  if (existing[0]) {
    return existing[0];
  }
  const now = clock.nowUtc();
  const zone = clock.timeZone();
  try {
    return await db.write(() =>
      db.get<StreakSettings>('streak_settings').create(settings => {
        settings._raw.id = STREAK_SETTINGS_ID;
        settings.enabled = false;
        settings.reviewTimeZone = zone;
        settings.activatedAtUtc = 0;
        settings.showHomeCard = true;
        settings.celebrationsEnabled = true;
        settings.reminderEnabled = false;
        settings.schemaVersion = 1;
        settings.lastObservedAtUtc = now;
      }),
    );
  } catch (error) {
    const afterRace = await db.get<StreakSettings>('streak_settings').query(Q.take(1)).fetch();
    if (afterRace[0]) {
      return afterRace[0];
    }
    throw error;
  }
}

export async function activateStreaks(
  db: Database,
  clock: ReviewClock = systemClock,
): Promise<StreakSettings> {
  const existing = await getOrCreateStreakSettings(db, clock);
  const now = clock.nowUtc();
  return db.write(() =>
    existing.update(settings => {
      settings.enabled = true;
      settings.reviewTimeZone = settings.reviewTimeZone || clock.timeZone();
      settings.activatedAtUtc = settings.activatedAtUtc || now;
      settings.showHomeCard = true;
      settings.lastObservedAtUtc = Math.max(settings.lastObservedAtUtc ?? 0, now);
    }),
  );
}

export async function updateStreakSettings(
  db: Database,
  changes: Partial<Pick<StreakSettings, 'enabled' | 'showHomeCard' | 'celebrationsEnabled' | 'reminderEnabled' | 'reminderLocalTime'>>,
  clock: ReviewClock = systemClock,
): Promise<StreakSettings> {
  const settings = await getOrCreateStreakSettings(db, clock);
  return db.write(() => settings.update(current => Object.assign(current, changes)));
}

export async function getDailyReviews(db: Database): Promise<DailyReview[]> {
  return db.get<DailyReview>('daily_reviews').query(Q.sortBy('local_date', Q.asc)).fetch();
}

export async function getStreakState(
  db: Database,
  clock: ReviewClock = systemClock,
): Promise<StreakState> {
  const settings = await getOrCreateStreakSettings(db, clock);
  const now = clock.nowUtc();
  const clockRewound = Boolean(settings.lastObservedAtUtc && now < settings.lastObservedAtUtc);
  const currentDate = getReviewDate(now, settings.reviewTimeZone);
  if (!clockRewound && (!settings.lastObservedAtUtc || settings.lastEvaluatedLocalDate !== currentDate)) {
    await db.write(() => settings.update(current => {
      current.lastObservedAtUtc = now;
      current.lastEvaluatedLocalDate = currentDate;
    }));
  }
  const reviews = await getDailyReviews(db);
  const reviewLikes: ReviewLike[] = reviews.map(review => review);
  const history = deriveHistory(reviewLikes, currentDate);
  return {
    settings,
    reviews,
    history,
    week: getWeekCalendar(reviewLikes, currentDate),
    summary: getStreakSummary(history, currentDate),
    currentDate,
    clockRewound,
  };
}

export async function getTodayTransactions(
  db: Database,
  reviewTimeZone: string,
  nowUtc: number,
): Promise<Transaction[]> {
  const currentDate = getReviewDate(nowUtc, reviewTimeZone);
  const transactions = await db.get<Transaction>('transactions').query().fetch();
  return transactions.filter(transaction => getReviewDate(transaction.occurredOn, reviewTimeZone) === currentDate);
}

export async function confirmToday(
  db: Database,
  method: ReviewMethod,
  clock: ReviewClock = systemClock,
): Promise<ConfirmReviewResult> {
  const settings = await getOrCreateStreakSettings(db, clock);
  if (!settings.enabled) {
    throw new StreakError('disabled');
  }
  if (method !== 'reviewed' && method !== 'no_movements') {
    throw new Error(`Unsupported review method: ${method}`);
  }
  const now = clock.nowUtc();
  if (settings.lastObservedAtUtc && now < settings.lastObservedAtUtc) {
    throw new StreakError('clock_rewound');
  }
  const currentDate = getReviewDate(now, settings.reviewTimeZone);

  return db.write(async () => {
    const reviews = await db.get<DailyReview>('daily_reviews').query(Q.sortBy('local_date', Q.asc)).fetch();
    const existing = reviews.find(review => review.localDate === currentDate);
    const todayTransactions = await getTodayTransactions(db, settings.reviewTimeZone, now);
    if (method === 'no_movements' && todayTransactions.length > 0 && !existing) {
      throw new StreakError('movements_exist');
    }

    if (!existing) {
      const revision = todayTransactions.reduce(
        (latest, transaction) => Math.max(latest, transaction.updatedAt, transaction.createdAt),
        0,
      );
      await db.get<DailyReview>('daily_reviews').create(review => {
        review._raw.id = `daily-review-${currentDate}`;
        review.localDate = currentDate;
        review.confirmedAtUtc = now;
        review.timezoneAtConfirmation = settings.reviewTimeZone;
        review.method = method;
        review.financialRevisionAtConfirmation = revision || undefined;
      });
      reviews.push((await db.get<DailyReview>('daily_reviews').find(`daily-review-${currentDate}`)));
    }

    const history = deriveHistory(reviews, currentDate);
    const summary = getStreakSummary(history, currentDate);
    const unlocked = await db.get<MilestoneUnlock>('milestone_unlocks').query().fetch();
    const newMilestones: Milestone[] = [];
    for (const milestone of MILESTONES) {
      if (summary.currentStreak >= milestone.threshold && !unlocked.some(item => item.milestone === milestone.key)) {
        await db.get<MilestoneUnlock>('milestone_unlocks').create(item => {
          item._raw.id = `milestone-${milestone.key}`;
          item.milestone = milestone.key;
          item.unlockedAtUtc = now;
        });
        newMilestones.push(milestone.key);
      }
    }
    await settings.update(current => {
      current.lastEvaluatedLocalDate = currentDate;
      current.lastObservedAtUtc = now;
    });
    return {
      summary,
      alreadyConfirmed: Boolean(existing),
      newMilestones,
      clockRewound: false,
    };
  });
}

export function milestoneLabel(streak: number): Milestone | null {
  return getMilestoneForStreak(streak);
}
