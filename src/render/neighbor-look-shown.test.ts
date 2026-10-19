// 장면도 마을에서 보이는 외관대로 (2026-10-19 사용자: 바질 장면에 다른 사람이 나왔다)
import { neighborById } from '../content/catalog'
import { appearanceSprite, neighborLook, shownDef } from './neighbor-look'
import { previewActor } from '../features/scene/event-preview-art'

it('바질은 장면에서도 마을과 같은 도트로, 이어받은 자녀는 제 모습', () => {
  const basil = neighborById('basil')!
  expect(neighborLook(basil).who).toBe(basil.appearance!.sprite)
  expect(appearanceSprite(basil)).toBe(basil.appearance!.sprite)
  expect(appearanceSprite(basil, true)).toBeUndefined()
  expect(shownDef(basil).avatar).toBeUndefined()
  expect(previewActor('person:basil').who).toBe(basil.appearance!.sprite)
})

it('다른 옷장 모습으로 바꾼 이웃은 그 모습으로', () => {
  const weaver = neighborById('weaver')!
  expect(shownDef(weaver).avatar).toEqual(weaver.appearance!.avatar)
  expect(previewActor('person:weaver').who).toBe('writer')
})
