// 필사 소리 내어 읽기 (사용자 결정 2026-10-05): 브라우저 음성 인식(SpeechRecognition / webkitSpeechRecognition)으로
// 한 절을 받아 적는다. 기본은 끔 — 설정 › 필사에서 켠다 (기기에 저장). 음성 인식이 없는 브라우저(일부 iOS 사파리 등)에서는
// 단추도 설정도 보이지 않는다. 받아 적은 글은 본문과 견주기만 하고, 기록하는 것은 언제나 본문 그대로다 (copying.checkVoice).

const VOICE_KEY = 'twenty-seven/copy-voice'

/** 이 게임이 쓰는 음성 인식의 작은 모양 (브라우저마다 타입 정의가 없어서 직접 둔다) */
export interface VoiceAlternative {
  transcript: string
}
export interface VoiceResult {
  readonly isFinal: boolean
  readonly length: number
  [i: number]: VoiceAlternative
}
export interface VoiceResultEvent {
  readonly resultIndex: number
  readonly results: { readonly length: number; [i: number]: VoiceResult }
}
export interface VoiceRecognizer {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((e: VoiceResultEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type VoiceCtor = new () => VoiceRecognizer

/** 이 브라우저의 음성 인식 (없으면 null) */
export function voiceCtor(): VoiceCtor | null {
  const w = globalThis as unknown as { SpeechRecognition?: VoiceCtor; webkitSpeechRecognition?: VoiceCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}
export function voiceAvailable(): boolean {
  return voiceCtor() !== null
}

/** 설정: 소리 내어 읽기(마이크) — 기본은 끔 */
export function copyVoiceOn(): boolean {
  try {
    return globalThis.localStorage?.getItem(VOICE_KEY) === '1'
  } catch {
    return false
  }
}
export function setCopyVoice(on: boolean) {
  try {
    globalThis.localStorage?.setItem(VOICE_KEY, on ? '1' : '0')
  } catch {
    /* 저장할 수 없으면 켜지지 않는다 (기본은 끔) */
  }
}

/** 한국어로, 말하는 동안 받아 적는 중간 글도 받고, 한 번 말을 멈추면 끝 (조용한 화면 — 계속 듣지 않는다) */
export function newRecognizer(): VoiceRecognizer | null {
  const Ctor = voiceCtor()
  if (!Ctor) return null
  const r = new Ctor()
  r.lang = 'ko-KR'
  r.interimResults = true
  r.continuous = false
  r.maxAlternatives = 3
  return r
}

/** 결과에서 받아 적은 글 후보들 (첫째 후보들을 이은 글이 맨 앞) — final: 마지막 결과가 확정되었다 */
export function transcriptsOf(e: VoiceResultEvent): { texts: string[]; final: boolean } {
  const parts: VoiceResult[] = []
  for (let i = 0; i < e.results.length; i++) parts.push(e.results[i])
  if (!parts.length) return { texts: [], final: false }
  const joined = parts.map((r) => r[0]?.transcript ?? '').join(' ')
  const last = parts[parts.length - 1]
  const head = parts.slice(0, -1).map((r) => r[0]?.transcript ?? '').join(' ')
  // 결과가 하나뿐이면(보통 그렇다) 둘째·셋째 후보도 견줘 본다
  const alts: string[] = []
  for (let k = 1; k < last.length; k++) if (last[k]?.transcript) alts.push(`${head} ${last[k].transcript}`.trim())
  return { texts: [joined, ...alts].filter((t) => t.trim() !== ''), final: last.isFinal }
}
