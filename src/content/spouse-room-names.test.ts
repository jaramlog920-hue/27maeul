// 배우자 방 가구 이름은 지금 이웃 이름으로 (2026-10-18 감사 L-53 — 상인·올리버·마일로만 옛 직업 이름이었다)
import neighbors from './neighbors.json'
import rooms from './spouse-rooms.json'

it('배우자 방 이름이 이웃 이름과 같다', () => {
  const list = ((neighbors as unknown as { neighbors?: { id: string; role: string }[] }).neighbors ?? (neighbors as unknown as { id: string; role: string }[]))
  const role = Object.fromEntries(list.map((n) => [n.id, n.role]))
  const all = rooms as unknown as { id: string; name: string }[]
  for (const r of all) expect(r.name, r.id).toBe(role[r.id])
})
