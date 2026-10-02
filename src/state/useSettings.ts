import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Locale = 'en' | 'es';
export type Currency = 'USD' | 'EUR';

interface SettingsState {
  locale: Locale;
  theme: ThemePreference;
  currency: Currency;
  /** Unidades de `currency` por 1 USD. Los importes se guardan en USD. */
  exchangeRate: number;
  /** Si true, se actualiza sola al conectar (cachea el último valor). */
  currencyAuto: boolean;
  rateUpdatedAt: number;
  /** Primer arranque de la app (ms). Límite inferior de navegación de fechas. */
  installedAt: number;
  userName: string;
  securityEnabled: boolean;
  biometricEnabled: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  notifyRecurring: boolean;
  notifyBudget: boolean;
  notifyGoal: boolean;
  notifySummary: boolean;
  notifyInactive: boolean;
  inactivityDays: number;
  soundEnabled: boolean;
  soundKeypad: boolean;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
  setCurrency: (currency: Currency) => void;
  setExchangeRate: (rate: number, touchTimestamp?: boolean) => void;
  setCurrencyAuto: (value: boolean) => void;
  setInstalledAt: (ms: number) => void;
  setUserName: (name: string) => void;
  setSecurityEnabled: (value: boolean) => void;
  setBiometricEnabled: (value: boolean) => void;
  setReminderEnabled: (value: boolean) => void;
  setReminderHour: (hour: number) => void;
  setNotifyRecurring: (value: boolean) => void;
  setNotifyBudget: (value: boolean) => void;
  setNotifyGoal: (value: boolean) => void;
  setNotifySummary: (value: boolean) => void;
  setNotifyInactive: (value: boolean) => void;
  setInactivityDays: (days: number) => void;
  setSoundEnabled: (value: boolean) => void;
  setSoundKeypad: (value: boolean) => void;
}

const storage = new MMKV({ id: 'docash-settings' });

const mmkvStorage = createJSONStorage(() => ({
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
}));

export const DEFAULT_EXCHANGE_RATE = 0.92;

// Preferencias persistentes (MMKV, síncrono).
export const useSettings = create<SettingsState>()(
  persist(
    set => ({
      locale: 'en',
      theme: 'system',
      currency: 'USD',
      exchangeRate: DEFAULT_EXCHANGE_RATE,
      currencyAuto: true,
      rateUpdatedAt: 0,
      installedAt: 0,
      userName: '',
      securityEnabled: false,
      biometricEnabled: false,
      reminderEnabled: false,
      reminderHour: 20,
      notifyRecurring: true,
      notifyBudget: true,
      notifyGoal: true,
      notifySummary: false,
      notifyInactive: false,
      inactivityDays: 3,
      soundEnabled: true,
      soundKeypad: true,
      setLocale: locale => set({ locale }),
      setTheme: theme => set({ theme }),
      setCurrency: currency => set({ currency }),
      setExchangeRate: (rate, touchTimestamp = false) =>
        set(state => ({
          exchangeRate: rate > 0 ? rate : state.exchangeRate,
          rateUpdatedAt: touchTimestamp ? Date.now() : state.rateUpdatedAt,
        })),
      setCurrencyAuto: currencyAuto => set({ currencyAuto }),
      setInstalledAt: installedAt => set({ installedAt }),
      setUserName: userName => set({ userName: userName.slice(0, 40) }),
      setSecurityEnabled: securityEnabled => set({ securityEnabled }),
      setBiometricEnabled: biometricEnabled => set({ biometricEnabled }),
      setReminderEnabled: reminderEnabled => set({ reminderEnabled }),
      setReminderHour: reminderHour =>
        set({ reminderHour: Math.min(Math.max(reminderHour, 0), 23) }),
      setNotifyRecurring: notifyRecurring => set({ notifyRecurring }),
      setNotifyBudget: notifyBudget => set({ notifyBudget }),
      setNotifyGoal: notifyGoal => set({ notifyGoal }),
      setNotifySummary: notifySummary => set({ notifySummary }),
      setNotifyInactive: notifyInactive => set({ notifyInactive }),
      setInactivityDays: inactivityDays =>
        set({ inactivityDays: Math.min(Math.max(Math.round(inactivityDays), 1), 365) }),
      setSoundEnabled: soundEnabled => set({ soundEnabled }),
      setSoundKeypad: soundKeypad => set({ soundKeypad }),
    }),
    { name: 'docash-settings', storage: mmkvStorage },
  ),
);
