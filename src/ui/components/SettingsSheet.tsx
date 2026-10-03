import React, { useEffect, useState } from 'react';
import { Share, TextInput } from 'react-native';
import { Box, Pressable, Text } from '@gluestack-ui/themed';
import type { Database } from '@nozbe/watermelondb';
import { exportData, importData } from '../../db/backup';
import { clearPin } from '../../security/pin';
import {
  disableBiometric,
  enableBiometric,
  isBiometricAvailable,
} from '../../security/biometrics';
import { useTranslation } from '../../i18n';
import { playSound } from '../../services/sound';
import {
  useSettings,
  type Currency,
  type Locale,
  type ThemePreference,
} from '../../state/useSettings';
import { usePalette, useThemedStyles } from '../../theme';
import PinForm, { type PinMode } from './PinForm';
import SheetScaffold from './SheetScaffold';
import { makeStyles } from './SettingsSheet.styles';
import Toggle from './Toggle';
import { useToast } from '../Toast';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  db: Database;
  onOpenBudgets: () => void;
  onOpenRecurring: () => void;
  onOpenNotifications: () => void;
}

export default function SettingsSheet({
  isOpen,
  onClose,
  db,
  onOpenBudgets,
  onOpenRecurring,
  onOpenNotifications,
}: SettingsSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  const { showError, showToast } = useToast();
  const s = useSettings();
  const [importText, setImportText] = useState<string | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [pinMode, setPinMode] = useState<PinMode | null>(null);

  useEffect(() => {
    if (isOpen) {
      isBiometricAvailable().then(setBioAvailable);
    }
  }, [isOpen]);

  const onToggleSecurity = (value: boolean) => {
    setPinMode(value ? 'set' : 'remove');
  };

  const onPinSuccess = () => {
    if (pinMode === 'remove') {
      clearPin();
      disableBiometric();
      s.setSecurityEnabled(false);
      s.setBiometricEnabled(false);
    } else {
      s.setSecurityEnabled(true);
    }
    setPinMode(null);
  };

  const onToggleBiometric = async (value: boolean) => {
    try {
      if (value) {
        await enableBiometric();
        s.setBiometricEnabled(true);
      } else {
        await disableBiometric();
        s.setBiometricEnabled(false);
      }
    } catch (error) {
      showError(error, 'errors.biometric');
    }
  };

  const onExport = async () => {
    try {
      const json = await exportData(db);
      await Share.share({ title: 'Docash backup', message: json });
      playSound('success');
    } catch (error) {
      showError(error, 'errors.backupExport');
    }
  };

  const onImport = async () => {
    if (importText === null) {
      return;
    }
    try {
      const counts = await importData(db, importText);
      setImportText(null);
      playSound('success');
      showToast(`${t('settings.importDone')}: ${counts.transactions}`, 'success');
    } catch (error) {
      playSound('error');
      showError(error, 'errors.backupImport');
    }
  };

  const themes: ThemePreference[] = ['light', 'dark', 'system'];
  const locales: Locale[] = ['en', 'es'];
  const currencies: Currency[] = ['USD', 'EUR'];

  return (
    <SheetScaffold
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.title')}
      accent={palette.primary}
      accentSoft={palette.primarySoft}
      closeTestID="settings-close">
      <Box style={styles.body}>
        <Text style={styles.section}>{t('settings.profile')}</Text>
        <TextInput
          testID="settings-name"
          style={styles.input}
          value={s.userName}
          onChangeText={s.setUserName}
          placeholder={t('settings.name')}
          placeholderTextColor={palette.muted}
          maxLength={40}
        />

        <Text style={styles.section}>{t('settings.appearance')}</Text>
        <Box style={styles.chips}>
          {themes.map(theme => {
            const active = s.theme === theme;
            return (
              <Pressable
                key={theme}
                testID={`theme-${theme}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => s.setTheme(theme)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t(`settings.theme.${theme}` as 'settings.theme.light')}
                </Text>
              </Pressable>
            );
          })}
        </Box>

        <Text style={styles.section}>{t('settings.language')}</Text>
        <Box style={styles.chips}>
          {locales.map(loc => {
            const active = s.locale === loc;
            return (
              <Pressable
                key={loc}
                testID={`locale-${loc}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => s.setLocale(loc)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {loc === 'en' ? 'English' : 'Español'}
                </Text>
              </Pressable>
            );
          })}
        </Box>

        <Text style={styles.section}>{t('settings.sounds')}</Text>
        <Box style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.sounds')}</Text>
          <Toggle testID="sound-toggle" value={s.soundEnabled} onValueChange={s.setSoundEnabled} />
        </Box>
        <Box style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.soundKeypad')}</Text>
          <Toggle
            testID="sound-keypad-toggle"
            value={s.soundKeypad}
            disabled={!s.soundEnabled}
            onValueChange={s.setSoundKeypad}
          />
        </Box>

        <Text style={styles.section}>{t('settings.currency')}</Text>
        <Box style={styles.chips}>
          {currencies.map(cur => {
            const active = s.currency === cur;
            return (
              <Pressable
                key={cur}
                testID={`currency-${cur}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => s.setCurrency(cur)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cur === 'USD' ? '$ USD' : '€ EUR'}
                </Text>
              </Pressable>
            );
          })}
        </Box>

        <Text style={styles.section}>{t('security.title')}</Text>
        {pinMode ? (
          <PinForm mode={pinMode} onCancel={() => setPinMode(null)} onSuccess={onPinSuccess} />
        ) : (
          <>
            <Box style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{t('security.pinLock')}</Text>
            <Toggle
                testID="pin-toggle"
                value={s.securityEnabled}
                onValueChange={onToggleSecurity}
              />
            </Box>
            {s.securityEnabled ? (
              <Box style={styles.chips}>
                <Pressable
                  testID="open-change-pin"
                  style={styles.actionButton}
                  onPress={() => setPinMode('change')}>
                  <Text style={styles.actionButtonText}>{t('security.changePin')}</Text>
                </Pressable>
                <Pressable
                  testID="open-remove-pin"
                  style={styles.actionButton}
                  onPress={() => setPinMode('remove')}>
                  <Text style={styles.actionButtonText}>{t('security.removeLock')}</Text>
                </Pressable>
              </Box>
            ) : null}
            <Box style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{t('security.biometrics')}</Text>
              <Toggle
                testID="biometric-toggle"
                value={s.biometricEnabled}
                disabled={!s.securityEnabled || !bioAvailable}
                onValueChange={onToggleBiometric}
              />
            </Box>
          </>
        )}

        <Text style={styles.section}>{t('notif.title')}</Text>
        <Box style={styles.chips}>
          <Pressable
            testID="open-notifications"
            style={styles.actionButton}
            onPress={onOpenNotifications}>
            <Text style={styles.actionButtonText}>{t('notif.title')}</Text>
          </Pressable>
        </Box>

        <Text style={styles.section}>{t('budgets.title')}</Text>
        <Box style={styles.chips}>
          <Pressable testID="open-budgets" style={styles.actionButton} onPress={onOpenBudgets}>
            <Text style={styles.actionButtonText}>{t('budgets.title')}</Text>
          </Pressable>
          <Pressable testID="open-recurring" style={styles.actionButton} onPress={onOpenRecurring}>
            <Text style={styles.actionButtonText}>{t('recurring.title')}</Text>
          </Pressable>
        </Box>

        <Text style={styles.section}>{t('settings.backup')}</Text>
        <Box style={styles.chips}>
          <Pressable testID="settings-export" style={styles.actionButton} onPress={onExport}>
            <Text style={styles.actionButtonText}>{t('settings.export')}</Text>
          </Pressable>
          <Pressable
            testID="settings-import"
            style={styles.actionButton}
            onPress={() => setImportText('')}>
            <Text style={styles.actionButtonText}>{t('settings.import')}</Text>
          </Pressable>
        </Box>
        {importText !== null ? (
          <>
            <TextInput
              testID="settings-import-text"
              style={styles.importInput}
              multiline
              value={importText}
              onChangeText={setImportText}
              placeholder={t('settings.importPaste')}
              placeholderTextColor={palette.muted}
            />
            <Pressable
              testID="settings-import-confirm"
              style={[styles.actionButton, styles.importConfirm]}
              onPress={onImport}>
              <Text style={styles.actionButtonText}>{t('settings.import')}</Text>
            </Pressable>
          </>
          ) : null}
      </Box>
    </SheetScaffold>
  );
}
