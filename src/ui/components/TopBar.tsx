import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { useTranslation } from '../../i18n';
import { usePalette, useThemedStyles } from '../../theme';
import { Icon } from '../icons';
import { makeStyles } from './TopBar.styles';

interface TopBarProps {
  userName: string;
  title?: string;
  onOpenSettings: () => void;
  flush?: boolean;
}

/** Barra superior compartida por todas las pantallas principales. */
export default function TopBar({ userName, title, onOpenSettings, flush = false }: TopBarProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  return (
    <Box style={[styles.root, flush && styles.rootFlush]}>
      <Text style={styles.title}>{title ?? userName}</Text>
      <Pressable
        testID="open-settings"
        accessibilityRole="button"
        accessibilityLabel={t('settings.open')}
        style={styles.iconButton}
        onPress={onOpenSettings}>
        <Icon name="Settings" color={palette.ink} size={28} strokeWidth={2.2} />
      </Pressable>
    </Box>
  );
}
