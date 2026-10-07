// 계획 21 R8·R9: 마을별 서고 순위 — 업데이트 창(아침)과 서고에서 다시 보기. 숫자표만, 행사 장면 없음.
import { itemName } from '../../content/text'
import { saveGame } from '../../engine/save'
import { OT_ROOMS } from '../../engine/ot-books'
import { ourScore, rankTable, villageSeed, type RankRow } from '../../engine/villages'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'

function Table({ rows }: { rows: RankRow[] }) {
  return (
    <ol className="rows rank-table">
      {rows.map((r, i) => (
        <li key={r.name ?? 'us'}>
          <div className={`row${r.name === null ? ' rank-us' : ''}`}>
            <span className="row-meta rank-place">{t('rank.place', { n: i + 1 })}</span>
            <span className="row-main"><b>{r.name ?? t('rank.us')}</b></span>
            <span className="row-meta">{t('rank.score', { n: r.score })}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function RankView({ history }: { history?: boolean }) {
  const game = useGame((s) => s.game)
  const close = () => {
    const g = useGame.getState().game
    if (g.rankPopup && !history) {
      const next = { ...g, rankPopup: undefined }
      saveGame(next)
      // 이사 편지가 같은 아침에 왔으면 이어서
      useGame.setState({ game: next, modal: next.farewellPopup ? { kind: 'farewell' } : null })
    } else useGame.setState({ modal: null })
  }
  const pop = !history ? game.rankPopup : undefined
  const rows = pop?.table ?? rankTable(villageSeed(game), game.clock.day, ourScore(game))
  return (
    <div className="dialog rank" role="dialog" aria-label={t('rank.title')}>
      <h2>{history ? t('rank.open') : t('rank.title')}</h2>
      {pop && (
        <>
          <p className="rank-mine">{t('rank.us')} · {t('rank.place', { n: pop.place })}</p>
          {(pop.coins ?? 0) > 0 && <p className="hint">{t('rank.coins', { n: pop.coins ?? 0 })}</p>}
          {pop.pieces.length > 0 && <p className="hint">{t('rank.pieces', { n: pop.pieces.length })}</p>}
          {pop.item && <p className="hint">{t('rank.item', { item: itemName(pop.item) })}</p>}
          {pop.otTicket && (
            <p className="rank-ticket">{t('rank.ticket', { room: OT_ROOMS[Math.max(0, Math.min(OT_ROOMS.length, game.flags.otExpand ?? 1) - 1)].label })}</p>
          )}
        </>
      )}
      <Table rows={rows} />
      {history && (game.ranks?.length ?? 0) > 0 && (
        <>
          <h3 className="rows-title">{t('rank.history')}</h3>
          <ul className="rows">
            {[...(game.ranks ?? [])].reverse().map((r) => (
              <li key={r.day}><div className="row"><span className="row-main"><b>{t('rank.dayPlace', { day: r.day, place: r.place })}</b></span></div></li>
            ))}
          </ul>
        </>
      )}
      <div className="actions">
        <button data-close onClick={close}>닫기</button>
      </div>
    </div>
  )
}
