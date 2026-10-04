import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import type { Database } from '@nozbe/watermelondb';
import { createGoal } from '../../db/goals';
import { toCents } from '../../utils/currency';
import { displayToBaseCents } from '../../utils/fx';
import { useSettings } from '../../state/useSettings';
import { useTranslation } from '../../i18n';
import { playSound } from '../../services/sound';
import { usePalette, useThemedStyles } from '../../theme';
import SheetScaffold from './SheetScaffold';
import { makeSheetUi } from './sheetUi.styles';
import { makeStyles } from './BudgetsSheet.styles';
import Toggle from './Toggle';
import { useToast } from '../Toast';

interface GoalsConfigSheetProps {
  isOpen: boolean;
  onClose: () => void;
  db: Database;
  presentation?: 'sheet' | 'page';
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Alta de un objetivo (meta + fecha límite opcional; indefinido por defecto). */
export default function GoalsConfigSheet({ isOpen, onClose, db, presentation = 'sheet' }: GoalsConfigSheetProps) {
  const ui = useThemedStyles(makeSheetUi);
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  const { showError } = useToast();
  const currency = useSettings(s => s.currency);
  const rate = useSettings(s => s.exchangeRate);

  const now = new Date();
  const [name, setName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [day, setDay] = useState(pad(now.getDate()));
  const [month, setMonth] = useState(pad(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [validationError, setValidationError] = useState('');

  const parseDeadline = (): number | null => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) {
      return null;
    }
    const date = new Date(y, m - 1, d);
    if (date.getMonth() !== m - 1 || date.getDate() !== d) {
      return null;
    }
    return date.getTime();
  };

  const save = async () => {
    let targetCents = 0;
    try {
      targetCents = displayToBaseCents(toCents(amountText === '' ? '0' : amountText), currency, rate);
    } catch {
      targetCents = 0;
    }
    if (!name.trim() || targetCents <= 0) {
      playSound('error');
      setValidationError(t('goals.target'));
      return;
    }
    let deadline: number | null = null;
    if (hasDeadline) {
      deadline = parseDeadline();
      if (!deadline) {
        playSound('error');
        setValidationError(t('goals.deadline'));
        return;
      }
    }
    try {
      await createGoal(db, { name, targetCents, deadline });
      playSound('confirm');
      setName('');
      setAmountText('');
      setHasDeadline(false);
      setValidationError('');
      onClose();
    } catch (cause) {
      playSound('error');
      showError(cause, 'errors.goalSave');
    }
  };

  return (
    <SheetScaffold
      isOpen={isOpen}
      onClose={onClose}
      title={t('goals.add')}
      accent={palette.recurring}
      accentSoft={palette.recurringSoft}
      presentation={presentation}>
      <Box style={styles.configBody}>
        <Text style={ui.section}>{t('goals.name')}</Text>
        <TextInput
          testID="goal-name"
          style={ui.input}
          value={name}
          onChangeText={setName}
          placeholder={t('goals.name')}
          placeholderTextColor={palette.muted}
          maxLength={40}
        />
        <Text style={ui.section}>{t('goals.target')}</Text>
        <TextInput
          testID="goal-target"
          style={ui.input}
          keyboardType="decimal-pad"
          value={amountText}
          onChangeText={setAmountText}
          placeholder="0"
          placeholderTextColor={palette.muted}
        />
        <Box style={ui.toggleRow}>
          <Text style={ui.toggleLabel}>{t('goals.deadline')}</Text>
          <Toggle value={hasDeadline} onValueChange={setHasDeadline} />
        </Box>
        {hasDeadline ? (
          <Box style={styles.periodRow}>
            <TextInput
              testID="goal-day"
              style={styles.daysInput}
              keyboardType="number-pad"
              value={day}
              onChangeText={setDay}
              placeholder="DD"
              placeholderTextColor={palette.muted}
            />
            <TextInput
              testID="goal-month"
              style={styles.daysInput}
              keyboardType="number-pad"
              value={month}
              onChangeText={setMonth}
              placeholder="MM"
              placeholderTextColor={palette.muted}
            />
            <TextInput
              testID="goal-year"
              style={styles.yearInput}
              keyboardType="number-pad"
              value={year}
              onChangeText={setYear}
              placeholder="YYYY"
              placeholderTextColor={palette.muted}
            />
          </Box>
        ) : null}
        {validationError ? <Text style={[ui.section, { color: palette.expense }]}>{validationError}</Text> : null}
        <Box style={ui.chips}>
          <Pressable testID="goal-save" style={ui.actionButton} onPress={save}>
            <Text style={ui.actionButtonText}>{t('common.save')}</Text>
          </Pressable>
        </Box>
      </Box>
    </SheetScaffold>
  );
}
