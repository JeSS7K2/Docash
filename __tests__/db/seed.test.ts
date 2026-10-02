import { createTestDatabase } from '../../src/db/testDb';
import { DEFAULT_ACCOUNT, SYSTEM_CATEGORIES, seedDatabase } from '../../src/db/seed';
import type { Database } from '@nozbe/watermelondb';
import type Category from '../../src/db/models/Category';

let db: Database;

beforeEach(() => {
  db = createTestDatabase();
});

describe('seedDatabase', () => {
  it('seeds user, cash account and 12 system categories with stable ids', async () => {
    await expect(seedDatabase(db)).resolves.toBe(true);

    const users = await db.get('users').query().fetch();
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe('user_default');

    const accounts = await db.get('accounts').query().fetch();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].id).toBe(DEFAULT_ACCOUNT.id);

    const categories = (await db
      .get<Category>('categories')
      .query()
      .fetch()) as Category[];
    expect(categories).toHaveLength(SYSTEM_CATEGORIES.length);
    expect(new Set(categories.map(c => c.id)).size).toBe(SYSTEM_CATEGORIES.length);
    for (const c of categories) {
      expect(c.isSystem).toBe(true);
    }
    expect(await db.get<Category>('categories').find('cat_food')).toBeDefined();
  });

  it('is idempotent', async () => {
    await seedDatabase(db);
    await expect(seedDatabase(db)).resolves.toBe(false);
    const categories = await db.get('categories').query().fetch();
    expect(categories).toHaveLength(SYSTEM_CATEGORIES.length);
  });
});
