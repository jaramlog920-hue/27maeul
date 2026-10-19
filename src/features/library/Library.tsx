import { featureAccess, featureHint } from '../../engine/feature-rules'
import { libraryGrowth, libraryPayRate } from '../../engine/progression'
import { libraryBookCount } from '../../engine/game'
// 마을 서고 안: 서고 선반 전경(신약 n/27 — 처음엔 휑하고 권이 늘수록 찬다), 복음서 방 선반과 잠긴 방들 (설계 §2.1.1, 계획 14 작업 4)
import { useState } from 'react'
import { CONTENT, neighborById, pieceById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { openDoorsFor } from '../../engine/books'
import { canLibraryRead, canTeachVisitor, LIBRARY_READ_PRICE, librarianCandidates, librarianId, setLibrarian, teachVisitor, todaysVisitor, type GameState } from '../../engine/game'
import { saveGame } from '../../engine/save'
import { GOSPELS } from '../../engine/types'
import { libraryVisitorTile } from '../../engine/library-visitor'
import { PiecePicker } from './PiecePicker'
import { useGame } from '../../store/game-store'
import { t } from '../../shared/i18n'
import { ShelfPicture } from './BookArt'
import { ShelfRow } from './ShelfRow'
import { finishedCopies } from '../../engine/binding'
import { roomOf } from '../../engine/shelf-rooms'

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
          <button key={id} disabled={featureAccess(game, 'library') !== 'full'} onClick={() => apply(setLibrarian(useGame.getState().game, id))}>{t('libraryOps.appoint', { who: neighborById(id)?.role ?? '' })}</button>
        ))}
        {current && <button onClick={() => apply(setLibrarian(useGame.getState().game, null))}>{t('libraryOps.release')}</button>}
      </div>
      {visitor && canTeachVisitor(game) && visitorInLibrary && !teaching && (
        <div className="actions menu">
          <button className="primary" onClick={() => setTeaching(true)}>{t('libraryOps.teach')}</button>
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
                <b>{fill((T.guestbook.lines as Record<string, string>)[g.kind], { village: g.village ?? '' })}</b>
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
          // 열린 방(방 표로 판정 — 잔치 다음 날 사도행전 방, 사도행전을 꽂은 다음 날 로마서–빌레몬서 방, 그 방 책을 제본한 날 …)
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

/** 서고 열람석: 닢을 내고 지금 책의 다음 이야기를 옮겨 적는다 (하루 두 번) */
function ReadingSeat() {
  const game = useGame((s) => s.game)
  const libraryRead = useGame((s) => s.libraryRead)
  const block = canLibraryRead(game, CONTENT)
  const hint = block === 'done' ? '오늘은 열람석을 두 번 다 썼어요.' : block === 'coins' ? '닢이 모자라요.' : block === 'noPiece' ? '지금 책에서 더 옮겨 적을 사본이 없어요.' : '서고에 모아 둔 사본에서 다음 대목을 옮겨 적어요 (하루 두 번).'
  return (
    <div className="reading-seat">
      <h3>열람석</h3>
      <p className="hint">{hint}</p>
      <button disabled={block !== null} onClick={libraryRead}>
        옮겨 적기 · {LIBRARY_READ_PRICE}닢
      </button>
    </div>
  )
}
