// 이웃과의 생활 대화 — 게임이 지어낸 말. 성경 본문은 이웃이 건넨 말씀 조각·편지의 본문 창으로만 본다.
import { neighborById } from '../../content/catalog'
import { useState } from 'react'
import { WorkDayView, WorkEntry } from '../work/WorkDay'
import { StallEntry } from '../stall/StallView'
import { SkillLessonView, SkillEntry } from '../skills/SkillLesson'
import { callName, fill, itemList, NEIGHBOR_LINES, T } from '../../content/text'
import { grapesRipe, isMarketDay } from '../../engine/calendar'
import { activeRequest, isSuitor, romanceWith, stageWith, type GameState, canHelp, canOrderHome, canOrderWork, GIFTABLE, lessonTime, nextHomeStage } from '../../engine/game'
import { CARPENTER_WORKS } from '../../engine/easier'
import { requestFor, reqState } from '../../engine/bonds'
import { has } from '../../engine/items'
import { MAX_HEART } from '../../engine/neighbors'
import { heartsOf } from '../../engine/hearts'
import { personOf } from '../../engine/people'
import { useGame, type Modal } from '../../store/game-store'

/** 사이의 이름: 연인·약혼·배우자, 아니면 낯선 사람 … 마음이 가는 사이 (같은 모습이면 특별한 사람까지) */
export function bondLabel(game: GameState, id: string): string {
  const r = romanceWith(game, id)
  if (r !== 'friend') return (T.romance.stage as Record<string, string>)[r]
  const st = Math.min(stageWith(game, id), isSuitor(game, neighborById(id)) ? 5 : 4)
  return T.people.stages[st]
}

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
  // 함께 일하기·배우기를 여는 동안에는 그 화면만 보인다 (선물하기 등 다른 단추를 가린다)
  const [focus, setFocus] = useState<'work' | 'skill' | null>(null)
  const { startHelp, open, closeModal, startTeach, say } = useGame.getState()
  // 이웃마다 있던 사기·팔기·받기 단추(주고받기·약방 약초 팔기)는 2026-10-05에 지웠다 — 사고팔기는 장날 좌판에서
  const def = neighborById(modal.neighborId)
  if (!def) return null
  const lines = NEIGHBOR_LINES[def.id]
  const block = canHelp(game, def)
  // 짧은 까닭(필요한 것·지침·가방 가득)은 대화칸에 줄로 달지 않고, 단추를 누르면 잠깐 뜨는 알림으로 (2026-10-05 사용자)
  const blockNote =
    block === 'needs' && def.help.needs ? fill(T.ui.helpNeeds, { items: itemList(def.help.needs) }) : block === 'tired' ? T.ui.helpTired : block === 'full' ? T.ui.bagFull : null
  const seasonal = def.id === 'grandpa' && grapesRipe(game.clock.day) && lines.helpSeason
  const helpLabel = seasonal ? lines.helpSeason!.label : lines.help.label
  const canGift = !game.gifted.includes(def.id) && GIFTABLE.some((i) => (game.inv[i] ?? 0) > 0)
  const teachable = def.id === 'child' && lessonTime(game)
  const req = requestFor(def.id, game.hearts[def.id], game.flags)
  const askable = req && reqState(game.flags, req.id) === 0
  const active = activeRequest(game, def.id)
  const { requestAsk, requestGive } = useGame.getState()
  // 목수에게 집 넓히기 부탁 (이사 온 뒤, 다음 단계가 남아 있으면)
  const homeStage = def.id === 'carpenter' ? nextHomeStage(game) : null
  const homeBlock = homeStage ? canOrderHome(game) : 'done'
  // 목수에게 살림 부탁 (계획 11): 이사 온 뒤, 아직 없는 것만
  const works = def.id === 'carpenter' ? CARPENTER_WORKS.map((w) => ({ w, block: canOrderWork(game, w.id) })).filter((x) => x.block !== 'notMoved' && x.block !== 'owned') : []
  // 목수에게 집 넓히기와 살림만 부탁한다.
  const orderable =
    def.id === 'carpenter' && game.flags['movedIn:carpenter'] && ((homeStage && homeBlock !== 'notMoved') || works.length > 0)
  // 편지 나르는 이웃은 말을 걸면 편지를 바로 건넨다 (2026-10-05: 편지 받기 단추 없음) — 건넨 편지 말 한 줄만 보인다
  const post = modal.letter
  if (focus)
    return (
      <div className="dialog talk" role="dialog" aria-label={def.role}>
        <p className="talk-role">{def.role}</p>
        {focus === 'work' ? <WorkDayView npc={def.id} close={() => setFocus(null)} /> : <SkillLessonView close={() => setFocus(null)} />}
      </div>
    )
  return (
    <div className="dialog talk" role="dialog" aria-label={def.role}>
      <p className="talk-role">
        {def.role}{' '}
        {/* 살아 움직이는 사람들 (계획 6b): 숫자 대신 사이의 이름 */}
        {personOf(def.id) ? <span className="talk-bond">{bondLabel(game, def.id)}</span> : <Hearts n={heartsOf(game.hearts[def.id])} />}
      </p>
      {modal.line && <p className="talk-line">{callName(modal.line, game.avatar?.name)}</p>}
      {/* 아침 방문 말 등 다른 말이 먼저 나와도 편지 알림은 가려지지 않는다 */}
      {post && post !== modal.line && <p className="talk-line">{post}</p>}
      <div className="actions menu">
        {/* 말씀 조각과 편지는 말을 걸 때 그 자리에서 건넨다 (받기 단추 없음) */}
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
          <button className="primary" onClick={() => (has(game.inv, active.needs) ? requestGive(def.id) : say(fill(T.ui.requestNeeds, { items: itemList(active.needs) })))}>
            {T.ui.talkFulfill}
          </button>
        )}
        {/* 집 넓히기와 살림 도구 부탁 */}
        {orderable && <button onClick={() => open({ kind: 'orders', npc: def.id })}>{T.orders.open}</button>}
        {def.marketOnly && isMarketDay(game.clock.day) && <button onClick={() => open({ kind: 'trade' })}>{T.ui.talkTrade}</button>}
        {def.marketOnly && isMarketDay(game.clock.day) && <StallEntry label={T.stall.ask} />}
        <button disabled={block !== null && !blockNote} onClick={() => (blockNote ? say(blockNote) : startHelp(def.id))}>
          {helpLabel}
        </button>
        <button disabled={!canGift} onClick={() => open({ kind: 'gift', neighborId: def.id })}>
          {T.ui.talkGift}
        </button>
        <WorkEntry npc={def.id} onOpen={() => setFocus('work')} />
        <SkillEntry npc={def.id} onOpen={() => setFocus('skill')} />
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
