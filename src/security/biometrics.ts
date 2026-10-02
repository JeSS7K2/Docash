import * as Keychain from 'react-native-keychain';

const SERVICE = 'docash.biometric';

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const type = await Keychain.getSupportedBiometryType();
    return type != null;
  } catch {
    return false;
  }
}

/** Registra un secreto protegido por biometría/patrón del dispositivo. */
export async function enableBiometric(): Promise<void> {
  await Keychain.setGenericPassword('docash', 'unlocked', {
    service: SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function disableBiometric(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch {
    // noop
  }
}

/** Lanza el prompt biométrico; true si el usuario se autentica. */
export async function authenticateBiometric(title: string): Promise<boolean> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: SERVICE,
      authenticationPrompt: { title },
    });
    return creds !== false;
  } catch {
    return false;
  }
}
