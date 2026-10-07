// 계획 20 2부 작업 F: 수첩의 '마을' 칸 — 마을 소식(주민끼리 생긴 일)과 마을 가계도 (D27·P12·P13).
// 만난 사람만 이름으로, 아직 모르는 사람은 '?'. 설명 줄 없이 목록만.
import { useState } from 'react'
import { fill, T } from '../../content/text'
import { newsLine, personName } from '../../content/gen-text'
import { familyGroups, type GenState } from '../../engine/gen'
import type { GameState } from '../../engine/game'
import { t } from '../../shared/i18n'

export { personName }

export function VillagePage({ game }: { game: GameState }) {
  const g = game.gen as GenState | undefined
  const [at, setAt] = useState(0)
  if (!g) return <p>{T.ui.journalEmpty}</p>
  const news = [...g.log].reverse().map((l) => ({ l, line: newsLine(game, l) })).filter((x) => x.line).slice(0, 12)
  const groups = familyGroups(g)
  const cur = groups[Math.min(at, groups.length - 1)]
  const name = (id: string) => personName(game, id)
  return (
    <div className="village-page">
      <h3 className="rows-title">{t('gen.news')}</h3>
      {news.length === 0 ? <p className="hint">—</p> : (
        <ul className="rows">
          {news.map(({ l, line }, i) => (
            <li key={`${l.day}-${i}`}><div className="row"><span className="row-main"><b>{line}</b></span><span className="row-meta">{fill(T.ui.day, { day: l.day })}</span></div></li>
          ))}
        </ul>
      )}
      <h3 className="rows-title">{t('gen.tree')}</h3>
      {cur && (
        <div className="family-tree">
          <ul className="rows">
            <li><div className="row"><span className="row-main"><b>{cur.heads.map(name).join(' · ')}</b>{cur.kin.length > 0 && <small>{cur.kin.map(name).join(' · ')}</small>}</span></div></li>
            {cur.children.map((c) => (
              <li key={c}><div className="row family-child"><span className="row-main"><b>└ {name(c)}</b></span></div></li>
            ))}
          </ul>
          {groups.length > 1 && (
            <div className="actions">
              <button aria-label="이전 집안" disabled={at <= 0} onClick={() => setAt(at - 1)}>◀</button>
              <span className="row-meta">{at + 1} / {groups.length}</span>
              <button aria-label="다음 집안" disabled={at >= groups.length - 1} onClick={() => setAt(at + 1)}>▶</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
