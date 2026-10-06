import { useCallback, useEffect, useRef, useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { fill, itemList, itemName, T } from '../../content/text'
import { canLearn, canShowSkillItem, chooseSkillStyle, chooseStyle, craftLearned, discoveredSkill, finishLesson, lessonHand, lookAgain, SKILL_DEFS, SKILL_IDS, skillOf, startLesson, styleOf, type SkillState } from '../../engine/skills'
import { has } from '../../engine/items'
import { overflows, stageWith } from '../../engine/game'
import { relOf } from '../../engine/people'
import { EXPANSION_PROPS } from '../../render/expansion-prop-art'
import { FURNI_PALETTE } from '../../render/furniture-art'
import { useGame } from '../../store/game-store'
import { applyLifeState } from '../work/WorkDay'
import { HandPractice } from '../work/HandPractice'

const S = T.skill
interface LessonText { name: string; demo: Record<string, string>; styles: Record<string, string>; reply: Record<string, string>; replyClose?: Record<string, string> }
const lessonText = (id: string) => (S.lessons as Record<string, LessonText>)[id]
const placeName = (id: string) => S.places[SKILL_DEFS[id].at]

/** 시범에서 보여 주는 소품 (assets/furniture/expansion — 16px 원본을 그대로 키운다) */
function PropPreview({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const g = ref.current?.getContext?.('2d')
    const a = EXPANSION_PROPS[id]
    if (!g || !a) return
    g.clearRect(0, 0, 16, 16)
    a.rows.forEach((row, y) => [...row].forEach((ch, x) => {
      const c = FURNI_PALETTE[ch]
      if (ch === '.' || !c) return
      g.fillStyle = c
      g.fillRect(x, y, 1, 1)
    }))
  }, [id])
  return <canvas ref={ref} className="skill-prop" width={16} height={16} aria-hidden="true" style={{ width: 32, height: 32, imageRendering: 'pixelated', verticalAlign: 'middle' }} />
}

/** 말 걸기 창의 "함께 배우기". onOpen을 주면 배우는 화면을 부르는 쪽(말 걸기 창)이 연다 */
export function SkillEntry({ npc = 'carpenter', onOpen }: { npc?: string; onOpen?: () => void }) {
  const game = useGame((s) => s.game) as SkillState
  const [opened, setOpened] = useState(false)
  const [shown, setShown] = useState(false)
  const id = skillOf(npc)
  if (!id || !discoveredSkill(game, id)) return null
  const text = lessonText(id)
  if (game.skills?.[id]) {
    if (!canShowSkillItem(game, id)) return null
    const r = game.romance?.partner === npc ? game.romance.stage : null
    const rel = relOf(stageWith(game, npc), r)
    const reply = ((rel === 'lover' || rel === 'spouse') && text.replyClose?.[npc]) || text.reply[npc]
    return <>{!shown && <button onClick={() => setShown(true)}>{S.show}</button>}{shown && reply && <p className="talk-line" role="status">{reply}</p>}</>
  }
  if (opened) return <SkillLessonView close={() => setOpened(false)} />
  const begin = () => {
    const st = useGame.getState()
    const block = canLearn(st.game as SkillState, npc, CONTENT)
    if (block === 'away' || block === 'busy' || block === 'late') { st.say(S.blocks[block]); return }
    applyLifeState(startLesson(st.game as SkillState, npc, CONTENT))
    if (onOpen) onOpen()
    else setOpened(true)
  }
  return <button onClick={begin}>{`${text.name} ${S.entry}`}</button>
}

export function SkillLessonView({ close }: { close: () => void }) {
  const game = useGame((s) => s.game) as SkillState
  const l = game.skillLesson
  const tick = useCallback((dt: number) => { const s = useGame.getState(); applyLifeState(lessonHand(s.game, 'tick', dt, s.rng), false) }, [])
  const tap = useCallback((input: number) => { const s = useGame.getState(); applyLifeState(lessonHand(s.game, 'tap', input, s.rng), false) }, [])
  if (!l || !SKILL_IDS.includes(l.id)) return <section aria-label={S.title}><button onClick={close}>{S.pause}</button></section>
  const def = SKILL_DEFS[l.id]
  const text = lessonText(l.id)
  const pick = (picked: string) => { const s = useGame.getState(); applyLifeState(chooseStyle(s.game, picked, s.rng)) }
  const learned = !!game.skills?.[l.id]
  return <section aria-label={text.name}><h3>{text.name}</h3>
    {l.step === 0 && <>
      <p className="talk-line">{text.demo[l.npc]}</p>
      {def.styles.map((st, i) => <button key={st} onClick={() => pick(st)}><PropPreview id={def.art[i]} /> {text.styles[st]}</button>)}
    </>}
    {l.step === 1 && l.mini && <>
      <HandPractice state={l.mini} tick={tick} tap={tap} finish={() => applyLifeState(finishLesson(useGame.getState().game))} />
      <button onClick={() => applyLifeState(lookAgain(useGame.getState().game))}>{S.again}</button>
    </>}
    {learned && <p role="status">{fill(S.learned, { place: placeName(l.id), item: itemName(def.item) })}</p>}
    <button onClick={close}>{learned ? T.ui.close : S.pause}</button>
  </section>
}
/** 옛 이름 — 목수 마감법 화면 */
export const FinishLesson = SkillLessonView

/** 작업대·화덕: 배운 기술의 모습 고르기와 개인 재료로 만들기 */
export function SkillCraftOptions({ at = 'workbench' }: { at?: 'workbench' | 'hearth' }) {
  const game = useGame((s) => s.game) as SkillState
  const ids = SKILL_IDS.filter((id) => game.skills?.[id] && SKILL_DEFS[id].at === at)
  if (!ids.length) return null
  return <section aria-label={S.options}><h3>{S.options}</h3>
    {ids.map((id) => {
      const def = SKILL_DEFS[id], text = lessonText(id), item = itemName(def.item)
      const selected = styleOf(game, id)
      const needs = def.needs && !has(game.inv, def.needs)
      const full = overflows(game, { [def.item]: 1 })
      const from = neighborById(game.skills![id].from)
      return <div key={id} className="skill-option">
        <p><b>{text.name}</b>{from && ` · ${fill(S.teacher, { name: from.role })}`}</p>
        <div className="actions">{def.styles.map((st) => <button key={st} aria-pressed={selected === st} onClick={() => applyLifeState(chooseSkillStyle(useGame.getState().game, id, st))}>{text.styles[st]}</button>)}</div>
        {def.needs
          ? <><p className="hint">{fill(S.materials, { items: itemList(def.needs), item })}</p>
            <button disabled={!!needs || full} onClick={() => applyLifeState(craftLearned(useGame.getState().game, id))}>{fill(S.make, { item })}</button>
            </>
          : null}
      </div>
    })}
  </section>
}
