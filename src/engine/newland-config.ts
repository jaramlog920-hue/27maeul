// 새 터 (두 번째 마을)의 정한 값들 (계획 20 결정 D2·D6). 바꿀 때는 이 파일의 상수만 고친다.
// 이 파일은 아무것도 부르지 않는 숫자 모음이다 (maps.ts·newland.ts·world.ts가 읽는다).

/** 지도 크기: 가로 40 × 세로 40줄 — 위 30줄은 보이는 땅, 아래 10줄은 보이지 않는 서고 안 방 */
export const NEWLAND_W = 40
export const NEWLAND_H = 40
export const NEWLAND_VISIBLE_H = 30

/** 한 번 건너가는 데 흐르는 게임 시간 (분) — 같은 날 안에서 */
export const TRAVEL_MINUTES = 30
/** 첫 마을에서 새 터로 떠날 수 있는 시각 (분, 양끝 포함): 06:00–21:30. 돌아가기는 언제든 */
export const TRAVEL_FROM_MINUTE = 6 * 60
export const TRAVEL_LAST_MINUTE = 21 * 60 + 30

/**
 * 입구 (첫 마을 쪽).
 * 후보 — 동쪽 테두리(x=47)에서 가까운 걸을 수 있는 칸:
 *   (46,14) 풀밭      올리브 나무 사이에 갇힌 한 칸, 길과 이어지지 않아 돌아가야 함 → 탈락
 *   (46,16) 풀밭      올리브 나무(46,15) 바로 아래, 나무 밭 가장자리 → 탈락
 *   (46,17) 큰길 끝   가로 큰길(17–18줄)이 동쪽 끝에서 멈추는 곳 — 구역·시설·집 문·장소와 겹치지 않고 길로 곧장 닿음 → 채택
 *   (46,18) 큰길 끝   (46,17)과 같은 두 줄 길의 아랫줄 — 같은 까닭으로 가능하나 위줄을 표지로 쓰고 아랫줄은 늘 길로 둔다
 * 채택한 칸은 큰길이 끝나는 자리라 "이 길의 끝에 새 땅이 있다"로 읽히고, 개방 전에는 그냥 길의 끝이다.
 */
export const VILLAGE_PORTAL = { x: 46, y: 17 } as const
/** 돌아와 서는 칸 (표지 바로 서쪽, 큰길 위) */
export const VILLAGE_PORTAL_FRONT = { x: 45, y: 17 } as const

/** 입구 (새 터 쪽): 서쪽 길 끝 — 첫 마을 동쪽 끝에서 건너왔으니 새 터는 서쪽에서 시작한다 */
export const NEWLAND_PORTAL = { x: 1, y: 8 } as const
export const NEWLAND_PORTAL_FRONT = { x: 2, y: 8 } as const

/**
 * 서고 바깥. 자산 manifest.json의 archive(down): 그림 4×4칸, footprint 4×3, entry 그림 화소 (32,60) → 4칸 폭의 3번째 칸(0부터 2), 맨 아랫줄.
 * 엔진 좌표는 아래처럼 따로 정했다: footprint = 가로 x0..x0+3, 세로 y0+1..y0+3 (그림의 맨 윗줄은 지붕이 걸치는 줄), 문 = 아랫줄의 2번째 칸 위
 */
export const ARCHIVE = {
  /** 그림 왼쪽 위 칸 */
  x0: 18,
  y0: 3,
  w: 4,
  /** 막히는 줄 수 (footprint 높이) */
  h: 3,
  door: { x: 20, y: 6 },
  /** 문 앞 (길과 이어진다) */
  front: { x: 20, y: 7 },
} as const

/** 건축 가능 구역 (계획 20 D2: 가운데 28×18, 서고 자리·길 제외) — 이 직사각형 안은 모두 빈 풀밭이다 */
export const BUILD_RECT = { x0: 6, y0: 10, x1: 33, y1: 27 } as const

/** 서고 안 방 (벽 포함 13×10, 지도 아래 보이지 않는 곳). 문깔개는 아랫벽 가운데, 들어오면 그 위 칸에 선다 */
export const INTERIOR = { x0: 13, y0: 30, w: 13, h: 10 } as const
export const INTERIOR_EXIT = { x: INTERIOR.x0 + 6, y: INTERIOR.y0 + INTERIOR.h - 1 } as const
export const INTERIOR_ENTRY = { x: INTERIOR_EXIT.x, y: INTERIOR_EXIT.y - 1 } as const

/**
 * 입주 주택 안 방 칸 (계획 20 작업 7): 지도 아래 보이지 않는 줄에서 서고 안 방(INTERIOR)을 뺀 가로 구간마다
 * 8×6 방(자산 OLD_INTERIORS 128×96px)이 몇 개 들어가는지 세어 미리 나눈 칸이다. 윗 두 줄은 벽, 아래 네 줄은 바닥,
 * 문깔개는 맨 아랫줄 가운데(exit), 들어오면 그 위 칸(entry)에 선다.
 * 이 지도(40×10 숨은 줄, 서고 방 13칸 가로)에서는 왼쪽 구간 13칸에 1개, 오른쪽 구간 14칸에 1개, 세로는 10줄에 한 줄뿐이라 모두 2개다.
 */
export const ROOM_W = 8
export const ROOM_H = 6
export interface RoomSlot {
  x0: number
  y0: number
  w: number
  h: number
  entry: { x: number; y: number }
  exit: { x: number; y: number }
}
function makeRoomSlots(): RoomSlot[] {
  const hidden = NEWLAND_H - NEWLAND_VISIBLE_H
  const bands = Math.floor(hidden / ROOM_H)
  const top = NEWLAND_VISIBLE_H + Math.floor((hidden - bands * ROOM_H) / 2)
  const spans = [
    [0, INTERIOR.x0],
    [INTERIOR.x0 + INTERIOR.w, NEWLAND_W],
  ]
  const out: RoomSlot[] = []
  for (let b = 0; b < bands; b++)
    for (const [from, to] of spans) {
      const n = Math.floor((to - from) / ROOM_W)
      const left = from + Math.floor((to - from - n * ROOM_W) / 2)
      for (let i = 0; i < n; i++) {
        const x0 = left + i * ROOM_W
        const y0 = top + b * ROOM_H
        out.push({ x0, y0, w: ROOM_W, h: ROOM_H, exit: { x: x0 + 4, y: y0 + ROOM_H - 1 }, entry: { x: x0 + 4, y: y0 + ROOM_H - 2 } })
      }
    }
  return out
}
export const ROOM_SLOTS: readonly RoomSlot[] = makeRoomSlots()
/** 입주 주택(방이 있어야 하는 건물)을 지을 수 있는 최대 수 — 방 칸 수와 같다 */
export const MAX_HOMES = ROOM_SLOTS.length

/** 서고 안 책상·책장 칸 (작업 5가 연결한다 — 지금은 칸과 서는 자리만 마련) */
export const INTERIOR_DESK = { tile: { x: 16, y: 32 }, stand: { x: 16, y: 33 } } as const
export const INTERIOR_SHELF = { tile: { x: 22, y: 32 }, stand: { x: 22, y: 33 } } as const

/** 땅이 드러나기 전에 보이는 줄: 0..이 줄까지 (서고·길·빈 땅 첫머리). 그 아래 바깥 칸은 숲으로 보인다 (계획 20 D8) */
export const PREVIEW_LAST_ROW = 12
/** 첫 방문 아침빛: 걸리는 초와 시작 어둡기 (0 = 환함) */
export const FIRST_LIGHT_SECONDS = 2.5
export const FIRST_LIGHT_DARK = 0.8
/** 서고 문을 처음 밟으면 보이는 구절 (본문은 Passage가 불러온 구약에서만 읽는다) */
export const FIRST_REF = '창 1:3'
