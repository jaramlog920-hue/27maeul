// 서고 잔치 모닥불 (2026-10-13 사용자: 글 장면만 있어 밋밋했다) — 장면 줄 → 가져온 음식 → 조각을 건넸던 이웃 → 내 한 줄 낭독.
// 성경 글은 지어내지 않는다: 조각은 구절 범위와 개역한글 소제목 그대로, 낭독은 플레이어가 적어 둔 나의 한 줄 그대로.
import { useEffect, useMemo, useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { callName, copyBookName, itemName, SCENES, T } from '../../content/text'
import { feastFoods, feastGivers, feastGuests, feastLines, feastOf, type FeastId } from '../../engine/feast'
import type { ItemId } from '../../engine/types'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'
import { speakerName } from './SceneView'
import {AuthoredStoryScene} from './AuthoredStoryScene'

const F = T.feast
type Step = 'lines' | 'food' | 'givers' | 'read' | 'end'

/** 이웃의 반응 한 줄 (사람마다 다르게, 같은 잔치에서는 같게) */
const pick = <T,>(list: readonly T[], seed: string) => list[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % list.length]

export function FeastView({ id }: { id: 'feastFire' | 'allFeastFire' }) {
  const nextScene = useGame((s) => s.nextScene)
  const feastShare = useGame((s) => s.feastShare)
  const feastRead = useGame((s) => s.feastRead)
  const game = useGame((s) => s.game)
  const me = game.avatar?.name
  const feast: FeastId = feastOf(game) ?? (id === 'allFeastFire' ? 'allFeast' : 'gospelFeast')
  const scene = SCENES[id]
  // 잔치를 여는 동안 고정 (음식을 내놓아 가방이 바뀌어도 목록이 흔들리지 않게)
  const [foods] = useState(() => feastFoods(game))
  const givers = useMemo(() => feastGivers(game, feast, CONTENT), [feast]) // eslint-disable-line react-hooks/exhaustive-deps
  const lines = useMemo(() => feastLines(game, feast), [feast]) // eslint-disable-line react-hooks/exhaustive-deps
  const guests = useMemo(() => feastGuests(game, CONTENT).map((d) => d.id), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [step, setStep] = useState<Step>('lines')
  const [page, setPage] = useState(0)
  const [said, setSaid] = useState<{ who: string | null; text: string }[]>([])
  const [read, setRead] = useState<string | null>(null)
  useEffect(() => {
    if (!scene) nextScene()
  }, [scene, nextScene])
  if (!scene) return null

  const name = (npc: string) => neighborById(npc)?.role ?? ''
  const go = (s: Step) => {
    setPage(0)
    setSaid([])
    // 비어 있는 단계는 건너뛴다 (조각을 건넨 이웃이 없거나, 적어 둔 한 줄이 없을 때)
    if (s === 'food' && !foods.length) return go('givers')
    if (s === 'givers' && !givers.length) return go('read')
    if (s === 'read' && !lines.length) return go('end')
    if (s === 'givers') setSaid(givers.map((g) => ({ who: name(g.npc), text: F.giver.replace('{title}', g.piece.title).replace('{ref}', g.piece.ref).replace('{book}', copyBookName(g.piece.book)) })))
    setStep(s)
  }
  const share = (item: ItemId | null) => {
    if (!item) {
      setSaid([{ who: null, text: F.emptyHanded }])
      return
    }
    const glad = feastShare(item)
    setSaid(glad.length
      ? glad.slice(0, 3).map((npc) => ({ who: name(npc), text: pick(F.glad, npc + item).replace('{item}', itemName(item)) }))
      : [{ who: null, text: F.shared.replace('{item}', itemName(item)) }])
  }
  const readLine = (text: string) => {
    feastRead(text)
    setRead(text)
    const who = guests.filter((g) => g !== 'merchant').slice(0, 2)
    setSaid(who.map((npc) => ({ who: name(npc), text: pick(F.heard, npc + text) })))
  }

  const box = (who: string | null, text: string, key: string | number) => (
    <p key={key} className={who ? 'scene-line said' : 'scene-line narration'}>
      {who && <span className="talk-role">{who}</span>}
      {callName(text, me)}
    </p>
  )
  const next = (label = t('common.next'), onClick: () => void) => (
    <div className="actions">
      <button className="primary" onClick={onClick}>{label}</button>
    </div>
  )

  let body
  if (step === 'lines') {
    const l = scene.lines[Math.min(page, scene.lines.length - 1)]
    body = (
      <>
        <div className="scene-lines">{l && box(speakerName(l.speaker), l.text, page)}</div>
        {next(t('common.next'), () => (page < scene.lines.length - 1 ? setPage(page + 1) : go('food')))}
      </>
    )
  } else if (step === 'food') {
    body = said.length ? (
      <>
        <div className="scene-lines">{said.map((x, i) => box(x.who, x.text, i))}</div>
        {next(t('common.next'), () => go('givers'))}
      </>
    ) : (
      <>
        <p className="scene-line narration">{F.foodAsk}</p>
        <div className="actions menu">
          {foods.map((item) => <button key={item} onClick={() => share(item)}>{itemName(item)}</button>)}
          <button onClick={() => share(null)}>{F.noFood}</button>
        </div>
      </>
    )
  } else if (step === 'givers') {
    const g = said[Math.min(page, said.length - 1)]
    body = (
      <>
        <div className="scene-lines">{g && box(g.who, g.text, page)}</div>
        {next(t('common.next'), () => (page < said.length - 1 ? setPage(page + 1) : go('read')))}
      </>
    )
  } else if (step === 'read') {
    body = read ? (
      <>
        <blockquote className="feast-line">{read}</blockquote>
        <div className="scene-lines">{said.map((x, i) => box(x.who, x.text, i))}</div>
        {next(t('common.next'), () => go('end'))}
      </>
    ) : (
      <>
        <p className="scene-line narration">{F.readAsk}</p>
        <div className="actions menu column">
          {lines.map((l) => (
            <button key={l.book} onClick={() => readLine(l.text)}>
              {copyBookName(l.book)} · {l.text.length > 24 ? l.text.slice(0, 24) + '…' : l.text}
            </button>
          ))}
          <button onClick={() => go('end')}>{F.noRead}</button>
        </div>
      </>
    )
  } else {
    body = (
      <>
        <div className="scene-lines">{box(null, F.end, 'end')}</div>
        {next(t('common.next'), nextScene)}
      </>
    )
  }
  return (
    <AuthoredStoryScene id={id} title={scene.title} beat={step==='end'&&id==='allFeastFire'?4:step==='lines'?Math.min(page,3):3}>
    <div className="dialog scene cinematic-scene-dialog">
      <h2>{scene.title}</h2>
      {body}
    </div>
    </AuthoredStoryScene>
  )
}
