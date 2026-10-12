// 수첩의 '마을' 칸: 마을 소식. 인물별 가계도는 이웃 수첩에서 연다.
// 만난 사람만 이름으로, 아직 모르는 사람은 '?'. 설명 줄 없이 목록만.
import { fill, T } from '../../content/text'
import { newsLine } from '../../content/gen-text'
import type { GenState } from '../../engine/gen'
import type { GameState } from '../../engine/game'
import { t } from '../../shared/i18n'

export { personName } from '../../content/gen-text'

export function VillagePage({ game }: { game: GameState }) {
  const g = game.gen as GenState | undefined
  if (!g) return <p>{T.ui.journalEmpty}</p>
  const news = [...g.log].reverse().map((l) => ({ l, line: newsLine(game, l) })).filter((x) => x.line).slice(0, 12)
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
    </div>
  )
}
