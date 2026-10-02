import React from 'react';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { ChevronLeft, ChevronRight } from 'react-native-feather';
import { useTranslation } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { labelForPeriod, type PeriodKind } from '../../utils/dateRange';
import { makeStyles } from './PeriodFilter.styles';

interface PeriodFilterProps {
  period: PeriodKind;
  anchorMs: number;
  onPeriodChange: (period: PeriodKind) => void;
  onShift: (direction: 1 | -1) => void;
  /** Permite retroceder más allá del periodo actual (límite inferior). */
  canGoPrev?: boolean;
}

const PERIODS: { key: PeriodKind; labelKey: 'period.day' | 'period.week' | 'period.month' | 'period.year' | 'period.all' }[] = [
  { key: 'day', labelKey: 'period.day' },
  { key: 'week', labelKey: 'period.week' },
  { key: 'month', labelKey: 'period.month' },
  { key: 'year', labelKey: 'period.year' },
  { key: 'all', labelKey: 'period.all' },
];

/** Selector de periodo + navegación ‹ › (oculta en "All time"). */
export default function PeriodFilter({
  period,
  anchorMs,
  onPeriodChange,
  onShift,
  canGoPrev = true,
}: PeriodFilterProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t, locale } = useTranslation();
  const showNav = period !== 'all';
  const prevEnabled = showNav && canGoPrev;
  const label = period === 'all' ? t('period.allTime') : labelForPeriod(period, anchorMs, locale === 'es' ? 'es-ES' : 'en-US');
  return (
    <Box style={styles.root}>
      <Box style={styles.nav}>
        <Pressable
          testID="period-prev"
          accessibilityRole="button"
          accessibilityLabel={t('period.prev')}
          style={[styles.navButton, !prevEnabled && styles.navButtonHidden]}
          disabled={!prevEnabled}
          onPress={() => onShift(-1)}>
          <ChevronLeft width={22} height={22} color={palette.ink} strokeWidth={2} />
        </Pressable>
        <Text style={styles.label} testID="period-label" numberOfLines={1}>
          {label}
        </Text>
        <Pressable
          testID="period-next"
          accessibilityRole="button"
          accessibilityLabel={t('period.next')}
          style={[styles.navButton, !showNav && styles.navButtonHidden]}
          disabled={!showNav}
          onPress={() => onShift(1)}>
          <ChevronRight width={22} height={22} color={palette.ink} strokeWidth={2} />
        </Pressable>
      </Box>
      <Box style={styles.chips}>
        {PERIODS.map(p => {
          const active = p.key === period;
          const chipLabel = t(p.labelKey);
          return (
            <Pressable
              key={p.key}
              testID={`period-${p.key}`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={chipLabel}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onPeriodChange(p.key)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{chipLabel}</Text>
            </Pressable>
          );
        })}
      </Box>
    </Box>
  );
}
