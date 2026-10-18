import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { readWidgetSnapshot, type WidgetSnapshot } from '../state/widgetData';
import { slideKeys, SlideshowWidget } from './SlideshowWidget';
import { QuickAddWidget } from './QuickAddWidget';
import { getSlide, setFlowRange, setSlide } from './widgetState';
import { useSettings } from '../state/useSettings';
import type { FlowRange } from '../utils/flow';

function emptySnapshot(): WidgetSnapshot {
  const { currency, exchangeRate, locale, widgetShowBalance } = useSettings.getState();
  return {
    balanceCents: 0,
    currency,
    rate: exchangeRate,
    locale,
    showBalance: widgetShowBalance,
    dark: false,
    budgets: [],
    goals: [],
    streak: null,
    flow: [],
    categories: [],
    notes: [],
  };
}

function render(props: WidgetTaskHandlerProps, snapshot: WidgetSnapshot): void {
  if (props.widgetInfo.widgetName === 'QuickAddWidget') {
    props.renderWidget(<QuickAddWidget snapshot={snapshot} />);
    return;
  }
  props.renderWidget(
    <SlideshowWidget
      snapshot={snapshot}
      widgetId={props.widgetInfo.widgetId}
      width={props.widgetInfo.width}
    />,
  );
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const snapshot = readWidgetSnapshot() ?? emptySnapshot();
  const widgetId = props.widgetInfo.widgetId;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      render(props, snapshot);
      break;
    case 'WIDGET_CLICK': {
      const action = props.clickAction ?? '';
      if (action.startsWith('slide:')) {
        const keys = slideKeys(snapshot);
        const arg = action.slice('slide:'.length);
        let index = getSlide(widgetId);
        if (arg === 'next') {
          index = (index + 1) % keys.length;
        } else if (arg === 'prev') {
          index = (index - 1 + keys.length) % keys.length;
        } else {
          index = Math.min(Math.max(0, parseInt(arg, 10) || 0), keys.length - 1);
        }
        setSlide(widgetId, index);
        render(props, snapshot);
      } else if (action.startsWith('flow-range:')) {
        setFlowRange(widgetId, action.slice('flow-range:'.length) as FlowRange);
        render(props, snapshot);
      }
      break;
    }
    default:
      break;
  }
}
