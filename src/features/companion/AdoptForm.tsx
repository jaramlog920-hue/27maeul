import { useState } from 'react'
import { T } from '../../content/text'
import { NAME_MAX, type Animal } from '../../engine/companion'
import { useGame } from '../../store/game-store'

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
        <button onClick={closeModal}>{T.ui.companionLater}</button>
        <button className="primary" onClick={() => adopt(animal, name)}>
          {T.ui.companionFeed}
        </button>
      </div>
    </div>
  )
}
