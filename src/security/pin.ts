import { MMKV } from 'react-native-mmkv';

// PIN local. Hash no criptográfico (RN no trae crypto nativo): disuade el
// acceso casual, no protege frente a un atacante con root. Para producción,
// sustituir por bcrypt/argon2 o delegar en el Keystore.
const store = new MMKV({ id: 'docash-security' });
const SALT_KEY = 'pin.salt';
const HASH_KEY = 'pin.hash';

function hash(pin: string, salt: string): string {
  /* eslint-disable no-bitwise */
  let h = 5381;
  const input = `${salt}:${pin}`;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
  /* eslint-enable no-bitwise */
}

export function hasPin(): boolean {
  return Boolean(store.getString(HASH_KEY));
}

export function setPin(pin: string): void {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be 4 digits');
  }
  const salt = Math.random().toString(36).slice(2);
  store.set(SALT_KEY, salt);
  store.set(HASH_KEY, hash(pin, salt));
}

export function verifyPin(pin: string): boolean {
  const salt = store.getString(SALT_KEY);
  const stored = store.getString(HASH_KEY);
  if (!salt || !stored) {
    return false;
  }
  return hash(pin, salt) === stored;
}

export function clearPin(): void {
  store.delete(SALT_KEY);
  store.delete(HASH_KEY);
}
