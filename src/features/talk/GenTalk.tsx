// 계획 20 2부 작업 D·E: 대화칸에 붙는 주민 가족 이야기 — 결혼 상담, 준비 돕기·다시 생각, 아기 침대.
// 설명 줄 없이 이웃의 말 한 줄과 단추만 (대화칸 규칙). 필요한 재료 줄만 짧게.
import { useState } from 'react'
import { neighborById } from '../../content/catalog'
import { fill, itemList, T, withAnd, withSubject } from '../../content/text'
import { heartUp, type GameState } from '../../engine/game'
import { helpPrep, pairOf, PREP_GAIN, PREP_TASKS, preparingFor, reconsider } from '../../engine/gen-marriage'
import { cribAskOf, cribAsker, CRIB_NEEDS, giveCrib } from '../../engine/gen-birth'
import { has, take } from '../../engine/items'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'
import { applyLifeState } from '../work/WorkDay'
import { slotOfPerson } from '../../engine/gen-growth'

/**
 * 주민 결혼 준비·아기 침대의 마음은 그 사람의 이웃 자리(후계자면 이어받은 자리)에 — 사람 id('g-0001')에 쌓이면 보이지 않았다.
 * 이웃 자리가 아닌 주민은 마음 칸이 없으므로 건너뛴다 (2026-10-18 감사 L-49)
 */
function heartUpPerson(s: GameState, pid: string): GameState {
  const heir = slotOfPerson(s.gen ?? undefined, pid)
  const slot = neighborById(heir) ? heir : s.gen?.persons[pid]?.npc
  return slot && neighborById(slot) ? heartUp(s, slot, PREP_GAIN) : s
}
import { bakerCribWaiting, makeBakerCrib } from '../../engine/baker-baby'
import { BlockedButton } from '../../shared/BlockedButton'

const G = T.gen
// 생성된 사람(이어받은 자녀 등)은 그 이름으로 (22-C)
export const personName = (id: string): string => neighborById(id)?.role ?? useGame.getState().game.gen?.persons[id]?.name ?? ''

/** 이웃 말 속 상대 이름 채우기: {partner}·{partnerAnd}(와/과)·{partnerSubj}(이/가) */
export function partnerVars(id: string): Record<string, string> {
  const n = personName(id)
  return { partner: n, partnerAnd: withAnd(n), partnerSubj: withSubject(n) }
}

export function GenTalk({ npc }: { npc: string }) {
  return <><BakerBabyTalk npc={npc} /><AutonomousGenTalk npc={npc} /></>
}

function BakerBabyTalk({ npc }: { npc: string }) {
  const game = useGame(s => s.game)
  const [thanks, setThanks] = useState(false)
  const waiting = bakerCribWaiting(game, npc)
  if (npc !== 'baker' || (!waiting && !thanks)) return null
  return <div className="gen-talk">
    <p className="talk-line">{waiting ? G.bakerCribAsk : G.bakerCribThanks}</p>
    {waiting && <>
      <p className="hint">{fill(T.ui.helpNeeds, { items: itemList(CRIB_NEEDS) })}</p>
      <div className="actions menu"><BlockedButton className="primary" why={has(game.inv, CRIB_NEEDS) ? null : fill(T.ui.helpNeeds, { items: itemList(CRIB_NEEDS) })} onClick={() => {
        const next = makeBakerCrib(useGame.getState().game)
        if (!next) return
        applyLifeState(next)
        setThanks(true)
      }}>{t('gen.makeCrib')}</BlockedButton></div>
    </>}
  </div>
}

function AutonomousGenTalk({ npc }: { npc: string }) {
  const game = useGame((s) => s.game)
  const [line, setLine] = useState<string | null>(null)
  const [sure, setSure] = useState(false)
  const g = game.gen
  if (!g?.on) return null
  const day = game.clock.day
  const commit = (next: GameState, say: string | null) => {
    applyLifeState(next)
    setLine(say)
  }

  // 결혼 준비 중: 준비 돕기·다시 생각
  const prep = preparingFor(g, npc)
  const todo = prep?.prep?.tasks.find((x) => !prep.prep!.done.includes(x))
  // 아기 침대 부탁: 집 주인이 아닌 쪽이 꺼낸다
  const crib = cribAskOf(g, npc)
  const cribMine = crib && cribAsker(crib) === npc ? crib : null

  // 결혼 상담은 사랑방 게시판의 고민 쪽지로 옮겼다 (2026-10-27 사용자 — ConsultBoard)
  if (!prep && !cribMine && !line) return null
  const vars = (other: string) => partnerVars(other)

  return (
    <div className="gen-talk">
      {line && <p className="talk-line">{line}</p>}
      {prep && todo && <p className="talk-line">{fill(G.prepAsk, { ...vars(pairOf(prep, npc)), task: (G.prepTasks as Record<string, string>)[todo] ?? '' })}</p>}
      {prep && todo && <p className="hint">{fill(T.ui.helpNeeds, { items: itemList(PREP_TASKS[todo]) })}</p>}
      {cribMine && <p className="talk-line">{cribMine.cribAsk?.reasked ? G.cribAgain : G.cribAsk}</p>}
      {cribMine && <p className="hint">{fill(T.ui.helpNeeds, { items: itemList(CRIB_NEEDS) })}</p>}
      <div className="actions menu">
        {prep && todo && (
          <BlockedButton
            why={has(game.inv, PREP_TASKS[todo]) ? null : fill(T.ui.helpNeeds, { items: itemList(PREP_TASKS[todo]) })}
            onClick={() => {
              const cur = useGame.getState().game
              const inv = take(cur.inv, PREP_TASKS[todo])
              const ng = cur.gen && helpPrep(cur.gen, prep.id, todo)
              if (!inv || !ng) return
              let next: GameState = { ...cur, inv, gen: ng }
              next = heartUpPerson(heartUpPerson(next, prep.a), prep.b)
              commit(next, G.prepThanks)
            }}
          >
            {t('gen.prepHelp')}
          </BlockedButton>
        )}
        {prep && !sure && <button onClick={() => setSure(true)}>{t('gen.reconsider')}</button>}
        {prep && sure && (
          <>
            <button
              onClick={() => {
                const cur = useGame.getState().game
                if (!cur.gen) return
                setSure(false)
                commit({ ...cur, gen: reconsider(cur.gen, prep.id, day) }, G.reconsidered)
              }}
            >
              {t('gen.reconsiderSure')}
            </button>
            <button onClick={() => setSure(false)}>{t('gen.reconsiderNo')}</button>
          </>
        )}
        {cribMine && (
          <BlockedButton
            className="primary"
            why={has(game.inv, CRIB_NEEDS) ? null : fill(T.ui.helpNeeds, { items: itemList(CRIB_NEEDS) })}
            onClick={() => {
              const cur = useGame.getState().game
              const inv = take(cur.inv, CRIB_NEEDS)
              const ng = cur.gen && giveCrib(cur.gen, cribMine.id, day)
              if (!inv || !ng) return
              const [a, b] = cribMine.members
              let next: GameState = { ...cur, inv, gen: ng }
              next = heartUpPerson(heartUpPerson(next, a), b)
              commit(next, G.cribThanks)
            }}
          >
            {t('gen.giveCrib')}
          </BlockedButton>
        )}
      </div>
    </div>
  )
}
