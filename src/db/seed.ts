import type { Database, Model } from '@nozbe/watermelondb';
import { BASE_CURRENCY } from '../utils/currency';
import Account from './models/Account';
import Category, { type CategoryKind } from './models/Category';
import User from './models/User';

export interface SeedCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: CategoryKind;
  sortOrder: number;
}

// 12 categorías sistema, paridad Monefy. is_system=1: no borrables.
export const SYSTEM_CATEGORIES: SeedCategory[] = [
  { id: 'cat_food', name: 'Food', icon: '🍔', color: '#FF7043', kind: 'expense', sortOrder: 0 },
  { id: 'cat_transport', name: 'Transport', icon: '🚌', color: '#29B6F6', kind: 'expense', sortOrder: 1 },
  { id: 'cat_home', name: 'Home', icon: '🏠', color: '#AB47BC', kind: 'expense', sortOrder: 2 },
  { id: 'cat_fun', name: 'Entertainment', icon: '🎮', color: '#EC407A', kind: 'expense', sortOrder: 3 },
  { id: 'cat_health', name: 'Health', icon: '💊', color: '#66BB6A', kind: 'expense', sortOrder: 4 },
  { id: 'cat_clothes', name: 'Clothes', icon: '👕', color: '#FFA726', kind: 'expense', sortOrder: 5 },
  { id: 'cat_bills', name: 'Bills', icon: '💡', color: '#78909C', kind: 'expense', sortOrder: 6 },
  { id: 'cat_edu', name: 'Education', icon: '📚', color: '#5C6BC0', kind: 'expense', sortOrder: 7 },
  { id: 'cat_other_exp', name: 'Other', icon: '⋯', color: '#BDBDBD', kind: 'expense', sortOrder: 8 },
  { id: 'cat_salary', name: 'Salary', icon: '💼', color: '#26A69A', kind: 'income', sortOrder: 9 },
  { id: 'cat_extra', name: 'Extra', icon: '💵', color: '#9CCC65', kind: 'income', sortOrder: 10 },
];

export const DEFAULT_ACCOUNT = {
  id: 'acc_cash',
  name: 'Cash',
  icon: '💵',
  currency: BASE_CURRENCY,
  initialBalance: 0,
} as const;

/** Fija un id Watermelon determinista (necesario para categorías sistema). */
function withId<T extends Model>(record: T, id: string): T {
  (record as unknown as { _raw: { id: string } })._raw.id = id;
  return record;
}

/**
 * Siembra usuario + cuenta Cash + 12 categorías. Idempotente: si ya hay
 * categorías, no hace nada. Retorna true si sembró.
 */
export async function seedDatabase(db: Database): Promise<boolean> {
  const existing = await db.get<Category>('categories').query().fetchCount();
  if (existing > 0) {
    return false;
  }
  const now = Date.now();
  await db.write(async () => {
    await db.batch(
      withId(
        db.get<User>('users').prepareCreate(u => {
          u.baseCurrency = BASE_CURRENCY;
          u.createdAt = now;
        }),
        'user_default',
      ),
      withId(
        db.get<Account>('accounts').prepareCreate(a => {
          a.name = DEFAULT_ACCOUNT.name;
          a.icon = DEFAULT_ACCOUNT.icon;
          a.currency = DEFAULT_ACCOUNT.currency;
          a.initialBalance = DEFAULT_ACCOUNT.initialBalance;
          a.isArchived = false;
          a.sortOrder = 0;
          a.createdAt = now;
          a.updatedAt = now;
        }),
        DEFAULT_ACCOUNT.id,
      ),
      ...SYSTEM_CATEGORIES.map(c =>
        withId(
          db.get<Category>('categories').prepareCreate(r => {
            r.name = c.name;
            r.icon = c.icon;
            r.color = c.color;
            r.kind = c.kind;
            r.sortOrder = c.sortOrder;
            r.isSystem = true;
          }),
          c.id,
        ),
      ),
    );
  });
  return true;
}
