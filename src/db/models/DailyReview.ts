import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';
import type { ReviewMethod } from '../../streaks/domain';

export default class DailyReview extends Model {
  static table = 'daily_reviews';

  @text('local_date') localDate!: string;
  @field('confirmed_at_utc') confirmedAtUtc!: number;
  @text('timezone_at_confirmation') timezoneAtConfirmation!: string;
  @text('method') method!: ReviewMethod;
  @field('financial_revision_at_confirmation') financialRevisionAtConfirmation?: number;
}
