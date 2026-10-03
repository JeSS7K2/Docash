import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, usePalette } from '../../theme';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

/** Toggle control without the platform Switch animation that caused sheet flicker. */
export default function Toggle({ value, onValueChange, disabled = false, testID }: ToggleProps) {
  const palette = usePalette();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.control, disabled && styles.disabled]}>
      <View style={[styles.track, { backgroundColor: value ? palette.primary : palette.track }]}>
        <View style={[styles.thumb, { backgroundColor: palette.paper }, value && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: { minWidth: 52, minHeight: 36, justifyContent: 'center', alignItems: 'flex-end' },
  track: {
    width: 40,
    height: 22,
    borderRadius: 7,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: radius.icon,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  thumbOn: { alignSelf: 'flex-end' },
  disabled: { opacity: 0.45 },
});
