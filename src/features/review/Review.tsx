// 잠들기 전 — 오늘의 기록(있었던 일이 있는 날만)과 오늘 들은 이야기 하나를 다시 읽는다
import { CONTENT, neighborById, pieceById } from '../../content/catalog'
import { fill, itemList, JOURNAL_NOTES, T } from '../../content/text'
import { LATE } from '../../engine/clock'
import { todayDiary, type Diary } from '../../engine/daybook'
import { useGame } from '../../store/game-store'
import { Passage } from '../passage/Passage'

export function Review({ pieceId, attic }: { pieceId: string | null; attic?: boolean }) {
  const minute = useGame((s) => s.game.clock.minute)
  const game = useGame((s) => s.game)
  const { sleep, closeModal } = useGame.getState()
  const piece = pieceId ? pieceById(pieceId) : null
  const diary = todayDiary(game)
  return (
    <div className="dialog scroll-dialog review" role="dialog" aria-label={T.ui.reviewTitle}>
      <h2>{T.ui.reviewTitle}</h2>
      {diary && <DiaryView diary={diary} />}
      {piece ? (
        <>
          <p className="hint">{T.ui.reviewLead}</p>
          <h3>{piece.title}</h3>
          <Passage refText={piece.ref} />
        </>
      ) : (
        <p>{T.ui.reviewNone}</p>
      )}
      {attic && piece && <p className="hint">{T.ui.atticReadHint}</p>}
      {minute >= LATE && <p className="hint">{T.ui.sleepLate}</p>}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.stayUp}</button>
        <button className="primary" onClick={sleep}>
          {T.ui.sleep}
        </button>
      </div>
    </div>
  )
}

const BOOK_NAME = T.quiz.books as Record<string, string>
const D = T.diary
const pieceKnown = (id: string) => CONTENT.pieces.some((p) => p.id === id)

/** 오늘의 기록 (계획 14 작업 6): 있는 칸만 — 필사한 장·받은 선물·새 말씀 조각·가족 일 */
function DiaryView({ diary }: { diary: Diary }) {
  const kid = useGame((s) => s.game.child?.name)
  const who = (id: string) => (id === 'child' && kid ? kid : (neighborById(id)?.role ?? id))
  const rows: [string, string[]][] = [
    [D.chapters, diary.chapters.map((c) => fill(D.chapterList, { book: BOOK_NAME[c.book], chapters: c.chapters.join('·') }))],
    [D.gifts, diary.gifts.map((g) => fill(D.giftFrom, { who: who(g.from), items: itemList(g.items) }))],
    [D.pieces, diary.pieces.flatMap((id) => (pieceKnown(id) ? [fill(D.piece, { title: pieceById(id).title, ref: pieceById(id).ref })] : []))],
    [D.family, diary.family.map((n) => (JOURNAL_NOTES[n] ?? '').trim()).filter(Boolean)],
  ]
  return (
    <section className="diary" aria-label={D.title}>
      <h3>{D.title}</h3>
      <dl>
        {rows
          .filter(([, lines]) => lines.length > 0)
          .map(([label, lines]) => (
            <div key={label} className="diary-row">
              <dt>{label}</dt>
              {lines.map((l, i) => (
                <dd key={i}>{l}</dd>
              ))}
            </div>
          ))}
      </dl>
    </section>
  )
}
