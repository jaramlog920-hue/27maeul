// 아이 이름 정하기 (계획 12): 짧은 목록에서 골라 주고 '다른 이름'으로 다시 뽑는다 (성 없이 이름만)
import { useState } from 'react'
import { nextName } from '../../engine/child'
import { useGame } from '../../store/game-store'

export function ChildName() {
  const child = useGame((s) => s.game.child)
  const setChildName = useGame((s) => s.setChildName)
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
        <button onClick={() => setName(nextName({ name, look: child.look }))}>다른 이름</button>
        <button className="primary" onClick={() => setChildName(name)}>
          이 이름으로
        </button>
      </div>
    </div>
  )
}
