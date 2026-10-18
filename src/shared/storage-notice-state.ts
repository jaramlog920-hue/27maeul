let open = false

/** 저장 안내를 읽는 동안 기존 게임 창을 바꾸지 않고 마을 시간을 멈춘다. */
export function isStorageNoticeOpen(): boolean { return open }

export function setStorageNoticeOpen(value: boolean): void { open = value }
