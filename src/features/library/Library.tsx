import { featureAccess, featureHint, nextUnlock } from '../../engine/feature-rules'
import { FEATURE_NAME } from '../play/GameGuide'
import { libraryGrowth, libraryPayRate, NT_CHAPTER_COUNTS } from '../../engine/progression'
import { libraryBookCount } from '../../engine/game'
// 마을 서고 안: 서고 선반 전경(신약 n/27 — 처음엔 휑하고 권이 늘수록 찬다), 복음서 방 선반과 잠긴 방들 (설계 §2.1.1, 계획 14 작업 4)
import { useState } from 'react'
import { CONTENT, neighborById, pieceById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { openDoorsFor } from '../../engine/books'
import { canLibraryRead, canTeachVisitor, LIBRARY_READ_PRICE, librarianCandidates, librarianId, setLibrarian, teachVisitor, todaysVisitor, type GameState } from '../../engine/game'
import { saveGame } from '../../engine/save'
import { BOOKS, GOSPELS } from '../../engine/types'
import { libraryVisitorTile } from '../../engine/library-visitor'
import { PiecePicker } from './PiecePicker'
import { useGame } from '../../store/game-store'
import { t } from '../../shared/i18n'
import { ShelfPicture } from './BookArt'
import { ShelfRow } from './ShelfRow'
import { finishedCopies } from '../../engine/binding'
import { roomOf } from '../../engine/shelf-rooms'
import { BlockedButton } from '../../shared/BlockedButton'

const BOOK_NAME = T.quiz.books as Record<string, string>

/** 서고 운영 (2026-10-08): 사서 맡기기 · 오늘 온 방문객에게 조각 하나 함께 읽어 주기 */
function LibraryOps() {
  const game = useGame((s) => s.game)
  const [teaching, setTeaching] = useState(false)
  const current = librarianId(game)
  const candidates = librarianCandidates(game)
  const visitor = todaysVisitor(game)
  // 방문객이 서고에 와 있는 동안만 (9–17시, 대화창과 같은 기준 — 2026-10-12 점검 4)
  const visitorInLibrary = !!libraryVisitorTile(game)
  const apply = (next: GameState | null) => {
    if (!next) return
    saveGame(next)
    useGame.setState({ game: next })
  }
  if (featureAccess(game, 'library') !== 'full' && !current && !visitor) return <p className="hint">{featureHint('library')}</p>
  if (!current && !candidates.length && !visitor) return null
  return (
    <section aria-label={t('libraryOps.title')}>
      <h3 className="rows-title">{t('libraryOps.title')}</h3>
      <p className="hint">{current ? t('libraryOps.current', { who: neighborById(current)?.role ?? '' }) : t('libraryOps.none')}</p>
      <div className="actions menu">
        {candidates.filter((id) => id !== current).map((id) => (
          <BlockedButton key={id} why={featureAccess(game, 'library') !== 'full' ? featureHint('library') : null} onClick={() => apply(setLibrarian(useGame.getState().game, id))}>{t('libraryOps.appoint', { who: neighborById(id)?.role ?? '' })}</BlockedButton>
        ))}
        {current && <button onClick={() => apply(setLibrarian(useGame.getState().game, null))}>{t('libraryOps.release')}</button>}
      </div>
      {visitor && canTeachVisitor(game) && !teaching && (
        <div className="actions menu">
          {/* 손님이 서고에 없는 때(9–17시 밖)는 흐린 채로, 누르면 까닭 한 줄 (2026-10-21 사용자: 단추가 말없이 사라졌다) */}
          <button className="primary" aria-disabled={!visitorInLibrary} onClick={() => (visitorInLibrary ? setTeaching(true) : useGame.getState().say(t('libraryOps.teachHours'), 2800))}>{t('libraryOps.teach')}</button>
        </div>
      )}
      {teaching && (
        <PiecePicker
          ids={game.collected}
          onCancel={() => setTeaching(false)}
          onPick={(id) => {
            apply(teachVisitor(useGame.getState().game, id))
            setTeaching(false)
            useGame.getState().say(t('libraryOps.taught'), 3000)
          }}
        />
      )}
    </section>
  )
}

/** 서고 방명록 (계획 21 R10): 들른 사람이 남긴 한 줄, 최근 다섯 */
function Guestbook() {
  const game = useGame(s => s.game)
  const book = game.guestbook
  if (featureAccess(game, 'guestbook') !== 'full' && !book?.length) return <p className="hint">{featureHint('guestbook')}</p>
  if (!book?.length) return null
  return (
    <section aria-label={T.guestbook.title}>
      <h3 className="rows-title">{T.guestbook.title}</h3>
      <ul className="rows">
        {[...book].reverse().slice(0, 5).map((g) => (
          <li key={g.day}>
            <div className="row">
              <span className="row-main">
                <b>{fill(guestLine(g.kind, g.day), { village: g.village ?? '' })}</b>
                {(g.by || g.taught) && (
                  <small>
                    {[g.by ? t('libraryOps.byLine', { who: neighborById(g.by)?.role ?? '' }) : '', g.taught ? t('libraryOps.taughtLine', { title: pieceById(g.taught)?.title ?? '' }) : ''].filter(Boolean).join(' · ')}
                  </small>
                )}
              </span>
              <span className="row-meta">{fill(T.ui.day, { day: g.day })}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** 남은 장을 책별로: "히브리서 11·12장, 요한계시록 20–22장" (마지막 열 장 — 2026-10-21 점검: 어느 책이 남았는지가 가장 궁금했다) */
function remainingByBook(game: GameState): string {
  const parts: string[] = []
  for (const b of BOOKS) {
    const done = new Set(game.progress[b]?.completed ?? [])
    const left = Array.from({ length: NT_CHAPTER_COUNTS[b] }, (_, i) => i + 1).filter((c) => !done.has(c))
    if (!left.length) continue
    const runs: string[] = []
    for (let i = 0; i < left.length; ) {
      let j = i
      while (j + 1 < left.length && left[j + 1] === left[j] + 1) j++
      runs.push(j - i >= 2 ? `${left[i]}–${left[j]}` : left.slice(i, j + 1).join('·'))
      i = j + 1
    }
    parts.push(`${BOOK_NAME[b] ?? b} ${runs.join('·')}장`)
  }
  return parts.join(', ')
}

/** 방명록 한 줄: 손님 종류마다 여러 문장 중 그날 것 (2026-10-21 중반 점검: 종류마다 한 문장이라 서른 줄이 네 문장의 되풀이였다) */
function guestLine(kind: string, day: number): string {
  const lines = (T.guestbook.lines as Record<string, readonly string[]>)[kind] ?? []
  return lines.length ? lines[(day * 7) % lines.length] : ''
}

export function Library() {
  const game = useGame(s => s.game)
  const chapters = libraryGrowth(game).completedChapters
  const shelved = useGame((s) => s.game.shelved)
  const bound = useGame((s) => s.game.bound)
  const inv = useGame((s) => s.game.inv)
  const flags = useGame((s) => s.game.flags)
  const open = openDoorsFor(flags)
  const { closeModal } = useGame.getState()
  const n = Object.values(shelved).filter((g) => g !== undefined).length
  const payBooks = useGame((s) => libraryBookCount(s.game))
  const anyRetry = GOSPELS.some((b) => shelved[b] !== undefined && shelved[b]! < 2)
  const carried = finishedCopies({ bound, shelved })
  return (
    <div className="dialog library" role="dialog" aria-label={T.library.title}>
      <h2>
        {T.library.title} <span className="library-count">{fill(T.library.count, { n })}</span>
      </h2>
      {/* 서고 수입 (2026-10-12): 책이 찰수록 일해서 버는 닢이 는다 */}
      {payBooks > 0 && <p className="hint">서고 덕분에 일삯 +{Math.round(libraryPayRate(payBooks) * 100)}%</p>}
      <ShelfPicture shelved={shelved} bound={bound} />
      {chapters >= 7 && <div className="library-manuscripts" role="img" aria-label={`완료한 ${chapters}장의 기록 꾸러미`}><span className="manuscript-stack" aria-hidden="true"><i /><i /><i /></span><small>필사한 기록 {chapters}장</small></div>}
      <p className="hint">{T.library.notice}</p>
      {/* 마지막 열 장 (250장): 남은 장 수 · 마을 기록 책 (230장) — 2026-10-21 */}
      {featureAccess(game, 'finale') === 'full' && !game.flags.growthLegacy && chapters < 260 && <p className="hint">{t('villageBook.left', { n: 260 - chapters })} · {remainingByBook(game)}</p>}
      {(() => { const next = game.flags.growthVersion && !game.flags.growthLegacy ? nextUnlock(game) : null; return next ? <p className="hint">{t('library.nextUnlock', { name: FEATURE_NAME[next.id], n: next.left })}</p> : null })()}
      {featureAccess(game, 'villageBook') === 'full' && (
        <div className="actions menu"><button onClick={() => useGame.getState().open({ kind: 'villageBook' })}>{t('villageBook.open')}</button></div>
      )}
      <h3>{T.library.gospelRoom}</h3>
      <ul className="library-shelf">
        {/* 복음서 방 선반은 네 복음서만 — 사도행전은 자기 방에 꽂는다 (계획 5 작업 5) */}
        {GOSPELS.map((b) => (
          <ShelfRow key={b} book={b} back="library" notYet={T.library.notYet} />
        ))}
      </ul>
      {anyRetry && <p className="hint">{fill(T.library.retryCost, { gold: inv.goldLeaf ?? 0, oil: inv.oil ?? 0 })}</p>}
      {/* 들고 온 완성본은 어느 방 어느 문으로 가는지 (2026-10-19 플레이 점검 P2·P3) — 복음서는 위 선반에서 바로 꽂는다 */}
      {carried.map((b) => {
        const door = roomOf(b).door
        return door === null ? null : (
          <p key={b} className="hint library-carry">
            {fill(T.library.carryTo, { book: BOOK_NAME[b], room: (T.library.lockedRooms as string[])[door], where: (T.library.doorWhere as string[])[door] })}
          </p>
        )
      })}
      <ul className="library-locked">
        {(T.library.lockedRooms as string[]).map((r, i) =>
          // 열린 방 (방 표로 판정 — 지금은 처음부터 모두 열려 있다, books roomOpen)
          open.includes(i) ? <li key={r}>{fill(T.library.roomOpen, { room: r, where: (T.library.doorWhere as string[])[i] })}</li> : <li key={r}>🔒 {r}</li>,
        )}
      </ul>
      <ReadingSeat />
      <LibraryOps />
      <Guestbook />
      <div className="actions">
        {/* 마을별 서고 순위 다시 보기 (계획 21 R8) */}
        <button onClick={() => useGame.getState().open({ kind: 'rank', history: true, back: useGame.getState().modal ?? undefined })}>{t('rank.open')}</button>
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

/** 서고 열람석: 닢을 내고 27권 가운데 아직 없는 조각 하나를 옮겨 적어 온다 (하루 두 번) */
function ReadingSeat() {
  const game = useGame((s) => s.game)
  const libraryRead = useGame((s) => s.libraryRead)
  const block = canLibraryRead(game, CONTENT)
  const hint = block === 'done' ? '오늘은 열람석을 두 번 다 썼어요.' : block === 'coins' ? '닢이 모자라요.' : block === 'noPiece' ? '지금 책에서 더 옮겨 적을 사본이 없어요.' : '서고에 모아 둔 사본에서 다음 대목을 옮겨 적어요 (하루 두 번).'
  return (
    <div className="reading-seat">
      <h3>열람석</h3>
      <p className="hint">{hint}</p>
      <BlockedButton why={block !== null ? hint : null} onClick={libraryRead}>
        옮겨 적기 · {LIBRARY_READ_PRICE}닢
      </BlockedButton>
    </div>
  )
}
