import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check, PauseCircle, RotateCcw } from 'react-native-feather';
import type { Database } from '@nozbe/watermelondb';
import type MilestoneUnlock from '../../db/models/MilestoneUnlock';
import { getStreakState } from '../../db/streaks';
import type { DerivedDay } from '../../streaks/domain';
import { useTranslation, type TranslationKey } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { useToast } from '../Toast';
import SheetScaffold from './SheetScaffold';
import { makeStyles } from './StreakProgressSheet.styles';

interface StreakProgressSheetProps {
  db: Database;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  presentation?: 'sheet' | 'page';
}

export default function StreakProgressSheet({ db, isOpen, onClose, onOpenSettings, presentation = 'sheet' }: StreakProgressSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  const { showError } = useToast();
  const [state, setState] = useState<Awaited<ReturnType<typeof getStreakState>> | null>(null);
  const [milestones, setMilestones] = useState<MilestoneUnlock[]>([]);

  useEffect(() => {
    if (!isOpen) { return; }
    Promise.all([
      getStreakState(db),
      db.get<MilestoneUnlock>('milestone_unlocks').query().fetch(),
    ])
      .then(([nextState, nextMilestones]) => {
        setState(nextState);
        setMilestones(nextMilestones);
      })
      .catch(error => showError(error, 'errors.streakLoad'));
  }, [db, isOpen, showError]);

  const statusText = (day: DerivedDay) => {
    const labels = {
      CONFIRMED: 'streak.confirmed',
      REST: 'streak.rest',
      MISSED: 'streak.missed',
      TODAY_PENDING: 'streak.pending',
      FUTURE: 'streak.future',
      BEFORE_START: 'streak.beforeStart',
    } as const;
    return t(labels[day.status]);
  };
  const milestoneLabel = (milestone: MilestoneUnlock) => t(`streak.milestone.${milestone.milestone}` as TranslationKey);

  return (
    <SheetScaffold
      isOpen={isOpen}
      onClose={onClose}
      title={t('streak.progress')}
      accent={palette.primary}
      accentSoft={palette.primarySoft}
      presentation={presentation}
      pageHeaderMode="close"
      showSheetTitle={presentation === 'page'}>
      <View style={styles.body}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}><Text style={styles.summaryValue}>{state?.summary.currentStreak ?? 0}</Text><Text style={styles.summaryLabel}>{t('streak.current')}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryValue}>{state?.summary.bestStreak ?? 0}</Text><Text style={styles.summaryLabel}>{t('streak.best')}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryValue}>{state?.summary.totalReviewedDays ?? 0}</Text><Text style={styles.summaryLabel}>{t('streak.total')}</Text></View>
        </View>
        <Text style={styles.section}>{t('streak.week')}</Text>
        <View style={styles.week}>
          {(state?.week ?? []).map(day => {
            const confirmed = day.status === 'CONFIRMED';
            const rest = day.status === 'REST';
            return (
              <View key={day.localDate} style={styles.day} accessibilityLabel={`${day.localDate}: ${statusText(day)}`}>
                <View style={[styles.dayDot, confirmed && styles.confirmed, rest && styles.rest, day.status === 'MISSED' && styles.missed]}>
                  {confirmed ? <Check width={16} height={16} color={palette.paper} /> : rest ? <PauseCircle width={16} height={16} color={palette.muted} /> : day.status === 'MISSED' ? <RotateCcw width={14} height={14} color={palette.expense} /> : null}
                </View>
                <Text style={styles.dayLabel}>{Number(day.localDate.slice(-2))}</Text>
                <Text style={styles.dayStatus}>{statusText(day)}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.helper}>{t('streak.restExplanation')}</Text>
        <Text style={styles.section}>{t('streak.milestones')}</Text>
        {milestones.length ? milestones.map(milestone => (
          <View key={milestone.id} style={styles.milestone}>
            <Check width={18} height={18} color={palette.income} />
            <Text style={styles.milestoneText}>{milestoneLabel(milestone)}</Text>
          </View>
        )) : <Text style={styles.helper}>{t('streak.notStarted')}</Text>}
        <Pressable accessibilityRole="button" style={styles.settingsButton} onPress={onOpenSettings}>
          <Text style={styles.settingsText}>{t('streak.settings')}</Text>
        </Pressable>
      </View>
    </SheetScaffold>
  );
}
