import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { useTranslation } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { makeStyles } from './TopBar.styles';

interface TopBarProps {
  userName: string;
  title?: string;
  onOpenSettings: () => void;
}

/** Barra superior: logo de la app (izq) y opciones (der). */
export default function TopBar({ userName, title, onOpenSettings }: TopBarProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  return (
    <Box style={styles.root}>
      <Text style={styles.title}>{title ?? userName}</Text>
      <Pressable
        testID="open-settings"
        accessibilityRole="button"
        accessibilityLabel={t('settings.open')}
        style={styles.iconButton}
        onPress={onOpenSettings}>
        <Text style={[styles.settingsText, { color: palette.muted }]}>{t('nav.settings')}</Text>
      </Pressable>
    </Box>
  );
}
