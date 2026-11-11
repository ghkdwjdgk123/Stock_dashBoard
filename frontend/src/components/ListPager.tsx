import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  page: number; canNext: boolean; onPrev: () => void; onNext: () => void
}
export function ListPager({ page, canNext, onPrev, onNext }: Props) {
  return <div className="pager">
    <button aria-label="이전 페이지" disabled={page === 0} onClick={onPrev}><ChevronLeft size={17} /></button>
    <span>{page + 1} 페이지</span>
    <button aria-label="다음 페이지" disabled={!canNext} onClick={onNext}><ChevronRight size={17} /></button>
  </div>
}
