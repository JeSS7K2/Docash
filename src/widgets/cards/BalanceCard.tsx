/* eslint-disable react-native/no-inline-styles -- el widget exige style inline */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { formatWidgetMoney, type WidgetSnapshot } from '../../state/widgetData';
import type { WidgetPalette } from '../theme';

export function BalanceCard({ snapshot, p }: { snapshot: WidgetSnapshot; p: WidgetPalette }) {
  const amount = snapshot.showBalance
    ? formatWidgetMoney(snapshot.balanceCents, snapshot.currency, snapshot.rate, snapshot.locale)
    : '••••';
  return (
    <FlexWidget
      style={{ height: 'match_parent', width: 'match_parent', flexDirection: 'column', justifyContent: 'center' }}>
      <TextWidget text="Docash" style={{ fontSize: 12, color: p.muted }} />
      <TextWidget
        text={amount}
        style={{ fontSize: 26, color: p.ink, fontWeight: '700', marginTop: 4 }}
      />
    </FlexWidget>
  );
}
