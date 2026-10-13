import { FAMILY_KINDS, PROGRESS_KINDS } from '../../engine/scenic-kinds'
import { createRoot } from 'react-dom/client'
import { LandscapeScene } from './StarsScene'
import { landscapeKind } from '../../render/scenic-moments-art'
import '../../app/global.css'
const params = new URLSearchParams(window.location.search)
const kind = landscapeKind(params.get('scene') ?? 'stars') ?? 'stars'
const sequence: readonly string[] = params.get('set') === 'progress' ? PROGRESS_KINDS : params.get('set') === 'bible' ? ['bibleLastLetter','completeBible'] : params.get('set') === 'finale' ? ['lastManuscript', 'fullLibrary'] : params.get('set') === 'family' ? FAMILY_KINDS : params.get('set') === 'milestones' ? ['shelfBook', 'firstConfession', 'marketEvening', 'childWalks', 'homeExpanded'] : ['rainCopy', 'bookBound', 'dateSunset', 'babySleep', 'firstSnow']
const next = sequence[(sequence.indexOf(kind) + 1) % sequence.length]
createRoot(document.getElementById('root')!).render(<LandscapeScene kind={kind} sceneId={params.get('scene')??kind} preview previewAt={params.has('at') && Number.isFinite(Number(params.get('at'))) ? Math.max(0, Number(params.get('at'))) : undefined} onFinish={() => { if(params.get('set')==='progress'&&kind==='workSuccession'){window.location.href='progress.html';return} if (kind === 'completeBible') { window.location.href = 'complete-bible.html'; return } window.location.href = `?scene=${next}${['family', 'milestones', 'finale', 'bible','progress'].includes(params.get('set') ?? '') ? '&set=' + params.get('set') : ''}` }} />)
