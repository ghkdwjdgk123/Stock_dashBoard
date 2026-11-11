export type Stock = { stockCode: string; stockName: string; market: string }
export type Candle = {
  candleTime: string; intervalMinutes: number; openPrice: number
  highPrice: number; lowPrice: number; closePrice: number; volume: number
}

export const DEMO_MODE = import.meta.env.VITE_USE_DEMO === 'true'
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

const demoStocks: Stock[] = [
  { stockCode: '005930', stockName: '삼성전자', market: 'KOSPI' },
  { stockCode: '000660', stockName: 'SK하이닉스', market: 'KOSPI' },
  ...Array.from({ length: 40 }, (_, i) => ({
    stockCode: String(900001 + i), stockName: `데모 종목 ${i + 1}`, market: 'DEMO',
  })),
]

function demoCandles(code: string, interval: number): Candle[] {
  const seed = Number(code.slice(-3))
  const start = code === '005930' ? 72300 : 185000
  return Array.from({ length: 100 }, (_, i) => {
    const price = Math.round(start + Math.sin(i / 8 + seed) * start * 0.012 + (i - 40) * start * 0.00022)
    const open = price + Math.round(Math.sin(i * 1.73) * start * 0.002)
    const high = Math.max(open, price) + Math.round(100 + (i % 4) * 80)
    const low = Math.max(1, Math.min(open, price) - Math.round(90 + (i % 5) * 60))
    const sessionMinutes = 390
    const offset = i * interval
    const date = new Date(Date.UTC(2026, 10, 10 + Math.floor(offset / sessionMinutes)))
    const dateText = date.toISOString().slice(0, 10)
    const localMinute = 9 * 60 + (offset % sessionMinutes)
    const hour = Math.floor(localMinute / 60)
    const min = localMinute % 60
    return {
      candleTime: `${dateText}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`,
      intervalMinutes: interval, openPrice: open, highPrice: high,
      lowPrice: low, closePrice: price, volume: 12000 + (i * 73 % 21000),
    }
  })
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`API 요청 실패 (HTTP ${response.status})`)
  return response.json() as Promise<T>
}

export async function fetchStocks(limit = 10, offset = 0, signal?: AbortSignal): Promise<Stock[]> {
  if (DEMO_MODE) return demoStocks.slice(offset, offset + limit)
  return getJson<Stock[]>(`/api/v1/stocks?limit=${limit}&offset=${offset}`, signal)
}

export async function fetchCandles(code: string, interval: number, signal?: AbortSignal): Promise<Candle[]> {
  if (DEMO_MODE) return demoCandles(code, interval)
  return getJson<Candle[]>(`/api/v1/stocks/${encodeURIComponent(code)}/candles?interval=${interval}&limit=400`, signal)
}
