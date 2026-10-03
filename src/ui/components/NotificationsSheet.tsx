import React from 'react';
import { TextInput } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { useTranslation } from '../../i18n';
import { useSettings } from '../../state/useSettings';
import { usePalette, useThemedStyles } from '../../theme';
import SheetScaffold from './SheetScaffold';
import { makeSheetUi } from './sheetUi.styles';
import Toggle from './Toggle';

interface NotificationsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsSheet({ isOpen, onClose }: NotificationsSheetProps) {
  const ui = useThemedStyles(makeSheetUi);
  const palette = usePalette();
  const { t } = useTranslation();
  const s = useSettings();

  return (
    <SheetScaffold
      isOpen={isOpen}
      onClose={onClose}
      title={t('notif.title')}
      accent={palette.primary}
      accentSoft={palette.primarySoft}>
      <Box style={ui.body}>
        <Box style={ui.toggleRow}>
          <Text style={ui.toggleLabel}>{t('notif.daily')}</Text>
          <Toggle value={s.reminderEnabled} onValueChange={s.setReminderEnabled} />
        </Box>
        {s.reminderEnabled ? (
          <>
            <Text style={ui.section}>{t('notif.hour')}</Text>
            <TextInput
              style={ui.input}
              keyboardType="number-pad"
              value={String(s.reminderHour)}
              onChangeText={value => {
                const parsed = parseInt(value, 10);
                if (Number.isFinite(parsed)) {
                  s.setReminderHour(parsed);
                }
              }}
              placeholderTextColor={palette.muted}
            />
          </>
        ) : null}

        <Box style={ui.toggleRow}>
          <Text style={ui.toggleLabel}>{t('notif.recurring')}</Text>
          <Toggle value={s.notifyRecurring} onValueChange={s.setNotifyRecurring} />
        </Box>

        <Box style={ui.toggleRow}>
          <Text style={ui.toggleLabel}>{t('notif.budget')}</Text>
          <Toggle value={s.notifyBudget} onValueChange={s.setNotifyBudget} />
        </Box>

        <Box style={ui.toggleRow}>
          <Text style={ui.toggleLabel}>{t('notif.goal')}</Text>
          <Toggle value={s.notifyGoal} onValueChange={s.setNotifyGoal} />
        </Box>

        <Box style={ui.toggleRow}>
          <Text style={ui.toggleLabel}>{t('notif.summary')}</Text>
          <Toggle value={s.notifySummary} onValueChange={s.setNotifySummary} />
        </Box>

        <Box style={ui.toggleRow}>
          <Text style={ui.toggleLabel}>{t('notif.inactive')}</Text>
          <Toggle value={s.notifyInactive} onValueChange={s.setNotifyInactive} />
        </Box>
        {s.notifyInactive ? (
          <>
            <Text style={ui.section}>{t('notif.inactiveAfter')}</Text>
            <TextInput
              style={ui.input}
              keyboardType="number-pad"
              value={String(s.inactivityDays)}
              onChangeText={value => {
                const parsed = parseInt(value, 10);
                if (Number.isFinite(parsed)) {
                  s.setInactivityDays(parsed);
                }
              }}
              placeholderTextColor={palette.muted}
            />
          </>
        ) : null}
      </Box>
    </SheetScaffold>
  );
}
