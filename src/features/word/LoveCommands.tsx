// 말씀 메뉴 › 사랑의 계명 (2026-10-14 사용자): '크고 첫째 되는 계명'을 가운데, 하나님 사랑·이웃 사랑 두 가지 아래 계명을 모은다.
// 그 장을 필사로 마치면 밝아지고, 누르면 구절 전문(개역한글)과 출처. 해설은 붙이지 않는다 — 놓인 자리가 곧 말씀의 구조다.
import { useEffect, useState } from 'react'
import { CONTENT } from '../../content/catalog'
import { ensureOtBook, otLoaded } from '../../content/ot-catalog'
import { copyVerses } from '../../engine/copying'
import { LOVE_BRANCHES, LOVE_RECORDS, loveFound, type LoveRecord } from '../../engine/love-commands'
import { isOtBook, type OtBook } from '../../engine/ot-books'
import type { Book } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { NtContent } from '../passage/NtContent'

export function LoveCommands() {
  const game = useGame((s) => s.game)
  const found = LOVE_RECORDS.filter((r) => loveFound(game, r))
  const nt = [...new Set(found.map((r) => r.book).filter((b): b is Book => !isOtBook(b)))]
  const ot = [...new Set(found.map((r) => r.book).filter((b): b is OtBook => isOtBook(b)))]
  const otKey = ot.join(',')
  const [, setOtTick] = useState(0)
  useEffect(() => {
    const list = otKey ? (otKey.split(',') as OtBook[]) : []
    let alive = true
    if (!list.every(otLoaded)) void Promise.allSettled(list.map(ensureOtBook)).then(() => { if (alive) setOtTick((n) => n + 1) })
    return () => { alive = false }
  }, [otKey])
  return (
    <div className="love-commands">
      <p className="hint">{found.length} / {LOVE_RECORDS.length} · 그 계명이 든 장을 필사로 마치면 밝아져요.</p>
      <NtContent books={nt}>
        {LOVE_BRANCHES.map((branch) => (
          <section key={branch} className={`love-branch love-${LOVE_BRANCHES.indexOf(branch)}`} aria-label={branch}>
            <h3>{branch}</h3>
            <ul className="love-cards">
              {LOVE_RECORDS.filter((r) => r.branch === branch).map((r) => (
                <LoveCard key={r.ref} r={r} found={loveFound(game, r)} />
              ))}
            </ul>
          </section>
        ))}
      </NtContent>
    </div>
  )
}

function LoveCard({ r, found }: { r: LoveRecord; found: boolean }) {
  const [open, setOpen] = useState(false)
  if (!found) return <li className="love-card unfound" aria-label="아직 발견하지 않은 계명">???</li>
  const ready = !isOtBook(r.book) || otLoaded(r.book)
  const text = ready ? copyVerses(r.book, r.chapter, CONTENT).find((v) => v.verse === r.verse)?.text : undefined
  return (
    <li className="love-card">
      <button className="row" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="row-main"><b>{r.ref}</b>{!open && text && <small>{text.length > 26 ? `${text.slice(0, 26)}…` : text}</small>}</span>
      </button>
      {open && <p className="love-verse">{text ?? '본문을 불러오는 중이에요.'}</p>}
    </li>
  )
}
