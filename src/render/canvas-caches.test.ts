import { describe, expect, it } from 'vitest'
import { canvasCache } from './canvas-caches'

describe('화면 밖 캔버스 캐시', () => {
  it('앱으로 돌아오면 비워서 다음 그림에서 다시 그린다 (휴대폰이 뒤로 간 앱의 캔버스를 비우는 경우)', () => {
    const a = canvasCache<string>()
    const b = canvasCache<number>()
    a.set('map', document.createElement('canvas'))
    b.set(1, document.createElement('canvas'))
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(a.size).toBe(1)
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(a.size).toBe(0)
    expect(b.size).toBe(0)
  })
})
