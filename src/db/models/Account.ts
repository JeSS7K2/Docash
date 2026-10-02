import { Model } from '@nozbe/watermelondb';
import { children, field, text } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Transaction from './Transaction';

export default class Account extends Model {
  static table = 'accounts';

  static associations: Associations = {
    transactions: { type: 'has_many', foreignKey: 'account_id' },
  };

  @text('name') name!: string;
  @text('icon') icon!: string;
  @text('currency') currency!: string;
  // Balance inicial en céntimos. El balance vivo se deriva:
  // initial_balance + SUM(amount_signed).
  @field('initial_balance') initialBalance!: number;
  @field('is_archived') isArchived!: boolean;
  @field('sort_order') sortOrder!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @children('transactions') transactions!: Transaction[];
}
