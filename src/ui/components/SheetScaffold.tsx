import React, { useEffect } from 'react';
import { BackHandler, Pressable, ScrollView, Text as NativeText, View } from 'react-native';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetScrollView,
  Box,
  Text,
} from '@gluestack-ui/themed';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { usePalette, useThemedStyles } from '../../theme';
import { useTranslation } from '../../i18n';
import { makeStyles } from './SheetScaffold.styles';

const CLOSE_THRESHOLD = 140;
const CLOSE_VELOCITY = 900;

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
}

/**
 * Cascarón común de modales: backdrop gestionado por Gluestack, cabecera con acento propio,
 * cierre por X / backdrop / botón atrás / deslizar hacia abajo.
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
}: SheetScaffoldProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();

  const translateY = useSharedValue(0);
  useEffect(() => {
    if (isOpen) {
      translateY.value = 0;
    }
  }, [isOpen, translateY]);

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

  const pan = Gesture.Pan()
    .onUpdate(event => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(event => {
      if (event.translationY > CLOSE_THRESHOLD || event.velocityY > CLOSE_VELOCITY) {
        translateY.value = withTiming(500, { duration: 160 }, finished => {
          if (finished) {
            runOnJS(onClose)();
          }
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });
  const sheetAnim = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (presentation === 'page' && !isOpen) {
    return null;
  }

  if (presentation === 'page') {
    return (
      <View style={[styles.page, { backgroundColor: palette.paper }]}>
        <View style={styles.pageHeader}>
          <NativeText style={[styles.pageTitle, { color: palette.ink }]}>{title}</NativeText>
          <Pressable
            testID={closeTestID}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={onClose}>
            <NativeText style={[styles.pageBack, { color: palette.muted }]}>{`‹ ${t('common.back')}`}</NativeText>
          </Pressable>
        </View>
        {fixedContent}
        <ScrollView
          testID={scrollTestID}
          contentContainerStyle={styles.pageScroll}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop
        testID="sheet-backdrop"
        style={styles.backdrop}
      />
      <ActionsheetContent style={styles.content}>
        <Animated.View style={[styles.sheetInner, sheetAnim]}>
          <GestureDetector gesture={pan}>
            <View>
              <Box style={[styles.accentBar, { backgroundColor: accent }]} />
              <Box style={[styles.header, { backgroundColor: accentSoft }]}>
                <Text style={[styles.title, { color: accent }]}>{title}</Text>
              </Box>
            </View>
          </GestureDetector>
          {fixedContent}
          <ActionsheetScrollView
            testID={scrollTestID}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled">
            {children}
          </ActionsheetScrollView>
        </Animated.View>
      </ActionsheetContent>
    </Actionsheet>
  );
}
