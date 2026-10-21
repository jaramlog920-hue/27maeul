// 마을 기록 책 (2026-10-21 사용자: 230장) — 그동안 마을에 있었던 사귐·결혼·출생·일 찾기·잔치를 날짜 순서로, 이웃 이름으로.
// 주민 가족 소식(gen.log)은 수첩 소식과 같은 글(newsLine), 우리 집 일(결혼·아이·잔치)은 따로 한 줄씩
import { newsLine, personName } from '../../content/gen-text'
import { t } from '../../shared/i18n'
import { partnerName, useGame } from '../../store/game-store'
import type { GameState } from '../../engine/game'

// 실제 기록 이름 (gen.log kind) — 결혼은 married, 헤어짐도 남긴다 (2026-10-21 점검: 결혼이 빠졌다), 은퇴는 없다
const KEEP = new Set(['married', 'birth', 'lover', 'breakup', 'ownJob', 'movedAway'])

export function villageRecords(game: GameState): { day: number; text: string }[] {
  const out: { day: number; text: string }[] = []
  const unknown = t('gen.unknown')
  for (const l of game.gen?.log ?? []) {
    if (!KEEP.has(l.kind) || l.who.slice(0, 2).some((id) => id && personName(game, id) === unknown)) continue
    const text = newsLine(game, l)
    if (text) out.push({ day: l.day, text })
  }
  const partner = partnerName(game)
  if (game.romance?.stage === 'married' && game.romance.marriedDay != null && partner) out.push({ day: game.romance.marriedDay, text: t('villageBook.myWedding', { who: partner }) })
  for (const k of [...(game.child ? [game.child] : []), ...(game.siblings ?? [])]) out.push({ day: k.born, text: t('villageBook.myKid', { name: k.name }) })
  if (game.flags.gospelFeastDay) out.push({ day: game.flags.gospelFeastDay, text: t('villageBook.gospelFeast') })
  if (game.flags.allFeastDay) out.push({ day: game.flags.allFeastDay, text: t('villageBook.allFeast') })
  return out.sort((a, b) => a.day - b.day)
}

export function VillageBook() {
  const game = useGame((s) => s.game)
  const { closeModal } = useGame.getState()
  const rows = villageRecords(game)
  return (
    <div className="dialog scroll-dialog" role="dialog" aria-label={t('villageBook.title')}>
      <h2>{t('villageBook.title')}</h2>
      {rows.length === 0 ? <p className="hint">{t('villageBook.none')}</p> : (
        <ul className="rows">
          {rows.map((r, i) => (
            <li key={i}><span className="row-meta">{t('villageBook.day', { day: r.day })}</span> {r.text}</li>
          ))}
        </ul>
      )}
      <div className="actions">
        <button data-close onClick={closeModal}>{t('villageBook.close')}</button>
      </div>
    </div>
  )
}
