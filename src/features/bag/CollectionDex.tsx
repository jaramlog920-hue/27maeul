import { useEffect, useMemo, useRef, useState } from 'react'
import '../../render/dish-icons'
import { FURNI_PALETTE, FURNITURE_ART } from '../../render/furniture-art'
import { ICON_PALETTE, ICONS } from '../../render/sprites'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'
import { collectionBookArt } from './collection-art'
import { BOOK_DESIGN_GROUPS, COLLECTION_CATEGORIES, collectionEntries, type CollectionCategory, type CollectionEntry } from './collection'
import './collection.css'

/** 실제 도트의 불투명한 픽셀만 같은 색으로 칠해 미획득 실루엣을 만든다. */
function CollectionArt({ entry }: { entry: CollectionEntry }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const design = 'design' in entry.art ? entry.art.design : undefined
  const item = 'item' in entry.art ? entry.art.item : undefined
  const art = useMemo(() => {
    if (design) {
      return collectionBookArt(design)
    }
    const furniture = item && FURNITURE_ART[item]
    return furniture ? { rows: furniture.rows, palette: FURNI_PALETTE } : { rows: item ? ICONS[item] : [], palette: ICON_PALETTE }
  }, [design, item])
  const width = art.rows?.[0]?.length ?? 8
  const height = art.rows?.length ?? 8
  useEffect(() => {
    const g = ref.current?.getContext('2d')
    if (!g || !art.rows) return
    g.clearRect(0, 0, width, height)
    art.rows.forEach((row, y) => [...row].forEach((pixel, x) => {
      const color = art.palette[pixel]
      if (pixel === '.' || pixel === 'z' || !color) return
      g.fillStyle = entry.known ? color : '#8b8376'
      g.fillRect(x, y, 1, 1)
    }))
  }, [art, entry.known, width, height])
  const scale = 64 / Math.max(width, height)
  return <canvas ref={ref} width={width} height={height} className="dex-art" aria-hidden="true" style={{ width: width * scale, height: height * scale }} />
}

export function CollectionDex() {
  const game = useGame(s => s.game)
  const entries = useMemo(() => collectionEntries(game), [game])
  const [category, setCategory] = useState<CollectionCategory | 'all'>('all')
  const [onlyKnown, setOnlyKnown] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const selected = entries.find(e => e.id === picked)
  const collected = entries.filter(e => e.known).length
  const visible = COLLECTION_CATEGORIES.filter(id => category === 'all' || category === id)
  const chooseCategory = (id: CollectionCategory | 'all') => { setCategory(id); setPicked(null) }
  const grid = (shown: CollectionEntry[], all: CollectionEntry[]) => <ul className="dex-grid">
    {shown.map(entry => {
      const label = 'design' in entry.art ? t(`dex.bookGroups.${entry.art.design.kind}`) : t(`dex.categories.${entry.category}`)
      return <li key={entry.id}>
        <button className={`dex-card${entry.known ? ' known' : ' unknown'}${picked === entry.id ? ' on' : ''}`} data-entry={entry.id} aria-pressed={picked === entry.id} aria-label={entry.known ? entry.name : t('dex.unknownEntry', { category: label, n: all.indexOf(entry) + 1 })} onClick={() => setPicked(entry.id)}>
          <span className="dex-picture"><CollectionArt entry={entry} /></span>
          <span className="dex-name">{entry.known ? entry.name : '???'}</span>
          <span className="dex-state">{t(entry.known ? 'dex.obtained' : 'dex.notObtained')}</span>
        </button>
      </li>
    })}
  </ul>
  return <section className="collection-dex" aria-label={t('dex.title')}>
    <p className="dex-summary">{t('dex.collected', { n: collected, all: entries.length })}</p>
    <p className="hint">{t('dex.lead')}</p>
    <div className="dex-filters" role="group" aria-label={t('dex.categoryLabel')}>
      <button aria-pressed={category === 'all'} onClick={() => chooseCategory('all')}>{t('dex.all')}</button>
      {COLLECTION_CATEGORIES.map(id => <button key={id} aria-pressed={category === id} onClick={() => chooseCategory(id)}>{t(`dex.categories.${id}`)}</button>)}
    </div>
    <label className="dex-known-filter"><input type="checkbox" checked={onlyKnown} onChange={e => { setOnlyKnown(e.target.checked); setPicked(null) }} />{t('dex.onlyKnown')}</label>
    {selected && <div className="dex-detail" role="status">
      <CollectionArt entry={selected} />
      <div><strong>{selected.known ? selected.name : t('dex.unknown')}</strong>
        <p>{selected.known ? selected.desc : t('dex.notCollected')}</p>
        <p className="hint">{selected.hint}</p>
      </div>
    </div>}
    {visible.map(id => {
      const all = entries.filter(e => e.category === id)
      const shown = onlyKnown ? all.filter(e => e.known) : all
      return <section key={id} className="dex-category" aria-label={t(`dex.categories.${id}`)}>
        <h3>{t(`dex.categories.${id}`)} <small>{all.filter(e => e.known).length} / {all.length}</small></h3>
        {shown.length === 0 ? <p className="hint">{t('dex.empty')}</p> : id === 'books' ? BOOK_DESIGN_GROUPS.map(kind => {
          const group = all.filter(e => 'design' in e.art && e.art.design.kind === kind)
          const shownGroup = onlyKnown ? group.filter(e => e.known) : group
          if (!shownGroup.length) return null
          return <section key={kind} className="dex-book-group" aria-label={t(`dex.bookGroups.${kind}`)}>
            <h4>{t(`dex.bookGroups.${kind}`)} <small>{group.filter(e => e.known).length} / {group.length}</small></h4>
            {grid(shownGroup, group)}
          </section>
        }) : grid(shown, all)}
      </section>
    })}
  </section>
}
