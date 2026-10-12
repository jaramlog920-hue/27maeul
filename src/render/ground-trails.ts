import { tileAt } from '../engine/world'

/** 건물·문·가구로 바뀐 칸과 굴뚝이 올라오는 지붕 바로 위 칸의 흔적은 숨긴다. 기록 자체는 보존한다. */
export function grassTrails(trails: Readonly<Record<string, number>>, at = tileAt): { x: number; y: number; n: number }[] {
  return Object.entries(trails).flatMap(([k, n]) => {
    const [x, y] = k.split(',').map(Number)
    return n >= 12 && Number.isInteger(x) && Number.isInteger(y) && at(x, y) === '.' && at(x, y + 1) !== 'R' ? [{ x, y, n }] : []
  })
}
