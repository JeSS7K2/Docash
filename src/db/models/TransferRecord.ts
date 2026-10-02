import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

// Fila de pareo de transferencias. El id de esta fila ES el
// transfer_group_id que comparten las dos patas en transactions.
export default class TransferRecord extends Model {
  static table = 'transfers';

  @text('from_tx_id') fromTxId!: string;
  @text('to_tx_id') toTxId!: string;
  @text('from_account_id') fromAccountId!: string;
  @text('to_account_id') toAccountId!: string;
  @field('amount_cents') amountCents!: number;
  @field('fee_cents') feeCents!: number;
}
