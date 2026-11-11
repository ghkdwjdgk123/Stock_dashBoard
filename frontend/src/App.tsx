import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, ChevronDown, Database, LayoutDashboard, Search, ShieldCheck, TrendingUp } from 'lucide-react'
import { InfiniteSentinel } from './components/InfiniteSentinel'
import { ListPager } from './components/ListPager'
import { PriceChart } from './components/PriceChart'
import { Skeleton } from './components/Skeleton'
import { DEMO_MODE, fetchCandles, fetchStocks } from './lib/api'
import type { Candle, Stock } from './lib/api'
import './styles.css'

const PAGE_SIZE = 10
const won = (n: number) => new Intl.NumberFormat('ko-KR').format(n)
type Mode = 'pages' | 'infinite'

export default function App() {
  const [interval, setIntervalMinutes] = useState(1)
  const [selectedCode, setSelectedCode] = useState('005930')
  const [stocks, setStocks] = useState<Stock[]>([])
  const [mode, setMode] = useState<Mode>('pages')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingStocks, setLoadingStocks] = useState(false)
  const [stockError, setStockError] = useState('')
  const [candles, setCandles] = useState<Candle[]>([])
  const [loadingCandles, setLoadingCandles] = useState(false)
  const [candleError, setCandleError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const ac = new AbortController()
    let ignore = false
    setLoadingStocks(true)
    setStockError('')
    fetchStocks(PAGE_SIZE, page * PAGE_SIZE, ac.signal)
      .then(rows => {
        if (ignore) return
        setStocks(old => mode === 'infinite' && page > 0 ? [...old, ...rows] : rows)
        setHasMore(rows.length === PAGE_SIZE)
      })
      .catch(e => { if (!ignore && e.name !== 'AbortError') setStockError(e.message) })
      .finally(() => { if (!ignore) setLoadingStocks(false) })
    return () => { ignore = true; ac.abort() }
  }, [page, mode])

  useEffect(() => {
    const ac = new AbortController()
    let ignore = false
    setLoadingCandles(true)
    setCandleError('')
    setCandles([])
    fetchCandles(selectedCode, interval, ac.signal)
      .then(rows => { if (!ignore) setCandles(rows) })
      .catch(e => { if (!ignore && e.name !== 'AbortError') setCandleError(e.message) })
      .finally(() => { if (!ignore) setLoadingCandles(false) })
    return () => { ignore = true; ac.abort() }
  }, [selectedCode, interval])

  const loadNext = useCallback(() => {
    if (mode === 'infinite' && hasMore && !loadingStocks) setPage(p => p + 1)
  }, [mode, hasMore, loadingStocks])
  const changeMode = (next: Mode) => { setMode(next); setPage(0); setStocks([]); setHasMore(true) }
  const filtered = useMemo(() => stocks.filter(s => `${s.stockCode} ${s.stockName}`.includes(search.trim())), [stocks, search])
  const selected = stocks.find(s => s.stockCode === selectedCode) || { stockCode: selectedCode, stockName: selectedCode, market: '-' }
  const latest = candles.at(-1)
  const previous = candles.length > 1 ? candles[candles.length - 2] : undefined
  const change = latest && previous ? latest.closePrice - previous.closePrice : 0
  const changePct = previous?.closePrice ? change / previous.closePrice * 100 : 0

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon"><TrendingUp size={22} /></span><div><strong>STOCK <em>INSIGHT</em></strong><small>MARKET INTELLIGENCE</small></div></div>
      <div className="sidebar-section-label">WORKSPACE</div>
      <div className="nav-link active"><LayoutDashboard size={18} /> Dashboard</div>
      <div className="nav-link inactive"><BarChart3 size={18} /> Market Analysis <span>예정</span></div>
      <div className="nav-link inactive"><Database size={18} /> Data Collector <span>예정</span></div>
      <div className="sidebar-bottom"><ShieldCheck size={18}/><div><b>Backend-managed auth</b><small>인증/역할관리 확장 예정</small></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <b>Dashboard</b></div><div className="top-actions"><span className="connection"><span className="status-dot"/>{DEMO_MODE ? 'DEMO DATA' : 'LIVE API'}</span><span className="avatar">SI</span></div></header>
      <div className="content">
        <div className="heading-row"><div><p className="eyebrow">MARKET OVERVIEW</p><h1>주가 분석 대시보드</h1><p className="muted">키움 REST API 기반 주가 데이터 수집 및 시각화</p></div><span className="date-chip"><Activity size={15}/> {new Date().toLocaleDateString('ko-KR')} 기준</span></div>
        {DEMO_MODE && <div className="demo-banner"><span className="demo-dot" /> 데모 모드: 아래 가격·거래량은 가상 샘플 데이터이며 실시간 시세가 아닙니다.</div>}
        <div className="stats-grid">
          <section className="stat-card"><div className="stat-head">선택 종목 <BarChart3 size={17}/></div><div className="stat-value">{selected.stockName}</div><div className="stat-sub">{selected.stockCode} · {selected.market}</div></section>
          <section className="stat-card"><div className="stat-head">최근 종가 <TrendingUp size={17}/></div><div className="stat-value">{latest ? `${won(latest.closePrice)}원` : '—'}</div><div className={`stat-sub ${change >= 0 ? 'positive' : 'negative'}`}>{latest && previous ? <>{change >= 0 ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>} {won(Math.abs(change))} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)</> : '수집 대기'}</div></section>
          <section className="stat-card"><div className="stat-head">최근 거래량 <Activity size={17}/></div><div className="stat-value">{latest ? won(latest.volume) : '—'}</div><div className="stat-sub">최근 {interval}분 캔들 기준</div></section>
          <section className="stat-card"><div className="stat-head">조회 캔들 <Database size={17}/></div><div className="stat-value">{candles.length.toLocaleString('ko-KR')} <small>개</small></div><div className="stat-sub">MySQL 저장 데이터</div></section>
        </div>
        <div className="dashboard-grid">
          <section className="panel chart-panel"><div className="panel-header"><div><p className="panel-overline">PRICE HISTORY</p><h2>종목 가격 추이</h2></div><div className="intervals">{[1, 3, 5, 10, 30, 60].map(n => <button key={n} className={interval === n ? 'selected' : ''} onClick={() => setIntervalMinutes(n)}>{n}분</button>)}</div></div>
            {loadingCandles ? <Skeleton rows={4} height={85} /> : candleError ? <div className="empty-state error">{candleError}<small>API 서버 및 CORS 설정을 확인하세요.</small></div> : candles.length === 0 ? <div className="empty-state">아직 저장된 분봉이 없습니다.<small>collector로 종목 데이터를 수집하면 차트가 표시됩니다.</small></div> : <PriceChart candles={candles}/>}</section>
          <section className="panel watchlist-panel"><div className="panel-header"><div><p className="panel-overline">WATCHLIST</p><h2>종목 목록</h2></div><ChevronDown size={17} className="muted-icon" /></div>
            <div className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="종목명 또는 코드 검색 (로드된 목록)" aria-label="종목 검색"/></div>
            <div className="list-mode"><button className={mode === 'pages' ? 'on' : ''} onClick={() => changeMode('pages')}>페이지</button><button className={mode === 'infinite' ? 'on' : ''} onClick={() => changeMode('infinite')}>무한 스크롤</button></div>
            <div className="watchlist-content">{stockError && <div className="inline-error">{stockError}</div>}{filtered.map(stock => <button className={`stock-row ${selectedCode === stock.stockCode ? 'chosen' : ''}`} key={stock.stockCode} onClick={() => setSelectedCode(stock.stockCode)}><span className="stock-avatar">{stock.stockName.slice(0, 1)}</span><span className="stock-details"><b>{stock.stockName}</b><small>{stock.stockCode} · {stock.market}</small></span><span className="stock-indicator" /></button>)}{loadingStocks && <Skeleton rows={3} height={49} />}{!loadingStocks && filtered.length === 0 && !stockError && <div className="empty-list">검색 결과 없음</div>}<InfiniteSentinel enabled={mode === 'infinite' && hasMore && !loadingStocks && !stockError} onVisible={loadNext} /></div>
            {mode === 'pages' && <ListPager page={page} canNext={hasMore} onPrev={() => setPage(p => Math.max(0, p-1))} onNext={() => setPage(p => p+1)}/>}</section>
        </div>
        <section className="panel table-panel"><div className="panel-header"><div><p className="panel-overline">OHLCV DATA</p><h2>최근 분봉 데이터</h2></div><span className="table-count">최신 {Math.min(candles.length, 8)}개 표시</span></div>
          <div className="table-wrapper"><table><thead><tr><th>체결 시각 (KST)</th><th>시가</th><th>고가</th><th>저가</th><th>종가</th><th>거래량</th></tr></thead><tbody>{[...candles].reverse().slice(0, 8).map(c => <tr key={c.candleTime}><td>{c.candleTime.replace('T', ' ').slice(0, 16)}</td><td>{won(c.openPrice)}</td><td>{won(c.highPrice)}</td><td>{won(c.lowPrice)}</td><td className="accent-cell">{won(c.closePrice)}</td><td>{won(c.volume)}</td></tr>)}</tbody></table>{!loadingCandles && candles.length === 0 && <div className="no-rows">데이터가 없습니다.</div>}</div>
        </section>
        <footer>STOCK INSIGHT · V0.1 MVP · 데이터 수집은 키움 API 이용 조건을 준수해야 합니다.</footer>
      </div>
    </main>
  </div>
}
