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
  onOpenNotifications: () => void;
  presentation?: 'sheet' | 'page';
}

type SettingsPage = 'main' | 'appearance' | 'currency' | 'privacy' | 'backup' | 'import';

export default function SettingsSheet({
  isOpen,
  onClose,
  db,
  onOpenNotifications,
  presentation = 'sheet',
}: SettingsSheetProps) {
  const styles = useThemedStyles(makeStyles);
  const palette = usePalette();
  const { t } = useTranslation();
  const { showError, showToast } = useToast();
  const s = useSettings();
  const [importText, setImportText] = useState<string | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [pinMode, setPinMode] = useState<PinMode | null>(null);
  const [page, setPage] = useState<SettingsPage>('main');

  useEffect(() => {
    if (isOpen) {
      isBiometricAvailable().then(setBioAvailable);
      setPage('main');
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
      setPage('backup');
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
  const pageTitle =
    page === 'main' ? t('settings.title')
      : page === 'appearance' ? t('settings.appearance')
        : page === 'currency' ? t('settings.currency')
          : page === 'privacy' ? t('security.title')
            : page === 'backup' ? t('settings.backup')
              : t('settings.import');
  const back = page === 'main' ? onClose : () => setPage('main');

  return (
    <SheetScaffold
      isOpen={isOpen}
      onClose={back}
      title={pageTitle}
      accent={palette.primary}
      accentSoft={palette.primarySoft}
      closeTestID="settings-close"
      presentation={presentation}>
      {page === 'main' ? (
        <Box style={styles.body}>
          <Box style={styles.callout}>
            <Text style={styles.calloutTitle}>{t('settings.deviceOnly')}</Text>
            <Text style={styles.calloutBody}>{t('settings.deviceOnlyBody')}</Text>
          </Box>
          <Text style={styles.section}>{t('settings.personalization')}</Text>
          <Pressable style={styles.linkCard} onPress={() => setPage('appearance')}>
            <Box style={styles.linkCopy}>
              <Text style={styles.linkTitle}>{t('settings.appearance')}</Text>
              <Text style={styles.linkBody}>{t('settings.appearanceSummary')}</Text>
            </Box>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable style={styles.linkCard} onPress={() => setPage('currency')}>
            <Box style={styles.linkCopy}>
              <Text style={styles.linkTitle}>{t('settings.currency')}</Text>
              <Text style={styles.linkBody}>{t('settings.currencySummary')}</Text>
            </Box>
            <Text style={styles.linkValue}>{s.currency} ›</Text>
          </Pressable>
          <Box style={styles.nameCard}>
            <Text style={styles.linkTitle}>{t('settings.name')}</Text>
            <Text style={styles.linkBody}>{t('settings.nameSummary')}</Text>
            <TextInput
              testID="settings-name"
              style={styles.input}
              value={s.userName}
              onChangeText={s.setUserName}
              placeholder={t('settings.name')}
              placeholderTextColor={palette.muted}
              maxLength={40}
            />
          </Box>

          <Text style={styles.section}>{t('settings.privacyData')}</Text>
          <Pressable style={styles.linkCard} onPress={() => setPage('privacy')}>
            <Box style={styles.linkCopy}>
              <Text style={styles.linkTitle}>{t('security.title')}</Text>
              <Text style={styles.linkBody}>{t('settings.securitySummary')}</Text>
            </Box>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable style={styles.linkCard} onPress={onOpenNotifications}>
            <Box style={styles.linkCopy}>
              <Text style={styles.linkTitle}>{t('notif.title')}</Text>
              <Text style={styles.linkBody}>{t('settings.notificationsSummary')}</Text>
            </Box>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable style={styles.linkCard} onPress={() => setPage('backup')}>
            <Box style={styles.linkCopy}>
              <Text style={styles.linkTitle}>{t('settings.backup')}</Text>
              <Text style={styles.linkBody}>{t('settings.backupSummary')}</Text>
            </Box>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Box>
      ) : null}

      {page === 'appearance' ? (
        <Box style={styles.body}>
          <Text style={styles.section}>{t('settings.theme')}</Text>
          <Box style={styles.segmentRow}>
            {themes.map(theme => {
              const active = s.theme === theme;
              return (
                <Pressable
                  key={theme}
                  testID={`theme-${theme}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => s.setTheme(theme)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t(`settings.theme.${theme}` as 'settings.theme.light')}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
          <Text style={styles.section}>{t('settings.language')}</Text>
          <Box style={styles.segmentRow}>
            {locales.map(loc => {
              const active = s.locale === loc;
              return (
                <Pressable
                  key={loc}
                  testID={`locale-${loc}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.segment, active && styles.segmentActive]}
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
        </Box>
      ) : null}

      {page === 'currency' ? (
        <Box style={styles.body}>
          <Text style={styles.pageDescription}>{t('settings.currencySummary')}</Text>
          {currencies.map(cur => {
            const active = s.currency === cur;
            return (
              <Pressable
                key={cur}
                testID={`currency-${cur}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.linkCard, active && styles.linkCardActive]}
                onPress={() => s.setCurrency(cur)}>
                <Text style={styles.linkTitle}>{cur === 'USD' ? '$ USD' : '€ EUR'}</Text>
                <Text style={styles.chevron}>{active ? '✓' : '›'}</Text>
              </Pressable>
            );
          })}
        </Box>
      ) : null}

      {page === 'privacy' ? (
        <Box style={styles.body}>
          <Box style={styles.callout}>
            <Text style={styles.calloutTitle}>{t('security.title')}</Text>
            <Text style={styles.calloutBody}>{t('settings.securitySummary')}</Text>
          </Box>
          {pinMode ? (
            <PinForm mode={pinMode} onCancel={() => setPinMode(null)} onSuccess={onPinSuccess} />
          ) : (
            <>
              <Box style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{t('security.pinLock')}</Text>
                <Toggle testID="pin-toggle" value={s.securityEnabled} onValueChange={onToggleSecurity} />
              </Box>
              {s.securityEnabled ? (
                <Box style={styles.chips}>
                  <Pressable testID="open-change-pin" style={styles.actionButton} onPress={() => setPinMode('change')}>
                    <Text style={styles.actionButtonText}>{t('security.changePin')}</Text>
                  </Pressable>
                  <Pressable testID="open-remove-pin" style={styles.actionButton} onPress={() => setPinMode('remove')}>
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
        </Box>
      ) : null}

      {page === 'backup' ? (
        <Box style={styles.body}>
          <Box style={styles.callout}>
            <Text style={styles.calloutTitle}>{t('settings.backup')}</Text>
            <Text style={styles.calloutBody}>{t('settings.backupSummary')}</Text>
          </Box>
          <Pressable testID="settings-export" style={styles.primaryButton} onPress={onExport}>
            <Text style={styles.primaryButtonText}>{t('settings.export')}</Text>
          </Pressable>
          <Pressable
            testID="settings-import"
            style={styles.secondaryButton}
            onPress={() => { setImportText(''); setPage('import'); }}>
            <Text style={styles.secondaryButtonText}>{t('settings.import')}</Text>
          </Pressable>
        </Box>
      ) : null}

      {page === 'import' ? (
        <Box style={styles.body}>
          <Text style={styles.pageDescription}>{t('settings.importPaste')}</Text>
          <TextInput
            testID="settings-import-text"
            style={styles.importInput}
            multiline
            value={importText ?? ''}
            onChangeText={setImportText}
            placeholder={t('settings.importPaste')}
            placeholderTextColor={palette.muted}
          />
          <Pressable testID="settings-import-confirm" style={styles.primaryButton} onPress={onImport}>
            <Text style={styles.primaryButtonText}>{t('settings.import')}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setPage('backup')}>
            <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
          </Pressable>
        </Box>
      ) : null}
    </SheetScaffold>
  );
}
