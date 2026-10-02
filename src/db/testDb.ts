import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import schema from './schema';
import Account from './models/Account';
import Category from './models/Category';
import Transaction from './models/Transaction';
import TransferRecord from './models/TransferRecord';
import Budget from './models/Budget';
import RecurringRule from './models/RecurringRule';
import Goal from './models/Goal';
import User from './models/User';

/**
 * DB en memoria para Jest. Nunca importar database.ts (SQLite nativo) en tests.
 * Loki ignora los PRAGMAs/índices SQL: el rendimiento se mide en dispositivo.
 */
export function createTestDatabase(): Database {
  // useIncrementalIndexedDB:false está deprecated en 0.27 pero es lo que
  // garantiza memoria pura en Jest/node. El warning es ruido aceptado.
  const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });
  return new Database({
    adapter,
    modelClasses: [User, Account, Category, Transaction, TransferRecord, Budget, RecurringRule, Goal],
  });
}
