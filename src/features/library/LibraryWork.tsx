import { LIBRARY_LABELS, libraryPalette, libraryWorkRows, type LibraryAction } from '../../render/library-art'
import type { Binding, BookDetailChoice } from '../../engine/binding'
import { bookDetailPalette, bookDetailWorkRows } from '../../render/life-additions-prop-art'
import { t } from '../../shared/i18n'
import type { Book } from '../../engine/types'
import type { Grade } from '../../engine/library'

export function PixelArt({ rows, palette }: { rows: string[]; palette: Record<string, string> }) {
  return <svg viewBox={`0 0 ${rows[0].length} ${rows.length}`} aria-hidden="true" focusable="false" shapeRendering="crispEdges" preserveAspectRatio="none">
    {rows.flatMap((row, y) => [...row].map((c, x) => c === '.' ? null : <rect key={`${x}/${y}`} x={x} y={y} width="1" height="1" fill={palette[c]} />))}
  </svg>
}

/** 한 번 재생 후 완성 프레임에 멈춘다. 상태·재료 소비는 기존 게임 액션이 맡는다. */
export function LibraryWork({ book, action, binding, grade, detail }: { book: Book; action: LibraryAction; binding?: Binding; grade?: Grade; detail?: Exclude<BookDetailChoice, 'none'> }) {
  // 덧장식을 고른 때: 그 장식을 다는 손동작 (bookDetailWorkRows, 다른 창 도트 2026-10-08 연결)
  if (detail) {
    const color = binding?.special?.color ?? 'cream'
    const label = t(`bindDetail.${detail}`)
    return <figure className="library-work" aria-label={label}>
      <div className="library-work-window"><div className="library-work-strip">
        {[0, 1, 2, 3].map(f => <div className="library-work-frame" key={f}><PixelArt rows={bookDetailWorkRows(detail, color, f)} palette={bookDetailPalette(color) as Record<string, string>} /></div>)}
      </div></div>
      <figcaption>{label}</figcaption>
    </figure>
  }
  const palette = libraryPalette(book, binding, grade)
  return <figure className="library-work" aria-label={LIBRARY_LABELS[action]}>
    <div className="library-work-window"><div className="library-work-strip">
      {[0, 1, 2, 3].map(f => <div className="library-work-frame" key={f}><PixelArt rows={libraryWorkRows(book, action, f, binding, grade)} palette={palette} /></div>)}
    </div></div>
    <figcaption>{LIBRARY_LABELS[action]}</figcaption>
  </figure>
}
