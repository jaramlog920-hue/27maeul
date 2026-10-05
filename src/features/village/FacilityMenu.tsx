import { neighborById } from '../../content/catalog'
import { callName, T } from '../../content/text'
import { seasonOf } from '../../engine/clock'
import { setLook, projectLine, usersAt, villageOf } from '../../engine/projects'
import { facilityOfPlace, type FacilityPlace } from '../../engine/village-sites'
import { useGame } from '../../store/game-store'
import { commitVillage } from './VillageSite'

const V = T.village

/** 완성된 공동 시설 자리의 할 일: 긴 벤치(곁 이야기·앉아 쉬기)·꽃밭(철마다 살펴보기)·그늘막(쉬기)·안내판(표지 읽기), 선택 장식 켜고 끄기 */
export function FacilityMenu({ place }: { place: FacilityPlace }) {
  const game = useGame((s) => s.game)
  const { rest, say } = useGame.getState()
  const id = facilityOfPlace(place)!
  const p = villageOf(game).projects[id]
  const users = usersAt(game, id)
  const heard = users.map((n) => ({ n, line: projectLine(n, id, 'used') })).filter((x) => x.line)
  const speak = () => {
    const first = heard[0]
    say(first ? `${neighborById(first.n)?.role ?? ''} · ${callName(first.line!, game.avatar?.name)}` : V.menu.noOne, 3600)
  }
  return (
    <>
      {id === 'longBench' && (
        <>
          <button className="primary" onClick={speak}>{V.menu.sit}</button>
          <button onClick={rest}>{V.menu.rest}</button>
        </>
      )}
      {id === 'shade' && <button className="primary" onClick={rest}>{V.menu.rest}</button>}
      {id === 'flowerBed' && <button className="primary" onClick={() => say(V.menu.season[seasonOf(game.clock.day)], 3600)}>{V.menu.observe}</button>}
      {id === 'signPost' && <button className="primary" onClick={() => say(V.menu.sign, 3600)}>{V.menu.read}</button>}
      {p?.donated && <button onClick={() => commitVillage(setLook(useGame.getState().game, id, p.look ? 0 : 1))}>{p.look ? V.menu.lookOff : V.menu.lookOn}</button>}
    </>
  )
}

/** 시설 곁에서 이웃이 하는 말 (함께 지은 이웃이 곁에 있을 때) */
export function FacilityHint({ place }: { place: FacilityPlace }) {
  const game = useGame((s) => s.game)
  const id = facilityOfPlace(place)!
  const users = usersAt(game, id)
  return <p className="hint">{V.menu.shared}{users.length ? ` · ${users.map((n) => neighborById(n)?.role).join(' · ')}` : ''}</p>
}
