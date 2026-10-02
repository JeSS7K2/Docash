/* eslint-env jest */
// Mocks globales para el entorno Jest (no hay nativos).

// MMKV en memoria (react-native-mmkv no existe en node).
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  class MMKV {
    getString(key) {
      return store.has(key) ? store.get(key) : undefined;
    }
    set(key, value) {
      store.set(key, value);
    }
    delete(key) {
      store.delete(key);
    }
  }
  return { MMKV };
});

// Cualquier icono Feather -> componente vacío.
jest.mock('react-native-feather', () => new Proxy({}, { get: () => () => null }));

// gesture-handler: passthrough (sin nativo en Jest).
jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native');
  const chain = () => {
    const node = {};
    const noop = () => node;
    Object.assign(node, {
      onUpdate: noop,
      onEnd: noop,
      onStart: noop,
      onBegin: noop,
      onFinalize: noop,
      enabled: noop,
      runOnJS: noop,
      simultaneousWithExternalGesture: noop,
    });
    return node;
  };
  return {
    Swipeable: ({ children }) => children,
    GestureHandlerRootView: RN.View,
    GestureDetector: ({ children }) => children,
    Gesture: { Pan: chain, Tap: chain, LongPress: chain },
  };
});

// Reanimated mínimo.
jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  return {
    __esModule: true,
    default: { View: RN.View, createAnimatedComponent: c => c },
    useSharedValue: value => ({ value }),
    useAnimatedStyle: () => ({}),
    withTiming: (value, _config, callback) => {
      if (callback) {
        callback(true);
      }
      return value;
    },
    withSpring: value => value,
    runOnJS: fn => fn,
  };
});

// Blur nativo.
jest.mock('@react-native-community/blur', () => ({ BlurView: () => null }));

// Notifee (notificaciones) y Keychain (biometría): nativos ausentes en Jest.
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(async () => ({})),
    createTriggerNotification: jest.fn(async () => undefined),
    cancelTriggerNotification: jest.fn(async () => undefined),
  },
  TriggerType: { TIMESTAMP: 0 },
  RepeatFrequency: { DAILY: 1 },
}));

jest.mock('react-native-keychain', () => ({
  getSupportedBiometryType: jest.fn(async () => null),
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => false),
  resetGenericPassword: jest.fn(async () => true),
  ACCESS_CONTROL: { BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BIOMETRY' },
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED' },
}));

// Android widget: sin nativo en Jest.
jest.mock('react-native-android-widget', () => ({
  FlexWidget: () => null,
  TextWidget: () => null,
  registerWidgetTaskHandler: jest.fn(),
  requestWidgetUpdate: jest.fn(async () => undefined),
}));

// react-native-sound: sin nativo en Jest.
jest.mock('react-native-sound', () => {
  class Sound {
    constructor(_name, _bundle, cb) {
      if (cb) {
        cb(null);
      }
    }
    play(cb) {
      if (cb) {
        cb();
      }
    }
    release() {}
    static setCategory() {}
  }
  Sound.MAIN_BUNDLE = 'MAIN_BUNDLE';
  Sound.setCategory = () => {};
  return { __esModule: true, default: Sound };
});
