import { Model } from '@nozbe/watermelondb';
import { field, relation, text } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Account from './Account';
import type Category from './Category';

export type TransactionKind = 'expense' | 'income' | 'transfer';

export default class Transaction extends Model {
  static table = 'transactions';

  static associations: Associations = {
    accounts: { type: 'belongs_to', key: 'account_id' },
    categories: { type: 'belongs_to', key: 'category_id' },
  };

  @text('account_id') accountId!: string;
  @text('category_id') categoryId?: string;
  @text('kind') kind!: TransactionKind;
  @field('amount_cents') amountCents!: number;
  // Signado para agregación directa: gasto -x, ingreso +x, pata de
  // transferencia -x (origen) / +x (destino).
  @field('amount_signed') amountSigned!: number;
  @text('note') note!: string;
  @field('occurred_on') occurredOn!: number;
  @text('month_key') monthKey!: string;
  @text('date_key') dateKey!: string;
  @text('transfer_group_id') transferGroupId?: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  @relation('accounts', 'account_id') account!: Account;
  @relation('categories', 'category_id') category!: Category;
}
