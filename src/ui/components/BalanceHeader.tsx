import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { useMoney } from '../../state/useMoney';
import { useTranslation } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { AccountIcon } from '../icons';
import { ChevronRight } from 'react-native-feather';
import { makeStyles } from './BalanceHeader.styles';

interface BalanceHeaderProps {
  balanceCents: number;
  accountName: string;
  accountId?: string;
  variant?: 'default' | 'hero';
}

/** Gana la jerarquía: es lo único en 34/800 de la pantalla. */
export default function BalanceHeader({ balanceCents, accountName, accountId, variant = 'default' }: BalanceHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const money = useMoney();
  const { t } = useTranslation();
  return (
      <Box style={[styles.root, variant === 'hero' && styles.heroRoot]}>
      <Box style={variant === 'hero' ? styles.heroContent : undefined}>
        <Text style={[styles.label, variant === 'hero' && styles.heroText]}>
          {variant === 'hero' ? t('home.currentBalance') : t('balance.total')}
        </Text>
        <Text style={[styles.balance, variant === 'hero' && styles.heroText]} testID="balance-total">
          {money(balanceCents)}
        </Text>
      </Box>
      <Box style={[styles.account, variant === 'hero' && styles.heroAccount]}>
        <AccountIcon id={accountId} color={variant === 'hero' ? '#FFFFFF' : palette.muted} size={variant === 'hero' ? 40 : 16} />
        <Text style={[styles.accountName, variant === 'hero' && styles.heroMuted]} testID="account-name">
          {accountName}
        </Text>
        {variant === 'hero' ? <ChevronRight width={28} height={28} color="#FFFFFF" strokeWidth={2} /> : null}
      </Box>
    </Box>
  );
}
