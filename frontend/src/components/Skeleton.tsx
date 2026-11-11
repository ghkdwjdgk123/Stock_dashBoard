type Props = { rows?: number; height?: number }
export function Skeleton({ rows = 5, height = 40 }: Props) {
  return <div className="skeleton-stack" aria-label="불러오는 중" aria-busy="true">
    {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" style={{ height }} />)}
  </div>
}
