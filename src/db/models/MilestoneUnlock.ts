import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export type Milestone = 'first' | 'three' | 'seven' | 'thirty';

export default class MilestoneUnlock extends Model {
  static table = 'milestone_unlocks';

  @text('milestone') milestone!: Milestone;
  @field('unlocked_at_utc') unlockedAtUtc!: number;
  @field('acknowledged_at_utc') acknowledgedAtUtc?: number;
}
