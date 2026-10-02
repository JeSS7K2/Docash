import {
  schemaMigrations,
  addColumns,
  createTable,
  unsafeExecuteSql,
} from '@nozbe/watermelondb/Schema/migrations';

// v1: baseline (instalación limpia).
// v2: budgets + recurring_rules.
// v3: budgets.period/interval_days + recurring_rules.schedule_day.
//
// Los índices compuestos (no soportados por el builder) se crean idempotente
// en cada arranque (ver database.ts).
export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'budgets',
          columns: [
            { name: 'category_id', type: 'string', isIndexed: true },
            { name: 'amount_cents', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'recurring_rules',
          columns: [
            { name: 'account_id', type: 'string', isIndexed: true },
            { name: 'category_id', type: 'string' },
            { name: 'kind', type: 'string' },
            { name: 'amount_cents', type: 'number' },
            { name: 'note', type: 'string' },
            { name: 'frequency', type: 'string' },
            { name: 'next_run', type: 'number', isIndexed: true },
            { name: 'active', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'budgets',
          columns: [
            { name: 'period', type: 'string', isOptional: true },
            { name: 'interval_days', type: 'number', isOptional: true },
          ],
        }),
        addColumns({
          table: 'recurring_rules',
          columns: [{ name: 'schedule_day', type: 'number', isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        // Categoría "Otros" de ingresos retirada del producto.
        unsafeExecuteSql("DELETE FROM categories WHERE id = 'cat_other_inc';"),
      ],
    },
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: 'recurring_rules',
          columns: [
            { name: 'interval_count', type: 'number', isOptional: true },
            { name: 'interval_unit', type: 'string', isOptional: true },
          ],
        }),
        addColumns({
          table: 'budgets',
          columns: [{ name: 'interval_unit', type: 'string', isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        createTable({
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
    },
  ],
});
