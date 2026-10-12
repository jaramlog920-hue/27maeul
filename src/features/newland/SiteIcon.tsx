// 터 가꾸기 칸의 아이콘 (2026-10-12): 새 터에 실제로 그리는 그림을 줄여서 — 건물은 다 지은 모습, 길·텃밭은 땅, 꾸미기 소재는 소재 그림
import { BG_ART, BG_PALETTE } from '../../render/bg-materials-art'
import { OLD_BUILDINGS, OLD_PROPS, OLD_TERRAIN, OLD_VILLAGE_PALETTE } from '../../render/old-village-art'
import { isDecorKind, SITES, type SiteKind } from '../../engine/newland-sites'
import { ArtIcon } from '../../shared/IconGrid'
import type { SitePick } from './SitePreview'
import { HouseArt } from './HouseLookPicker'

export function SiteIcon({ kind, size = 28 }: { kind: SitePick; size?: number }) {
  if (kind === 'eraser') return <ArtIcon rows={OLD_PROPS.plotPeg.rows} palette={OLD_VILLAGE_PALETTE} size={size} />
  if (kind === 'path' || kind === 'garden') return <ArtIcon rows={(kind === 'path' ? OLD_TERRAIN.path : OLD_TERRAIN.plantingBed).rows} palette={OLD_VILLAGE_PALETTE} size={size} />
  if (isDecorKind(kind) && BG_ART[kind]) return <ArtIcon rows={BG_ART[kind]} palette={BG_PALETTE} size={size} />
  // 입주 주택·손님집은 신약 마을 집 생김새 (2026-10-13)
  if (kind === 'home' || kind === 'guest') return <HouseArt kind={kind} size={size} />
  const asset = kind === 'kidWork' ? 'cook' : (SITES[kind as SiteKind].assetId ?? kind)
  const art = OLD_BUILDINGS[asset]?.down
  return art ? <ArtIcon rows={art.rows} palette={OLD_VILLAGE_PALETTE} size={size} /> : <span aria-hidden="true">?</span>
}
