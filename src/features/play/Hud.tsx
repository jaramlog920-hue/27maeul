import { useMemo } from 'react'
import { CONTENT } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { isMarketDay, weatherOf } from '../../engine/calendar'
import { formatTime, phaseOf, seasonOf } from '../../engine/clock'
import { totalChapters, type Progress } from '../../engine/books'
import { copySpot, type CopyAt } from '../../engine/copying'
import { peaceful } from '../../engine/game'
import type { Book } from '../../engine/types'
import { jobOf } from '../../engine/job'
import { useGame } from '../../store/game-store'

export function Hud() {
  const day = useGame((s) => s.game.clock.day)
  // 10분 단위로만 다시 그린다
  const minute = useGame((s) => Math.floor(s.game.clock.minute / 10) * 10)
  const shelf = useGame((s) => totalChapters(s.game))
  const coins = useGame((s) => s.game.coins)
  const job = useGame((s) => jobOf(s.game))
  const name = useGame((s) => s.game.avatar?.name ?? '')
  const peace = useGame((s) => peaceful(s.game))
  // 지금 필사 자리 (계획 14 작업 6): 바뀔 때만 다시 센다 — 선택자는 저장된 값(같은 참조)만 돌려준다
  const book = useGame((s) => s.game.copy.book)
  const at = useGame((s) => (book ? s.game.copy.at[book] : undefined))
  const done = useGame((s) => (book ? s.game.progress[book].completed : NONE))
  const copyText = useMemo(() => copyNow(book, at, done), [book, at, done])
  const { open } = useGame.getState()
  const weather = (T.ui.weather as Record<string, string>)[weatherOf(day)]
  return (
    <header className="hud">
      <div className="hud-row">
        <span className="hud-day">
          {fill(T.ui.day, { day })} · {T.ui.season[seasonOf(day)]} · {weather}
          {isMarketDay(day) && <b className="hud-market"> · {T.ui.market}</b>}
          {peace && <b className="hud-peace"> · {T.ui.peace}</b>}
        </span>
        <span className="hud-time">
          {T.ui.phase[phaseOf(minute)]} {formatTime(minute)}
        </span>
      </div>
      <div className="hud-row hud-toolbar">
        <span className="hud-shelf">
          {/* 위 줄 (계획 14 작업 6): 직업 · 지금 필사 자리. 능력치는 가방 안에만 — 휴대폰에선 이름·엮은 장 수를 접는다 */}
          {name && <span className="hud-name">{name} · </span>}
          <span className="hud-job">{fill(T.ui.hudJob, { job: T.jobs[job] })}</span>
          {' · '}
          <span className="hud-chapter">{copyText}</span>
          {' · '}
          {fill(T.ui.coins, { n: coins })}
          <span className="hud-shelf-count"> · {fill(T.ui.shelf, { n: shelf })}</span>
        </span>
        <div className="hud-buttons">
          <button className="hud-btn hud-word" onClick={() => open({ kind: 'word' })}>
            {T.word.open}
          </button>
          <button className="hud-btn" onClick={() => open({ kind: 'settings' })}>설정</button>
          <button className="hud-btn" onClick={() => open({ kind: 'bag' })}>
            {T.ui.bag}
          </button>
          <button className="hud-btn" onClick={() => open({ kind: 'journal' })}>
            {T.ui.journalTitle}
          </button>
          <button className="hud-btn" onClick={() => open({ kind: 'family' })}>
            가족
          </button>
        </div>
      </div>
    </header>
  )
}

const BOOK_NAME = T.quiz.books as Record<string, string>
const NONE: readonly number[] = []

/**
 * 위 줄의 지금 필사 자리: "📖 마태복음 2장 0/23" (그 장에서 쓴 절 / 필사할 절). 고른 책이 없으면 책상에서 고르기,
 * 다 쓴 책이면 마쳤다고만 — 쓰라고 재촉하는 말은 없다
 */
function copyNow(book: Book | null, at: CopyAt | undefined, completed: readonly number[]): string {
  if (!book) return T.ui.hudCopyNone
  const spot = copySpot({ progress: { [book]: { completed } } as unknown as Progress, copy: { book, at: at ? { [book]: at } : {}, legacy: {} } }, book, CONTENT)
  if (!spot) return fill(T.ui.hudCopyDone, { book: BOOK_NAME[book] })
  return fill(T.ui.hudCopyAt, { book: BOOK_NAME[book], chapter: spot.chapter, done: spot.index, all: spot.count })
}

/** 새로 이룬 업적 (도감·업적) */
export function AwardBanner() {
  const award = useGame((s) => s.award)
  if (!award) return null
  return (
    <div className="award" role="status">
      ★ {award.text}
    </div>
  )
}

export function Toast() {
  const toast = useGame((s) => s.toast)
  if (!toast) return null
  return (
    <div className="toast" role="status">
      {toast.text}
    </div>
  )
}
