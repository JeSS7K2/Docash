import type { Currency } from '../state/useSettings';

// Moneda 1:1: no hay conversión de importes, solo cambia el símbolo/local.
// (La infraestructura de tasas queda por si se activa en el futuro.)
export function baseToDisplayCents(baseCents: number, _currency?: Currency, _rate?: number): number {
  return baseCents;
}

export function displayToBaseCents(displayCents: number, _currency?: Currency, _rate?: number): number {
  return displayCents;
}
