import { CONTENT } from '../content/catalog'
import { adoptStray, newGame, straysToday, tapTile } from './game'
import { STRAY_SPOTS } from './companion'
import { deserialize, serialize } from './save'

it('입양하지 않은 동물은 둘째·셋째 날만 기다리고 넷째 날부터 나타나거나 입양되지 않는다', () => {
  const base = newGame(CONTENT)
  const on = (day: number) => ({ ...base, scenes: [], clock: { day, minute: 600 } })
  expect(straysToday(on(1))).toEqual([])
  expect(straysToday(on(2))).toEqual(['cat','dog'])
  expect(straysToday(on(3))).toEqual(['cat','dog'])
  for(const day of [4,5,50]){
    const s=on(day)
    expect(straysToday(s)).toEqual([])
    expect(tapTile(s,STRAY_SPOTS.cat).target?.kind).not.toBe('stray')
    expect(adoptStray(s,'cat','나비')).toBe(s)
    expect(straysToday(deserialize(serialize(s),CONTENT)!)).toEqual([])
  }
  const adopted=adoptStray(on(3),'dog','누렁이')
  expect(deserialize(serialize({...adopted,clock:{day:50,minute:600}}),CONTENT)?.companion?.name).toBe('누렁이')
})
