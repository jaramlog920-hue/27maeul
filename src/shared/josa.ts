// 빈칸 채우기와 조사 맞추기: "{village}로"·"{player}가"처럼 빈칸 바로 뒤에 붙은 조사를 채운 말의 받침에 맞게 바꾼다
// (아랫섬으로 · 버들내로 · 물방아골로, 민준이 · 파피가). 채운 말이 한글로 끝나지 않으면(숫자 등) 쓴 조사 그대로
const PAIRS: readonly (readonly [final: string, open: string])[] = [['으로', '로'], ['이나', '나'], ['이랑', '랑'], ['을', '를'], ['이', '가'], ['은', '는'], ['과', '와']]
const PARTICLE = new Map(PAIRS.flatMap((p) => [[p[0], p], [p[1], p]] as const))
const SLOT = /\{(\w+)\}(?:(으로|이나|이랑|을|를|이|가|은|는|와|과|로|나|랑)(?![가-힣]))?/g

/** 받침에 맞는 조사 (받침 없음·ㄹ받침의 '으로'는 '로'). 한글 음절로 끝나지 않으면 null */
export function josaFor(word: string, particle: string): string | null {
  const pair = PARTICLE.get(particle)
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (!pair || !word || code < 0 || code > 11171) return null
  const final = code % 28
  if (pair[0] === '으로') return final === 0 || final === 8 ? '로' : '으로'
  return final === 0 ? pair[1] : pair[0]
}

/** 빈칸을 채운다. vars에 없는 빈칸은 missing이 'keep'이면 그대로, 아니면 빈 글 */
export function fillSlots(template: string, vars: Readonly<Record<string, string | number | undefined>>, missing: 'empty' | 'keep' = 'empty'): string {
  return template.replace(SLOT, (all, key: string, particle?: string) => {
    if (!(key in vars) || vars[key] === undefined) return missing === 'keep' ? all : particle ?? ''
    const value = String(vars[key])
    return value + (particle ? (josaFor(value, particle) ?? particle) : '')
  })
}
