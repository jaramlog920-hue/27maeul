// 마을 지도 (설정 → 마을 지도): 마을 전체를 한 장으로 펼쳐 보인다. 장소 이름과 지금 내 자리
import { useEffect, useRef } from 'react'
import { neighborById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { closedHouseIds, shelvedCount } from '../../engine/game'
import { housesNow, isHome, lockedZones, roomAt, TILE, VILLAGE_H, WIDTH, type House } from '../../engine/world'
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
}
function houseName(h: House): string {
  return HOUSE_NAME[h.id] ?? neighborById(h.id)?.role ?? ''
}
/** 집이 아닌 곳 */
const SPOTS: { name: string; x: number; y: number }[] = [
  { name: '광장', x: 24.5, y: 12.4 },
  { name: '텃밭', x: 12.5, y: 3.3 },
  { name: '포도원', x: 43.5, y: 0.6 },
  { name: '올리브 숲', x: 43.5, y: 16.2 },
  { name: '대장간', x: 43.5, y: 18.2 },
  { name: '양 우리', x: 5, y: 25.6 },
  { name: '보리밭', x: 13, y: 26.4 },
  { name: '나루', x: 24.5, y: 36 },
  { name: '호수', x: 36, y: 36 },
]
const ZONE_NAME: Record<string, string> = { vineyard: '포도원', dock: '나루', hives: '벌통' }

export function VillageMap() {
  const game = useGame((s) => s.game)
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
  const at = isHome(here) ? { x: housesNow().find((h) => h.id === 'home')!.doorX, y: housesNow().find((h) => h.id === 'home')!.y1 } : inside ? inside.door : here.y < VILLAGE_H ? here : null
  const pct = (x: number, y: number) => ({ left: `${((x + 0.5) / WIDTH) * 100}%`, top: `${((y + 0.5) / VILLAGE_H) * 100}%` })
  const locked = lockedZones(shelvedCount(game))
  // 아직 이사 오지 않은 이웃의 집(덤불로 덮인 집)도 언제 열리는지 적는다 — 서고 권수 또는 마을 단계
  const closedHouses = housesNow().filter((h) => closedHouseIds(game).includes(h.id))
  const opensAt = (id: string) => {
    const d = neighborById(id)
    if (d?.joinsAtBooks) return `${d.joinsAtBooks}권`
    if (d?.joinsAt) return fill(T.ui.villageLevel, { n: d.joinsAt })
    return null
  }
  return (
    <div className="dialog village-map" role="dialog" aria-label="마을 지도">
      <h2>마을 지도</h2>
      <div className="vmap">
        <canvas ref={ref} width={WIDTH * TILE} height={VILLAGE_H * TILE} aria-hidden="true" />
        {housesNow().map((h) => (
          <span key={h.id} className="vmap-label" style={pct((h.x0 + h.x1) / 2, h.y0 - 0.1)}>
            {houseName(h)}
          </span>
        ))}
        {SPOTS.filter((s) => !locked.some((z) => ZONE_NAME[z.id] === s.name)).map((s) => (
          <span key={s.name} className="vmap-label soft" style={pct(s.x - 0.5, s.y)}>
            {s.name}
          </span>
        ))}
        {locked.map((z) => (
          <span key={z.id} className="vmap-label locked" style={pct((z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2)}>
            🔒 {z.books}권
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
        {at && (
          <span className="vmap-me" style={pct(at.x, at.y)} aria-label="지금 내 자리">
            ●
          </span>
        )}
      </div>
      <p className="hint">● 지금 내 자리 · 🔒 서고에 책을 더 꽂거나(권) 이웃과 더 가까워지면(마을 단계) 열리는 곳</p>
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
