// 계획 20 2부 작업 D·E: 대화칸에 붙는 주민 가족 이야기 — 결혼 상담, 준비 돕기·다시 생각, 아기 침대.
// 설명 줄 없이 이웃의 말 한 줄과 단추만 (대화칸 규칙). 필요한 재료 줄만 짧게.
import { useState } from 'react'
import { neighborById } from '../../content/catalog'
import { fill, itemList, T, withAnd, withSubject } from '../../content/text'
import { heartUp, type GameState } from '../../engine/game'
import { answerConsult, consultFor, consultQuestion, helpPrep, pairOf, PREP_GAIN, PREP_TASKS, preparingFor, reconsider } from '../../engine/gen-marriage'
import { cribAskOf, cribAsker, CRIB_NEEDS, giveCrib } from '../../engine/gen-birth'
import { has, take } from '../../engine/items'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'
import { applyLifeState } from '../work/WorkDay'

const G = T.gen
// 생성된 사람(이어받은 자녀 등)은 그 이름으로 (22-C)
const nameOf = (id: string) => neighborById(id)?.role ?? useGame.getState().game.gen?.persons[id]?.name ?? ''

/** 이웃 말 속 상대 이름 채우기: {partner}·{partnerAnd}(와/과)·{partnerSubj}(이/가) */
export function partnerVars(id: string): Record<string, string> {
  const n = nameOf(id)
  return { partner: n, partnerAnd: withAnd(n), partnerSubj: withSubject(n) }
}

export function GenTalk({ npc }: { npc: string }) {
  const game = useGame((s) => s.game)
  const [line, setLine] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  const [sure, setSure] = useState(false)
  const g = game.gen
  if (!g?.on) return null
  const day = game.clock.day
  const commit = (next: GameState, say: string | null) => {
    applyLifeState(next)
    setLine(say)
  }

  // 결혼 상담: 친구에게 털어놓듯 (허락을 구하지 않는다)
  const consult = consultFor(g, npc, game.hearts, day)
  // 결혼 준비 중: 준비 돕기·다시 생각
  const prep = preparingFor(g, npc)
  const todo = prep?.prep?.tasks.find((x) => !prep.prep!.done.includes(x))
  // 아기 침대 부탁: 집 주인이 아닌 쪽이 꺼낸다
  const crib = cribAskOf(g, npc)
  const cribMine = crib && cribAsker(crib) === npc ? crib : null

  if (!consult && !prep && !cribMine && !line) return null
  const vars = (other: string) => partnerVars(other)

  return (
    <div className="gen-talk">
      {line && <p className="talk-line">{line}</p>}
      {consult && asking && (
        <>
          <p className="talk-line">{fill(G.consult[consultQuestion(g, consult)], vars(pairOf(consult, npc)))}</p>
          <div className="actions menu column">
            {(['cheer', 'wait'] as const).map((a) => (
              <button
                key={a}
                onClick={() => {
                  const cur = useGame.getState().game
                  if (!cur.gen) return
                  const r = answerConsult(cur.gen, consult.id, a, day)
                  setAsking(false)
                  const say = r.result === 'cheered' ? G.replies.cheered : r.result === 'wait' ? G.replies.waited : G.replies[a]
                  commit({ ...cur, gen: r.g }, fill(say, vars(pairOf(consult, npc))))
                }}
              >
                {G.answers[a]}
              </button>
            ))}
          </div>
        </>
      )}
      {prep && todo && <p className="talk-line">{fill(G.prepAsk, { ...vars(pairOf(prep, npc)), task: (G.prepTasks as Record<string, string>)[todo] ?? '' })}</p>}
      {prep && todo && <p className="hint">{fill(T.ui.helpNeeds, { items: itemList(PREP_TASKS[todo]) })}</p>}
      {cribMine && <p className="talk-line">{cribMine.cribAsk?.reasked ? G.cribAgain : G.cribAsk}</p>}
      {cribMine && <p className="hint">{fill(T.ui.helpNeeds, { items: itemList(CRIB_NEEDS) })}</p>}
      {!asking && (
        <div className="actions menu">
          {consult && <button className="primary" onClick={() => { setAsking(true); setLine(null) }}>{t('gen.consult')}</button>}
          {prep && todo && (
            <button
              disabled={!has(game.inv, PREP_TASKS[todo])}
              onClick={() => {
                const cur = useGame.getState().game
                const inv = take(cur.inv, PREP_TASKS[todo])
                const ng = cur.gen && helpPrep(cur.gen, prep.id, todo)
                if (!inv || !ng) return
                let next: GameState = { ...cur, inv, gen: ng }
                next = heartUp(heartUp(next, prep.a, PREP_GAIN), prep.b, PREP_GAIN)
                commit(next, G.prepThanks)
              }}
            >
              {t('gen.prepHelp')}
            </button>
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
            <button
              className="primary"
              disabled={!has(game.inv, CRIB_NEEDS)}
              onClick={() => {
                const cur = useGame.getState().game
                const inv = take(cur.inv, CRIB_NEEDS)
                const ng = cur.gen && giveCrib(cur.gen, cribMine.id, day)
                if (!inv || !ng) return
                const [a, b] = cribMine.members
                let next: GameState = { ...cur, inv, gen: ng }
                next = heartUp(heartUp(next, a, PREP_GAIN), b, PREP_GAIN)
                commit(next, G.cribThanks)
              }}
            >
              {t('gen.giveCrib')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
