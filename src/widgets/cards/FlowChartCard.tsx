/* eslint-disable react-native/no-inline-styles -- el widget exige style inline */
import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from '../../state/widgetData';
import type { WidgetPalette } from '../theme';
import { translate } from '../../i18n';
import { FLOW_RANGES, type FlowRange } from '../../utils/flow';
import { flowChartSvg } from '../flowSvg';

export function FlowChartCard({
  snapshot,
  width,
  range,
  p,
}: {
  snapshot: WidgetSnapshot;
  width: number;
  range: FlowRange;
  p: WidgetPalette;
}) {
  const loc = snapshot.locale;
  const chartW = Math.max(60, width - 28);
  const svg = flowChartSvg(snapshot.flow, range, chartW, 64, p);
  return (
    <FlexWidget
      style={{ height: 'match_parent', width: 'match_parent', flexDirection: 'column', justifyContent: 'center' }}>
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
        <TextWidget text={translate(loc, 'home.flowTitle')} style={{ fontSize: 12, color: p.muted }} />
        <TextWidget text="● / ●" style={{ fontSize: 11, color: p.income }} />
      </FlexWidget>
      <SvgWidget svg={svg} style={{ width: chartW, height: 64, marginTop: 6 }} />
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'center', flexGap: 6, marginTop: 8 }}>
        {FLOW_RANGES.map(r => (
          <TextWidget
            key={r}
            text={r}
            clickAction={`flow-range:${r}`}
            style={{
              fontSize: 11,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              color: r === range ? '#FFFFFF' : p.muted,
              backgroundColor: r === range ? p.primary : p.faint,
            }}
          />
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
