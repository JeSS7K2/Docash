// Buffer del teclado numérico: puro, testeable, sin dependencias.
// El buffer siempre es válido para toCents ("0", "10", "10.5").
export type NumpadKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | 'back';

const MAX_INTEGER_DIGITS = 9;
const MAX_DECIMALS = 2;

export const INITIAL_BUFFER = '0';

/** Convierte céntimos a buffer editable (8800 -> "88", 8850 -> "88.5"). */
export function centsToBuffer(cents: number): string {
  const abs = Math.abs(cents);
  const int = Math.floor(abs / 100);
  const dec = abs % 100;
  if (dec === 0) {
    return String(int);
  }
  const decStr = String(dec).padStart(2, '0').replace(/0$/, '');
  return `${int}.${decStr}`;
}

export function applyKey(buffer: string, key: NumpadKey): string {
  if (key === 'back') {
    if (buffer.length <= 1) {
      return INITIAL_BUFFER;
    }
    const next = buffer.slice(0, -1);
    return next === '' || next === '-' ? INITIAL_BUFFER : next;
  }
  if (key === '.') {
    return buffer.includes('.') ? buffer : `${buffer}.`;
  }
  const [intPart, decPart] = buffer.split('.');
  if (decPart !== undefined) {
    return decPart.length >= MAX_DECIMALS ? buffer : `${buffer}${key}`;
  }
  const cleanInt = intPart === '0' ? '' : intPart;
  if (cleanInt.length >= MAX_INTEGER_DIGITS) {
    return buffer;
  }
  return `${cleanInt}${key}`;
}
