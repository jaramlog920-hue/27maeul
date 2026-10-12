import { useEffect, useState } from 'react'
import { pieceById } from '../../content/catalog'
import { ensureOtBook, otChapterText } from '../../content/ot-catalog'
import { T } from '../../content/text'
import { otPieceById } from '../../engine/ot-pieces'
import { otRow, type OtBook } from '../../engine/ot-books'
import { useGame } from '../../store/game-store'
import { Passage } from './Passage'
import { Stamps } from './Stamps'

export function PieceAcquired({ id }: { id: string }) {
  const ot = otPieceById(id)
  const piece = ot ? null : pieceById(id)
  const [ref, setRef] = useState<string | null>(piece?.ref ?? null)
  const [failed, setFailed] = useState(false)
  const count = useGame(s => s.piecePopups.length)
  const fromHomeCat = useGame(s => s.game.pieceLog[id]?.from === 'petHome')
  useEffect(() => {
    if (!ot) return
    let active = true
    ensureOtBook(ot.book as OtBook).then(() => {
      const verses = otChapterText(ot.book as OtBook, ot.chapter)
      if (active) setRef(`${otRow(ot.book as OtBook).abbr} ${ot.chapter}:1-${verses.at(-1)?.verse ?? 1}`)
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [ot])
  return <div className="dialog scroll-dialog" role="dialog" aria-label="말씀조각 획득">
    <p className="hint">{fromHomeCat ? '고양이가 집에서 말씀 조각을 찾아왔어요 · 도감에 담겼어요.' : '새 말씀조각을 얻었어요 · 도감에 담겼어요.'}</p>
    <h2>{ot?.name ?? piece?.title}</h2>
    {ref ? <Passage refText={ref} /> : <p role="status">{failed ? '본문을 불러오지 못했어요. 말씀조각은 도감에 보관했어요.' : '본문을 불러오는 중이에요.'}</p>}
    {piece && <Stamps piece={piece} />}
    <div className="actions"><button data-close onClick={() => useGame.getState().dismissPiecePopup()}>{count > 1 ? `다음 조각 · ${count - 1}개 남음` : T.ui.close}</button></div>
  </div>
}
