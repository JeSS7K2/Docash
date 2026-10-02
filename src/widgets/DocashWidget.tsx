/* eslint-disable react-native/no-inline-styles -- el widget exige style inline */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { formatWidgetBalance, readWidgetSnapshot } from '../state/widgetData';

/** Widget de home: balance total + acceso a la app. */
export function DocashWidget() {
  const amount = formatWidgetBalance(readWidgetSnapshot());
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#121417',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
      <TextWidget text="Docash" style={{ fontSize: 12, color: '#9AA3AF' }} />
      <TextWidget
        text={amount}
        style={{ fontSize: 26, color: '#F2F4F7', fontWeight: '500', marginTop: 4 }}
      />
    </FlexWidget>
  );
}
