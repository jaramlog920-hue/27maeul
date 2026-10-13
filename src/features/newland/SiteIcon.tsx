// 터 가꾸기 칸의 아이콘 (2026-10-12): 새 터에 실제로 그리는 그림을 줄여서 — 건물은 다 지은 모습, 길·텃밭은 땅, 꾸미기 소재는 소재 그림
import { BG_ART, BG_PALETTE } from '../../render/bg-materials-art'
import { OLD_BUILDINGS, OLD_PROPS, OLD_TERRAIN, OLD_VILLAGE_PALETTE } from '../../render/old-village-art'
import { useEffect, useRef } from 'react'
import { isDecorKind, MAP_DECOR_CHAR, SITES, type SiteKind } from '../../engine/newland-sites'
import { mapTileIcon } from '../../render/renderer'
import { ArtIcon } from '../../shared/IconGrid'
import type { SitePick } from './SitePreview'
import { HouseArt } from './HouseLookPicker'

export function SiteIcon({ kind, size = 28 }: { kind: SitePick; size?: number }) {
  if (kind === 'eraser') return <ArtIcon rows={OLD_PROPS.plotPeg.rows} palette={OLD_VILLAGE_PALETTE} size={size} />
  if (kind === 'path' || kind === 'garden') return <ArtIcon rows={(kind === 'path' ? OLD_TERRAIN.path : OLD_TERRAIN.plantingBed).rows} palette={OLD_VILLAGE_PALETTE} size={size} />
  // 기본 길·잔디·기본 나무 (2026-10-14): 지도 그림 한 칸
  if (isDecorKind(kind) && MAP_DECOR_CHAR[kind]) return <MapTileIcon ch={MAP_DECOR_CHAR[kind]!} size={size} />
  if (isDecorKind(kind) && BG_ART[kind]) return <ArtIcon rows={BG_ART[kind]} palette={BG_PALETTE} size={size} />
  // 입주 주택·손님집은 신약 마을 집 생김새 (2026-10-13)
  if (kind === 'home' || kind === 'guest') return <HouseArt kind={kind} size={size} />
  const asset = kind === 'kidWork' ? 'cook' : (SITES[kind as SiteKind].assetId ?? kind)
  const art = OLD_BUILDINGS[asset]?.down
  return art ? <ArtIcon rows={art.rows} palette={OLD_VILLAGE_PALETTE} size={size} /> : <span aria-hidden="true">?</span>
}

function MapTileIcon({ ch, size }: { ch: ',' | '.' | 'T'; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const g = ref.current?.getContext?.('2d')
    if (!g) return
    g.imageSmoothingEnabled = false
    g.clearRect(0, 0, 16, 16)
    g.drawImage(mapTileIcon(ch), 0, 0, 16, 16)
  }, [ch])
  return <canvas ref={ref} width={16} height={16} style={{ width: size, height: size, imageRendering: 'pixelated' }} aria-hidden="true" />
}
