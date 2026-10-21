import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { CONTENT, verseNumbers } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { isMarketDay, weatherOf } from '../../engine/calendar'
import { formatTime, phaseOf, seasonOf } from '../../engine/clock'
import { chaptersOf, progressOf } from '../../engine/books'
import { OT_NAME } from '../../content/ot-catalog'
import { chapterUnit, isOtBook, otRow, type CopyBook } from '../../engine/ot-books'
import type { CopyAt } from '../../engine/copying'
import { peaceful, timeSpeed } from '../../engine/game'
import { jobOf } from '../../engine/job'
import { useGame } from '../../store/game-store'
import { DecorateButton } from './DecorateButton'
import { BuildButton } from './BuildButton'

export function Hud() {
  const day = useGame((s) => s.game.clock.day)
  // 10분 단위로만 다시 그린다
  const minute = useGame((s) => Math.floor(s.game.clock.minute / 10) * 10)
  const coins = useGame((s) => s.game.coins)
  const job = useGame((s) => jobOf(s.game))
  const name = useGame((s) => s.game.avatar?.name ?? '')
  const peace = useGame((s) => peaceful(s.game))
  // 지금 필사 자리 (계획 14 작업 6): 바뀔 때만 다시 센다 — 선택자는 저장된 값(같은 참조)만 돌려준다
  const book = useGame((s) => s.game.copy.book)
  const at = useGame((s) => (book ? s.game.copy.at[book] : undefined))
  const done = useGame((s) => (book ? progressOf(s.game, book).completed : NONE))
  const copyText = useMemo(() => copyNow(book, at, done), [book, at, done])
  const { open } = useGame.getState()
  const weather = (T.ui.weather as Record<string, string>)[weatherOf(day)]
  // 빠른 시계가 있으면 시각 옆에 빠르기 단추 (2026-10-14)
  const speed = useGame((s) => (s.game.inv.speedClock ? timeSpeed(s.game) : 0))
  return (
    <header className="hud">
      <div className="hud-row">
        <span className="hud-day">
          {/* 장날 요일 이름이 '장날'이면 뒤의 장날 표시와 겹친다 (2026-10-19 플레이 점검 P13) — 장날 표시만 남긴다 */}
          {fill(T.ui.day, { day })}{isMarketDay(day) && T.clubs.day[day % 7] === T.ui.market ? '' : ` · ${T.clubs.day[day % 7]}`} · {T.ui.season[seasonOf(day)]} · {weather}
          {isMarketDay(day) && <b className="hud-market"> · {T.ui.market}</b>}
          {peace && <b className="hud-peace"> · {T.ui.peace}</b>}
        </span>
        <span className="hud-time">
          {T.ui.phase[phaseOf(minute)]} {formatTime(minute)}
          {speed > 0 && (
            <button className="hud-speed" aria-label={`하루 빠르기 ${speed}배, 누르면 바꾸기`} onClick={() => useGame.getState().cycleTimeSpeed()}>
              {speed}배
            </button>
          )}
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
          {/* 엮은 장 수는 맨 위에 보이지 않는다 (2026-10-07 사용자) — 말씀 창에서 본다 */}
        </span>
        <div className="hud-buttons">
          <button className="hud-btn menu-word" onClick={() => open({ kind: 'word' })}>
            {T.word.open}
          </button>
          <button className="hud-btn" onClick={() => open({ kind: 'settings' })}>설정</button>
          <button className="hud-btn" onClick={() => open({ kind: 'bag' })}>
            {T.ui.bag}
          </button>
          <button className="hud-btn" onClick={() => open({ kind: 'villageMap' })}>
            {T.ui.map}
          </button>
          <button className="hud-btn" onClick={() => open({ kind: 'journal' })}>
            {T.ui.journalTitle}
          </button>
          <button className="hud-btn" onClick={() => open({ kind: 'family' })}>
            가족
          </button>
          <DecorateButton className="hud-btn hud-decorate" />
          <BuildButton className="hud-btn hud-decorate" />
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
function copyNow(book: CopyBook | null, at: CopyAt | undefined, completed: readonly number[]): string {
  if (!book) return T.ui.hudCopyNone
  // 구약: 본문을 안 불러왔을 수 있으니 장만 보인다 (절 수는 책상에서)
  if (isOtBook(book)) {
    const open = Array.from({ length: otRow(book).chapters }, (_, i) => i + 1).filter((c) => !completed.includes(c))
    // 다 쓴 책이면 다음 할 일로 (2026-10-19 플레이 점검 P5: 꽂은 뒤에도 '필사를 마침'에 멈춰 있었다)
    if (!open.length) return T.ui.hudCopyNext
    return fill(T.ot.hudAt, { book: OT_NAME[book], chapter: at && open.includes(at.chapter) ? at.chapter : open[0], unit: chapterUnit(book) })
  }
  const open = chaptersOf(book, CONTENT).filter(c => !completed.includes(c))
  if (!open.length) return T.ui.hudCopyNext
  const chapter = at && open.includes(at.chapter) ? at.chapter : open[0]
  const verses = verseNumbers(book, chapter)
  const found = at?.chapter === chapter ? verses.findIndex(v => v >= at.verse) : 0
  return fill(T.ui.hudCopyAt, { book: BOOK_NAME[book], chapter, done: Math.max(0, found), all: verses.length })
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
  const modalOpen = useGame((s) => s.modal !== null)
  if (!toast) return null
  const message = (
    <div className={modalOpen ? 'toast toast-over-modal' : 'toast'} role="status">
      {toast.text}
    </div>
  )
  return modalOpen ? createPortal(message, document.body) : message
}
