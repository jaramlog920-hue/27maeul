// 집 안은 한 지도에 연결한다. 북쪽 배우자방, 동쪽 아이방, 서쪽 생활방.
export const WORKSHOP = { x0: 16, y0: 110, x1: 24, y1: 115 }
export const PARTNER_ROOM = { x0: 18, y0: 104, x1: 24, y1: 110 }
export const BABY_ROOM = { x0: 24, y0: 110, x1: 31, y1: 115 }
export const LIVING_ROOM = { x0: 6, y0: 108, x1: 16, y1: 117 }
export const PARTNER_DOOR = { x: 21, y: 110 }
export const BABY_DOOR = { x: 24, y: 112 }
// 침대가 왼쪽 위(17,111–112)에 붙어 거실 문은 한 칸 아래 (2026-10-12)
export const LIVING_DOOR = { x: 16, y: 113 }
export const FIXTURES = {
  homeBed: { place: 'bed', ch: 'b', name: '침대', x: 17, y: 111 },
  // 필사 책상은 맨 아래 벽에 붙인다 (2026-10-12 사용자: 침대가 커져 비좁음)
  homeDesk: { place: 'desk', ch: 'd', name: '필사 책상', x: 17, y: 114 },
  homeHearth: { place: 'hearth', ch: 'h', name: '화덕', x: 20, y: 111 },
  homeShelf: { place: 'shelf', ch: 's', name: '두루마리 선반', x: 23, y: 111 },
  // 작업대는 필사 책상에 딱 붙여 오른쪽 (2026-10-13 사용자) — 책상 앞 서는 자리는 책상 위 칸이 된다
  homeWorkbench: { place: 'workbench', ch: 'k', name: '작업대', x: 18, y: 114 },
} as const
