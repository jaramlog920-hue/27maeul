// 이웃과의 생활 대화 — 게임이 지어낸 말. 성경 이야기는 '이야기 듣기'를 눌러 본문 창으로만 본다.
import { neighborById } from '../../content/catalog'
import { fill, itemList, NEIGHBOR_LINES, T } from '../../content/text'
import { grapesRipe, isMarketDay } from '../../engine/calendar'
import { activeRequest, canHelp, canOrderHome, canOrderWork, GIFTABLE, lessonTime, nextHomeStage } from '../../engine/game'
import { CARPENTER_WORKS } from '../../engine/easier'
import { requestFor, reqState } from '../../engine/bonds'
import { has } from '../../engine/items'
import { MAX_HEART } from '../../engine/neighbors'
import { heartsOf } from '../../engine/hearts'
import { postLine, starPostHint, useGame, type Modal } from '../../store/game-store'

export function Hearts({ n }: { n: number }) {
  return (
    <span className="hearts" aria-label={`${T.ui.hearts} ${n}/${MAX_HEART}`}>
      {Array.from({ length: MAX_HEART }, (_, i) => (
        <span key={i} className={i < n ? 'on' : ''}>
          ♥
        </span>
      ))}
    </span>
  )
}

export function TalkBox({ modal }: { modal: Extract<Modal, { kind: 'talk' }> }) {
  const game = useGame((s) => s.game)
  const { listenTo, startHelp, open, closeModal, startTeach } = useGame.getState()
  const def = neighborById(modal.neighborId)
  if (!def) return null
  const lines = NEIGHBOR_LINES[def.id]
  const block = canHelp(game, def)
  const seasonal = def.id === 'grandpa' && grapesRipe(game.clock.day) && lines.helpSeason
  const helpLabel = seasonal ? lines.helpSeason!.label : lines.help.label
  const canGift = !game.gifted.includes(def.id) && GIFTABLE.some((i) => (game.inv[i] ?? 0) > 0)
  const teachable = def.id === 'child' && lessonTime(game)
  const req = requestFor(def.id, game.hearts[def.id], game.flags)
  const askable = req && reqState(game.flags, req.id) === 0
  const active = activeRequest(game, def.id)
  const { requestAsk, requestGive, askHome, askWork } = useGame.getState()
  // 목수에게 집 넓히기 부탁 (이사 온 뒤, 다음 단계가 남아 있으면)
  const homeStage = def.id === 'carpenter' ? nextHomeStage(game) : null
  const homeBlock = homeStage ? canOrderHome(game) : 'done'
  // 목수에게 살림 부탁 (계획 11): 이사 온 뒤, 아직 없는 것만
  const works = def.id === 'carpenter' ? CARPENTER_WORKS.map((w) => ({ w, block: canOrderWork(game, w.id) })).filter((x) => x.block !== 'notMoved' && x.block !== 'owned') : []
  const easyName = (id: string) => (T.easy.names as Record<string, string>)[id]
  const post = postLine(game, def.id)
  const starHint = starPostHint(game, def.id)
  return (
    <div className="dialog talk" role="dialog" aria-label={def.role}>
      <p className="talk-role">
        {def.role} <Hearts n={heartsOf(game.hearts[def.id])} />
      </p>
      {/* 요한계시록은 낮에 건네지 않는다 — 평소 말 위에 언덕 편지함 안내 한 줄 */}
      {starHint && <p className="talk-line">{starHint}</p>}
      <p className="talk-line">{modal.line}</p>
      {/* 아침 방문 말 등 다른 말이 먼저 나와도 편지 알림은 가려지지 않는다 */}
      {post && post !== modal.line && <p className="talk-line">{post}</p>}
      <div className="actions menu">
        {game.offers[def.id] && (
          <button className="primary" onClick={() => listenTo(def.id)}>
            {T.ui.listen}
          </button>
        )}
        {post && (
          <button className="primary" onClick={() => listenTo(def.id)}>
            {T.post.receive}
          </button>
        )}
        {teachable && (
          <button className="primary" onClick={startTeach}>
            {T.ui.talkTeach}
          </button>
        )}
        {askable && (
          <button className="primary" onClick={() => requestAsk(def.id)}>
            {T.ui.talkRequest}
          </button>
        )}
        {active && (
          <button className="primary" disabled={!has(game.inv, active.needs)} onClick={() => requestGive(def.id)}>
            {T.ui.talkFulfill}
          </button>
        )}
        {homeStage && homeBlock !== 'notMoved' && (
          <button disabled={homeBlock !== null} onClick={() => askHome(def.id)}>
            {homeStage.level === 1 ? T.ui.homeStage1 : T.ui.homeStage2}
          </button>
        )}
        {works.map(({ w, block }) => (
          <button key={w.id} disabled={block !== null} onClick={() => askWork(def.id, w.id)}>
            {fill(T.easy.order, { name: easyName(w.id) })}
          </button>
        ))}
        {def.marketOnly && isMarketDay(game.clock.day) && <button onClick={() => open({ kind: 'trade' })}>{T.ui.talkTrade}</button>}
        <button disabled={block !== null} onClick={() => startHelp(def.id)} title={block ?? ''}>
          {helpLabel}
        </button>
        <button disabled={!canGift} onClick={() => open({ kind: 'gift', neighborId: def.id })}>
          {T.ui.talkGift}
        </button>
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
      {block === 'needs' && def.help.needs && <p className="hint">{fill(T.ui.helpNeeds, { items: itemList(def.help.needs) })}</p>}
      {block === 'done' && <p className="hint">{T.ui.helpDone}</p>}
      {block === 'tired' && <p className="hint">{T.ui.helpTired}</p>}
      {block === 'full' && <p className="hint">{T.ui.bagFull}</p>}
      {active && <p className="hint">{fill(T.ui.requestNeeds, { items: itemList(active.needs) })}</p>}
      {homeStage && homeBlock === 'ordered' && <p className="hint">{T.ui.homeWaiting}</p>}
      {homeStage && (homeBlock === null || homeBlock === 'coins' || homeBlock === 'needs') && (
        <p className="hint">{fill(T.ui.homeCost, { coins: homeStage.coins, items: itemList(homeStage.needs) })}</p>
      )}
      {works.some((x) => x.block === 'ordered') && <p className="hint">{T.easy.waiting}</p>}
      {works.some((x) => x.block === null || x.block === 'coins') && (
        <p className="hint">
          {works
            .filter((x) => x.block === null || x.block === 'coins')
            .map((x) => fill(T.easy.orderCost, { name: easyName(x.w.id), coins: x.w.coins }))
            .join(' · ')}
        </p>
      )}
      {game.gifted.includes(def.id) && <p className="hint">{T.ui.giftDone}</p>}
    </div>
  )
}
