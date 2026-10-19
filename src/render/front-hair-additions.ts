import type { Facing } from '../engine/types'

type FrontHair = {
  /** 정수리부터 이마까지, 가운데 여섯 칸. 눈이 있는 4번 줄은 건드리지 않는다. */
  crown: readonly [string, string, string]
  front: string
  side: string
}

// 기존 0~11번의 저장 번호와 도트는 그대로 두고 12번부터 이어 붙인다.
const STYLES: readonly FrontHair[] = [
  { crown: ['.hhhh.', 'hh00hh', 'h0hh0h'], front: 'hshssh', side: 'hssh' }, // 시스루
  { crown: ['.hhhh.', 'h00hhh', 'hhhhhh'], front: '1hhhh1', side: 'hhh1' }, // 일자
  { crown: ['.hhhh.', 'hh00hh', '111111'], front: 'ssssss', side: 'ssss' }, // 짧은 일자
  { crown: ['.hhhh.', 'h00hhh', 'hh10hh'], front: 'hh1ssh', side: 'h1ss' }, // 사선
  { crown: ['.hhhh.', 'hhh00h', 'hhhhh0'], front: 'shhh1h', side: 'shh1' }, // 긴 옆가르마
  { crown: ['hh..hh', 'h0hh0h', 'hh11hh'], front: 'hhsshh', side: 'hshh' }, // 하트
  { crown: ['.hhhh.', '0h1hhh', 'h10hhh'], front: '01hsss', side: '01hs' }, // 한쪽 땋기
  { crown: ['.hhhh.', 'h0h0hh', 'hh0h0h'], front: 'h1sh0h', side: 'h1h0' }, // 잔물결
  { crown: ['.hh.h.', 'hh0hhh', 'h0hhhh'], front: 'hsshhs', side: 'shhs' }, // 솟은 머리
  { crown: ['.h..h.', 'hh00hh', 'h1hh1h'], front: 'shhshh', side: 'hhsh' }, // 두 갈래
]

/** 앞머리는 정수리와 이마 안에서 그려 뒷머리의 묶음·눈·귀를 보존한다. */
export function frontHairAdditions(rows: string[], facing: Facing, kind: number) {
  const style = STYLES[kind - 12]
  if (!style) return
  const put = (x: number, y: number, ink: string) => {
    const old = rows[y]?.[x]
    if (old === undefined || !'.h01s'.includes(old)) return
    rows[y] = rows[y].slice(0, x) + ink + rows[y].slice(x + 1)
  }
  for (const [y, line] of style.crown.entries())
    for (const [x, ink] of [...line].entries()) put(x + 2, y, ink)
  if (facing === 'up') return
  const front = facing === 'down'
  for (const [x, ink] of [...(front ? style.front : style.side)].entries()) put(x + (front ? 2 : 4), 3, ink)
}
