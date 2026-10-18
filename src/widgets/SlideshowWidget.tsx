/* eslint-disable react-native/no-inline-styles -- el widget exige style inline */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from '../state/widgetData';
import { widgetPalette } from './theme';
import { getFlowRange, getSlide } from './widgetState';
import { BalanceCard } from './cards/BalanceCard';
import { BudgetsCard } from './cards/BudgetsCard';
import { GoalsCard } from './cards/GoalsCard';
import { StreakMiniCard } from './cards/StreakMiniCard';
import { FlowChartCard } from './cards/FlowChartCard';

/** Claves de las tarjetas visibles (presupuestos/metas solo si existen). */
export function slideKeys(snapshot: WidgetSnapshot | null): string[] {
  const keys = ['balance'];
  if (snapshot && snapshot.budgets.length > 0) {
    keys.push('budgets');
  }
  if (snapshot && snapshot.goals.length > 0) {
    keys.push('goals');
  }
  keys.push('streak', 'flow');
  return keys;
}

export function SlideshowWidget({
  snapshot,
  widgetId,
  width,
}: {
  snapshot: WidgetSnapshot;
  widgetId: number;
  width: number;
}) {
  const p = widgetPalette(snapshot.dark);
  const keys = slideKeys(snapshot);
  const index = Math.min(Math.max(0, getSlide(widgetId)), keys.length - 1);
  const key = keys[index];

  let card: React.JSX.Element = <BalanceCard snapshot={snapshot} p={p} />;
  if (key === 'budgets') {
    card = <BudgetsCard snapshot={snapshot} width={width} p={p} />;
  } else if (key === 'goals') {
    card = <GoalsCard snapshot={snapshot} width={width} p={p} />;
  } else if (key === 'streak') {
    card = <StreakMiniCard snapshot={snapshot} p={p} />;
  } else if (key === 'flow') {
    card = <FlowChartCard snapshot={snapshot} width={width} range={getFlowRange(widgetId)} p={p} />;
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: p.paper,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
      }}>
      <FlexWidget style={{ flex: 1, width: 'match_parent' }}>{card}</FlexWidget>
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: 'match_parent', marginTop: 6, flexGap: 4 }}>
        <TextWidget text="‹" clickAction="slide:prev" style={{ fontSize: 16, color: p.muted, paddingHorizontal: 8 }} />
        {keys.map((k, i) => (
          <TextWidget
            key={k}
            text="•"
            clickAction={`slide:${i}`}
            style={{ fontSize: 12, color: i === index ? p.primary : p.track, paddingHorizontal: 2 }}
          />
        ))}
        <TextWidget text="›" clickAction="slide:next" style={{ fontSize: 16, color: p.muted, paddingHorizontal: 8 }} />
      </FlexWidget>
    </FlexWidget>
  );
}
