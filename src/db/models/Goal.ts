import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class Goal extends Model {
  static table = 'goals';

  @text('name') name!: string;
  @field('target_cents') targetCents!: number;
  /** Fecha límite opcional (ms). null/undefined = indefinido. */
  @field('deadline') deadline?: number;
  /** Si true, el progreso cuenta todo el saldo, no solo el ahorro desde su creación. */
  @field('include_balance') includeBalance?: boolean;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}
