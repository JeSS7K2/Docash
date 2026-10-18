import React from 'react';
import { View } from 'react-native';
import { Canvas, Path, Skia, Line, vec } from '@shopify/react-native-skia';
import type { FlowPoint } from '../../utils/flow';
import { usePalette } from '../../theme';

interface FlowChartProps {
  points: FlowPoint[];
  width: number;
  height?: number;
}

/** Curvas suaves de ingresos/gastos por día (Skia). */
export default function FlowChart({ points, width, height = 130 }: FlowChartProps) {
  const palette = usePalette();
  if (points.length < 2) {
    return <View style={{ width, height }} />;
  }
  const padX = 4;
  const padTop = 10;
  const padBottom = 6;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const max = Math.max(1, ...points.map(p => Math.max(p.incomeCents, p.expenseCents)));
  const n = points.length;
  const xFor = (i: number) => padX + (i / (n - 1)) * innerW;
  const yFor = (v: number) => padTop + innerH - (v / max) * innerH;

  const buildPath = (key: 'incomeCents' | 'expenseCents') => {
    const path = Skia.Path.Make();
    for (let i = 0; i < n; i++) {
      const x = xFor(i);
      const y = yFor(points[i][key]);
      if (i === 0) {
        path.moveTo(x, y);
      } else {
        const px = xFor(i - 1);
        const py = yFor(points[i - 1][key]);
        const cx = (px + x) / 2;
        path.cubicTo(cx, py, cx, y, x, y);
      }
    }
    return path;
  };

  const gridColor = palette.track;
  const rows = 4;

  return (
    <Canvas style={{ width, height }} testID="flow-chart">
      {Array.from({ length: rows + 1 }, (_, i) => {
        const y = padTop + (i / rows) * innerH;
        return (
          <Line key={`g${i}`} p1={vec(padX, y)} p2={vec(width - padX, y)} color={gridColor} strokeWidth={1} />
        );
      })}
      <Path path={buildPath('incomeCents')} style="stroke" strokeWidth={2.5} color={palette.income} strokeCap="round" strokeJoin="round" />
      <Path path={buildPath('expenseCents')} style="stroke" strokeWidth={2.5} color={palette.expense} strokeCap="round" strokeJoin="round" />
    </Canvas>
  );
}
