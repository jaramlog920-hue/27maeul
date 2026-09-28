import { useEffect, useRef } from 'react'
import { itemName } from '../content/text'
import { ICON_PALETTE, ICONS } from '../render/sprites'
import type { ItemId } from '../engine/types'

/** 8×8 도트 아이콘을 크게 그린다 (캔버스가 없는 테스트 환경에서는 글자만) */
export function ItemIcon({ id, size = 24 }: { id: ItemId; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const g = ref.current?.getContext?.('2d')
    const rows = ICONS[id]
    if (!g || !rows) return
    g.clearRect(0, 0, 8, 8)
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const c = ICON_PALETTE[ch]
        if (ch === '.' || !c) return
        g.fillStyle = c
        g.fillRect(x, y, 1, 1)
      }),
    )
  }, [id])
  return <canvas ref={ref} className="item-icon" width={8} height={8} style={{ width: size, height: size }} role="img" aria-label={itemName(id)} />
}
