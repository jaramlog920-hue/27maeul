import { useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { callName, fill, itemName, T } from '../../content/text'
import { builtIds, canPick, canUndoPick, eligible, offeredProjects, PROJECT_SUPPLY, PROJECT_WORK_MAX, pickProject, projectLine, setLook, undoPick, villageOf } from '../../engine/projects'
import { SITES, type FacilityId } from '../../engine/village-sites'
import { useGame } from '../../store/game-store'
import { commitVillage, DecorBox, defText, progressOf } from './VillageSite'

const V = T.village

/** 사랑방 게시판의 "마을 일" 칸: 제안 보기 → 이웃들의 의견 → 하나 고르기 → 진행 보기. 휴대폰에서는 한 화면에 한 가지씩 */
export function VillageBoard() {
  const game = useGame((s) => s.game)
  const [sel, setSel] = useState<FacilityId | null>(null)
  const v = villageOf(game)
  const active = v.active
  const offered = offeredProjects(game, CONTENT)
  const built = builtIds(game.flags)
  const name = game.avatar?.name

  if (sel) {
    const id = sel
    const t = defText(id)
    const site = SITES[id]
    const joined = eligible(game, CONTENT, id)
    const block = canPick(game, id, CONTENT)
    const d = site.decor
    return (
      <section aria-label={t.name}>
        <h3>{t.name}</h3>
        <p>{t.effect}</p>
        <p className="hint">{V.where} · {t.where}</p>
        <p className="hint">{V.work} · {t.work}</p>
        <p className="hint">{fill(V.workLine, { n: joined.length, max: PROJECT_WORK_MAX })}</p>
        <p className="hint">{V.decorLabel} · {t.decor} ({fill(V.materials, { item: itemName(d.item), n: d.n })})</p>
        <p>{V.neighbors}</p>
        <ul className="village-opinions">
          {joined.map((n) => {
            const line = active && active !== id ? projectLine(n, id, 'next') ?? projectLine(n, id, 'opinion') : projectLine(n, id, 'opinion')
            return (
              <li key={n}>
                <strong>{neighborById(n)?.role}</strong>
                {line ? ` · ${callName(line, name)}` : ''}
              </li>
            )
          })}
        </ul>
        <p className="hint">{V.balanceTitle} · {t.balance}</p>
        <div className="actions menu column">
          <button className="primary" disabled={block !== null} onClick={() => { commitVillage(pickProject(useGame.getState().game, id, CONTENT)); setSel(null) }}>{V.pick}</button>
          <button onClick={() => setSel(null)}>{V.back}</button>
        </div>
      </section>
    )
  }

  const act = active ? v.projects[active] : undefined
  return (
    <section aria-label={V.title}>
      <h3>{V.title}</h3>
      {active && act && (
        <div className="village-active">
          <p><strong>{V.activeTitle}</strong> · {defText(active).name}</p>
          <p>{fill(V.progress, { pct: progressOf(game, active).pct })} · {progressOf(game, active).stage}</p>
          <div className="mini-bar" role="progressbar" aria-label={defText(active).name} aria-valuenow={progressOf(game, active).pct} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${progressOf(game, active).pct}%` }} /></div>
          <ul className="hint">
            {SITES[active].interested.map((n) => (
              <li key={n}>{fill(V.given, { role: neighborById(n)?.role ?? '', n: act.given[n] ?? 0, max: PROJECT_SUPPLY })}</li>
            ))}
          </ul>
          <p className="hint">{fill(V.siteHint, { where: defText(active).where })}</p>
          <DecorBox id={active} />
          {canUndoPick(game) && <div className="actions"><button onClick={() => commitVillage(undoPick(useGame.getState().game))}>{V.undo}</button></div>}
        </div>
      )}
      {offered.filter((id) => id !== active).length > 0 && <p>{active ? V.queued : V.listHint}</p>}
      <div className="actions menu column">
        {offered.filter((id) => id !== active).map((id) => (
          <button key={id} onClick={() => setSel(id)}>{defText(id).name} · {defText(id).short}</button>
        ))}
      </div>
      {!active && offered.length === 0 && built.length < SITES_COUNT && <p className="hint">{V.empty}</p>}
      {built.length > 0 && (
        <>
          <p>{V.builtTitle}</p>
          <ul className="village-built">
            {built.map((id) => {
              const p = v.projects[id]
              return (
                <li key={id}>
                  <strong>{defText(id).name}</strong>
                  {p?.donated && <button onClick={() => commitVillage(setLook(useGame.getState().game, id, p.look ? 0 : 1))}>{p.look ? V.menu.lookOff : V.menu.lookOn}</button>}
                  {p && !p.donated && <DecorBox id={id} />}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

const SITES_COUNT = Object.keys(SITES).length
