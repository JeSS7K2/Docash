import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class StreakSettings extends Model {
  static table = 'streak_settings';

  @field('enabled') enabled!: boolean;
  @text('review_time_zone') reviewTimeZone!: string;
  @field('activated_at_utc') activatedAtUtc!: number;
  @field('show_home_card') showHomeCard!: boolean;
  @field('celebrations_enabled') celebrationsEnabled!: boolean;
  @field('reminder_enabled') reminderEnabled!: boolean;
  @text('reminder_local_time') reminderLocalTime?: string;
  @text('last_evaluated_local_date') lastEvaluatedLocalDate?: string;
  @field('last_observed_at_utc') lastObservedAtUtc?: number;
  @field('schema_version') schemaVersion!: number;
}
