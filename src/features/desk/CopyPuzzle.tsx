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
  // 놓은 조각 (조각 번호) — 같은 글자의 조각이 둘 이상이면 어느 것을 눌러도 맞다 (2026-10-18 감사 M-7)
  const [used, setUsed] = useState<readonly number[]>([])
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
    const want = pieces[step]
    const hintAt = order.find((i) => !used.includes(i) && pieces[i] === want)
    const pick = (i: number) => {
      if (pieces[i] !== want) return miss()
      setUsed([...used, i])
      advance(pieces.length)
    }
    return (
      <div className={`copy-puzzle${smudge ? ' smudge' : ''}`} aria-label={label}>
        <p className="copy-puzzle-line">
          {fixed.length > 0 && <span className="copy-puzzle-fixed">{fixed.join(' ')} </span>}
          {placed.join(' ')}
          <span className="copy-puzzle-caret">▏</span>
        </p>
        <div className="copy-tiles">
          {order.map((i) =>
            used.includes(i) ? null : (
              <button key={i} className={`copy-tile${hint && i === hintAt ? ' hint' : ''}`} onClick={() => pick(i)}>
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
