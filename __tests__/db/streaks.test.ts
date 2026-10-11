import { createTransaction } from '../../src/db/operations';
import { seedDatabase } from '../../src/db/seed';
import { confirmToday, getStreakState, StreakError, activateStreaks } from '../../src/db/streaks';
import { createTestDatabase } from '../../src/db/testDb';
import type { ReviewClock } from '../../src/streaks/domain';
import type MilestoneUnlock from '../../src/db/models/MilestoneUnlock';

const clock = (now: number): ReviewClock => ({
  nowUtc: () => now,
  timeZone: () => 'UTC',
});

describe('streak persistence', () => {
  it('is idempotent and unlocks the first milestone once', async () => {
    const db = createTestDatabase();
    await seedDatabase(db);
    const time = Date.UTC(2025, 0, 6, 12);
    await activateStreaks(db, clock(time));

    const first = await confirmToday(db, 'reviewed', clock(time));
    const second = await confirmToday(db, 'reviewed', clock(time + 1));
    const reviews = await db.get('daily_reviews').query().fetch();
    const milestones = await db.get<MilestoneUnlock>('milestone_unlocks').query().fetch();

    expect(first.summary.currentStreak).toBe(1);
    expect(second.alreadyConfirmed).toBe(true);
    expect(reviews).toHaveLength(1);
    expect(milestones.map(item => item.milestone)).toEqual(['first']);
  });

  it('rejects no-movement confirmation after a movement appears today', async () => {
    const db = createTestDatabase();
    await seedDatabase(db);
    const time = Date.UTC(2025, 0, 6, 12);
    await activateStreaks(db, clock(time));
    await createTransaction(db, {
      accountId: 'acc_cash',
      categoryId: 'cat_food',
      kind: 'expense',
      amountCents: 1000,
      occurredOn: time,
    });

    try {
      await confirmToday(db, 'no_movements', clock(time));
      fail('Expected the no-movement review to be rejected');
    } catch (error) {
      expect(error).toBeInstanceOf(StreakError);
      expect((error as StreakError).code).toBe('movements_exist');
    }
    expect((await getStreakState(db, clock(time))).summary.totalReviewedDays).toBe(0);
  });
});
