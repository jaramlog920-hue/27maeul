import { tileFromPoint } from './GameCanvas'

describe('tileFromPoint', () => {
  // 화면 16×20칸, 한 칸 20px
  const rect = { left: 10, top: 20, width: 320, height: 400 }
  it('화면 좌표를 칸으로 바꾼다', () => {
    expect(tileFromPoint(10, 20, rect)).toEqual({ x: 0, y: 0 })
    expect(tileFromPoint(10 + 20 * 5 + 1, 20 + 20 * 7 + 19, rect)).toEqual({ x: 5, y: 7 })
  })
  it('카메라만큼 옮겨 간다', () => {
    expect(tileFromPoint(10 + 20 * 5 + 1, 20 + 20 * 7 + 1, rect, { x: 10.5, y: 3 })).toEqual({ x: 15, y: 10 })
  })
  it.each([1, 1.25, 1.5, 1.75, 2])('확대율 %s에서도 보이는 칸을 선택한다', (zoom) => {
    expect(tileFromPoint(10 + 20 * zoom * 3.5, 20 + 20 * zoom * 4.5, rect, { x: 10, y: 5 }, zoom)).toEqual({ x: 13, y: 9 })
  })
  it('지도 밖은 안으로 자른다', () => {
    expect(tileFromPoint(10 + 320, 20 + 400, rect, { x: 16, y: 8 })).toEqual({ x: 31, y: 27 })
    expect(tileFromPoint(0, 0, rect)).toEqual({ x: 0, y: 0 })
  })
})
