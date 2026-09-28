import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { alertsBetween, eventStatus, eventSummary, nextEvent, scheduledEvents } from './events'

it('장날과 잔치의 날짜, 실제 시작·종료 시각을 안내한다', () => {
  const s = newGame(CONTENT)
  const events = scheduledEvents({ ...s, clock: { day: 7, minute: 360 } }, CONTENT)
  expect(events.find(e => e.id === '7:market')).toMatchObject({ from: 450, to: 1080 })
  expect(events.find(e => e.id === '12:festival')).toMatchObject({ from: 1080, to: 1260 })
})

it('오늘 확정된 방문·초대와 참여 여부를 안내한다', () => {
  const s = newGame(CONTENT)
  const events = scheduledEvents({ ...s, today: { ...s.today, visitor: 'baker', visitGot: true, inviter: 'grandpa' } }, CONTENT)
  expect(eventStatus(events.find(e => e.id === '1:visit')!, 1, 480)).toBe('참여 완료')
  expect(events.find(e => e.id === '1:dinner')).toMatchObject({ from: 1080, to: 1230 })
})

it('시작 전, 진행 중, 종료, 다음 날짜를 구분한다', () => {
  const event = { id: 'test', title: '잔치', location: '장터', day: 12, from: 1080, to: 1260 }
  expect(eventStatus(event, 12, 990)).toBe('1시간 30분 뒤')
  expect(eventStatus(event, 12, 1080)).toBe('진행 중')
  expect(eventStatus(event, 12, 1260)).toBe('종료')
  expect(eventStatus(event, 11, 1200)).toBe('1일 뒤')
})

it('행사와 겹치는 글자 공부를 잘못 예고하지 않는다', () => {
  const s = newGame(CONTENT)
  const flags = { ...s.flags, childAsked: 1 }
  expect(scheduledEvents({ ...s, flags }, CONTENT).some(e => e.id === '1:lesson')).toBe(true)
  expect(scheduledEvents({ ...s, flags, clock: { day: 12, minute: 360 } }, CONTENT).some(e => e.id === '12:lesson')).toBe(false)
})

describe('다음 일정 · 알림', () => {
  const party = { id: '12:festival', title: '잔치', location: '장터', day: 12, from: 1080, to: 1260 }
  it('한 줄 안내: 오늘/지금/내일', () => {
    expect(eventSummary(party, 12, 990)).toBe('오늘 18:00 잔치 · 1시간 30분 뒤')
    expect(eventSummary(party, 12, 1100)).toBe('잔치 진행 중 · 21:00까지')
    expect(eventSummary(party, 11, 600)).toBe('내일 18:00 잔치')
    expect(eventSummary(null, 12, 600)).toBe('예정된 일정 없음')
  })
  it('끝난 일정과 참여한 일정은 건너뛴다', () => {
    const done = { ...party, id: '12:visit', from: 420, to: 570, done: true }
    expect(nextEvent([done, party], 12, 450)?.id).toBe('12:festival')
    expect(nextEvent([party], 12, 1260)).toBeNull()
  })
  it('30분 전과 시작할 때 알린다', () => {
    expect(alertsBetween([party], 12, 1049, 1050)).toEqual(['30분 뒤 잔치 · 장터'])
    expect(alertsBetween([party], 12, 1079, 1080)).toEqual(['잔치 시작! · 장터'])
    expect(alertsBetween([party], 12, 1050, 1079)).toEqual([])
  })
  it('한꺼번에 넘으면 시작 알림만, 이미 끝났으면 알리지 않는다', () => {
    expect(alertsBetween([party], 12, 1000, 1100)).toEqual(['잔치 시작! · 장터'])
    expect(alertsBetween([party], 12, 1000, 1300)).toEqual([])
    expect(alertsBetween([{ ...party, done: true }], 12, 1079, 1080)).toEqual([])
  })
})
