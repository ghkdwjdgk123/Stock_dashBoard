import { useEffect, useRef } from 'react'

type Props = { enabled: boolean; onVisible: () => void }
export function InfiniteSentinel({ enabled, onVisible }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!enabled || !ref.current) return
    const observer = new IntersectionObserver(([item]) => { if (item.isIntersecting) onVisible() }, { rootMargin: '80px' })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [enabled, onVisible])
  return <div ref={ref} style={{ height: 1 }} aria-hidden="true" />
}
