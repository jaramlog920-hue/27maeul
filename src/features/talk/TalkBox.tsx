// 이웃과의 생활 대화 — 게임이 지어낸 말. 성경 본문은 이웃이 건넨 말씀 조각·편지의 본문 창으로만 본다.
import { neighborById } from '../../content/catalog'
import {weddingGiftsFor} from '../../engine/wedding-attire'
import { useEffect, useState } from 'react'
import { WorkDayView, WorkEntry } from '../work/WorkDay'
import { StallEntry } from '../stall/StallEntry'
import { SkillLessonView, SkillEntry } from '../skills/SkillLesson'
import { callName, fill, HEART_HINTS, itemList, T } from '../../content/text'
import { isMarketDay } from '../../engine/calendar'
import { activeRequest, canBreakUp, canGiveBouquet, canGiveCord, canGiveLoveVerse, isSuitor, romanceWith, stageWith, type GameState, canHelp, canOrderHome, canOrderWork, GIFTABLE, nextHomeStage } from '../../engine/game'
import { DATING_DAYS } from '../../engine/romance'
import heartText from '../../content/heart-balance-text.json'
import { CARPENTER_WORKS } from '../../engine/easier'
import { GenTalk } from './GenTalk'
import { slotPerson } from '../../engine/gen-growth'
import { canHearDream, hearDream } from '../../engine/newland-life'
import { dreamText } from '../newland/dream-text'
import { saveGame } from '../../engine/save'
import { requestFor, reqState } from '../../engine/bonds'
import { has } from '../../engine/items'
import { MAX_HEART } from '../../engine/neighbors'
import { heartsOf } from '../../engine/hearts'
import { personOf } from '../../engine/people'
import { useGame, type Modal } from '../../store/game-store'
import { unseenTalkPopups } from '../../engine/talk-popups'
import { heartProgressBlock } from '../../engine/game'

/** 사이의 이름: 연인·약혼·배우자, 아니면 낯선 사람 … 마음이 가는 사이 (같은 모습이면 특별한 사람까지) */
export function bondLabel(game: GameState, id: string): string {
  const r = romanceWith(game, id)
  if (r !== 'friend') return (T.romance.stage as Record<string, string>)[r]
  const friendsOnly = !!game.flags[`friendsOnly:${slotPerson(game.gen, id)}`]
  const st = Math.min(stageWith(game, id), !friendsOnly && isSuitor(game, neighborById(id)) ? 5 : 4)
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
  // 처음 보는 특별한 말만 한 장씩. 큐는 창을 열 때 고정해 읽은 기록 갱신으로 다음 장이 건너뛰지 않게 한다.
  const extraLines = [...new Set([...(modal.letter && modal.letter !== modal.line ? [modal.letter] : []), ...(modal.popup ?? [])])]
  const [popups] = useState(() => unseenTalkPopups(game, modal.neighborId, extraLines))
  const [seen, setSeen] = useState(0)
  const popup = popups[seen]
  const markTalkPopupSeen = useGame(s => s.markTalkPopupSeen)
  // 실제로 표시한 장만 기록한다. 다음을 누르기 전에 닫아도, 아직 안 본 다음 장은 남는다.
  useEffect(() => {
    if (popup) markTalkPopupSeen(modal.neighborId, popup)
  }, [modal.neighborId, popup, markTalkPopupSeen])
  // 헤어지기는 한 번 더 묻는다
  const [asking, setAsking] = useState(false)
  const { startHelp, open, closeModal, say } = useGame.getState()
  // 이웃마다 있던 사기·팔기·받기 단추(주고받기·약방 약초 팔기)는 2026-10-05에 지웠다 — 사고팔기는 장날 좌판에서
  const def = neighborById(modal.neighborId)
  if (!def) return null
  const speaker = game.gen?.persons[slotPerson(game.gen, def.id)]?.name ?? def.role
  const block = canHelp(game, def)
  // 짧은 까닭(필요한 것·지침·가방 가득)은 대화칸에 줄로 달지 않고, 단추를 누르면 잠깐 뜨는 알림으로 (2026-10-05 사용자)
  const blockNote =
    block === 'needs' && def.help.needs ? fill(T.ui.helpNeeds, { items: itemList(def.help.needs) }) : block === 'tired' ? T.ui.helpTired : block === 'full' ? T.ui.bagFull : null
  // 단추 이름은 이웃마다 다른 일 이름 대신 그냥 "돕기" (2026-10-07 사용자)
  const canGift = (!game.gifted.includes(def.id) && GIFTABLE.some((i) => (game.inv[i] ?? 0) > 0))||weddingGiftsFor(game,def.id).length>0
  // 선물할 수 없을 때는 단추를 끄지 않고 까닭을 알린다 (2026-10-19 감사 L-65)
  const giftNote = canGift ? null : game.gifted.includes(def.id) ? T.ui.giftedToday : T.ui.giftNothing
  const req = requestFor(def.id, game.hearts[def.id], game.flags)
  const askable = req && reqState(game.flags, req.id) === 0
  const active = activeRequest(game, def.id)
  const { requestAsk, requestGive } = useGame.getState()
  // 목수에게 집 넓히기 부탁 (이사 온 뒤, 다음 단계가 남아 있으면)
  const heartBlock = heartProgressBlock(game, def.id)
  const bouquetBlock = canGiveBouquet(game, def)
  const bouquetVisible = bouquetBlock === null || bouquetBlock === 'noItem' || (bouquetBlock === 'cooling' && heartsOf(game.hearts[def.id]) >= 8)
  const cordBlock = canGiveCord(game, def)
  const cordNote = cordBlock === 'locked' ? heartText.proposalLocked
    : cordBlock === 'days' ? (game.romance.bondRequired ? HEART_HINTS.bond : fill(T.romance.cordDays, { n: DATING_DAYS }))
    : cordBlock === 'hearts' ? T.romance.cordHearts
    : cordBlock === 'bond' ? HEART_HINTS.bond
    : cordBlock === 'room' ? T.romance.cordRoom
    : cordBlock === 'noItem' ? T.romance.cordNoItem : null
  const homeStage = def.id === 'carpenter' ? nextHomeStage(game) : null
  const homeBlock = homeStage ? canOrderHome(game) : 'done'
  // 목수에게 살림 부탁 (계획 11): 이사 온 뒤, 아직 없는 것만
  const works = def.id === 'carpenter' ? CARPENTER_WORKS.map((w) => ({ w, block: canOrderWork(game, w.id) })).filter((x) => x.block !== 'notMoved' && x.block !== 'owned') : []
  // 목수에게 집 넓히기와 살림만 부탁한다.
  const orderable =
    def.id === 'carpenter' && game.flags['movedIn:carpenter'] && ((homeStage && homeBlock !== 'notMoved') || works.length > 0)
  if (popup)
    return (
      <div className="dialog talk talk-popup" role="dialog" aria-label={speaker}>
        <p className="talk-role">{speaker}</p>
        <p className="talk-popup-line">{callName(popup, game.avatar?.name)}</p>
        <div className="actions">
          <button className="primary" autoFocus onClick={() => setSeen(n => n + 1)}>
            {T.ui.next}
          </button>
        </div>
      </div>
    )
  if (asking)
    return (
      <div className="dialog talk talk-popup" role="dialog" aria-label={speaker}>
        <p className="talk-role">{speaker}</p>
        <p className="talk-popup-line">{T.romance.breakAsk}</p>
        <div className="actions">
          <button onClick={() => useGame.getState().breakUp(def.id)}>{T.romance.breakUp}</button>
          <button className="primary" autoFocus onClick={() => setAsking(false)}>
            {T.romance.breakNo}
          </button>
        </div>
      </div>
    )
  if (focus)
    return (
      <div className="dialog talk" role="dialog" aria-label={speaker}>
        <p className="talk-role">{speaker}</p>
        {focus === 'work' ? <WorkDayView npc={def.id} close={() => setFocus(null)} /> : <SkillLessonView close={() => setFocus(null)} />}
      </div>
    )
  return (
    <div className="dialog talk" role="dialog" aria-label={speaker}>
      {/* 머리는 예전 그대로 한 줄, 닫기만 오른쪽 위 ✕ (2026-10-07 사용자) */}
      <div className="dialog-head talk-head">
        <p className="talk-role">
          {/* 은퇴 뒤 일을 이어받은 자녀가 대화하는 자리 */}
          {speaker}{' '}
          {def.job && <span className="talk-job">{def.job}</span>}{' '}
          {/* 살아 움직이는 사람들 (계획 6b): 숫자 대신 사이의 이름 */}
          {personOf(def.id) && <span className="talk-bond">{bondLabel(game, def.id)}</span>}{' '}
          {/* 호감도는 사이의 이름과 함께 늘 보인다 (2026-10-07 사용자) */}
          <Hearts n={heartsOf(game.hearts[def.id])} />
        </p>
        <button data-close className="head-x" aria-label={T.ui.close} title={T.ui.close} onClick={closeModal}>✕</button>
      </div>
      {modal.line && <p className="talk-line">{callName(modal.line, game.avatar?.name)}</p>}
      {heartBlock && <p className="hint">{HEART_HINTS[heartBlock]}</p>}
      {/* 이미 들은 특별 대사·편지도 내용을 지우지 않고 일반 대화에 남긴다. */}
      {extraLines.filter(line => line !== modal.line).map(line => <p key={line} className="talk-line">{callName(line, game.avatar?.name)}</p>)}
      {/* 다른 마을 서고 소문 (계획 21 R6) */}
      {modal.rumor && <p className="talk-line">{modal.rumor}</p>}
      {/* 주민 가족 이야기 (계획 20 2부): 결혼 상담·준비 돕기·다시 생각·아기 침대 */}
      <GenTalk npc={slotPerson(game.gen, def.id)} />
      <div className="actions menu">
        {/* 말씀 조각과 편지는 말을 걸 때 그 자리에서 건넨다 (받기 단추 없음) */}
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
          {T.ui.talkHelp}
        </button>
        <button aria-disabled={!canGift} onClick={() => (giftNote ? say(giftNote, 3500) : open({ kind: 'gift', neighborId: def.id }))}>
          {T.ui.talkGift}
        </button>
        <WorkEntry npc={def.id} onOpen={() => setFocus('work')} />
        <SkillEntry npc={def.id} onOpen={() => setFocus('skill')} />
        {/* 친구로 남았거나 아직 사귀지 않은 후보에게도 마음을 전할 수 있다. */}
        {bouquetVisible && (
          <button onClick={() => bouquetBlock === 'noItem' ? say(T.romance.bouquetNoItem) : bouquetBlock === 'cooling' ? say(HEART_HINTS.cooling) : useGame.getState().giveBouquet(def.id)}>{T.romance.giveBouquet}</button>
        )}
        {romanceWith(game, def.id) === 'dating' && (
          <button onClick={() => cordNote ? say(cordNote, 4000) : useGame.getState().giveCord(def.id)}>{T.romance.giveCord}</button>
        )}
        {canGiveLoveVerse(game, def.id) && <button onClick={() => useGame.getState().open({ kind: 'loveVerse' })}>{T.romance.loveVerse}</button>}
          {canBreakUp(game, def.id) && <button onClick={() => setAsking(true)}>{T.romance.breakUp}</button>}
        {/* 주민의 꿈 (계획 18 B18-8): 새 터가 열리고 마음이 가까우면 한 번 */}
        {canHearDream(game, def.id) && (
          <button
            onClick={() => {
              const next = hearDream(useGame.getState().game, def.id)
              saveGame(next)
              useGame.setState({ game: next })
              say(dreamText(def.id).heard, 5200)
            }}
          >
            {T.newlandLife.dream.ask}
          </button>
        )}
      </div>
    </div>
  )
}
