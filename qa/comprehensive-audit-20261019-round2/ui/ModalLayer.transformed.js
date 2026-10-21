const useCallback = __vite__cjsImport4_react["useCallback"]; const useEffect = __vite__cjsImport4_react["useEffect"]; const useRef = __vite__cjsImport4_react["useRef"];const _jsxDEV = __vite__cjsImport70_react_jsxDevRuntime["jsxDEV"];import { BlankQuizDialog } from "/src/features/quiz/BlankQuiz.tsx";
import { SceneReplay } from "/src/features/scene/SceneReplay.tsx";
import { hasAuthoredStory } from "/src/render/authored-story-art.ts";
import { ScreenBoundary } from "/src/features/ScreenBoundary.tsx";
import __vite__cjsImport4_react from "/node_modules/.vite/deps/react.js?v=0b387ac0";
import { lazyScreen } from "/src/features/lazy-screen.ts";
import { isGhostClick } from "/src/shared/ghost.ts";
import { useGame } from "/src/store/game-store.ts";
import { CONTENT } from "/src/content/catalog.ts";
import { Bag } from "/src/features/bag/Bag.tsx";
import { Wardrobe } from "/src/features/family/Wardrobe.tsx";
import { KidTime } from "/src/features/family/KidTime.tsx";
import { AdoptForm } from "/src/features/companion/AdoptForm.tsx";
import { Desk } from "/src/features/desk/Desk.tsx";
import { CopyDesk } from "/src/features/desk/CopyDesk.tsx";
import { CopyResult } from "/src/features/desk/CopyResult.tsx";
import { GardenMenu } from "/src/features/garden/GardenMenu.tsx";
import { Journal } from "/src/features/journal/Journal.tsx";
import { Library } from "/src/features/library/Library.tsx";
import { RoomShelf } from "/src/features/library/RoomShelf.tsx";
import { BindView } from "/src/features/library/BindView.tsx";
import { ShelfDone } from "/src/features/library/ShelfDone.tsx";
import { BookView } from "/src/features/library/BookView.tsx";
import { HomeShelf } from "/src/features/library/HomeShelf.tsx";
import { JourneyBoard } from "/src/features/journey/JourneyBoard.tsx";
import { LetterBox } from "/src/features/letters/LetterBox.tsx";
import { CareMenu } from "/src/features/menus/CareMenu.tsx";
import { SpaceMenu } from "/src/features/menus/SpaceMenu.tsx";
import { PlaceMenu } from "/src/features/menus/PlaceMenu.tsx";
import { YardMenu } from "/src/features/menus/YardMenu.tsx";
import { DecorPick } from "/src/features/play/DecorPick.tsx";
import { TipLetterView } from "/src/features/letters/TipLetterView.tsx";
import { ReadPick } from "/src/features/menus/ReadPick.tsx";
import { CopiedReadPick } from "/src/features/menus/CopiedReadPick.tsx";
import { QuizView } from "/src/features/quiz/QuizView.tsx";
import { MiniGame } from "/src/features/mini/MiniGame.tsx";
import { MyLineForm } from "/src/features/passage/MyLineForm.tsx";
import { PassageWindow } from "/src/features/passage/PassageWindow.tsx";
import { Review } from "/src/features/review/Review.tsx";
import { SceneView } from "/src/features/scene/SceneView.tsx";
import { LandscapeScene } from "/src/features/scene/StarsScene.tsx";
import { landscapeKind } from "/src/render/scenic-moments-art.ts";
import { FeastView } from "/src/features/scene/FeastView.tsx";
import { OrdersView } from "/src/features/talk/OrdersView.tsx";
import { GiftPicker } from "/src/features/talk/GiftPicker.tsx";
import { TalkBox } from "/src/features/talk/TalkBox.tsx";
import { TradeBoard } from "/src/features/talk/TradeBoard.tsx";
import { BoardView } from "/src/features/talk/BoardView.tsx";
import { TravelView } from "/src/features/talk/TravelView.tsx";
import { ChildName } from "/src/features/child/ChildName.tsx";
import { FollowMenu } from "/src/features/companion/FollowMenu.tsx";
import { VillageMap } from "/src/features/map/VillageMap.tsx";
import { RankView } from "/src/features/library/RankView.tsx";
import { TravelMenu } from "/src/features/map/TravelMenu.tsx";
import { FirstLight, LookAround } from "/src/features/newland/FirstLight.tsx";
import { OtShelf } from "/src/features/newland/OtShelf.tsx";
import { FarewellLetter } from "/src/features/talk/FarewellLetter.tsx";
import { LoveVerseView } from "/src/features/talk/LoveVerseView.tsx";
import { SellStandView } from "/src/features/stall/SellStandView.tsx";
import { GameGuide } from "/src/features/play/GameGuide.tsx";
import { Settings } from "/src/features/play/Settings.tsx";
import { ScheduleDialog } from "/src/features/play/EventSchedule.tsx";
import { watchScrollHints } from "/src/features/scroll-hint.ts";
import { Word } from "/src/features/word/Word.tsx";
import { ReadingMeeting, meetingPassage } from "/src/features/meetings/ReadingMeeting.tsx";
import { NtContent } from "/src/features/passage/NtContent.tsx";
import { isOtBook } from "/src/engine/ot-books.ts";
import { VisitorTalk } from "/src/features/library/VisitorTalk.tsx";
import { InnGuestTalk } from "/src/features/talk/InnGuestTalk.tsx";
import { PieceAcquired } from "/src/features/passage/PieceAcquired.tsx";
var _jsxFileName = "C:/Users/wn410/OneDrive/Desktop/cloooo/twenty-seven/src/features/ModalLayer.tsx";
import __vite__cjsImport70_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=57237470";
const CookingView = lazyScreen(() => import("/src/features/cooking/CookingView.tsx").then((m) => m.CookingView));
const ClubList = lazyScreen(() => import("/src/features/clubs/ClubList.tsx").then((m) => m.ClubList));
const ClubSession = lazyScreen(() => import("/src/features/clubs/ClubSession.tsx").then((m) => m.ClubSession));
const FestList = lazyScreen(() => import("/src/features/fest/FestList.tsx").then((m) => m.FestList));
const FestSession = lazyScreen(() => import("/src/features/fest/FestSession.tsx").then((m) => m.FestSession));
const StallView = lazyScreen(() => import("/src/features/stall/StallView.tsx").then((m) => m.StallView));
const VillageSite = lazyScreen(() => import("/src/features/village/VillageSite.tsx").then((m) => m.VillageSite));
const Family = lazyScreen(() => import("/src/features/family/Family.tsx").then((m) => m.Family));
const FamilyTree = lazyScreen(() => import("/src/features/journal/FamilyTree.tsx").then((m) => m.FamilyTree));
const SchoolView = lazyScreen(() => import("/src/features/child/SchoolView.tsx").then((m) => m.SchoolView));
const BuildMenu = lazyScreen(() => import("/src/features/newland/BuildMenu.tsx").then((m) => m.BuildMenu));
const FacilityView = lazyScreen(() => import("/src/features/newland/FacilityView.tsx").then((m) => m.FacilityView));
function Body() {
	const modal = useGame((s) => s.modal);
	if (!modal) return null;
	switch (modal.kind) {
		case "libraryVisitor": return /* @__PURE__ */ _jsxDEV(VisitorTalk, { day: modal.day }, modal.day, false, {
			fileName: _jsxFileName,
			lineNumber: 91,
			columnNumber: 14
		}, this);
		case "innGuest": return /* @__PURE__ */ _jsxDEV(InnGuestTalk, {
			id: modal.id,
			first: modal.first
		}, modal.id, false, {
			fileName: _jsxFileName,
			lineNumber: 93,
			columnNumber: 14
		}, this);
		case "settings": return /* @__PURE__ */ _jsxDEV(Settings, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 95,
			columnNumber: 14
		}, this);
		case "crossing": return /* @__PURE__ */ _jsxDEV(TravelMenu, { to: modal.to }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 97,
			columnNumber: 14
		}, this);
		case "firstLight": return /* @__PURE__ */ _jsxDEV(FirstLight, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 99,
			columnNumber: 14
		}, this);
		case "lookAround": return /* @__PURE__ */ _jsxDEV(LookAround, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 101,
			columnNumber: 14
		}, this);
		case "build": return /* @__PURE__ */ _jsxDEV(BuildMenu, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 103,
			columnNumber: 14
		}, this);
		case "otShelf": return /* @__PURE__ */ _jsxDEV(OtShelf, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 105,
			columnNumber: 14
		}, this);
		case "guide": return /* @__PURE__ */ _jsxDEV(GameGuide, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 107,
			columnNumber: 14
		}, this);
		case "blankQuiz": return /* @__PURE__ */ _jsxDEV(BlankQuizDialog, { initialTarget: modal.target }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 109,
			columnNumber: 14
		}, this);
		case "clubs": return /* @__PURE__ */ _jsxDEV(ClubList, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 111,
			columnNumber: 14
		}, this);
		case "clubSession": return /* @__PURE__ */ _jsxDEV(ClubSession, { id: modal.id }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 113,
			columnNumber: 14
		}, this);
		case "fests": return /* @__PURE__ */ _jsxDEV(FestList, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 115,
			columnNumber: 14
		}, this);
		case "festSession": return /* @__PURE__ */ _jsxDEV(FestSession, { id: modal.id }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 117,
			columnNumber: 14
		}, this);
		case "stall": return /* @__PURE__ */ _jsxDEV(StallView, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 119,
			columnNumber: 14
		}, this);
		case "cooking": return /* @__PURE__ */ _jsxDEV(CookingView, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 121,
			columnNumber: 14
		}, this);
		case "village": return /* @__PURE__ */ _jsxDEV(VillageSite, { id: modal.id }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 123,
			columnNumber: 14
		}, this);
		case "schedule": return /* @__PURE__ */ _jsxDEV(ScheduleDialog, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 125,
			columnNumber: 14
		}, this);
		case "readingMeeting": return /* @__PURE__ */ _jsxDEV(ReadingMeeting, { day: modal.day }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 127,
			columnNumber: 14
		}, this);
		case "talk":
 // 대화 내용이 바뀌면 새 큐를 만든다. 읽음 기록 갱신만으로는 큐를 다시 만들지 않는다.
		return /* @__PURE__ */ _jsxDEV(TalkBox, { modal }, JSON.stringify([
			modal.neighborId,
			modal.line,
			modal.letter,
			modal.popup
		]), false, {
			fileName: _jsxFileName,
			lineNumber: 130,
			columnNumber: 14
		}, this);
		case "passage": return /* @__PURE__ */ _jsxDEV(PassageWindow, {
			pieceId: modal.pieceId,
			askLine: modal.askLine,
			back: modal.back,
			said: modal.said
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 132,
			columnNumber: 14
		}, this);
		case "myLine": return /* @__PURE__ */ _jsxDEV(MyLineForm, { lineKey: modal.lineKey }, modal.lineKey, false, {
			fileName: _jsxFileName,
			lineNumber: 134,
			columnNumber: 14
		}, this);
		case "desk":
 // 예전 엮기·옮겨 적기 창 — 계획 14부터 집 책상은 'copy'를 연다 (이 창으로 가는 길은 닫혔다)
		return /* @__PURE__ */ _jsxDEV(Desk, {
			result: modal.result,
			dark: modal.dark
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 137,
			columnNumber: 14
		}, this);
		case "copy": return /* @__PURE__ */ _jsxDEV(CopyDesk, { modal }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 139,
			columnNumber: 14
		}, this);
		case "review": return /* @__PURE__ */ _jsxDEV(Review, { pieceId: modal.pieceId }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 141,
			columnNumber: 14
		}, this);
		case "journal": return /* @__PURE__ */ _jsxDEV(Journal, {
			tab: modal.tab,
			neighbor: modal.neighbor
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 143,
			columnNumber: 14
		}, this);
		case "familyTree": return /* @__PURE__ */ _jsxDEV(FamilyTree, {
			personId: modal.personId,
			neighborId: modal.neighborId
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 145,
			columnNumber: 14
		}, this);
		case "sceneReplay": return /* @__PURE__ */ _jsxDEV(SceneReplay, { id: modal.id }, modal.id, false, {
			fileName: _jsxFileName,
			lineNumber: 147,
			columnNumber: 14
		}, this);
		case "scene":
			if (hasAuthoredStory(modal.id) && modal.id !== "feastFire" && modal.id !== "allFeastFire") return /* @__PURE__ */ _jsxDEV(SceneView, {
				id: modal.id,
				chosen: modal.chosen
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 149,
				columnNumber: 105
			}, this);
			if ([
				"firstConfession",
				"childLeaves",
				"childStays"
			].includes(landscapeKind(modal.id) ?? "")) return /* @__PURE__ */ _jsxDEV(SceneView, {
				id: modal.id,
				chosen: modal.chosen
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 150,
				columnNumber: 104
			}, this);
			if (landscapeKind(modal.id)) return /* @__PURE__ */ _jsxDEV(LandscapeScene, {
				kind: landscapeKind(modal.id),
				sceneId: modal.id
			}, modal.id, false, {
				fileName: _jsxFileName,
				lineNumber: 151,
				columnNumber: 43
			}, this);
			// 서고 잔치 모닥불: 음식·조각 이야기·내 한 줄 낭독 (2026-10-13)
			if (modal.id === "feastFire" || modal.id === "allFeastFire") return /* @__PURE__ */ _jsxDEV(FeastView, { id: modal.id }, modal.id, false, {
				fileName: _jsxFileName,
				lineNumber: 153,
				columnNumber: 75
			}, this);
			return /* @__PURE__ */ _jsxDEV(SceneView, {
				id: modal.id,
				chosen: modal.chosen
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 154,
				columnNumber: 14
			}, this);
		case "orders": return /* @__PURE__ */ _jsxDEV(OrdersView, { npc: modal.npc }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 156,
			columnNumber: 14
		}, this);
		case "mini": return /* @__PURE__ */ _jsxDEV(MiniGame, {
			state: modal.state,
			pending: modal.pending
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 158,
			columnNumber: 14
		}, this);
		case "gift": return /* @__PURE__ */ _jsxDEV(GiftPicker, { neighborId: modal.neighborId }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 160,
			columnNumber: 14
		}, this);
		case "trade": return /* @__PURE__ */ _jsxDEV(TradeBoard, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 162,
			columnNumber: 14
		}, this);
		case "board": return /* @__PURE__ */ _jsxDEV(BoardView, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 164,
			columnNumber: 14
		}, this);
		case "travel": return /* @__PURE__ */ _jsxDEV(TravelView, {
			dest: modal.dest,
			rewards: modal.rewards
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 166,
			columnNumber: 14
		}, this);
		case "childName": return /* @__PURE__ */ _jsxDEV(ChildName, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 168,
			columnNumber: 14
		}, this);
		case "follow": return /* @__PURE__ */ _jsxDEV(FollowMenu, { who: modal.who }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 170,
			columnNumber: 14
		}, this);
		case "villageMap": return /* @__PURE__ */ _jsxDEV(VillageMap, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 172,
			columnNumber: 14
		}, this);
		case "rank": return /* @__PURE__ */ _jsxDEV(RankView, { history: modal.history }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 174,
			columnNumber: 14
		}, this);
		case "farewell": return /* @__PURE__ */ _jsxDEV(FarewellLetter, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 176,
			columnNumber: 14
		}, this);
		case "loveVerse": return /* @__PURE__ */ _jsxDEV(LoveVerseView, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 178,
			columnNumber: 14
		}, this);
		case "sellStand": return /* @__PURE__ */ _jsxDEV(SellStandView, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 180,
			columnNumber: 14
		}, this);
		case "facility": return /* @__PURE__ */ _jsxDEV(FacilityView, {
			id: modal.id,
			at: modal.at
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 182,
			columnNumber: 14
		}, this);
		case "school": return /* @__PURE__ */ _jsxDEV(SchoolView, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 184,
			columnNumber: 14
		}, this);
		case "letter": return /* @__PURE__ */ _jsxDEV(LetterBox, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 186,
			columnNumber: 14
		}, this);
		case "menu": return /* @__PURE__ */ _jsxDEV(PlaceMenu, { place: modal.place }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 188,
			columnNumber: 14
		}, this);
		case "yard": return /* @__PURE__ */ _jsxDEV(YardMenu, { item: modal.item }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 190,
			columnNumber: 14
		}, this);
		case "decorPick": return /* @__PURE__ */ _jsxDEV(DecorPick, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 192,
			columnNumber: 14
		}, this);
		case "tipLetter": return /* @__PURE__ */ _jsxDEV(TipLetterView, { all: modal.all }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 194,
			columnNumber: 14
		}, this);
		case "readPick": return modal.source === "copied" ? /* @__PURE__ */ _jsxDEV(CopiedReadPick, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 196,
			columnNumber: 42
		}, this) : /* @__PURE__ */ _jsxDEV(ReadPick, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 196,
			columnNumber: 63
		}, this);
		case "quiz": return /* @__PURE__ */ _jsxDEV(QuizView, { modal }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 198,
			columnNumber: 14
		}, this);
		case "care": return /* @__PURE__ */ _jsxDEV(CareMenu, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 200,
			columnNumber: 14
		}, this);
		case "family": return /* @__PURE__ */ _jsxDEV(Family, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 202,
			columnNumber: 14
		}, this);
		case "wardrobe": return /* @__PURE__ */ _jsxDEV(Wardrobe, { who: modal.who }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 204,
			columnNumber: 14
		}, this);
		case "bag": return /* @__PURE__ */ _jsxDEV(Bag, { tab: modal.tab }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 206,
			columnNumber: 14
		}, this);
		case "companion": return /* @__PURE__ */ _jsxDEV(AdoptForm, { animal: modal.animal }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 208,
			columnNumber: 14
		}, this);
		case "library": return /* @__PURE__ */ _jsxDEV(Library, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 210,
			columnNumber: 14
		}, this);
		case "roomShelf": return /* @__PURE__ */ _jsxDEV(RoomShelf, { room: modal.room }, modal.room, false, {
			fileName: _jsxFileName,
			lineNumber: 212,
			columnNumber: 14
		}, this);
		case "bind": return /* @__PURE__ */ _jsxDEV(BindView, { modal }, modal.book, false, {
			fileName: _jsxFileName,
			lineNumber: 214,
			columnNumber: 14
		}, this);
		case "shelfDone": return /* @__PURE__ */ _jsxDEV(ShelfDone, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 216,
			columnNumber: 14
		}, this);
		case "journey": return /* @__PURE__ */ _jsxDEV(JourneyBoard, { board: modal.board ?? "acts" }, modal.board ?? "acts", false, {
			fileName: _jsxFileName,
			lineNumber: 218,
			columnNumber: 14
		}, this);
		case "garden": return /* @__PURE__ */ _jsxDEV(GardenMenu, { at: modal.at }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 220,
			columnNumber: 14
		}, this);
		case "word": return /* @__PURE__ */ _jsxDEV(Word, { tab: modal.tab }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 222,
			columnNumber: 14
		}, this);
		case "bookView": return /* @__PURE__ */ _jsxDEV(BookView, { modal }, modal.book, false, {
			fileName: _jsxFileName,
			lineNumber: 224,
			columnNumber: 14
		}, this);
		case "homeShelf": return /* @__PURE__ */ _jsxDEV(HomeShelf, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 226,
			columnNumber: 14
		}, this);
		case "space": return /* @__PURE__ */ _jsxDEV(SpaceMenu, { id: modal.id }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 228,
			columnNumber: 14
		}, this);
		case "kidTime": return /* @__PURE__ */ _jsxDEV(KidTime, {
			done: modal.done,
			spouse: modal.spouse
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 230,
			columnNumber: 14
		}, this);
	}
}
/** 조각 id → 책 (한 번만 만든다) */
let pieceBooks = null;
const pieceBook = (id) => (pieceBooks ??= new Map(CONTENT.pieces.map((p) => [p.id, p.book]))).get(id);
export function ModalLayer() {
	const modal = useGame((s) => s.modal);
	const book = useGame((s) => s.game.copy.book);
	const deskBook = useGame((s) => s.game.activeBook);
	const copyResult = useGame((s) => s.copyResult);
	const acquired = useGame((s) => s.piecePopups[0]);
	const collected = useGame((s) => s.game.collected);
	// 창이 열려 있는 동안 스크롤되는 창에 "아래로 더 있어요"를 붙인다 (창이 바뀌면 MutationObserver가 다시 살핀다)
	const layer = useRef(null);
	const hints = useCallback((el) => {
		layer.current = el;
		return el ? watchScrollHints(el) : undefined;
	}, []);
	// 화면이 아무것도 그리지 않으면 닫을 수 없는 투명한 배경만 남았다 — 빈 창은 닫는다 (2026-10-19 감사 L-43)
	useEffect(() => {
		if (!modal || acquired || copyResult?.length) return;
		// 그린 뒤(이펙트)에 바로 본다 — 창 안에 요소가 하나도 없으면 닫는다
		const el = layer.current;
		if (el && !el.querySelector("*") && useGame.getState().modal === modal) useGame.getState().closeModal();
	});
	if (!modal && !copyResult?.length && !acquired) return null;
	const needed = [];
	if (modal?.kind === "copy" && modal.view !== "pick" && book && !isOtBook(book)) needed.push(book);
	if (modal?.kind === "desk" && deskBook) needed.push(deskBook);
	if (modal?.kind === "bookView") needed.push(modal.book);
	if (modal?.kind === "readingMeeting") needed.push(meetingPassage(modal.day).book);
	// 연인에게 건넬 구절: 모은 조각의 분위기를 보므로 그 책들의 본문을 먼저 불러온다 (2026-10-18 감사, Codex UI-06)
	if (modal?.kind === "loveVerse") for (const b of new Set(collected.map((id) => pieceBook(id)).filter((b) => !!b))) needed.push(b);
	// 지도를 누른 손가락을 뗄 때의 클릭이 방금 뜬 창의 단추를 누르지 않게 (shared/ghost.ts)
	const eatGhost = (e) => {
		if (isGhostClick()) {
			e.preventDefault();
			e.stopPropagation();
		}
	};
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "modal-backdrop",
		ref: hints,
		onClickCapture: eatGhost,
		children: acquired ? /* @__PURE__ */ _jsxDEV(PieceAcquired, { id: acquired }, acquired, false, {
			fileName: _jsxFileName,
			lineNumber: 275,
			columnNumber: 19
		}, this) : copyResult?.length ? /* @__PURE__ */ _jsxDEV(CopyResult, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 275,
			columnNumber: 89
		}, this) : /* @__PURE__ */ _jsxDEV(NtContent, {
			books: needed,
			onCancel: () => useGame.getState().closeModal(),
			children: /* @__PURE__ */ _jsxDEV(ScreenBoundary, { children: /* @__PURE__ */ _jsxDEV(Body, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 275,
				columnNumber: 215
			}, this) }, modal?.kind, false, {
				fileName: _jsxFileName,
				lineNumber: 275,
				columnNumber: 181
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 275,
			columnNumber: 106
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 274,
		columnNumber: 5
	}, this);
}
