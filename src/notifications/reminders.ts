import notifee, { RepeatFrequency, TriggerType } from '@notifee/react-native';

const REMINDER_ID = 'docash-daily-reminder';

/** Programa (o reprograma) el recordatorio diario a la hora indicada. */
export async function scheduleDailyReminder(
  hour: number,
  title: string,
  body: string,
): Promise<void> {
  try {
    await notifee.requestPermission();
    const when = new Date();
    when.setHours(hour, 0, 0, 0);
    if (when.getTime() <= Date.now()) {
      when.setDate(when.getDate() + 1);
    }
    await notifee.createTriggerNotification(
      { id: REMINDER_ID, title, body },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: when.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      },
    );
  } catch (error) {
    console.error('[notifications] schedule failed', error);
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await notifee.cancelTriggerNotification(REMINDER_ID);
  } catch (error) {
    console.error('[notifications] cancel failed', error);
  }
}

/** Momento del aviso "mañana toca…": un día antes de nextRun, a `hour`. */
export function recurringReminderAt(nextRunMs: number, hour: number): number {
  const d = new Date(nextRunMs);
  d.setDate(d.getDate() - 1);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

export async function scheduleRecurringReminder(
  ruleId: string,
  timestamp: number,
  title: string,
  body: string,
): Promise<void> {
  try {
    await notifee.createTriggerNotification(
      { id: `recurring-${ruleId}`, title, body },
      { type: TriggerType.TIMESTAMP, timestamp },
    );
  } catch (error) {
    console.error('[notifications] recurring schedule failed', error);
  }
}

export async function cancelRecurringReminder(ruleId: string): Promise<void> {
  try {
    await notifee.cancelTriggerNotification(`recurring-${ruleId}`);
  } catch {
    // noop
  }
}

const SUMMARY_ID = 'docash-weekly-summary';

/** Resumen semanal: próximo domingo a la hora indicada, repetido cada semana. */
export async function scheduleWeeklySummary(hour: number, title: string, body: string): Promise<void> {
  try {
    await notifee.requestPermission();
    const when = new Date();
    const add = ((7 - when.getDay()) % 7) || 7;
    when.setDate(when.getDate() + add);
    when.setHours(hour, 0, 0, 0);
    await notifee.createTriggerNotification(
      { id: SUMMARY_ID, title, body },
      { type: TriggerType.TIMESTAMP, timestamp: when.getTime(), repeatFrequency: RepeatFrequency.WEEKLY },
    );
  } catch (error) {
    console.error('[notifications] summary failed', error);
  }
}

export async function cancelWeeklySummary(): Promise<void> {
  try {
    await notifee.cancelTriggerNotification(SUMMARY_ID);
  } catch {
    // noop
  }
}

/** Notificación inmediata (avisos de presupuesto/objetivo/inactividad). */
export async function notifyNow(id: string, title: string, body: string): Promise<void> {
  try {
    await notifee.requestPermission();
    await notifee.displayNotification({ id, title, body });
  } catch (error) {
    console.error('[notifications] display failed', error);
  }
}
