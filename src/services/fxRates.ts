// Tasa de cambio online (best-effort). Local-first: si falla, se conserva el
// último valor cacheado en ajustes. Base USD.
export async function fetchExchangeRate(currency: string): Promise<number | null> {
  if (currency === 'USD') {
    return 1;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.[currency];
    return typeof rate === 'number' && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}
