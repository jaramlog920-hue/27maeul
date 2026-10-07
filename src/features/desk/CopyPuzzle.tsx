// 계획 21 R1: 필사 퍼즐 — 낱말 조각 맞추기·빈칸 채우기. 다 맞추면 본문 그대로 기록(copyPuzzle).
// 틀리면 잉크 번짐 표시만, 세 번 틀리면 다음 정답이 반짝 (불이익 없음). "직접 쓸게요"로 언제든 손으로 쓴다.
import { useState } from 'react'
import { HINT_AFTER, type Tiles, type VerseBlank } from '../../engine/copy-ways'
import { t } from '../../shared/i18n'

export type PuzzleData = { kind: 'tiles'; tiles: Tiles } | { kind: 'blank'; text: string; blanks: VerseBlank[] }

export function CopyPuzzle({ data, label, onDone, onManual }: { data: PuzzleData; label: string; onDone: () => void; onManual: () => void }) {
  const [step, setStep] = useState(0)
  const [misses, setMisses] = useState(0)
  const [smudge, setSmudge] = useState(false)
  const hint = misses >= HINT_AFTER
  const miss = () => {
    setMisses((m) => m + 1)
    setSmudge(true)
    setTimeout(() => setSmudge(false), 500)
  }
  const advance = (total: number) => {
    const next = step + 1
    setStep(next)
    setMisses(0)
    if (next >= total) onDone()
  }

  if (data.kind === 'tiles') {
    const { fixed, pieces, order } = data.tiles
    const placed = pieces.slice(0, step)
    return (
      <div className={`copy-puzzle${smudge ? ' smudge' : ''}`} aria-label={label}>
        <p className="copy-puzzle-line">
          {fixed.length > 0 && <span className="copy-puzzle-fixed">{fixed.join(' ')} </span>}
          {placed.join(' ')}
          <span className="copy-puzzle-caret">▏</span>
        </p>
        <div className="copy-tiles">
          {order.map((i) =>
            i < step ? null : (
              <button key={i} className={`copy-tile${hint && i === step ? ' hint' : ''}`} onClick={() => (i === step ? advance(pieces.length) : miss())}>
                {pieces[i]}
              </button>
            ),
          )}
        </div>
        <button className="copy-puzzle-manual" onClick={onManual}>{t('copyWays.write')}</button>
      </div>
    )
  }

  const words = data.text.split(/\s+/).filter(Boolean)
  const cur = data.blanks[step]
  return (
    <div className={`copy-puzzle${smudge ? ' smudge' : ''}`} aria-label={label}>
      <p className="copy-puzzle-line">
        {words.map((w, i) => {
          const b = data.blanks.findIndex((x) => x.index === i)
          if (b < 0 || b < step) return <span key={i}>{w} </span>
          return <span key={i} className={`copy-blank${b === step ? ' now' : ''}`}>{'　'.repeat(Math.max(2, Math.min(5, w.length)))} </span>
        })}
      </p>
      {cur && (
        <div className="copy-tiles">
          {cur.options.map((o) => (
            <button key={o} className={`copy-tile${hint && o === cur.answer ? ' hint' : ''}`} onClick={() => (o === cur.answer ? advance(data.blanks.length) : miss())}>
              {o}
            </button>
          ))}
        </div>
      )}
      <button className="copy-puzzle-manual" onClick={onManual}>{t('copyWays.write')}</button>
    </div>
  )
}
