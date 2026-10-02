import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';
import type { EntryKind } from '../operations';
import type { Frequency, IntervalUnit } from '../../utils/schedule';

export type { Frequency, IntervalUnit } from '../../utils/schedule';

export default class RecurringRule extends Model {
  static table = 'recurring_rules';

  @text('account_id') accountId!: string;
  @text('category_id') categoryId!: string;
  @text('kind') kind!: EntryKind;
  @field('amount_cents') amountCents!: number;
  @text('note') note!: string;
  @text('frequency') frequency!: Frequency;
  /** weekly: 1..7 (L-D); monthly: 1..31. */
  @field('schedule_day') scheduleDay?: number;
  /** custom: cada N días/semanas/meses. */
  @field('interval_count') intervalCount?: number;
  @text('interval_unit') intervalUnit?: IntervalUnit;
  @field('next_run') nextRun!: number;
  @field('active') active!: boolean;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}
