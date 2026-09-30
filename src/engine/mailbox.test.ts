// 편지 바구니 (2026-09-30 사용자): 집 앞 편지함(우체통)을 없애고, 편지 책의 편지도 문 앞 편지 바구니로 들어온다
import { CONTENT } from '../content/catalog'
import { T } from '../content/text'
import { owns } from './easier'
import { chooseBook, greetNeighbor, listen, mailboxHasPost, newGame, openMailbox, syncHome, type GameState } from './game'
import { POINTS_PER_HEART } from './hearts'
import { POSTMAN } from './post'
import { placeAt, PLACES } from './world'

/** 네 복음서·사도행전을 꽂고 로마서–빌레몬서 방이 열린 상태 */
function roomOpenState(): GameState {
  const s = newGame(CONTENT)
  return { ...s, flags: { ...s.flags, gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1 }, shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 } }
}

describe('우체통은 없다', () => {
  it('편지 나르는 이웃과 마음 4가 되어도 집 앞 편지함이 서지 않고, 그 칸은 누를 수 없다', () => {
    const s = greetNeighbor({ ...newGame(CONTENT), hearts: { [POSTMAN]: 4 * POINTS_PER_HEART - 1 } }, POSTMAN)
    expect(owns(s.flags, 'homeMailbox')).toBe(false)
    expect(s.scenes).not.toContain('homeMailbox')
    syncHome(s)
    expect(placeAt(PLACES.mailbox.tiles[0])).toBeNull()
  })
})

describe('편지 바구니에서 편지 책의 편지 꺼내기', () => {
  it('편지 책이면 오늘 편지가 바구니에 — 이웃에게 받는 것과 같은 편지, 어느 쪽이든 한 번', () => {
    const s = chooseBook(roomOpenState(), 'rom', CONTENT)
    expect(s.post.length).toBeGreaterThan(0)
    expect(mailboxHasPost(s)).toBe(true)
    const { state, pieceIds } = openMailbox(s, CONTENT)
    expect(pieceIds).toEqual(s.post)
    expect(state.collected).toEqual(expect.arrayContaining(s.post))
    expect(mailboxHasPost(state)).toBe(false)
    expect(listen(state, POSTMAN, CONTENT).pieceIds).toEqual([])
    const fromPostman = listen(s, POSTMAN, CONTENT).state
    expect(openMailbox(fromPostman, CONTENT).pieceIds).toEqual([])
  })

  it('복음서를 엮을 때는 바구니에 편지 책의 편지가 없다', () => {
    const gospel = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    expect(openMailbox(gospel, CONTENT).pieceIds).toEqual([])
    expect(mailboxHasPost(gospel)).toBe(false)
  })

  it('문구', () => {
    expect(T.post.mailboxTook).toContain('편지 바구니')
    expect(T.post.mailboxTook).toContain('{n}')
  })
})
