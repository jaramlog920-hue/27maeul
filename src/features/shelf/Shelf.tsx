// 선반: 모은 것들을 본다 — 이야기 도감·받은 선물·만들 줄 아는 것·풍경 앨범·나의 한 줄·방 꾸미기
import { Fragment, useState } from "react";
import { PIECES } from "../../content/catalog";
import { groupByRoom, pickableBooks } from "../../engine/books";
import { roomOf } from "../../engine/shelf-rooms";
import { fill, ITEM_TEXT, roomTitle, SCENES, T } from "../../content/text";
import { FURNITURE } from "../../engine/room";
import { ItemIcon } from "../../shared/ItemIcon";
import { bookLineKey } from "../../engine/game";
import { BOOKS, isGospel, type Book, type ItemId, type Piece } from "../../engine/types";
import { ACHIEVEMENTS } from "../../engine/achievements";
import { lineLabel } from "../passage/MyLineForm";
import { albumImage, useGame, type ShelfTab } from "../../store/game-store";

type Tab = ShelfTab;

export function Shelf({ tab: first = "dex" }: { tab?: Tab }) {
  const [tab, setTab] = useState<Tab>(first);
  const closeModal = useGame((s) => s.closeModal);
  const tabs: [Tab, string][] = [
    ["dex", T.ui.dex],
    ["album", T.ui.album],
    ["lines", T.ui.myLinesTitle],
    ["gifts", T.ui.gifts],
    ["recipes", T.ui.recipes],
    ["items", "물건 도감"],
    ["awards", "업적"],
  ];
  return (
    <div className="dialog shelf" role="dialog" aria-label={T.ui.shelfTitle}>
      {/* 목록이 길어져도 닫기는 늘 위에 붙어 있다 */}
      <div className="shelf-head">
        <h2>{T.ui.shelfTitle}</h2>
        <Decorate />
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
      <div className="tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "on" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "dex" && <Dex />}
      {tab === "gifts" && <Gifts />}
      {tab === "recipes" && <Recipes />}
      {tab === "album" && <Album />}
      {tab === "lines" && <Lines />}
      {tab === "items" && <Items />}
      {tab === "awards" && <Awards />}
    </div>
  );
}

/** 본문을 열었다 '뒤로' 돌아와도 고른 책·거르기·펼친 장을 기억한다 */
let rememberOnly = false;
let rememberBook: Book | "all" = "all";
const rememberOpen = new Set<string>();
// 책 이름은 "마태복음"처럼 온전히 쓴다 (사람 이름만 따로 쓰지 않는다 — verify 금지어)
const BOOK_LABEL: Record<Book | "all", string> = {
  all: T.ui.dexBookAll,
  ...(T.quiz.books as Record<Book, string>),
};

/** "한 복음서에만"(✦)은 네 복음서끼리 견준 표시 — 도장이 없는 사도행전 조각에는 붙이지 않는다 */
const onlyHere = (p: Piece) => isGospel(p.book) && p.stamps.length === 0;

/**
 * 도감에 보이는 책과 조각: 책상에서 고를 수 있는 책과 같다 (사도행전은 방이 열리고 조각이 있을 때만).
 * 방이 열리기 전에는 사도행전 조각도 거르기 버튼도 보이지 않는다
 */
export function dexView(
  pieces: readonly Piece[],
  flags: Readonly<Record<string, number | undefined>>,
  book: Book | "all",
  only: boolean,
): { books: Book[]; list: Piece[] } {
  const books = pickableBooks(
    flags,
    BOOKS.filter((b) => pieces.some((p) => p.book === b)),
  );
  const list = pieces.filter(
    (p) =>
      books.includes(p.book) &&
      (book === "all" || p.book === book) &&
      (!only || onlyHere(p)),
  );
  return { books, list };
}

export function Dex() {
  const collected = useGame((s) => s.game.collected);
  const flags = useGame((s) => s.game.flags);
  const open = useGame((s) => s.open);
  const [only, setOnlyState] = useState(rememberOnly);
  const setOnly = (v: boolean) => {
    rememberOnly = v;
    setOnlyState(v);
  };
  const [book, setBookState] = useState(rememberBook);
  const setBook = (b: Book | "all") => {
    rememberBook = b;
    setBookState(b);
  };
  const got = new Set(collected);
  const { books, list } = dexView(PIECES, flags, book, only);
  const rooms = groupByRoom(books);
  const filterButton = (b: Book | "all") => (
    <button
      key={b}
      className={book === b ? "on" : ""}
      aria-pressed={book === b}
      onClick={() => setBook(b)}
    >
      {BOOK_LABEL[b]}
    </button>
  );
  // 책마다 장을 따로 (마가 1장과 누가 1장을 한데 섞지 않는다)
  const sections = [...new Set(list.map((p) => `${p.book}:${p.chapter}`))].map(
    (k) => {
      const [b, chapter] = k.split(":");
      return { key: k, book: b, chapter: Number(chapter) };
    },
  );
  return (
    <div className="dex">
      {/* 책 거르기도 서고의 방으로 묶는다 (방이 둘 이상 열렸을 때만 방 이름) */}
      <div className="dex-filter" role="group" aria-label={T.ui.dexBookPick}>
        {filterButton("all")}
        {rooms.map(({ room, books: bs }) => (
          <Fragment key={room.id}>
            {rooms.length > 1 && (
              <span className="dex-room-name">{roomTitle(room)}</span>
            )}
            {bs.map(filterButton)}
          </Fragment>
        ))}
      </div>
      <div className="dex-filter">
        <button className={!only ? "on" : ""} onClick={() => setOnly(false)}>
          {T.ui.dexAll}
        </button>
        <button className={only ? "on" : ""} onClick={() => setOnly(true)}>
          ✦ {T.ui.dexOnly}
        </button>
        <span className="hint">
          {fill(T.ui.dexCount, {
            got: list.filter((p) => got.has(p.id)).length,
            all: list.length,
          })}
        </span>
      </div>
      <p className="stamp-note">{T.ui.stampNote}</p>
      {sections.map(({ key, book: b, chapter: c }, i) => {
        const inChapter = list.filter((p) => p.book === b && p.chapter === c);
        // 방이 바뀌는 자리에 방 이름 (방이 둘 이상 열렸을 때)
        const room = roomOf(b as Book);
        const newRoom =
          rooms.length > 1 &&
          (i === 0 || roomOf(sections[i - 1].book as Book).id !== room.id);
        return (
          <Fragment key={key}>
            {newRoom && <h3>{roomTitle(room)}</h3>}
            {/* 장이 많아지므로 기본은 접어 두고, 제목 줄에 모은 수만 보인다 */}
            <details
              className="dex-section"
              open={rememberOpen.has(key)}
              onToggle={(e) =>
                e.currentTarget.open
                  ? rememberOpen.add(key)
                  : rememberOpen.delete(key)
              }
            >
              <summary>
                <span>
                  {(T.quiz.books as Record<string, string>)[b]}{" "}
                  {fill(T.ui.chapterLabel, { chapter: c })}
                </span>
                <span className="hint">
                  {fill(T.ui.dexCount, {
                    got: inChapter.filter((p) => got.has(p.id)).length,
                    all: inChapter.length,
                  })}
                </span>
              </summary>
              <ul className="dex-list">
                {inChapter.map((p) =>
                  got.has(p.id) ? (
                    <li key={p.id}>
                      <button
                        className={`dex-item ${onlyHere(p) ? "only" : ""}`}
                        onClick={() =>
                          open({
                            kind: "passage",
                            pieceId: p.id,
                            askLine: false,
                            back: true,
                          })
                        }
                      >
                        <span className="piece-title">
                          {onlyHere(p) && "✦ "}
                          {p.title}
                        </span>
                        <span className="piece-ref">{p.ref}</span>
                        <span className="dex-stamps">
                          {p.stamps.map((s) => (
                            <span
                              key={s.ref}
                              className={`mini-stamp ${s.kind}`}
                            >
                              {s.ref.split(" ")[0]}
                              {s.kind === "similar" ? "≈" : ""}
                            </span>
                          ))}
                        </span>
                      </button>
                    </li>
                  ) : (
                    <li key={p.id} className="dex-item unknown">
                      <span className="piece-title">{T.ui.dexUnknown}</span>
                      <span className="piece-ref">{p.ref}</span>
                    </li>
                  ),
                )}
              </ul>
            </details>
          </Fragment>
        );
      })}
    </div>
  );
}

/** 물건 도감: 한 번이라도 가져 본 물건 (못 가져 본 것은 ?) */
function Items() {
  const found = useGame((s) => s.game.found ?? []);
  const all = Object.keys(ITEM_TEXT) as ItemId[];
  return (
    <>
      <p className="hint">
        모은 물건 {found.length} / {all.length}
      </p>
      <ul className="bag-list">
        {all.map((id) =>
          found.includes(id) ? (
            <li key={id}>
              <ItemIcon id={id} />
              <span className="bag-name">{ITEM_TEXT[id].name}</span>
              <span className="bag-desc">{ITEM_TEXT[id].desc}</span>
            </li>
          ) : (
            <li key={id} className="unknown">
              <span className="bag-name">?</span>
              <span className="bag-desc">아직 가져 본 적 없는 물건</span>
            </li>
          ),
        )}
      </ul>
    </>
  );
}

/** 업적: 이룬 것은 이룬 날과 함께, 못 이룬 것은 흐리게 */
function Awards() {
  const achieved = useGame((s) => s.game.achieved ?? []);
  return (
    <>
      <p className="hint">
        이룬 업적 {achieved.length} / {ACHIEVEMENTS.length}
      </p>
      <ul className="award-list">
        {ACHIEVEMENTS.map((a) => {
          const got = achieved.find((x) => x.id === a.id);
          return (
            <li key={a.id} className={got ? "on" : ""}>
              <strong>{got ? "★" : "☆"} {a.name}</strong>
              <span>{a.desc}</span>
              {got && <span className="award-day">{fill(T.ui.day, { day: got.day })}</span>}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Gifts() {
  const gifts = useGame((s) => s.game.giftsGot);
  if (!gifts.length) return <p>{T.ui.giftsEmpty}</p>;
  return (
    <ul className="bag-list">
      {gifts.map((id) => (
        <li key={id}>
          <ItemIcon id={id} />
          <span className="bag-name">{ITEM_TEXT[id].name}</span>
          <span className="bag-desc">{ITEM_TEXT[id].desc}</span>
        </li>
      ))}
    </ul>
  );
}

function Recipes() {
  const known = useGame((s) => s.game.recipesKnown);
  if (!known.length) return <p>{T.ui.recipesEmpty}</p>;
  return (
    <ul className="journal-list">
      {known.map((r) => (
        <li key={r}>{(T.recipes as Record<string, string>)[r]}</li>
      ))}
    </ul>
  );
}

/** 앨범 제목: 아이 이름(계획 12)을 넣는다 */
function albumTitle(id: string, kid: string | undefined): string {
  return (SCENES[id]?.album ?? "").replaceAll("{child}", kid ?? "아이");
}

export function Album() {
  const album = useGame((s) => s.game.album);
  const kid = useGame((s) => s.game.child?.name);
  if (!album.length) return <p>{T.ui.albumEmpty}</p>;
  return (
    <div className="album-grid">
      {album.map((a) => {
        const img = albumImage(a.id);
        return (
          <figure key={a.id} className="album-card">
            {img ? (
              <img src={img} alt={albumTitle(a.id, kid)} />
            ) : (
              <div className="album-blank" />
            )}
            <figcaption>
              {albumTitle(a.id, kid)} · {fill(T.ui.day, { day: a.day })}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

export function Lines() {
  const lines = useGame((s) => s.game.myLines);
  const shelved = useGame((s) => s.game.shelved);
  const open = useGame((s) => s.open);
  // 책 한 줄: 서고에 꽂은 책마다 한 칸 (나중에 적거나 고칠 수 있다)
  const books = BOOKS.filter(
    (b) => shelved[b] !== undefined || lines[bookLineKey(b)] !== undefined,
  );
  const rooms = groupByRoom(books);
  // 조각 한 줄: 옛 저장부터 써 온 조각 키
  const pieces = Object.entries(lines).filter(([k]) => !k.startsWith("book:"));
  if (!books.length && !pieces.length) return <p>{T.ui.myLinesEmpty}</p>;
  return (
    <>
      {books.length > 0 && (
        <>
          <h3>{T.ui.bookLinesTitle}</h3>
          {rooms.map(({ room, books: bs }) => (
            <Fragment key={room.id}>
              {rooms.length > 1 && (
                <h4 className="lines-room">{roomTitle(room)}</h4>
              )}
              <ul className="my-lines">
                {bs.map((b) => {
                  const key = bookLineKey(b);
                  const text = lines[key];
                  return (
                    <li key={key}>
                      <span className="piece-ref">{lineLabel(key)}</span>
                      {text ? (
                        <q>{text}</q>
                      ) : (
                        <span className="hint">{T.ui.bookLineNone}</span>
                      )}
                      <button
                        onClick={() =>
                          open({ kind: "myLine", lineKey: key, back: "shelf" })
                        }
                      >
                        {text ? T.ui.bookLineEdit : T.ui.bookLineWrite}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Fragment>
          ))}
        </>
      )}
      {pieces.length > 0 && (
        <>
          {books.length > 0 && <h3>{T.ui.pieceLinesTitle}</h3>}
          <ul className="my-lines">
            {pieces.map(([pid, text]) => (
              <li key={pid}>
                <span className="piece-ref">{lineLabel(pid)}</span>
                <q>{text}</q>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function Decorate() {
  const inv = useGame((s) => s.game.inv);
  const room = useGame((s) => s.game.room);
  const startDecorate = useGame((s) => s.startDecorate);
  const has = FURNITURE.some((f) => (inv[f] ?? 0) > 0) || room.length > 0;
  return (
    <button
      disabled={!has}
      title={has ? "" : T.ui.decorateNone}
      onClick={() => startDecorate("pick")}
    >
      {T.ui.decorate}
    </button>
  );
}
