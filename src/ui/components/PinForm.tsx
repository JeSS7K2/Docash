import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import { setPin, verifyPin } from '../../security/pin';
import { useTranslation } from '../../i18n';
import { playSound } from '../../services/sound';
import { usePalette, useThemedStyles } from '../../theme';
import { makeStyles } from './SettingsSheet.styles';

export type PinMode = 'set' | 'change' | 'remove';

interface PinFormProps {
  mode: PinMode;
  onCancel: () => void;
  onSuccess: () => void;
}

/** Formulario inline de PIN (crear / cambiar / quitar). Pide el actual para
 * cambiar o quitar. */
export default function PinForm({ mode, onCancel, onSuccess }: PinFormProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const inputStyle = [styles.input, { marginTop: 8 }];

  const submit = () => {
    if ((mode === 'change' || mode === 'remove') && !verifyPin(current)) {
      playSound('error');
      setError(t('security.wrongPin'));
      return;
    }
    if (mode !== 'remove') {
      if (!/^\d{4}$/.test(next)) {
        playSound('error');
        setError(t('security.setPin'));
        return;
      }
      if (next !== confirm) {
        playSound('error');
        setError(t('security.confirmPin'));
        return;
      }
      setPin(next);
    }
    playSound('confirm');
    onSuccess();
  };

  return (
    <Box>
      {mode !== 'set' ? (
        <>
          <Text style={styles.section}>{t('security.currentPin')}</Text>
          <TextInput
            testID="pin-current"
            style={inputStyle}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={current}
            onChangeText={setCurrent}
            placeholderTextColor={palette.muted}
          />
        </>
      ) : null}
      {mode !== 'remove' ? (
        <>
          <Text style={styles.section}>{t('security.newPin')}</Text>
          <TextInput
            testID="pin-new"
            style={inputStyle}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={next}
            onChangeText={setNext}
            placeholderTextColor={palette.muted}
          />
          <Text style={styles.section}>{t('security.confirmPin')}</Text>
          <TextInput
            testID="pin-confirm"
            style={inputStyle}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={confirm}
            onChangeText={setConfirm}
            placeholderTextColor={palette.muted}
          />
        </>
      ) : null}
      {error ? <Text style={[styles.section, { color: palette.expense }]}>{error}</Text> : null}
      <Box style={styles.chips}>
        <Pressable testID="pin-save" style={styles.actionButton} onPress={submit}>
          <Text style={styles.actionButtonText}>{t('common.save')}</Text>
        </Pressable>
        <Pressable testID="pin-cancel" style={styles.actionButton} onPress={onCancel}>
          <Text style={styles.actionButtonText}>{t('common.cancel')}</Text>
        </Pressable>
      </Box>
    </Box>
  );
}
