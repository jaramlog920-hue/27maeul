import { fill, T } from '../../content/text'
import { isMarketDay, weatherOf } from '../../engine/calendar'
import { formatTime, phaseOf, seasonOf } from '../../engine/clock'
import { totalChapters } from '../../engine/books'
import { piecesOf } from '../../content/catalog'
import { currentChapter } from '../../engine/offers'
import { peaceful, type GameState } from '../../engine/game'
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
  // 선택자는 글자·참거짓만 돌려준다 (새 객체를 돌려주면 매번 다시 그린다)
  const chapterText = useGame((s) => chapterNow(s.game).text)
  const chapterHint = useGame((s) => chapterNow(s.game).hint)
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
          {name && <>{name} · </>}
          {T.jobs[job]} · {fill(T.ui.coins, { n: coins })}
          {/* PC는 엮은 장 수, 휴대폰(아래 조작판)은 상태 판 대신 지금 쓰는 장 */}
          <span className="hud-shelf-count"> · {fill(T.ui.shelf, { n: shelf })}</span>
          <span className={`hud-chapter${chapterHint ? ' hint' : ''}`}> · {chapterText}</span>
        </span>
        <div className="hud-buttons">
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

/** 위 줄에 쓰는 지금 쓰는 장: "마가복음 3장 2/5" · 책이 없으면 "책상에서 책 고르기" */
function chapterNow(game: GameState): { text: string; hint: boolean } {
  const book = game.activeBook
  if (!book) return { text: T.ui.hudPickBook, hint: true }
  const pieces = piecesOf(book)
  const ch = currentChapter(pieces, game.progress[book].completed)
  if (ch === null) return { text: T.ui.hudBookDone, hint: true }
  const inChapter = pieces.filter((p) => p.chapter === ch)
  const got = inChapter.filter((p) => game.collected.includes(p.id)).length
  return { text: `${BOOK_NAME[book]} ${fill(T.ui.chapterLabel, { chapter: ch })} ${got}/${inChapter.length}`, hint: false }
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
