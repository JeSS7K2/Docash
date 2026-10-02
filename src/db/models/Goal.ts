import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class Goal extends Model {
  static table = 'goals';

  @text('name') name!: string;
  @field('target_cents') targetCents!: number;
  /** Fecha límite opcional (ms). null/undefined = indefinido. */
  @field('deadline') deadline?: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}
