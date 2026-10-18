import type { FurnitureActivity } from '../engine/furniture-autonomy'
import { petFurniturePlace, type ChildFurnitureId, type PetFurnitureId } from '../engine/family-furniture'
import { childFurnitureFrame, petFurnitureRows, petFurnitureObjectRows } from './family-furniture-motion'
import { copyFurnitureUseFrame, COPY_MOTION_SIZE, type CopyFurnitureCast } from './copy-furniture-motion'
import { copyFurnitureCast } from './copy-furniture-cast'
import { isCopyFurniture } from '../engine/copy-furniture'
import { copyFurnitureObjectFrame } from './copy-furniture-art'
import {newbornArt} from './newborn-art'
import {drawHillMapTile} from './hill-map-art'
import { OT_LIBRARY_ROOF } from './library-roof-palette'
import { villageBookCount } from "../engine/progression"
import { FIXTURES } from '../engine/home-layout'
import { SPOUSE_FURNITURE } from '../engine/furniture-defs'
import './dish-icons'
// 캔버스 그리기. 엔진 상태를 읽기만 하고 바꾸지 않는다.
import { barleyRipe, chimneySmoke, festivalOf, FESTIVAL_FROM, FESTIVAL_TO, grapesRipe, icyMorning, isWet, puddlesOut, weatherOf } from '../engine/calendar'
import { darkness, phaseOf, seasonOf } from '../engine/clock'
import { isGrown, petCornerProp, petFollowPose, petHabit, STRAY_SPOTS, EAVES } from '../engine/companion'
import { totalChapters } from '../engine/books'
import { shelfRoom } from '../engine/shelf-rooms'
import { childTile, childAtSchool, closedHouseIds, mailboxHasPost, storyWaiting, SCHOOL_SEAT, straysToday, weddingToday, ACT_SECONDS, type ActKind, type GameState, type PlayerAct } from '../engine/game'
import { furnitureUseFrame, USE_INFO, USE_PROP_PALETTE, USE_SIZE, type UseAction } from './furniture-use-motion'
import { extraUseFrame, petMotionRows, type ExtraAction } from './expansion-life-motion'
import { eatingFrame, eatFoodFor, EAT_DURATIONS } from './eating-art'
import { lodgingBuildingRows, LODGING_PALETTE, LODGING_STAIRS_ROWS } from './lodging-art'
import { homeRoofParts, homeAdditionArt, homeAdditionSnowRows } from './expanded-home-art'
import { OIL_PRESS_ART } from './oil-press-art'
import { isWalkable } from '../engine/world'
import { LODGING_SEATS, LODGING_STAIRS, lodgingChildren } from '../engine/lodging'
import { weddingActorFrame, type WeddingAction } from './wedding-art'
import { eventMotionFrame, type EventAction } from './event-life-motion'
import { drawEventProp, eventPropSortY } from './event-props'
import { eventPropsNow, npcEventMotion, playerEventMotion, weddingEvening, type EventMotion } from '../engine/event-scene'
import { socialMotionFrame } from './social-motion-art'
import { gatheringActionFor, gatheringMotionFrame } from './gathering-motion'
import type { SocialAction } from '../engine/social-scene'
import { FESTIVAL_SPOTS } from '../engine/neighbors'
import { deskTraces, type DeskTraces } from '../engine/desk-traces'
import { facingOf, footprint, FURNITURE_DEFS, sizeOf, solidTiles, type Furniture } from '../engine/room'
import { babyCareFrame, type BabyCareAction } from './baby-care-motion'
import { additionObjectFrame, additionUseFrame, ADDITION_MOTION_SIZE, ADDITION_USE_INFO, OPENING_FURNITURE, type AdditionUseAction, type AnimatedAdditionFurniture } from './addition-furniture-motion'
import { liveSpaces, spaceFurniture, type SpaceUse } from '../engine/spaces'
import { FURNI_PALETTE, FURNITURE_ART, STYLE_PALETTES } from './furniture-art'
import { SPOUSE_ROOM_ART, SPOUSE_ROOM_VIEWS } from './spouse-room-art'
import { HOME_SPACE_DIRECTIONS } from './home-space-directions'
import { currentSpouseRoom, SPOUSE_ROOM } from '../engine/spouse-room'
import { facingArt } from './furniture-facing'
import { HOME_FIXTURE_ART } from './home-space-art'
import { REMAINING_FIXTURE_ART } from './remaining-furniture-art'
import { EXPANSION_PROPS, EXPANSION_VIEWS } from './expansion-prop-art'
import { drawClubWorks, drawPetProp, drawStall, drawStoryProps, drawVillage, registerStoryPropArt } from './story-props'
import { LIFE_GAP_PROPS, LIFE_GAP_STRUCTURES } from './life-gap-art'
import { drawDecor, lanternLights } from './decor'
import {villageSheepFrames} from './village-sheep-frame'
import {neighborLook} from './neighbor-look'
import { grassTrails } from './ground-trails'
import { FIRE, isNear, npcTile, route } from '../engine/neighbors'
import { wanderGoal } from '../engine/npc-life'
import { homeWallsKey } from '../engine/home-walls'
import { childGrowth, rainbowVisible } from '../engine/stories'
import { childMode, childStage } from '../engine/child'
import { siblingsOf, siblingTile } from '../engine/siblings'
import { ownerJob } from '../engine/kid-work'
import { playerChildAvatar, playerChildSprite } from './player-child-look'
import { BOARD, stoneTile, TRIP_H, TRIP_W, tripLayout, type Cell as TripCell } from '../engine/trip-board'
import { feastToday } from '../engine/library'
import { roomPieceRatio, SHELF_FILL, shelfFillSteps } from '../engine/fragments'
import { groundFragment } from '../engine/ground-fragments'
import { OT_PIECE_COUNT } from '../engine/ot-pieces'
import { spineLook } from '../engine/binding'
import { bookcaseTiles, key, ACTS_ROOM, HEB_JUD_ROOM, REV_ROOM, isRightWallDoor, LETTERS_ROOM, openDoors, cameraFor, currentHomeLevel, PAVILION_RECT, HEIGHT, HOUSE_RECT, housesNow, houseAt, lockedTiles, lockedZones, tileAt, isIndoor, MAP, PLACES, ROOMS, roomAt, SIDE_DOOR, viewRoomAt, TILE, VIEW_H, VIEW_W, VILLAGE_H, WIDTH, sameTile, treeKind, type TreeKind } from '../engine/world'
import { currentMapId, mapVisibleHeight, setActiveMap } from '../engine/maps'
import { inArchiveRoom, newlandGroundAt, newlandOpen, newlandRevealedOn } from '../engine/newland'
import { areaOf, widthOf } from '../engine/newland-build'
import { ARCHIVE, INTERIOR_SHELF, NEWLAND_H, NEWLAND_W, ROOM_SLOTS } from '../engine/newland-config'
import { inBuildingRoom, roomOf } from '../engine/newland-rooms'
import { OLD_BUILDINGS, OLD_CONSTRUCTION, OLD_INTERIOR_SHELL, OLD_PROPS, OLD_TERRAIN, OLD_VILLAGE_PALETTE } from './old-village-art'
import { newlandHouseCanvas } from './newland-house-art'
import { hasHouseLook } from '../engine/newland-house-look'
import { mainOffset } from '../engine/newland-sites'
import { GOSPELS, type Book, type Facing, type NeighborDef, type GameContent, type Piece, type Season, type Tile } from '../engine/types'
import { breathOffset, dozeNod, isBlinking, lookSide, walkFrame } from './anim'
import { quietLifeRows, sheepLifeRows, type QuietAction } from './quiet-life-motion'
import { MEETING_EMOTES, MEETING_PALETTE, meetingEmoteRows, householdCradleFrame, visitorFrame, VISITOR_LOOKS, type MeetingEmote } from './village-followup-art'
import { bakerInfantAtHome, householdCradles, libraryVisitor } from './village-followup-scene'
import { innGuestsNow } from '../engine/inn-guests'
import { residentIsElder } from './elder-details'
import { companionsOf, genAvatar, type Companion } from '../engine/gen-looks'
import { BAKER_BABY_ID, type GenPerson } from '../engine/gen'
import { bakerCribWaiting } from '../engine/baker-baby'
import { familyFrame, type FamilyAction, type GenerationStage } from './generation-art'
import { COOL_CUPBOARD, cookingFrame, type CookAction } from './cooking-art'
/** 지금 그리는 기록자 동작의 요리 손동작 순서 (drawPlayerAct가 맞춘다) */
let cookSteps: string[] = []
/** 서늘한 찬장에 음식이 있나 (그리기 한 번마다 맞춘다 — drawFurniture가 읽는다) */
let pantryFull = false
/** 지금 쓰는 생활 가구 (2026-10-12): 그린 동작이면 가구째 그리므로 놓인 가구는 숨기고, 여닫는 가구는 문이 열린 그림으로 */
let autoFurnitureUses: FurnitureActivity[] = []
let activeSpot: { spot: NonNullable<PlayerAct['spot']>; kind: string; use?: string; elapsed: number } | null = null
let activeCopyCast: CopyFurnitureCast = {}
let activeCopyFeet = { x: 0, y: 0 }
import { slotHeir } from '../engine/gen-growth'
import { BG_ART, BG_PALETTE } from './bg-materials-art'
import { blocksWay, isOpenYard, MAP_DECOR_CHAR, SITES, type DecorKind } from '../engine/newland-sites'
import { familyHomes, familyShownMember, livesInNewland, sharedHomeOf } from '../engine/gen-homes'
import { JOIN_PATH_PALETTE, joinedPathRows, PATH_BITS } from './archive-followup-art'
import { kidVisiting, dreamKey, DREAMER, guestNow, kidWorkJob, kidWorkSpot, markerShown, memoriesOf, settledGuests, settledSpot, SETTLED_FROM, SETTLED_TO, type Memory } from '../engine/newland-life'
import { GUEST_PROP_PALETTE, SETTLEMENT_GUESTS, settlementGuestFrame } from './settlement-guests-art'
import { ADDITION_PROP_PALETTE, childMotionFrame, elderMotionFrame, guestArrivalFrame, toddlerMotionFrame } from './life-additions-motion-art'
import { MEMORY_PALETTE, memoryMarkerRows, type MemoryKind } from './life-additions-prop-art'
import { standSpotOf } from '../engine/newland-build'
import { ARCHIVE_ROOM_SHELVES, archiveRoomsOpen } from '../engine/newland'
import { OT_ROOMS } from '../engine/ot-books'
import { otBookFinished } from '../engine/books'
import { avatarKey, withLookDefaults, type Avatar, type FullAvatar } from '../engine/avatar'
import {
  animalRows,
  ANIMAL_PALETTE,
  BABY,
  BUTTERFLY,
  ICON_PALETTE,
  ICONS,
  mirror,
  recolor,
  SMALL_PALETTE,
  spriteRows,
  writerPalette,
  PALETTE,
  type Look,
  type Pose,
  type SpriteRows,
  type Who,
} from './sprites'

// 생활 확장 도트를 이야기 뒤 소품 그림으로 한 번 등록한다
registerStoryPropArt({ ...EXPANSION_PROPS, ...LIFE_GAP_PROPS }, { ...EXPANSION_VIEWS, ...LIFE_GAP_STRUCTURES })

import {C,hash,drawNativeGround,drawTree,drawNativeRoomWall} from './world-ground-art'

type Ctx = CanvasRenderingContext2D

import {HOUSE_STYLES,PLAIN_STYLE,houseWallTile,chimneyX,drawRoof,drawLibraryExterior} from './house-exterior-art'
export {drawLibraryExterior} from './house-exterior-art'

/** 터 가꾸기 목록 아이콘: 지도 글자 한 칸 (기본 길·잔디·기본 나무 — 2026-10-14) */
const mapTileIcons = new Map<string, HTMLCanvasElement>()
export function mapTileIcon(ch: ',' | '.' | 'T'): HTMLCanvasElement {
  let c = mapTileIcons.get(ch)
  if (c) return c
  c = document.createElement('canvas')
  c.width = TILE
  c.height = TILE
  const g = c.getContext('2d')
  if (g) {
    const base = ch === 'T' ? '.' : ch
    drawGround(g, base, 0, 0, 'summer', () => base)
    if (ch === 'T') drawObject(g, 'T', 0, 0, 'summer', 'deciduous')
  }
  mapTileIcons.set(ch, c)
  return c
}

function drawGround(g: Ctx,ch:string,x:number,y:number,season:Season,at:(x:number,y:number)=>string=tileAt){
  drawNativeGround(g,ch,x,y,season,at,mapVisibleHeight())
}

function drawObject(g: Ctx, ch: string, x: number, y: number, season: Season, tree: TreeKind = 'deciduous') {
  const px = x * TILE
  const py = y * TILE
  // 2층 여관 침대는 아래 칸에 발치('U')가 있다 — 한 칸 침대가 반으로 잘린 듯 보여 내 집 침대(두 칸) 그림으로 (2026-10-13)
  if (ch === 'b' && tileAt(x, y + 1) === 'U') {
    const bed = facingArt('homeBed', 'down')
    if (bed) { g.drawImage(paint('lodgingBed', bed.rows, FURNI_PALETTE), px, py); return }
  }
  const fixture = HOME_FIXTURE_ART[ch] ?? REMAINING_FIXTURE_ART[ch]
  if (fixture) {
    g.drawImage(paint(`fixture/${ch}`, fixture.rows, FURNI_PALETTE), px, py)
    return
  }
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  switch (ch) {
    case '#':
    case 'S': {
      const h = houseAt(x, y)
      if (h) {
        houseWallTile(g, x, y, ch, h.id, h)
        break
      }
      drawNativeRoomWall(g,x,y,tileAt)
      break
    }
    case 'R':
      // 지붕은 집 하나를 통째로 나중에 그린다 (drawRoof)
      break
    case 'T':
      drawTree(g, x, y, season, tree)
      break
    case 'L': {
      const h = houseAt(x, y)
      if (h) houseWallTile(g, x, y, ch, h.id, h)
      break
    }
    case 'G':
      // 복음서 선반 (꽂힌 책은 그릴 때 얹는다)
      r(C.shadow, 0, 13, 16, 3)
      r(C.woodDark, 0, 0, 16, 14)
      r(C.wood, 1, 1, 14, 12)
      r(C.woodDark, 1, 12, 14, 1)
      r('#fac839', 0, 0, 16, 1)
      break
    case 'Q':
      // 한 권 선반 (사도행전 방·요한계시록 방): 복음서 선반과 같은 나무, 위 테는 방마다 —
      // 사도행전 방은 잿빛 파랑, 요한계시록 방은 옅은 라벤더 (꽂은 책은 그릴 때 얹는다)
      r(C.shadow, 0, 13, 16, 3)
      r(C.woodDark, 0, 0, 16, 14)
      r(C.wood, 1, 1, 14, 12)
      r(C.woodDark, 1, 11, 14, 2)
      r(roomAt({ x, y }) === REV_ROOM ? '#c0b5db' : '#84a0ba', 0, 0, 16, 2)
      break
    case 'M': {
      // 벽에 건 여정 판 (세 칸에 걸친 한 장): 나무 테두리와 옅은 양피지 바탕. 카드와 실은 그릴 때 얹는다
      const L = tileAt(x - 1, y) !== 'M'
      const R = tileAt(x + 1, y) !== 'M'
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      const x0 = L ? 2 : 0
      const x1 = R ? 14 : 16
      r(C.woodDark, x0, 2, x1 - x0, 13)
      r('#fbedd1', x0 + (L ? 2 : 0), 4, x1 - x0 - (L ? 2 : 0) - (R ? 2 : 0), 9)
      break
    }
    case 'C': {
      // 벽에 건 일곱 교회 카드 판 (세 칸에 걸친 한 장): 여정 판과 같은 나무 테, 바탕은 옅은 잿빛 하늘색.
      // 카드 자리 일곱 칸(옅은 테)과 놓인 카드·실은 그릴 때 얹는다 (drawCardBoard)
      const L = tileAt(x - 1, y) !== 'C'
      const R = tileAt(x + 1, y) !== 'C'
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      const x0 = L ? 2 : 0
      const x1 = R ? 14 : 16
      r(C.woodDark, x0, 2, x1 - x0, 13)
      r('#e9f1f5', x0 + (L ? 2 : 0), 4, x1 - x0 - (L ? 2 : 0) - (R ? 2 : 0), 9)
      break
    }
    case 'Y': {
      // 편지 방의 편지 선반 (세 칸이 한 선반): 옅은 잿빛 나무, 위 테는 방마다 — 로마서–빌레몬서 방은 연한 하늘색,
      // 히브리서–유다서 방은 연한 쑥색 (얇은 책등은 그릴 때 얹는다)
      const L = tileAt(x - 1, y) !== 'Y'
      const R = tileAt(x + 1, y) !== 'Y'
      r(C.shadow, 0, 13, 16, 3)
      r('#a08b70', 0, 0, 16, 14)
      r('#e5d6bc', L ? 2 : 0, 2, 16 - (L ? 2 : 0) - (R ? 2 : 0), 9)
      r('#a08b70', 0, 11, 16, 2)
      r(roomAt({ x, y }) === HEB_JUD_ROOM ? '#c2ddae' : '#add0e4', 0, 0, 16, 2)
      break
    }
    case 'V': {
      // 벽에 건 편지꽂이 (세 칸에 걸친 한 장): 옅은 잿빛 나무 칸칸이 접힌 크림색 편지. 막힌 칸, 누르는 곳이 아니다
      const L = tileAt(x - 1, y) !== 'V'
      const R = tileAt(x + 1, y) !== 'V'
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      const x0 = L ? 2 : 0
      const x1 = R ? 14 : 16
      // 뒤판 (옅은 잿빛 나무, 테두리 2픽셀)
      r('#a08b70', x0, 3, x1 - x0, 12)
      r('#ddcab0', x0 + (L ? 2 : 0), 5, x1 - x0 - (L ? 2 : 0) - (R ? 2 : 0), 8)
      // 칸마다 접힌 편지 두 통이 주머니 위로 비죽 나와 있다 (칸 하나가 좌우 대칭 — 세 칸을 이어도 대칭)
      for (const lx of [4, 9]) {
        r('#fdf5e0', lx, 4, 3, 7)
        r('#dbeef7', lx, 4, 3, 2)
      }
      // 앞쪽 주머니 판: 윗단은 짙게
      r('#c7b49a', x0, 9, x1 - x0, 5)
      r('#a08b70', x0, 9, x1 - x0, 2)
      break
    }
    case 'F': {
      // 사랑방 벽의 의뢰 게시판 (두 칸에 걸친 한 장): 나무 판에 핀으로 꽂은 쪽지 둘씩
      const L = tileAt(x - 1, y) !== 'F'
      const R = tileAt(x + 1, y) !== 'F'
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      const x0 = L ? 2 : 0
      const x1 = R ? 14 : 16
      r('#a5713d', x0, 3, x1 - x0, 11)
      r('#ce9759', x0 + (L ? 1 : 0), 4, x1 - x0 - (L ? 1 : 0) - (R ? 1 : 0), 9)
      for (const [nx, ny, h] of L ? [[4, 5, 6], [9, 6, 5]] : [[2, 6, 5], [7, 5, 6]]) {
        r('#fdf5e0', nx, ny, 4, h)
        r('#ddcab0', nx + 1, ny + 2, 2, 1)
        r('#ddcab0', nx + 1, ny + 4, 2, 1)
        r('#e35427', nx + 1, ny, 1, 1)
      }
      break
    }
    case 'N':
      // 방 벽의 창 (한 칸, 창 자체도 좌우 대칭): 잿빛 나무 창틀, 연한 하늘빛 유리, 가운데 창살
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      r('#b8a488', 3, 3, 10, 11)
      r('#dbeef7', 5, 5, 6, 7)
      r('#ebf5fa', 5, 5, 6, 2)
      r('#b8a488', 7, 5, 2, 7)
      r('#b8a488', 5, 8, 6, 2)
      r('#dacab3', 2, 13, 12, 2)
      break
    case 'J': {
      // 열린 서고 방 문: 문설주, 안쪽 방의 따뜻한 빛, 열어 둔 문짝.
      // 왼쪽 벽 문(사도행전 방·로마서–빌레몬서 방)은 문짝이 오른쪽, 오른쪽 벽 문(히브리서–유다서 방)은 좌우를 뒤집어 왼쪽
      // (문설주·불빛은 가운데 대칭이라 그대로)
      const leaf = isRightWallDoor(x, y) ? 2 : 10
      r(C.wall, 0, 0, 16, 16)
      r('#c59a61', 2, 1, 12, 15)
      r('#ffe4a9', 4, 3, 8, 13)
      r('#fff0d0', 4, 12, 8, 4)
      r(C.woodDark, leaf, 3, 4, 13)
      r(C.wood, leaf + 1, 4, 2, 12)
      break
    }
    case 'K':
      // 잠긴 방 문: 벽에 난 나무문과 자물쇠
      r(C.wall, 0, 0, 16, 16)
      r('#c59a61', 2, 1, 12, 15)
      r(C.woodDark, 3, 2, 10, 14)
      r(C.wood, 4, 3, 8, 13)
      r(C.woodDark, 8, 3, 1, 13)
      r('#8a8478', 6, 8, 4, 4)
      r('#c1b8a6', 7, 9, 2, 2)
      break
    case 'n':
      // 탁자와 식탁보
      r(C.shadow, 1, 12, 15, 3)
      r(C.woodDark, 2, 10, 2, 5)
      r(C.woodDark, 12, 10, 2, 5)
      r(C.wood, 1, 4, 14, 7)
      r('#f9efe1', 2, 4, 12, 4)
      for (let i = 0; i < 6; i++) r('#cc8989', 2 + i * 2, 7, 1, 1)
      break
    case 'g':
      // 항아리
      r(C.shadow, 3, 13, 10, 3)
      r('#d6ac89', 4, 5, 8, 9)
      r('#bd916b', 3, 7, 10, 5)
      r('#ebd0b5', 5, 6, 2, 3)
      r('#966847', 5, 3, 6, 2)
      break
    case 'p':
      // 꽃 화분
      r(C.shadow, 3, 13, 10, 3)
      r('#cc8e79', 4, 9, 8, 5)
      r('#b1705d', 4, 9, 8, 1)
      r('#81ae75', 7, 4, 2, 5)
      r('#81ae75', 4, 5, 3, 2)
      r('#81ae75', 9, 5, 3, 2)
      r('#f2aab5', 6, 1, 4, 3)
      r('#eed998', 7, 2, 2, 1)
      break
    case 'W':
      // 베틀과 짜다 만 천
      r(C.woodDark, 1, 1, 2, 14)
      r(C.woodDark, 13, 1, 2, 14)
      r(C.wood, 1, 1, 14, 2)
      for (let i = 0; i < 5; i++) r(['#db9099', '#93b9db', '#d9bc77', '#ab9dd0', '#a2cc95'][(x + i) % 5], 3 + i * 2, 3, 2, 9)
      r(C.wood, 2, 12, 12, 2)
      break
    case 'e': {
      // 깔개 (밟고 다닌다): 이어진 깔개 칸끼리는 테두리 없이 한 장으로
      const rugAt = (dx: number, dy: number) => tileAt(x + dx, y + dy) === 'e'
      const t = rugAt(0, -1) ? 0 : 2
      const b = rugAt(0, 1) ? 16 : 14
      const l = rugAt(-1, 0) ? 0 : 2
      const rr = rugAt(1, 0) ? 16 : 14
      r('#d46d46', l, t, rr - l, b - t)
      r('#e39462', l + (l ? 2 : 0), t + (t ? 2 : 0), rr - l - (l ? 2 : 0) - (rr < 16 ? 2 : 0), b - t - (t ? 2 : 0) - (b < 16 ? 2 : 0))
      // 가운데 크림 무늬 (칸마다 같은 자리에 — 이어 붙이면 줄무늬가 된다)
      r('#ffe6ba', 7, 4, 2, 2)
      r('#ffe6ba', 7, 10, 2, 2)
      break
    }
    case 'E':
      // 문깔개: 밟으면 밖으로
      r(C.wall, 0, 0, 16, 16)
      r(C.woodDark, 2, 0, 12, 16)
      r(C.wood, 3, 1, 10, 15)
      r('#f5e4bf', 4, 3, 8, 4)
      r('#ba8e7f', 3, 12, 10, 3)
      break
    case 'u':
      // 나루에 매어 둔 고깃배
      r(C.water2, 0, 12, 16, 2)
      r(C.woodDark, 1, 5, 14, 7)
      r(C.wood, 2, 5, 12, 4)
      r(C.woodDark, 7, 0, 1, 6)
      r('#fbf1dc', 8, 0, 5, 4)
      break
    case 'w':
      r(C.shadow, 2, 13, 13, 3)
      r(C.stoneDark, 2, 4, 12, 11)
      r(C.stone, 2, 3, 12, 10)
      r(C.water, 4, 5, 8, 6)
      r(C.stoneDark, 4, 5, 8, 1)
      r(C.woodDark, 1, 0, 2, 6)
      r(C.woodDark, 13, 0, 2, 6)
      r(C.wood, 1, 0, 14, 2)
      break
    case 'b':
      r(C.woodDark, 1, 1, 14, 14)
      r(C.blanket, 2, 5, 12, 9)
      r(C.blanketDark, 2, 12, 12, 2)
      r(C.pillow, 3, 2, 10, 3)
      break
    case 'd':
      r(C.shadow, 1, 12, 15, 3)
      r(C.woodDark, 2, 11, 2, 4)
      r(C.woodDark, 12, 11, 2, 4)
      r(C.wood, 1, 4, 14, 8)
      r(C.woodDark, 1, 11, 14, 1)
      r(C.paper, 3, 5, 8, 5)
      r(C.woodDark, 4, 6, 6, 1)
      r(C.woodDark, 4, 8, 4, 1)
      r(C.lamp, 12, 3, 2, 3)
      break
    case 'h':
      r(C.stoneDark, 1, 2, 14, 13)
      r(C.stone, 2, 3, 12, 6)
      r('#342118', 4, 9, 8, 5)
      break
    case 's':
      r(C.woodDark, 1, 1, 14, 14)
      r(C.wood, 2, 4, 12, 1)
      r(C.wood, 2, 9, 12, 1)
      r(C.wood, 2, 14, 12, 1)
      break
    case 'k':
      r(C.shadow, 1, 12, 15, 3)
      r(C.woodDark, 2, 10, 2, 5)
      r(C.woodDark, 12, 10, 2, 5)
      r(C.wood, 1, 5, 14, 6)
      r(C.reed, 3, 6, 5, 2)
      r('#2f213a', 10, 6, 3, 3)
      break
    case 'U': {
      // 침대 발치: 지도는 위 줄부터 그려 이 칸의 바닥이 머리 칸('b')의 두 칸 그림 아래쪽을 덮는다 — 바닥 위에 침대를 다시 얹는다
      const bed = facingArt('homeBed', 'down')
      if (bed) g.drawImage(paint('lodgingBed', bed.rows, FURNI_PALETTE), px, py - TILE)
      break
    }
    case 'B':
      r(C.shadow, 1, 11, 15, 3)
      r(C.woodDark, 2, 9, 2, 5)
      r(C.woodDark, 12, 9, 2, 5)
      r(C.wood, 1, 7, 14, 3)
      break
    case 'D': {
      const h = houseAt(x, y)
      if (h) houseWallTile(g, x, y, ch, h.id, h)
      else if (sameTile({ x, y }, SIDE_DOOR)) {
        // 작업실과 새 방 사이 벽에 낸 문: 트인 바닥, 위아래 벽에 닿는 나무 문설주
        r(C.woodDark, 0, 0, 16, 3)
        r(C.woodDark, 0, 13, 16, 3)
      } else r(C.door, 0, 0, 16, 3)
      break
    }
    case 'H':
      // 다락으로 오르는 사다리: 벽에 기댄 두 기둥과 가로대, 위로 난 어두운 구멍
      r('#8f684a', 2, 0, 12, 3)
      r(C.shadow, 3, 13, 11, 3)
      r(C.woodDark, 3, 0, 2, 15)
      r(C.woodDark, 11, 0, 2, 15)
      for (const ry of [3, 7, 11]) r(C.wood, 5, ry, 6, 2)
      break
    case 'I': {
      // 다락 창 (두 칸에 걸친 창 하나 — 가운데 창살): 벽, 나무 창틀, 하늘빛 유리
      const left = tileAt(x + 1, y) === 'I'
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      r('#c59a61', left ? 4 : 0, 3, 12, 11)
      r('#daeff4', left ? 6 : 0, 5, 10, 7)
      r('#edf7f7', left ? 6 : 2, 5, 4, 3)
      r('#c59a61', left ? 14 : 0, 5, 2, 7)
      r('#c59a61', left ? 6 : 0, 8, 10, 2)
      if (!left) r('#c59a61', 10, 3, 2, 11)
      r('#e9ce94', left ? 3 : 0, 13, 13, 2)
      break
    }
    case 'r': {
      // 갈대: 봄은 짧은 연두 새순, 여름은 키 큰 초록에 밤색 이삭, 가을은 갈색 줄기에 크림빛 이삭, 겨울은 마른 줄기 (줄기는 2픽셀)
      const [s1, s2, head] =
        season === 'spring'
          ? ['#9ccb6c', '#86ba5a', null]
          : season === 'summer'
            ? [C.reed, C.reed2, C.woodDark]
            : season === 'autumn'
              ? ['#c4a062', '#ab8650', '#efe0bd']
              : ['#cdbf98', '#b7a77e', null]
      const grow = season === 'spring' ? 5 : season === 'winter' ? 3 : 0
      for (const [i, sx] of [2, 6, 9, 13].entries()) {
        const top = 2 + ((i * 5) % 4) + grow
        r(i % 2 ? s2 : s1, sx, top, 2, 14 - top)
        if (head && i % 2 === 0) r(head, sx, top - 1, 2, 4)
      }
      break
    }
    case 'v':
      // 포도 덩굴: 봄은 연한 새잎이 듬성듬성, 여름은 짙게 우거지고, 가을은 잎 끝이 누렇게 (익은 포도는 그릴 때 얹는다),
      // 겨울은 잎 진 마른 덩굴만 줄을 따라
      r(C.woodDark, 0, 7, 16, 2)
      r(C.woodDark, 7, 3, 2, 12)
      if (season === 'winter') {
        r('#9a7b52', 1, 5, 6, 2)
        r('#9a7b52', 9, 5, 6, 2)
        r('#9a7b52', 3, 3, 2, 2)
        r('#9a7b52', 11, 3, 2, 2)
        r('#c2a878', 13, 9, 2, 2)
      } else if (season === 'spring') {
        r('#7fb65a', 2, 3, 5, 5)
        r('#7fb65a', 9, 3, 5, 5)
        r('#a6d07c', 3, 3, 2, 2)
        r('#a6d07c', 10, 4, 2, 2)
      } else {
        r(C.vine, 2, 2, 12, 7)
        r(C.leaf3, 4, 3, 3, 2)
        if (season === 'autumn') {
          r('#d2b158', 10, 2, 4, 3)
          r('#d2b158', 2, 6, 3, 2)
        }
      }
      break
    case 'j':
      // 들 약초: 낮은 풀포기에 잎 셋, 봄·여름·가을엔 작은 흰 꽃 (겨울엔 마른 잎)
      r('rgba(60,70,40,0.18)', 3, 12, 10, 2)
      r(season === 'winter' ? '#b6a878' : '#70b54e', 4, 7, 8, 6)
      r(season === 'winter' ? '#cabc8c' : '#8bc963', 2, 9, 4, 3)
      r(season === 'winter' ? '#cabc8c' : '#8bc963', 10, 9, 4, 3)
      r(season === 'winter' ? '#cabc8c' : '#a3da7a', 6, 4, 4, 4)
      if (season !== 'winter') {
        r('#fefdf8', 5, 5, 2, 2)
        r('#fefdf8', 9, 6, 2, 2)
      }
      break
    case 'o':
      // 올리브나무: 은빛 도는 작은 둥근 나무
      r('rgba(90,80,50,0.18)', 4, 13, 8, 2)
      r(C.trunk, 7, 10, 2, 5)
      r(C.olive2, 3, 3, 10, 7)
      r(C.olive, 4, 2, 8, 6)
      r(C.olive, 3, 4, 10, 3)
      r('#bfd7a5', 5, 3, 3, 2)
      break
    case 'P':
      g.drawImage(paint('fixture/oil-press',OIL_PRESS_ART.rows,FURNI_PALETTE),px,py)
      break
    case 'A':
      r(C.shadow, 2, 12, 13, 3)
      r('#3f3f46', 3, 5, 10, 4)
      r('#56565e', 5, 9, 6, 5)
      r('#2a2a30', 2, 5, 2, 2)
      break
    case 'X':
      // 마을 매대 (2026-10-12): 두 칸짜리 과일 진열대 — 오른쪽 칸 바닥까지 그린 뒤 오른쪽 칸에서 한 번
      if (tileAt(x + 1, y) !== 'X') g.drawImage(paint('furni/fruitDisplay/stand', FURNITURE_ART.fruitDisplay.rows, FURNI_PALETTE), px - TILE, py)
      break
    case 'O':
      r(C.stoneDark, 1, 3, 14, 12)
      r(C.stone, 2, 4, 12, 6)
      r('#342118', 5, 9, 6, 5)
      r(C.fire, 6, 11, 4, 3)
      break
    case 'm':
      r(C.woodDark, 1, 6, 2, 10)
      r(C.woodDark, 13, 6, 2, 10)
      for (let i = 0; i < 4; i++) r(i % 2 ? C.awning2 : C.awning, i * 4, 1, 4, 5)
      r(C.wood, 1, 10, 14, 3)
      if (season === 'autumn') {
        // 가을 장터: 좌판 위와 밑에 수확 바구니 (석류·포도·호박·무화과 — 좌판마다 다르게)
        const left = x < 25
        const basket = (bx: number, by: number, w: number, fruit: string, fruit2: string) => {
          r('#b8864c', bx, by + 2, w, 3)
          r('#946638', bx, by + 2, w, 2)
          r(fruit, bx + 1, by, w - 2, 2)
          r(fruit2, bx + 1, by, 2, 2)
        }
        basket(2, 6, 6, left ? '#c8584c' : '#7b3f96', left ? '#e48a76' : '#a170b8')
        basket(8, 6, 6, left ? '#e0a050' : '#9a6a8c', left ? '#f2c27a' : '#b98aa8')
        basket(4, 11, 8, left ? '#e0c472' : '#c8584c', left ? '#f0dc96' : '#e48a76')
      } else {
        r(x < 16 ? '#e4cf87' : '#7a3491', 3, 8, 3, 2)
        r(x < 16 ? '#fbf1dc' : '#81b650', 9, 8, 3, 2)
      }
      break
    case 'q':
      // 문 앞 편지 바구니
      r(C.shadow, 3, 12, 10, 3)
      r(C.woodDark, 3, 7, 10, 7)
      r(C.wood, 4, 8, 8, 5)
      r('#fbf6e9', 5, 5, 6, 4)
      break
    case 'l':
      // 텃밭 흙두둑
      r('#a5713d', 1, 3, 14, 12)
      r('#8b5b2c', 1, 6, 14, 1)
      r('#8b5b2c', 1, 10, 14, 1)
      break
    case 'x':
      r(C.fence, 0, 5, 16, 2)
      r(C.fence, 0, 10, 16, 2)
      r(C.woodDark, 2, 3, 2, 11)
      r(C.woodDark, 12, 3, 2, 11)
      break
    case 'y': {
      // 보리밭: 봄은 맨흙 두둑에 연두 새싹, 여름은 누렇게 익은 보리, 가을은 벤 뒤 그루터기, 겨울은 쉬는 맨흙
      if (season === 'summer') {
        r('#c8a65b', 0, 0, 16, 16)
        for (let i = 0; i < 4; i++) {
          r('#dec374', 1 + i * 4, 2, 2, 11)
          r('#ecd690', 1 + i * 4, 2, 2, 3)
        }
      } else if (season === 'spring') {
        r('#b58d62', 0, 0, 16, 16)
        r('#a27a52', 0, 6, 16, 2)
        r('#a27a52', 0, 14, 16, 2)
        for (const row of [2, 10])
          for (let i = 0; i < 4; i++) {
            r('#a8d474', 1 + i * 4, row, 2, 4)
            r('#8cc05e', 1 + i * 4 + 2, row + 2, 2, 2)
          }
      } else if (season === 'autumn') {
        r('#d6bd84', 0, 0, 16, 16)
        r('#c4a76c', 0, 7, 16, 2)
        r('#c4a76c', 0, 14, 16, 2)
        for (const row of [4, 12]) for (let i = 0; i < 4; i++) r('#b8975a', 1 + i * 4, row, 2, 3)
      } else {
        r('#ae8d68', 0, 0, 16, 16)
        r('#9a7a56', 0, 4, 16, 2)
        r('#9a7a56', 0, 12, 16, 2)
      }
      break
    }
    case '>':
      // 왕래 표식 (자산 OLD_TERRAIN.mapWaySign): 길 위에 선 이정표 — 누르면 건너가는 창
      g.drawImage(paint('old/terrain/mapWaySign', OLD_TERRAIN.mapWaySign.rows, OLD_VILLAGE_PALETTE), px, py)
      break
    case '*':
      if (season !== 'winter')
        for (let i = 0; i < 3; i++) {
          r(C.flower[(x + y + i) % 4], 2 + Math.floor(hash(x, y, i + 7) * 11), 3 + Math.floor(hash(x, y, i + 9) * 10), 2, 2)
        }
      break
    case '=':
      r(C.wood, 0, 3, 16, 10)
      r(C.woodDark, 0, 7, 16, 1)
      r(C.woodDark, 5, 3, 1, 10)
      r(C.woodDark, 11, 3, 1, 10)
      break
  }
}

/** 길을 막은 덤불 한 칸 */
function drawBush(g: Ctx, x: number, y: number, season: Season) {
  const px = x * TILE
  const py = y * TILE
  const dark = season === 'winter' ? '#acbea0' : season === 'autumn' ? '#a89f6b' : '#779866'
  const mid = season === 'autumn' ? '#d5c080' : season === 'winter' ? '#c1cfb4' : '#91b07b'
  const light = season === 'winter' ? '#dee6d4' : season === 'autumn' ? '#e4d499' : '#b1ca93'
  g.fillStyle = dark
  g.fillRect(px, py + 2, TILE, TILE - 2)
  for (let i = 0; i < 5; i++) {
    const bx = px + Math.floor(hash(x, y, i + 20) * 11)
    const by = py + Math.floor(hash(x, y, i + 30) * 9)
    g.fillStyle = mid
    g.fillRect(bx, by, 6, 5)
    g.fillStyle = light
    g.fillRect(bx + 1, by, 3, 2)
  }
  // 가끔 작은 열매
  if (hash(x, y, 40) < 0.3) {
    g.fillStyle = '#cc8989'
    g.fillRect(px + 4 + Math.floor(hash(x, y, 41) * 8), py + 6 + Math.floor(hash(x, y, 42) * 6), 2, 2)
  }
}

/** 계절과 집 단계마다 한 장 (집을 넓히면 그 칸들의 그림이 바뀐다) */
const mapCache = new Map<string, HTMLCanvasElement>()
/**
 * 지도 그림은 최근 것 몇 장만 남긴다 — 벽을 세우거나 허물 때마다 키가 바뀌어 지도 한 장(약 8MB)씩 쌓이고 지워지지 않았다 (2026-10-18 감사 M-9)
 */
const MAP_CACHE_MAX = 12
function cachedMap(key: string): HTMLCanvasElement | undefined {
  const c = mapCache.get(key)
  if (c) {
    // 최근에 쓴 것으로 뒤에 다시 둔다
    mapCache.delete(key)
    mapCache.set(key, c)
  }
  return c
}
function keepMap(key: string, c: HTMLCanvasElement) {
  mapCache.set(key, c)
  while (mapCache.size > MAP_CACHE_MAX) mapCache.delete(mapCache.keys().next().value!)
}
function mapFor(season: Season): HTMLCanvasElement {
  const cacheKey = `${season}/${currentHomeLevel()}/${openDoors().join(',')}/${currentSpouseRoom()?.id ?? ''}/${newlandOpen() ? 'nl' : ''}/${homeWallsKey()}`
  let c = cachedMap(cacheKey)
  if (c) return c
  c = document.createElement('canvas')
  c.width = WIDTH * TILE
  c.height = HEIGHT * TILE
  const g = c.getContext('2d')!
  const lodging = housesNow().find(h=>h.id==='lodging')
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      // The inn supplies its complete exterior. Grass remains visible through
      // its transparent margins instead of the generic house wall underneath.
      if(lodging && x>=lodging.x0 && x<=lodging.x1 && y>=lodging.y0 && y<=lodging.y1){
        // 여관 그림 윗머리(빈 칸)를 지나는 새 터 길과 표식은 그대로 보인다 (2026-10-13)
        const lc = tileAt(x, y)
        const trail = lc === ',' || lc === '>'
        drawGround(g, trail ? lc : '.', x, y, season)
        if (lc === '>') drawObject(g, lc, x, y, season)
        continue
      }
      const ch = tileAt(x, y)
      drawGround(g, ch, x, y, season)
      drawHillMapTile(g,x,y,season,ch)
      drawObject(g, ch, x, y, season, ch === 'T' ? treeKind(x, y) : undefined)
    }
  // 집마다 지붕 하나
  for (const h of housesNow()) {
    if(h.id==='lodging')g.drawImage(paint('lodging/exterior',lodgingBuildingRows(),LODGING_PALETTE),h.x0*TILE,h.y0*TILE,96,128)
    else if(h.id==='home'){
      for(const part of homeRoofParts(h)){
        // 증축 지붕을 먼저, 본채 지붕과 처음 굴뚝을 맨 앞에 (2026-10-13 사용자 승인안)
        if(part.chimney)drawRoof(g,part.x0,part.y0,part.x1,part.y1,HOUSE_STYLES.home.roof)
        else{const art=homeAdditionArt(part);g.drawImage(paint(`home/wing/${part.x0}/${part.y0}/${part.y1}`,art.rows,art.palette),part.x0*TILE,part.y0*TILE)}
      }
    }
    else if(h.id==='library')drawLibraryExterior(g,h)
    else drawRoof(g, h.x0, h.y0, h.x1, h.y1 - 2, (HOUSE_STYLES[h.id] ?? PLAIN_STYLE).roof)
  }
  g.drawImage(paint('lodging/stairs',LODGING_STAIRS_ROWS,LODGING_PALETTE),LODGING_STAIRS.x*TILE,LODGING_STAIRS.y*TILE)
  // 집 안 가구: 바닥 것 → 큰 것 → 탁자 위 작은 것
  const layerRank = { floor: 0, solid: 1, small: 2, wall: 1 } as const
  for (const rm of ROOMS)
    for (const [dx, dy, item, flip] of [...rm.decor].sort((p, q) => layerRank[FURNITURE_DEFS[p[2]]?.layer ?? 'small'] - layerRank[FURNITURE_DEFS[q[2]]?.layer ?? 'small'])) {
      const a = FURNITURE_ART[item]
      if (!a) continue
      const x = rm.x0 + dx
      const y = rm.y0 + dy
      const mirrored = flip === 'flip'
      const rows = mirrored ? mirror(a.rows) : a.rows
      // 'half': 짝수 폭 가구를 홀수 폭 방 가운데에 (그림만 반 칸 오른쪽으로)
      const nudge = flip === 'half' ? TILE / 2 : 0
      g.drawImage(paint(`furni/${item}/${mirrored ? 'flip' : ''}`, rows, FURNI_PALETTE), x * TILE + nudge, y * TILE + (MAP[y][x] === 'n' ? -6 : 0))
    }
  const spouse = currentHomeLevel() >= 1 ? currentSpouseRoom() : null
  if (spouse) {
    const wall = ['wendell', 'marigold', 'tilly', 'postman'].includes(spouse.id) ? `${spouse.id}-wall` : spouse.id === 'cosmo' ? 'cosmo-keepsake' : null
    if (wall) g.drawImage(paint(`spouse-wall/${wall}`, SPOUSE_ROOM_ART[wall].rows, FURNI_PALETTE), (SPOUSE_ROOM.x0 + (spouse.id === 'cosmo' || spouse.window.x === 1 ? 4 : 1)) * TILE, SPOUSE_ROOM.y0 * TILE)
  }
  keepMap(cacheKey, c)
  return c
}

// ── 그날의 날씨가 땅에 남기는 것 (계획 15 작업 2) ──

const SNOW = '#f6f8fa'
const SNOW_SHADE = '#dfe7ee'
/** 풀밭 눈 더미 아래 그늘 — 겨울 풀빛(#dfe8dc)과 구별되게 조금 더 푸른 잿빛 */
const SNOW_DRIFT_SHADE = '#c8d5df'

/**
 * 눈 온 날 덮개 한 장 (집 단계·열린 문마다 한 번 굽는다): 지붕 윗줄과 굴뚝 머리, 풀밭이 길과 만나는 가장자리에 쌓인 눈,
 * 풀밭 군데군데 눈 뭉치, 늘푸른나무 머리·빈 가지 끝, 울타리·벤치·좌판 차양 위. 길은 밟혀서 거의 맨땅. 선은 모두 2픽셀 이상
 */
const snowCache = new Map<string, HTMLCanvasElement>()
function snowLayer(): HTMLCanvasElement {
  const cacheKey = `${currentHomeLevel()}/${openDoors().join(',')}/${newlandOpen() ? 'nl' : ''}`
  let c = snowCache.get(cacheKey)
  if (c) return c
  c = document.createElement('canvas')
  c.width = WIDTH * TILE
  c.height = VILLAGE_H * TILE
  const g = c.getContext('2d')!
  const f = (color: string, x: number, y: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(x, y, w, h)
  }
  const isPath = (ch: string) => ch === ',' || ch === 'm' || ch === 'A' || ch === 'P'
  const isGrassy = (ch: string) => '.*jTxoylvqO'.includes(ch)
  for (let y = 0; y < VILLAGE_H; y++)
    for (let x = 0; x < WIDTH; x++) {
      const ch = tileAt(x, y)
      const px = x * TILE
      const py = y * TILE
      if (isGrassy(ch)) {
        // 길과 만나는 가장자리에 쌓인 눈 (안쪽 끝은 들쭉날쭉)
        if (isPath(tileAt(x, y - 1))) {
          f(SNOW, px, py, TILE, 3)
          for (let i = 0; i < 4; i++) if (hash(x, y, 80 + i) < 0.5) f(SNOW, px + i * 4, py + 3, 4, 2)
        }
        if (isPath(tileAt(x, y + 1))) {
          f(SNOW, px, py + TILE - 3, TILE, 3)
          for (let i = 0; i < 4; i++) if (hash(x, y, 84 + i) < 0.5) f(SNOW, px + i * 4, py + TILE - 5, 4, 2)
        }
        if (isPath(tileAt(x - 1, y))) f(SNOW, px, py, 3, TILE)
        if (isPath(tileAt(x + 1, y))) f(SNOW, px + TILE - 3, py, 3, TILE)
        // 풀밭에 소복이 쌓인 눈 더미 (계획 15 작업 3): 겨울 풀이 이미 옅어서 흰 점만으론 맑은 날과 구별이 안 된다 —
        // 둥근 모서리 눈 더미 한두 개에 옅은 잿빛 하늘색 그늘을 아래로 받쳐 도톰해 보이게. 길에는 놓지 않는다
        // (지붕 바로 위 칸은 굴뚝이 솟아 있으니 빼고, 정자 지붕 아래도 뺀다)
        const roofed = x >= PAVILION_RECT.x0 && x <= PAVILION_RECT.x1 && y >= PAVILION_RECT.y0 && y <= PAVILION_RECT.y1
        if ((ch === '.' || ch === '*') && tileAt(x, y + 1) !== 'R' && !roofed)
          for (let i = 0; i < 2; i++) {
            if (hash(x, y, 102 + i) >= (i === 0 ? 0.75 : 0.35)) continue
            const w = 6 + 2 * Math.floor(hash(x, y, 104 + i) * 3)
            const h = 4 + 2 * Math.floor(hash(x, y, 106 + i) * 2)
            const bx = px + 2 * Math.floor(hash(x, y, 108 + i) * ((TILE - w) / 2 + 1))
            const by = py + 2 * Math.floor(hash(x, y, 110 + i) * ((TILE - h - 2) / 2 + 1))
            f(SNOW_DRIFT_SHADE, bx + 2, by + h, w - 4, 2)
            // 위는 좁고 아래는 넓은 둔덕 모양
            f(SNOW, bx + 2, by, w - 4, 2)
            f(SNOW, bx, by + 2, w, h - 2)
          }
        // 풀밭 군데군데 눈 뭉치 (빈 풀 칸에만)
        if (ch === '.' && !roofed)
          for (let i = 0; i < 3; i++) {
            const sx = 1 + Math.floor(hash(x, y, 90 + i) * 12)
            const sy = 1 + Math.floor(hash(x, y, 93 + i) * 12)
            f(SNOW, px + sx, py + sy, i === 0 ? 4 : 2, 2)
          }
      } else if (ch === ',' && hash(x, y, 96) < 0.35) {
        // 밟힌 길: 가장자리에 남은 눈 몇 점
        f('rgba(246,248,250,0.7)', px + 2 + Math.floor(hash(x, y, 97) * 10), py + 2 + Math.floor(hash(x, y, 98) * 10), 2, 2)
      }
      // 물건 위에 쌓인 눈
      if (ch === 'T') {
        if (treeKind(x, y) === 'evergreen') {
          f(SNOW, px + 5, py + 1, 6, 2)
          f(SNOW, px + 3, py + 3, 3, 2)
          f(SNOW, px + 10, py + 3, 3, 2)
        } else {
          f(SNOW, px + 3, py + 2, 2, 2)
          f(SNOW, px + 11, py + 1, 2, 2)
          f(SNOW, px + 6, py + 0, 2, 2)
          f(SNOW, px + 5, py + 6, 2, 2)
        }
      } else if (ch === 'o') f(SNOW, px + 5, py + 2, 6, 2)
      else if (ch === 'x') f(SNOW, px, py + 3, 16, 2)
      else if (ch === 'B') f(SNOW, px + 1, py + 5, 14, 2)
      else if (ch === 'm') f(SNOW, px, py, 16, 2)
      else if (ch === 'v') f(SNOW, px, py + 5, 16, 2)
    }
  // 지붕: 용마루를 덮는 윗줄 눈과 처마 쪽으로 늘어진 끝, 굴뚝 머리
  for (const house of housesNow()) for(const h of house.id==='home'?homeRoofParts(house):[{...house,y1:house.y1-2,chimney:true}]) {
    if(house.id==='home'&&!h.chimney){
      g.drawImage(paint(`home/wing-snow/${h.x0}/${h.y0}/${h.y1}`,homeAdditionSnowRows(h),homeAdditionArt(h).palette),h.x0*TILE,h.y0*TILE)
      continue
    }
    const ox = h.x0 * TILE
    const oy = h.y0 * TILE
    const w = (h.x1 - h.x0 + 1) * TILE
    const rh = (h.y1 - h.y0 + 1) * TILE
    for (let i = 0; i < w / 4; i++) {
      const d = hash(h.x0 + i, h.y0, 99)
      if (d < 0.55) f(SNOW_SHADE, ox + i * 4, oy + 6, 4, d < 0.25 ? 6 : 4)
      if (d < 0.55) f(SNOW, ox + i * 4, oy + 6, 4, d < 0.25 ? 4 : 2)
    }
    f(SNOW, ox, oy, w, 6)
    // 기와 띠마다 얇게 남은 눈
    for (let y = 16; y < rh - 4; y += 8) for (let i = 0; i < w / 8; i++) if (hash(h.x0 + i, h.y0 + y, 100) < 0.4) f('rgba(246,248,250,0.85)', ox + i * 8 + 2, oy + y, 6, 2)
    const cx = ox + chimneyX(h.x0, h.x1)
    if(h.chimney)f(SNOW, cx - 2, oy - 10, 12, 2)
  }
  snowCache.set(cacheKey, c)
  return c
}

/** 호숫가 정자 지붕 윗판에 쌓인 눈 (정자는 decor에서 지도 위에 덧그리므로 그 뒤에 그린다) */
function drawPavilionSnow(g: Ctx) {
  const { x0, y0, x1 } = PAVILION_RECT
  const left = x0 * TILE
  const top = y0 * TILE
  const w = (x1 - x0 + 1) * TILE
  g.fillStyle = SNOW_SHADE
  g.fillRect(left + 6, top - 9, w - 12, 3)
  g.fillStyle = SNOW
  g.fillRect(left + 6, top - 12, w - 12, 4)
  // 아랫판 처마 끝에 군데군데 남은 눈 (분홍 기와가 보이게 조금만)
  for (let i = 0; i < (w - 4) / 6; i++) if (hash(x0 + i, y0, 101) < 0.5) g.fillRect(left + 2 + i * 6, top - 6, 4, 2)
}

/** 물웅덩이가 생길 수 있는 흙길 자리 (지도에서 한 번 고른다) — 그날그날 이 중 절반이 안 되게 */
const PUDDLE_SPOTS: readonly Tile[] = (() => {
  const out: Tile[] = []
  for (let y = 1; y < VILLAGE_H - 1; y++)
    for (let x = 1; x < WIDTH - 1; x++) if (MAP[y][x] === ',' && hash(x, y, 131) < 0.045) out.push({ x, y })
  return out
})()

/** 비 온 뒤 흙길의 물웅덩이: 젖은 흙 테두리, 하늘빛 물, 빛 한 점 (비가 오는 중이면 빗방울 동그라미가 번진다) */
function drawPuddles(g: Ctx, day: number, raining: boolean, t: number) {
  for (const p of PUDDLE_SPOTS) {
    // 그날 고른 자리의 3분의 1쯤만 (광장 한 화면에 너덧 개)
    if (hash(p.x, p.y, day) >= 0.35) continue
    const big = hash(p.x, p.y, 134) < 0.5
    const w = big ? 12 : 8
    // 칸 밖으로 넘치지 않게 (테두리까지 w + 4)
    const px = p.x * TILE + 2 * Math.floor(hash(p.x, p.y, 132) * ((TILE - w - 4) / 2 + 1))
    const py = p.y * TILE + 2 * Math.floor(hash(p.x, p.y, 133) * 2)
    // 젖은 흙 테두리 2픽셀, 모서리는 깎아 둥글게
    g.fillStyle = '#d9bd8c'
    g.fillRect(px, py + 6, w + 4, 4)
    g.fillRect(px + 2, py + 4, w, 8)
    g.fillStyle = '#a9cad0'
    g.fillRect(px + 2, py + 6, w, 4)
    g.fillStyle = '#d6eaee'
    g.fillRect(px + 4, py + 6, 2, 2)
    if (raining && (t * 1.3 + hash(p.x, p.y, 135)) % 1 < 0.35) {
      g.fillStyle = 'rgba(232,244,246,0.9)'
      const rx = px + 2 + 2 * Math.floor(hash(p.x, p.y, Math.floor(t * 1.3)) * (w / 2))
      g.fillRect(rx, py + 8, 2, 2)
    }
  }
}

/** 추운 아침 호숫가 물가 한 줄 살얼음 (호수 첫 줄 위쪽 가장자리) — 8시부터 9시까지 천천히 녹는다 */
function drawShoreIce(g: Ctx, minute: number, locked: ReadonlySet<string>) {
  const a = minute < 8 * 60 ? 1 : Math.max(0, (9 * 60 - minute) / 60)
  if (a <= 0) return
  const y = 34
  for (let x = 1; x < WIDTH - 1; x++) {
    // 물 칸만 — 아직 열리지 않아 물로 덮어 그린 잔교 칸도 물로 친다
    if (tileAt(x, y) !== '~' && !(tileAt(x, y) === '=' && locked.has(`${x},${y}`))) continue
    g.fillStyle = `rgba(226, 241, 244, ${0.9 * a})`
    g.fillRect(x * TILE, y * TILE, TILE, 4)
    // 안쪽 끝은 들쭉날쭉 (4픽셀 토막마다 한 줄 더 얼거나 그늘만)
    for (let i = 0; i < 4; i++) {
      const more = hash(x, y, 136 + i) < 0.5
      g.fillStyle = more ? `rgba(226, 241, 244, ${0.9 * a})` : `rgba(196, 224, 230, ${0.8 * a})`
      g.fillRect(x * TILE + i * 4, y * TILE + 4, 4, 2)
      if (more) {
        g.fillStyle = `rgba(196, 224, 230, ${0.8 * a})`
        g.fillRect(x * TILE + i * 4, y * TILE + 6, 4, 2)
      }
    }
    g.fillStyle = `rgba(255, 255, 255, ${a})`
    g.fillRect(x * TILE + 2 + Math.floor(hash(x, y, 140) * 9), y * TILE + 1, 4, 2)
  }
}

/** 여름 맑은 날 호수 물빛: 반짝이는 하이라이트 몇 점이 켜졌다 꺼진다 */
function drawLakeGlints(g: Ctx, t: number) {
  for (let i = 0; i < 40; i++) {
    const ph = (t * 0.6 + hash(i, 7, 141)) % 1
    if (ph > 0.45) continue
    const cyc = Math.floor(t * 0.6 + hash(i, 7, 141))
    const x = 1 + Math.floor(hash(i, cyc, 142) * (WIDTH - 2))
    const y = 35 + Math.floor(hash(i, cyc, 143) * (VILLAGE_H - 37))
    if (tileAt(x, y) !== '~') continue
    g.fillStyle = ph < 0.15 || ph > 0.3 ? 'rgba(236, 250, 252, 0.6)' : 'rgba(255, 255, 255, 0.95)'
    g.fillRect(x * TILE + Math.floor(hash(i, cyc, 144) * 10), y * TILE + Math.floor(hash(i, cyc, 145) * 12), ph < 0.15 || ph > 0.3 ? 2 : 4, 2)
  }
}

/**
 * 굴뚝 연기: 굴뚝 머리에서 연한 잿빛 덩이가 피어올라 옆으로 흩어진다.
 * 겨울엔 집집마다 크고 많이, 밥 짓는 때엔 몇 집만 조금. 바람 부는 날엔 더 옆으로 눕는다
 */
function drawChimneySmoke(g: Ctx, game: GameState, kind: 'meal' | 'winter', windy: boolean, t: number) {
  const closed = closedHouseIds(game)
  const n = kind === 'winter' ? 7 : 3
  for (const h of housesNow()) {
    if (closed.includes(h.id)) continue
    if (kind === 'meal' && hash(h.x0, h.y0, 150) >= 0.5) continue
    const chimneyLeft=h.id==='home'?HOUSE_RECT.x0:h.x0
    const chimneyRight=h.id==='home'?HOUSE_RECT.x1:h.x1
    const cx = chimneyLeft * TILE + chimneyX(chimneyLeft, chimneyRight)+3
    const cy = (h.id==='home'?HOUSE_RECT.y0:h.y0) * TILE - 10
    const seed = hash(h.x0, h.y0, 151)
    for (let i = 0; i < n; i++) {
      const ph = (t * 0.32 + seed + i / n) % 1
      const size = (kind === 'winter' ? 4 : 2) + Math.floor(ph * (kind === 'winter' ? 4 : 3))
      // 처음엔 곧게 오르다 위로 갈수록 휘고 흔들린다 (곧은 계단 기둥처럼 보이지 않게)
      const drift = ph * ph * (windy ? 24 : 10) + Math.sin(t * 1.1 + ph * 5 + seed * 6) * (0.5 + ph * 3)
      // 눈 덮인 풀밭·흰 지붕 위에서도 보이게 옅은 잿빛 보라 (흰색이면 눈에 묻힌다)
      g.fillStyle = `rgba(196, 190, 198, ${(kind === 'winter' ? 0.85 : 0.6) * (1 - ph * 0.8)})`
      g.fillRect(Math.round(cx + drift - size / 2), Math.round(cy - ph * (kind === 'winter' ? 30 : 18) - size / 2), size, size)
    }
  }
}

/** 키는 모두 몇 가지 값의 조합이라 늘어나지 않지만(옷차림 바꾸기만 조합이 는다), 혹시 몰라 넘치면 비운다 */
const SPRITE_CACHE_MAX = 800
const spriteCache = new Map<string, HTMLCanvasElement>()
function paint(keyStr: string, rows: SpriteRows, palette: Record<string, string>): HTMLCanvasElement {
  let c = spriteCache.get(keyStr)
  if (c) return c
  c = document.createElement('canvas')
  c.width = Math.max(...rows.map((r) => r.length))
  c.height = rows.length
  const g = c.getContext('2d')!
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const col = palette[ch]
      if (ch === '.' || !col) return
      g.fillStyle = col
      g.fillRect(x, y, 1, 1)
    }),
  )
  if (spriteCache.size >= SPRITE_CACHE_MAX) spriteCache.clear()
  spriteCache.set(keyStr, c)
  return c
}

/** 가방 아이콘 (UI에서도 쓴다) */
export function iconCanvas(id: string): HTMLCanvasElement | null {
  const rows = ICONS[id]
  return rows ? paint(`icon/${id}`, rows, ICON_PALETTE) : null
}

/** 머리 위 작은 풍선 — 몸과 일상의 표정만 (exclusion-list §1-3) */
function bubble(g: Ctx, cx: number, top: number, draw: (x: number, y: number) => void) {
  const x = Math.round(cx - 5)
  const y = Math.round(top - 10)
  g.fillStyle = '#492c1b'
  g.fillRect(x - 1, y - 1, 12, 10)
  g.fillStyle = '#fffaf0'
  g.fillRect(x, y, 10, 8)
  g.fillRect(x + 3, y + 8, 2, 2)
  g.fillStyle = '#492c1b'
  draw(x, y)
}

type EmoteId = 'z' | 'note' | 'yawn' | 'talk' | 'heart' | 'sweat' | 'hungry' | 'shiver' | 'letter' | 'laugh' | 'angry' | 'call'

/**
 * 나에게 할 말이 있는 이웃 (건넬 조각·기다리던 이야기·부탁): 이웃끼리 나누는 회색 말풍선(talk)과 다르게
 * 주황 테두리·크림 바탕·주황 점 셋 (2026-10-13 사용자: 둘이 같은 모양이었다)
 */
const CALL_ROWS = [
  '.oooooooooo.',
  'oyyyyyyyyyyo',
  'oyyyyyyyyyyo',
  'oyyOyyOyyOyo',
  'oyyOyyOyyOyo',
  'oyyyyyyyyyyo',
  '.oooooooooo.',
  '...oo.......',
  '..o.........',
]
const CALL_PALETTE: Record<string, string> = { o: '#c8663a', y: '#fff3d6', O: '#d9773f' }

function emote(g: Ctx, id: EmoteId, cx: number, top: number) {
  if (id === 'call') {
    g.drawImage(paint('emote/call', CALL_ROWS, CALL_PALETTE), Math.round(cx - 6), Math.round(top - 13))
    return
  }
  if ((MEETING_EMOTES as readonly string[]).includes(id)) {
    g.drawImage(paint(`meeting/${id}`, meetingEmoteRows(id as MeetingEmote), MEETING_PALETTE), Math.round(cx - 6), Math.round(top - 13))
    return
  }
  bubble(g, cx, top, (x, y) => {
    const f = (dx: number, dy: number, w = 1, h = 1, col = '#492c1b') => {
      g.fillStyle = col
      g.fillRect(x + dx, y + dy, w, h)
    }
    switch (id) {
      case 'z':
        f(3, 2, 4)
        f(5, 3)
        f(4, 4)
        f(3, 5, 4)
        break
      case 'note':
        f(5, 1, 1, 5)
        f(6, 1, 2)
        f(3, 5, 3, 2)
        break
      case 'yawn':
        f(3, 2, 4)
        f(3, 5, 4)
        f(2, 3, 1, 2)
        f(7, 3, 1, 2)
        break
      case 'hungry':
        f(2, 4, 6, 3, '#b17640')
        f(3, 3, 4, 1, '#e4cf87')
        break
      case 'shiver':
        f(1, 2, 1, 4, '#79a9d8')
        f(8, 2, 1, 4, '#79a9d8')
        f(4, 3, 2, 2, '#79a9d8')
        break
      case 'letter':
        // 안 읽은 편지: 흰 봉투에 붉은 봉인
        f(1, 2, 8, 5, '#fff7e5')
        f(1, 2, 8, 1)
        f(1, 6, 8, 1)
        f(1, 2, 1, 5)
        f(8, 2, 1, 5)
        f(2, 3, 2, 1)
        f(6, 3, 2, 1)
        f(4, 4, 2, 1, '#c0392b')
        break
    }
  })
}

// ── 자식들의 나들이 (2026-10-13 사용자): 어른 이웃처럼 마을을 돌아다닌다 — 그림만, 엔진 상태는 바꾸지 않는다 ──
const KID_SLOT = 30
/** 걸어가는 빠르기: 게임 1분에 한 칸 */
const KID_PACE = 1
const kidRoutes = new Map<string, Tile[] | null>()
function kidSpots(neighbors: readonly NeighborDef[]): Tile[] {
  const doors = neighbors.map((d) => ({ x: d.door.x, y: d.door.y + 1 }))
  return [{ x: 24, y: 22 }, PLACES.well.stand!, PLACES.hill.stand!, PLACES.bench.stand!, { x: 21, y: 33 }, ...doors]
}
let kidSpotCache: Tile[] | null = null
function kidDest(id: string, def: NeighborDef, neighbors: readonly NeighborDef[], seed: number, day: number, slot: number): Tile {
  if (slot < 0) return { x: def.door.x, y: def.door.y + 1 }
  const spots = (kidSpotCache ??= kidSpots(neighbors))
  const h = [...`${id}|${day}|${slot}`].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7)
  const anchor = spots[Math.abs(h) % spots.length]
  const taken = new Set<string>()
  let at = wanderGoal(id, anchor, seed, day, slot * KID_SLOT, new Set(), taken)
  for (let k = 0; k < 6 && houseAt(at.x, at.y); k++) {
    taken.add(key(at))
    at = wanderGoal(id, anchor, seed, day, slot * KID_SLOT, new Set(), taken)
  }
  return houseAt(at.x, at.y) ? anchor : at
}
export function kidWalk(id: string, def: NeighborDef, neighbors: readonly NeighborDef[], seed: number, day: number, minute: number): { x: number; y: number; moving: boolean; facing: Facing; walkTime: number } {
  const slot = Math.floor(minute / KID_SLOT)
  const from = kidDest(id, def, neighbors, seed, day, slot - 1)
  const to = kidDest(id, def, neighbors, seed, day, slot)
  const ck = `${id}|${day}|${slot}`
  let path = kidRoutes.get(ck)
  if (path === undefined) {
    if (kidRoutes.size > 400) kidRoutes.clear()
    path = route(from, to)
    kidRoutes.set(ck, path)
  }
  const steps = path ?? []
  const walked = (minute - slot * KID_SLOT) * KID_PACE
  if (!steps.length || walked >= steps.length) return { ...to, moving: false, facing: 'down', walkTime: 0 }
  const i = Math.floor(walked)
  const a = i === 0 ? from : steps[i - 1]
  const b = steps[i]
  const f = walked - i
  const facing: Facing = b.x > a.x ? 'right' : b.x < a.x ? 'left' : b.y < a.y ? 'up' : 'down'
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, moving: true, facing, walkTime: walked }
}

/** 이웃 그림: 연애 후보(계획 6)는 주인공 모양 고르기와 같은 머리·옷으로, 나머지는 이웃마다 정한 옷으로 */
function neighborPerson(def: NeighborDef, facing: Facing, frame: 0 | 1 | 2, blink: boolean, season: Season, growth?: number, dressed?: Avatar, elder = false, heir?: FullAvatar | null) {
  const { who, extra } = neighborLook(def, growth, dressed, elder, heir)
  return person(who, facing, frame, blink, 'stand', season, extra)
}

/** 아이 요람 (계획 12): 나무 요람, 크림색 이불 */

/**
 * 마을 지도 (설정 → 마을 지도): 마을 전체를 한 장으로 — 붙박이 그림(mapFor)에서 마을 부분만 잘라 그리고,
 * 아직 열리지 않은 구역은 덤불로 덮고, 기록자 자리에 표시를 둔다. 캔버스 크기는 WIDTH×VILLAGE_H 칸
 */
export function drawVillageMap(g: Ctx, game: GameState): void {
  const season = seasonOf(game.clock.day)
  g.imageSmoothingEnabled = false
  // 새 터에서 마을 지도를 열어도 첫 마을 칸으로 그린다 (지도 그림은 지금 지도가 아니라 첫 마을의 것)
  const was = currentMapId()
  setActiveMap('village')
  try {
    g.drawImage(mapFor(season), 0, 0, WIDTH * TILE, VILLAGE_H * TILE, 0, 0, WIDTH * TILE, VILLAGE_H * TILE)
    coverLocked(g, game, season)
    // 주민이 함께 지은 공동 시설도 마을 그림에 남는다 (계획 16 작업 20)
    drawVillage(g, game)
  } finally {
    setActiveMap(was)
  }
}

/**
 * 아직 열리지 않은 곳을 덤불로 덮는다: 서고 권수로 열리는 구역(물만 보이고 잔교·배도 덮는다),
 * 그리고 아직 이사 오지 않은 이웃의 집 (2026-09-30 사용자 — 열리기 전엔 보이지 않게)
 */
function coverLocked(g: Ctx, game: GameState, season: Season) {
  for (const z of lockedZones(villageBookCount(game)))
    for (let y = z.y0; y <= z.y1; y++)
      for (let x = z.x0; x <= z.x1; x++) {
        const c = tileAt(x, y)
        // 잔교·배는 물로 덮어 아직 없는 것처럼 (같은 줄 옆 물 칸을 그대로 옮겨 그린다)
        if (c === '=' || c === 'u') g.drawImage(mapFor(season), (z.x0 - 1) * TILE, y * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE)
        else if (c !== '~') drawBush(g, x, y, season)
      }
  const closed = closedHouseIds(game)
  for (const h of housesNow().filter((h) => closed.includes(h.id)))
    for (let y = h.y0 - 1; y <= h.y1; y++)
      for (let x = h.x0; x <= h.x1; x++) if (y >= h.y0 || tileAt(x, y) === '.') drawBush(g, x, y, season)
}

/** 이웃 수첩에 붙이는 앞모습 한 장 */
export function neighborPortrait(def: NeighborDef, season: Season, elder = false, heir?: FullAvatar | null) {
  return neighborPerson(def, 'down', 0, false, season, undefined, undefined, elder, heir)
}

/** 아이의 키와 나이를 반영한 가계도 초상화. */
export function genPortrait(p: GenPerson, season: Season) {
  const avatar = genAvatar(p)
  return person('writer', 'down', 0, false, 'stand', season, {
    avatar, look: avatar.look, elder: p.stage === 'elder',
    short: p.stage === 'child' ? 1 : p.stage === 'teen' ? 2 : undefined,
  })
}

function drawSprite(g: Ctx, c: HTMLCanvasElement, wx: number, wy: number, dy = 0, shadow = true) {
  // 발이 칸 아래쪽에 닿도록, 가운데 맞춤
  const px = Math.round(wx * TILE + (TILE - c.width) / 2)
  const py = Math.round(wy * TILE + TILE - 1 - c.height - dy)
  if (shadow) {
    g.fillStyle = C.shadow
    g.fillRect(px + 1, Math.round(wy * TILE) + 13, c.width - 2, 2)
  }
  g.drawImage(c, px, py)
}

type PersonExtra = { inky?: boolean; growth?: number; look?: Look; avatar?: FullAvatar; short?: number; elder?: boolean }
/** 사람 그림 캐시 키의 외형 부분 (계절·잉크·키·모습) */
function lookKey(who: Who, season: Season, extra: PersonExtra): string {
  return `${who === 'writer' ? season : season === 'winter' ? 'w' : ''}/${extra.inky ?? ''}/${extra.growth ?? ''}/${extra.short ?? ''}/${extra.look ?? ''}/${extra.elder ?? ''}/${extra.avatar ? avatarKey(extra.avatar) : ''}`
}

function person(who: Who, facing: Facing, frame: 0 | 1 | 2, blink: boolean, pose: Pose, season: Season, extra: PersonExtra = {}) {
  const rows = spriteRows(who, facing, { frame, blink, pose, season, ...extra })
  const pal = who === 'writer' ? writerPalette(season, extra.avatar) : PALETTE
  return paint(`${who}/${facing}/${frame}/${blink}/${pose}/${lookKey(who, season, extra)}`, rows, pal)
}

// ── 가구 쓰는 동작 (계획 17 작업 3) ──

/** 24×24 동작 한 장: 뒤 소품 → 사람 → 앞 소품 순으로 겹쳐 한 번만 칠해 둔다 (사람은 지금 외형의 팔레트, 소품은 소품 팔레트) */
const motionCache = new Map<string, HTMLCanvasElement>()
function motionCanvas(keyStr: string, layers: { actor: string[]; propBack: string[]; propFront: string[] }, actorPal: Record<string, string>, propPal: Record<string, string>): HTMLCanvasElement {
  let c = motionCache.get(keyStr)
  if (c) return c
  c = document.createElement('canvas')
  c.width = USE_SIZE
  c.height = USE_SIZE
  const g = c.getContext('2d')!
  for (const [rows, pal] of [[layers.propBack, propPal], [layers.actor, actorPal], [layers.propFront, propPal]] as const)
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const col = pal[ch]
        if (ch === '.' || !col) return
        g.fillStyle = col
        g.fillRect(x, y, 1, 1)
      }),
    )
  if (motionCache.size >= SPRITE_CACHE_MAX) motionCache.clear()
  motionCache.set(keyStr, c)
  return c
}

/** 되풀이 동작의 몇째 박자인지: USE_INFO의 프레임 시간(ms)을 차례로 쌓아 돈다 */
function usePhase(action: UseAction, ms: number): number {
  const d = USE_INFO[action].durations
  let m = ms % d.reduce((a, b) => a + b, 0)
  for (let i = 0; i < d.length; i++) {
    if (m < d[i]) return i
    m -= d[i]
  }
  return 0
}

/** 일어나기(단발) 네 박자 길이 — extraUseFrame의 단발 동작은 한 박자 180ms */
const RISE_SECONDS = 0.72

/** 동작 한 장. 사용 동작은 furnitureUseFrame, 일어나기는 누운 채 있다가 마지막에 extraUseFrame('rise') 한 번 */
function useFrameCanvas(who: Who, facing: Facing, kind: ActKind, elapsed: number, total: number, blink: boolean, season: Season, extra: PersonExtra, standing = false): HTMLCanvasElement {
  const opts = { frame: 0 as const, blink, season, ...extra }
  const actorPal = who === 'writer' ? writerPalette(season, extra.avatar) : PALETTE
  const look = lookKey(who, season, extra)
  // 생일 빵 촛불 불기 (계획 17 작업 5): 한 번 — 마지막 장(꺼진 초)에서 멈춘다
  if (kind === 'blowCandle') {
    const f = Math.min(3, Math.floor(elapsed / (total / 4)))
    return motionCanvas(`ev/candle/${who}/${facing}/${f}/${blink}/${look}`, eventMotionFrame(who, facing, 'blowCandle', f, opts), actorPal, FURNI_PALETTE)
  }
  if (kind === 'rise' && elapsed >= total - RISE_SECONDS) {
    const f = Math.min(3, Math.floor((elapsed - (total - RISE_SECONDS)) / (RISE_SECONDS / 4)))
    const action: ExtraAction = 'rise'
    return motionCanvas(`xuse/${who}/${facing}/${action}/${f}/${blink}/${look}`, extraUseFrame(who, facing, action, f, opts), actorPal, FURNI_PALETTE)
  }
  // 요리 손동작 (cookingFrame): 순서대로 한 동작씩, 한 동작 안에서는 네 박자를 돌린다 — steps는 drawPlayerAct가 넘긴다
  if (kind === 'cook') {
    const steps = (cookSteps.length ? cookSteps : ['knead']) as CookAction[]
    const per = total / steps.length
    const step = steps[Math.min(steps.length - 1, Math.floor(elapsed / per))]
    const f = Math.floor((elapsed % per) / (per / 4)) % 4
    return motionCanvas(`cook/${who}/${facing}/${step}/${f}/${blink}/${look}`, cookingFrame(who, facing, step, f, opts), actorPal, FURNI_PALETTE)
  }
  // 배우자와 저녁 (2026-10-07): 둘러앉아 먹는 손동작 (familyFrame familyMeal), 네 박자를 돌린다
  if (kind === 'meal') {
    const f = Math.floor(elapsed * 3) % 4
    return motionCanvas(`fam/${who}/familyMeal/${facing}/${f}/adult/${blink}/${look}`, familyFrame(who, facing, 'familyMeal', f, 'adult', opts), actorPal, FURNI_PALETTE)
  }
  if (kind === 'eat') {
    let remaining = elapsed * 1000, f = 0
    while (f < EAT_DURATIONS.length - 1 && remaining >= EAT_DURATIONS[f]) remaining -= EAT_DURATIONS[f++]
    return motionCanvas(`eat/${who}/${facing}/bread/${f}/${blink}/${look}`, eatingFrame(who,facing,f,opts), actorPal, FURNI_PALETTE)
  }
  // use(생활 가구)는 drawAdditionUse가 따로 그린다 — 여기 오면 손 뻗기로
  const action: UseAction = kind === 'rise' ? 'lie' : kind === 'use' || kind === 'baby' ? 'reach' : kind
  const phase = usePhase(action, elapsed * 1000)
  return motionCanvas(`use/${who}/${facing}/${action}/${phase}/${blink}/${look}/${standing}`, furnitureUseFrame(who, facing, action, phase, opts, true, standing), actorPal, USE_PROP_PALETTE)
}

/**
 * 동작 그림을 서 있는 그림과 같은 자리에: 동작 캔버스 안의 사람은 (7, 4)에서 시작하므로 서 있는 그림의 왼쪽 위에서 그만큼 뺀다.
 * 누운 몸이 아니면 서 있을 때처럼 발밑 그림자
 */
function drawUse(g: Ctx, c: HTMLCanvasElement, stand: HTMLCanvasElement, wx: number, wy: number, shadow: boolean) {
  const px = Math.round(wx * TILE + (TILE - stand.width) / 2)
  const py = Math.round(wy * TILE + TILE - 1 - stand.height)
  if (shadow) {
    g.fillStyle = C.shadow
    g.fillRect(px + 1, Math.round(wy * TILE) + 13, stand.width - 2, 2)
  }
  g.drawImage(c, px - 7, py - 4)
}

/** 행사 동작 한 장 (계획 17 작업 4·5): 결혼식은 weddingActorFrame, 그 밖은 eventMotionFrame — 지금 외형으로 */
function eventFrameCanvas(who: Who, m: EventMotion, blink: boolean, season: Season, extra: PersonExtra): HTMLCanvasElement {
  const opts = { frame: 0 as const, blink, season, ...extra }
  const actorPal = who === 'writer' ? writerPalette(season, extra.avatar) : PALETTE
  const keyStr = `ev/${m.set}/${who}/${m.facing}/${m.action}/${m.prop??''}/${m.frame}/${blink}/${lookKey(who, season, extra)}`
  const gathering = gatheringActionFor(m)
  const layers = gathering ? gatheringMotionFrame(who,m.facing,gathering,[0,1,2,3,3,2,1,0][m.frame % 8],opts) : m.set === 'social' ? socialMotionFrame(who,m.facing,m.action as SocialAction,m.prop,m.frame,opts) : m.set === 'wedding' ? weddingActorFrame(who, m.facing, m.action as WeddingAction, m.frame, opts) : eventMotionFrame(who, m.facing, m.action as EventAction, m.frame, opts)
  return motionCanvas(keyStr, layers, actorPal, FURNI_PALETTE)
}

/** 행사 동작을 서 있는 그림 자리에 */
function drawEventMotion(g: Ctx, who: Who, m: EventMotion, wx: number, wy: number, blink: boolean, season: Season, extra: PersonExtra) {
  const stand = person(who, m.facing, 0, false, 'stand', season, extra)
  drawUse(g, eventFrameCanvas(who, m, blink, season, extra), stand, wx+(m.offset?.x??0), wy+(m.offset?.y??0), true)
}

/** 모임 창에서도 실제 외형·연결된 동작을 같은 렌더 함수로 보여 준다. */
export function drawGroupPreview(g:Ctx,game:GameState,content:GameContent,id:string,t:number) {
 g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false
 g.fillStyle='#f4e0c0';g.fillRect(0,0,128,40)
 g.fillStyle='#f0d8b0';g.fillRect(0,33,128,7)
 const a=game.plans.appts.find(a=>a.id===id)
 const members=a?.startedWith??a?.members??Object.entries(FESTIVAL_SPOTS).filter(([id,spot])=>{const n=game.npcs[id];return n?.visible&&Math.abs(Math.round(n.x)-spot.x)+Math.abs(Math.round(n.y)-spot.y)<=2}).map(([id])=>id)
 const f=game.fests.find(f=>f.id===id||f.apptId===id)
 const target=(f?.task??game.clubSessions[id]?.task)?.choice
 const shown=target&&members.includes(target)?[target,...members.filter(n=>n!==target)]:members
 const ids=['player',...shown.slice(0,3)]
 const season=seasonOf(game.clock.day)
 for(const [i,npc] of ids.entries()) {
  const def=content.neighbors.find(d=>d.id===npc)
  const look=npc==='player'?{who:'writer' as Who,extra:{avatar:game.avatar?withLookDefaults(game.avatar):undefined,look:game.avatar?.look}}:def?neighborLook(def,undefined,game.looks?.[npc]):null
  if(!look)continue
  const motion=npc==='player'?playerEventMotion(game,t):npcEventMotion(game,npc,t)
  const facing=i===0?'right':'left'
  if(motion)drawEventMotion(g,look.who,{...motion,facing,offset:undefined},.25+i*2,1.3,isBlinking(t+i),season,look.extra)
  else drawSprite(g,person(look.who,facing,0,isBlinking(t+i),'stand',season,look.extra),.25+i*2,1.3,0)
 }
}

/**
 * 가족 동작 한 장 (generation-art familyFrame — 견습 손일·아기 달래기·함께 읽기·식사 등, 2026-10-07 연결).
 * 함께 읽기는 가구 쓰는 동작 팔레트, 나머지는 행사·생활 동작 팔레트
 */
/** 이사 가는 이웃의 길 (문 앞 → 우물 마당) — 집마다 한 번 셈해 둔다 */
const leavingWays = new Map<string, Tile[]>()
function leavingWay(id: string, from: Tile): Tile[] {
  let w = leavingWays.get(id)
  if (!w) {
    const well = PLACES.well.stand!
    w = [from, ...(route(from, well) ?? [{ x: from.x, y: from.y + 1 }])]
    leavingWays.set(id, w)
  }
  return w
}

function drawFamily(g: Ctx, action: FamilyAction, facing: Facing, frame: number, stage: Exclude<GenerationStage, 'baby'>, wx: number, wy: number, blink: boolean, season: Season, extra: PersonExtra, who: Who = 'writer') {
  const opts = { frame: 0 as const, blink, season, ...extra }
  const actorPal = who === 'writer' ? writerPalette(season, extra.avatar) : PALETTE
  const keyStr = `fam/${who}/${action}/${facing}/${frame}/${stage}/${blink}/${lookKey(who, season, extra)}`
  const layers = familyFrame(who, facing, action, frame, stage, opts)
  const stand = person(who, facing, 0, false, 'stand', season, extra)
  drawUse(g, motionCanvas(keyStr, layers, actorPal, action === 'readTogether' ? USE_PROP_PALETTE : FURNI_PALETTE), stand, wx, wy, true)
}

/** 기록자의 지금 동작 (앉는 자리가 있으면 그 칸 위에서) */
function drawPlayerAct(g: Ctx, act: PlayerAct, p: { x: number; y: number }, blink: boolean, season: Season, extra: PersonExtra) {
  const at = act.at ?? p
  const stand = person('writer', act.facing, 0, false, 'stand', season, extra)
  if (act.kind === 'eat') {
    let elapsed = (act.total - act.left) * 1000, frame = 0
    while (frame < EAT_DURATIONS.length - 1 && elapsed >= EAT_DURATIONS[frame]) elapsed -= EAT_DURATIONS[frame++]
    const food = eatFoodFor(act.food ?? 'bread'), opts = { frame:0 as const,blink,season,...extra }
    const canvas = motionCanvas(`eat/writer/${act.facing}/${food}/${frame}/${blink}/${lookKey('writer',season,extra)}`, eatingFrame('writer',act.facing,frame,opts,food),writerPalette(season,extra.avatar),FURNI_PALETTE)
    drawUse(g,canvas,stand,at.x,at.y,true)
    return
  }
  if (act.kind === 'use' && act.use && act.spot) {
    drawAdditionUse(g, act, blink, season, extra)
    return
  }
  if (act.kind === 'baby' && act.use && act.spot) {
    drawBabyCare(g, act, p, blink, season, extra)
    return
  }
  cookSteps = act.steps ?? []
  const c = useFrameCanvas('writer', act.facing, act.kind, act.total - act.left, act.total, blink, season, extra, act.standing)
  drawUse(g, c, stand, at.x, at.y, act.kind !== 'rise')
}

/** 생활 가구 색: 가구 팔레트 + 바닥 그림자(z) — 도트 미리보기와 같다 */
const ADDITION_PALETTE: Record<string, string> = { ...FURNI_PALETTE, z: '#d1c4ae' }

/**
 * 생활 가구 사용 장면 (2026-10-12 도트: addition-furniture-motion — 흔들기·재봉·반죽·세수·하프·그림·설거지·맷돌·물 주기·인형 재우기·수레 밀기).
 * 48×48 장면에 가구까지 함께 그린다: 가구 바닥 가운데(furnitureAnchor)를 놓인 가구의 바닥 가운데에 맞춘다
 */
function drawAdditionUse(g: Ctx, act: PlayerAct, blink: boolean, season: Season, extra: PersonExtra, who: Who = 'writer') {
  if (act.spot && isCopyFurniture(act.spot.item)) {
    const spot=act.spot,frame=Math.min(3,Math.floor((act.total-act.left)/act.total*4))
    const k=`copyUse/${spot.item}/${spot.facing}/${frame}/${JSON.stringify([extra,activeCopyCast,activeCopyFeet,season,who])}`
    let canvas=additionCache.get(k)
    if(!canvas){const scene=copyFurnitureUseFrame(spot.item as import('../engine/copy-furniture').CopyFurnitureId,spot.facing,frame,{...activeCopyCast,who,actor:{frame:0,blink,season,...extra},season,feet:activeCopyFeet});canvas=document.createElement('canvas');canvas.width=COPY_MOTION_SIZE;canvas.height=COPY_MOTION_SIZE;const cg=canvas.getContext('2d')!
      for(const layer of scene.layers)layer.rows.forEach((r,y)=>[...r].forEach((ch,x)=>{const color=layer.palette[ch];if(ch!=='.'&&color){cg.fillStyle=color;cg.fillRect(x,y,1,1)}}))
      if(additionCache.size>512)additionCache.clear()
      additionCache.set(k,canvas)
    }
    const size=sizeOf(spot.item,spot.facing)
    g.drawImage(canvas,Math.round(spot.x*TILE+size.w*TILE/2-48),(spot.y+size.h)*TILE-64)
    return
  }
  const spot = act.spot!, action = act.use as AdditionUseAction
  let ms = ((act.total - act.left) * 1000) % ADDITION_USE_INFO[action].duration.reduce((a, b) => a + b, 0), frame = 0
  while (frame < 3 && ms >= ADDITION_USE_INFO[action].duration[frame]) ms -= ADDITION_USE_INFO[action].duration[frame++]
  const key = 'addUse/' + who + '/' + action + '/' + spot.facing + '/' + frame + '/' + blink + '/' + lookKey(who, season, extra)
  let c = additionCache.get(key)
  const f = additionUseFrame(who, spot.facing, action, frame, { frame: 0, blink, season, ...extra })
  if (!c) {
    c = document.createElement('canvas')
    c.width = ADDITION_MOTION_SIZE
    c.height = ADDITION_MOTION_SIZE
    const cg = c.getContext('2d')!
    const actorPal = who === 'writer' ? writerPalette(season, extra.avatar) : PALETTE
    for (const [rows, pal] of [[f.furnitureBack, ADDITION_PALETTE], [f.propBack, ADDITION_PALETTE], [f.actor, actorPal], [f.furnitureFront, ADDITION_PALETTE], [f.propFront, ADDITION_PALETTE]] as const)
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        const col = pal[ch]
        if (ch === '.' || !col) return
        cg.fillStyle = col
        cg.fillRect(x, y, 1, 1)
      }))
    additionCache.set(key, c)
  }
  const size = sizeOf(spot.item, spot.facing)
  const cx = Math.round(spot.x * TILE + (size.w * TILE) / 2), by = (spot.y + size.h) * TILE
  g.drawImage(c, Math.round(cx - f.furnitureAnchor.x), Math.round(by - f.furnitureAnchor.y))
}
function drawAutonomousFurniture(g: Ctx, a: FurnitureActivity, who: Who, blink: boolean, season: Season, extra: PersonExtra, toddler = false) {
  const f = a.furniture, phase = Math.floor(a.elapsed / 0.3) % 4
  if (a.spec.kind === 'addition') {
    drawAdditionUse(g, { kind: 'use', use: a.spec.action, left: Math.max(0, 4.8 - a.elapsed), total: 4.8, facing: facingOf(f), spot: { ...f, facing: facingOf(f) } }, blink, season, extra, who)
    return
  }
  if (a.spec.kind === 'child') {
    const avatar = extra.avatar ?? withLookDefaults({ look: 'f', name: '아이' })
    const layers = childFurnitureFrame(f.item as ChildFurnitureId, facingOf(f), phase, avatar, toddler)
    const x = f.x * TILE - 8, y = f.y * TILE - 16, k = `${f.item}/${facingOf(f)}/${phase}/${lookKey(who, season, extra)}`
    g.drawImage(paint(`autokid/object/${k}`, layers.furniture, FURNI_PALETTE), x, y)
    g.drawImage(paint(`autokid/actor/${k}`, layers.actor, writerPalette(season, avatar)), x, y)
    g.drawImage(paint(`autokid/front/${k}`, layers.front, FURNI_PALETTE), x, y)
    return
  }
  const action = a.spec.action as UseAction
  const layers = furnitureUseFrame(who, a.facing, action, phase, { frame: 0, blink, season, ...extra }, true, !['sit', 'lie'].includes(action))
  const palette = who === 'writer' ? writerPalette(season, extra.avatar) : PALETTE
  const c = motionCanvas(`auto/base/${who}/${action}/${a.facing}/${phase}/${blink}/${lookKey(who, season, extra)}`, layers, palette, USE_PROP_PALETTE)
  const stand = person(who, a.facing, 0, blink, 'stand', season, extra)
  const seat = action === 'sit' || action === 'lie' ? f : a.stand
  drawUse(g, c, stand, seat.x, seat.y, false)
}
const additionCache = new Map<string, HTMLCanvasElement>()

/**
 * 아기 돌보기 (2026-10-12 도트: baby-care-motion). 안아 주기·달래기는 품에 안고 서 있는 칸 그대로(발 기준),
 * 눕히기·이불 덮기는 아기 침대째 그리므로 침대 자리를 요람 칸에 맞춘다. 눕히기는 한 번, 나머지는 네 박자를 돈다
 */
function drawBabyCare(g: Ctx, act: PlayerAct, p: { x: number; y: number }, blink: boolean, season: Season, extra: PersonExtra) {
  const action = act.use as BabyCareAction, spot = act.spot!, facing = act.facing
  const elapsed = act.total - act.left
  const frame = action === 'lay' ? Math.min(3, Math.floor(elapsed / (act.total / 4))) : Math.floor(elapsed / 0.4) % 4
  const f = babyCareFrame('writer', facing, action, 'wood', frame, { frame: 0, blink, season, ...extra })
  const key = 'baby/' + action + '/' + facing + '/' + frame + '/' + blink + '/' + lookKey('writer', season, extra)
  let c = additionCache.get(key)
  if (!c) {
    c = document.createElement('canvas')
    c.width = 48
    c.height = 48
    const cg = c.getContext('2d')!
    const actorPal = writerPalette(season, extra.avatar), furni: Record<string, string> = { ...f.furniturePalette, z: '#d1c4ae' }
    for (const [rows, pal] of [[f.furnitureBack, furni], [f.babyBack, f.babyPalette], [f.blanket, furni], [f.actor, actorPal], [f.babyFront, f.babyPalette], [f.furnitureFront, furni]] as const)
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        const col = pal[ch]
        if (ch === '.' || !col) return
        cg.fillStyle = col
        cg.fillRect(x, y, 1, 1)
      }))
    additionCache.set(key, c)
  }
  if (action === 'lay' || action === 'tuck') {
    // 침대 왼쪽 위(babyCareFrame의 bedX·bedY)를 요람 칸 왼쪽 위에
    const bedX = facing === 'up' || facing === 'left' || facing === 'right' ? 26 : 16, bedY = facing === 'up' ? 24 : 27
    const bx = facing === 'left' ? 47 - bedX - 15 : bedX
    g.drawImage(c, spot.x * TILE - bx, spot.y * TILE - bedY)
  } else g.drawImage(c, Math.round(p.x * TILE + TILE / 2 - f.feet.x), Math.round((p.y + 1) * TILE - f.feet.y))
}

function animal(kind: 'cat' | 'dog', form: 'adult' | 'baby' | 'curl', facing: Facing) {
  const side = facing === 'left' ? 'left' : 'right'
  return paint(`animal/${kind}/${form}/${side === 'left' ? 'l' : 'r'}`, animalRows(kind, form, side), ANIMAL_PALETTE[kind])
}

// ── 방의 가구 ──

/**
 * 넓은 책상. 오른쪽 칸은 서는 자리(걸어 다니는 칸)라 칸을 넘어 그리지 않는다:
 * 책상 칸 안에서 상판만 넓게, 오른쪽으로 3px 넘게 내민다(서는 자리 대부분은 비워 둔다).
 * 등잔 자리는 작은 책상과 같게(그을음·불빛이 맞도록). 바닥 가구(깔개)는 이 위에 그려진다.
 */
function drawWideDesk(g: Ctx, at: Tile, season: Season) {
  drawGround(g, 'f', at.x, at.y, season)
  const px = at.x * TILE
  const py = at.y * TILE
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  r(C.shadow, 0, 12, 19, 3)
  r(C.woodDark, 1, 11, 2, 4)
  r(C.woodDark, 14, 11, 2, 4)
  r(C.wood, 0, 4, 19, 8)
  r(C.woodDark, 0, 10, 19, 2)
  // 펼친 종이와 말린 두루마리
  r(C.paper, 2, 5, 7, 5)
  r('#e9ce94', 3, 6, 5, 2)
  r(C.paper, 11, 6, 6, 3)
  r('#f5e0af', 10, 5, 2, 5)
  r('#f5e0af', 16, 5, 2, 5)
  r(C.lamp, 12, 3, 2, 3)
}

/**
 * 책상이 살아온 흔적 (계획 14 작업 7): 필사한 만큼 책상 위에 생긴 작은 물건들. 무엇이 놓이는지는 engine/desk-traces.
 * 모두 책상 칸 안(넓은 책상이면 그 상판 안)에만 — 왼쪽 뒤 펜꽂이, 오른쪽 뒤 등잔(불꽃 자리는 그대로),
 * 오른쪽 앞 종이 묶음, 왼쪽 앞 덮어 둔 완성본, 종이 아래로 늘어진 책갈피 끈, 종이 위 좋은 펜. 선은 2픽셀 이상.
 */
function drawDeskTraces(g: Ctx, at: Tile, d: DeskTraces) {
  const px = at.x * TILE
  const py = at.y * TILE
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  // 종이 묶음 자리: 작은 책상은 등잔 아래, 넓은 책상은 두루마리 옆 끝
  const stackX = d.wideDesk ? 15 : 11
  if (d.penCup) {
    // 흙 펜꽂이와 꽂아 둔 갈대 펜 (끝이 잉크에 물들었다)
    r('#e2c48a', 2, 0, 2, 3)
    r('#7d6a8c', 2, 0, 2, 2)
    r('#93654b', 1, 3, 3, 4)
    r('#c48f6b', 1, 3, 3, 2)
  }
  if (d.lamp) {
    // 흙 등잔: 불꽃 아래 낮은 몸통 (불꽃·그을음 자리는 그대로)
    r('#b07a5a', 11, 5, 4, 2)
    r(C.lamp, 12, 3, 2, 2)
  }
  if (d.pages > 0) {
    // 다 쓴 종이 묶음: 한 겹은 2픽셀, 겹마다 크림색·연한 모래색이 번갈아
    const h = d.pages * 2
    // 작은 책상은 맨 아래를 14에 놓아 세 겹이어도 등잔 몸통(5~7줄) 아래에 둔다
    const top = (d.wideDesk ? 12 : 14) - h
    for (let i = 0; i < d.pages; i++) r(i % 2 ? '#eadcb8' : '#fbf3dc', stackX, top + i * 2, 4, 2)
    // 맨 위 장에 쓴 줄 자국
    r('#b3aabb', stackX + 1, top, 2, 2)
  }
  if (d.books > 0) {
    // 덮어 둔 완성본 (두 권이면 아래에 한 권 더) — 쓰던 종이가 보이게 폭은 4
    // 위 책은 항상 8줄부터 — 펜꽂이(0~7줄)와 겹치지 않는다
    if (d.books > 1) r('#93b08f', 1, 12, 4, 2)
    const by = 8
    r('#8399bf', 1, by, 4, 2)
    r('#62779e', 1, by + 2, 4, 2)
  }
  if (d.ribbon) {
    // 종이 아래로 늘어진 책갈피 끈
    r('#c47f92', 8, 9, 2, 5)
  }
  if (d.goodPen) {
    // 좋은 펜: 종이 윗머리에 가로로 놓인 자줏빛 펜과 금빛 펜촉
    r('#6b5a7c', 5, 5, 4, 2)
    r('#e3bb55', 9, 5, 2, 2)
  }
}

/** 그을음 받이: 화덕 칸 위쪽 돌 위에 쇠판과 받침 (선은 모두 2픽셀) */
function drawSootCatcher(g: Ctx, at: Tile) {
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(at.x * TILE + dx, at.y * TILE + dy, w, h)
  }
  r('#a6947c', 2, 0, 12, 2)
  r('#917c65', 3, 2, 10, 2)
  r('#7f6d5a', 4, 4, 8, 2)
  r('#45372f', 5, 4, 2, 2)
  r('#45372f', 9, 4, 2, 2)
}

function furnitureOrder(f: Furniture): number {
  const layer = FURNITURE_DEFS[f.item]?.layer
  if (f.on) return 3
  return layer === 'floor' ? 0 : layer === 'solid' ? 1 : 2
}

/** 고른 가구 테두리: 차지한 칸 둘레에 2px 밝은 선 (방 꾸미기) */
function drawSelection(g: Ctx, tiles: readonly Tile[]) {
  if (!tiles.length) return
  const x0 = Math.min(...tiles.map((t) => t.x)) * TILE
  const y0 = Math.min(...tiles.map((t) => t.y)) * TILE
  const x1 = (Math.max(...tiles.map((t) => t.x)) + 1) * TILE
  const y1 = (Math.max(...tiles.map((t) => t.y)) + 1) * TILE
  g.strokeStyle = '#fff4dc'
  g.lineWidth = 2
  g.strokeRect(x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2)
}

const SPACE_COLOR: Record<SpaceUse, string> = { tea: '#e9b872', craft: '#a8c8e8', family: '#f2c9a0', pet: '#cfe0a0', read: '#c9b6e8' }
/** 정해 둔 집 안 자리 (계획 16 작업 23): 쓸 수 있는 곳은 가구 위에 작고 조용한 점, 방 꾸미기 중에는 쓰는 가구 둘레에 얇은 테두리 */
function drawSpaceMarks(g: Ctx, game: GameState, editing: boolean, t: number) {
  const spaces = game.spaces ?? []
  if (!spaces.length) return
  const live = new Set(liveSpaces(game).map((s) => s.id))
  for (const sp of spaces) {
    const ready = live.has(sp.id)
    if (!ready && !editing) continue
    if (editing) {
      g.strokeStyle = ready ? SPACE_COLOR[sp.use] : '#a9a39a'
      g.lineWidth = 1
      for (const f of spaceFurniture(game.room, sp)) for (const p of footprint(f)) g.strokeRect(p.x * TILE + 0.5, p.y * TILE + 0.5, TILE - 1, TILE - 1)
    }
    if (ready && sp.use !== 'pet') {
      const bob = Math.floor(t * 1.5) % 2
      g.fillStyle = SPACE_COLOR[sp.use]
      g.fillRect(sp.at.x * TILE + 6, sp.at.y * TILE - 4 + bob, 4, 3)
      g.fillStyle = 'rgba(60, 40, 20, 0.45)'
      g.fillRect(sp.at.x * TILE + 6, sp.at.y * TILE - 1 + bob, 4, 1)
    }
  }
}

function drawFurniture(g: Ctx, f: Furniture) {
  const px = f.x * TILE
  const py = f.y * TILE
  const using = autoFurnitureUses.find(a => a.furniture.item === f.item && a.furniture.x === f.x && a.furniture.y === f.y)
  if (using?.spec.kind === 'addition' || using?.spec.kind === 'child') return
  if (using?.spec.kind === 'open') {
    const frame = Math.floor(using.elapsed / 0.3) % 4
    const a = additionObjectFrame(f.item as AnimatedAdditionFurniture, facingOf(f), frame)
    g.drawImage(paint(`autoOpen/${f.item}/${facingOf(f)}/${frame}`, a.rows, ADDITION_PALETTE), px, py)
    return
  }
  // 쓰는 중인 생활 가구: 그린 동작은 사용 장면이 가구째 그린다, 여닫는 가구는 문이 열렸다 닫힌다 (네 박자 한 번)
  if (activeSpot && activeSpot.spot.x === f.x && activeSpot.spot.y === f.y && activeSpot.spot.item === f.item) {
    if (activeSpot.kind === 'use') return
    // 아기를 눕히거나 이불을 덮을 때는 돌보기 장면이 요람째 그린다
    if (activeSpot.kind === 'baby' && (activeSpot.use === 'lay' || activeSpot.use === 'tuck')) return
    if ((OPENING_FURNITURE as readonly string[]).includes(f.item)) {
      const facing = facingOf(f)
      const frame = Math.min(3, Math.floor(activeSpot.elapsed / (ACT_SECONDS.use / 4)))
      const a = additionObjectFrame(f.item as AnimatedAdditionFurniture, facing, frame)
      g.drawImage(paint('addOpen/' + f.item + '/' + facing + '/' + frame, a.rows, ADDITION_PALETTE), px, py)
      return
    }
  }
  // 서늘한 찬장 (2026-10-08): 키 큰 찬장 그림(16×32)을 벽에 기대 한 칸 위로 — 음식이 있으면 칸이 찬 모습
  if (f.item === 'homeCoolCupboard') {
    const state = pantryFull ? 'stocked' : 'closed'
    const facing = facingOf(f)
    const a = COOL_CUPBOARD[state][facing]
    g.drawImage(paint(`coolCupboard/${state}/${facing}`, a.rows, FURNI_PALETTE), px, py - TILE)
    return
  }
  const fixture = FIXTURES[f.item as keyof typeof FIXTURES]
  if (fixture && !facingArt(f.item, facingOf(f))) { drawObject(g, fixture.ch, f.x, f.y, 'spring'); return }
  const custom = SPOUSE_FURNITURE[f.item]
  if (custom) {
    const a = custom.source === 'spouse-room-art'
      ? SPOUSE_ROOM_VIEWS[custom.id]?.[facingOf(f)] ?? SPOUSE_ROOM_ART[custom.id]
      : HOME_SPACE_DIRECTIONS[custom.id]?.[facingOf(f)] ?? FURNITURE_ART[custom.id]
    if (a) g.drawImage(paint(`spouse/${custom.id}/${facingOf(f)}`, a.rows.map(r => r.replaceAll('z', '.')), FURNI_PALETTE), px + (custom.pixelOffset?.x ?? 0), py + (custom.pixelOffset?.y ?? (f.on ? -6 : 0)))
    return
  }
  // 동일한 원본을 이웃집·플레이어 집·가방에 사용한다.
  // 방향 그림이 있으면 보는 쪽 그림 (계획 17 작업 2 — 옛 저장은 옛 그림 쪽), 없으면 지금 그림
  const facing = facingOf(f)
  if (isCopyFurniture(f.item)) {
    const a=copyFurnitureObjectFrame(f.item,facing,0)
    g.drawImage(paint(`copyFurniture/${f.item}/${facing}`,a.rows,FURNI_PALETTE),px,py+(FURNITURE_DEFS[f.item]?.layer==='wall'?-8:f.on?-6:0))
    return
  }
  const turned = facingArt(f.item, facing)
  const sprite = turned ?? FURNITURE_ART[f.item]
  if (sprite) {
    // 배운 생활 기술의 모습 (기획 11): 색만 바꾼다. 모르는 값은 본래 그림
    const style = f.finish ? STYLE_PALETTES[f.item]?.[f.finish] : undefined
    const palette = style ? { ...FURNI_PALETTE, ...style } : FURNI_PALETTE
    g.drawImage(paint(`${turned ? `furni/${f.item}/${facing}` : `furni/${f.item}`}/${style ? f.finish : 'plain'}`, sprite.rows, palette), px, py + (f.on ? -6 : 0))
    return
  }
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  switch (f.item) {
    case 'rug': {
      // 3×2칸 무늬 깔개
      r('#9c402f', 1, 2, 46, 28)
      r('#bc5a45', 3, 4, 42, 24)
      r('#e4cf87', 6, 7, 36, 18)
      r('#bc5a45', 9, 10, 30, 12)
      for (let i = 0; i < 5; i++) r('#e4cf87', 12 + i * 6, 15, 3, 3)
      for (let i = 0; i < 12; i++) {
        r('#fbf1dc', 2 + i * 4, 0, 1, 2)
        r('#fbf1dc', 2 + i * 4, 30, 1, 2)
      }
      return
    }
    case 'cushion':
      r('#e8d8b5', 2, 7, 12, 8)
      r('#fbf6e9', 3, 6, 10, 7)
      r('#e8d8b5', 7, 8, 2, 2)
      return
    case 'table':
      r(C.shadow, 1, 13, 30, 3)
      r(C.woodDark, 2, 9, 2, 6)
      r(C.woodDark, 28, 9, 2, 6)
      r(C.woodDark, 0, 8, 32, 2)
      r(C.wood, 0, 3, 32, 6)
      r('#c59260', 1, 4, 30, 1)
      return
    case 'nightstand':
      r(C.shadow, 2, 13, 13, 3)
      r(C.woodDark, 2, 4, 12, 11)
      r(C.wood, 3, 5, 10, 4)
      r(C.wood, 3, 10, 10, 4)
      r('#492c1b', 7, 11, 2, 1)
      return
    case 'stool':
      r(C.shadow, 3, 13, 10, 3)
      r(C.woodDark, 4, 9, 2, 6)
      r(C.woodDark, 10, 9, 2, 6)
      r(C.wood, 3, 7, 10, 3)
      return
    default: {
      const a = FURNITURE_ART[f.item]
      if (a) {
        // 가구 그림 (탁자 위에 올린 작은 것은 조금 위로)
        g.drawImage(paint(`furni/${f.item}`, a.rows, FURNI_PALETTE), px, py + (f.on ? -6 : 0))
        return
      }
      const ic = iconCanvas(f.item)
      // 탁자 위에 올린 것은 탁자 윗면에, 바닥의 것은 칸 가운데에
      if (ic) g.drawImage(ic, px + 4, py + (f.on ? -2 : 6))
    }
  }
}

// ── 날씨 입자 ──

function drawWeather(g: Ctx, weather: string, t: number, w: number, h: number) {
  if (weather === 'rain') {
    g.fillStyle = 'rgba(160, 190, 230, 0.7)'
    for (let i = 0; i < 70; i++) {
      const x = (hash(i, 1, 3) * w + t * 30) % w
      const y = (hash(i, 2, 5) * h + t * 220) % h
      g.fillRect(Math.round(x), Math.round(y), 1, 4)
    }
    g.fillStyle = 'rgba(40, 60, 90, 0.12)'
    g.fillRect(0, 0, w, h)
  } else if (weather === 'snow') {
    g.fillStyle = 'rgba(255,255,255,0.9)'
    for (let i = 0; i < 60; i++) {
      const x = (hash(i, 3, 3) * w + Math.sin(t + i) * 6 + t * 8) % w
      const y = (hash(i, 4, 5) * h + t * 22) % h
      g.fillRect(Math.round(x), Math.round(y), 2, 2)
    }
  } else if (weather === 'wind') {
    for (let i = 0; i < 10; i++) {
      g.fillStyle = i % 2 ? '#81b959' : '#c8a65b'
      const x = (hash(i, 5, 3) * w + t * 90) % w
      const y = (hash(i, 6, 5) * h + Math.sin(t * 3 + i) * 10) % h
      g.fillRect(Math.round(x), Math.round(y), 2, 1)
    }
  } else if (weather === 'fog') {
    g.fillStyle = 'rgba(235, 238, 240, 0.35)'
    g.fillRect(0, 0, w, h)
  } else if (weather === 'hot') {
    g.fillStyle = 'rgba(255, 220, 150, 0.08)'
    g.fillRect(0, 0, w, h)
  }
}

function drawRainbow(g: Ctx, w: number) {
  const cols = ['#e67f7f', '#e4ac6a', '#eed584', '#82d072', '#7caae0', '#9476d6']
  cols.forEach((c, i) => {
    g.strokeStyle = c
    g.globalAlpha = 0.45
    g.lineWidth = 3
    g.beginPath()
    g.arc(w / 2, 150, 120 - i * 3, Math.PI * 1.08, Math.PI * 1.92)
    g.stroke()
  })
  g.globalAlpha = 1
}

function glow(g: Ctx, x: number, y: number, radius: number, alpha: number, color = '255, 200, 110') {
  const grad = g.createRadialGradient(x, y, 2, x, y, radius)
  grad.addColorStop(0, `rgba(${color}, ${alpha})`)
  grad.addColorStop(1, `rgba(${color}, 0)`)
  g.fillStyle = grad
  g.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

/** 책등 등급 띠: 맨 책·은박·금박 */
const GRADE_BAND = ['#dbc49c', '#d0d6e1', '#fac839']

/**
 * 큰 책등 하나 (8×10 — 서고 복음서 선반·사도행전 방·요한계시록 방, 계획 14 작업 4): 책마다 다른 색과 무늬(제본 binding.spineLook —
 * 특별 제본이면 고른 표지 색·무늬·장식), 은박·금박은 위아래 2픽셀 띠, 봉인은 아래 가운데 붉은 점. 무늬는 2픽셀 이상, 좌우 대칭
 */
function drawSpine(g: Ctx, sx: number, sy: number, book: Book, game: GameState) {
  const grade = game.shelved[book]
  if (grade === undefined) return
  const look = spineLook(book, game.bound?.[book])
  g.fillStyle = look.color
  g.fillRect(sx, sy, 8, 10)
  g.fillStyle = look.accent
  if (look.mark === 'band') {
    g.fillRect(sx, sy + 3, 8, 2)
    g.fillRect(sx, sy + 6, 8, 2)
  } else if (look.mark === 'stripe') g.fillRect(sx + 3, sy + 2, 2, 6)
  else if (look.mark === 'dot') g.fillRect(sx + 2, sy + 3, 4, 4)
  else if (look.mark === 'diamond') {
    g.fillRect(sx + 3, sy + 2, 2, 6)
    g.fillRect(sx + 2, sy + 4, 4, 2)
  }
  if (grade > 0) {
    g.fillStyle = GRADE_BAND[grade]
    g.fillRect(sx, sy, 8, 2)
    g.fillRect(sx, sy + 8, 8, 2)
  }
  if ((game.sealed ?? []).includes(book)) {
    g.fillStyle = '#db4627'
    g.fillRect(sx + 3, sy + 7, 2, 2)
  }
}

/** 아직 꽂지 않은 큰 책등 자리: 어두운 빈 칸과 2픽셀 밝은 나무 테 (빈 칸이 또렷이 보이게) */
function drawEmptySlot(g: Ctx, sx: number, sy: number) {
  g.fillStyle = 'rgba(40,25,15,0.4)'
  g.fillRect(sx, sy, 8, 10)
  g.fillStyle = 'rgba(236, 214, 170, 0.55)'
  g.fillRect(sx, sy + 8, 8, 2)
}

/**
 * 편지 방 선반의 얇은 책등 (방 표 순서) — 꽂힌 책만, 책마다 다른 색(binding.spineLook)과 가운데 장식 띠, 은박·금박이면 위아래 띠.
 * 꽂지 않은 책의 자리는 비워 둔다. 여덟 권 방은 조금 굵게
 */
const LETTER_SPINES: Record<'romPhm' | 'hebJud', { w: number; step: number }> = {
  romPhm: { w: 2, step: 3 },
  hebJud: { w: 3, step: 5 },
}
function drawLetterSpines(g: Ctx, game: GameState, room: 'romPhm' | 'hebJud') {
  const [s0] = (room === 'romPhm' ? PLACES.lettersShelf : PLACES.hebJudShelf).tiles
  const { w, step } = LETTER_SPINES[room]
  shelfRoom(room).books.forEach((b, i) => {
    const sx = s0.x * TILE + 5 + i * step
    const sy = s0.y * TILE + 2
    const grade = game.shelved[b]
    if (grade === undefined) return
    const look = spineLook(b, game.bound?.[b])
    g.fillStyle = look.color
    g.fillRect(sx, sy + 1, w, 8)
    if (look.mark !== 'none') {
      g.fillStyle = look.accent
      g.fillRect(sx, sy + 4, w, 2)
    }
    if (grade > 0) {
      g.fillStyle = GRADE_BAND[grade]
      g.fillRect(sx, sy + 1, w, 2)
      g.fillRect(sx, sy + 7, w, 2)
    }
  })
}

/**
 * 벽 카드 판의 일곱 자리와 놓인 카드 (요한계시록 방 일곱 교회 카드 판): 자리는 바탕보다 조금 짙은 옅은 칸, 놓인 카드 수만큼
 * 앞자리부터 크림색 카드 (4×6, 아래 2픽셀은 짙은 크림 테). 자리 순서 = 판 순서 — 맞는지는 그림으로 알려 주지 않는다.
 * 카드가 있으면 그 위를 잇는 실 (사도행전 여정 판과 같은 짜임), 다 놓으면(done) 실이 금빛
 */
function drawCardBoard(g: Ctx, first: Tile, placed: number, done: boolean) {
  // 판 안쪽 바탕은 첫 칸 4픽셀부터 40픽셀 (나무 테 안) — 자리 일곱 개를 6픽셀 간격으로 꼭 맞게
  const bx = first.x * TILE + 4
  const by = first.y * TILE
  const n = Math.min(placed, 7)
  for (let i = 0; i < 7; i++) {
    g.fillStyle = '#cfdde6'
    g.fillRect(bx + i * 6, by + 7, 4, 6)
  }
  if (n > 0) {
    g.fillStyle = done ? '#fac839' : '#c7aaa4'
    g.fillRect(bx, by + 5, 6 * (n - 1) + 4, 2)
  }
  for (let i = 0; i < n; i++) {
    g.fillStyle = '#fff7e5'
    g.fillRect(bx + i * 6, by + 7, 4, 4)
    g.fillStyle = '#f3e0b3'
    g.fillRect(bx + i * 6, by + 11, 4, 2)
    g.fillStyle = '#928bb9'
    g.fillRect(bx + i * 6 + 1, by + 5, 2, 2)
  }
}



function flame(g: Ctx, px: number, py: number, t: number, big = false) {
  const f = Math.floor(t * 8) % 3
  const s = big ? 2 : 1
  g.fillStyle = C.fire
  g.fillRect(px - 2 * s, py - (4 + f) * s, 4 * s, (4 + f) * s)
  g.fillStyle = C.fire2
  g.fillRect(px - 1 * s, py - (3 + ((f + 1) % 3)) * s, 2 * s, (3 + ((f + 1) % 3)) * s)
}

// ── 그리기 ──

export interface Renderer {
  zoom: number
  /** 캔버스 실제 크기가 한 화면(VIEW_W×TILE)의 몇 배인가 — 도트를 정수 배로 크게 그린 뒤 브라우저가 부드럽게 줄인다 */
  scale: number
  /** 카메라 왼쪽 위 (칸) */
  camera: { x: number; y: number }
  /** 방 꾸미기에서 고른 가구가 차지한 칸 (테두리를 그린다 — 계획 17 작업 2) */
  selected: Tile[] | null
  /** 카메라가 기록자 대신 비출 칸 (방 꾸미기에서 고른 방) — 없으면 기록자 */
  look: Tile | null
  /** 방 꾸미기 중이면 정해 둔 자리의 테두리도 보인다 (계획 16 작업 23) */
  decorating: boolean
  draw(game: GameState, t: number, dt: number): void
}

// ── 새 터 (계획 20 작업 3): 첫 마을의 타일 팔레트·계절·밝기를 그대로 쓰는 두 번째 지도 ──

/** 계절마다 한 장. 새 터 지도는 정해져 있으므로 집 단계 같은 열쇠가 없다 */
const newlandCache = new Map<string, HTMLCanvasElement>()
function newlandMapFor(season: Season): HTMLCanvasElement {
  // 땅이 드러나기 전·후는 다른 그림이다
  const key = `${season}/${newlandRevealedOn() ? 'r' : ''}`
  let c = newlandCache.get(key)
  if (c) return c
  c = document.createElement('canvas')
  c.width = NEWLAND_W * TILE
  c.height = NEWLAND_H * TILE
  const g = c.getContext('2d')!
  for (let y = 0; y < NEWLAND_H; y++)
    for (let x = 0; x < NEWLAND_W; x++) {
      const ch = newlandGroundAt(x, y)
      // 서고 그림이 덮는 칸은 풀밭 위에 그림만 얹는다 (돌벽 칸 그림이 그림 둘레 빈 곳으로 비치지 않게)
      if (x >= ARCHIVE.x0 && x < ARCHIVE.x0 + ARCHIVE.w && y > ARCHIVE.y0 && y <= ARCHIVE.y0 + ARCHIVE.h) {
        drawGround(g, '.', x, y, season, newlandGroundAt)
        continue
      }
      // 서고 안 작은 책장: 자산 old-village-art의 두루마리 책장 (책상은 기존 필사 책상 그림 그대로)
      if (x === INTERIOR_SHELF.tile.x && y === INTERIOR_SHELF.tile.y) {
        drawGround(g, 'f', x, y, season, newlandGroundAt)
        g.drawImage(paint('old/prop/scrollCabinet', OLD_PROPS.scrollCabinet.rows, OLD_VILLAGE_PALETTE), x * TILE, y * TILE)
        continue
      }
      drawGround(g, ch, x, y, season, newlandGroundAt)
      drawObject(g, ch, x, y, season, ch === 'T' ? treeKind(x, y) : undefined)
    }
  // 입주 주택 안 방 칸 (작업 7): 자산 OLD_INTERIORS의 바닥·벽 (128×96 = 8×6칸) — 간판·소품은 빼고, 가구는 방 주인의 가구를 위에 그린다
  for (const r of ROOM_SLOTS) g.drawImage(paint('old/interior/shell', OLD_INTERIOR_SHELL.rows, OLD_VILLAGE_PALETTE), r.x0 * TILE, r.y0 * TILE)
  // 신약 서고와 같은 외관을 그리며 구약 지붕 색만 바꾼다.
  drawLibraryExterior(g,{x0:ARCHIVE.x0,y0:ARCHIVE.y0,x1:ARCHIVE.x0+ARCHIVE.w-1,y1:ARCHIVE.door.y,doorX:ARCHIVE.door.x},OT_LIBRARY_ROOF)
  newlandCache.set(key, c)
  return c
}

/**
 * 새 터에 지은 것 (계획 20 작업 6): 깐 길·정원 칸, 마당, 입주 주택·공사 중 골격·주문한 터의 말뚝. 지도 그림(계절별 캐시) 위에 얹는다.
 * over가 false면 기록자 뒤에 그릴 것(길·마당·말뚝, 기록자가 문 앞이거나 더 위인 건물), true면 기록자 앞을 가리는 건물.
 * 공사 그림의 입구는 쓰지 않는다 — 공사 중에는 문이 막혀 있다 (엔진이 정한다)
 */
function drawNewlandSites(g: Ctx, game: GameState, playerY: number, over: boolean, content?: GameContent) {
  const nl = game.newland
  if (!nl || !newlandRevealedOn()) return
  const season = seasonOf(game.clock.day)
  // 기본 길·잔디·기본 나무: 원래 지도 그림 그대로 (이웃 칸과 이어지게 — 깐 칸은 그 글자로 본다)
  const groundAt = (xx: number, yy: number) => {
    const c = MAP_DECOR_CHAR[nl.tiles[`${xx},${yy}`] as DecorKind]
    return c === ',' || c === '.' ? c : newlandGroundAt(xx, yy)
  }
  for (const [k, kind] of Object.entries(nl.tiles)) {
    const [x, y] = k.split(',').map(Number)
    const mapChar = MAP_DECOR_CHAR[kind as DecorKind]
    if (mapChar) {
      if (mapChar === 'T') {
        const behind = y <= playerY
        if (behind === over) continue
        if (!over) drawGround(g, '.', x, y, season, groundAt)
        drawObject(g, 'T', x, y, season, treeKind(x, y))
      } else if (!over) drawGround(g, mapChar, x, y, season, groundAt)
      continue
    }
    if (kind === 'path' || kind === 'garden') {
      if (over) continue
      const art = kind === 'path' ? OLD_TERRAIN.path : OLD_TERRAIN.plantingBed
      g.drawImage(paint(`old/terrain/${kind}`, art.rows, OLD_VILLAGE_PALETTE), x * TILE, y * TILE)
      continue
    }
    // 꾸미기 소재 (사용자 결정 ⑧): 바닥은 칸 그대로, 나머지는 칸 아래 가운데에 세운다. 나무는 기록자보다 아래 줄이면 앞을 가린다
    const behind = !blocksWay(kind) || y <= playerY
    if (behind === over) continue
    // 모래 길·돌바닥은 이웃한 같은 재료 쪽으로 이어진 조각 (joinedPathRows, 다른 창 길 도트 2026-10-08 연결)
    if (kind === 'sand' || kind === 'stone') {
      const same = (dx: number, dy: number) => nl.tiles[`${x + dx},${y + dy}`] === kind
      const mask = (same(0, -1) ? PATH_BITS.north : 0) | (same(1, 0) ? PATH_BITS.east : 0) | (same(0, 1) ? PATH_BITS.south : 0) | (same(-1, 0) ? PATH_BITS.west : 0)
      g.drawImage(paint(`join/${kind}/${mask}`, joinedPathRows(kind, mask), JOIN_PATH_PALETTE), x * TILE, y * TILE)
      continue
    }
    const rows = BG_ART[kind]
    if (!rows) continue
    const w = rows[0].length
    const palette = kind === 'bush' ? {...BG_PALETTE,b:'#91b07b',c:'#aac38f',e:'#c2d5a6',f:'#779866',g:'#86a573',j:'#acbea0'} : BG_PALETTE
    g.drawImage(paint(`bg/${kind}`, rows, palette), x * TILE + Math.floor((TILE - w) / 2), y * TILE + TILE - rows.length)
  }
  for (const b of [...nl.builds].sort((a, c) => a.y - c.y)) {
    const behind = isOpenYard(b.kind) || b.state === 'ordered' || b.y + 3 <= playerY
    if (behind === over) continue
    if (b.state === 'ordered') {
      // 주문한 터: 막히는 영역의 네 귀퉁이에 부지 말뚝
      const area = areaOf(b.kind, b.x, b.y, b.size)
      const xs = [Math.min(...area.map((t) => t.x)), Math.max(...area.map((t) => t.x))]
      const ys = [Math.min(...area.map((t) => t.y)), Math.max(...area.map((t) => t.y))]
      for (const x of xs) for (const y of ys) g.drawImage(paint('old/prop/plotPeg', OLD_PROPS.plotPeg.rows, OLD_VILLAGE_PALETTE), x * TILE, y * TILE)
      continue
    }
    // 입주 주택·손님집은 신약 마을 집 생김새에 지을 때 고른 색 (2026-10-13 사용자)
    if (b.state === 'done' && hasHouseLook(b.kind)) {
      g.drawImage(newlandHouseCanvas(b.kind, b.facing, b.look, seasonOf(game.clock.day) === 'winter', widthOf(b.kind, b.size)), b.x * TILE, b.y * TILE)
      continue
    }
    const set = b.state === 'done' ? OLD_BUILDINGS : OLD_CONSTRUCTION
    // 그림은 자산 id로 (기억 정원 = garden, 아이 일터 = 그 아이 직업의 집 겸 일터)
    // 집 겸 일터: 그 주인의 일 그림 (2026-10-14: 아이 셋·이웃 자녀)
    const ownJob = b.kind === 'kidWork' ? ownerJob(game, b.owner) : null
    const asset = b.kind === 'kidWork' ? (ownJob && set[ownJob] ? ownJob : 'cook') : (SITES[b.kind].assetId ?? b.kind)
    const art = set[asset][b.facing]
    // 넓은 집(2·3단계)의 공사 그림은 본채 자리에 (날개 자리는 말뚝)
    const off = hasHouseLook(b.kind) ? mainOffset(widthOf(b.kind, b.size)) : 0
    g.drawImage(paint(`old/${b.state}/${asset}/${b.facing}`, art.rows, OLD_VILLAGE_PALETTE), (b.x + off) * TILE, b.y * TILE)
    if (off > 0 || widthOf(b.kind, b.size) > 4) {
      const w = widthOf(b.kind, b.size)
      for (const x of [b.x, b.x + w - 1]) for (const y of [b.y + 1, b.y + 3]) g.drawImage(paint('old/prop/plotPeg', OLD_PROPS.plotPeg.rows, OLD_VILLAGE_PALETTE), x * TILE, y * TILE)
    }
  }
  // 문을 연 꿈터 (계획 18 B18-8): 낮(9–17시)에는 페넬로피가 문 앞에서 베틀을 짠다 (extraUseFrame weave, 2026-10-07 연결)
  const shop = game.flags.dreamOpen ? nl.builds.find((b) => b.kind === 'weaver' && b.state === 'done') : undefined
  const weaverDef = content?.neighbors.find((d) => d.id === DREAMER)
  const m = game.clock.minute
  if (shop && weaverDef && m >= 9 * 60 && m < 17 * 60) {
    const at = standSpotOf(shop)
    if (at) {
      if ((at.y <= playerY) !== over) {
        const { who, extra } = neighborLook(weaverDef, undefined, game.looks?.[weaverDef.id])
        const tt = performance.now() / 1000
        const f = Math.floor(tt * 3) % 4
        const blink = isBlinking(tt + 4.2)
        const opts = { frame: 0 as const, blink, season: seasonOf(game.clock.day), ...extra }
        const actorPal = who === 'writer' ? writerPalette(opts.season, extra.avatar) : PALETTE
        const stand = person(who, 'down', 0, false, 'stand', opts.season, extra)
        drawUse(g, motionCanvas(`xuse/${who}/down/weave/${f}/${blink}/${lookKey(who, opts.season, extra)}`, extraUseFrame(who, 'down', 'weave', f, opts), actorPal, FURNI_PALETTE), stand, at.x, at.y, true)
      }
    }
  }
  // 틸리의 그림방 (2026-10-08): 문을 연 뒤 낮(9–17시)에는 문 옆에서 그림을 그린다 (extraUseFrame draw)
  const studio = game.flags[dreamKey('dreamOpen', 'tilly')] ? nl.builds.find((b) => b.kind === 'gallery' && b.state === 'done') : undefined
  const painterDef = content?.neighbors.find((d) => d.id === 'tilly')
  if (studio && painterDef && m >= 9 * 60 && m < 17 * 60) {
    const at = standSpotOf(studio)
    if (at && (at.y <= playerY) !== over) {
      const { who, extra } = neighborLook(painterDef, undefined, game.looks?.[painterDef.id])
      const tt = performance.now() / 1000
      const f = Math.floor(tt * 3) % 4
      const blink = isBlinking(tt + 1.7)
      const opts = { frame: 0 as const, blink, season: seasonOf(game.clock.day), ...extra }
      const actorPal = who === 'writer' ? writerPalette(opts.season, extra.avatar) : PALETTE
      const stand = person(who, 'down', 0, false, 'stand', opts.season, extra)
      drawUse(g, motionCanvas(`xuse/${who}/down/draw/${f}/${blink}/${lookKey(who, opts.season, extra)}`, extraUseFrame(who, 'down', 'draw', f, opts), actorPal, FURNI_PALETTE), stand, at.x, at.y, true)
    }
  }
  // 손님집의 손님 (2026-10-07, 다른 창 도트 연결): 8–20시 문 옆 — 온 날 오전엔 짐 내려놓기, 낮엔 손일, 그 밖엔 서서 쉬기
  const inn = nl.builds.find((b) => b.kind === 'guest' && b.state === 'done')
  const guest = inn ? guestNow(game) : null
  if (inn && guest && m >= 8 * 60 && m < 20 * 60) {
    const at = standSpotOf(inn)
    if (at) {
      if ((at.y <= playerY) !== over) {
        const look = SETTLEMENT_GUESTS[guest]
        const f = Math.floor((performance.now() / 1000) * 3) % 4
        // 온 날: 11시까지 짐 내려놓기, 12시까지 열쇠 받기 / 기록자가 곁에 오면 문 앞 인사 (guestArrivalFrame, 2026-10-08)
        // 온 날 처음 보일 때 짐 내려놓기 한 바퀴, 기록자가 곁에 온 순간 인사 한 바퀴 (열쇠 받기는 입주할 때만 — 사용자 결정 2026-10-12)
        const firstDay = game.clock.day === (game.flags.guestSince ?? -1)
        const pl = game.player
        const greet = Math.abs(pl.x - at.x) + Math.abs(pl.y - at.y) <= 2
        const lug = onceFrame(`inn-lug/${guest}/${game.clock.day}`, firstDay)
        const hi = lug === null ? onceFrame(`inn-hi/${guest}`, greet) : null
        const arrival = lug !== null ? 'putLuggage' : hi !== null ? 'doorGreet' : null
        const arriving = arrival !== null
        const action = arrival ?? (m >= 9 * 60 && m < 17 * 60 ? 'work' : 'stand')
        const layers = arrival ? guestArrivalFrame(guest, arrival, 'down', (lug ?? hi)!) : settlementGuestFrame(guest, 'down', action as 'work' | 'stand', f)
        const stand = person('writer', 'down', 0, false, 'stand', 'spring', { avatar: look.avatar, look: look.avatar.look, elder: look.elder })
        drawUse(g, motionCanvas(`guest/${guest}/${action}/${f}`, layers, layers.palette, arriving ? ADDITION_PROP_PALETTE : GUEST_PROP_PALETTE), stand, at.x, at.y, true)
      }
    }
  }
  // 떠난 아이가 다니러 와 손님집에 묵는 사흘 (2026-10-12 사용자 결정 2): 8–20시 손님집 문 옆, 온 날 처음엔 짐 내려놓기 대신 손 한 번 흔들기
  if (inn && kidVisiting(game) && game.child && m >= 8 * 60 && m < 20 * 60) {
    const at = standSpotOf(inn)
    if (at && (at.y <= playerY) !== over) {
      const av = playerChildAvatar(game)
      const tt = performance.now() / 1000
      drawSprite(g, person('writer', 'down', 0, isBlinking(tt + 0.8), 'stand', seasonOf(game.clock.day), { avatar: av, look: av.look }), at.x, at.y, breathOffset(tt))
    }
  }
  // 자란 아이의 일터 (B18-7, 2026-10-08): 9–17시 문 옆에서 일한다 — 요리사는 요리 손동작(cookingFrame), 그 밖엔 손일(craft)
  const work = nl.builds.find((b) => b.kind === 'kidWork' && b.state === 'done')
  const job = work ? kidWorkJob(game) : null
  const kidAt = work && job && m >= 9 * 60 && m < 17 * 60 ? kidWorkSpot(work) : null
  if (kidAt && game.child && (kidAt.y <= playerY) !== over) {
    const av = game.looks?.child ? withLookDefaults({ ...game.looks.child, skin: game.avatar?.skin ?? game.looks.child.skin }) : withLookDefaults({ look: game.child.look === 'boy' ? 'm' : 'f', name: game.child.name, skin: game.avatar?.skin ?? 1 })
    const season = seasonOf(game.clock.day)
    const tt = performance.now() / 1000
    const f = Math.floor(tt * 3) % 4
    const blink = isBlinking(tt + 2.1)
    const extra: PersonExtra = { avatar: av, look: av.look }
    const opts = { frame: 0 as const, blink, season, ...extra }
    const stand = person('writer', 'down', 0, false, 'stand', season, extra)
    const look = lookKey('writer', season, extra)
    if (job === 'cook') {
      const steps = ['wash', 'chop', 'stir', 'knead'] as CookAction[]
      const step = steps[Math.floor(tt / 2) % steps.length]
      drawUse(g, motionCanvas(`cook/kid/${step}/${f}/${blink}/${look}`, cookingFrame('writer', 'down', step, f, opts), writerPalette(season, av), FURNI_PALETTE), stand, kidAt.x, kidAt.y, true)
    } else {
      const phase = usePhase('craft', tt * 1000)
      drawUse(g, motionCanvas(`use/kid/craft/${phase}/${blink}/${look}`, furnitureUseFrame('writer', 'down', 'craft', phase, opts), writerPalette(season, av), USE_PROP_PALETTE), stand, kidAt.x, kidAt.y, true)
    }
  }  // 새 터로 옮긴 주민 가족 (2026-10-08 주택 희망): 8–20시 그 집 문 옆에 가구의 어른 한 사람 — 서서 쉬거나 낮엔 손일
  if (m >= 8 * 60 && m < 20 * 60)
    for (const fam of familyHomes(game)) {
      const at = standSpotOf(fam.home)
      // 원래 이웃끼리 꾸린 가구도 보이게 — 태어난 주민은 생성 외형, 원래 이웃은 그 이웃의 모습 (2026-10-12 점검 10)
      const whoId = familyShownMember(game, fam.household)
      const born = whoId ? game.gen?.persons[whoId] : undefined
      const def = whoId ? content?.neighbors.find((d) => d.id === whoId) : undefined
      if (!at || !whoId || (at.y <= playerY) === over) continue
      const season = seasonOf(game.clock.day)
      const look = born?.origin === 'born' && born.avatar
        ? (() => { const av = genAvatar(born); return { who: 'writer' as Who, extra: { avatar: av, look: av.look, elder: born.stage === 'elder' } as PersonExtra } })()
        : def ? neighborLook(def, undefined, game.looks?.[def.id], born?.stage === 'elder') : null
      if (!look) continue
      const { who, extra } = look
      const tt = performance.now() / 1000 + whoId.length
      const stand = person(who, 'down', 0, false, 'stand', season, extra)
      if (who === 'writer' && extra.avatar && m >= 9 * 60 && m < 17 * 60) {
        const phase = usePhase('craft', tt * 1000)
        const opts = { frame: 0 as const, blink: isBlinking(tt), season, ...extra }
        drawUse(g, motionCanvas(`use/fam/${whoId}/craft/${phase}/${lookKey('writer', season, extra)}`, furnitureUseFrame('writer', 'down', 'craft', phase, opts), writerPalette(season, extra.avatar), USE_PROP_PALETTE), stand, at.x, at.y, true)
      } else drawSprite(g, person(who, 'down', 0, isBlinking(tt), 'stand', season, extra), at.x, at.y, breathOffset(tt))
    }  // 이웃이 된 손님 (2026-10-08 입주): 8–20시 제 집 문 옆 — 짐을 푼 날엔 짐 내려놓기, 낮엔 손일, 곁에 오면 문 앞 인사
  if (m >= SETTLED_FROM && m < SETTLED_TO)
    for (const sg of settledGuests(game)) {
      const at = settledSpot(sg.home)
      if (!at || (at.y <= playerY) === over) continue
      const look = SETTLEMENT_GUESTS[sg.id]
      const f = Math.floor((performance.now() / 1000) * 3) % 4
      const near = Math.abs(game.player.x - at.x) + Math.abs(game.player.y - at.y) <= 2
      // 입주한 날: 열쇠 받기 한 바퀴 → 짐 내려놓기 한 바퀴, 그 뒤로는 곁에 온 순간 인사 한 바퀴
      const movingIn = sg.day === game.clock.day
      const key = onceFrame(`sg-key/${sg.id}/${game.clock.day}`, movingIn)
      const lug = key === null ? onceFrame(`sg-lug/${sg.id}/${game.clock.day}`, movingIn) : null
      const hi = key === null && lug === null ? onceFrame(`sg-hi/${sg.id}`, near) : null
      const arrival = key !== null ? 'receiveKey' : lug !== null ? 'putLuggage' : hi !== null ? 'doorGreet' : null
      const action = arrival ?? (m >= 9 * 60 && m < 17 * 60 ? 'work' : 'stand')
      const layers = arrival ? guestArrivalFrame(sg.id, arrival, 'down', (key ?? lug ?? hi)!) : settlementGuestFrame(sg.id, 'down', action as 'work' | 'stand', f)
      const stand = person('writer', 'down', 0, false, 'stand', 'spring', { avatar: look.avatar, look: look.avatar.look, elder: look.elder })
      drawUse(g, motionCanvas(`guest/${sg.id}/${action}/${f}`, layers, layers.palette, arrival ? ADDITION_PROP_PALETTE : GUEST_PROP_PALETTE), stand, at.x, at.y, true)
    }  // 기억 정원의 표식 (2026-10-07, 다른 창 도트 연결): 실제로 있었던 일만, 최근 것부터 여덟 — 결혼은 두 고리, 출생은 요람, 이사(독립)는 열쇠
  const garden = nl.builds.find((b) => b.kind === 'memorial' && b.state === 'done')
  if (garden) {
    const marks = memoriesOf(game).filter((mm) => markerShown(game, mm)).slice(0, MEMORY_SPOTS.length)
    const fr = Math.floor(performance.now() / 600) % 2
    marks.forEach((mem, i) => {
      const [dx, dy] = MEMORY_SPOTS[i]
      const tx = garden.x + dx
      const ty = garden.y + dy
      if ((ty <= playerY) !== over) return
      const kind = memoryMarkerKind(mem)
      g.drawImage(paint(`memo/${kind}/${fr}`, memoryMarkerRows(kind, fr), MEMORY_PALETTE), tx * TILE, ty * TILE)
    })
  }
}

/**
 * 한 번 일어나는 동작 (2026-10-12 사용자 규칙: 짐 내려놓기·열쇠 받기·인사·손 흔들기·유아 동작은 한 바퀴만):
 * 켜진 순간부터 frames 장을 ms 간격으로 한 번 — 다 돌면 null(평소 동작으로). 꺼지면 잊어서 다음에 켜질 때 다시 한 번
 */
const onceStart = new Map<string, number>()
function onceFrame(key: string, on: boolean, frames = 4, ms = 320): number | null {
  if (!on) { onceStart.delete(key); return null }
  const now = performance.now()
  let start = onceStart.get(key)
  if (start === undefined) { start = now; onceStart.set(key, start) }
  const i = Math.floor((now - start) / ms)
  return i < frames ? i : null
}

/** 4×4 기억 정원 안 표식 자리: 정원 그림은 아래 두 줄 반이라, 비어 있는 윗줄 풀밭에 (가운데부터) */
const MEMORY_SPOTS: readonly [number, number][] = [[1, 1], [2, 1], [1, 0], [2, 0], [0, 0], [3, 0], [0, 1], [3, 1]]
function memoryMarkerKind(m: Memory): MemoryKind {
  if (m.kind === 'wedding' || (m.kind === 'gen' && m.log?.kind === 'married')) return 'wedding'
  if (m.kind === 'childBorn' || m.kind === 'gen') return 'birth'
  if (m.kind === 'farewell') return 'independence'
  if (m.kind === 'settle') return 'ribbonPost'
  return m.kind === 'feast' ? 'wreath' : 'flowerPot'
}

/**
 * 밝기 덮어쓰기 (계획 20 작업 4 첫 방문 아침빛): 0(환함)~1이면 시계의 어둠 대신 이 값으로 새 터를 덮는다. null이면 시계를 따른다.
 * 엔진 상태가 아니라 화면 연출 값이라 저장하지 않는다
 */
let darknessOverride: number | null = null
export function setDarknessOverride(v: number | null): void {
  darknessOverride = v === null ? null : Math.max(0, Math.min(1, v))
}

/** 작은 책장 여섯 칸에 얹는 책등 색 — 채도 낮은 파스텔·갈색 */
const SHELF_FILL_COLORS = ['#c9b08a', '#b8a58c', '#a9b49a', '#9fa9b4', '#bba3a9', '#cdbf9a', '#a89078']
/**
 * 작은 책장 채우기: steps번째 책등까지. 책장은 tiles 순서대로 (서고 큰 방은 왼쪽 셋 → 오른쪽 셋), 한 책장에 열두 칸 —
 * 선반 단은 위(3픽셀 높이)·가운데·아래(4픽셀), 단마다 왼쪽부터 책등 넷. 책등은 2픽셀 너비
 */
function drawShelfFill(g: Ctx, tiles: readonly Tile[], steps: number) {
  const { rows, perRow } = SHELF_FILL
  for (let n = 0; n < steps; n++) {
    const shelf = Math.floor(n / (rows * perRow))
    const t = tiles[shelf]
    if (!t) break
    const inShelf = n % (rows * perRow)
    const row = Math.floor(inShelf / perRow)
    const col = inShelf % perRow
    g.fillStyle = SHELF_FILL_COLORS[(n * 3 + shelf) % SHELF_FILL_COLORS.length]
    // 선반 판은 타일 안 y=4·9·14 줄 — 책등은 판 위에 선다
    const y = row === 0 ? 1 : row === 1 ? 5 : 10
    const h = row === 0 ? 3 : 4
    g.fillRect(t.x * TILE + 2 + col * 3, t.y * TILE + y, 2, h)
  }
}

/** 서고 방 하나의 책장 채움: 그 방에 속한 책들의 조각 비율 (큰 방은 신약 전체) */
function drawRoomShelfFill(g: Ctx, game: GameState, pieces: readonly Piece[], room: 'library' | 'acts' | 'romPhm' | 'hebJud' | 'rev') {
  const tiles = bookcaseTiles(room)
  const books = room === 'library' ? undefined : shelfRoom(room).books
  const { got, total } = roomPieceRatio(pieces, game.collected, books)
  drawShelfFill(g, tiles, shelfFillSteps(got, total, tiles.length))
}

/** 새 터 한 장면: 땅과 서고, 기록자, 계절 날씨·밤. 첫 마을의 이웃·동물·아이·행사는 이 지도에 없다 */
function drawNewland(g: Ctx, game: GameState, t: number, W: number, H: number, ox: number, oy: number, selected: readonly Tile[] | null = null, content?: GameContent) {
  const season = seasonOf(game.clock.day)
  const weather = weatherOf(game.clock.day)
  const p = game.player
  const here = { x: Math.round(p.x), y: Math.round(p.y) }
  const outdoors = !isIndoor(here)
  g.save()
  try {
    g.fillStyle = '#362515'
    g.fillRect(0, 0, W, H)
    g.translate(-ox, -oy)
    g.drawImage(newlandMapFor(season), 0, 0)
    drawNewlandSites(g, game, here.y, false, content)
    // 입주 주택 안 가구: 깔개 → 길을 막는 가구 → 위에 올린 작은 물건 (집 안과 같은 그림·순서)
    if (inBuildingRoom(game)) {
      for (const f of [...roomOf(game)].sort((a, b) => furnitureOrder(a) - furnitureOrder(b) || a.y - b.y)) drawFurniture(g, f)
      if (selected) drawSelection(g, selected)
    }
    // 서고 안 작은 책장: 모은 구약 조각 ÷ 구약 전체 조각만큼 (한 칸 열두 책등)
    if (inArchiveRoom(here)) {
      drawShelfFill(g, [INTERIOR_SHELF.tile], shelfFillSteps((game.otCollected ?? []).length, OT_PIECE_COUNT, 1))
      // 확장권으로 열린 범위 방 책장 (계획 21 R9·결정 ⑦): 그 범위에서 마친 책만큼 찬다
      OT_ROOMS.slice(0, archiveRoomsOpen()).forEach((room, i) => {
        const at = ARCHIVE_ROOM_SHELVES[i]
        g.drawImage(paint('old/prop/scrollCabinet', OLD_PROPS.scrollCabinet.rows, OLD_VILLAGE_PALETTE), at.x * TILE, at.y * TILE)
        drawShelfFill(g, [at], shelfFillSteps(room.books.filter((b) => otBookFinished(game, b)).length, room.books.length, 1))
      })
    }
    const moving = p.path.length > 0
    const done = totalChapters(game)
    const blink = isBlinking(t)
    const spr = person('writer', p.facing, moving ? walkFrame(p.walkTime) : 0, blink, 'stand', season, { inky: done > 0, look: game.avatar?.look, avatar: game.avatar ? withLookDefaults(game.avatar) : undefined })
    // 새 터에 따라온 동물 친구 (2026-10-14): 걷거나 곁에서 기다린다 — 기록자보다 위에 있으면 먼저, 아래면 나중에 그린다
    const comp = game.companion?.map === 'newland' && !game.companion.stay ? game.companion : null
    const drawPet = () => {
      if (!comp) return
      const baby = !isGrown(comp, game.clock.day)
      const walking = comp.path.length > 0
      const action = comp.motion ? (comp.motion.action === 'rest' ? 'wait' : comp.motion.action) : walking ? 'walk' : 'wait'
      const frame = walking ? Math.floor(comp.walkTime * (baby ? 4 : 8)) % 4 : comp.motion ? Math.floor(t * 6) % 4 : 0
      drawSprite(g, paint(`pet/${comp.kind}/${comp.facing}/${action}/${frame}/${!baby}`, petMotionRows(comp.kind, comp.facing, action, frame, baby), ANIMAL_PALETTE[comp.kind]), comp.x, comp.y, 0, false)
    }
    if (comp && comp.y <= p.y) drawPet()
    drawSprite(g, spr, p.x, p.y, moving ? 0 : breathOffset(t))
    if (comp && comp.y > p.y) drawPet()
    drawNewlandSites(g, game, here.y, true, content)
    // 서고 안은 방 하나만 보이게 둘레를 가린다 (첫 마을의 집 안과 같은 방식)
    const room = viewRoomAt(here)
    if (room) {
      const rx = room.x0 * TILE
      const ry = room.y0 * TILE
      const rw = room.w * TILE
      const rh = room.h * TILE
      g.fillStyle = '#1c1510'
      g.fillRect(ox - TILE, oy - TILE, W + 2 * TILE, ry - oy + TILE)
      g.fillRect(ox - TILE, ry + rh, W + 2 * TILE, oy + H - ry - rh + TILE)
      g.fillRect(ox - TILE, ry, rx - ox + TILE, rh)
      g.fillRect(rx + rw, ry, ox + W - rx - rw + TILE, rh)
    }
  } finally {
    g.restore()
  }
  if (outdoors) drawWeather(g, weather, t, W, H)
  const dark = darknessOverride ?? darkness(game.clock.minute)
  if (dark > 0) {
    g.fillStyle = `rgba(20, 22, 60, ${dark})`
    g.fillRect(0, 0, W, H)
  }
}

export function createRenderer(g: Ctx, content: GameContent): Renderer {
  g.imageSmoothingEnabled = false
  const steps: { x: number; y: number; t: number }[] = []
  /** 비·눈 발자국이 남는 실제 초 */
  const STEP_SECONDS = 12
  let lastStep = ''
  const renderer: Renderer = {
    zoom: 1,
    scale: 1,
    selected: null,
    look: null,
    decorating: false,
    camera: { x: 0, y: 0 },
    draw(game, t, dt) {
      const W = VIEW_W * TILE / renderer.zoom
      const H = VIEW_H * TILE / renderer.zoom
      const z = renderer.zoom * renderer.scale
      g.setTransform(z, 0, 0, z, 0, 0)
      g.imageSmoothingEnabled = false
      const day = game.clock.day
      const minute = game.clock.minute
      pantryFull = Object.values(game.pantry ?? {}).some((n) => (n ?? 0) > 0)
      autoFurnitureUses = Object.entries(game.furnitureAuto ?? {}).filter(([id, a]) => id !== 'player' && a.phase === 'use' && !a.actor.path.length &&
        roomOf(game).some(f => f.item === a.furniture.item && f.x === a.furniture.x && f.y === a.furniture.y && facingOf(f) === facingOf(a.furniture)) &&
        (!id.startsWith('npc:') || !npcEventMotion(game, id.slice(4), t)) && (id !== 'child' || !childAtSchool(game))).map(([, a]) => a)
      activeSpot = game.act?.spot ? { spot: game.act.spot, kind: game.act.kind, use: game.act.use, elapsed: game.act.total - game.act.left } : null
      activeCopyCast = game.act?.use==='copyFurniture'&&game.act.spot ? copyFurnitureCast(game,game.act.spot) : {}
      if(game.act?.use==='copyFurniture'&&game.act.spot){const f=game.act.spot,size=sizeOf(f.item,f.facing);activeCopyFeet={x:Math.round((game.player.x-f.x)*TILE+TILE/2-size.w*TILE/2),y:Math.round((game.player.y+1-f.y-size.h)*TILE)}}
      const season = seasonOf(day)
      const weather = weatherOf(day)
      const wet = isWet(weather)
      const phase = phaseOf(minute)
      const p = game.player
      const here = { x: Math.round(p.x), y: Math.round(p.y) }

      // 카메라: 부드럽게 따라간다
      const focus = renderer.look ?? p
      const target = cameraFor(focus.x, focus.y, renderer.zoom)
      const cam = renderer.camera
      if (dt <= 0 || Math.abs(target.x - cam.x) + Math.abs(target.y - cam.y) > 6) {
        cam.x = target.x
        cam.y = target.y
      } else {
        const k = Math.min(1, dt * 6)
        cam.x += (target.x - cam.x) * k
        cam.y += (target.y - cam.y) * k
      }
      // 카메라는 캔버스 실제 화소 단위로 맞춘다 (정수 배로 키웠으므로 도트는 흐려지지 않고, 움직임은 더 매끄럽다)
      const sc = renderer.scale
      const ox = Math.round(cam.x * TILE * sc) / sc
      const oy = Math.round(cam.y * TILE * sc) / sc

      if (currentMapId() === 'newland') {
        drawNewland(g, game, t, W, H, ox, oy, renderer.selected, content)
        return
      }
      const outdoors = !isIndoor(here)
      let festOn = false
      g.save()
      try {
      g.fillStyle = '#362515'
      g.fillRect(0, 0, W, H)
      g.translate(-ox, -oy)
      g.drawImage(mapFor(season), 0, 0)

      const fallen = groundFragment(game, content.pieces)
      if (fallen) {
        const x = fallen.at.x * TILE, y = fallen.at.y * TILE
        g.fillStyle = 'rgba(65, 44, 22, 0.3)'
        g.fillRect(x + 4, y + 11, 9, 2)
        g.fillStyle = '#7b603b'
        g.fillRect(x + 3, y + 5, 9, 7)
        g.fillStyle = '#f8e9bb'
        g.fillRect(x + 4, y + 4, 7, 7)
        g.fillStyle = '#a38b65'
        g.fillRect(x + 5, y + 6, 4, 1)
        g.fillRect(x + 5, y + 8, 3, 1)
        if (Math.floor(t * 2) % 3 === 0) {
          g.fillStyle = '#fff6c9'
          g.fillRect(x + 12, y + 2, 1, 3)
          g.fillRect(x + 11, y + 3, 3, 1)
        }
      }

      // 오솔길: 자주 밟은 풀밭
      for (const { x, y, n } of grassTrails(game.trails)) {
        g.fillStyle = n >= 40 ? C.worn2 : C.worn
        g.globalAlpha = n >= 40 ? 0.9 : 0.5
        g.fillRect(x * TILE + 3, y * TILE + 4, 10, 8)
        g.fillRect(x * TILE + 5, y * TILE + 2, 6, 12)
        g.globalAlpha = 1
      }

      // 비·눈 오는 날 흙길에 남는 발자국 (12초 동안 옅게 사라진다 — 2026-10-05 사용자: 너무 오래·진하게 남았다)
      const stepKey = `${here.x},${here.y}`
      if (stepKey !== lastStep) {
        lastStep = stepKey
        if (wet && MAP[here.y]?.[here.x] === ',') steps.push({ x: here.x, y: here.y, t })
      }
      while (steps.length && (t - steps[0].t > STEP_SECONDS || steps[0].t > t)) steps.shift()
      for (const st of steps) {
        g.fillStyle = `rgba(80, 55, 30, ${0.2 * (1 - (t - st.t) / STEP_SECONDS)})`
        g.fillRect(st.x * TILE + 5, st.y * TILE + 6, 2, 3)
        g.fillRect(st.x * TILE + 9, st.y * TILE + 9, 2, 3)
      }

      // 그날의 날씨가 땅에 남긴 것 (계획 15 작업 2): 눈 쌓임(구운 덮개), 비 온 뒤 물웅덩이, 추운 아침 살얼음, 여름 맑은 날 물빛
      if (weather === 'snow') g.drawImage(snowLayer(), 0, 0)
      else if (puddlesOut(day, minute)) drawPuddles(g, day, weather === 'rain', t)
      if (season === 'summer' && (weather === 'sunny' || weather === 'hot') && minute >= 7 * 60 && minute < 19 * 60) drawLakeGlints(g, t)

      // 익은 포도
      if (grapesRipe(day))
        MAP.forEach((row, y) =>
          [...row].forEach((ch, x) => {
            if (ch !== 'v') return
            g.fillStyle = C.grapes
            g.fillRect(x * TILE + 3, y * TILE + 6, 2, 3)
            g.fillRect(x * TILE + 10, y * TILE + 5, 2, 3)
          }),
        )
      if (barleyRipe(day)) {
        g.fillStyle = 'rgba(255, 230, 140, 0.25)'
        for (const t of PLACES.field.tiles) g.fillRect(t.x * TILE, t.y * TILE, TILE, TILE)
      }

      // 넓은 책상: 책상 칸 안에 상판만 넓게 (서는 자리는 덮지 않는다)
      if (PLACES.desk.tiles.length && (game.inv.wideDesk ?? 0) > 0) drawWideDesk(g, PLACES.desk.tiles[0], season)
      // 선반의 두루마리, 책상의 잉크 자국, 등잔 그을음
      const done = totalChapters(game)
      const [shelf] = PLACES.shelf.tiles
      const [desk] = PLACES.desk.tiles
      const [hearth] = PLACES.hearth.tiles
      for (let i = 0; shelf && i < Math.min(12, done); i++) {
        g.fillStyle = i % 2 ? '#f8e6b6' : '#fef1cf'
        g.fillRect(shelf.x * TILE + 3 + (i % 4) * 3, shelf.y * TILE + 1 + Math.floor(i / 4) * 5, 2, 3)
      }
      for (let i = 0; desk && i < Math.min(8, done); i++) {
        g.fillStyle = 'rgba(30, 20, 40, 0.55)'
        g.fillRect(desk.x * TILE + 2 + Math.floor(hash(i, 3, 1) * 11), desk.y * TILE + 5 + Math.floor(hash(i, 4, 1) * 6), 1, 1)
      }
      // 책상이 살아온 흔적 (계획 14 작업 7): 필사한 만큼 책갈피·펜꽂이·종이 묶음·등잔·완성본
      if (desk) drawDeskTraces(g, desk, deskTraces(game))
      // 등잔 그을음: 흔적(등잔 불꽃 자리) 위에 그려 가려지지 않는다
      const soot = Math.min(0.7, (game.flags.lampNights ?? 0) * 0.04)
      if (desk && soot > 0) {
        g.fillStyle = `rgba(30, 25, 20, ${soot})`
        g.fillRect(desk.x * TILE + 12, desk.y * TILE + 3, 2, 2)
      }
      // 그을음 받이 (계획 11 작업 1): 화덕 위의 얇은 쇠판과 그 아래 받침, 모인 그을음 두 점
      if (hearth && (game.flags['unlock:sootCatcher'] ?? 0) > 0) drawSootCatcher(g, hearth)
      // 방의 가구: 깔개 → 길을 막는 가구 → 위에 올린 작은 물건
      const ordered = [...game.room].sort((a, b) => furnitureOrder(a) - furnitureOrder(b) || a.y - b.y)
      const childUsingFurniture = game.furnitureAuto?.child?.phase === 'use' ? game.furnitureAuto.child.furniture : null
      const restingPet = game.companion
      const petOccupied = new Set([...solidTiles(game.room), ...Object.values(game.npcs).filter(n => n.visible).map(n => key(npcTile(n)))])
      if (childUsingFurniture) petOccupied.add(key(childUsingFurniture))
      const petHabitNow = restingPet?.stay && !restingPet.path.length && !restingPet.motion ? petHabit(restingPet, day, minute, weather) : null
      const petFurnitureCandidate = petHabitNow ? petFurniturePlace(game.room, minute, petHabitNow.pose, petOccupied) : null
      const petUsingFurniture = petFurnitureCandidate && restingPet && sameTile({ x: Math.round(restingPet.x), y: Math.round(restingPet.y) }, petFurnitureCandidate) ? petFurnitureCandidate : null
      for (const f of ordered) if (f !== childUsingFurniture && f !== petUsingFurniture) drawFurniture(g, f)
      if (renderer.selected) drawSelection(g, renderer.selected)
      drawSpaceMarks(g, game, renderer.decorating, t)
      // 이야기 뒤 소품 (계획 16 작업 4 · 계획 17): 생활 확장 도트 → 없으면 가구 그림
      drawStoryProps(g, game)
      // 내 작은 장날 좌판 (계획 16 작업 19): 영업 중일 때만
      drawStall(g, game)
      // 주민이 함께 바꾸는 마을 (계획 16 작업 20): 짓는 중이거나 완성된 공동 시설 — 같은 자리, 그림만
      drawVillage(g, game)
      // 모임에서 함께 만들어 모임 자리에 남긴 작품 (계획 16 작업 15)
      drawClubWorks(g, game)
      // 화덕 불
      if (hearth) flame(g, hearth.x * TILE + 8, hearth.y * TILE + 14, t)
      // 행사 모닥불
      const fest = festivalOf(day)
      // 복음서 방 잔치 저녁에는 비가 와도 모닥불을 피운다
      // 결혼 잔치 날 저녁도 모닥불 (계획 6)
      festOn = (((!!fest && !wet) || feastToday(game) || weddingToday(game)) && minute >= FESTIVAL_FROM && minute < FESTIVAL_TO) || weddingEvening(game)
      if (festOn) {
        g.fillStyle = C.woodDark
        g.fillRect(FIRE.x * TILE + 3, FIRE.y * TILE + 12, 10, 3)
        flame(g, FIRE.x * TILE + 8, FIRE.y * TILE + 13, t, true)
      }
      // 행사 소품 (계획 17 작업 4·5): 바닥에 까는 것은 여기서, 서 있는 것은 아래 사람들과 줄 순서로
      const eventProps = eventPropsNow(game)
      for (const ep of eventProps) if (ep.ground) drawEventProp(g, ep)

      // 서고 안 복음서 선반: 네 칸 — 처음엔 빈 칸이 또렷이, 꽂은 책은 책마다 다른 책등(제본 모습)과 등급 띠 (계획 14 작업 4)
      if (roomAt(here)?.owner === 'library') {
        const [first] = PLACES.library.tiles
        GOSPELS.forEach((b, i) => {
          const sx = first.x * TILE + 4 + i * 11
          const sy = first.y * TILE + 2
          if (game.shelved[b] === undefined) drawEmptySlot(g, sx, sy)
          else drawSpine(g, sx, sy, b, game)
        })
        // 작은 책장 여섯 개: 모은 말씀 조각 ÷ 27권 전체 조각만큼 왼쪽 위 책장부터 한 단씩 차오른다 (왼쪽 셋 → 오른쪽 셋, 책장마다 위 단부터).
        // 아래 양옆 책장의 꽂은 책 책등은 이 위에 겹쳐 그린다. 책등은 2픽셀 너비, 차분한 파스텔·갈색
        drawRoomShelfFill(g, game, content.pieces, 'library')
        // 양옆 책장은 말씀 조각을 모은 만큼만 차오른다 (2026-10-13 사용자 확인 — 꽂은 책마다 책등을 덧그리던 것은 뺐다.
        // 사도행전·편지·요한계시록 책등은 각자 방 선반에 있다)
      }
      // 사도행전 방: 선반의 사도행전 책등, 벽 여정 판의 실과 카드 (모은 만큼, 다 이으면 실이 금빛)
      if (roomAt(here) === ACTS_ROOM) {
        drawRoomShelfFill(g, game, content.pieces, 'acts')
        const mid = PLACES.actsShelf.tiles[1]
        if (game.shelved.ac === undefined) drawEmptySlot(g, mid.x * TILE + 4, mid.y * TILE + 2)
        else drawSpine(g, mid.x * TILE + 4, mid.y * TILE + 2, 'ac', game)
        const [b0] = PLACES.journeyBoard.tiles
        const bx = b0.x * TILE + 4
        const by = b0.y * TILE
        const all = content.journey?.length ?? 0
        const shown = all ? Math.ceil((game.journey.length / all) * 7) : 0
        if (shown > 0) {
          g.fillStyle = (game.flags.actsShip ?? 0) > 0 ? '#fac839' : '#dd9988'
          g.fillRect(bx, by + 6, 40, 2)
        }
        for (let i = 0; i < shown; i++) {
          g.fillStyle = '#fff7e5'
          g.fillRect(bx + i * 6, by + 8, 4, 4)
          g.fillStyle = '#84a0ba'
          g.fillRect(bx + i * 6 + 1, by + 6, 2, 2)
        }
      }
      // 요한계시록 방: 한 권 선반의 요한계시록 책등, 벽 일곱 교회 카드 판의 자리·카드·실
      if (roomAt(here) === REV_ROOM) {
        drawRoomShelfFill(g, game, content.pieces, 'rev')
        const mid = PLACES.revShelf.tiles[1]
        if (game.shelved.rev === undefined) drawEmptySlot(g, mid.x * TILE + 4, mid.y * TILE + 2)
        else drawSpine(g, mid.x * TILE + 4, mid.y * TILE + 2, 'rev', game)
        drawCardBoard(g, PLACES.churchBoard.tiles[0], game.churches.length, (game.flags.churchesDone ?? 0) > 0)
      }
      // 편지 방: 편지 선반의 얇은 책등 (방 표 순서)
      if (roomAt(here) === LETTERS_ROOM) {
        drawRoomShelfFill(g, game, content.pieces, 'romPhm')
        drawLetterSpines(g, game, 'romPhm')
      }
      if (roomAt(here) === HEB_JUD_ROOM) {
        drawRoomShelfFill(g, game, content.pieces, 'hebJud')
        drawLetterSpines(g, game, 'hebJud')
      }

      // 마음이 쌓여 마을에 생긴 것들
      drawDecor(g, game, weather, t, phase === 'morning' || phase === 'day')
      // 아직 열리지 않은 구역·이사 오기 전 이웃의 집: 덤불로 덮는다 (물만 보인다)
      coverLocked(g, game, season)
      // 추운 아침 살얼음은 덮개 뒤에: 아직 안 열린 잔교는 물로 덮이므로 그 칸도 얼린다 (빈틈이 생기지 않게)
      if (icyMorning(day, minute)) drawShoreIce(g, minute, lockedTiles(villageBookCount(game)))
      // 정자 지붕의 눈 (정자는 덧그림이라 지도 덮개 위에 따로), 굴뚝 연기 (닫힌 집은 빼고)
      if (weather === 'snow') drawPavilionSnow(g)
      const smoke = chimneySmoke(day, minute)
      if (smoke !== 'none') drawChimneySmoke(g, game, smoke, weather === 'wind', t)

      type Item = { y: number; paint: () => void }
      const items: Item[] = []
      // 아기는 부모 집 안에만. 받은 침대는 성장 후에도 남는다.
      const infant = bakerInfantAtHome(game, roomAt(here))
      if (infant) items.push({ y: infant.at.y, paint: () => drawSprite(g, paint(`baby/home/${JSON.stringify(infant.baby.avatar??{})}`, BABY.baby, newbornArt(genAvatar(infant.baby)).palette), infant.at.x, infant.at.y, 6) })
      for (const { baby, at, sleeping } of householdCradles(game, roomAt(here))) {
        const f = baby?.id === BAKER_BABY_ID || sleeping ? 2 : Math.floor(t / 0.6) % 4
        items.push({ y: at.y, paint: () => {
          const a = householdCradleFrame(baby, f, sleeping)
          const key = `family-crib/${baby?.id ?? 'empty'}/${f}/${sleeping}/${JSON.stringify(baby?.avatar ?? {})}`
          for (const [layer, rows, palette] of [['back', a.back, a.propPalette], ['baby', a.actor, a.actorPalette], ['front', a.front, a.propPalette]] as const)
            g.drawImage(paint(`${key}/${layer}`, rows, palette), at.x * TILE, at.y * TILE)
        } })
        // 깨어 있는 낮에는 집 주인이 아닌 다른 부모가 요람 곁에서 달랜다 (familyFrame sootheBaby, 2026-10-07 사용자)
        const room = roomAt(here)
        const carer = !sleeping && room ? baby?.parents.find((id) => id !== room.owner) : undefined
        if (carer && game.gen) {
          const cp = game.gen.persons[carer]
          const fixedDef = cp?.origin === 'fixed' ? content.neighbors.find((d) => d.id === (cp.npc ?? carer)) : undefined
          const look = fixedDef ? neighborLook(fixedDef, undefined, game.looks?.[fixedDef.id]) : cp ? { who: 'writer' as Who, extra: { look: genAvatar(cp).look, avatar: genAvatar(cp) } as PersonExtra } : null
          const sx = tileAt(at.x + 1, at.y) === 'f' ? at.x + 1 : at.x - 1
          if (look) items.push({ y: at.y + 0.01, paint: () => drawFamily(g, 'sootheBaby', sx > at.x ? 'left' : 'right', Math.floor(t / 0.4) % 4, 'adult', sx, at.y, isBlinking(t + 2.1), season, look.extra, look.who) })
        }
      }
      const guest = libraryVisitor(game)
      if (guest) items.push({ y: guest.at.y, paint: () => {
        // 걸어가는 동안은 주인공과 같은 사람 그림의 걸음 (가는 쪽을 보고 다리를 움직인다 — 2026-10-14 사용자: 콩콩 뛰는 것처럼 보였다)
        if (guest.moving) {
          const av = VISITOR_LOOKS[guest.kind]
          const spr = person('writer', guest.facing ?? 'down', walkFrame(t * 1.6), isBlinking(t + 0.7), 'stand', season, { avatar: av, look: av.look, short: guest.kind === 'kid' ? 1 : undefined })
          drawSprite(g, spr, guest.at.x, guest.at.y, 0)
          return
        }
        const f = Math.floor(t / 0.35) % 4
        const a = visitorFrame(guest.kind, guest.action, f)
        const standing = visitorFrame(guest.kind, 'stand', f)
        const stand = paint(`visitor-stand/${guest.kind}/${f}`, standing.actor.slice(4, 4 + standing.height).map(r => r.slice(7, 17)), standing.actorPalette)
        const canvas = motionCanvas(`visitor/${guest.kind}/${guest.action}/${f}`, a, a.actorPalette, a.propPalette)
        drawUse(g, canvas, stand, guest.at.x, guest.at.y, true)
      } })
      for (const ep of eventProps) if (!ep.ground) items.push({ y: eventPropSortY(ep), paint: () => drawEventProp(g, ep) })

      // 안 읽은 편지 (2026-09-30 사용자): 문 앞 편지 바구니 위에 봉투 말풍선
      if (mailboxHasPost(game)) {
        const bk = PLACES.basket.tiles[0]
        items.push({ y: bk.y + 0.4, paint: () => emote(g, 'letter', bk.x * TILE + 8, bk.y * TILE - 2 - Math.round(Math.sin(t * 3))) })
      }

      // Same native sheep count, travel pauses and grazing frames as story backdrops.
      for(const a of villageSheepFrames(game.flags,t)){
        items.push({y:a.y,paint:()=>drawSprite(g,paint(`sheep/${a.side}/${a.action}/${a.frame}`,sheepLifeRows(a.side,a.action,a.frame),SMALL_PALETTE),a.x,a.y)})
      }

      // 이웃
      for (const def of content.neighbors) {
        const n = game.npcs[def.id]
        // 은퇴한 이웃 자리는 이어받은 자녀가 주인으로 (이사 여부와 상관없이 — 2026-10-11 사용자 결정), 은퇴한 부모는 곁에
        const heirP = slotHeir(game.gen, def.id)
        const heirAv = heirP ? genAvatar(heirP) : null
        const elder = residentIsElder(game.gen, heirP?.id ?? def.id)
        /** 곁의 가족 그림: 은퇴한 부모는 그 이웃의 원래 모습을 나이 든 모습으로, 그 밖은 생성 주민 모습 */
        const companionLook = (c: Companion): { who: Who; extra: PersonExtra } => {
          if (c.retiredParent) return neighborLook(def, undefined, game.looks?.[def.id], true)
          const av = genAvatar(c.person)
          return { who: 'writer', extra: { look: av.look, avatar: av, elder: c.person.stage === 'elder' || residentIsElder(game.gen, c.person.id), short: c.short ? (c.person.stage === 'child' ? 1 : 2) : undefined } }
        }
        // 이사 가는 날 (2026-10-07 사용자): 아침 7–9시, 나이 든 이웃이 짐을 들고 제 집 문 앞에서 아래로 걸어 떠난다 (familyFrame moveHouse)
        const leaving = game.gen?.retired?.[def.id]
        const homeRoom = ROOMS.find((rm) => rm.owner === def.id)
        if (leaving?.moved === day && homeRoom && !wet && minute >= 7 * 60 && minute < 9 * 60 && !roomAt(here)) {
          // 이웃이 다니는 길(route)로 문 앞 → 우물 마당까지, 두 시간에 걸쳐 걷고 마당에 닿으면 떠난다
          const way = leavingWay(def.id, { x: homeRoom.door.x, y: homeRoom.door.y + 1 })
          const k = ((minute - 7 * 60) / 120) * (way.length - 1)
          const i0 = Math.min(way.length - 1, Math.floor(k))
          const a = way[i0]
          const b = way[Math.min(way.length - 1, i0 + 1)]
          const lx = a.x + (b.x - a.x) * (k - i0)
          const ly = a.y + (b.y - a.y) * (k - i0)
          const face: Facing = b.x > a.x ? 'right' : b.x < a.x ? 'left' : b.y < a.y ? 'up' : 'down'
          const { who, extra } = neighborLook(def, undefined, game.looks?.[def.id], true)
          const ph = t + def.id.length
          if (i0 < way.length - 1) items.push({ y: ly, paint: () => drawFamily(g, 'moveHouse', face, Math.floor(ph * 5) % 4, 'elder', lx, ly, isBlinking(ph), season, extra, who) })
        }
        if (!n?.visible) {
          // 집에 들어간 이웃: 내가 그 집 안에 있으면 방 안 자리에 서 있다 (밤 열 시 이후엔 잔다)
          // 결혼해 배우자의 집에 사는 이웃은 그 집 안, 주인 자리 한 칸 아래에 (2026-10-08 주민 가족 생활)
          // 새 터 집으로 이사한 가족은 첫 마을 집 안에 그리지 않는다 — 새 터 집에서 지낸다 (2026-10-12 사용자 결정 1)
          if (livesInNewland(game, def.id)) continue
          const sharedOwner = sharedHomeOf(game.gen, def.id, (o) => ROOMS.some((rm) => rm.owner === o))
          const home = ROOMS.find((rm) => rm.owner === (LODGING_SEATS[def.id]||LODGING_SEATS[sharedOwner??'']?'lodgingUpper':sharedOwner ?? def.id))
          const sharedSeat=LODGING_SEATS[sharedOwner??'']
          const seat = LODGING_SEATS[def.id] ?? (sharedSeat?[{x:sharedSeat.x+1,y:sharedSeat.y},{x:sharedSeat.x-1,y:sharedSeat.y},{x:sharedSeat.x,y:sharedSeat.y-1}].find(t=>isWalkable(t)):null) ?? (home ? (sharedOwner ? { x: home.sit.x, y: home.sit.y + 1 } : home.sit) : null)
          const movedIn = !def.joinsAt || (game.flags.villageLevel ?? 0) >= def.joinsAt
          if (n && home && seat && movedIn && roomAt(here) === home && minute >= 5 * 60 && minute < 22 * 60) {
            const growth = def.id === 'child' ? childGrowth(day) : undefined
            items.push({
              y: seat.y,
              // 제 집 앉는 자리에서는 앉은 모습 (계획 17 작업 3) — 숨 쉬는 박자는 앉기 동작에 들어 있다
              paint: () => {
                const { who, extra } = neighborLook(def, growth, game.looks?.[def.id], elder, heirAv)
                const stand = person(who, 'down', 0, false, 'stand', season, extra)
                // 나이 든 주민은 스무 초에 한 번 일어섰다가(standUp) 다시 앉는다(sitDown) — elderMotionFrame, 2026-10-08 연결
                const cyc = (t + def.id.length) % 20
                if (elder && who === 'writer' && extra.avatar && cyc < 3.6) {
                  const act = cyc < 1.2 ? 'standUp' : cyc < 2.4 ? null : 'sitDown'
                  if (!act) return drawSprite(g, stand, seat.x, seat.y, 0)
                  const f = Math.min(3, Math.floor((cyc % 1.2) / 0.3))
                  const layers = elderMotionFrame(act, 'down', f, extra.avatar)
                  return drawUse(g, motionCanvas(`elder/${act}/${f}/${lookKey(who, season, extra)}`, layers, layers.palette, ADDITION_PROP_PALETTE), stand, seat.x, seat.y, true)
                }
                drawUse(g, useFrameCanvas(who, 'down', 'sit', t + def.id.length, 1, isBlinking(t + def.id.length), season, extra), stand, seat.x, seat.y, true)
              },
            })
            // 집 안의 가족 (2026-10-07): 아이·십 대는 곁에서 함께 읽고, 어른 자녀는 이야기를 듣는다 — 비 오는 날·저녁에도 보인다
            if (!sharedOwner) companionsOf(game.gen, def.id, day).forEach((c, i) => {
              if((wet||minute>=18*60||minute<8*60)&&lodgingChildren(game).some(r=>r.id===c.person.id))return
              const ph = t + c.person.id.length * 0.53
              const { who: cWho, extra } = companionLook(c)
              const cx = home.sit.x + (i === 0 ? 1 : -1)
              // 은퇴한 부모는 그 이웃의 원래 모습으로 곁에 서 있다 (생성 주민 동작 그림은 쓰지 않는다)
              if (c.retiredParent) {
                items.push({ y: home.sit.y + 0.01, paint: () => drawSprite(g, person(cWho, i === 0 ? 'left' : 'right', 0, isBlinking(ph), 'stand', season, extra), cx, home.sit.y, breathOffset(ph)) })
                return
              }
              const stage: Exclude<GenerationStage, 'baby'> = c.person.stage === 'child' ? 'child' : c.person.stage === 'teen' ? 'teen' : c.person.stage === 'elder' ? 'elder' : 'adult'
              items.push({ y: home.sit.y + 0.01, paint: () => drawFamily(g, c.short ? 'readTogether' : 'listen', i === 0 ? 'left' : 'right', Math.floor(ph * 3) % 4, stage, cx, home.sit.y, isBlinking(ph), season, extra) })
            })
          }
          continue
        }
        const chatting = game.emotes?.find(e => e.npc === def.id && e.partner)
        const moving = !chatting && n.path.length > 0
        const facing = moving || chatting ? n.facing : 'down'
        const near = Math.abs(n.x - p.x) + Math.abs(n.y - p.y) <= 2
        let waveF: number | null = null
        const offset = def.id.length * 0.37
        const growth = def.id === 'child' ? childGrowth(day) : undefined
        items.push({
          y: n.y,
          paint: () => {
            const spr = neighborPerson(def, facing, moving ? walkFrame(n.walkTime) : chatting && Math.floor((t + offset) * 2) % 2 ? 1 : 0, isBlinking(t + offset), season, growth, game.looks?.[def.id], elder, heirAv)
            // 행사 동작 (계획 17 작업 4·5): 결혼식의 짝, 잔치·모임 자리의 이웃 — 지금 외형으로
            const em = moving ? null : npcEventMotion(game, def.id, t)
            if (em) {
              const { who, extra } = neighborLook(def, growth, game.looks?.[def.id], elder, heirAv)
              drawEventMotion(g, who, em, n.x, n.y, isBlinking(t + offset), season, extra)
            } else if (autoFurnitureUses.includes(game.furnitureAuto?.[`npc:${def.id}`] as FurnitureActivity)) {
              const { who, extra } = neighborLook(def, growth, game.looks?.[def.id], elder, heirAv)
              drawAutonomousFurniture(g, game.furnitureAuto![`npc:${def.id}`], who, isBlinking(t + offset), season, extra)
            } else if (!moving && elder && ((waveF = onceFrame(`wave/${def.id}`, near)) !== null || (t + offset) % 9 < 1.2) && neighborLook(def, growth, game.looks?.[def.id], elder, heirAv).who === 'writer') {
              // 나이 든 주민은 서 있다가 가끔 허리를 편다 (elderMotionFrame straighten, 다른 창 도트 2026-10-07 연결)
              const { extra } = neighborLook(def, growth, game.looks?.[def.id], elder, heirAv)
              const av = extra.avatar!
              // 기록자가 곁(두 칸 안)에 온 순간 손을 한 번 흔든다 (wave — 한 바퀴만, 2026-10-12)
              const act = waveF !== null ? 'wave' : 'straighten'
              const f = waveF !== null ? waveF : Math.min(3, Math.floor(((t + offset) % 9) / 0.3))
              const layers = elderMotionFrame(act, 'down', f, av)
              drawUse(g, motionCanvas(`elder/${act}/${f}/${lookKey('writer', season, extra)}`, layers, layers.palette, ADDITION_PROP_PALETTE), spr, n.x, n.y, true)
            } else drawSprite(g, spr, n.x, n.y, moving ? 0 : breathOffset(t + offset))
            // 이야기를 건넬 이웃, 기다리던 이야기(이벤트)를 품은 이웃은 머리 위에 말풍선 — 말을 걸면 열린다
            const bubbleY = n.y * TILE + TILE - spr.height - 2 - Math.round(Math.sin(t * 3))
            // 일과 자리에서 하는 일 그림(포도 등)은 2026-10-07 사용자 요청으로 지웠다
            // 이웃끼리 만난 순간의 표정 (계획 20 2부) — 이야기 말풍선이 먼저
            const met = game.emotes?.find((e) => e.npc === def.id)
            if (met) emote(g, met.kind, n.x * TILE + 8, bubbleY)
            else if (game.offers[def.id] || storyWaiting(game, def.id) || bakerCribWaiting(game, def.id)) emote(g, 'call', n.x * TILE + 8, bubbleY)
          },
        })
        // The other stray is adopted off-screen; it does not follow Willow.
        // 세대교체: 견습·이어받은 자녀, 걷는 아이·십 대는 부모 곁에 (서 있을 때, 비 오는 날엔 집 안)
        // 2026-10-07 사용자: 이동 중엔 뒤를 따라 걷고, 서 있으면 곁에서 — 견습 자녀는 손일(apprentice) 동작
        if (!wet)
          companionsOf(game.gen, def.id, day).forEach((c, i) => {
            if((wet||minute>=18*60||minute<8*60)&&lodgingChildren(game).some(r=>r.id===c.person.id))return
            const ph = t + c.person.id.length * 0.53
            const { who: cWho, extra } = companionLook(c)
            const apprenticeOf = !c.short && c.person.stage === 'adult' && (game.gen?.heirs?.[def.id]?.heir === c.person.id || game.gen?.retired?.[def.id]?.heir === c.person.id)
            // 자식들은 부모 곁에 붙어 다니지 않는다 (2026-10-13 사용자: 어른 이웃처럼 돌아다니게) — 30분마다 마을 곳곳(광장·우물·언덕·
            // 벤치·나루·이웃집 앞) 중 한 곳을 골라 길을 따라 걸어가 그 근처에 선다. 견습 자녀·은퇴한 부모(함께 일하는 사이)만 곁에
            // 2026-10-14 사용자: 견습 자녀·은퇴한 부모도 걸어갈 때 줄줄이 따라다니지 않는다 — 부모가 서서 일할 때만 곁에
            if ((!c.retiredParent && !apprenticeOf) || moving) {
              const w = kidWalk(c.person.id, def, content.neighbors, game.gen?.seed ?? 1, day, minute)
              const look: Facing = w.moving ? w.facing : (['down', 'left', 'right', 'down'] as const)[(c.person.id.length + Math.floor(minute / 30)) % 4]
              items.push({ y: w.y + 0.02, paint: () => drawSprite(g, person(cWho, look, w.moving ? walkFrame(w.walkTime) : 0, isBlinking(ph), 'stand', season, extra), w.x, w.y, w.moving ? 0 : breathOffset(ph)) })
              return
            }
            if (moving) {
              // 부모가 가는 쪽의 반대편으로 한 칸·두 칸 뒤에서 같은 쪽을 보고 걷는다
              const back = (i + 1) * 0.9
              const [dx, dy] = facing === 'left' ? [back, 0] : facing === 'right' ? [-back, 0] : facing === 'up' ? [0, back] : [0, -back]
              const fx = n.x + dx
              const fy = n.y + dy
              items.push({ y: fy, paint: () => drawSprite(g, person(cWho, facing, walkFrame(n.walkTime + 0.15 * (i + 1)), isBlinking(ph), 'stand', season, extra), fx, fy, 0) })
              return
            }
            const cx = n.x + (i === 0 ? 0.85 : -0.85)
            const side: Facing = i === 0 ? 'left' : 'right'
            const apprentice = !c.short && c.person.stage === 'adult' && (game.gen?.heirs?.[def.id]?.heir === c.person.id || game.gen?.retired?.[def.id]?.heir === c.person.id)
            if (apprentice) {
              items.push({ y: n.y + 0.02, paint: () => drawFamily(g, 'apprentice', side, Math.floor(ph * 4) % 4, 'adult', cx, n.y, isBlinking(ph), season, extra) })
              return
            }
            items.push({ y: n.y + 0.02, paint: () => drawSprite(g, person(cWho, side, 0, isBlinking(ph), 'stand', season, extra), cx, n.y, breathOffset(ph)) })
          })
      }

      // 떠돌이 새끼들
      for (const a of straysToday(game)) {
        const s = STRAY_SPOTS[a]
        items.push({ y: s.y, paint: () => drawSprite(g, animal(a, 'baby', Math.sin(t + (a === 'cat' ? 0 : 2)) > 0 ? 'right' : 'left'), s.x, s.y, Math.floor(t * 2) % 2, false) })
      }

      // 둘째·셋째 (2026-10-13): 아기는 요람, 걷는 아이는 집 안, 돕는 아이·어른은 마을 곳곳에 — 첫째와 같은 그림
      siblingsOf(game).forEach((sib, i) => {
        const at = siblingTile(game, sib, i)
        const sst = childStage(sib, day)
        const blink = isBlinking(t + 2.1 + i)
        if (sst === 'baby') {
          items.push({ y: at.y, paint: () => drawSprite(g, paint(`baby/sibling/${JSON.stringify(sib.wardrobe??{})}/${game.avatar?.skin}`, BABY.baby, newbornArt(withLookDefaults({name:sib.name,look:sib.look==='boy'?'m':'f',...sib.wardrobe,skin:game.avatar?.skin})).palette), at.x, at.y, 5 + (Math.floor(t * 1.5 + i) % 2)) })
          return
        }
        const facing: Facing = Math.sin(t * 0.3 + i * 2) > 0 ? 'down' : 'left'
        const rows = recolor(spriteRows('child', facing, { frame: 0, blink, growth: 2 }), sib.look === 'boy' ? { z: 'E', Z: 'M' } : { z: 'V', Z: 'X' })
        items.push({ y: at.y, paint: () => drawSprite(g, paint(`kid/${sib.look}/${facing}/0/${blink}`, rows, PALETTE), at.x, at.y, Math.floor(t * 2 + i) % 2) })
      })

      // 우리 아이 (계획 12): 아기는 요람, 걷는 아이는 곁을 따라다니고, 돕는 아이는 때마다 마을 곳곳에
      const kid = game.child
      // 마을을 떠난 어른 아이는 그리지 않는다
      if (kid && childMode(kid, day) !== 'away' && !activeCopyCast.child) {
        const st = childStage(kid, day)
        const mode = childMode(kid, day)
        const kidBlink = isBlinking(t + 1.3)
        const kidRows = (facing: Facing, frame: 0 | 1 | 2) => recolor(spriteRows('child', facing, { frame, blink: kidBlink, growth: 2 }), kid.look === 'boy' ? { z: 'E', Z: 'M' } : { z: 'V', Z: 'X' })
        // 걷는 아이는 키 작은 주인공 그림(방향별 걸음), 돕는 아이는 물 긷는 아이 그림에 옷 색만 바꿔서 — 방향별 걸음 (2026-10-07 사용자)
        // 옷장에서 모습을 입힌 아이는 그 모습 그대로 (돕는 아이는 키가 작게, 어른은 그대로)
        const kidAvatar = playerChildAvatar(game)
        const kidSprite = playerChildSprite(st, !!game.looks?.child)
        const kidShort = kidSprite.short
        const drawKid = (x: number, y: number, bob: number, facing: Facing = 'down', frame: 0 | 1 | 2 = 0) =>
          kidSprite.who === 'writer'
            ? drawSprite(g, person('writer', facing, frame, kidBlink, 'stand', season, { avatar: kidAvatar, look: kidAvatar.look, short: kidShort }), x, y, bob)
            : drawSprite(g, paint(`kid/${kid.look}/${facing}/${frame}/${kidBlink}`, kidRows(facing, frame), PALETTE), x, y, bob)
        // 다른 창 도트(life-additions) 동작 한 장 — 아이 모습마다 따로 캐시
        const kidLook = lookKey('writer', season, { avatar: kidAvatar, look: kidAvatar.look, short: kidShort })
        const drawKidMotion = (key: string, layers: { actor: string[]; propBack: string[]; propFront: string[]; palette: Record<string, string> }, x: number, y: number) =>
          drawUse(g, motionCanvas(`${key}/${kidLook}`, layers, layers.palette, ADDITION_PROP_PALETTE), person('writer', 'down', 0, false, 'stand', season, { avatar: kidAvatar, look: kidAvatar.look, short: kidShort }), x, y, true)
        if (childAtSchool(game)) {
          // 배움터에 맡긴 날: 배움 탁자 곁에 앉아 읽는다 (함께 읽기 동작, 2026-10-07)
          const at = SCHOOL_SEAT
          const stage: Exclude<GenerationStage, 'baby'> = st === 'toddler' ? 'toddler' : st === 'adult' ? 'adult' : 'child'
          items.push({ y: at.y, paint: () => drawFamily(g, 'readTogether', 'down', Math.floor((t + 1.3) * 3) % 4, stage, at.x, at.y, kidBlink, season, { avatar: kidAvatar, look: kidAvatar.look, short: kidShort }) })
        } else if (mode === 'cradle' && game.act?.kind === 'baby') {
          // 돌보는 동안 아기는 품이나 돌보기 장면 속 요람에 있다 (drawBabyCare)
        } else if (mode === 'cradle') {
          const c = childTile(game)!
          items.push({
            y: c.y,
            paint: () => {
              drawSprite(g, paint(`baby/player/${JSON.stringify(kidAvatar)}`, BABY.baby, newbornArt(kidAvatar).palette), c.x, c.y, 5 + (Math.floor(t * 1.5) % 2))
            },
          })
        } else if (mode === 'follow') {
          // 기록자 뒤에 한 걸음 떨어져 (보는 쪽의 반대편)
          const back = { left: [0.7, 0.1], right: [-0.7, 0.1], up: [0, 0.6], down: [-0.6, -0.1] }[p.facing]
          const kx = p.x + back[0]
          const ky = p.y + back[1]
          // 기록자와 같은 쪽을 보고 걸음 그림으로 따라온다 (위아래 흔들기만 하던 것 → 방향별 걸음)
          // 걷는 아이(유아)는 아장아장 걷기 (toddlerMotionFrame walk, 다른 창 도트 2026-10-08 연결)
          if (st === 'toddler' && p.path.length) {
            const f = Math.floor((p.walkTime ?? t) * 4.5) % 4
            items.push({ y: ky, paint: () => drawKidMotion(`tod/walk/${p.facing}/${f}`, toddlerMotionFrame('walk', p.facing, f, kidAvatar), kx, ky) })
          } else items.push({ y: ky, paint: () => drawKid(kx, ky, 0, p.facing, p.path.length ? walkFrame(p.walkTime ?? t) : 0) })
        } else {
          const at = childTile(game)!
          const kt = t + 1.3
          const furnitureUse = game.furnitureAuto?.child
          if (furnitureUse && furnitureUse.phase !== 'cooldown') {
            const a = furnitureUse.actor
            items.push({ y: a.y, paint: () => {
              if (furnitureUse.phase === 'use') drawAutonomousFurniture(g, furnitureUse, 'writer', kidBlink, season, { avatar: kidAvatar, look: kidAvatar.look, short: kidShort }, st === 'toddler')
              else drawKid(a.x, a.y, 0, a.facing, a.path.length ? walkFrame(a.walkTime) : 0)
            } })
          } else if (st === 'toddler') {
            // 집에 둔 유아: 열두 초에 한 번 기어가기 → 손 내밀기 → 주저앉기 중 하나를 한 바퀴만 하고 그 밖엔 가만히 (2026-10-12 사용자 규칙)
            const slot = Math.floor(kt / 12)
            const inSlot = kt % 12
            const action = (['crawl', 'reach', 'plop'] as const)[slot % 3]
            if (inSlot < 1.2) {
              const f = Math.min(3, Math.floor(inSlot / 0.3))
              items.push({ y: at.y, paint: () => drawKidMotion(`tod/${action}/${f}`, toddlerMotionFrame(action, 'down', f, kidAvatar), at.x, at.y) })
            } else items.push({ y: at.y, paint: () => drawKid(at.x, at.y, breathOffset(kt)) })
          } else if (st === 'helper' && mode === 'home') {
            // 집에 둔 돕는 아이: 오전엔 앉아 글쓰기, 오후엔 책 넘기기 (childMotionFrame)
            const action = minute < 14 * 60 ? 'write' : 'read'
            const f = Math.floor(kt * 3) % 4
            items.push({ y: at.y, paint: () => drawKidMotion(`kidm/${action}/${f}`, childMotionFrame(action, 'down', f, kidAvatar), at.x, at.y) })
          } else if (st === 'helper' && kt % 10 < 1.2) {
            // 마을을 돕는 아이: 가끔 바구니의 물건을 건넨다 (give, 한 번)
            const f = Math.min(3, Math.floor((kt % 10) / 0.3))
            items.push({ y: at.y, paint: () => drawKidMotion(`kidm/give/${f}`, childMotionFrame('give', 'down', f, kidAvatar), at.x, at.y) })
          } else items.push({ y: at.y, paint: () => drawKid(at.x, at.y, breathOffset(kt)) })
        }
      }

      // Independent children have their own rooms upstairs in the shared house.
      if(roomAt(here)?.owner==='lodgingUpper'&&(wet||minute>=18*60||minute<8*60))for(const resident of lodgingChildren(game)){
        const born=game.gen?.persons[resident.id]
        // 우리 아이는 옷장에서 입힌 모습 그대로 (2026-10-12 점검 MOB-05)
        const avatar=born?genAvatar(born):playerChildAvatar(game)
        items.push({y:resident.seat.y,paint:()=>drawSprite(g,person('writer','down',0,isBlinking(t+resident.seat.x),'stand',season,{avatar,look:avatar.look}),resident.seat.x,resident.seat.y,breathOffset(t))})
      }
      // 2층 여관 손님 (inn-guests): 묵는 동안 아침·저녁에 방에 있다
      if(roomAt(here)?.owner==='lodgingUpper')for(const guest of innGuestsNow(game)){
        const avatar=withLookDefaults(guest.guest.avatar)
        items.push({y:guest.at.y,paint:()=>drawSprite(g,person('writer','down',0,isBlinking(t+guest.at.x*0.7),'stand',season,{avatar,look:avatar.look}),guest.at.x,guest.at.y,breathOffset(t+guest.at.x))})
      }
      // 동반 동물
      const comp = game.companion
      if (comp && !activeCopyCast.pet) {
        const cTile = { x: Math.round(comp.x), y: Math.round(comp.y) }
        const still = comp.path.length === 0
        const baby = !isGrown(comp, day)
        const facing = comp.facing
        const side = comp.facing === 'left' ? 'left' : 'right'
        // 집에 둔 동물은 습관 자세(낮잠·기다리기·살피기·놀이), 따라다니는 동물은 곁에서 가만히 서 있을 때 작은 자세. 명령이 늘 먼저
        const habit = comp.stay && still && !comp.motion ? petHabit(comp, day, game.clock.minute, weather) : null
        const follow = !comp.stay && still && !comp.motion && game.idle.seconds <= 15 ? petFollowPose(comp, game.idle.seconds, weather) : null
        const sleeping = still && ((wet && sameTile(cTile, EAVES) && !isIndoor(here)) || (!comp.stay && game.idle.seconds > 15 && isNear(cTile, here)) || habit?.pose === 'nap')
        const petFurnitureOccupied = new Set([...solidTiles(game.room), ...Object.values(game.npcs).filter(n => n.visible).map(n => key(npcTile(n)))])
        const petUseCandidate = habit ? petFurniturePlace(game.room, minute, habit.pose, petFurnitureOccupied) : null
        const petFurnitureHere = petUseCandidate && sameTile(cTile, petUseCandidate) ? petUseCandidate : null
        const form = sleeping ? 'curl' : baby ? 'baby' : 'adult'
        // 도트의 여섯 동작: walk(걷는 중)·wait·sniff·play·fetch·wag
        const action = comp.motion ? (comp.motion.action === 'rest' ? 'wait' : comp.motion.action) : !still ? 'walk' : sleeping ? null : habit && habit.pose !== 'nap' ? habit.pose : follow && follow !== 'nap' ? follow : null
        // 놀이 소품만 더한다. 잠자리 가구는 이용자가 설치한 방 가구 렌더링을 그대로 쓴다.
        const corner = petCornerProp(comp, day, game.clock.minute, weather)
        items.push({
          y: comp.y,
          paint: () => {
            // 동물 친구는 발밑 그림자를 그리지 않는다 (2026-10-07 사용자 — 걸을 때만 보여 어색했다)
            if (petFurnitureHere) {
              const phase = Math.floor(t / 0.3) % 4
              g.drawImage(paint(`petFurniture/object/${petFurnitureHere.item}/${facingOf(petFurnitureHere)}/${phase}`, petFurnitureObjectRows(petFurnitureHere.item as PetFurnitureId, facingOf(petFurnitureHere), phase), FURNI_PALETTE), petFurnitureHere.x * TILE, petFurnitureHere.y * TILE)
              drawSprite(g, paint(`petFurniture/${petFurnitureHere.item}/${comp.kind}/${facingOf(petFurnitureHere)}/${phase}/${baby}`, petFurnitureRows(petFurnitureHere.item as PetFurnitureId, comp.kind, facingOf(petFurnitureHere), phase, baby), ANIMAL_PALETTE[comp.kind]), comp.x, comp.y, 0, false)
            } else if (action) {
              const frame = action === 'walk' ? Math.floor(comp.walkTime * (baby ? 4 : 8)) % 4 : Math.floor(t * 6) % 4
              drawSprite(g, paint(`pet/${comp.kind}/${facing}/${action}/${frame}/${!baby}`, petMotionRows(comp.kind, facing, action, frame, baby), ANIMAL_PALETTE[comp.kind]), comp.x, comp.y, 0, false)
            } else if (sleeping) drawSprite(g, animal(comp.kind, form, side), comp.x, comp.y, 0, false)
            else drawSprite(g, paint(`pet/${comp.kind}/${facing}/wait/0/${!baby}`, petMotionRows(comp.kind, facing, 'wait', 0, baby), ANIMAL_PALETTE[comp.kind]), comp.x, comp.y, 0, false)
            if (!petFurnitureHere && corner?.art === 'petToy') drawPetProp(g, corner.art, corner.at.x, corner.at.y, corner.side === 'left' ? -10 : 10)
            if (sleeping && Math.floor(t / 3) % 3 === 0) emote(g, 'z', comp.x * TILE + 8, comp.y * TILE + 8)
          },
        })
      }

      // 기록자
      const kind = game.idle.action?.kind
      const moving = p.path.length > 0
      let facing: Facing = p.facing
      let pose: Pose = 'stand'
      const flies = butterflies(season, wet, phase, t)
      if (kind === 'look') facing = lookSide(t)
      if (kind === 'greet' || kind === 'doze') facing = 'down'
      if (kind === 'stretch') {
        facing = 'down'
        pose = 'handUp'
      }
      if (kind === 'wrist') {
        facing = 'down'
        pose = Math.floor(t * 4) % 2 ? 'wave' : 'stand'
      }
      const frame = moving ? walkFrame(p.walkTime) : 0
      const blink = kind === 'doze' || kind === 'yawn' || isBlinking(t)
      const lift = moving ? 0 : kind === 'stretch' ? 1 : kind === 'doze' ? -dozeNod(t) : breathOffset(t)
      // 가구 쓰는 동작 중이면 (계획 17 작업 3) 그 동작 그림을 지금 외형으로 — 앉는 자리가 있으면 그 칸 위에
      const act = game.act
      const playerEm = playerEventMotion(game, t)
      if (playerEm) {
        items.push({ y: p.y, paint: () => drawEventMotion(g, 'writer', playerEm, p.x, p.y, blink, season, { inky: done > 0, look: game.avatar?.look, avatar: game.avatar ? withLookDefaults(game.avatar) : undefined }) })
      } else if (act) {
        const ay = act.at ? act.at.y + 0.01 : p.y
        items.push({ y: ay, paint: () => drawPlayerAct(g, act, p, isBlinking(t), season, { inky: done > 0, look: game.avatar?.look, avatar: game.avatar ? withLookDefaults(game.avatar) : undefined }) })
      } else items.push({
        y: p.y,
        paint: () => {
          const extra = { inky: done > 0, look: game.avatar?.look, avatar: game.avatar ? withLookDefaults(game.avatar) : undefined }
          const quiet: QuietAction | null = moving ? null : kind === 'yawn' || kind === 'wrist' || kind === 'stretch' || kind === 'hum' ? kind : pose === 'wave' ? 'wave' : null
          const f = Math.floor(t * 4) % 4
          const spr = quiet
            ? paint(`quiet/${quiet}/${f}/${blink}/${lookKey('writer', season, extra)}`, quietLifeRows('writer', quiet, f, { frame: 0, blink, season, ...extra }), writerPalette(season, extra.avatar))
            : person('writer', facing, frame, blink, pose, season, extra)
          drawSprite(g, spr, p.x, p.y, lift)
          const top = Math.round(p.y * TILE) + TILE - spr.height - 2
          const cx = Math.round(p.x * TILE) + 8
          if (kind === 'doze') emote(g, 'z', cx, top)
          else if (kind === 'hum') emote(g, 'note', cx, top - Math.round(Math.sin(t * 4)))
          else if (kind === 'yawn') emote(g, 'yawn', cx, top)
          else if (!moving && game.needs.hunger >= 70 && t % 9 < 1.6) emote(g, 'hungry', cx, top)
          else if (!moving && game.needs.cold >= 60 && t % 6 < 1.4) emote(g, 'shiver', cx, top)
          else if (!moving && game.needs.heat >= 60 && t % 8 < 1.4) emote(g, 'sweat', cx, top)
          // 겨울 바깥의 입김
          if (outdoors && season === 'winter' && t % 2.4 < 0.8) {
            g.fillStyle = 'rgba(255,255,255,0.7)'
            const k = (t % 2.4) / 0.8
            g.fillRect(cx + (facing === 'left' ? -6 : 4) - Math.round(k * 2), top + 12 - Math.round(k * 3), 2 + Math.round(k), 2)
          }
        },
      })

      // 나비
      for (const b of flies) items.push({ y: b.y + 0.5, paint: () => g.drawImage(paint(`bf/${b.frame}/${b.hue}`, BUTTERFLY[b.frame], { ...SMALL_PALETTE, o: b.hue ? '#99c2ea' : '#e79b77', O: b.hue ? '#719ece' : '#eed584' }), Math.round(b.x * TILE), Math.round(b.y * TILE)) })

      items.sort((a, b) => a.y - b.y).forEach((i) => i.paint())
      const room = viewRoomAt(here)
      if (room) {
        const rx = room.x0 * TILE
        const ry = room.y0 * TILE
        const rw = room.w * TILE
        const rh = room.h * TILE
        g.fillStyle = '#1c1510'
        g.fillRect(ox - TILE, oy - TILE, W + 2 * TILE, ry - oy + TILE)
        g.fillRect(ox - TILE, ry + rh, W + 2 * TILE, oy + H - ry - rh + TILE)
        g.fillRect(ox - TILE, ry, rx - ox + TILE, rh)
        g.fillRect(rx + rw, ry, ox + W - rx - rw + TILE, rh)
      }
      } finally {
        // 도중에 오류가 나도 좌표 이동이 쌓이지 않게 반드시 되돌린다
        g.restore()
      }

      // 날씨·무지개·밤 (화면 좌표)
      if (outdoors) drawWeather(g, weather, t, W, H)
      else if (wet) {
        g.fillStyle = 'rgba(40, 60, 90, 0.08)'
        g.fillRect(0, 0, W, H)
      }
      if (rainbowVisible(day, minute) && outdoors) drawRainbow(g, W)
      const dark = darkness(minute)
      if (dark > 0) {
        g.fillStyle = `rgba(20, 22, 60, ${dark})`
        g.fillRect(0, 0, W, H)
        if (dark > 0.15) {
          const sx = (wx: number) => wx - ox
          const sy = (wy: number) => wy - oy
          const [desk] = PLACES.desk.tiles
          const [hearth] = PLACES.hearth.tiles
          if (desk && game.lampLitDay === day) glow(g, sx(desk.x * TILE + 13), sy(desk.y * TILE + 4), 34, dark * 0.9)
          if (hearth) glow(g, sx(hearth.x * TILE + 8), sy(hearth.y * TILE + 12), 22, dark * 0.6)
          if (festOn) glow(g, sx(FIRE.x * TILE + 8), sy(FIRE.y * TILE + 8), 48, dark)
          // 집집마다 창에 불빛
          for (const [x, y] of housesNow().map((h) => [h.doorX, h.y1])) glow(g, sx(x * TILE + 8), sy(y * TILE + 4), 14, dark * 0.5)
          // 길가의 등불
          for (const l of lanternLights(game)) glow(g, sx(l.x * TILE + 8), sy(l.y * TILE + 2), 26, dark * 0.8)
        }
      }
    },
  }
  return renderer
}

interface Fly {
  x: number
  y: number
  frame: 0 | 1
  hue: 0 | 1
}
/** 봄·여름 낮의 나비 (그리기와 기록자의 눈길이 같은 자리를 쓴다) */
export function butterflies(season: Season, wet: boolean, phase: string, t: number): Fly[] {
  if (wet || (season !== 'spring' && season !== 'summer') || (phase !== 'morning' && phase !== 'day')) return []
  const centers: Tile[] = [
    { x: 12, y: 3 },
    { x: 3, y: 9 },
    { x: 8, y: 24 },
  ]
  return centers.map((c, i) => ({
    x: c.x + Math.cos(t * 0.7 + i * 2) * 1.6,
    y: c.y + Math.sin(t * 1.1 + i) * 0.9 - 0.5,
    frame: (Math.abs(Math.floor(t * 6 + i)) % 2) as 0 | 1,
    hue: (i % 2) as 0 | 1,
  }))
}

// ── 여행 주사위 판 (새 장면): 마을과 같은 16픽셀 칸·같은 그림으로 여행지 동네를 짓고, 둘레 길 위 돌판에 칸 표시를 새긴다 ──

/** 돌판에 새기는 칸 표시 (8×8, 색보다 모양으로 구분 — k 먹, w 흰 종이, c 칸 색) */
const STONE_GLYPH: Record<TripCell, readonly string[]> = {
  start: ['.k......', '.kccc...', '.kcccc..', '.kccc...', '.k......', '.k......', '.k......', 'kkk.....'],
  plain: ['........', '........', '........', '........', '........', '........', '........', '........'],
  rest: ['...kk...', '...kk...', '..kcck..', '.kcccck.', '.kccwck.', '.kcccck.', '..kkkk..', '........'], // 샘물 한 방울
  item: ['........', '.cc..cc.', 'ccc..ccc', '.cckkcc.', '...kk...', '...kk...', '..kkkk..', '........'],
  star: ['...kk...', '...kk...', 'kkkkkkkk', '.kkkkkk.', '..kkkk..', '.kk..kk.', 'kk....kk', '........'],
  event: ['..kkkk..', '.kk..kk.', '.....kk.', '....kk..', '...kk...', '........', '...kk...', '........'],
  chest: ['........', '.kkkkkk.', 'kcccccck', 'kkkkkkkk', 'kccwwcck', 'kcccccck', 'kkkkkkkk', '........'],
  jump: ['........', 'k...k...', 'kk..kk..', 'kkk.kkk.', 'kkk.kkk.', 'kk..kk..', 'k...k...', '........'],
  greet: ['........', '.kk..kk.', 'kcckkcck', 'kcccccck', '.kcccck.', '..kcck..', '...kk...', '........'],
  kid: ['...kk...', '..kwwk..', '...kk...', '.kkkkkk.', '...kk...', '..k..k..', '.k....k.', '........'],
}
/** 돌판 표식의 색 (파스텔 — 모양이 먼저, 색은 작은 원으로만) */
const STONE_TINT: Record<TripCell, string> = {
  start: '#e3c9a0',
  plain: '#e6dccb',
  rest: '#a9d8ec',
  item: '#b8dea4',
  star: '#f5dc92',
  event: '#f4b6b0',
  chest: '#d3c0ee',
  jump: '#f7cfa6',
  greet: '#f6c2d6',
  kid: '#fbe3a8',
}

function tripMapFor(dest: 'harbor' | 'hillTown', season: Season): HTMLCanvasElement {
  const key = `trip/${dest}/${season}`
  let c = cachedMap(key)
  if (c) return c
  const layout = tripLayout(dest)
  c = document.createElement('canvas')
  c.width = TRIP_W * TILE
  c.height = TRIP_H * TILE
  const g = c.getContext('2d')!
  const at = (x: number, y: number) => layout.map[y]?.[x] ?? '.'
  const houseOf = (x: number, y: number) => layout.houses.find((h) => x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1)
  for (let y = 0; y < TRIP_H; y++)
    for (let x = 0; x < TRIP_W; x++) {
      const ch = at(x, y)
      const px = x * TILE
      const py = y * TILE
      const f = (color: string, dx: number, dy: number, w: number, h: number) => {
        g.fillStyle = color
        g.fillRect(px + dx, py + dy, w, h)
      }
      // 판석 길: 따뜻한 크림빛 돌, 줄눈은 옅게 (마을 흙길과 다른 이 동네의 길)
      if (ch === '@') {
        f('#efe4cf', 0, 0, 16, 16)
        f('#dccdb1', 0, (x + y) % 2 ? 7 : 8, 16, 1)
        f('#dccdb1', (x * 5 + y * 3) % 2 ? 5 : 10, 0, 1, 8)
        f('#dccdb1', (x * 3 + y) % 2 ? 11 : 3, 8, 1, 8)
        f('#f8f0e0', 1, 1, 3, 1)
        continue
      }
      if (ch === 'c' || ch === 'F') {
        // 벽돌 줄눈은 칸 안에서만 (옆 칸 잔디로 삐져나가지 않게)
        f('#f3e6c8', 0, 0, 16, 16)
        f('#e3d1a9', 0, 7, 16, 1)
        f('#e3d1a9', 0, 15, 16, 1)
        f('#e3d1a9', 7, 0, 1, 7)
        f('#e3d1a9', 3, 8, 1, 7)
        f('#e3d1a9', 11, 8, 1, 7)
        continue
      }
      const h = houseOf(x, y)
      drawGround(g, h || '^!A'.includes(ch) ? '.' : ch, x, y, season, (xx, yy) => {
        const n = at(xx, yy)
        return n === '@' || n === 'c' || n === 'F' ? ',' : n
      })
      if (h) {
        if (ch === '#' || ch === 'D') houseWallTile(g, x, y, ch, h.id, h)
        continue
      }
      switch (ch) {
        case '^':
          // 꽃화단: 낮은 크림빛 돌 테두리(화단 바깥쪽에만) 안에 흙, 그 위에 줄 맞춰 심은 꽃 넷 (꽃잎·가운데·줄기·잎)
          {
            const edge = '#efe4cf'
            const edgeDark = '#d8c7a6'
            f('#a8805c', 0, 0, 16, 16)
            f('#94704f', 0, 7, 16, 1)
            if (at(x, y - 1) !== '^') f(edge, 0, 0, 16, 2)
            if (at(x, y + 1) !== '^') {
              f(edge, 0, 13, 16, 3)
              f(edgeDark, 0, 15, 16, 1)
            }
            if (at(x - 1, y) !== '^') f(edge, 0, 0, 2, 16)
            if (at(x + 1, y) !== '^') f(edge, 14, 0, 2, 16)
            const petals = ['#f7b8c8', '#fde08e', '#ffffff', '#cdb8f0']
            for (const [bx, by, k] of [[3, 3, 0], [9, 3, 1], [3, 8, 2], [9, 8, 3]]) {
              const pc = petals[(k + x + y) % petals.length]
              f('#7fb86a', bx + 1, by + 3, 1, 3)
              f('#7fb86a', bx + 2, by + 4, 2, 1)
              f(pc, bx + 1, by, 1, 3)
              f(pc, bx, by + 1, 3, 1)
              f('#f2a33a', bx + 1, by + 1, 1, 1)
            }
          }
          break
        case '!':
          // 등불 기둥: 나무 기둥, 살구빛 초롱
          f('rgba(90,60,30,0.15)', 5, 14, 6, 2)
          f('#a07a58', 7, 4, 2, 11)
          f('#f3a58f', 5, 1, 6, 5)
          f('#ffe7a8', 6, 2, 4, 3)
          break
        case 'A':
          // 입구 아치 기둥
          f('#a07a58', 5, 0, 6, 16)
          f('#c49c74', 6, 0, 2, 16)
          f('#86634a', 4, 0, 8, 2)
          break
        default:
          if (ch !== '.') drawObject(g, ch, x, y, season)
      }
    }
  for (const h of layout.houses) drawRoof(g, h.x0, h.y0, h.x1, h.y1 - 2, (HOUSE_STYLES[h.id] ?? PLAIN_STYLE).roof)
  // 분수 (두 칸×두 칸): 돌바닥을 다 깐 뒤에 왼쪽 위 칸에서 한 번에
  for (let y = 0; y < TRIP_H; y++)
    for (let x = 0; x < TRIP_W; x++) {
      if (at(x, y) !== 'F' || at(x - 1, y) === 'F' || at(x, y - 1) === 'F') continue
      const f = (color: string, dx: number, dy: number, w: number, hh: number) => {
        g.fillStyle = color
        g.fillRect(x * TILE + dx, y * TILE + dy, w, hh)
      }
      f('rgba(90,60,30,0.15)', 1, 28, 30, 4)
      f('#cfc4b0', 1, 4, 30, 26)
      f('#eee6d6', 2, 3, 28, 26)
      f('#a9dbe8', 5, 6, 22, 19)
      f('#d6f0f6', 7, 8, 8, 2)
      f('#d6f0f6', 17, 18, 6, 1)
      f('#eee6d6', 13, 10, 6, 9)
      f('#d6f0f6', 15, 4, 2, 8)
      f('#ffffff', 15, 3, 2, 2)
    }
  // 입구 아치의 깃발 줄 (두 기둥 사이, 파스텔 깃발)
  const arch = layout.map.findIndex((row) => row.includes('A'))
  if (arch >= 0) {
    const xs = [...layout.map[arch]].flatMap((ch, x) => (ch === 'A' ? [x] : []))
    const ax0 = xs[0] * TILE + 8
    const ax1 = xs[xs.length - 1] * TILE + 8
    const ay = arch * TILE + 1
    g.fillStyle = '#86634a'
    g.fillRect(ax0, ay, ax1 - ax0, 2)
    const flags = ['#f4b6b0', '#fde4a6', '#a9c4ec', '#b8dea4', '#d3c0ee']
    for (let fx = ax0 + 2, k = 0; fx < ax1 - 4; fx += 6, k++) {
      g.fillStyle = flags[k % flags.length]
      g.fillRect(fx, ay + 2, 5, 3)
      g.fillRect(fx + 1, ay + 5, 3, 2)
      g.fillRect(fx + 2, ay + 7, 1, 1)
    }
  }
  // 보드 칸: 길에 놓인 표식 돌 — 모서리가 둥근 얇은 판석, 가운데 작은 색 원과 새긴 문양 (버튼처럼 두껍지 않게)
  BOARD.forEach((cell, i) => {
    const t = stoneTile(i)
    const px = t.x * TILE
    const py = t.y * TILE
    const f = (color: string, dx: number, dy: number, w: number, hh: number) => {
      g.fillStyle = color
      g.fillRect(px + dx, py + dy, w, hh)
    }
    // 판석 (모서리를 깎아 둥글게), 아래쪽에만 얇은 그늘
    f('#e2d6bf', 3, 2, 26, 28)
    f('#e2d6bf', 2, 3, 28, 26)
    f('#f7efdf', 4, 3, 24, 25)
    f('#f7efdf', 3, 4, 26, 23)
    f('rgba(120,90,50,0.16)', 4, 28, 24, 2)
    // 작은 색 원 (표식 색은 보조)
    f(STONE_TINT[cell], 9, 7, 14, 16)
    f(STONE_TINT[cell], 7, 9, 18, 12)
    STONE_GLYPH[cell].forEach((row, yy) =>
      [...row].forEach((chh, xx) => {
        if (chh === '.') return
        f(chh === 'k' ? '#6a5040' : chh === 'w' ? '#ffffff' : '#fffaf0', 8 + xx * 2, 7 + yy * 2, 2, 2)
      }),
    )
  })
  keepMap(key, c)
  return c
}

/** 여행 판에 서 있는 사람 (기록자·아이) */
export interface TripActor {
  x: number
  y: number
  facing: Facing
  walking: boolean
}

/** 여행 판 한 장면: 동네 그림 → 사람(발 아래 순서대로). 카메라는 판 대부분이 보이게, 가장자리에 가까울 때만 조금 움직인다 */
/** 여행 판의 사람은 두 배 크기로 (큼직한 돌판에 맞게, 도트는 정수 배라 또렷하다) */
function drawBig(g: Ctx, c: HTMLCanvasElement, wx: number, wy: number, dy = 0) {
  const k = 2
  const w = c.width * k
  const h = c.height * k
  const px = Math.round(wx * TILE + (TILE - w) / 2)
  const py = Math.round(wy * TILE + TILE - 1 - h - dy * k)
  g.fillStyle = 'rgba(90,60,30,0.18)'
  g.fillRect(px + 3, Math.round(wy * TILE) + 13, w - 6, 3)
  g.drawImage(c, px, py, w, h)
}

export function createTripRenderer(g: Ctx) {
  const cam = { x: -1, y: -1 }
  /** 화면에 보이는 칸 수 (폭은 마을과 같은 16칸 — 같은 도트 크기, 높이는 화면 비율대로) */
  const view = { scale: 1, w: VIEW_W, h: VIEW_H }
  return {
    view,
    cam,
    draw(dest: 'harbor' | 'hillTown', game: GameState, me: TripActor, kid: TripActor | null, t: number, dt: number) {
      const season = seasonOf(game.clock.day)
      const s = view.scale
      g.setTransform(s, 0, 0, s, 0, 0)
      g.imageSmoothingEnabled = false
      // 카메라: 판 가운데를 기본으로, 기록자가 화면 가장자리 3칸 안쪽에 들어가면 그만큼만 부드럽게
      const VW = view.w
      const VH = view.h
      const maxX = Math.max(0, TRIP_W - VW)
      const maxY = Math.max(0, TRIP_H - VH)
      if (cam.x < 0) {
        cam.x = Math.min(maxX, Math.max(0, me.x + 0.5 - VW / 2))
        cam.y = Math.min(maxY, Math.max(0, me.y + 0.5 - VH / 2))
      }
      const margin = 4
      let tx = cam.x
      let ty = cam.y
      if (me.x < cam.x + margin) tx = me.x - margin
      if (me.x > cam.x + VW - 1 - margin) tx = me.x - (VW - 1 - margin)
      if (me.y < cam.y + margin) ty = me.y - margin
      if (me.y > cam.y + VH - 1 - margin) ty = me.y - (VH - 1 - margin)
      tx = Math.min(maxX, Math.max(0, tx))
      ty = Math.min(maxY, Math.max(0, ty))
      const k = Math.min(1, dt * 2.5)
      cam.x += (tx - cam.x) * k
      cam.y += (ty - cam.y) * k
      const ox = Math.round((VW > TRIP_W ? -(VW - TRIP_W) / 2 : cam.x) * TILE * s) / s
      const oy = Math.round((VH > TRIP_H ? -(VH - TRIP_H) / 2 : cam.y) * TILE * s) / s
      g.fillStyle = '#cfe7b8'
      g.fillRect(0, 0, VW * TILE, VH * TILE)
      g.save()
      g.translate(-ox, -oy)
      g.drawImage(tripMapFor(dest, season), 0, 0)
      const items: { y: number; paint: () => void }[] = []
      const frameOf = (a: TripActor) => (a.walking ? walkFrame(t * 1.6) : 0)
      items.push({
        y: me.y,
        paint: () => {
          const spr = person('writer', me.facing, frameOf(me), isBlinking(t), 'stand', season, { look: game.avatar?.look, avatar: game.avatar ? withLookDefaults(game.avatar) : undefined })
          drawBig(g, spr, me.x, me.y, me.walking ? 0 : breathOffset(t))
        },
      })
      const child = game.child
      if (kid && child) {
        const grown = childStage(child, game.clock.day) !== 'toddler'
        items.push({
          y: kid.y,
          paint: () => {
            if (!grown) drawBig(g, paint('baby/walk', BABY.walk, SMALL_PALETTE), kid.x, kid.y, kid.walking ? Math.floor(t * 8) % 2 : 0)
            else {
              const rows = recolor(spriteRows('child', kid.facing, { frame: frameOf(kid), blink: isBlinking(t + 1.3), growth: 2 }), child.look === 'boy' ? { z: 'E', Z: 'M' } : { z: 'V', Z: 'X' })
              drawBig(g, paint(`kid/${child.look}/${kid.facing}/${frameOf(kid)}/${isBlinking(t + 1.3)}`, rows, PALETTE), kid.x, kid.y, kid.walking ? 0 : breathOffset(t + 1.3))
            }
          },
        })
      }
      items.sort((a, b) => a.y - b.y).forEach((it) => it.paint())
      g.restore()
    },
  }
}
