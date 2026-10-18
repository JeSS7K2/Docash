import React, { useEffect, useState } from 'react';
import { Linking, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { gluestackUIConfig } from '@gluestack-ui/config';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { database } from './src/db/database';
import { useThemeName } from './src/theme';
import { useSettings } from './src/state/useSettings';
import { useQuickAdd } from './src/state/useQuickAdd';
import type { EntryKind } from './src/db/operations';
import HomeScreen from './src/ui/HomeScreen';
import LockScreen from './src/ui/LockScreen';
import { ToastProvider } from './src/ui/Toast';

function Root(): React.JSX.Element {
  const theme = useThemeName();
  const securityEnabled = useSettings(s => s.securityEnabled);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!securityEnabled) {
      setUnlocked(true);
    }
  }, [securityEnabled]);

  // Deep link del widget: docash://add?kind=income|expense → abre DETALLES.
  useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) {
        return;
      }
      const match = url.match(/kind=(income|expense)/);
      useQuickAdd.getState().openWith((match?.[1] as EntryKind) ?? 'expense');
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener('url', event => handle(event.url));
    return () => sub.remove();
  }, []);

  const locked = securityEnabled && !unlocked;

  return (
    <GluestackUIProvider config={gluestackUIConfig} colorMode={theme}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <ToastProvider>
        <DatabaseProvider database={database}>
          {locked ? <LockScreen onUnlock={() => setUnlocked(true)} /> : <HomeScreen />}
        </DatabaseProvider>
      </ToastProvider>
    </GluestackUIProvider>
  );
}

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Root />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
