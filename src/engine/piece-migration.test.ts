import { CONTENT, PIECES, pieceById } from '../content/catalog'
import legacy from '../../scripts/data/legacy-pieces-v1.json'
import mapping from '../content/piece-migration-v2.json'
import { migratePieceLayout } from './piece-migration'
import { newGame } from './game'
import { deserialize, serialize } from './save'
import { chaptersOf } from './books'

describe('개역한글 소제목 구분으로 저장 변환', () => {
  it('기존 672개 조각 모두 새 구분으로 옮길 수 있다', () => {
    const known = new Set(PIECES.map(p => p.id))
    for (const p of legacy) {
      const to = (mapping as Record<string, string[]>)[p.id]
      expect(to.length, p.id).toBeGreaterThan(0)
      expect(to.every(id => known.has(id)), p.id).toBe(true)
    }
  })
  it('나누어진 본문·받은 날짜·메모·편지·제안은 보존하고 반복 변환하지 않는다', () => {
    const base = newGame(CONTENT)
    const [old, to] = Object.entries(mapping).find(([, ids]) => ids.length > 1)!
    const s = { ...base, pieceLayout: undefined, collected: [old], todayHeard: [old], post: [old], offers: { baker: old },
      pieceLog: { [old]: { day: 4, from: 'letter' } }, myLines: { [old]: '내가 남긴 메모', 'book:lk': '책 메모' } }
    const migrated = migratePieceLayout(s, CONTENT)
    expect(migrated.collected).toEqual(to)
    expect(migrated.post).toEqual(to)
    expect(migrated.offers.baker).toBe(to[0])
    for (const id of to) {
      expect(migrated.pieceLog[id]).toEqual({ day: 4, from: 'letter' })
      expect(migrated.myLines[id]).toBe('내가 남긴 메모')
    }
    expect(migrated.myLines['book:lk']).toBe('책 메모')
    expect(migratePieceLayout(migrated, CONTENT)).toBe(migrated)
    expect(s.collected).toEqual([old])
  })
  it('단락이 장을 넘어가도 필사 완료한 장은 불러오기에서 남는다', () => {
    const base = newGame(CONTENT)
    const old = { ...base, pieceLayout: undefined }
    old.progress.ac.completed = [7]
    const back = deserialize(serialize(old), CONTENT)!
    expect(back.progress.ac.completed).toContain(7)
    expect(chaptersOf('ac', CONTENT)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1))
    expect(back.pieceLayout).toBe(2)
  })
  it('망대 단락은 제자가 되는 길 및 성서공회 관련 본문을 사용한다', () => {
    const piece = pieceById('lk-014-025')
    expect(piece).toMatchObject({ title: '제자가 되는 길', ref: '눅 14:25-35' })
    expect(piece.stamps.map(s => [s.kind, s.ref])).toEqual([['related', '마 5:13'], ['related', '막 9:50']])
    expect(piece.source).toContain('bskorea.or.kr')
  })
})
