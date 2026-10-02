import React from 'react';
import { Canvas, Rect } from '@shopify/react-native-skia';
import type { TrendBucket } from '../../utils/trend';
import { usePalette } from '../../theme';

interface TrendChartProps {
  buckets: TrendBucket[];
  width: number;
  height?: number;
}

/** Barras de gasto por bucket (Skia, render en UI-thread). */
export default function TrendChart({ buckets, width, height = 80 }: TrendChartProps) {
  const palette = usePalette();
  if (buckets.length === 0) {
    return null;
  }
  const gap = 2;
  const barWidth = Math.max((width - gap * (buckets.length - 1)) / buckets.length, 1);
  const max = Math.max(...buckets.map(b => b.valueCents), 0);
  if (max <= 0) {
    return null;
  }

  return (
    <Canvas style={{ width, height }} testID="trend-chart">
      {buckets.map((b, i) => {
        const h = Math.max((b.valueCents / max) * (height - 4), b.valueCents > 0 ? 3 : 1);
        return (
          <Rect
            key={i}
            x={i * (barWidth + gap)}
            y={height - h}
            width={barWidth}
            height={h}
            color={b.valueCents > 0 ? palette.expense : palette.track}
          />
        );
      })}
    </Canvas>
  );
}
