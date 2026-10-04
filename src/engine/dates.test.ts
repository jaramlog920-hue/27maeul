// 연인과 함께 가기 (계획 10 작업 4): 찻집·정자·언덕에서 짧은 장면, 하루 한 번, 마음·기분, 곳마다 처음은 앨범
import { CONTENT } from '../content/catalog'
import { forbiddenIn } from '../content/forbidden'
import { ALBUM_IDS, JOURNAL_NOTES, partnerFill, SCENES } from '../content/text'
import { isWet, weatherOf } from './calendar'
import { isFamilyNote } from './daybook'
import { isFamilyAlbum } from './family'
import { canDate, clearSky, goOnDate, newGame, partnerFree, sceneSeen, type GameState } from './game'
import { DATE_MOOD, moodOf } from './mood'
import { DATE_FIRST_SCENE, DATE_PLACES, DATE_TEA_PRICE, DATE_VARIANTS, NO_ROMANCE, type DatePlace, type Romance, type RomanceStage } from './romance'
import { deserialize, serialize } from './save'

/** 궂지 않고 노을이 보이는 날 (3일째부터) */
function clearDay(from = 3): number {
  for (let d = from; d < from + 60; d++) if (!isWet(weatherOf(d)) && clearSky(d)) return d
  throw new Error('no clear day')
}
function wetDay(from = 3): number {
  for (let d = from; d < from + 120; d++) if (isWet(weatherOf(d))) return d
  throw new Error('no wet day')
}

const FAMILIES = ['baker', 'fisher', 'carpenter', 'shepherd', 'apothecary', 'grandpa', 'weaver', 'smith', 'beekeeper', 'teahouse']
function withPartner(partner = 'wendell', stage: RomanceStage = 'dating', day = clearDay(), minute = 14 * 60): GameState {
  const g = newGame(CONTENT)
  const flags: Record<string, number> = { ...g.flags, villageLevel: 99 }
  for (const f of FAMILIES) flags[`movedIn:${f}`] = 1
  for (const n of CONTENT.neighbors) if (n.joinsAtBooks !== undefined) flags[`movedIn:${n.id}`] = 1
  const romance: Romance = { ...NO_ROMANCE, partner, stage, since: 1, marriedDay: stage === 'married' ? 1 : null }
  return { ...g, scenes: [], coins: 50, flags, romance, hearts: { ...g.hearts, [partner]: 1 }, clock: { ...g.clock, day, minute } }
}
const at = (s: GameState, minute: number, day = s.clock.day): GameState => ({ ...s, clock: { ...s.clock, day, minute } })

describe('함께 가기 — 누구와, 언제', () => {
  it('연인·약혼·부부만 (친구는 버튼이 없다)', () => {
    const none = { ...withPartner(), romance: NO_ROMANCE }
    for (const p of DATE_PLACES) expect(canDate(none, p, CONTENT)).toBe('noPartner')
    for (const st of ['dating', 'engaged', 'married'] as const) expect(canDate(withPartner('wendell', st), 'tea', CONTENT), st).toBeNull()
  })

  it('그 사람이 집안 일을 하는 중이면 바쁘다 — 일이 끝나면 된다', () => {
    const s = withPartner('wendell')
    // 웬델은 새벽부터 낮 열한 시까지 빵을 굽는다
    expect(partnerFree(at(s, 10 * 60), CONTENT, 'tea')).toBe('busy')
    expect(canDate(at(s, 10 * 60), 'tea', CONTENT)).toBe('busy')
    expect(partnerFree(at(s, 14 * 60), CONTENT, 'tea')).toBeNull()
    // 틸리는 낮 내내 대장간 — 저녁 여섯 시부터 쉰다
    const t = withPartner('tilly')
    expect(canDate(at(t, 15 * 60), 'walk', CONTENT)).toBe('busy')
    expect(canDate(at(t, 18 * 60), 'sunset', CONTENT)).toBeNull()
  })

  it('점심을 누구와 같이 먹는 때는 쉬는 때다', () => {
    // 웬델의 12–13시는 틸리와 빵을 나눠 먹는 자리 (doing은 bread지만 with가 있다)
    const s = withPartner('wendell', 'dating', clearDay(), 12 * 60 + 20)
    expect(partnerFree(s, CONTENT, 'walk')).toBeNull()
  })

  it('찻집이 일터인 파피는 찻집에서는 마주 앉을 수 있지만 언덕길은 일이 끝나야', () => {
    const s = withPartner('poppy', 'dating', clearDay(), 14 * 60)
    expect(canDate(s, 'tea', CONTENT)).toBeNull()
    expect(canDate(s, 'walk', CONTENT)).toBe('busy')
  })

  it('그 사람이 오늘 마을에 없으면 (집안이 아직 이사 오지 않았으면) 갈 수 없다', () => {
    // 바질은 약방 집안이 이사 와야 마을에 나온다 (오후 두 시 반은 약초 일이 끝난 뒤)
    const s = withPartner('basil', 'dating', clearDay(), 14 * 60 + 30)
    expect(partnerFree(s, CONTENT, 'tea')).toBeNull()
    const flags = { ...s.flags }
    delete flags['movedIn:apothecary']
    const away = { ...s, flags }
    expect(partnerFree(away, CONTENT, 'tea')).toBe('away')
    expect(canDate(away, 'tea', CONTENT)).toBe('away')
  })

  it('곳마다 때: 찻집은 여는 때, 정자는 노을 때·맑은 날, 언덕길은 낮·궂지 않은 날', () => {
    const s = withPartner('wendell')
    expect(canDate(at(s, 20 * 60), 'tea', CONTENT)).toBe('closed')
    expect(canDate({ ...s, coins: DATE_TEA_PRICE - 1 }, 'tea', CONTENT)).toBe('coins')
    expect(canDate(at(s, 14 * 60), 'sunset', CONTENT)).toBe('notYet')
    expect(canDate(at(s, 18 * 60), 'sunset', CONTENT)).toBeNull()
    expect(canDate(at(s, 5 * 60), 'walk', CONTENT)).toBe('closed')
    expect(canDate(at(s, 20 * 60), 'walk', CONTENT)).toBe('closed')
    expect(canDate(at(s, 15 * 60), 'walk', CONTENT)).toBeNull()
    const wet = at(s, 15 * 60, wetDay())
    expect(['wet', 'away']).toContain(canDate(wet, 'walk', CONTENT))
  })
})

describe('함께 가기 — 하는 일', () => {
  it('하루 한 번 (어느 곳이든), 다음 날 다시', () => {
    const s = withPartner('wendell')
    const a = goOnDate(s, 'tea', CONTENT)
    expect(a).not.toBe(s)
    for (const p of DATE_PLACES) expect(canDate(at(a, 15 * 60), p, CONTENT)).toBe('done')
    expect(goOnDate(at(a, 15 * 60), 'walk', CONTENT)).toEqual(at(a, 15 * 60))
    expect(canDate(at(a, 14 * 60, a.clock.day + 1), 'walk', CONTENT)).not.toBe('done')
  })

  it('마음이 오르고, 오늘 기분이 오르고, 찻집은 닢 4', () => {
    const s = withPartner('wendell')
    const a = goOnDate(s, 'tea', CONTENT)
    expect(a.hearts.wendell).toBeGreaterThan(s.hearts.wendell)
    expect(a.coins).toBe(s.coins - DATE_TEA_PRICE)
    const noDate = { ...a, flags: { ...a.flags, dateDay: 0 } }
    expect(moodOf(a) - moodOf(noDate)).toBe(Math.min(DATE_MOOD, 100 - moodOf(noDate)))
    // 다음 날은 기분 보탬이 없다
    expect(moodOf(at(a, 14 * 60, a.clock.day + 1))).toBe(moodOf({ ...at(a, 14 * 60, a.clock.day + 1), flags: { ...a.flags, dateDay: 0 } }))
    // 언덕길은 닢이 들지 않는다
    const w = goOnDate(at(s, 15 * 60), 'walk', CONTENT)
    expect(w.coins).toBe(s.coins)
    expect(w.clock.minute).toBeGreaterThan(15 * 60)
  })

  it('곳마다 처음은 앨범 장면, 그다음은 짧은 장면 (앨범 아님)', () => {
    for (const p of ['tea', 'walk'] as DatePlace[]) {
      const d = clearDay()
      const first = goOnDate(withPartner('wendell', 'dating', d, 15 * 60), p, CONTENT)
      const id = first.scenes[0]
      expect(id).toBe(DATE_FIRST_SCENE[p])
      expect(ALBUM_IDS).toContain(id)
      expect(isFamilyAlbum(id)).toBe(true)
      const seen = sceneSeen(first, id, ALBUM_IDS)
      expect(seen.album.some((a) => a.id === id)).toBe(true)
      // 다음 날 같은 곳: 날마다 다른 짧은 장면
      const again = goOnDate({ ...at(seen, 15 * 60, clearDay(d + 1)), scenes: [] }, p, CONTENT)
      const id2 = again.scenes[0]
      expect(id2).toMatch(new RegExp(`^date:${p}:[0-${DATE_VARIANTS - 1}]$`))
      expect(ALBUM_IDS).not.toContain(id2)
    }
    // 정자도 처음이면 앨범 장면
    const sun = goOnDate(at(withPartner('wendell'), 18 * 60), 'sunset', CONTENT)
    expect(sun.scenes[0]).toBe('dateSunset')
  })

  it('저장하고 불러와도 오늘 함께 간 것과 횟수가 남는다', () => {
    const a = goOnDate(at(withPartner('wendell'), 15 * 60), 'walk', CONTENT)
    const b = deserialize(serialize(a), CONTENT)!
    expect(b.flags.dateDay).toBe(a.clock.day)
    expect(b.flags.dateWalks).toBe(1)
    expect(b.romance.partner).toBe('wendell')
    expect(canDate(b, 'tea', CONTENT)).toBe('done')
  })
})

describe('함께 가기 — 문구', () => {
  const ids = [...Object.values(DATE_FIRST_SCENE), ...DATE_PLACES.flatMap((p) => Array.from({ length: DATE_VARIANTS }, (_, i) => `date:${p}:${i}`))]
  it('장면은 2–4줄, 일지 줄이 있고 가족 일로 적힌다', () => {
    for (const id of ids) {
      expect(SCENES[id], id).toBeDefined()
      expect(SCENES[id].lines.length, id).toBeGreaterThanOrEqual(2)
      expect(SCENES[id].lines.length, id).toBeLessThanOrEqual(4)
      expect(JOURNAL_NOTES[id], id).toBeDefined()
      expect(isFamilyNote(id), id).toBe(true)
    }
    expect(SCENES.dateTea.album).toBe('처음 찻집에 같이 간 날')
  })

  it('금지어 없음, 연인 이름이 채워진다', () => {
    for (const id of ids)
      for (const t of [SCENES[id].title, SCENES[id].album ?? '', ...SCENES[id].lines.map((l) => l.text)]) {
        expect(forbiddenIn(t), t).toBeNull()
        expect(partnerFill(t, '웬델')).not.toMatch(/\{partner/)
      }
    expect(partnerFill('{partnerAnd} 걸었다. {partnerSubj} 웃었다.', '웬델')).toBe('웬델과 걸었다. 웬델이 웃었다.')
    expect(partnerFill('{partnerAnd} 걸었다.', '틸리')).toBe('틸리와 걸었다.')
  })
})
