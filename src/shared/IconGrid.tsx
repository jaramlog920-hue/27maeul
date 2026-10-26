// 아이콘 칸 목록 (2026-10-12 사용자: 줄줄이 늘어놓은 목록 대신 가방처럼 아이콘으로, 누르면 값·설명·단추)
// 가방(Bag)의 bag-grid·bag-slot·bag-detail 모양을 그대로 쓴다
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BlockedButton } from './BlockedButton'

export interface IconEntry {
  key: string
  icon: ReactNode
  /** 칸 이름 (읽어 주기·자세히 칸 제목) */
  label: string
  /** 칸 아래 작은 글 (값·개수 등, 없으면 비움) */
  badge?: string
  /** 흐리게 (지금은 못 하는 것) */
  dim?: boolean
  /** 고르면 나오는 자세히 칸 */
  detail?: ReactNode
  /** why: 지금 못 하는 까닭 — 있으면 흐리게, 누르면 까닭을 알린다 (BlockedButton) */
  action?: { label: string; why?: string | null; onClick: () => void }
}

/** named: 칸 아래에 이름을 보인다 (장터 — 2026-10-19 플레이 점검 P20: 하나씩 눌러 봐야 무엇인지 알았다) */
export function IconGrid({ entries, title, emptyText, named = false }: { entries: readonly IconEntry[]; title?: string; emptyText?: string; named?: boolean }) {
  const [picked, setPicked] = useState<string | null>(null)
  const sel = entries.find((e) => e.key === picked) ?? null
  if (!entries.length) return emptyText ? <p className="hint">{emptyText}</p> : null
  return (
    <section className={`icon-grid${named ? ' named' : ''}`} aria-label={title}>
      {title && <h3>{title}</h3>}
      <div className="bag-grid">
        {entries.map((e) => (
          <button
            key={e.key}
            className={`bag-slot${picked === e.key ? ' on' : ''}${e.dim ? ' dim' : ''}`}
            aria-label={e.label}
            aria-pressed={picked === e.key}
            onClick={() => setPicked(picked === e.key ? null : e.key)}
          >
            {e.icon}
            {named && <span className="bag-name" aria-hidden="true">{e.label}</span>}
            {e.badge && <span className="bag-count">{e.badge}</span>}
          </button>
        ))}
      </div>
      {sel && (
        <div className="bag-detail" aria-live="polite">
          {sel.icon}
          <div>
            <strong>{sel.label}</strong>
            {sel.detail}
            {sel.action && (
              <div className="actions">
                <BlockedButton className="primary" why={sel.action.why} onClick={sel.action.onClick}>
                  {sel.action.label}
                </BlockedButton>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/** 그림 줄(글자 = 색) 하나를 정해진 크기의 아이콘으로 — 가방 물건이 아닌 것(터 가꾸기 건물·소재)에 */
export function ArtIcon({ rows, palette, size = 28, label }: { rows: readonly string[]; palette: Record<string, string>; size?: number; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    const g = c?.getContext('2d')
    if (!c || !g) return
    const w = Math.max(1, ...rows.map((r) => r.length))
    const h = Math.max(1, rows.length)
    const k = size / Math.max(w, h)
    g.clearRect(0, 0, size, size)
    const ox = (size - w * k) / 2
    const oy = (size - h * k) / 2
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const col = palette[ch]
        if (ch === '.' || !col) return
        g.fillStyle = col
        g.fillRect(Math.floor(ox + x * k), Math.floor(oy + y * k), Math.ceil(k), Math.ceil(k))
      }),
    )
  }, [rows, palette, size])
  return <canvas ref={ref} width={size} height={size} className="art-icon" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />
}

/** 필요한 재료를 아이콘과 개수로 — 가진 것이 모자라면 붉게 (가진 수 / 필요한 수) */
export function NeedList({ needs, have, icon }: { needs: Readonly<Record<string, number>>; have: (id: string) => number; icon: (id: string) => ReactNode }) {
  const list = Object.entries(needs).filter(([, n]) => n > 0)
  if (!list.length) return null
  return (
    <ul className="need-list">
      {list.map(([id, n]) => (
        <li key={id} className={have(id) < n ? 'short' : undefined}>
          {icon(id)}
          <span>{have(id)}/{n}</span>
        </li>
      ))}
    </ul>
  )
}
