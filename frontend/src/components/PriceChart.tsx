import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts'
import type { Candle } from '../lib/api'

const won = (n: number) => new Intl.NumberFormat('ko-KR').format(n)
const shortTime = (value: string) => value.slice(5, 16).replace('T', ' ')

type Props = { candles: Candle[] }
export function PriceChart({ candles }: Props) {
  return <div className="chart-combo">
    <div className="price-chart" role="img" aria-label="종가 추이 선 그래프">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={candles} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c3ab" stopOpacity={0.24}/>
            <stop offset="95%" stopColor="#22c3ab" stopOpacity={0}/>
          </linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#233047" strokeDasharray="3 5" />
          <XAxis dataKey="candleTime" tickFormatter={shortTime} tick={{ fill: '#8997b2', fontSize: 11 }} minTickGap={30} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8997b2', fontSize: 11 }} tickFormatter={n => won(n)} domain={['dataMin - 300', 'dataMax + 300']} width={80} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#1b2538', border: '1px solid #38455c', color: '#fff', borderRadius: 9 }} labelFormatter={value => shortTime(String(value))} formatter={value => [`${won(Number(value))}원`, '종가']} />
          <Area type="monotone" dataKey="closePrice" stroke="#28d7bc" strokeWidth={2.3} fill="url(#priceFill)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="volume-chart" role="img" aria-label="분봉 거래량 막대 그래프">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={candles} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
          <XAxis dataKey="candleTime" hide />
          <YAxis tick={{ fill: '#8997b2', fontSize: 10 }} tickFormatter={n => `${Math.round(n / 1000)}k`} width={80} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#ffffff11' }} contentStyle={{ background: '#1b2538', border: '1px solid #38455c', color: '#fff', borderRadius: 9 }} labelFormatter={value => shortTime(String(value))} formatter={value => [won(Number(value)), '거래량']} />
          <Bar dataKey="volume" fill="#526b96" maxBarSize={14} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
}
