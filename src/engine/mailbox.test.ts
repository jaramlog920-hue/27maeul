// 계획 11 작업 3: 집 앞 편지함 — 편지 나르는 이웃과 마음 4가 되면 세워 주고, 찾아가지 않아도 오늘 편지를 꺼낸다
import { CONTENT } from '../content/catalog'
import { SCENES, T } from '../content/text'
import { HOME_MAILBOX, owns } from './easier'
import { chooseBook, greetNeighbor, listen, mailboxHasPost, newGame, openMailbox, syncHome, tapTile, type GameState } from './game'
import { POINTS_PER_HEART } from './hearts'
import { POSTMAN } from './post'
import { deserialize, serialize } from './save'
import { HOME_FRONT, placeAt, PLACES } from './world'

/** 네 복음서·사도행전을 꽂고 로마서–빌레몬서 방이 열린 상태 */
function roomOpenState(): GameState {
  const s = newGame(CONTENT)
  return { ...s, flags: { ...s.flags, gospelFeast: 2, 'room:romPhm': 1, 'room:hebJud': 1 }, shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 } }
}

const withMailbox = (s: GameState): GameState => ({ ...s, flags: { ...s.flags, 'unlock:homeMailbox': 1 } })
/** 편지 나르는 이웃과 마음 (heart - 1)과 거의 다 찬 점수 — 한 번 인사하면 heart가 된다 */
const almost = (s: GameState, heart: number): GameState => ({ ...s, hearts: { ...s.hearts, [POSTMAN]: heart * POINTS_PER_HEART - 1 } })

describe('편지함이 서는 때: 편지 나르는 이웃과 마음 4', () => {
  it('마음 4가 되는 인사에서 한 번 — 짧은 장면', () => {
    expect(HOME_MAILBOX).toEqual({ npc: 'postman', hearts: 4 })
    const s = greetNeighbor(almost(newGame(CONTENT), 4), POSTMAN)
    expect(owns(s.flags, 'homeMailbox')).toBe(true)
    expect(s.scenes).toContain('homeMailbox')
    const again = greetNeighbor({ ...s, talked: [], scenes: [] }, POSTMAN)
    expect(again.scenes).not.toContain('homeMailbox')
  })

  it('마음이 모자라거나 다른 이웃이면 서지 않는다', () => {
    const low = greetNeighbor(almost(newGame(CONTENT), 3), POSTMAN)
    expect(owns(low.flags, 'homeMailbox')).toBe(false)
    const s0 = newGame(CONTENT)
    const other = greetNeighbor({ ...s0, hearts: { baker: 4 * POINTS_PER_HEART - 1 } }, 'baker')
    expect(owns(other.flags, 'homeMailbox')).toBe(false)
  })
})

describe('편지함에서 꺼내기', () => {
  it('오늘 편지를 한꺼번에 — 이웃에게 받는 것과 같은 편지, 어느 쪽이든 한 번', () => {
    const s = chooseBook(withMailbox(roomOpenState()), 'rom', CONTENT)
    expect(s.post.length).toBeGreaterThan(0)
    expect(mailboxHasPost(s)).toBe(true)
    const { state, pieceIds } = openMailbox(s, CONTENT)
    expect(pieceIds).toEqual(s.post)
    expect(state.collected).toEqual(expect.arrayContaining(s.post))
    expect(state.post).toEqual([])
    expect(mailboxHasPost(state)).toBe(false)
    // 편지함에서 꺼냈으면 이웃에게서 또 받지 않는다
    expect(listen(state, POSTMAN, CONTENT).pieceIds).toEqual([])
    // 이웃에게 받았으면 편지함도 비어 있다
    const fromPostman = listen(s, POSTMAN, CONTENT).state
    expect(openMailbox(fromPostman, CONTENT).pieceIds).toEqual([])
  })

  it('편지함이 없거나 편지 책이 아니면 꺼내지 않는다', () => {
    const noBox = chooseBook(roomOpenState(), 'rom', CONTENT)
    expect(openMailbox(noBox, CONTENT).pieceIds).toEqual([])
    expect(mailboxHasPost(noBox)).toBe(false)
    const gospel = chooseBook(withMailbox(newGame(CONTENT)), 'mk', CONTENT)
    expect(openMailbox(gospel, CONTENT).pieceIds).toEqual([])
  })
})

describe('편지함 자리: 문 앞 길 왼쪽 풀밭', () => {
  it('선 뒤에만 누를 수 있고, 누르면 문 앞에 서서 꺼낸다', () => {
    const at = PLACES.mailbox.tiles[0]
    expect(at).toEqual({ x: HOME_FRONT.x - 1, y: HOME_FRONT.y })
    expect(PLACES.mailbox.stand).toEqual(HOME_FRONT)
    syncHome(newGame(CONTENT))
    expect(placeAt(at)).toBeNull()
    const s = withMailbox(newGame(CONTENT))
    const tapped = tapTile({ ...s, player: { ...s.player, ...HOME_FRONT, x: HOME_FRONT.x + 3 } }, at)
    expect(placeAt(at)).toBe('mailbox')
    expect(tapped.target).toMatchObject({ kind: 'place', id: 'mailbox' })
  })

  it('저장하고 불러와도 편지함이 남는다', () => {
    const s = withMailbox(newGame(CONTENT))
    expect(owns(deserialize(serialize(s), CONTENT)!.flags, 'homeMailbox')).toBe(true)
  })
})

describe('문구', () => {
  it('장면·일지 한 줄·이름·안내', () => {
    expect(SCENES.homeMailbox.lines.length).toBeGreaterThan(0)
    expect((T.journal.notes as Record<string, string>).homeMailbox).toBeTruthy()
    expect((T.easy.names as Record<string, string>).homeMailbox).toBe('집 앞 편지함')
    expect(T.post.mailboxTook).toContain('{n}')
    expect(T.post.mailboxEmpty).toBeTruthy()
  })
})
