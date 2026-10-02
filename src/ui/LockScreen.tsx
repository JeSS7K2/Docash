import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import Numpad from './components/Numpad';
import { verifyPin } from '../security/pin';
import { authenticateBiometric } from '../security/biometrics';
import { useSettings } from '../state/useSettings';
import { useTranslation } from '../i18n';
import { useThemedStyles } from '../theme';
import { makeStyles } from './LockScreen.styles';

interface LockScreenProps {
  onUnlock: () => void;
}

const PIN_LENGTH = 4;

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const biometricEnabled = useSettings(s => s.biometricEnabled);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const tryBiometric = useCallback(async () => {
    const ok = await authenticateBiometric(t('security.unlock'));
    if (ok) {
      onUnlock();
    }
  }, [onUnlock, t]);

  useEffect(() => {
    if (biometricEnabled) {
      tryBiometric();
    }
  }, [biometricEnabled, tryBiometric]);

  const onKey = (key: string) => {
    if (key === 'back') {
      setPin(prev => prev.slice(0, -1));
      setError(false);
      return;
    }
    if (key === '.' || pin.length >= PIN_LENGTH) {
      return;
    }
    const next = `${pin}${key}`;
    setPin(next);
    setError(false);
    if (next.length === PIN_LENGTH) {
      if (verifyPin(next)) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setPin(''), 300);
      }
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>{t('security.enterPin')}</Text>
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
        ))}
      </View>
      {error ? <Text style={styles.error}>{t('security.wrongPin')}</Text> : null}
      <Numpad onKey={onKey} showDecimal={false} />
      {biometricEnabled ? (
        <Pressable style={styles.biometric} onPress={tryBiometric}>
          <Text style={styles.biometricText}>{t('security.biometrics')}</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}
