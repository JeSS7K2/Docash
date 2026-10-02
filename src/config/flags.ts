// Feature flags de producto. Cambiar aquí + rebuild para activar.
//
// Fase 3 implementa el motor de cuentas y transferencias, pero su UI está
// desactivada: la app se comporta como mono-cuenta (Cash) hasta que se
// active explícitamente.
export const ACCOUNTS_UI = false as const;
export const TRANSFERS_UI = false as const;
/** Datos de ejemplo (1 mes) para ver gráficas. Poner false para quitarlos. */
export const MOCK_DATA = false as const;
