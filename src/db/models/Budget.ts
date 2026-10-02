import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';
import type { BudgetPeriod, IntervalUnit } from '../../utils/schedule';

export default class Budget extends Model {
  static table = 'budgets';

  @text('category_id') categoryId!: string;
  @field('amount_cents') amountCents!: number;
  @text('period') period?: BudgetPeriod;
  @field('interval_days') intervalDays?: number;
  @text('interval_unit') intervalUnit?: IntervalUnit;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}
