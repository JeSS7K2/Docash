import type { Database } from '@nozbe/watermelondb';
import type { Model } from '@nozbe/watermelondb';
import type { DirtyRaw } from '@nozbe/watermelondb/RawRecord';

export interface BackupFile {
  app: 'docash';
  version: 2;
  exportedAt: number;
  accounts: DirtyRaw[];
  categories: DirtyRaw[];
  transactions: DirtyRaw[];
  transfers: DirtyRaw[];
  streak_settings: DirtyRaw[];
  daily_reviews: DirtyRaw[];
  milestone_unlocks: DirtyRaw[];
}

export interface ImportCounts {
  accounts: number;
  categories: number;
  transactions: number;
  transfers: number;
  streak_settings: number;
  daily_reviews: number;
  milestone_unlocks: number;
}

const TABLES = [
  'accounts',
  'categories',
  'transactions',
  'transfers',
  'streak_settings',
  'daily_reviews',
  'milestone_unlocks',
] as const;
type TableName = (typeof TABLES)[number];

export async function exportData(db: Database): Promise<string> {
  const [accounts, categories, transactions, transfers, streakSettings, dailyReviews, milestones] = await Promise.all([
    db.get('accounts').query().fetch(),
    db.get('categories').query().fetch(),
    db.get('transactions').query().fetch(),
    db.get('transfers').query().fetch(),
    db.get('streak_settings').query().fetch(),
    db.get('daily_reviews').query().fetch(),
    db.get('milestone_unlocks').query().fetch(),
  ]);
  const dump: BackupFile = {
    app: 'docash',
    version: 2,
    exportedAt: Date.now(),
    accounts: accounts.map(r => r._raw),
    categories: categories.map(r => r._raw),
    transactions: transactions.map(r => r._raw),
    transfers: transfers.map(r => r._raw),
    streak_settings: streakSettings.map(r => r._raw),
    daily_reviews: dailyReviews.map(r => r._raw),
    milestone_unlocks: milestones.map(r => r._raw),
  };
  return JSON.stringify(dump);
}

/** Quita metadatos de sync para que prepareCreateFromDirtyRaw cree limpio. */
function stripMeta(raw: DirtyRaw): DirtyRaw {
  const clone = { ...(raw as Record<string, unknown>) };
  delete clone._status;
  delete clone._changed;
  return clone as DirtyRaw;
}

/**
 * Importa un backup JSON. Fusiona por id (ignora los que ya existen), en un
 * único writer. Lanza si el formato no es válido.
 */
export async function importData(db: Database, json: string): Promise<ImportCounts> {
  let dump: BackupFile;
  try {
    dump = JSON.parse(json);
  } catch {
    throw new Error('Invalid backup JSON');
  }
  if (!dump || dump.app !== 'docash' || !Array.isArray(dump.transactions)) {
    throw new Error('Invalid backup format');
  }

  const counts: ImportCounts = {
    accounts: 0,
    categories: 0,
    transactions: 0,
    transfers: 0,
    streak_settings: 0,
    daily_reviews: 0,
    milestone_unlocks: 0,
  };

  await db.write(async () => {
    const operations: Model[] = [];
    for (const table of TABLES) {
      const rows = (dump[table] ?? []) as DirtyRaw[];
      if (rows.length === 0) {
        continue;
      }
      const collection = db.get(table as TableName);
      const existing = new Set(await collection.query().fetchIds());
      for (const raw of rows) {
        const id = (raw as { id?: string }).id;
        if (!id || existing.has(id)) {
          continue;
        }
        operations.push(collection.prepareCreateFromDirtyRaw(stripMeta(raw)));
        counts[table] += 1;
      }
    }
    await db.batch(operations);
  });

  return counts;
}
