// 손주 맞이 (2026-10-21 사용자: 240장) — 주민의 손주가 태어난 아침, 아기 이름을 함께 짓는다 (다른 이름을 골라 보거나 그대로)
import { useState } from 'react'
import { GEN_CHILD_NAMES } from '../../engine/gen-birth'
import { renamePerson } from '../../engine/family-tree'
import { saveGame } from '../../engine/save'
import { personName } from '../../content/gen-text'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'

export function GenBabyName({ id }: { id: string }) {
  const game = useGame((s) => s.game)
  const baby = game.gen?.persons[id]
  const [name, setName] = useState(baby?.name ?? '')
  if (!baby || !game.gen) return null
  const look = baby.look ?? 'f'
  const taken = new Set(Object.values(game.gen.persons).filter((p) => p.id !== id).map((p) => p.name).filter(Boolean))
  const another = () => {
    const list = GEN_CHILD_NAMES[look]
    let i = list.indexOf(name)
    for (let n = 0; n < list.length; n++) { i = (i + 1) % list.length; if (!taken.has(list[i])) break }
    setName(list[i])
  }
  const parents = baby.parents.map((p) => personName(game, p)).join('·')
  const finish = (keep: boolean) => {
    const cur = useGame.getState().game
    const gen = keep ? cur.gen! : renamePerson(cur.gen!, id, name)
    const flags = { ...cur.flags }
    delete flags.grandNaming
    // 같은 아침 태어난 다른 손주가 기다리면 다음 차례로 (다음 장면 틈에 창이 다시 뜬다)
    const waiting = Object.keys(flags).filter((k) => k.startsWith('grandNext:')).map((k) => Number(k.slice('grandNext:'.length))).sort((a, b) => a - b)
    if (waiting.length) { flags.grandNaming = waiting[0]; delete flags[`grandNext:${waiting[0]}`] }
    const next = { ...cur, gen, flags }
    saveGame(next)
    useGame.setState({ game: next, modal: null })
  }
  return (
    <div className="dialog child-name" role="dialog" aria-label={t('grandBirth.title')}>
      <h2>{t('grandBirth.title')}</h2>
      <p>{t('grandBirth.lead', { parents, kind: look === 'm' ? '사내아이' : '여자아이' })}</p>
      <p className="child-name-pick"><strong>{name}</strong></p>
      <div className="actions">
        <button onClick={another}>다른 이름</button>
        <button onClick={() => finish(true)}>지어진 이름 그대로</button>
        <button className="primary" onClick={() => finish(false)}>이 이름으로</button>
      </div>
    </div>
  )
}
