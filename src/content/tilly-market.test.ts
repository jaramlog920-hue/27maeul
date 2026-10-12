import { PEOPLE } from './catalog'

it('틸리의 좌판은 망치 설명과 장인의 제작품 간판으로 이어지고 저장 기억은 유지한다', () => {
  const event = PEOPLE.people.tilly.events!.find(e => e.id === 'tilly:market')!
  expect(event.title).toBe('튼튼한 망치')
  expect(event.lines[1].text).toContain('망치가 비싸')
  expect(event.choices!.map(c => c.label)).toEqual(['“제가 대신 말해 볼게요”', '“장인의 제작품” 써 붙이기', '“틸리 방식대로 해요”'])
  expect(event.choices![0].reply[0].text).toContain('손잡이')
  expect(event.choices![1].reply[1].text).toContain('망치를')
  expect(event.choices!.map(c => c.memory)).toEqual(['helpedStall', 'noBendSign', 'ownWay'])
  expect(JSON.stringify(event)).not.toMatch(/안 휘면|환불|못 좌판|튼튼한 못|못이 다 팔/)
})
