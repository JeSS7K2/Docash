import { rangeDays, type FlowRange } from '../utils/flow';
import type { WidgetFlowPointDTO } from '../state/widgetData';
import type { WidgetPalette } from './theme';

/** Últimos N días del snapshot según el rango pedido. */
export function sliceFlow(flow: WidgetFlowPointDTO[], range: FlowRange): WidgetFlowPointDTO[] {
  const n = rangeDays(range);
  return flow.slice(Math.max(0, flow.length - n));
}

function smoothPath(values: number[], max: number, width: number, height: number): string {
  const n = values.length;
  if (n < 2) {
    return '';
  }
  const xFor = (i: number) => (i / (n - 1)) * width;
  const yFor = (v: number) => height - (v / max) * height;
  let d = `M ${xFor(0).toFixed(1)} ${yFor(values[0]).toFixed(1)}`;
  for (let i = 1; i < n; i++) {
    const x = xFor(i);
    const y = yFor(values[i]);
    const px = xFor(i - 1);
    const py = yFor(values[i - 1]);
    const cx = ((px + x) / 2).toFixed(1);
    d += ` C ${cx} ${py.toFixed(1)}, ${cx} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

/** SVG (para SvgWidget) con rejilla + curvas de ingreso/gasto. */
export function flowChartSvg(
  flow: WidgetFlowPointDTO[],
  range: FlowRange,
  width: number,
  height: number,
  p: WidgetPalette,
): string {
  const pts = sliceFlow(flow, range);
  const max = Math.max(1, ...pts.map(x => Math.max(x.incomeCents, x.expenseCents)));
  const income = smoothPath(pts.map(x => x.incomeCents), max, width, height);
  const expense = smoothPath(pts.map(x => x.expenseCents), max, width, height);
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map(f => `<line x1="0" y1="${(f * height).toFixed(1)}" x2="${width}" y2="${(f * height).toFixed(1)}" stroke="${p.track}" stroke-width="1"/>`)
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    grid +
    `<path d="${expense}" fill="none" stroke="${p.expense}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${income}" fill="none" stroke="${p.income}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
    '</svg>'
  );
}
