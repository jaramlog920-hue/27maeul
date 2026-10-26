import { useState } from 'react'
import { T } from '../../content/text'
import { NAME_MAX, type Animal } from '../../engine/companion'
import { useGame } from '../../store/game-store'
import { forbiddenIn } from '../../content/forbidden'
import { BlockedButton } from '../../shared/BlockedButton'

export function AdoptForm({ animal }: { animal: Animal }) {
  const [name, setName] = useState('')
  const { adopt, closeModal } = useGame.getState()
  const title = animal === 'cat' ? T.ui.cat : T.ui.dog
  return (
    <div className="dialog" role="dialog" aria-label={title}>
      <h2>{title}</h2>
      <p>{T.ui.companionAsk}</p>
      <input value={name} maxLength={NAME_MAX} placeholder={T.ui.companionNamePlaceholder} aria-label={T.ui.companionNamePlaceholder} onChange={(e) => setName(e.target.value)} />
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.companionLater}</button>
        {/* 주인공 이름과 같은 금지어 규칙 (2026-10-26 감사 A21) */}
        <BlockedButton className="primary" why={forbiddenIn(name) ? T.avatar.problems.forbidden : null} onClick={() => adopt(animal, name)}>
          {T.ui.companionFeed}
        </BlockedButton>
      </div>
    </div>
  )
}
