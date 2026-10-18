import { villageBookCount } from "../../engine/progression"
// 마을 지도 (설정 → 마을 지도): 마을 전체를 한 장으로 펼쳐 보인다. 장소 이름과 지금 내 자리
import { useEffect, useRef, useState } from 'react'
import { neighborById } from '../../content/catalog'
import { T } from '../../content/text'
import { closedHouseIds } from '../../engine/game'
import { housesNow, isHome, lockedZones, placeActive, roomAt, ZONES, TILE, VILLAGE_H, WIDTH, type House } from '../../engine/world'
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
/** 건물·장소를 누르면 팝업으로 보이는 설명 (2026-10-14 사용자: 자세히, 잠긴 곳도, 언덕 같은 장소도) */
const HOUSE_DESC: Record<string, string> = {
  home: '내가 사는 집이에요. 책상에서 말씀을 한 절씩 옮겨 적고, 침대에서 하루를 마쳐요. 잠들기 전에는 모아 둔 구절을 하나 읽어요. 문 앞 편지 바구니에는 아침마다 편지와 필사 부탁이 들어와요.',
  library: "다 쓴 책을 꽂는 마을 서고예요. 꽂기 전에 퀴즈를 풀면 책등에 은박이나 금박이 입혀져요. 틀린 구절은 '다시 읽을 구절'이 되어, 잠자리나 벤치에서 읽을 구절을 고를 때 먼저 나와요. 책이 쌓이면 방명록 손님이 들르고 마을별 서고 순위도 열려요.",
  hall: '저녁 6시부터 8시 반까지 이웃들이 모여 놀아요. 같이 놀면 마음이 조금씩 올라요. 벽 게시판에는 날마다 이웃 부탁과 마을을 편하게 만들 안이 붙어요. 모임 장소로도 쓸 수 있어요.',
  teahouse: '웬델이 차를 내는 정원 찻집이에요. 이웃들이 차를 마시러 들러 앉아 있고, 비 오는 날에만 오는 이웃도 있어요. 모임 장소로 쓸 수 있고, 연인이 되면 함께 와서 잠깐 시간을 보낼 수 있어요. 처음 온 날은 사진이 남아요.',
  baker: '헤이즐의 빵집이에요. 일하는 시간에 가면 두 시간 함께 일하고 수고비를 받아요.',
  apothecary: '세이지의 약방이에요. 들에서 캔 약초는 장날 좌판에서 팔 수 있어요.',
  carpenter: '제본 골목의 목수 아서의 집이에요. 재료 궤짝, 그을음 받이, 갈대 말리는 틀 같은 살림을 부탁하면 다음 날 아침에 지어 줘요.',
  postman: '마일로의 집이에요. 마을 편지와 떠난 아이가 보내는 편지를 날라요.',
  weaver: '베 짜는 아이리스의 집이에요.',
  child: '마을 아이들이 배우는 곳이에요. 아이를 맡기면 저녁 6시에 돌아와요. 아이 작품을 보여 주는 날도 있어요.',
  grandpa: '포도원 할아버지 버나드의 집이에요. 포도원에서 익은 송이를 딸 수 있어요.',
  beekeeper: '벌 치는 클로버의 집이에요. 가까워지면 꿀을 나눠 줘요.',
  fisher: '어부 핀의 집이에요. 맑은 날 나루에서 함께 일할 수 있고, 궂은 날은 쉬어요.',
  lodging: '아래층에는 대장간과 기름틀이 있어요. 대장간에서는 풀무질을 돕고, 기름틀에서는 올리브로 기름을 짜요. 위층 손님방에는 여행 손님이 며칠씩 묵어 가요.',
}
function houseDesc(h: House): string {
  if (HOUSE_DESC[h.id]) return HOUSE_DESC[h.id]
  const d = neighborById(h.id)
  return d?.job ? `${d.job} ${d.role}의 집이에요.` : ''
}
const SPOT_DESC: Record<string, string> = {
  광장: '계절 잔치와 결혼 잔치가 열리는 곳이에요. 잔치 날에는 저녁 6시에 모닥불 곁으로 모여요.',
  우물: '물을 길어요. 물이 있어야 잉크도 만들고 빵도 구워요.',
  매대: '가진 물건을 언제든 팔 수 있어요.',
  텃밭: '장날에 산 씨앗을 심고 물을 주면 자라요. 익으면 거두고, 겨울에는 흙도 쉬어요.',
  '언덕 쉼터': '벤치에 앉아 모아 둔 구절을 읽으면 피로가 풀려요. 잠시 앉아 쉬거나 밤에는 별을 볼 수 있어요. 연인과 함께 오는 곳이기도 해요.',
  포도원: '포도나무가 줄지어 선 밭이에요. 익은 송이를 따요.',
  '올리브 숲': '올리브를 주워요. 모은 올리브는 기름틀에서 기름이 돼요.',
  '양 우리': '양치기 오웬이 양을 돌보는 곳이에요.',
  보리밭: '보리를 거둬요. 보리와 물이 있으면 빵을 구울 수 있어요.',
  정자: '호숫가 정자예요. 노을 지는 맑은 날, 연인과 함께 시간을 보내요. 모임 장소로도 쓸 수 있어요.',
  갈대밭: '갈대를 꺾어요. 갈대는 파피루스 재료가 돼요.',
  나루: `신약 ${ZONES.find(z => z.id === 'dock')!.books}권을 마치면 열리는 나루예요. 사도행전 완필 여부와 관계없이 이용할 수 있어요. 핀이 이곳에서 일해요.`,
  벌통: `신약 ${ZONES.find(z => z.id === 'hives')!.books}권을 마치면 열리는 벌통 들판이에요. 클로버가 벌을 돌보는 곳이에요.`,
  호수: '비 온 다음 날 아침엔 가끔 호수 위로 무지개가 떠요.',
  그늘막: '이웃과 함께 지은 그늘막이에요. 더운 날 쉬어 가요.',
  안내판: '이웃과 함께 세운 안내판이에요.',
  '긴 벤치': '이웃과 함께 놓은 긴 벤치예요.',
  꽃밭: '이웃과 함께 가꾼 꽃밭이에요. 철마다 다른 꽃이 피고, 관찰 모임 장소로도 쓸 수 있어요.',
}
/** 집이 아닌 곳 (2026-10-12 지금 지도에 맞춤: 대장간 마당은 공동 주택이 되었다) */
const SPOTS: { name: string; x: number; y: number }[] = [
  { name: '광장', x: 24.5, y: 12.4 },
  { name: '우물', x: 24.5, y: 15.3 },
  { name: '매대', x: 30, y: 20.3 },
  { name: '텃밭', x: 12.5, y: 3.3 },
  { name: '언덕 쉼터', x: 14.5, y: 10.3 },
  { name: '포도원', x: 43.5, y: 0.6 },
  { name: '올리브 숲', x: 43.5, y: 10.3 },
  { name: '양 우리', x: 5, y: 25.6 },
  { name: '보리밭', x: 13, y: 26.4 },
  { name: '정자', x: 13.5, y: 32.3 },
  { name: '갈대밭', x: 6.5, y: 33.3 },
  { name: '나루', x: 24.5, y: 36 },
  { name: '벌통', x: 43.5, y: 26.1 },
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
  vineyard: SPOT_DESC['포도원'],
  dock: SPOT_DESC['나루'],
  hives: SPOT_DESC['벌통'],
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
        {[...SPOTS.filter((sp) => !locked.some((z) => ZONE_NAME[z.id] === sp.name)), ...FACILITY_SPOTS.filter((sp) => placeActive(sp.place))].map((sp) => (
          <button key={`hit-${sp.name}`} type="button" className="vmap-hit" aria-label={`${sp.name} 설명`}
            style={{ left: `${((sp.x - 2) / WIDTH) * 100}%`, top: `${((sp.y - 0.5) / VILLAGE_H) * 100}%`, width: `${(3 / WIDTH) * 100}%`, height: `${(2 / VILLAGE_H) * 100}%` }}
            onClick={() => setPick({ name: sp.name, desc: SPOT_DESC[sp.name] ?? '' })} />
        ))}
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
      <p className="hint">● 내 자리 · 🔒 서고 권수</p>
      {pick && (
        <div className="vmap-pop" role="dialog" aria-label={`${pick.name} 설명`} onClick={() => setPick(null)}>
          <div className="vmap-info" role="status" onClick={(e) => e.stopPropagation()}>
            <h3>{pick.lock !== undefined && '🔒 '}{pick.name}</h3>
            {pick.desc && <p>{pick.desc}</p>}
            {pick.lock !== undefined && <p className="hint">{pick.lock ? `서고에 ${pick.lock}을 꽂으면 열려요.` : '아직 닫혀 있어요.'}</p>}
            <div className="actions"><button onClick={() => setPick(null)}>{T.ui.close}</button></div>
          </div>
        </div>
      )}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
