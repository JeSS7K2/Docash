/* eslint-disable react-native/no-inline-styles -- el widget exige style inline */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { formatWidgetMoney, type WidgetSnapshot } from '../state/widgetData';
import { widgetPalette } from './theme';
import { translate } from '../i18n';

function actionPill(text: string, uri: string, color: `#${string}`) {
  return (
    <TextWidget
      text={text}
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        backgroundColor: color,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
      }}
    />
  );
}

/** Widget de entrada rápida: saldo + botones ingreso/gasto (abren DETALLES). */
export function QuickAddWidget({ snapshot }: { snapshot: WidgetSnapshot }) {
  const p = widgetPalette(snapshot.dark);
  const loc = snapshot.locale;
  const amount = snapshot.showBalance
    ? formatWidgetMoney(snapshot.balanceCents, snapshot.currency, snapshot.rate, loc)
    : '••••';
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: p.paper,
        borderRadius: 16,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
      <TextWidget text="Docash" style={{ fontSize: 12, color: p.muted }} />
      <TextWidget text={amount} style={{ fontSize: 24, color: p.ink, fontWeight: '700', marginTop: 4 }} />
      <FlexWidget style={{ flexDirection: 'row', flexGap: 10, width: 'match_parent', marginTop: 12 }}>
        {actionPill(`+ ${translate(loc, 'entry.income')}`, 'docash://add?kind=income', p.income)}
        {actionPill(`- ${translate(loc, 'entry.expense')}`, 'docash://add?kind=expense', p.expense)}
      </FlexWidget>
    </FlexWidget>
  );
}
