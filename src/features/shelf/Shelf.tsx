// 선반: 모은 것들을 본다 — 이야기 도감·받은 선물·만들 줄 아는 것·풍경 앨범·나의 한 줄·방 꾸미기
import { useState } from "react";
import { PIECES } from "../../content/catalog";
import { fill, ITEM_TEXT, SCENES, T } from "../../content/text";
import { FURNITURE } from "../../engine/room";
import { ItemIcon } from "../../shared/ItemIcon";
import { bookLineKey } from "../../engine/game";
import { BOOKS, type Book } from "../../engine/types";
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
  ...(T.quiz.gospels as Record<Book, string>),
};

export function Dex() {
  const collected = useGame((s) => s.game.collected);
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
  const list = PIECES.filter(
    (p) =>
      (book === "all" || p.book === book) && (!only || p.stamps.length === 0),
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
      <div className="dex-filter" role="group" aria-label={T.ui.dexBookPick}>
        {(["all", ...BOOKS] as const).map((b) => (
          <button
            key={b}
            className={book === b ? "on" : ""}
            aria-pressed={book === b}
            onClick={() => setBook(b)}
          >
            {BOOK_LABEL[b]}
          </button>
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
      {sections.map(({ key, book: b, chapter: c }) => {
        const inChapter = list.filter((p) => p.book === b && p.chapter === c);
        return (
          // 장이 많아지므로 기본은 접어 두고, 제목 줄에 모은 수만 보인다
          <details
            key={key}
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
                {(T.quiz.gospels as Record<string, string>)[b]}{" "}
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
                      className={`dex-item ${p.stamps.length === 0 ? "only" : ""}`}
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
                        {p.stamps.length === 0 && "✦ "}
                        {p.title}
                      </span>
                      <span className="piece-ref">{p.ref}</span>
                      <span className="dex-stamps">
                        {p.stamps.map((s) => (
                          <span key={s.ref} className={`mini-stamp ${s.kind}`}>
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
        );
      })}
    </div>
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

export function Album() {
  const album = useGame((s) => s.game.album);
  if (!album.length) return <p>{T.ui.albumEmpty}</p>;
  return (
    <div className="album-grid">
      {album.map((a) => {
        const img = albumImage(a.id);
        return (
          <figure key={a.id} className="album-card">
            {img ? (
              <img src={img} alt={SCENES[a.id]?.album ?? ""} />
            ) : (
              <div className="album-blank" />
            )}
            <figcaption>
              {SCENES[a.id]?.album} · {fill(T.ui.day, { day: a.day })}
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
  // 조각 한 줄: 옛 저장부터 써 온 조각 키
  const pieces = Object.entries(lines).filter(([k]) => !k.startsWith("book:"));
  if (!books.length && !pieces.length) return <p>{T.ui.myLinesEmpty}</p>;
  return (
    <>
      {books.length > 0 && (
        <>
          <h3>{T.ui.bookLinesTitle}</h3>
          <ul className="my-lines">
            {books.map((b) => {
              const key = bookLineKey(b);
              const text = lines[key];
              return (
                <li key={key}>
                  <span className="piece-ref">{lineLabel(key)}</span>
                  {text ? <q>{text}</q> : <span className="hint">{T.ui.bookLineNone}</span>}
                  <button
                    onClick={() => open({ kind: "myLine", lineKey: key, back: "shelf" })}
                  >
                    {text ? T.ui.bookLineEdit : T.ui.bookLineWrite}
                  </button>
                </li>
              );
            })}
          </ul>
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
