import { Model } from '@nozbe/watermelondb';
import { children, field, text } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Transaction from './Transaction';

export type CategoryKind = 'expense' | 'income';

export default class Category extends Model {
  static table = 'categories';

  static associations: Associations = {
    transactions: { type: 'has_many', foreignKey: 'category_id' },
  };

  @text('name') name!: string;
  @text('icon') icon!: string;
  @text('color') color!: string;
  @text('kind') kind!: CategoryKind;
  @field('sort_order') sortOrder!: number;
  @field('is_system') isSystem!: boolean;

  @children('transactions') transactions!: Transaction[];
}
