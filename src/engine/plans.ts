import { solidTiles } from './room'
import { isHome } from './world'
import { expandClubs } from './clubs'
import { settleFests } from './fest'
import { settleTable } from './cooking'
import { noteExperienceTastes } from './notebook'
import { festivalOf, FESTIVAL_FROM, FESTIVAL_TO, isMarketDay, isWet, weatherOf } from './calendar'
import { gatheringWindow, INVITE_FROM, INVITE_TO, VISIT_FROM, VISIT_TO, BABY_PARTY_DAY, BABY_PARTY_SPOTS, HILL_SPOTS } from './bonds'
import { heartUp, notYet, recordExperienceIn, shelvedCount, eventNow, routineOf, type GameState } from './game'
import { HALL_SPOTS } from './places'
import { OUTDOOR_PLACES } from './village-sites'
import { personOf } from './people'
import { lockedTiles, key, PLACES, isWalkable } from './world'
import type { GameContent, PlaceId, Tile } from './types'

export type Activity = 'tea'|'sew'|'garden'|'observe'|'taste'|'make'|'walk'|'work'
export type TastePlace = 'indoor'|'hill'|'market'|'shade'|'lake'
export type TasteTime = 'early'|'afternoon'|'evening'
export interface Appt {
  id: string; kind: 'club'|'event'|'work'|'learn'; day: number; from: number; to: number
  place: PlaceId; alt?: PlaceId; host?: string; members: string[]; startedWith?: string[]
  state: 'planned'|'running'|'done'|'skipped'|'moved'; rewarded: boolean; remembered: boolean
  /** Player participation must be an explicit action, never inferred from being nearby. */
  attended?: boolean; activity?: Activity; clubId?: string; festId?: string; title?: string; seats?: Tile[]; requiresPlayer?: boolean; movedFrom?: number; reason?: 'weather'|'closed'|'busy'|'host'
}
export interface Plans { appts: Appt[]; nextId: number }
export const NO_PLANS: Plans = { appts: [], nextId: 1 }
export const APPT_HEART_CAP = 3
export const APPT_MEMBERS_MAX = 3
const overlap = (a: number, b: number, c: number, d: number) => a < d && c < b
export type Availability = 'ok' | { busy: string; suggest: { day: number; from: number } | null }
type PlanState = Pick<GameState,'clock'|'flags'|'shelved'|'today'> & Partial<Pick<GameState,'plans'|'romance'|'life'|'hearts'|'progress'|'garden'|'player'|'room'>>
const active = (a: Appt) => a.state === 'planned' || a.state === 'running' || a.state === 'moved'
const cast = (a: Appt) => [...new Set([...a.members, ...(a.host ? [a.host] : [])])]
export function reservedMembers(s: Pick<PlanState,'clock'|'plans'>, from = 18*60, to = 21*60): string[] {
  return [...new Set((s.plans?.appts ?? []).filter(a => active(a) && a.day === s.clock.day && overlap(from,to,a.from,a.to)).flatMap(cast))]
}

function busyAt(s: PlanState, npc: string, day: number, from: number, to: number, content: Pick<GameContent,'neighbors'>, exclude?: string): string | null {
  const def = content.neighbors.find(n => n.id === npc)
  if (!def || notYet(def, s.flags.villageLevel ?? 0, s.flags)) return 'away'
  if (def.marketOnly && !isMarketDay(day)) return 'market'
  if (npc === 'child' && to > 18*60) return 'early'
  if (from < 6*60 || to > 22*60 || from >= to) return 'time'
  if ((festivalOf(day) || s.romance?.weddingDay === day || (day === s.clock.day && (s.flags.gospelFeast === 1 || s.flags.allFeast === 1))) && overlap(from,to,FESTIVAL_FROM,FESTIVAL_TO)) return 'festival'
  if ((s.plans?.appts ?? []).some(a => a.id !== exclude && active(a) && a.day === day && cast(a).includes(npc) && overlap(from,to,a.from,a.to))) return 'appointment'
  const today = day === s.clock.day ? s.today : undefined
  if (today?.inviter === npc && overlap(from,to,INVITE_FROM,INVITE_TO)) return 'invite'
  if (today?.visitor === npc && !today.visitGot && overlap(from,to,VISIT_FROM,VISIT_TO)) return 'visit'
  const gathering = today?.gathering ?? (day === BABY_PARTY_DAY && !isWet(weatherOf(day)) ? 'babyParty' : null)
  if (gathering) {
    const [gfrom,gto] = gatheringWindow(gathering)
    const spots = gathering === 'babyParty' ? BABY_PARTY_SPOTS : HILL_SPOTS
    if (npc in spots && !(gathering === 'starNight' && npc === 'shepherd') && overlap(from,to,gfrom,gto)) return 'gathering'
  }
  if (s.progress && s.hearts && s.life) {
    // 마을 밖에 나가 있는 일과(away) 동안은 모임·약속·함께 일하기에 넣을 수 없다 (웬델의 둘째 날 아침 등)
    if (personOf(npc)?.routines?.some(r => r.away)) {
      for (let minute=from; minute<to; minute+=10) {
        if (routineOf({ ...s, clock: { day, minute }, progress:s.progress, hearts:s.hearts }, npc)?.away) return 'away'
      }
    }
    for (let minute=from; minute<to; minute+=1) {
      if (eventNow({ ...s, clock: { day, minute }, progress:s.progress, hearts:s.hearts }, npc)) return 'story'
    }
  }
  return null
}
export function availability(s: PlanState, npc: string, day: number, from: number, to: number, content: Pick<GameContent,'neighbors'>, exclude?: string): Availability {
  const busy = busyAt(s,npc,day,from,to,content,exclude)
  if (!busy) return 'ok'
  const duration = to-from
  for (let d=day; d<=day+14; d++) for (const minute of [8*60,10*60,13*60,15*60,18*60]) {
    if (d === day && minute <= from) continue
    if (!busyAt(s,npc,d,minute,minute+duration,content,exclude)) return { busy,suggest:{day:d,from:minute} }
  }
  return {busy,suggest:null}
}
export function inviteReaction(npc: string, activity: Activity, place: TastePlace, time: TasteTime): 'likes'|'new'|'conflict' {
  const tastes = personOf(npc)?.tastes
  const values = [tastes?.activity?.[activity], tastes?.place?.[place], tastes?.time?.[time]]
  return values.includes(-1) ? 'conflict' : values.includes(1) ? 'likes' : 'new'
}
export function venueFor(appt: Appt, day = appt.day): {place:PlaceId; moved:false} | {place:PlaceId; moved:true; day:number; reason:'weather'} {
  const weather = weatherOf(day)
  if (OUTDOOR_PLACES.includes(appt.place) && (isWet(weather) || weather === 'hot')) {
    if (appt.alt && ['hallTable','teaTable'].includes(appt.alt)) return {place:appt.alt,moved:false}
    return {place:appt.place,moved:true,day:day+1,reason:'weather'}
  }
  return {place:appt.place,moved:false}
}
export function apptSpots(place: PlaceId): readonly Tile[] {
  if (place === 'hallTable') return HALL_SPOTS
  const tile=PLACES[place]?.tiles[0]
  return tile ? [{x:tile.x-1,y:tile.y},{x:tile.x+1,y:tile.y},{x:tile.x,y:tile.y-1}].filter(t => isWalkable(t)) : []
}
export function spotsForAppt(a: Appt): readonly Tile[] {
  const venue=venueFor(a)
  return a.seats && venue.place===a.place ? a.seats : apptSpots(venue.place)
}
function openVenue(s: PlanState, place: PlaceId, seats?:readonly Tile[]): boolean {
  const locked=lockedTiles(shelvedCount(s))
  return (seats??apptSpots(place)).length > 0 && (seats??apptSpots(place)).every(t => isWalkable(t,s.room?solidTiles(s.room):undefined) && !locked.has(key(t))) && !(place === 'garden' && !Object.keys(s.garden??{}).length)
}
export function scheduleAppt(s: GameState, input: Omit<Appt,'id'|'state'|'rewarded'|'remembered'|'startedWith'|'attended'>, content: GameContent): {state:GameState; appt?:Appt; blocked?:Availability|'venue'|'members'|'past'} {
  if (input.day < s.clock.day || (input.day === s.clock.day && input.from <= s.clock.minute)) return {state:s,blocked:'past'}
  const members = [...new Set(input.members)]
  if (!members.length || cast({...input,members} as Appt).length > APPT_MEMBERS_MAX) return {state:s,blocked:'members'}
  const venue=venueFor(input as Appt)
  if (!openVenue(s,venue.place,input.seats) || cast({...input,members} as Appt).length > (input.seats??apptSpots(venue.place)).length || (input.alt && (!openVenue(s,input.alt) || cast({...input,members} as Appt).length > apptSpots(input.alt).length))) return {state:s,blocked:'venue'}
  for (const npc of cast({...input,members} as Appt)) {
    const check=availability(s,npc,input.day,input.from,input.to,content)
    if (check !== 'ok') return {state:s,blocked:check}
  }
  const plans=s.plans ?? NO_PLANS
  const appt:Appt={...input,members,id:`appt:${plans.nextId}`,state:'planned',rewarded:false,remembered:false}
  return {state:{...s,plans:{appts:[...plans.appts,appt],nextId:plans.nextId+1}},appt}
}
export function appointmentSpots(s: Pick<PlanState,'clock'|'plans'>): Record<string,Tile> {
  const out:Record<string,Tile>={}
  for (const a of s.plans?.appts ?? []) {
    if (!active(a) || a.day !== s.clock.day || s.clock.minute < a.from || s.clock.minute >= a.to) continue
    const venue=venueFor(a)
    if (venue.moved) continue
    const spots=spotsForAppt(a)
    ;(a.startedWith ?? cast(a)).forEach((id,i) => {if(spots[i]) out[id]=spots[i]})
  }
  return out
}
export function attendAppt(s: GameState,id:string): GameState {
  const a=s.plans?.appts.find(a => a.id === id)
  if (!a || a.state !== 'running' || a.day !== s.clock.day || s.clock.minute < a.from || s.clock.minute >= a.to) return s
  const venue=venueFor(a)
  if (venue.moved || !spotsForAppt(a).some(t => Math.abs(t.x-s.player.x)+Math.abs(t.y-s.player.y)<=3)) return s
  return {...s,plans:{...s.plans,appts:s.plans.appts.map(x => x.id===id?{...x,attended:true}:x)}}
}
export function settleAppt(s: GameState,id:string): GameState {
  const a=s.plans?.appts.find(a => a.id===id)
  if (!a || (a.state !== 'running' && a.state !== 'done') || a.day>s.clock.day || (a.day===s.clock.day && s.clock.minute<a.to)) return s
  let next=s
  const members=a.startedWith ?? []
  if (a.attended && !a.rewarded) for (const npc of members) {
    next=heartUp(next,npc,APPT_HEART_CAP,APPT_HEART_CAP)
  }
  if (a.attended && members.length && !a.remembered) {
    const recorded=recordExperienceIn({...next,clock:{day:a.day,minute:a.to}},{id:a.clubId??a.festId??a.id,kind:a.kind,with:members,place:venueFor(a).place})
    const reveals=Object.fromEntries(members.filter(id=>a.activity && personOf(id)?.tastes?.activity?.[a.activity]===1).map(id=>[id,`activity.${a.activity}`]))
    next={...recorded,clock:next.clock,notebook:noteExperienceTastes(next.notebook,{with:members},reveals)}
  }
  return {...next,plans:{...next.plans,appts:next.plans.appts.map(x => x.id===id?{...x,state:'done',rewarded:true,remembered:true}:x)}}
}
/** Crossing a whole session skips it; proximity never fabricates player participation. */
export function advancePlans(s:GameState,content:Pick<GameContent,'neighbors'>): GameState {
  let next=expandClubs(s,content)
  for (const appt of next.plans?.appts ?? []) {
    let a=next.plans.appts.find(a=>a.id===appt.id)!
    if (!active(a)) continue
    if (a.day<s.clock.day || (a.state!=='running' && a.day===s.clock.day && s.clock.minute>=a.to)) {
      if(a.state==='running') next=settleAppt(next,a.id)
      else next={...next,plans:{...next.plans,appts:next.plans.appts.map(x=>x.id===a.id?{...x,state:'skipped'}:x)}}
      continue
    }
    if (a.day!==s.clock.day || s.clock.minute<a.from) continue
    if(a.state==='running') {if(s.clock.minute>=a.to) next=settleAppt(next,a.id);continue}
    const venue=venueFor(a)
    // 집에서 여는 행사(집들이)는 플레이어가 집에 없거나 자리가 막혔으면 저절로 열지 않는다 — 다시 잡거나 마치는 건 플레이어가 고른다
    if(a.requiresPlayer && (!isHome(next.player) || !openVenue(next,venue.place,a.seats))) {
      next={...next,plans:{...next.plans,appts:next.plans.appts.map(x=>x.id===a.id?{...x,state:'skipped',reason:'host'}:x)}}
      continue
    }
    if(venue.moved || !openVenue(next,venue.place,a.seats)) {
      const day=venue.moved?venue.day:a.day+1
      next={...next,plans:{...next.plans,appts:next.plans.appts.map(x=>x.id===a.id?{...x,state:'moved',day,movedFrom:a.movedFrom??a.day,reason:venue.moved?'weather':'closed'}:x)}}
      continue
    }
    const members=cast(a).filter(id=>busyAt(next,id,a.day,a.from,a.to,content,a.id)===null)
    a={...a,state:members.length?'running':'skipped',startedWith:members,reason:members.length?a.reason:'busy'}
    next={...next,plans:{...next.plans,appts:next.plans.appts.map(x=>x.id===a.id?a:x)}}
  }
  return settleTable(settleFests(next))
}
export function sanitizePlans(raw:unknown,day:number): Plans {
  if(!raw || typeof raw!=='object') return {appts:[],nextId:1}
  const r=raw as Partial<Plans>, ids=new Set<string>()
  const appts:Appt[]=[]
  for(const a of Array.isArray(r.appts)?r.appts:[]) {
    if(!a || typeof a.id!=='string' || ids.has(a.id) || !['club','event','work','learn'].includes(a.kind) || !Number.isInteger(a.day) || a.day<1 || !Number.isFinite(a.from) || !Number.isFinite(a.to) || a.from<360 || a.to>1320 || a.from>=a.to || typeof a.place!=='string' || !(a.place in PLACES) || (a.host!==undefined && typeof a.host!=='string') || !Array.isArray(a.members) || !a.members.every(id=>typeof id==='string') || !['planned','running','done','skipped','moved'].includes(a.state)) continue
    ids.add(a.id)
    appts.push({...a,members:[...new Set(a.members)].slice(0,APPT_MEMBERS_MAX),startedWith:Array.isArray(a.startedWith)?a.startedWith.filter(id=>cast(a).includes(id)):undefined,state:a.day<day && (a.state==='planned'||a.state==='moved')?'skipped':a.state,rewarded:a.rewarded===true,remembered:a.remembered===true,seats:Array.isArray(a.seats)?a.seats.filter(t=>t && Number.isInteger(t.x) && Number.isInteger(t.y) && isWalkable(t)):undefined,requiresPlayer:a.requiresPlayer===true,attended:a.attended===true,alt:typeof a.alt==='string' && a.alt in PLACES?a.alt:undefined})
  }
  const largest=Math.max(0,...appts.map(a=>Number(a.id.replace('appt:',''))||0))
  return {appts,nextId:Math.max(largest+1,Number.isInteger(r.nextId)?r.nextId!:1)}
}
