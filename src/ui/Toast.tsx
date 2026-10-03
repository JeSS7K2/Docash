import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation, type TranslationKey } from '../i18n';
import { usePalette } from '../theme';
import { errorKey } from './userError';

type ToastTone = 'error' | 'success';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
  showError: (error: unknown, fallback?: TranslationKey) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
  showError: () => undefined,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useTranslation();
  const palette = usePalette();

  const showToast = useCallback((message: string, tone: ToastTone = 'error') => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    const id = Date.now();
    setToast({ id, message, tone });
    timeout.current = setTimeout(() => setToast(current => (current?.id === id ? null : current)), 3600);
  }, []);

  const showError = useCallback(
    (error: unknown, fallback: TranslationKey = 'errors.generic') => {
      showToast(t(errorKey(error, fallback)), 'error');
    },
    [showToast, t],
  );

  useEffect(() => () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showError }}>
      <View style={styles.root}>
        {children}
        {toast ? (
          <View pointerEvents="box-none" style={styles.overlay}>
            <Pressable
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              onPress={() => setToast(null)}
              style={[styles.toast, { backgroundColor: toast.tone === 'error' ? palette.expense : palette.income }]}>
              <Text style={styles.message}>{toast.message}</Text>
              <Text style={styles.dismiss}>×</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  toast: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  message: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600' },
  dismiss: { color: '#FFF', fontSize: 24, lineHeight: 24, opacity: 0.8 },
});
