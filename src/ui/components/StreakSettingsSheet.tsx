import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { Database } from '@nozbe/watermelondb';
import { activateStreaks, getOrCreateStreakSettings, updateStreakSettings } from '../../db/streaks';
import type StreakSettings from '../../db/models/StreakSettings';
import { useTranslation } from '../../i18n';
import { reconcileStreakReminder } from '../../notifications/streakReminders';
import { usePalette, useThemedStyles } from '../../theme';
import { useToast } from '../Toast';
import SheetScaffold from './SheetScaffold';
import Toggle from './Toggle';
import { makeStyles } from './StreakSettingsSheet.styles';

interface StreakSettingsSheetProps {
  db: Database;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
  presentation?: 'sheet' | 'page';
}

export default function StreakSettingsSheet({ db, isOpen, onClose, onChanged, presentation = 'sheet' }: StreakSettingsSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t, locale } = useTranslation();
  const { showError } = useToast();
  const [settings, setSettings] = useState<StreakSettings | null>(null);
  const [reminderTime, setReminderTime] = useState('20:00');

  useEffect(() => {
    if (!isOpen) { return; }
    getOrCreateStreakSettings(db)
      .then(next => {
        setSettings(next);
        setReminderTime(next.reminderLocalTime ?? '20:00');
      })
      .catch(error => showError(error, 'errors.streakLoad'));
  }, [db, isOpen, showError]);

  const change = async (changes: Parameters<typeof updateStreakSettings>[1]) => {
    try {
      const next = await updateStreakSettings(db, changes);
      setSettings(next);
      await reconcileStreakReminder(db, locale);
      onChanged();
    } catch (error) {
      showError(error, 'errors.streakSave');
    }
  };

  const enabled = Boolean(settings?.enabled);
  return (
    <SheetScaffold
      isOpen={isOpen}
      onClose={onClose}
      title={t('streak.settings')}
      accent={palette.primary}
      accentSoft={palette.primarySoft}
      presentation={presentation}
      pageHeaderMode="close"
      showSheetTitle={presentation === 'page'}>
      <View style={styles.body}>
        <View style={styles.toggleRow}>
          <View style={styles.copy}><Text style={styles.title}>{t('streak.settings')}</Text><Text style={styles.bodyText}>{t('streak.activateBody')}</Text></View>
          <Toggle
            value={enabled}
            onValueChange={value => {
              if (value) {
                activateStreaks(db).then(async next => { setSettings(next); await reconcileStreakReminder(db, locale); onChanged(); }).catch(error => showError(error, 'errors.streakSave'));
              } else {
                change({ enabled: false, reminderEnabled: false });
              }
            }}
          />
        </View>
        <Text style={styles.zone}>{t('streak.timeZone', { zone: settings?.reviewTimeZone ?? 'UTC' })}</Text>
        {enabled ? (
          <>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>{t('streak.hideHome')}</Text>
              <Toggle value={settings?.showHomeCard ?? true} onValueChange={value => change({ showHomeCard: value })} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>{t('streak.celebrations')}</Text>
              <Toggle value={settings?.celebrationsEnabled ?? true} onValueChange={value => change({ celebrationsEnabled: value })} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>{t('streak.reminder')}</Text>
              <Toggle value={settings?.reminderEnabled ?? false} onValueChange={value => change({ reminderEnabled: value, reminderLocalTime: reminderTime })} />
            </View>
            {settings?.reminderEnabled ? (
              <>
                <Text style={styles.section}>{t('streak.reminderTime')}</Text>
                <TextInput
                  style={styles.input}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  onBlur={() => change({ reminderLocalTime: reminderTime })}
                  keyboardType="numbers-and-punctuation"
                  placeholder="20:00"
                  placeholderTextColor={palette.muted}
                />
              </>
            ) : null}
          </>
        ) : null}
      </View>
    </SheetScaffold>
  );
}
