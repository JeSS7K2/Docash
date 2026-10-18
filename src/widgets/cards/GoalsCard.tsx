/* eslint-disable react-native/no-inline-styles -- el widget exige style inline */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { formatWidgetMoney, type WidgetSnapshot } from '../../state/widgetData';
import type { WidgetPalette } from '../theme';
import { translate } from '../../i18n';

export function GoalsCard({ snapshot, width, p }: { snapshot: WidgetSnapshot; width: number; p: WidgetPalette }) {
  const loc = snapshot.locale;
  const inner = Math.max(40, width - 28);
  return (
    <FlexWidget
      style={{ height: 'match_parent', width: 'match_parent', flexDirection: 'column', justifyContent: 'center' }}>
      <TextWidget
        text={translate(loc, 'goals.title')}
        style={{ fontSize: 12, color: p.muted, marginBottom: 8 }}
      />
      {snapshot.goals.slice(0, 3).map(g => {
        const pct = g.targetCents > 0 ? Math.min(g.progressCents / g.targetCents, 1) : 0;
        const reached = g.progressCents >= g.targetCents;
        return (
          <FlexWidget key={g.name} style={{ width: 'match_parent', marginBottom: 8 }}>
            <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
              <TextWidget text={g.name} maxLines={1} truncate="END" style={{ fontSize: 13, color: p.ink, fontWeight: '600' }} />
              <TextWidget
                text={`${formatWidgetMoney(g.progressCents, snapshot.currency, snapshot.rate, loc)} / ${formatWidgetMoney(g.targetCents, snapshot.currency, snapshot.rate, loc)}`}
                style={{ fontSize: 11, color: reached ? p.income : p.muted }}
              />
            </FlexWidget>
            <FlexWidget style={{ height: 6, width: 'match_parent', backgroundColor: p.track, borderRadius: 3, marginTop: 4 }}>
              <FlexWidget style={{ height: 6, width: Math.max(2, inner * pct), backgroundColor: reached ? p.income : p.primary, borderRadius: 3 }} />
            </FlexWidget>
          </FlexWidget>
        );
      })}
    </FlexWidget>
  );
}
