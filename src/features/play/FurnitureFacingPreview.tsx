import { useEffect, useRef } from 'react'
import { FURNI_PALETTE } from '../../render/furniture-art'
import { facingArt } from '../../render/furniture-facing'
import type { Facing, ItemId } from '../../engine/types'

/** 설치 전에도 게임이 쓰는 방향별 원본 도트를 보여 준다. */
export function FurnitureFacingPreview({ item, facing }: { item: ItemId; facing: Facing }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const art = facingArt(item, facing)
  useEffect(() => {
    const g = ref.current?.getContext('2d')
    if (!g || !art) return
    g.clearRect(0, 0, art.rows[0].length, art.rows.length)
    art.rows.forEach((row, y) => [...row].forEach((c, x) => {
      if (c === '.' || c === 'z' || !FURNI_PALETTE[c]) return
      g.fillStyle = FURNI_PALETTE[c]
      g.fillRect(x, y, 1, 1)
    }))
  }, [art])
  if (!art) return null
  const width = art.rows[0].length, height = art.rows.length
  const scale = 48 / Math.max(width, height)
  return <canvas ref={ref} width={width} height={height} className="furniture-facing-preview" aria-hidden="true" style={{ width: width * scale, height: height * scale }} />
}
