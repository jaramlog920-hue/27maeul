import { useEffect, useMemo, useRef, useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { personName } from '../../content/gen-text'
import { seasonOf } from '../../engine/clock'
import { canRenamePerson, familyTreeLayout, ME, MY_CHILD, renamePerson, RENAME_MAX, withPlayerFamily, type TreeNode } from '../../engine/family-tree'
import { saveGame } from '../../engine/save'
import { BAKER_BABY_ID, ensureBakerBaby, newGenState, type GenPerson } from '../../engine/gen'
import { babyStage } from '../../engine/stories'
import { BABY, SMALL_PALETTE } from '../../render/sprites'
import { residentIsElder } from '../../render/elder-details'
import { genPortrait, neighborPortrait } from '../../render/renderer'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'
import './family-tree.css'

function Face({ person, known, day, elder }: { person: GenPerson; known: boolean; day: number; elder: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    try {
      // 아기는 아기 그림으로 (빵집 아기는 자라는 날에 맞춰, 그 밖의 아기는 누운 아기 — 2026-10-12 점검 16)
      if (person.stage === 'baby') {
        const stage = person.id === BAKER_BABY_ID ? babyStage(day) : 'baby'
        if (stage === 'none') return
        const rows = BABY[stage]
        canvas.width = 48
        canvas.height = 56
        ctx.globalAlpha = known ? 1 : 0.3
        rows.forEach((row, y) => [...row].forEach((pixel, x) => {
          if (!SMALL_PALETTE[pixel]) return
          ctx.fillStyle = known ? SMALL_PALETTE[pixel] : '#000'
          ctx.fillRect((48 - row.length * 3) / 2 + x * 3, 56 - rows.length * 3 + y * 3, 3, 3)
        }))
        return
      }
      const def = neighborById(person.npc ?? person.id)
      const art = def ? neighborPortrait(def, seasonOf(day), elder) : genPortrait(person, seasonOf(day))
      canvas.width = 48
      canvas.height = 56
      ctx.imageSmoothingEnabled = false
      if (!known) ctx.filter = 'brightness(0) opacity(0.3)'
      ctx.drawImage(art, (48 - art.width * 3) / 2, 56 - art.height * 3, art.width * 3, art.height * 3)
    } catch { /* 시험 환경에서는 그림 없이 이름과 연결선을 보여 준다. */ }
  }, [person, known, day, elder])
  return <canvas ref={ref} aria-hidden="true" />
}

export function FamilyTree({ personId, neighborId }: { personId: string; neighborId: string }) {
  const game = useGame(s => s.game)
  const open = useGame(s => s.open)
  const close = useGame(s => s.closeModal)
  const [focus, setFocus] = useState(personId)
  const viewport = useRef<HTMLDivElement>(null)
  // 우리 가족(주인공·우리 아이)도 가계도에 (2026-10-12 사용자 결정)
  const g = useMemo(() => withPlayerFamily(ensureBakerBaby(game.gen ?? newGenState(CONTENT, 0, game.clock.day), game.clock.day), game), [game])
  const layout = familyTreeLayout(g, focus)
  const focusNode = layout?.nodes.find(node => node.id === focus)
  useEffect(() => {
    const el = viewport.current
    if (!el || !focusNode) return
    el.scrollLeft = Math.max(0, focusNode.x - el.clientWidth / 2)
    el.scrollTop = Math.max(0, focusNode.y - el.clientHeight / 2 + 48)
  }, [focusNode?.x, focusNode?.y])
  const name = (id: string) => (id === ME ? game.avatar?.name || '나' : id === MY_CHILD ? game.child?.name ?? '' : personName({ ...game, gen: g }, id))
  // 마을에서 태어난 아이는 이름을 바꿀 수 있다 (2026-10-12 사용자) — 아직 모르는 사람('?')은 빼고
  const [draft, setDraft] = useState<string | null>(null)
  useEffect(() => setDraft(null), [focus])
  const canRename = focus !== ME && canRenamePerson(g, focus) && name(focus) !== t('gen.unknown')
  const rename = () => {
    // 우리 아이 이름은 game.child에 (가계도용 자리는 저장하지 않는다)
    if (focus === MY_CHILD) {
      const nm = (draft ?? '').replace(/\s+/g, ' ').trim().slice(0, RENAME_MAX)
      const cur = useGame.getState().game
      if (nm && cur.child) { const game2 = { ...cur, child: { ...cur.child, name: nm } }; saveGame(game2); useGame.setState({ game: game2 }) }
      setDraft(null)
      return
    }
    const next = renamePerson(useGame.getState().game.gen ?? g, focus, draft ?? '')
    if (next !== (useGame.getState().game.gen ?? g)) {
      const game2 = { ...useGame.getState().game, gen: next }
      saveGame(game2)
      useGame.setState({ game: game2 })
    }
    setDraft(null)
  }
  const edgePath = (from: TreeNode, to: TreeNode, kind: string) => {
    if (kind === 'spouse') return `M ${from.x + (from.x < to.x ? 28 : -28)} ${from.y + 30} H ${to.x + (from.x < to.x ? -28 : 28)}`
    const middle = (from.y + 84 + to.y) / 2
    return `M ${from.x} ${from.y + 84} V ${middle} H ${to.x} V ${to.y}`
  }
  return (
    <div className="dialog genealogy" role="dialog" aria-label={t('familyTree.title', { name: name(focus) })}>
      <h2>{t('familyTree.title', { name: name(focus) })}</h2>
      <p className="hint">{t('familyTree.lead')}</p>
      {g && layout?.nodes.length ? <>
        <div className="genealogy-viewport" ref={viewport} role="region" aria-label={t('familyTree.canvas')} tabIndex={0}>
          <div className="genealogy-board" style={{ width: layout.width, height: layout.height }}>
            <svg width={layout.width} height={layout.height} aria-hidden="true">
              {layout.edges.map(edge => {
                const from = layout.nodes.find(node => node.id === edge.from)!, to = layout.nodes.find(node => node.id === edge.to)!
                return <path key={`${edge.kind}:${edge.from}:${edge.to}`} d={edgePath(from, to, edge.kind)} className={`genealogy-line ${edge.kind}`} />
              })}
            </svg>
            {layout.nodes.map(node => {
              const person = g.persons[node.id], label = name(node.id)
              return <button key={node.id} className={`genealogy-person${node.id === focus ? ' selected' : ''}`} style={{ left: node.x - 50, top: node.y }} aria-pressed={node.id === focus} aria-label={t('familyTree.person', { name: label, relation: t(`familyTree.relations.${node.relation}`) })} onClick={() => setFocus(node.id)}>
                <span className="genealogy-face"><Face person={person} known={label !== t('gen.unknown')} day={game.clock.day} elder={residentIsElder(g, node.id)} /></span>
                <strong>{label}</strong><small>{t(`familyTree.relations.${node.relation}`)}{node.id === BAKER_BABY_ID || person.stage === 'baby' ? ` · ${t(`gen.growthStage.${person.stage}`)}` : ''}</small>
              </button>
            })}
          </div>
        </div>
        <p className="genealogy-legend"><span>{t('familyTree.parentLine')}</span><span>{t('familyTree.spouseLine')}</span><span>{t('familyTree.kinLine')}</span></p>
        {canRename && <form className="genealogy-rename" onSubmit={e => { e.preventDefault(); rename() }}>
          {draft !== null && <input aria-label={t('familyTree.rename')} value={draft} maxLength={RENAME_MAX} autoFocus onChange={e => setDraft(e.target.value)} />}
          <button type={draft === null ? 'button' : 'submit'} onClick={draft === null ? () => setDraft(g.persons[focus]?.name ?? '') : undefined}>{t('familyTree.rename')}</button>
        </form>}
      </> : <p>{t('familyTree.empty')}</p>}
      <div className="actions">
        {neighborId ? <button onClick={() => open({ kind: 'journal', tab: 'neighbors', neighbor: neighborId })}>{t('familyTree.back')}</button>
          : <button onClick={() => open({ kind: 'family' })}>가족 창으로</button>}
        <button data-close onClick={close}>{t('common.close')}</button>
      </div>
    </div>
  )
}
