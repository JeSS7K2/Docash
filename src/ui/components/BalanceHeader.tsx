import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { useMoney } from '../../state/useMoney';
import { useTranslation } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { AccountIcon } from '../icons';
import { makeStyles } from './BalanceHeader.styles';

interface BalanceHeaderProps {
  balanceCents: number;
  accountName: string;
  accountId?: string;
}

/** Gana la jerarquía: es lo único en 34/800 de la pantalla. */
export default function BalanceHeader({ balanceCents, accountName, accountId }: BalanceHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const money = useMoney();
  const { t } = useTranslation();
  return (
    <Box style={styles.root}>
      <Text style={styles.label}>{t('balance.total')}</Text>
      <Text style={styles.balance} testID="balance-total">
        {money(balanceCents)}
      </Text>
      <Box style={styles.account}>
        <AccountIcon id={accountId} color={palette.muted} size={16} />
        <Text style={styles.accountName} testID="account-name">
          {accountName}
        </Text>
      </Box>
    </Box>
  );
}
