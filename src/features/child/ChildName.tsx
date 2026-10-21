// 아이 이름 정하기 (계획 12): 짧은 목록에서 골라 주고 '다른 이름'으로 다시 뽑는다 (성 없이 이름만)
import { useState } from 'react'
import { nextName } from '../../engine/child'
import { useGame } from '../../store/game-store'

export function ChildName() {
  // 동생 이름을 정하는 중이면 그 동생 (2026-10-13)
  const child = useGame((s) => (s.game.flags.siblingNaming ? s.game.siblings?.[s.game.flags.siblingNaming - 1] : s.game.child))
  const setChildName = useGame((s) => s.setChildName)
  // 형제가 쓰는 이름은 건너뛴다 (같은 이름은 정해지지 않으므로 — 2026-10-21 점검)
  const taken = useGame((s) => [s.game.child, ...(s.game.siblings ?? [])].filter((k) => k && k !== child).map((k) => k!.name).join('|'))
  const another = (from: string, look: 'boy' | 'girl') => {
    const used = new Set(taken.split('|'))
    let n = nextName({ name: from, look })
    for (let i = 0; i < 40 && used.has(n); i++) n = nextName({ name: n, look })
    return n
  }
  const [name, setName] = useState(child?.name ?? '')
  if (!child) return null
  return (
    <div className="dialog child-name" role="dialog" aria-label="아이 이름">
      <h2>아이 이름</h2>
      <p>{child.look === 'boy' ? '사내아이' : '여자아이'}예요. 어떤 이름으로 부를까요?</p>
      <p className="child-name-pick">
        <strong>{name}</strong>
      </p>
      <div className="actions">
        <button onClick={() => setName(another(name, child.look))}>다른 이름</button>
        <button className="primary" onClick={() => setChildName(name)}>
          이 이름으로
        </button>
      </div>
    </div>
  )
}
