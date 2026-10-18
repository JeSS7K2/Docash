import { MMKV } from 'react-native-mmkv';
import type { FlowRange } from '../utils/flow';

// Estado de UI del widget por instancia (slide actual, rango del gráfico).
const store = new MMKV({ id: 'docash-widget-state' });

const slideKey = (id: number) => `slide-${id}`;
const rangeKey = (id: number) => `range-${id}`;

export function getSlide(widgetId: number): number {
  return store.getNumber(slideKey(widgetId)) ?? 0;
}

export function setSlide(widgetId: number, index: number): void {
  store.set(slideKey(widgetId), index);
}

export function getFlowRange(widgetId: number): FlowRange {
  return (store.getString(rangeKey(widgetId)) as FlowRange) ?? '1M';
}

export function setFlowRange(widgetId: number, range: FlowRange): void {
  store.set(rangeKey(widgetId), range);
}
