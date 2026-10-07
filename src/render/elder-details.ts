import type { Facing } from '../engine/types'
import type { Who } from './sprites'
import type { GenState } from '../engine/gen'

export const residentIsElder = (gen: GenState | undefined, id: string): boolean => gen?.persons[id]?.stage === 'elder' || !!gen?.retired?.[id]

/** 옷·모자를 회색으로 바꾸지 않도록 머리색 글자와 영역만 따로 지정한다. */
const HAIR: Partial<Record<Who, string>> = {
  writer: 'h01', baker: '3', grandpa: 'W7', merchant: 'L', smith: 'ju', shepherd: 'Uu',
  presser: 'h', child: 'h', weaver: 'F', beekeeper: 'h', postman: 'h', apothecary: 'h', fisher: '7', carpenter: 'L',
}
export const ELDER_COLORS = { '~': '#a7aaa3', '^': '#d9d8c7', '%': '#747c76', '?': '#aa866e' }

/** 같은 머리 윤곽에 은회색·빛·그늘을 입히고 눈가와 한 픽셀 낮춘 머리로 노년을 표현한다. */
export function elderDetails(source: string[], who: Who, facing: Facing): string[] {
  const rows = source.map(r => [...r]), hair = HAIR[who] ?? 'h'
  for (let y = 0; y <= 8 && y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
    if (y > 6 && x !== 0 && x !== 9) continue
    if (!hair.includes(rows[y][x])) continue
    rows[y][x] = y <= 1 || (y === 2 && x >= 3 && x <= 5) ? '^' : x <= 1 || x >= 8 || y >= 5 ? '%' : '~'
  }
  if (facing !== 'up') {
    const xs = facing === 'down' ? [2, 7] : [7]
    for (const x of xs) if (rows[5]?.[x] === 's' || rows[5]?.[x] === 'e') rows[5][x] = '?'
  }
  // 머리를 한 줄 낮추되 몸통·신발·가방·직업 도구는 그대로 둔다.
  for (let y = 6; y >= 0; y--) rows[y + 1] = [...rows[y]]
  rows[0] = Array<string>(source[0].length).fill('.')
  return rows.map(r => r.join(''))
}
