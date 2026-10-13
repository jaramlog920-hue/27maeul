import { villageBookCount } from "../../engine/progression"
// 마을 지도 (설정 → 마을 지도): 마을 전체를 한 장으로 펼쳐 보인다. 장소 이름과 지금 내 자리
import { useEffect, useRef, useState } from 'react'
import { neighborById } from '../../content/catalog'
import { T } from '../../content/text'
import { closedHouseIds } from '../../engine/game'
import { housesNow, isHome, lockedZones, placeActive, roomAt, TILE, VILLAGE_H, WIDTH, type House } from '../../engine/world'
import { LODGING_ROOF_TOP } from '../../engine/lodging'
import type { PlaceId } from '../../engine/types'
import { drawVillageMap } from '../../render/renderer'
import { useGame } from '../../store/game-store'

/** 지도에 적는 집 이름 (이웃 집은 그 이웃의 이름으로) */
const HOUSE_NAME: Record<string, string> = {
  home: '내 집',
  library: '서고',
  hall: '사랑방',
  teahouse: '찻집',
  baker: '빵집',
  apothecary: '약방',
  carpenter: '목수네',
  postman: '편지 집',
  weaver: '베 짜는 집',
  child: '배움터',
  grandpa: '할아버지 집',
  beekeeper: '벌 치는 집',
  fisher: '어부네',
  // 대장간 마당에 선 2층 공동 주택 (아래층에 대장간·기름틀, 위층에 손님방)
  lodging: '공동 주택',
}
function houseName(h: House): string {
  return HOUSE_NAME[h.id] ?? neighborById(h.id)?.role ?? ''
}
/** 건물을 누르면 아래에 보이는 설명 (2026-10-14 사용자: 잠긴 건물도) — 이웃 집은 그 이웃과 하는 일로 */
const HOUSE_DESC: Record<string, string> = {
  home: '내가 사는 집이에요. 책상에서 말씀을 옮겨 적어요.',
  library: '다 쓴 책을 꽂아 두는 곳이에요. 스물일곱 칸을 채워 가요.',
  hall: '이웃이 모이는 방이에요. 벽 게시판에 날마다 이웃 부탁이 붙어요.',
  teahouse: '차를 마시며 쉬어 가는 곳이에요.',
  child: '마을 아이들이 배우러 오는 곳이에요.',
  lodging: '아래층에는 대장간과 기름틀, 위층에는 손님방이 있어요.',
}
function houseDesc(h: House): string {
  if (HOUSE_DESC[h.id]) return HOUSE_DESC[h.id]
  const d = neighborById(h.id)
  return d?.job ? `${d.job} ${d.role}의 집이에요.` : ''
}
/** 집이 아닌 곳 (2026-10-12 지금 지도에 맞춤: 대장간 마당은 공동 주택이 되었다) */
const SPOTS: { name: string; x: number; y: number }[] = [
  { name: '광장', x: 24.5, y: 12.4 },
  { name: '우물', x: 24.5, y: 15.3 },
  { name: '매대', x: 30, y: 20.3 },
  { name: '텃밭', x: 12.5, y: 3.3 },
  { name: '언덕', x: 14.5, y: 10.3 },
  { name: '포도원', x: 43.5, y: 0.6 },
  { name: '올리브 숲', x: 43.5, y: 10.3 },
  { name: '양 우리', x: 5, y: 25.6 },
  { name: '보리밭', x: 13, y: 26.4 },
  { name: '정자', x: 13.5, y: 32.3 },
  { name: '갈대밭', x: 6.5, y: 33.3 },
  { name: '나루', x: 24.5, y: 36 },
  { name: '호수', x: 36, y: 36 },
]
/** 주민과 함께 지은 공동 시설 — 진행 중이거나 다 지은 것만 (placeActive) */
const FACILITY_SPOTS: { place: PlaceId; name: string; x: number; y: number }[] = [
  { place: 'shadeSpot', name: '그늘막', x: 30.5, y: 5.3 },
  { place: 'signPost', name: '안내판', x: 12.5, y: 12.6 },
  { place: 'commonBench', name: '긴 벤치', x: 28.5, y: 23.3 },
  { place: 'flowerBed', name: '꽃밭', x: 12.5, y: 9.2 },
]
const ZONE_NAME: Record<string, string> = { vineyard: '포도원', dock: '나루', hives: '벌통' }
const ZONE_DESC: Record<string, string> = {
  vineyard: '포도나무가 줄지어 선 밭이에요.',
  dock: '호숫가에 배를 대는 나루예요.',
  hives: '벌통이 놓인 들판이에요.',
}

export function VillageMap() {
  const game = useGame((s) => s.game)
  const [pick, setPick] = useState<{ name: string; desc: string; lock?: string } | null>(null)
  const closeModal = useGame((s) => s.closeModal)
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const g = ref.current?.getContext('2d')
    if (!g) return
    try {
      drawVillageMap(g, game)
    } catch {
      /* 그림을 그릴 수 없는 곳(시험 환경)에서는 비워 둔다 */
    }
  }, [game])
  const here = { x: Math.round(game.player.x), y: Math.round(game.player.y) }
  // 집 안에 있으면 그 집 문 앞에 표시
  const inside = roomAt(here)
  // 새 터에 있으면 이 지도 위에 내 자리는 없다 (새 터 칸은 첫 마을 칸이 아니다)
  const away = (game.map ?? 'village') !== 'village'
  const at = away ? null : isHome(here) ? { x: housesNow().find((h) => h.id === 'home')!.doorX, y: housesNow().find((h) => h.id === 'home')!.y1 } : inside ? inside.door : here.y < VILLAGE_H ? here : null
  const pct = (x: number, y: number) => ({ left: `${((x + 0.5) / WIDTH) * 100}%`, top: `${((y + 0.5) / VILLAGE_H) * 100}%` })
  const locked = lockedZones(villageBookCount(game))
  // 아직 이사 오지 않은 이웃의 집(덤불로 덮인 집)도 언제 열리는지 적는다 — 서고 권수 또는 마을 단계
  // 잠긴 구역 안에 있는 집은 구역 자물쇠 하나로 충분하다 (벌 치는 집 + 벌통 들판이 둘 다 6권으로 겹쳐 보이던 것)
  const inLockedZone = (h: House) => {
    const cx = (h.x0 + h.x1) / 2
    const cy = (h.y0 + h.y1) / 2
    return locked.some((z) => cx >= z.x0 && cx <= z.x1 && cy >= z.y0 && cy <= z.y1)
  }
  const closedHouses = housesNow().filter((h) => closedHouseIds(game).includes(h.id) && !inLockedZone(h))
  const opensAt = (id: string) => {
    const d = neighborById(id)
    // 마을 단계는 없어졌다 (2026-10-07 사용자) — 서고 권수로 열리는 집만 적는다
    return d?.joinsAtBooks ? `${d.joinsAtBooks}권` : null
  }
  return (
    <div className="dialog village-map" role="dialog" aria-label="마을 지도">
      <h2>마을 지도</h2>
      <div className="vmap">
        <canvas ref={ref} width={WIDTH * TILE} height={VILLAGE_H * TILE} aria-hidden="true" />
        {/* 잠긴 구역 안의 집(덤불에 덮인 집)은 구역 자물쇠 이름표만 — 이름표가 겹치지 않게 */}
        {housesNow().filter((h) => !inLockedZone(h)).map((h) => (
          // 공동 주택은 지붕 위가 투명한 여백이라 지붕 꼭대기에 이름을 단다
          <span key={h.id} className="vmap-label" style={pct((h.x0 + h.x1) / 2, (h.id === 'lodging' ? LODGING_ROOF_TOP : h.y0) - 0.1)}>
            {houseName(h)}
          </span>
        ))}
        {SPOTS.filter((s) => !locked.some((z) => ZONE_NAME[z.id] === s.name)).map((s) => (
          <span key={s.name} className="vmap-label soft" style={pct(s.x - 0.5, s.y)}>
            {s.name}
          </span>
        ))}
        {FACILITY_SPOTS.filter((s) => placeActive(s.place)).map((s) => (
          <span key={s.place} className="vmap-label soft" style={pct(s.x - 0.5, s.y)}>
            {s.name}
          </span>
        ))}
        {locked.map((z) => (
          // 구역 위쪽(이름 자리)에 이름과 함께 — 가운데에 두면 밭 한복판에 처져 보였다 (2026-10-07 사용자)
          <span key={z.id} className="vmap-label locked" style={pct((z.x0 + z.x1) / 2 - 0.5, z.y0 - 0.4)}>
            🔒 {ZONE_NAME[z.id]} {z.books}권
          </span>
        ))}
        {closedHouses.map((h) => {
          const when = opensAt(h.id)
          return when ? (
            <span key={`lock-${h.id}`} className="vmap-label locked" style={pct((h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2 + 0.5)}>
              🔒 {when}
            </span>
          ) : null
        })}
        {/* 건물 자리를 누르면 설명 (이름표는 작아서 건물 칸 전체를 누르는 자리로) */}
        {housesNow().map((h) => {
          const closed = closedHouseIds(game).includes(h.id)
          const zone = locked.find((z) => { const cx = (h.x0 + h.x1) / 2, cy = (h.y0 + h.y1) / 2; return cx >= z.x0 && cx <= z.x1 && cy >= z.y0 && cy <= z.y1 })
          const when = zone ? `${zone.books}권` : closed ? opensAt(h.id) : null
          const name = houseName(h)
          const box = { left: `${(h.x0 / WIDTH) * 100}%`, top: `${(h.y0 / VILLAGE_H) * 100}%`, width: `${((h.x1 - h.x0 + 1) / WIDTH) * 100}%`, height: `${((h.y1 - h.y0 + 1) / VILLAGE_H) * 100}%` }
          return (
            <button key={`hit-${h.id}`} type="button" className="vmap-hit" style={box} aria-label={`${name} 설명`}
              onClick={() => setPick({ name, desc: houseDesc(h), ...(when ? { lock: when } : closed ? { lock: '' } : {}) })} />
          )
        })}
        {locked.map((z) => (
          <button key={`hit-${z.id}`} type="button" className="vmap-hit" aria-label={`${ZONE_NAME[z.id]} 설명`}
            style={{ left: `${(z.x0 / WIDTH) * 100}%`, top: `${(z.y0 / VILLAGE_H) * 100}%`, width: `${((z.x1 - z.x0 + 1) / WIDTH) * 100}%`, height: `${((z.y1 - z.y0 + 1) / VILLAGE_H) * 100}%` }}
            onClick={() => setPick({ name: ZONE_NAME[z.id], desc: ZONE_DESC[z.id] ?? '', lock: `${z.books}권` })} />
        ))}
        {at && (
          <span className="vmap-me" style={pct(at.x, at.y)} aria-label="지금 내 자리">
            ●
          </span>
        )}
      </div>
      {pick ? (
        <div className="vmap-info" role="status">
          <h3>{pick.lock !== undefined && '🔒 '}{pick.name}</h3>
          {pick.desc && <p>{pick.desc}</p>}
          {pick.lock !== undefined && <p className="hint">{pick.lock ? `서고에 ${pick.lock}을 꽂으면 열려요.` : '아직 닫혀 있어요.'}</p>}
        </div>
      ) : (
        <p className="hint">● 내 자리 · 🔒 서고 권수 · 건물을 누르면 설명</p>
      )}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
