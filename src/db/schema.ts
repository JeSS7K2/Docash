import { appSchema, tableSchema } from '@nozbe/watermelondb';

// Esquema canónico v1. Montos en céntimos (INTEGER), claves de agregación
// desnormalizadas (month_key/date_key) para evitar JOINs en el home.
// Los índices compuestos viven en database.ts (ensurePerformanceSetup).
export const SCHEMA_VERSION = 6;

export default appSchema({
  version: SCHEMA_VERSION,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'base_currency', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'accounts',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'currency', type: 'string' },
        { name: 'initial_balance', type: 'number' },
        { name: 'is_archived', type: 'boolean' },
        { name: 'sort_order', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'kind', type: 'string' },
        { name: 'sort_order', type: 'number' },
        { name: 'is_system', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'account_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'kind', type: 'string' },
        { name: 'amount_cents', type: 'number' },
        { name: 'amount_signed', type: 'number' },
        { name: 'note', type: 'string' },
        { name: 'occurred_on', type: 'number', isIndexed: true },
        { name: 'month_key', type: 'string', isIndexed: true },
        { name: 'date_key', type: 'string', isIndexed: true },
        { name: 'transfer_group_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // Motor de transferencias (UI oculta tras flags.TRANSFERS_UI).
    // El id de Watermelon de cada fila ES el transfer_group_id.
    tableSchema({
      name: 'transfers',
      columns: [
        { name: 'from_tx_id', type: 'string', isIndexed: true },
        { name: 'to_tx_id', type: 'string', isIndexed: true },
        { name: 'from_account_id', type: 'string' },
        { name: 'to_account_id', type: 'string' },
        { name: 'amount_cents', type: 'number' },
        { name: 'fee_cents', type: 'number' },
      ],
    }),
    // Presupuesto por categoría (v2) + periodo configurable (v3).
    tableSchema({
      name: 'budgets',
      columns: [
        { name: 'category_id', type: 'string', isIndexed: true },
        { name: 'amount_cents', type: 'number' },
        { name: 'period', type: 'string', isOptional: true },
        { name: 'interval_days', type: 'number', isOptional: true },
        { name: 'interval_unit', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // Reglas de gasto/ingreso recurrente (v2) + día de calendario (v3) +
    // intervalo personalizado (v5).
    tableSchema({
      name: 'recurring_rules',
      columns: [
        { name: 'account_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string' },
        { name: 'kind', type: 'string' },
        { name: 'amount_cents', type: 'number' },
        { name: 'note', type: 'string' },
        { name: 'frequency', type: 'string' },
        { name: 'schedule_day', type: 'number', isOptional: true },
        { name: 'interval_count', type: 'number', isOptional: true },
        { name: 'interval_unit', type: 'string', isOptional: true },
        { name: 'next_run', type: 'number', isIndexed: true },
        { name: 'active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // Objetivos de ahorro (v6): meta + fecha límite opcional.
    tableSchema({
      name: 'goals',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'target_cents', type: 'number' },
        { name: 'deadline', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
