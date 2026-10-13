// 이웃 꿀팁 편지 (2026-10-14): 아침에 온 편지 한 통, '지난 편지'를 누르면 받은 편지를 모두 (최근 것이 위)
import { useState } from 'react'
import { neighborById } from '../../content/catalog'
import { callName, T } from '../../content/text'
import { tipById } from '../../engine/tip-letters'
import { useGame } from '../../store/game-store'

export function TipLetterView({ all = false }: { all?: boolean }) {
  const game = useGame((s) => s.game)
  const closeModal = useGame((s) => s.closeModal)
  const [list, setList] = useState(all)
  const got = (game.tips ?? []).map(tipById).filter((x): x is NonNullable<typeof x> => !!x)
  const latest = got[got.length - 1]
  const me = game.avatar?.name
  const L = T.tips
  const letter = (t: (typeof got)[number], key?: string) => (
    <article key={key ?? t.id} className="tip-letter">
      <p className="tip-from">{neighborById(t.from)?.role ?? ''}</p>
      <p className="tip-body">{callName(t.text, me)}</p>
    </article>
  )
  return (
    <div className="dialog tip-letters" role="dialog" aria-label={L.title}>
      <h2>{list ? L.allTitle : L.title}</h2>
      {list ? (got.length ? [...got].reverse().map((t) => letter(t)) : <p className="hint">{L.none}</p>) : latest ? letter(latest) : <p className="hint">{L.none}</p>}
      <div className="actions">
        {!list && got.length > 1 && <button onClick={() => setList(true)}>{L.all}</button>}
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
