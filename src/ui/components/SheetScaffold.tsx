import React, { useEffect } from 'react';
import { BackHandler, Pressable, ScrollView, Text as NativeText, View } from 'react-native';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetScrollView,
  Box,
  Text,
} from '@gluestack-ui/themed';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { X } from 'react-native-feather';
import { usePalette, useThemedStyles } from '../../theme';
import { useTranslation } from '../../i18n';
import { Icon } from '../icons';
import { makeStyles } from './SheetScaffold.styles';

interface SheetScaffoldProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Color de acento del modal (identidad propia). */
  accent: string;
  /** Fondo suave de la cabecera. */
  accentSoft: string;
  children: React.ReactNode;
  fixedContent?: React.ReactNode;
  closeTestID?: string;
  scrollTestID?: string;
  presentation?: 'sheet' | 'page';
  pageHeaderMode?: 'back' | 'close' | 'settings';
  onOpenSettings?: () => void;
  showSheetTitle?: boolean;
}

/**
 * Cascarón común de modales: backdrop gestionado por Gluestack, cabecera con acento propio,
 * cierre por backdrop / botón atrás / deslizar hacia abajo.
 */
export default function SheetScaffold({
  isOpen,
  onClose,
  title,
  accent,
  accentSoft,
  children,
  fixedContent,
  scrollTestID,
  closeTestID,
  presentation = 'sheet',
  pageHeaderMode = 'back',
  onOpenSettings,
  showSheetTitle = true,
}: SheetScaffoldProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();

  const pageProgress = useSharedValue(0);

  useEffect(() => {
    if (presentation === 'page' && isOpen) {
      pageProgress.value = 0;
      pageProgress.value = withTiming(1, { duration: 260 });
    }
  }, [isOpen, pageProgress, presentation]);

  useEffect(() => {
    if (presentation !== 'page' || !isOpen) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [isOpen, onClose, presentation]);

  const pageAnim = useAnimatedStyle(() => ({
    opacity: pageProgress.value,
    transform: [{ translateY: (1 - pageProgress.value) * 16 }],
  }));

  if (presentation === 'page' && !isOpen) {
    return null;
  }

  if (presentation === 'page') {
    return (
      <Animated.View
        style={[styles.page, pageAnim, { backgroundColor: palette.paper }]}
      >
        <View style={styles.pageHeader}>
          {pageHeaderMode === 'settings' ? <View style={styles.pageHeaderSlot} /> : pageHeaderMode === 'close' ? (
            <Pressable
              testID={closeTestID}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={styles.pageHeaderSlot}
              onPress={onClose}>
              <X width={24} height={24} color={palette.ink} strokeWidth={2.2} />
            </Pressable>
          ) : null}
          <NativeText style={[styles.pageTitle, { color: palette.ink }]}>{title}</NativeText>
          {pageHeaderMode === 'settings' ? (
            <Pressable
              testID="open-settings"
              accessibilityRole="button"
              accessibilityLabel={t('settings.open')}
              style={styles.pageHeaderSlot}
              onPress={onOpenSettings}>
              <Icon name="Settings" color={palette.ink} size={28} strokeWidth={2.2} />
            </Pressable>
          ) : pageHeaderMode === 'close' ? <View style={styles.pageHeaderSlot} /> : (
            <Pressable
              testID={closeTestID}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              onPress={onClose}>
              <NativeText style={[styles.pageBack, { color: palette.muted }]}>{`‹ ${t('common.back')}`}</NativeText>
            </Pressable>
          )}
        </View>
        {fixedContent}
        <ScrollView
          testID={scrollTestID}
          contentContainerStyle={styles.pageScroll}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </Animated.View>
    );
  }

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop
        testID="sheet-backdrop"
        style={styles.backdrop}
      />
      <ActionsheetContent style={styles.content}>
        <ActionsheetDragIndicatorWrapper style={styles.dragHandle}>
          <ActionsheetDragIndicator style={[styles.accentBar, { backgroundColor: accent }]} />
        </ActionsheetDragIndicatorWrapper>
        {showSheetTitle ? (
          <View>
            <Box style={styles.header} backgroundColor={accentSoft}>
              <Text style={[styles.title, { color: accent }]}>{title}</Text>
            </Box>
          </View>
        ) : null}
          {fixedContent}
          <ActionsheetScrollView
            testID={scrollTestID}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled">
            {children}
          </ActionsheetScrollView>
      </ActionsheetContent>
    </Actionsheet>
  );
}
