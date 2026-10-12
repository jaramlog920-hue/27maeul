/** 같은 이웃의 같은 특별 대사는 저장 슬롯마다 처음 보여 줄 때만 강조한다. */
type PopupState = { flags: Record<string, number> }

// 원문을 그대로 키로 써서 서로 다른 대사가 해시 충돌로 숨겨지지 않게 한다.
const popupKey = (npc: string, line: string) => `talkPopupSeen:${JSON.stringify([npc, line])}`

export function unseenTalkPopups(s: PopupState, npc: string, lines: string[]): string[] {
  return [...new Set(lines)].filter(line => !!line && !s.flags[popupKey(npc, line)])
}

export function rememberTalkPopup<S extends PopupState>(s: S, npc: string, line: string): S {
  const key = popupKey(npc, line)
  if (!line || s.flags[key]) return s
  return { ...s, flags: { ...s.flags, [key]: 1 } }
}
