import { Q, type Database } from '@nozbe/watermelondb';
import type Goal from './models/Goal';
import type Transaction from './models/Transaction';

export const MAX_GOAL_NAME_LENGTH = 40;

export interface GoalInput {
  name: string;
  targetCents: number;
  /** null = indefinido. */
  deadline?: number | null;
  /** Si true, cuenta el saldo total (no solo lo ahorrado desde su creación). */
  includeBalance?: boolean;
}

function cleanName(name: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    throw new Error('Goal name is required');
  }
  return trimmed.slice(0, MAX_GOAL_NAME_LENGTH);
}

export async function getGoals(db: Database): Promise<Goal[]> {
  return db.get<Goal>('goals').query(Q.sortBy('created_at', Q.desc)).fetch();
}

export async function createGoal(db: Database, input: GoalInput): Promise<Goal> {
  if (!Number.isInteger(input.targetCents) || input.targetCents <= 0) {
    throw new Error(`Goal target must be a positive integer of cents, got: ${input.targetCents}`);
  }
  const now = Date.now();
  return db.write(async () =>
    db.get<Goal>('goals').create(g => {
      g.name = cleanName(input.name);
      g.targetCents = input.targetCents;
      if (input.deadline) {
        g.deadline = input.deadline;
      }
      if (input.includeBalance) {
        g.includeBalance = true;
      }
      g.createdAt = now;
      g.updatedAt = now;
    }),
  );
}

export async function removeGoal(db: Database, id: string): Promise<void> {
  await db.write(async () => {
    const goal = await db.get<Goal>('goals').find(id);
    await goal.destroyPermanently();
  });
}

/** Ahorro neto (ingresos − gastos) hasta el plazo. Con `includeBalance`, desde el inicio de los tiempos (= saldo actual). */
export async function getGoalProgressCents(db: Database, goal: Goal): Promise<number> {
  const from = goal.includeBalance ? 0 : goal.createdAt;
  const to = goal.deadline ?? Date.now();
  const rows = await db
    .get<Transaction>('transactions')
    .query(Q.where('occurred_on', Q.gte(from)), Q.where('occurred_on', Q.lte(to)))
    .fetch();
  return rows.reduce((acc, t) => acc + t.amountSigned, 0);
}
