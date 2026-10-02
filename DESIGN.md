# DESIGN.md — Docash (clon Monefy, Android, Local-First)

Sistema visual vigente, extraído de lo que la app renderiza. Toda UI nueva
debe reutilizar estos tokens (`src/theme/`) y estos componentes
(`src/ui/components/`). Prohibido inventar paleta, tipografía o radios.

## Principios (impeccable)

1. **Una jerarquía por pantalla.** En Home solo el balance gana (34/800).
   Nada compite con él: ni el donut, ni la lista, ni los botones.
2. **Una acción por zona.** Dos FABs abajo: gasto (rojo) / ingreso (verde).
   Sin tarjetas dentro de tarjetas, sin chips decorativos.
3. **Etiquetas visibles, nunca solo placeholder.**
4. **Touch targets ≥ 48dp** en todo lo pulsable.
5. **Iconos Feather** (`react-native-feather`), nunca emojis en la UI.

## Color

Paletas claro/oscuro en `src/theme/palette.ts`. Toda la UI consume colores
vía `usePalette()` / `useThemedStyles(makeStyles)` — nunca constantes sueltas.

| Rol | light | dark |
|---|---|---|
| `paper` (fondo) | `#FFFFFF` | `#121417` |
| `ink` (texto) | `#1A1D21` | `#F2F4F7` |
| `muted` | `#7A828E` | `#9AA3AF` |
| `faint` (superficie) | `#F1F3F6` | `#1E232B` |
| `track` | `#E8EAF0` | `#2A2F38` |
| `expense` | `#D32F2F` | `#FF6B6B` |
| `income` | `#2E7D32` | `#4ADE80` |
| `transfer` | `#546E7A` | `#94A3B8` |
| `border` / `overlay` | `#E8EAF0` / 40% | `#2A2F38` / 60% |

### Acento por modal (identidad)

Todos los modales usan `SheetScaffold`: barra de acento, cabecera con tinte
suave, fondo difuminado y cierre por X/backdrop/atrás/deslizar-abajo.

| Modal | Acento |
|---|---|
| Gasto | `expense` (rojo) |
| Ingreso | `income` (verde) |
| Opciones | `primary` (índigo) |
| Presupuestos | `budget` (ámbar) |
| Recurrentes | `recurring` (violeta) |

## Tipografía

System font. Escala: balance 34/800 · título fila 15/600 · cuerpo 13 ·
meta 12 · acción 16/700 · título sheet 18/800.

## Forma y espaciado

Radios: iconos 20 (círculo 40dp) · acciones 14. Espaciado 2/4/8/12/16.
Donut: 220dp, trazo 30, gap 2° entre slices. Sheets: radio superior 20.

## Componentes

Home: `TopBar` (logo de la app + nombre, gear), `BalanceHeader`, `PeriodFilter`
(Day/Week/Month/Year/All + ‹›), `MonthDonut` (Skia), `TrendChart` (Skia),
`TransactionList` (`TxRow` con swipe→borrar), `EntryActions`.

Sheets (todos con `SheetScaffold`): `SettingsSheet` (perfil, tema, idioma,
moneda auto/manual, seguridad, recordatorios, backup), `BudgetsSheet` (lista)
+ `BudgetConfigSheet` (modal de una categoría), `RecurringSheet`,
`EntrySheet` (gasto/ingreso). El PIN se gestiona con un formulario inline
(`PinForm`) que pide el PIN actual para cambiar o quitar.

Otros: `LockScreen` (PIN + biometría), widget Android (`DocashWidget`).

## Notas de producto

- TopBar: **logo de la app** (`src/assets/logo.png`) + nombre; sin avatares.
- Categorías de **ingreso**: solo *Salary* y *Extra* (se retiró "Other").
- **Moneda**: lógica de conversión + tasa automática (fetch/cache) existe,
  pero la UI está **oculta** en Ajustes de momento.
- **Navegación de fechas**: límite inferior = fecha de instalación, o la
  transacción más antigua si se importó un backup anterior.
- **Recordatorios**: diario genérico + uno por recurrente ("mañana toca X",
  el día antes de cada ocurrencia).

## i18n / dinero

`src/i18n` (en/es). Dinero siempre en céntimos; display con `useMoney()`
(moneda + locale + tasa FX). Números/fechas vía `Intl`.
