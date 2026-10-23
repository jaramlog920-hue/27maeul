// 일터 실내 (2026-10-22 연결): 일마다 방이 하나씩, 소품은 모두 방 안에 들고 문에서 안쪽까지 길이 비어 있다
import { ADULT_JOBS } from '../engine/child'
import { WORKPLACE_INTERIORS, WORKPLACE_PALETTE } from './workplace-interior-art'

it('모든 진로에 방이 있고 그림 글자는 팔레트 안이다', () => {
  for (const job of ADULT_JOBS) {
    const room = WORKPLACE_INTERIORS[job]
    expect(room, job).toBeDefined()
    expect(room.rows).toHaveLength(96)
    expect(room.rows.every((r) => r.length === 128 && [...r].every((c) => c === '.' || c in WORKPLACE_PALETTE)), job).toBe(true)
  }
})
