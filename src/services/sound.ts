import Sound from 'react-native-sound';
import { useSettings } from '../state/useSettings';

export type SoundName =
  | 'expense'
  | 'income'
  | 'key'
  | 'delete'
  | 'confirm'
  | 'goal'
  | 'warning'
  | 'error'
  | 'success';

// WAVs en android/app/src/main/res/raw/<name>.wav
try {
  Sound.setCategory('Ambient', true);
} catch {
  // setCategory es iOS-only
}

/** Reproduce un efecto si está habilitado en ajustes. Ignora fallos. */
export function playSound(name: SoundName): void {
  const settings = useSettings.getState();
  if (!settings.soundEnabled) {
    return;
  }
  if (name === 'key' && !settings.soundKeypad) {
    return;
  }
  try {
    const sound = new Sound(`${name}.wav`, Sound.MAIN_BUNDLE, error => {
      if (error) {
        return;
      }
      sound.play(() => sound.release());
    });
  } catch {
    // Sin audio disponible: no romper la app.
  }
}
