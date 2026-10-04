import { CONTENT, NAMES, versesOf } from '../content/catalog'
import { CONNECTION_MIN, connectionsOf, copiedPlaces, copiedVerse, type NameDef } from './connections'
import { newGame } from './game'
import { deserialize, serialize } from './save'
import { BOOKS } from './types'

const base = () => newGame(CONTENT)
const withDone = (done: Partial<Record<(typeof BOOKS)[number], number[]>>) => {
  const s = base()
  const progress = { ...s.progress }
  for (const [b, chs] of Object.entries(done)) progress[b as keyof typeof progress] = { ...progress[b as keyof typeof progress], completed: chs! }
  return { ...s, progress }
}

describe('연결 — 필사한 절', () => {
  it('마친 장의 절, 지금 쓰는 장에서 이어 쓸 절보다 앞 절만 필사한 곳', () => {
    const s = { ...withDone({ mt: [4] }), copy: { book: 'mk' as const, at: { mk: { chapter: 1, verse: 17 } }, legacy: {} } }
    expect(copiedVerse(s, 'mt', 4, 18)).toBe(true)
    expect(copiedVerse(s, 'mt', 5, 1)).toBe(false)
    expect(copiedVerse(s, 'mk', 1, 16)).toBe(true)
    expect(copiedVerse(s, 'mk', 1, 17)).toBe(false) // 다음에 쓸 절 — 아직 쓰지 않았다
    expect(copiedVerse(s, 'mk', 2, 1)).toBe(false)
  })

  const defs: NameDef[] = [
    {
      name: '갑',
      kind: '사람',
      places: [
        { book: 'ac', chapter: 1, verse: 13, ref: '행 1:13' },
        { book: 'mt', chapter: 4, verse: 18, ref: '마 4:18' },
        { book: 'mk', chapter: 1, verse: 16, ref: '막 1:16' },
      ],
    },
    { name: '을', kind: '곳', places: [{ book: 'mt', chapter: 4, verse: 18, ref: '마 4:18' }] },
    {
      name: '병',
      kind: '곳',
      places: [
        { book: 'mt', chapter: 4, verse: 15, ref: '마 4:15' },
        { book: 'mt', chapter: 4, verse: 23, ref: '마 4:23' },
        { book: 'mt', chapter: 4, verse: 25, ref: '마 4:25' },
        { book: 'mt', chapter: 5, verse: 1, ref: '마 5:1' },
      ],
    },
  ]

  it('두 곳 이상 필사한 이름만, 필사한 곳이 많은 이름부터 — 절은 성경 순서, 책은 한 번씩 성경 순서', () => {
    const s = withDone({ mt: [4], ac: [1], mk: [1] })
    const got = connectionsOf(defs, s)
    expect(got.map((c) => c.name)).toEqual(['갑', '병'])
    expect(got[0].places.map((p) => p.ref)).toEqual(['마 4:18', '막 1:16', '행 1:13'])
    expect(got[0].books).toEqual(['mt', 'mk', 'ac'])
    expect(got[1].places.map((p) => p.ref)).toEqual(['마 4:15', '마 4:23', '마 4:25'])
    expect(got[1].books).toEqual(['mt'])
    expect(CONNECTION_MIN).toBe(2)
  })

  it('아무것도 쓰지 않았으면 연결이 없다, 한 곳만 썼으면 아직 없다', () => {
    expect(connectionsOf(NAMES, base())).toEqual([])
    expect(connectionsOf(defs, withDone({ ac: [1] }))).toEqual([])
    expect(copiedPlaces(defs[0], withDone({ ac: [1] })).map((p) => p.ref)).toEqual(['행 1:13'])
  })

  it('옛 저장(필사 칸이 없던 때): 예전에 엮은 장도 필사한 곳으로 친다 — 저장 칸 없이 다시 센다', () => {
    const s = withDone({ mt: [4], jn: [1] })
    const old = JSON.parse(serialize(s))
    delete old.copy
    delete old.copyStats
    const loaded = deserialize(JSON.stringify(old), CONTENT)!
    expect(loaded.copy.legacy).toEqual({ mt: [4], jn: [1] })
    const peter = connectionsOf(NAMES, loaded).find((c) => c.name === '베드로')!
    expect(peter.books).toEqual(['mt', 'jn'])
    expect(peter.places.map((p) => p.ref)).toContain('마 4:18')
    expect(peter.places.map((p) => p.ref)).toContain('요 1:42')
  })
})

describe('연결 데이터 (connections.json → catalog NAMES)', () => {
  it('이름마다 나오는 절이 있고, 구절이 실제 본문 절이며 책·장·절이 구절과 맞다', () => {
    expect(NAMES.length).toBeGreaterThan(40)
    for (const n of NAMES) {
      expect(n.places.length, n.name).toBeGreaterThan(0)
      for (const p of n.places) {
        expect(versesOf(p.ref), `${n.name} ${p.ref}`).toHaveLength(1)
        expect(p.ref.endsWith(` ${p.chapter}:${p.verse}`)).toBe(true)
        expect(BOOKS).toContain(p.book)
      }
    }
  })

  it('이름은 겹치지 않고, 사람·곳 둘 다 있다', () => {
    expect(new Set(NAMES.map((n) => n.name)).size).toBe(NAMES.length)
    expect(new Set(NAMES.map((n) => n.kind))).toEqual(new Set(['사람', '곳']))
  })

  it('동명이인: 마리아·요셉 무리는 같은 절에 두 줄이 겹치지 않고, 나사로는 요한복음에만', () => {
    const refs = (name: string) => NAMES.find((n) => n.name === name)!.places.map((p) => p.ref)
    const mother = refs('예수의 모친 마리아')
    expect(refs('막달라 마리아').filter((r) => mother.includes(r))).toEqual([])
    const husband = refs('마리아의 남편 요셉')
    expect(refs('아리마대 요셉').filter((r) => husband.includes(r))).toEqual([])
    expect(husband).not.toContain('마 13:55') // 예수의 형제 요셉
    expect(refs('나사로').every((r) => r.startsWith('요 '))).toBe(true) // 눅 16장 비유 속 나사로는 넣지 않는다
    expect(refs('가룟 유다')).not.toContain('요 14:22') // "가룟인 아닌 유다"
    expect(refs('바울')).not.toContain('행 13:21') // 기스의 아들 사울
  })

  it('찾는 말의 첫머리만: 사마리아의 "마리아", 드루실라의 "실라"는 세지 않는다', () => {
    const refs = (name: string) => NAMES.find((n) => n.name === name)!.places.map((p) => p.ref)
    expect(refs('예수의 모친 마리아')).not.toContain('요 4:9')
    expect(refs('실라')).not.toContain('행 24:24')
  })
})
