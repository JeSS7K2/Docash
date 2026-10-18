/* eslint-disable react-native/no-inline-styles -- el widget exige style inline */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { formatWidgetMoney, type WidgetSnapshot } from '../../state/widgetData';
import type { WidgetPalette } from '../theme';
import { translate } from '../../i18n';

export function BudgetsCard({ snapshot, width, p }: { snapshot: WidgetSnapshot; width: number; p: WidgetPalette }) {
  const loc = snapshot.locale;
  const inner = Math.max(40, width - 28);
  return (
    <FlexWidget
      style={{ height: 'match_parent', width: 'match_parent', flexDirection: 'column', justifyContent: 'center' }}>
      <TextWidget
        text={translate(loc, 'budgets.title')}
        style={{ fontSize: 12, color: p.muted, marginBottom: 8 }}
      />
      {snapshot.budgets.slice(0, 3).map(b => {
        const pct = b.limitCents > 0 ? Math.min(b.spentCents / b.limitCents, 1) : 0;
        const over = b.limitCents > 0 && b.spentCents > b.limitCents;
        return (
          <FlexWidget key={b.categoryId} style={{ width: 'match_parent', marginBottom: 8 }}>
            <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
              <TextWidget text={b.name} maxLines={1} truncate="END" style={{ fontSize: 13, color: p.ink, fontWeight: '600' }} />
              <TextWidget
                text={`${formatWidgetMoney(b.spentCents, snapshot.currency, snapshot.rate, loc)} / ${formatWidgetMoney(b.limitCents, snapshot.currency, snapshot.rate, loc)}`}
                style={{ fontSize: 11, color: over ? p.expense : p.muted }}
              />
            </FlexWidget>
            <FlexWidget style={{ height: 6, width: 'match_parent', backgroundColor: p.track, borderRadius: 3, marginTop: 4 }}>
              <FlexWidget style={{ height: 6, width: Math.max(2, inner * pct), backgroundColor: over ? p.expense : p.primary, borderRadius: 3 }} />
            </FlexWidget>
          </FlexWidget>
        );
      })}
    </FlexWidget>
  );
}
