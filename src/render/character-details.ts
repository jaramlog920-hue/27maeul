import { TOPS, type FullAvatar } from '../engine/avatar'
import type { Facing } from '../engine/types'

const dot = (rows: string[], x: number, y: number, c: string) => {
  if (rows[y] && x >= 0 && x < rows[y].length) rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1)
}

/** 옷 → 머리 → 장신구 순서로 겹친다. 저장된 옵션 번호는 그대로 쓴다. */
export function avatarDetails(rows: string[], facing: Facing, a: FullAvatar, blink: boolean) {
  const front = facing === 'down'
  const back = facing === 'up'
  const side = !front && !back
  const pattern = TOPS[a.top]?.[4] ?? 'plain'
  const cloth = (x: number, y: number, c = 'l') => { if ('rR'.includes(rows[y]?.[x] ?? '.')) dot(rows, x, y, c) }
  if (pattern === 'plain') {
    // 각각 끈 깃, V 깃, 작은 단추, 열린 깃.
    if (a.top === 0) { cloth(3, 7); cloth(6, 7); cloth(4, 8, 'R') }
    if (a.top === 1) { cloth(3, 7); cloth(6, 7); cloth(4, 8); cloth(5, 8) }
    if (a.top === 2 && !back) for (const y of [8, 10]) cloth(5, y)
    if (a.top === 3) { cloth(3, 7); cloth(6, 7); if (!back) cloth(5, 8, 'R') }
  }
  if (pattern === 'stripe') {
    for (let y = 8; y <= 10; y++) for (let x = 3; x <= 6; x++)
      if (a.top === 5 ? (x + y) % 3 === 0 : y === 8 || (a.top === 6 && y === 10)) cloth(x, y)
  }
  if (pattern === 'vest') {
    for (let y = 7; y <= 10; y++) for (const x of side ? [3, 4] : [3, 6]) cloth(x, y)
    if (back) for (const y of [8, 9]) for (let x = 3; x <= 6; x++) cloth(x, y)
    if (a.top === 11) for (const x of [2, 3, 6, 7]) cloth(x, 7)
  }
  if (pattern === 'collar' && !back) {
    for (const x of side ? [5] : [3, 6]) cloth(x, 7)
    cloth(side ? 5 : 4, 8)
    for (const y of [9, 10]) cloth(5, y)
  }
  if (pattern === 'cross') {
    for (const [x, y] of back ? [[3, 10], [4, 10], [5, 10], [6, 10]] : side ? [[5, 7], [4, 8], [3, 9], [4, 10]] : [[6, 7], [5, 8], [4, 9], [3, 10], [5, 10], [6, 10]]) cloth(x, y)
  }
  if (pattern === 'pocket') {
    if (!back) for (const [x, y] of side ? [[4, 9], [5, 9], [4, 10]] : [[3, 9], [4, 9], [3, 10], [6, 9], [6, 10]]) cloth(x, y)
    else for (const x of [3, 6]) cloth(x, 8)
  }
  const bottoms = [
    ['..kDddDk..', '.kDddddDk.'],
    ['..kddddk..', '..5s..s5..'],
    ['..kddddk..', '..kdDDdk..'],
    ['..kDddDk..', '..5s..s5..'],
    ['..kDdDDk..', '.kDdDdDDk.'],
    ['..kddddk..', '.kDDDDDDk.'],
    ['.kdddDddk.', '.kdDkDddk.'],
    ['..kdDDdk..', '..kD..Dk..'],
  ][a.bottom] ?? ['..kDddDk..', '.kDddddDk.']
  rows[11] = bottoms[0]
  rows[12] = bottoms[1]
  if (pattern === 'apron') {
    if (!back) {
      for (const y of [7, 8]) for (const x of side ? [4] : [4, 5]) cloth(x, y)
      for (let y = 9; y <= (a.bottom === 0 ? 12 : 11); y++)
        for (const x of side ? [4, 5] : [3, 4, 5, 6]) if ('rRdDb'.includes(rows[y][x])) dot(rows, x, y, 'l')
      dot(rows, side ? 4 : 5, 10, 'R') // 작은 앞치마 주머니
    } else { dot(rows, 4, 9, 'l'); dot(rows, 5, 9, 'l') }
  }

  // 뒷머리. 끝선과 묶는 위치가 서로 달라 색 없이도 구분된다.
  const sides = side ? [[0, 1]] : [[0, 1], [9, 8]]
  const hair = (x: number, y: number, c = 'h') => dot(rows, x, y, c)
  if (a.hairBack === 1 || a.hairBack === 2) {
    const end = a.hairBack === 1 ? 8 : 5
    for (const [outer, inner] of sides) {
      for (let y = 2; y <= end; y++) hair(outer, y)
      for (let y = 3; y < end; y++) hair(inner, y)
      hair(outer, end + 1, '1')
    }
    if (back) for (let y = 6; y <= end; y++) for (let x = 2; x <= 7; x++) hair(x, y)
  }
  if (a.hairBack === 3) {
    for (const x of [3, 4, 5, 6]) hair(x, 0)
    hair(4, 0, '0'); hair(5, 1, '1')
    if (back) { hair(4, 6, 'x'); hair(5, 6, 'x') }
  }
  if (a.hairBack === 4) {
    if (front) { hair(8, 5, 'x'); hair(9, 5); hair(9, 6); hair(9, 7, '1') }
    else if (back) { hair(5, 6, 'x'); for (let y = 7; y <= 9; y++) hair(5, y); hair(4, 9, '1') }
    else { hair(1, 4, 'x'); hair(0, 5); hair(0, 6); hair(1, 7); hair(1, 8, '1') }
  }
  if (a.hairBack === 5) for (const [outer] of sides) {
    hair(outer, 3, 'x'); for (let y = 4; y <= 7; y++) hair(outer, y); hair(outer, 8, '1')
  }
  if (a.hairBack === 6) {
    const x = back ? 5 : side ? 1 : 8
    for (let y = 6; y <= (back ? 10 : 8); y++) hair(x, y, y === 7 ? '0' : 'h')
    if (front) hair(9, 5)
    if (side) hair(1, 5)
    hair(x, back ? 11 : 9, 'x')
    if (back) { hair(4, 8, '1'); hair(4, 10, '1') }
  }
  if (a.hairBack === 7) {
    for (const [outer, inner] of sides) {
      for (let y = 3; y <= 7; y++) hair(outer, y)
      for (const y of [4, 6, 8]) hair(inner, y, y === 8 ? '1' : 'h')
    }
    if (back) for (let y = 6; y <= 7; y++) for (let x = 2; x <= 7; x++) hair(x, y)
  }
  if (a.hairBack === 8) {
    const x = back ? 5 : side ? 1 : 8
    hair(x, 2, 'x')
    for (let y = 3; y <= 7; y++) hair(x, y)
    hair(back ? x + 1 : x - 1, 4)
    hair(x, 8, '1')
  }
  if (a.hairBack === 9) {
    for (const x of side ? [1] : [1, 8]) {
      hair(x, 1); hair(x, 2, '0'); hair(x, 3, 'x')
      hair(x === 1 ? 0 : 9, 2)
    }
  }
  if (a.hairBack === 10) {
    for (const x of side ? [1] : back ? [2, 7] : [0, 9]) {
      for (let y = 5; y <= 9; y++) hair(x, y, y % 2 ? 'h' : '1')
      hair(x, 10, 'x')
    }
  }
  // 앞머리: 동일한 직선에 한 칸 덧칠하는 대신, 가르마와 끝선을 다시 찍는다.
  if (!back) {
    const pts: Record<number, number[][]> = front ? {
      0: [[2, 3], [3, 2]],
      1: [[2, 3], [4, 3], [7, 3]],
      2: [[2, 3], [3, 3], [4, 3], [2, 4]],
      3: [],
      4: [[1, 1], [8, 2], [2, 3], [4, 3], [7, 3]],
      5: [[2, 3], [5, 3], [7, 3], [2, 4]],
      6: [[2, 0], [4, 0], [7, 0], [2, 3], [6, 3]],
      7: [[2, 3], [3, 3], [6, 3], [7, 3], [2, 4], [7, 4]],
      8: [[2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3]],
      9: [[3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [7, 4]],
      10: [[1, 1], [3, 0], [6, 0], [8, 1], [2, 3], [4, 3], [6, 3]],
      11: [[2, 2], [3, 2], [6, 2], [7, 2]],
    } : {
      0: [[4, 3]], 1: [[4, 3], [6, 3]], 2: [[4, 3], [5, 3], [4, 4]],
      3: [], 4: [[1, 1], [4, 3], [6, 3]], 5: [[3, 3], [4, 3], [5, 3]],
      6: [[2, 0], [4, 0], [7, 0], [5, 3]], 7: [[4, 3], [5, 3], [6, 3], [6, 4]],
      8: [[4, 3], [5, 3], [6, 3], [7, 3]],
      9: [[5, 3], [6, 3], [7, 3], [7, 4]],
      10: [[1, 1], [3, 0], [6, 0], [4, 3], [6, 3]],
      11: [[3, 2], [4, 2], [5, 2]],
    }
    for (const [x, y] of pts[a.hairFront] ?? []) hair(x, y)
    if (a.hairFront === 11) { hair(front ? 4 : 5, 2, 's'); hair(front ? 5 : 6, 2, 's') }
    if (a.hairFront === 3) for (const x of front ? [2, 7] : [3, 4]) hair(x, 3, 's')
    if (!blink) for (const x of front ? [3, 6] : [6]) if (rows[4][x] === 'k') dot(rows, x, 4, 'o')
  } else if (a.hairFront === 10) {
    for (const [x, y] of [[1, 1], [3, 0], [6, 0], [8, 1]]) hair(x, y)
  } else if (a.hairFront === 5 || a.hairFront === 6) {
    for (const x of a.hairFront === 5 ? [2, 7] : [2, 4, 7]) hair(x, a.hairFront === 5 ? 2 : 0)
  }
  // 두 칸 정도의 빛으로 머리의 방향을 보여준다.
  for (const [x, y] of side ? [[3, 1], [4, 1], [2, 2]] : [[3, 1], [4, 1], [2, 2]])
    if (rows[y][x] === 'h') hair(x, y, '0')

  if (a.acc === 1) {
    for (let x = 2; x <= 7; x++) if ('h01'.includes(rows[2][x])) dot(rows, x, 2, 'x')
    dot(rows, side ? 2 : 7, 2, 'y')
  }
  if (a.acc === 2) {
    const x = back ? 6 : front ? 2 : 3
    dot(rows, x, 1, 'f'); dot(rows, x - 1, 2, 'f'); dot(rows, x + 1, 2, 'f'); dot(rows, x, 2, 'y')
  }
  if (a.acc === 3 && !back) {
    for (const x of front ? [3, 6] : [5]) dot(rows, x, 7, 'y')
    dot(rows, front ? 4 : 6, 8, 'y')
  }
  if (a.acc === 4) for (const x of front ? [1, 8] : back ? [1, 8] : [2]) {
    dot(rows, x, 5, 'y'); dot(rows, x, 6, 'y')
  }
  if (a.acc === 5) {
    for (let y = 0; y <= 2; y++) for (let x = 0; x < 10; x++) if ('h01'.includes(rows[y][x])) dot(rows, x, y, 'x')
    for (const x of [3, 4, 5, 6]) dot(rows, x, 0, 'x')
    dot(rows, back ? 5 : side ? 1 : 8, 3, 'x')
    dot(rows, back ? 5 : side ? 0 : 9, 4, 'x')
  }
  if (a.acc === 6) {
    const x = back ? 6 : side ? 2 : 7
    for (const dx of [-1, 1]) { dot(rows, x + dx, 1, 'f'); dot(rows, x + dx, 2, 'x') }
    dot(rows, x, 2, 'y'); dot(rows, x, 3, 'f')
  }
  if (a.acc === 7) {
    const x = back ? 3 : side ? 2 : 7
    dot(rows, x, 1, 'v'); dot(rows, x - 1, 2, 'v'); dot(rows, x, 2, 'V'); dot(rows, x, 3, 'y')
  }
  if (a.acc === 8) {
    for (const x of [2, 4, 6, 7]) if ('h01'.includes(rows[2][x])) dot(rows, x, 2, 'y')
    dot(rows, side ? 2 : 7, 3, 'l')
  }
  if (a.acc === 9 && !back) {
    const x = side ? 5 : 3
    dot(rows, x, 8, 'y'); dot(rows, x + 1, 8, 'l'); dot(rows, x, 9, 'y')
  }
  if (a.acc === 10) {
    for (const x of side ? [4, 5] : [3, 4, 5, 6]) dot(rows, x, 7, 'x')
    if (!back) { dot(rows, side ? 4 : 5, 8, 'f'); dot(rows, side ? 4 : 5, 9, 'x') }
  }
  if (a.acc === 11) {
    const x = side ? 3 : back ? 2 : 7
    for (const y of [10, 11]) { dot(rows, x, y, 'p'); dot(rows, x + 1, y, 'P') }
    dot(rows, x, 10, 'y')
  }
  if (a.acc === 12) {
    for (const [x, y] of side ? [[4, 7], [4, 8], [3, 9]] : back ? [[6, 7], [5, 8], [4, 9]] : [[3, 7], [4, 8], [5, 9]]) dot(rows, x, y, 'P')
    const x = side ? 2 : back ? 2 : 6
    for (const y of [9, 10, 11]) { dot(rows, x, y, 'p'); dot(rows, x + 1, y, 'P') }
    dot(rows, x + 1, 10, 'y')
  }
  if (a.acc === 13) {
    for (const x of [1, 2, 3, 4, 5, 6, 7, 8]) if ('h01'.includes(rows[1][x])) dot(rows, x, 1, 'v')
    for (const x of side ? [3, 6] : [2, 5, 7]) { dot(rows, x, 1, 'f'); dot(rows, x, 2, 'y') }
  }
}
