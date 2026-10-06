import { useCallback } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { callName, fill, itemName, T } from '../../content/text'
import type { GameState } from '../../engine/game'
import { canDonate, canWork, crewPresent, donate, dropWork, finishWork, isBuilt, PROJECT_SUPPLY, projectLine, startWork, villageOf, workHand } from '../../engine/projects'
import { saveGame } from '../../engine/save'
import { SITES, type FacilityId } from '../../engine/village-sites'
import { isDone } from '../../engine/minigame'
import { useGame } from '../../store/game-store'
import { HandPractice } from '../work/HandPractice'

const V = T.village
type DefText = { name: string; short: string; where: string; effect: string; work: string; decor: string; balance: string }
export const defText = (id: FacilityId) => (V.defs as Record<string, DefText>)[id]

export function commitVillage(next: GameState) {
  saveGame(next)
  useGame.setState({ game: next })
}

/** 진행 정도(0~1)와 단계 문구 */
export function progressOf(game: GameState, id: FacilityId): { pct: number; stage: string } {
  const p = villageOf(game).projects[id]
  const r = p && p.need ? p.units / p.need : 0
  return { pct: Math.round(r * 100), stage: V.stage[r < 1 / 3 ? 0 : r < 2 / 3 ? 1 : 2] }
}

/** 선택 장식에 재료를 보태는 칸 (보태지 않아도 같은 모습으로 완성된다) */
export function DecorBox({ id }: { id: FacilityId }) {
  const game = useGame((s) => s.game)
  const block = canDonate(game, id)
  const d = SITES[id].decor
  if (block === 'none') return null
  const mats = fill(V.materials, { item: itemName(d.item), n: d.n })
  return (
    <div className="village-decor">
      <p>{defText(id).decor}</p>
      {block === 'already' ? (
        <p className="hint" role="status">{V.site.donated}</p>
      ) : (
        <>
          <div className="actions">
            <button disabled={block !== null} onClick={() => commitVillage(donate(useGame.getState().game, id))}>{V.site.donate} · {mats}</button>
          </div>
        </>
      )}
    </div>
  )
}

/** 짓고 있는 현장: 진행·일하는 이웃·거들기(손일 재사용)·선택 장식. 거들지 않아도 이웃들이 이어서 한다 */
export function VillageSite({ id }: { id: FacilityId }) {
  const game = useGame((s) => s.game)
  const closeModal = useGame((s) => s.closeModal)
  const v = villageOf(game)
  const w = v.work && v.work.id === id && v.work.day === game.clock.day ? v.work : undefined
  const tick = useCallback((dt: number) => {
    const s = useGame.getState()
    useGame.setState({ game: workHand(s.game, 'tick', dt, s.rng) })
  }, [])
  const tap = useCallback((input: number) => {
    const s = useGame.getState()
    useGame.setState({ game: workHand(s.game, 'tap', input, s.rng) })
  }, [])
  const t = defText(id)
  const exit = <button onClick={closeModal}>{V.site.close}</button>
  if (isBuilt(game.flags, id)) {
    return (
      <div className="dialog village-site" role="dialog" aria-label={t.name}>
        <h2>{t.name}</h2>
        <p role="status">{V.builtNote}</p>
        <div className="actions">{exit}</div>
      </div>
    )
  }
  const { pct, stage } = progressOf(game, id)
  const block = canWork(game, CONTENT)
  const crew = crewPresent(game, CONTENT)
  const who = crew.map((n) => neighborById(n)?.role).filter(Boolean).join(' · ')
  const line = crew.map((n) => projectLine(n, id, 'work')).find(Boolean)
  const p = v.projects[id]
  return (
    <div className="dialog village-site" role="dialog" aria-label={fill(V.site.title, { name: t.name })}>
      <h2>{fill(V.site.title, { name: t.name })}</h2>
      <p>{fill(V.site.progress, { pct, stage })}</p>
      <div className="mini-bar" role="progressbar" aria-label={t.name} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${pct}%` }} /></div>
      <p className="hint">{fill(V.siteHint, { where: t.where })}</p>
      {p && (
        <ul className="hint">
          {SITES[id].interested.filter((n) => (p.given[n] ?? 0) > 0 || crew.includes(n)).map((n) => (
            <li key={n}>{fill(V.given, { role: neighborById(n)?.role ?? '', n: p.given[n] ?? 0, max: PROJECT_SUPPLY })}</li>
          ))}
        </ul>
      )}
      <p>{who ? `${V.site.crew} · ${who}` : V.site.crewNone}</p>
      {line && <p className="talk-line">{callName(line, game.avatar?.name)}</p>}
      {w ? (
        <>
          <HandPractice state={w.mini} tick={tick} tap={tap} finish={() => commitVillage(finishWork(useGame.getState().game, CONTENT))} />
          {!isDone(w.mini) && <div className="actions"><button onClick={() => commitVillage(dropWork(useGame.getState().game))}>{V.site.workPause}</button></div>}
        </>
      ) : (
        <div className="actions menu column">
          <button className="primary" disabled={block !== null} onClick={() => { const s = useGame.getState(); commitVillage(startWork(s.game, CONTENT, s.rng)) }}>{V.site.work}</button>
          {block && <p className="hint">{V.site.blocks[block]}</p>}
        </div>
      )}
      {p?.worked.includes(game.clock.day) && !w && <p role="status">{V.site.workDone}</p>}
      <DecorBox id={id} />
      <div className="actions">{exit}</div>
    </div>
  )
}
