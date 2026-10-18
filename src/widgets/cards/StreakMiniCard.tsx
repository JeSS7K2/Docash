/* eslint-disable react-native/no-inline-styles -- el widget exige style inline */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from '../../state/widgetData';
import type { WidgetPalette } from '../theme';
import { translate } from '../../i18n';

export function StreakMiniCard({ snapshot, p }: { snapshot: WidgetSnapshot; p: WidgetPalette }) {
  const loc = snapshot.locale;
  const s = snapshot.streak;
  if (!s) {
    return <TextWidget text={translate(loc, 'streak.activateTitle')} style={{ fontSize: 14, color: p.ink }} />;
  }
  const title = !s.enabled
    ? translate(loc, 'streak.activateTitle')
    : s.todayConfirmed
      ? translate(loc, 'streak.todayDone')
      : translate(loc, 'streak.reviewToday');
  return (
    <FlexWidget
      style={{ height: 'match_parent', width: 'match_parent', flexDirection: 'column', justifyContent: 'center' }}>
      <TextWidget text={title} style={{ fontSize: 14, color: p.ink, fontWeight: '700' }} />
      <TextWidget
        text={translate(loc, 'streak.streakCount', { count: s.currentStreak })}
        style={{ fontSize: 12, color: p.muted, marginTop: 4 }}
      />
      <FlexWidget style={{ flexDirection: 'row', marginTop: 10, flexGap: 6 }}>
        {s.week.map(day => (
          <FlexWidget
            key={day.label}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: day.status === 'CONFIRMED' ? p.primary : day.status === 'REST' ? p.track : p.faint,
            }}>
            <TextWidget
              text={day.label}
              style={{ fontSize: 9, color: day.status === 'CONFIRMED' ? '#FFFFFF' : p.muted }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
