import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { useThemedStyles } from '../../theme';
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
}: SheetScaffoldProps) {
  const styles = useThemedStyles(makeStyles);

  const translateY = useSharedValue(0);
  useEffect(() => {
    if (isOpen) {
      translateY.value = 0;
    }
  }, [isOpen, translateY]);

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

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop
        testID="sheet-backdrop"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.46)' }]}
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
