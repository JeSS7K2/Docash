import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import migrations from './migrations';
import User from './models/User';
import Account from './models/Account';
import Category from './models/Category';
import Transaction from './models/Transaction';
import TransferRecord from './models/TransferRecord';
import Budget from './models/Budget';
import RecurringRule from './models/RecurringRule';
import Goal from './models/Goal';
import StreakSettings from './models/StreakSettings';
import DailyReview from './models/DailyReview';
import MilestoneUnlock from './models/MilestoneUnlock';

const adapter = new SQLiteAdapter({
  dbName: 'docash',
  schema,
  migrations,
  // JSI síncrono: lecturas/escrituras sin pasar por el bridge. Requisito
  // para el presupuesto de <5ms y cero ANR.
  jsi: true,
  onSetUpError: error => {
    // Nunca crashear por aquí: ofrecer reload al usuario desde la UI.
    console.error('[db] setup failed', error);
  },
});

// Singleton. Prohibido instanciar Database en componentes.
export const database = new Database({
  adapter,
  modelClasses: [User, Account, Category, Transaction, TransferRecord, Budget, RecurringRule, Goal, StreakSettings, DailyReview, MilestoneUnlock],
});

export type AppDatabase = typeof database;

// SQLite no soporta índices compuestos en el schema builder de Watermelon,
// así que se crean aquí de forma idempotente. Los CREATE INDEX no devuelven
// filas, por lo que funcionan igual en modo JSI y async.
const INDEX_SQL: Array<[string, Array<string | boolean | number | null>]> = [
  [
    'CREATE INDEX IF NOT EXISTS idx_tx_month_account ON transactions(month_key, account_id, kind)',
    [],
  ],
  [
    'CREATE INDEX IF NOT EXISTS idx_tx_month_category ON transactions(month_key, category_id)',
    [],
  ],
  [
    'CREATE INDEX IF NOT EXISTS idx_tx_account_occurred ON transactions(account_id, occurred_on)',
    [],
  ],
  [
    'CREATE INDEX IF NOT EXISTS idx_tx_transfer_group ON transactions(transfer_group_id) WHERE transfer_group_id IS NOT NULL',
    [],
  ],
];

// WatermelonDB JSI ya abre la BD en WAL (desde 0.23), así que no hace falta
// tocar journal_mode/synchronous. Los CREATE INDEX no devuelven filas y
// funcionan tanto en modo JSI como async.
export async function ensurePerformanceSetup(db: Database = database): Promise<void> {
  try {
    await db.adapter.unsafeExecute({ sqls: INDEX_SQL });
  } catch (error) {
    console.warn('[db] index setup skipped', error);
  }
}
