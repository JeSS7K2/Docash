import React, { useMemo } from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import PieChart from '../PieChart';
import type { PieSlice } from '../../db/queries';
import { useMoney } from '../../state/useMoney';
import { useThemedStyles } from '../../theme';
import { makeStyles } from './MonthDonut.styles';

interface MonthDonutProps {
  slices: PieSlice[];
  label: string;
}

export default function MonthDonut({ slices, label }: MonthDonutProps) {
  const styles = useThemedStyles(makeStyles);
  const money = useMoney();
  const total = useMemo(() => slices.reduce((acc, s) => acc + s.totalCents, 0), [slices]);
  return (
    <Box style={styles.root}>
      <PieChart slices={slices} />
      <Box style={styles.center} pointerEvents="none">
        <Text style={styles.total}>{money(total)}</Text>
        <Text style={styles.month}>{label}</Text>
      </Box>
    </Box>
  );
}
