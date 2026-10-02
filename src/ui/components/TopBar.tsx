import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { Settings } from 'react-native-feather';
import { useTranslation } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import AppLogo from '../AppLogo';
import { makeStyles } from './TopBar.styles';

interface TopBarProps {
  userName: string;
  onOpenSettings: () => void;
}

/** Barra superior: logo de la app (izq) y opciones (der). */
export default function TopBar({ userName, onOpenSettings }: TopBarProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  return (
    <Box style={styles.root}>
      <Box style={styles.profile}>
        <AppLogo size={32} />
        {userName ? <Text style={styles.name}>{userName}</Text> : null}
      </Box>
      <Pressable
        testID="open-settings"
        accessibilityRole="button"
        accessibilityLabel={t('settings.open')}
        style={styles.iconButton}
        onPress={onOpenSettings}>
        <Settings width={22} height={22} color={palette.ink} strokeWidth={2} />
      </Pressable>
    </Box>
  );
}
