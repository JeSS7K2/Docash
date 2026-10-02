import React, { useMemo } from 'react';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import type { PieSlice } from '../db/queries';
import { usePalette } from '../theme';
import { monthDonutSize, monthDonutStroke } from '../theme/tokens';

interface PieChartProps {
  slices: PieSlice[];
  size?: number;
}

const GAP_DEG = 2;

/**
 * Donut estático con Skia (render en UI-thread, 0 bridge por frame).
 * Paths memoizados; el morph animado es una mejora futura.
 */
export default function PieChart({ slices, size = monthDonutSize }: PieChartProps) {
  const palette = usePalette();
  const total = useMemo(() => slices.reduce((acc, s) => acc + s.totalCents, 0), [slices]);

  const paths = useMemo(() => {
    const stroke = monthDonutStroke;
    const pad = stroke / 2 + 2;
    const oval = { x: pad, y: pad, width: size - pad * 2, height: size - pad * 2 };
    if (total <= 0) {
      const track = Skia.Path.Make();
      track.addArc(oval, 0, 360);
      return [{ path: track, color: palette.track }];
    }
    let angle = -90;
    return slices.map(s => {
      const fraction = s.totalCents / total;
      const sweep = Math.max(fraction * 360 - GAP_DEG, 1);
      const path = Skia.Path.Make();
      path.addArc(oval, angle, sweep);
      angle += fraction * 360;
      return { path, color: s.color };
    });
  }, [slices, total, size, palette.track]);

  return (
    <Canvas style={{ width: size, height: size }} testID="pie-chart">
      {paths.map((p, i) => (
        <Path
          key={i}
          path={p.path}
          color={p.color}
          style="stroke"
          strokeWidth={monthDonutStroke}
          strokeCap="butt"
        />
      ))}
    </Canvas>
  );
}
