import notifee, { RepeatFrequency, TriggerType } from '@notifee/react-native';
import type { Database } from '@nozbe/watermelondb';
import { getDailyReviews, getOrCreateStreakSettings } from '../db/streaks';
import { translate } from '../i18n';
import type { Locale } from '../state/useSettings';

const STREAK_REMINDER_ID = 'docash-streak-reminder';

function nextReminderAt(localTime: string): number {
  const [hourText, minuteText] = localTime.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const when = new Date();
  when.setHours(Number.isFinite(hour) ? Math.min(Math.max(hour, 0), 23) : 20, Number.isFinite(minute) ? Math.min(Math.max(minute, 0), 59) : 0, 0, 0);
  if (when.getTime() <= Date.now()) {
    when.setDate(when.getDate() + 1);
  }
  return when.getTime();
}

export async function scheduleStreakReminder(localTime: string, title: string, body: string): Promise<void> {
  try {
    await notifee.requestPermission();
    await notifee.createTriggerNotification(
      { id: STREAK_REMINDER_ID, title, body },
      { type: TriggerType.TIMESTAMP, timestamp: nextReminderAt(localTime), repeatFrequency: RepeatFrequency.DAILY },
    );
  } catch (error) {
    console.error('[notifications] streak reminder failed', error);
  }
}

export async function cancelStreakReminder(): Promise<void> {
  try {
    await notifee.cancelTriggerNotification(STREAK_REMINDER_ID);
  } catch {
    // Notification permissions are optional; local review must still work.
  }
}

export async function reconcileStreakReminder(db: Database, locale: Locale): Promise<void> {
  const settings = await getOrCreateStreakSettings(db);
  const reviews = await getDailyReviews(db);
  if (settings.enabled && settings.reminderEnabled && reviews.length > 0) {
    await scheduleStreakReminder(settings.reminderLocalTime ?? '20:00', translate(locale, 'streak.title'), translate(locale, 'streak.reminderBody'));
  } else {
    await cancelStreakReminder();
  }
}
