import type { Database } from '@nozbe/watermelondb';
import type Category from './models/Category';
import type { CategoryKind } from './models/Category';

export interface CreateCategoryInput {
  name: string;
  icon: string;
  kind: CategoryKind;
}

export async function createCategory(
  db: Database,
  input: CreateCategoryInput,
): Promise<Category> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Category name is required');
  }
  const categories = await db.get<Category>('categories').query().fetch();
  const sortOrder = categories.reduce((max, category) => Math.max(max, category.sortOrder), -1) + 1;
  return db.write(() =>
    db.get<Category>('categories').create(category => {
      category.name = name;
      category.icon = input.icon;
      category.color = input.kind === 'expense' ? '#D32F2F' : '#2E7D32';
      category.kind = input.kind;
      category.sortOrder = sortOrder;
      category.isSystem = false;
    }),
  );
}
