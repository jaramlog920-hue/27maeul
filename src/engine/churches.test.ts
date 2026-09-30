// 계획 9 작업 3: 요한계시록 일곱 교회 카드 — 본문 순서대로, 이름만. 2·3장을 옮겨 적으면 카드가 판에 들어온다
import bible from '../content/nt-krv.json'
import { CHURCHES, CONTENT, copySourceFor, JOURNEY, versesOf } from '../content/catalog'
import { blanksFor } from './copy'
import { chooseBook, moveBoardCard, moveJourneyCard, newGame, recordLetter, syncBoard, syncJourney, type GameState } from './game'
import { boardInOrder, cardsForChapters, journeyComplete, placeNewCards } from './journey'
import { deserialize, serialize } from './save'
import { emptyProgress } from './books'

const FULL = bible as Record<string, string[][]>
/** 원문(nt-krv.json)을 dump-ref로 한 줄씩 대조해 정한 카드 (작업 3, 2026-09-30) */
const EXPECTED = [
  ['에베소', '계 2:1'],
  ['서머나', '계 2:8'],
  ['버가모', '계 2:12'],
  ['두아디라', '계 2:18'],
  ['사데', '계 3:1'],
  ['빌라델비아', '계 3:7'],
  ['라오디게아', '계 3:14'],
] as const

/** 요한계시록 방이 열리고 요한계시록을 고른 상태, 1–3장을 받아 둠 */
function revReady(): GameState {
  const s = newGame(CONTENT)
  const open = {
    ...s,
    flags: { ...s.flags, gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1, 'room:rev': 1 },
    inv: { ...s.inv, papyrus: 9, ink: 9 },
  }
  const chosen = chooseBook(open, 'rev', CONTENT)
  return { ...chosen, collected: [...chosen.collected, 'rev-001', 'rev-002', 'rev-003'] }
}
const answers = (chapter: number) => blanksFor('rev', chapter, copySourceFor('rev')).map((b) => b.answer)
function copy(s: GameState, chapter: number): GameState {
  const r = recordLetter({ ...s, needs: { ...s.needs, fatigue: 0 } }, 'rev', chapter, answers(chapter), CONTENT)
  expect(r.progress.rev.completed, `${chapter}장`).toContain(chapter)
  return r
}
/** 판을 본문 순서로 맞춘다 (▲만 — 거품 정렬) */
function sortChurches(s: GameState): GameState {
  for (let pass = 0; pass < s.churches.length; pass++)
    for (let i = 1; i < s.churches.length; i++) if (s.churches[i - 1] > s.churches[i]) s = moveBoardCard(s, 'churches', i, -1, CONTENT)
  return s
}

describe('일곱 교회 카드 데이터', () => {
  it('일곱 장, 본문 순서, 이름만 (곳 이름 한 낱말)', () => {
    expect(CHURCHES.map((c) => [c.place, c.ref])).toEqual(EXPECTED)
    CHURCHES.forEach((c, i) => {
      expect(c.order).toBe(i + 1)
      expect(c.place).toMatch(/^[가-힣]+$/)
      expect(c.chapter).toBe(Number(c.ref.match(/^계 (\d+):/)![1]))
    })
    expect(CONTENT.churches).toBe(CHURCHES)
  })

  it('그 절에 "{이름} 교회의 사자에게"가 글자 그대로 있다 (원문과 대조)', () => {
    for (const c of CHURCHES) {
      const [ch, v] = c.ref.match(/^계 (\d+):(\d+)$/)!.slice(1).map(Number)
      expect(FULL.rev[ch - 1][v - 1], c.ref).toContain(`${c.place} 교회의 사자에게`)
      expect(versesOf(c.ref)[0].text).toBe(FULL.rev[ch - 1][v - 1])
    }
  })

  it('1:11의 순서 = 카드 순서 (1:11은 카드 구절이 아니다 — "교회의 사자에게"가 없다)', () => {
    const v111 = FULL.rev[0][10]
    const at = CHURCHES.map((c) => v111.indexOf(c.place))
    expect(at.every((x) => x >= 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    expect(v111).not.toContain('교회의 사자에게')
  })
})

describe('판 계산 — 2장·3장을 옮겨 적으면 카드', () => {
  it('2장 뒤 넷, 3장 뒤 일곱 — 옮겨 적기만으로는 순서가 맞지 않는다', () => {
    expect(cardsForChapters(CHURCHES, [])).toEqual([])
    expect(cardsForChapters(CHURCHES, [1])).toEqual([])
    const after2 = placeNewCards([], cardsForChapters(CHURCHES, [1, 2]))
    expect(after2).toEqual([2, 3, 1, 4])
    const after3 = placeNewCards(after2, cardsForChapters(CHURCHES, [1, 2, 3]))
    expect(after3).toEqual([2, 3, 5, 1, 6, 4, 7])
    expect(boardInOrder(after3)).toBe(false)
  })
})

describe('게임 상태의 일곱 교회 판', () => {
  it('새 게임은 빈 판', () => {
    expect(newGame(CONTENT).churches).toEqual([])
  })

  it('1장 뒤 0장, 2장 뒤 4장, 3장 뒤 7장 — 저절로 맞지 않고 표식도 없다', () => {
    let s = copy(revReady(), 1)
    expect(s.churches).toEqual([])
    s = copy(s, 2)
    expect(s.churches).toEqual([2, 3, 1, 4])
    s = copy(s, 3)
    expect(s.churches).toEqual([2, 3, 5, 1, 6, 4, 7])
    expect(s.flags.churchesDone).toBeUndefined()
    // 사도행전 판은 그대로
    expect(s.journey).toEqual([])
  })

  it('▲▼로 본문 순서대로 맞추면 churchesDone 1 (한 번), 장면·배 표식 없음, 완성된 판은 움직이지 않는다', () => {
    let s = copy(copy(copy(revReady(), 1), 2), 3)
    const scenes = s.scenes.length
    s = sortChurches(s)
    expect(s.churches).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(journeyComplete(s.churches, CHURCHES)).toBe(true)
    expect(s.flags.churchesDone).toBe(1)
    expect(s.flags.actsShip).toBeUndefined()
    expect(s.scenes.length).toBe(scenes)
    expect(moveBoardCard(s, 'churches', 3, -1, CONTENT)).toBe(s)
    expect(moveBoardCard(s, 'churches', 0, 1, CONTENT)).toBe(s)
    // 다시 맞춰도 표식은 1 그대로
    expect(syncBoard(s, 'churches', CONTENT).flags.churchesDone).toBe(1)
  })

  it('넷만 있을 때 맞춰도 완성이 아니다', () => {
    let s = copy(copy(revReady(), 1), 2)
    s = sortChurches(s)
    expect(s.churches).toEqual([1, 2, 3, 4])
    expect(s.flags.churchesDone).toBeUndefined()
  })

  it('저장/불러오기 뒤 판이 그대로', () => {
    let s = copy(copy(copy(revReady(), 1), 2), 3)
    s = moveBoardCard(s, 'churches', 3, -1, CONTENT)
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.churches).toEqual(s.churches)
    const done = sortChurches(s)
    const back2 = deserialize(serialize(done), CONTENT)!
    expect(back2.churches).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(back2.flags.churchesDone).toBe(1)
  })

  it('불러오기: 적은 장의 카드만 남기고 빠진 카드는 채운다, 이상한 값은 버린다', () => {
    const s = copy(copy(revReady(), 1), 2)
    const o = JSON.parse(serialize(s))
    const back = deserialize(JSON.stringify({ ...o, churches: [4, 7, 'x', 1, 1, 99] }), CONTENT)!
    expect([...back.churches].sort()).toEqual([1, 2, 3, 4])
    expect(back.churches.filter((n) => n !== 2 && n !== 3)).toEqual([4, 1])
    expect(deserialize(JSON.stringify({ ...o, churches: 'x' }), CONTENT)!.churches).toEqual([2, 3, 1, 4])
  })

  it('계획 7·8 모양 옛 저장(churches 칸 없음) → churches: []', () => {
    const s = newGame(CONTENT)
    const o = JSON.parse(serialize(s))
    delete o.churches
    delete o.progress.rev
    const back = deserialize(JSON.stringify(o), CONTENT)!
    expect(back.churches).toEqual([])
    expect(back.flags.churchesDone).toBeUndefined()
  })
})

describe('사도행전 여정 판은 그대로', () => {
  it('syncJourney = syncBoard(journey), moveJourneyCard = moveBoardCard(journey)', () => {
    const all = Array.from({ length: 28 }, (_, i) => i + 1)
    const base = { ...newGame(CONTENT), progress: { ...emptyProgress(), ac: { completed: all, arrangement: {} } } }
    const a = syncJourney(base, CONTENT)
    expect(syncBoard(base, 'journey', CONTENT)).toEqual(a)
    expect(a.journey).toHaveLength(JOURNEY.length)
    expect(a.churches).toEqual([])
    expect(moveBoardCard(a, 'journey', 2, -1, CONTENT)).toEqual(moveJourneyCard(a, 2, -1, CONTENT))
  })
})
