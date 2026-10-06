// 화면 글(단추·메뉴·안내)을 꺼내는 입구. 새로 만드는 화면 글은 여기로 쓴다.
// 이웃 대사·생활 글은 계속 text.ts(life-text.json·people.json)로 — 나중에 영어판 json을 옆에 둔다.
// 지금은 한국어만. 영어를 넣을 때 lang/en.json을 만들고 TABLES에 더한다.
import ko from '../content/lang/ko.json'

export type Lang = 'ko'
type Table = { [k: string]: string | Table }

const TABLES: Record<Lang, Table> = { ko }
let current: Lang = 'ko'

export const setLang = (lang: Lang) => { current = lang }
export const getLang = (): Lang => current

function lookup(table: Table, key: string): string | undefined {
  let node: string | Table | undefined = table
  for (const part of key.split('.')) {
    if (typeof node !== 'object') return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

/** t('common.close') · t('shop.price', { n: 3 }) → 글 안의 {n}을 바꾼다. 없는 열쇠는 한국어 → 열쇠 그대로. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const raw = lookup(TABLES[current], key) ?? lookup(TABLES.ko, key) ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m))
}

/** 검사용: 표 안의 모든 [열쇠, 글] */
export function allEntries(lang: Lang = 'ko'): [string, string][] {
  const out: [string, string][] = []
  const walk = (node: Table, prefix: string) => {
    for (const [k, v] of Object.entries(node)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (typeof v === 'string') out.push([key, v])
      else walk(v, key)
    }
  }
  walk(TABLES[lang], '')
  return out
}
