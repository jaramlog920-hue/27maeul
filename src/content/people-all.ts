// 사람들의 말·사건 (people.json) + 덧붙인 말·사건 (people-more.json, 2026-10-12)
// 덧붙인 것: 하트 수에 따라 열리는 말(req.hearts), 연인·부부 사이의 말과 사건.
// people.json은 그대로 두고 불러올 때 사람마다 뒤에 이어 붙인다 (catalog·text가 이 결과를 쓴다)
import peopleRaw from './people.json'
import moreRaw from './people-more.json'
import type { PeopleData, PersonEvent, TalkLine } from '../engine/people'

export interface PeopleMore {
  lines: Record<string, TalkLine[]>
  events: Record<string, PersonEvent[]>
  /** 같은 모습의 연애 후보가 대신 하는 장면 (romance2:<id>:friend) */
  scenes: Record<string, { title: string; lines: { speaker: string; text: string }[] }>
  /** 같은 모습의 연애 후보가 대신 하는 가까운 사이 말 (life-text neighbors.<id>.close 대신) */
  closeFriend: Record<string, { speaker: string; text: string }[]>
  /** 사건 id → 장면이 떠 있는 동안의 동작 (원래 사건과 덧붙인 사건 모두) */
  motions: Record<string, { npc: string; player?: string }>
}

export const PEOPLE_MORE = moreRaw as unknown as PeopleMore

export function mergePeople(base: PeopleData, more: PeopleMore): PeopleData {
  const people = { ...base.people }
  for (const [id, lines] of Object.entries(more.lines)) if (people[id]) people[id] = { ...people[id], lines: [...people[id].lines, ...lines] }
  for (const [id, events] of Object.entries(more.events)) if (people[id]) people[id] = { ...people[id], events: [...(people[id].events ?? []), ...events] }
  for (const [id, p] of Object.entries(people)) if (p.events?.some((e) => more.motions[e.id])) people[id] = { ...p, events: p.events!.map((e) => (more.motions[e.id] ? { ...e, motion: more.motions[e.id] } : e)) }
  return { ...base, people }
}

export const PEOPLE_DATA = mergePeople(peopleRaw as unknown as PeopleData, PEOPLE_MORE)
