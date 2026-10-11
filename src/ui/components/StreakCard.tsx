import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check, PauseCircle, RotateCcw } from 'react-native-feather';
import { useTranslation } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import type { StreakState } from '../../db/streaks';
import type { DerivedDay } from '../../streaks/domain';
import { makeStyles } from './StreakCard.styles';

interface StreakCardProps {
  state: StreakState | null;
  onActivate: () => void;
  onReview: () => void;
  onProgress: () => void;
}

function statusLabel(day: DerivedDay, t: ReturnType<typeof useTranslation>['t']): string {
  const labels = {
    CONFIRMED: 'streak.confirmed',
    REST: 'streak.rest',
    MISSED: 'streak.missed',
    TODAY_PENDING: 'streak.pending',
    FUTURE: 'streak.future',
    BEFORE_START: 'streak.beforeStart',
  } as const;
  return t(labels[day.status]);
}

export default function StreakCard({ state, onActivate, onReview, onProgress }: StreakCardProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();

  if (!state || !state.settings.showHomeCard) {
    return null;
  }

  if (!state.settings.enabled) {
    return (
      <View style={styles.card}>
        <View style={styles.copy}>
          <Text style={styles.title}>{t('streak.activateTitle')}</Text>
          <Text style={styles.body}>{t('streak.activateBody')}</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={onActivate}>
          <Text style={styles.primaryButtonText}>{t('streak.activate')}</Text>
        </Pressable>
      </View>
    );
  }

  const todayConfirmed = state.summary.todayConfirmed;
  const yesterdayWasRest = state.history[state.history.length - 2]?.status === 'REST';
  const title = todayConfirmed
    ? t('streak.todayDone')
    : state.summary.continuity === 'BROKEN'
      ? t('streak.broken')
      : state.summary.currentStreak > 0
        ? t('streak.daysCount', { count: state.summary.currentStreak })
        : t('streak.reviewToday');
  const body = todayConfirmed
    ? t('streak.streakCount', { count: state.summary.currentStreak })
    : state.summary.continuity === 'BROKEN'
      ? t('streak.bestCount', { count: state.summary.bestStreak })
      : yesterdayWasRest
        ? t('streak.restMessage')
        : t('streak.restExplanation');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBubble}>
          {state.summary.continuity === 'BROKEN' ? (
            <RotateCcw width={22} height={22} color={palette.primary} />
          ) : (
            <Check width={22} height={22} color={palette.primary} />
          )}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
      </View>
      <View style={styles.week}>
        {state.week.map(day => {
          const active = day.status === 'CONFIRMED';
          const rest = day.status === 'REST';
          const dayNumber = Number(day.localDate.slice(-2));
          return (
            <View key={day.localDate} style={styles.day} accessibilityLabel={`${day.localDate}: ${statusLabel(day, t)}`}>
              <View style={[styles.dayDot, active && styles.dayConfirmed, rest && styles.dayRest]}>
                {active ? <Check width={14} height={14} color={palette.paper} /> : rest ? <PauseCircle width={14} height={14} color={palette.muted} /> : null}
              </View>
              <Text style={styles.dayLabel}>{dayNumber}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={todayConfirmed ? onProgress : onReview}>
          <Text style={styles.primaryButtonText}>{todayConfirmed ? t('streak.progress') : state.summary.continuity === 'BROKEN' ? t('streak.reviewAccounts') : t('streak.reviewToday')}</Text>
        </Pressable>
        {todayConfirmed ? null : (
          <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={onProgress}>
            <Text style={styles.secondaryButtonText}>{t('streak.progress')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
