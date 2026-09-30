# 사람들 내용 만들기 (계획 6b) — people.json을 이 스크립트로 만든다.
# 사용: python3 scripts/build-people.py  (src/content/people.json을 다시 만든다)
import json

def T(x, y): return {"x": x, "y": y}
def W(fr=None, to=None, days=None, weather=None, season=None):
    w = {}
    if fr is not None: w["from"] = fr
    if to is not None: w["to"] = to
    if days is not None: w["days"] = days
    if weather is not None: w["weather"] = weather
    if season is not None: w["season"] = season
    return w
def H(h, m=0): return h * 60 + m
def say(who, *t): return [{"speaker": who, "text": x} for x in t]
def nar(*t): return [{"speaker": "narration", "text": x} for x in t]
def R(at, when=None, doing=None, mutter=None, with_=None):
    r = {"at": at}
    if when: r["when"] = when
    if doing: r["doing"] = doing
    if mutter: r["mutter"] = mutter
    if with_: r["with"] = with_
    return r
_n = {}
def L(npc, text, depth, when=None, req=None, near=None, cool=False):
    _n[npc] = _n.get(npc, 0) + 1
    l = {"id": f"{npc}{_n[npc]}", "text": text, "depth": depth}
    if when: l["when"] = when
    if req: l["req"] = req
    if near: l["near"] = near
    if cool: l["cool"] = True
    return l
def C(label, color, reply, memory=None, promise=None):
    c = {"label": label, "color": color, "reply": reply}
    if memory: c["memory"] = memory
    if promise: c["promise"] = promise
    return c
def E(id, title, stage, at, lines, when=None, req=None, choices=None, gain=5, opens=None, confess=False, cool=None, album=None):
    e = {"id": id, "title": title, "stage": stage, "at": at, "lines": lines, "gain": gain}
    if when: e["when"] = when
    if req: e["req"] = req
    if choices: e["choices"] = choices
    if opens is not None: e["opens"] = opens
    if confess: e["confess"] = True
    if cool: e["cool"] = cool
    if album: e["album"] = album
    return e
def S(id, title, at, lines, memory, when=None, req=None, stage=None, npc=None):
    s = {"id": id, "title": title, "at": at, "lines": lines, "memory": memory}
    if when: s["when"] = when
    if req: s["req"] = req
    if stage is not None: s["stage"] = stage
    if npc: s["npc"] = npc
    return s

DRY, WET = ["dry"], ["wet"]
MARKET = [0]
WORKDAYS = [1, 2, 3, 4, 5, 6]

# ── 자리 ──
FORGE = T(32, 26)          # 대장간 흙마당 (모루 왼쪽 아래)
FORGE_BACK = T(35, 27)     # 대장간 뒤 풀밭 (밤)
FORGE_SIDE = T(34, 26)
WELL_SIDE = T(18, 13)      # 우물 곁
BAKERY_FRONT = T(9, 18)    # 빵집 앞 (점심)
BAKERY_FRONT2 = T(10, 18)
OVEN = T(9, 17)            # 바깥 화덕 곁
BAKERY_YARD = T(6, 19)
LAKE_ROAD = T(29, 32)      # 호숫가 길 (나루 밖)
LAKE_ROAD2 = T(28, 32)
PAVILION_SIDE = T(16, 32)
HALL_CORNER = T(3, 74)     # 사랑방 안 구석 (문 쪽 등불 옆)
PLAZA_STALL_T = T(27, 18)
PLAZA_STALL_W = T(22, 15)
PLAZA_STALL_P = T(23, 15)
PLAZA_MID = T(25, 17)
HILL_READ = T(15, 14)      # 언덕 벤치 옆 풀밭
TEA_FRONT = T(29, 10)
TEA_INSIDE = T(45, 64)
SMITH_DOOR_SIDE = T(45, 24)

people = {}

# ════════════════ 틸리 (대장간 딸) ════════════════
# 플레이 중: 아침마다 우물에서 물 두 동이를 한 번에 나른다(무리한다). 낮엔 대장간에서 망치질하며 숫자를 소리 내어 센다.
# 점심은 빵집 앞에서 웬델과 마지막 빵 하나를 두고 투닥거린다(어릴 적 친구). 장날엔 장터에서 못을 파는데 손님과 말다툼을 한다.
# 비 오는 날엔 대장간이 쉬어 사랑방 구석에서 뭔가를 줄로 간다(숨기는 것). 저녁엔 호숫가 길을 혼자 걷는다. 겨울 저녁은 불 곁.
# 밤늦게 아무도 없는 줄 알고 대장간 뒤에서 다친 새를 돌본다. 코에 늘 그을음이 묻어 있는데 본인은 모른다.
people["tilly"] = {
    "id": "tilly", "pace": 1.3, "dislikes": ["fig"],
    "routines": [
        R(WELL_SIDE, W(H(6), H(7), weather=DRY), "wait", ["하나, 둘… 두 동이면 한 번에 되지."]),
        R(FORGE, W(H(7), H(12)), "hammer", ["…마흔하나, 마흔둘.", "이번 건 결이 곱네.", "아빠는 또 늦잠이야."]),
        R(BAKERY_FRONT2, W(H(12), H(13), weather=DRY), "bread", ["올리브 빵 남았으려나."], with_="wendell"),
        R(FORGE, W(H(13), H(18)), "hammer", ["예순… 아, 몇까지 셌더라.", "불이 좀 약한데."]),
        R(LAKE_ROAD, W(H(18), H(19, 30), weather=DRY), "rest", ["물수제비 다섯 번이 최고 기록이야."]),
        R(FORGE, W(H(18), H(19, 30), season=["winter"]), "hammer", ["겨울엔 불 곁이 제일이지."]),
        R(PLAZA_STALL_T, W(H(8), H(12), days=MARKET), "hammer", ["튼튼한 못이요! …아무도 안 사네."]),
        R(HALL_CORNER, W(H(8), H(18), weather=WET), "rest", ["비 오는 날엔 불을 못 피우니까…", "쉿. 아무것도 안 해요."]),
    ],
    "offDays": {"chance": 0.06, "routines": [R(LAKE_ROAD2, W(H(7), H(17)), "rest", ["오늘은 망치 안 잡을 거야. 진짜로."])]},
    "lines": [
        # 처음 — 날씨·일·마을
        L("tilly", "대장간 앞은 뜨거우니까 너무 가까이 오지 마요.", 0),
        L("tilly", "못 필요하면 말해요. 튼튼한 거로 줄게요.", 0),
        L("tilly", "비 오면 불이 안 붙어서 하루 공쳐요. 싫어요.", 0, W(weather=WET)),
        L("tilly", "오늘 같은 날은 풀무 안 밟아도 땀이 나요.", 0, W(season=["summer"])),
        L("tilly", "손이 곱아서 망치가 자꾸 미끄러져요.", 0, W(season=["winter"])),
        L("tilly", "장날엔 손님들이 못 하나에 흥정을 해요. 못이 무슨 잘못이라고.", 0, W(days=MARKET)),
        L("tilly", "웬델 봤어요? 점심에 올리브 빵 남겨 두라고 해야 하는데.", 0, W(fr=H(10), to=H(12))),
        L("tilly", "아침에 물 두 동이 한 번에 나르는 거, 봤죠? 비밀이에요. 팔 아파요.", 0, W(fr=H(6), to=H(9))),
        # 중간 — 취미·가족·고민·다른 사람
        L("tilly", "아빠는 쇠는 쓸모가 있어야 한대요. 예쁜 건 쓸모가 없대요. 그런가?", 1),
        L("tilly", "웬델이랑은 여섯 살 때부터 싸웠어요. 이유는 기억 안 나요. 아마 빵.", 1),
        L("tilly", "망치질할 때 숫자를 세는 건… 안 세면 불안해서요. 이상하죠.", 1),
        L("tilly", "요즘 파피가 빵집 근처에서 자주 보여요. 웬델 얼굴이 빨개지던데.", 1, req={"thread": {"id": "bread", "phase": [1, 2]}}),
        L("tilly", "아빠가 요즘 기침을 해요. 불 때문이래요. 괜찮대요.", 1, W(season=["autumn", "winter"])),
        L("tilly", "…아빠랑 싸웠어요. 말 안 할래요.", 1, req={"thread": {"id": "forge", "phase": [0]}}),
        L("tilly", "문 앞에 새 망치 자루가 있었어요. 아빠 거예요. 말은 안 했어요, 둘 다.", 1, req={"thread": {"id": "forge", "phase": [1, 2]}}),
        L("tilly", "코에 뭐 묻었다고요? …아, 또. 왜 아무도 말 안 해 줘요?", 1, req={"memory": ["sootNose"]}),
        L("tilly", "그때 집게 잡아 줬잖아요. 손 안 데었죠? 이제 물어보네.", 1, req={"memory": ["tongs"]}),
        L("tilly", "이런 날씨만 되면 사랑방 구석에서 줄질하던 날 생각나요.", 1, W(weather=WET), {"memory": ["rain"]}),
        # 깊은 — 과거·두려움·앞날·가치관·플레이어와의 사이
        L("tilly", "엄마가 떠나고 나서 불은 제가 지폈어요. 열 살 때부터요. 그래서 불이 꺼지는 게 무서워요.", 2),
        L("tilly", "언젠가 마을 등불 고리를 전부 제가 만든 걸로 바꾸고 싶어요. 쓸모 있으면서 예쁜 거로.", 2),
        L("tilly", "{player}님은 쓸모 있는 일 하잖아요. 가끔 부러워요. …아니, 자주.", 2),
        L("tilly", "그 새, 봤다고 했죠. 아무한테도 안 보여 준 건데. 이상하게 안 싫어요.", 2, req={"memory": ["saw:bird"]}),
        L("tilly", "그날 호숫가에서 아무 말 안 해 줘서 고마웠어요. 말했으면 울었을 거예요.", 2, req={"memory": ["satQuiet"]}),
        # 연인
        L("tilly", "오늘 몇 번 셌게요? 망치 말고, {player}님 생각한 거. …백 번 넘어서 그만 셌어요.", 3),
        L("tilly", "아빠가 요즘 {player}님 오면 괜히 헛기침해요. 좋아서 그런 거예요.", 3),
        L("tilly", "그을음 묻었으면 이제 {player}님이 닦아 줘요. 약속.", 3, req={"memory": ["sootNose"]}),
        L("tilly", "비 오는 날은 여전히 싫어요. 근데 {player}님이랑 있으면 좀 괜찮아요.", 3, W(weather=WET)),
        # 서먹할 때
        L("tilly", "…지금 바빠요.", 0, cool=True),
        L("tilly", "기다렸는데. 됐어요. 괜찮아요. 진짜로.", 0, req={"memory": ["forgot:apothecaryVisit"]}, cool=True),
    ],
    "sightings": [
        S("tilly:bird", "늦은 밤의 대장간", FORGE_BACK,
          nar("대장간 뒤 풀밭, 꺼져 가는 불빛 옆에 틸리가 쪼그려 앉아 있다.", "손바닥 위에 날개를 다친 작은 새가 있다. 틸리는 가느다란 쇠막대로 부목을 대고 있다.")
          + say("tilly", "쉿… 괜찮아. 내일이면 좀 나을 거야. 아빠한텐 비밀이다.")
          + nar("아무도 없는 줄 아는 모양이다. 조용히 발걸음을 돌렸다."),
          "saw:bird", W(H(21, 30), H(22, 30), weather=DRY)),
        S("tilly:flower", "정자의 저녁", PAVILION_SIDE,
          nar("정자 곁에 틸리가 서 있다. 손가락 사이로 무언가를 굴리고 있다.", "손톱만 한 쇠꽃이다. 꽃잎 하나하나에 줄 자국이 곱다.")
          + say("tilly", "…쓸모없는 거. 그래도 예쁘잖아.")
          + nar("틸리는 쇠꽃을 주머니 깊숙이 넣고 호숫가 쪽으로 걸어갔다."),
          "saw:ironFlower", W(H(19), H(20), weather=DRY, season=["autumn", "summer"]), stage=3),
    ],
    "events": [
        E("tilly:tongs", "불꽃", 1, FORGE,
          say("tilly", "어, 거기! 잠깐만 이 집게 좀 잡아 줄래요? 쇠가 너무 달았어요!")
          + nar("틸리가 벌겋게 단 쇠막대를 모루 위에 올린다. 코끝에 그을음이 까맣게 묻어 있다.")
          + say("tilly", "하나, 둘, 셋…"),
          W(H(9), H(12), weather=DRY, days=WORKDAYS),
          choices=[
              C("집게를 꽉 잡는다", "warm", say("tilly", "…스물! 됐다! 손 괜찮아요? 처음인데 안 흔들렸네요."), "tongs"),
              C("“코에 그을음 묻었어요”", "tease", say("tilly", "지금 그게 중요해요?! …어디요? 여기? 아, 더 번졌다고요?") + nar("틸리는 소매로 코를 문지르다 오히려 얼굴 반쪽을 까맣게 만들었다."), "sootNose"),
              C("“왜 숫자를 세요?”", "honest", say("tilly", "…버릇이에요. 세면 안 틀리거든요. 딴 데 가서 말하지 마요."), "counting"),
          ], gain=5, opens=2),
        E("tilly:bread", "마지막 올리브 빵", 2, BAKERY_FRONT2,
          say("tilly", "웬델! 그거 내 거야. 어제 맡아 뒀잖아.")
          + say("wendell", "맡아 둔 적 없어. 넌 어제 '맡아 둔다'고 소리만 질렀지.")
          + say("tilly", "그게 맡아 둔 거지! …{player}님, 누구 편이에요?"),
          W(H(12), H(13), weather=DRY),
          choices=[
              C("틸리 편을 든다", "warm", say("tilly", "봐! {player}님도 내 편이래.") + say("wendell", "…다음엔 두 개 구울게. 됐지?"), "sidedTilly"),
              C("웬델 편을 든다", "tease", say("tilly", "배신자! …내일은 내가 먼저 올 거야.") + nar("틸리는 웃으면서 웬델의 어깨를 쳤다. 꽤 아파 보였다."), "sidedWendell"),
              C("반으로 나누자고 한다", "honest", say("wendell", "…그래, 반.") + say("tilly", "큰 쪽은 나야.") + nar("둘은 빵을 가르면서 또 싸웠다. 늘 이랬던 모양이다."), "splitBread"),
          ], gain=4),
        E("tilly:market", "튼튼한 못", 2, PLAZA_STALL_T,
          nar("장터 한쪽, 틸리의 못 좌판 앞에 손님이 없다.")
          + say("tilly", "아까 어떤 아저씨가 못이 비싸대요. 그래서 '그럼 손으로 박으세요' 했더니 가 버렸어요.")
          + say("tilly", "…제가 뭘 잘못했죠?"),
          W(H(8), H(12), days=MARKET),
          choices=[
              C("“제가 대신 불러 볼게요”", "warm", nar("“튼튼한 못 있어요!” 몇 번 부르자 손님이 하나둘 섰다.") + say("tilly", "…사람들이 {player}님 말은 듣네. 치사해."), "helpedStall"),
              C("“안 휘면 돈 돌려드림!” 이라고 써 붙이자고 한다", "tease", say("tilly", "…그거 좋다! 절대 안 휘니까 절대 안 돌려줘도 되고.") + nar("틸리는 나무판에 삐뚤빼뚤 글씨를 써 붙였다. 그날 못이 다 팔렸다."), "noBendSign"),
              C("“틸리 방식대로 해요”", "honest", say("tilly", "…그러니까 제 방식이 문제라는 거잖아요.") + nar("틸리는 한참 입을 삐죽이다가, 다음 손님에겐 조금 부드럽게 말했다."), "ownWay"),
          ], gain=6, opens=3),
        E("tilly:file", "비 오는 날의 줄질", 3, HALL_CORNER,
          nar("사랑방 구석, 등불 아래서 틸리가 무언가를 급히 등 뒤로 감춘다.")
          + say("tilly", "아, 아무것도 아니에요. 그냥… 줄질 연습.")
          + nar("등 뒤로 손톱만 한 쇠 잎사귀가 삐져나와 있다. 잎맥까지 새겨져 있다."),
          W(H(9), H(17), weather=WET),
          choices=[
              C("“예쁘다”고 말한다", "warm", say("tilly", "…예쁘기만 하고 쓸모는 없어요. 아빠가 그랬어요.") + say("tilly", "그래도… 고마워요."), "ironLeaf"),
              C("“얼마예요?” 하고 묻는다", "tease", say("tilly", "파는 거 아니에요! …근데 사면 얼마 줄 건데요?") + nar("틸리는 잎사귀를 손바닥에 올려 이리저리 비춰 보았다. 처음으로 값을 생각해 본 얼굴이다."), "ironLeaf"),
              C("“왜 숨겨요?” 하고 묻는다", "honest", say("tilly", "대장장이 딸이 이런 거 만들면 웃기잖아요. 못이나 만들지.") + nar("틸리는 잎사귀를 꽉 쥐었다가, 천천히 탁자 위에 내려놓았다."), "ironLeaf"),
          ], gain=6),
        E("tilly:quarrel", "호숫가의 저녁", 3, LAKE_ROAD,
          nar("틸리가 호숫가 길에 앉아 돌을 던지고 있다. 물수제비는 한 번도 안 뜬다.")
          + say("tilly", "아빠가 제 쇠꽃을 녹였어요. 쇠 아깝다고.")
          + say("tilly", "…열 살 때부터 불 지핀 건 난데."),
          W(H(18), H(21), weather=DRY), req={"thread": {"id": "forge", "phase": [0]}},
          choices=[
              C("“아버지도 걱정돼서였을 거예요”", "honest", say("tilly", "…알아요. 알아서 더 화나요."), "defendedFather"),
              C("같이 돌을 던진다", "tease", nar("둘이 번갈아 돌을 던졌다. 틸리가 처음으로 세 번을 튕겼다.") + say("tilly", "봤어요? 셋! …기분 좀 나아졌어요."), "skippedStones"),
              C("말없이 곁에 앉는다", "quiet", nar("해가 질 때까지 둘은 아무 말도 하지 않았다. 틸리가 한 번 코를 훌쩍였다."), "satQuiet"),
          ], gain=6),
        E("tilly:birdSeen", "날아간 새", 3, FORGE_BACK,
          nar("대장간 뒤, 틸리가 두 손을 모으고 서 있다.")
          + say("tilly", "…어? 왜 여기 있어요?")
          + nar("틸리 손안에서 작은 새가 고개를 내민다."),
          W(H(20), H(21, 30), weather=DRY), req={"memory": ["saw:bird"]},
          choices=[
              C("“그 새, 날 수 있어?”", "warm", say("tilly", "…봤구나. 그날 밤.") + nar("틸리가 손을 펼치자 새가 짧게 날아올라 지붕에 앉았다.") + say("tilly", "아무한테도 말 안 했죠? …다행이다. 봐 줘서, 그래도 좀 좋았어요."), "birdFree"),
              C("“그날 밤에 봤어요” 하고 솔직하게 말한다", "honest", say("tilly", "…엿봤어요?! 아니, 됐어요. 화 안 나요. 이상하게.") + nar("새가 날아올랐다. 틸리는 오래 하늘을 보았다."), "birdFree"),
          ], gain=7, opens=4),
        E("tilly:birdNew", "날아간 새", 3, FORGE_BACK,
          nar("대장간 뒤, 틸리가 두 손을 모으고 서 있다.")
          + say("tilly", "…어? 왜 여기 있어요?")
          + nar("틸리 손안에서 작은 새가 고개를 내민다. 날개에 가느다란 쇠 부목 자국이 남아 있다.")
          + say("tilly", "보름 전에 주웠어요. 날개가 부러져서. 이제 날 수 있을 것 같아요."),
          W(H(20), H(21, 30), weather=DRY), req={"notMemory": ["saw:bird"], "notSeen": ["tilly:birdSeen"]},
          choices=[
              C("같이 날려 보낸다", "warm", nar("틸리가 손을 펼치자 새가 짧게 날아올라 지붕에 앉았다.") + say("tilly", "…아빠한텐 비밀이에요. 대장장이 딸이 새나 돌본다고 하면 웃을 거예요."), "birdFree"),
              C("“부목을 쇠로 만들었어요?”", "honest", say("tilly", "쇠밖에 몰라서요. …웃기죠.") + nar("새가 날아올랐다. 틸리는 빈손을 한참 내려다보았다."), "birdFree"),
          ], gain=7, opens=4),
        E("tilly:cough", "밤의 기침", 4, FORGE_SIDE,
          nar("밤늦은 대장간, 집 안에서 대장장이의 기침 소리가 길게 이어진다.", "틸리가 불 꺼진 화덕 앞에 서 있다.")
          + say("tilly", "…불은 괜찮아요. 불은 제가 지키면 되거든요.")
          + say("tilly", "근데 아빠는 어떻게 지키는지 몰라요."),
          W(H(21), H(23), season=["autumn", "winter"]),
          choices=[
              C("“약방에 같이 가 봐요, 내일”", "warm", say("tilly", "…같이요? 진짜 올 거죠?") + nar("틸리가 처음으로 먼저 약속을 청했다."), "cough", {"id": "apothecaryVisit", "at": T(21, 29), "from": H(9), "to": H(12)}),
              C("“무서운 거 당연해요”", "honest", say("tilly", "…무섭다고 한 적 없는데.") + say("tilly", "…응. 무서워요."), "cough"),
              C("말없이 화덕에 불씨를 살린다", "quiet", nar("작은 불이 다시 붙었다. 틸리는 그 불을 한참 바라보다가 조그맣게 웃었다."), "cough"),
          ], gain=7, opens=5),
        E("tilly:confess", "대장간 불 앞에서", 5, FORGE,
          nar("저녁 대장간. 틸리가 망치질을 멈추지 않는다. 숫자를 세지 않는다.")
          + say("tilly", "…이거.")
          + nar("틸리가 불쑥 내민 손바닥 위에 작은 쇠꽃이 있다. 꽃잎 하나에 조그맣게 이름이 새겨져 있다. {player}의 이름이다.")
          + say("tilly", "쓸모는 없어요. 알아요. 근데 {player}님한테는 쓸모없는 거 주고 싶었어요.")
          + say("tilly", "좋아해요. 됐죠? 말했다. 이제 망치질할 거예요."),
          W(H(17), H(18, 30), weather=DRY, days=WORKDAYS), req={"seen": ["tilly:cough"]},
          choices=[
              C("“저도요”", "warm", say("tilly", "…어?! 진짜요? 잠깐, 망치 내려놓을게요.") + nar("틸리가 망치를 떨어뜨렸다. 발등 바로 옆이었다.")),
              C("“코에 그을음 묻었어요” 하고 웃는다", "tease", say("tilly", "지금?! 지금 그 말을 해요?!") + nar("틸리는 얼굴이 새빨개져서 코를 문질렀다. 그을음이 더 번졌다. 둘 다 웃음이 터졌다.") + say("tilly", "…대답은요?") + nar("고개를 끄덕이자 틸리가 조용해졌다.")),
              C("쇠꽃을 받아 오래 들여다본다", "quiet", nar("꽃잎의 줄 자국 하나하나를 들여다보는 동안 틸리는 숨도 안 쉬는 것 같았다.") + say("tilly", "…그거, 대답이죠? 그렇다고 할게요.")),
          ], gain=8, confess=True, album="대장간 불 앞의 쇠꽃"),
        E("tilly:dateLake", "물수제비", 4, LAKE_ROAD,
          say("tilly", "왔다! 오늘은 다섯 번 넘길 거예요. 보고 있어요.")
          + nar("틸리가 돌을 던진다. 넷에서 멈췄다.")
          + say("tilly", "…방금 건 연습."),
          W(H(18), H(19, 30), weather=DRY), req={"lover": True},
          choices=[
              C("다섯 번 튕기는 돌을 골라 준다", "warm", nar("납작하고 둥근 돌을 건넸다. 다섯 번. 틸리가 소리를 질렀다.") + say("tilly", "기록 갱신! 이 돌은 {player}님 거니까 반은 {player}님 기록이에요."), "fiveSkips"),
              C("먼저 던져서 여섯 번을 넘긴다", "tease", nar("여섯 번. 틸리가 입을 벌렸다.") + say("tilly", "…다시. 한 판 더. 이길 때까지."), "sixSkips"),
          ], gain=5),
        E("tilly:busy", "바쁜 날", 4, FORGE,
          say("tilly", "미안해요, 오늘 저녁 호숫가 못 가요. 등불 고리 스무 개 주문이 들어왔어요.")
          + say("tilly", "…어제도 못 갔잖아요. 알아요. 저도 싫어요.")
          + nar("틸리는 망치를 쥔 채 이쪽을 보지 못한다."),
          W(H(14), H(18), days=WORKDAYS), req={"lover": True, "seen": ["tilly:dateLake"]},
          choices=[
              C("“그럼 제가 풀무 밟을게요”", "warm", say("tilly", "…진짜로요? 그럼 반만 걸려요!") + nar("둘이 함께 일하니 해 지기 전에 스무 개가 끝났다. 호숫가엔 늦게라도 갔다."), "workedTogether"),
              C("“조금 서운해요” 하고 솔직하게 말한다", "honest", say("tilly", "…응. 저도 그렇게 말해 줘서 다행이에요. 안 말하면 모를 뻔했어요.") + say("tilly", "다음 장날 다음 날은 아무 일도 안 받을게요. 약속."), "saidHurt", {"id": "dayOff", "at": LAKE_ROAD, "from": H(17), "to": H(20)}),
          ], gain=4, cool=1),
    ],
}

# ════════════════ 웬델 (빵 굽는 집 아들) ════════════════
# 플레이 중: 해 뜨기 전 바깥 화덕 곁에서 반죽을 치대며 콧노래를 흥얼거린다(음정이 조금 틀린다). 손을 앞치마에 쉴 새 없이 턴다.
# 점심은 빵집 앞에서 틸리와 투닥거린다. 오전 늦게 찻집 쪽으로 빵을 나르다 찻집 창문을 오래 들여다본다(파피의 과자 때문에).
# 저녁엔 빵집 앞에서 아기 동생을 달래고, 맑은 밤엔 언덕 벤치 곁 풀밭에서 낡은 공책을 읽는다. 비 오는 오후엔 몰래 찻집에 앉아 있다.
# 장날엔 광장 좌판. 가끔 새벽에 호숫가 길로 나가 한참 서 있다 돌아온다(부치지 못한 편지).
people["wendell"] = {
    "id": "wendell", "pace": 0.8, "dislikes": ["olive"],
    "routines": [
        R(OVEN, W(H(4, 30), H(11)), "bread", ["흠흠흠… 음, 좀 높았나.", "소금 한 꼬집. 아니, 반 꼬집.", "오늘 반죽은 기분이 좋네."]),
        R(TEA_FRONT, W(H(11), H(12), weather=DRY, days=WORKDAYS), "bread", ["…저 과자는 버터를 얼마나 넣은 거지."]),
        R(BAKERY_FRONT, W(H(12), H(13), weather=DRY), "bread", ["틸리 오기 전에 올리브 빵 숨겨야지."], with_="tilly"),
        R(OVEN, W(H(13), H(17))),
        R(TEA_INSIDE, W(H(13), H(17), weather=WET), "tea", ["…연구하는 거예요. 과자 연구."]),
        R(BAKERY_YARD, W(H(17), H(19), weather=DRY), "music", ["자장, 자장… 왜 안 자니."]),
        R(HILL_READ, W(H(19), H(21), weather=DRY), "book", ["…버터를 먼저 녹인다고?", "이런 빵은 어떤 맛일까."]),
        R(PLAZA_STALL_W, W(H(6), H(12), days=MARKET), "bread", ["갓 구운 빵이요! …옆 좌판보다 따끈해요."]),
    ],
    "offDays": {"chance": 0.07, "routines": [R(LAKE_ROAD2, W(H(4, 30), H(6, 30)), "wait", ["…오늘도 못 부치겠네."])]},
    "lines": [
        L("wendell", "아침은 드셨어요? 안 드셨으면 이거라도.", 0, W(fr=H(5), to=H(10))),
        L("wendell", "빵은 기다려 주는 음식이에요. 서두르면 안 부풀어요.", 0),
        L("wendell", "손에 밀가루가 자꾸 묻어서… 아, 옷에 묻었네요. 죄송해요.", 0),
        L("wendell", "비 오는 날엔 반죽이 천천히 부풀어요. 제 기분도요.", 0, W(weather=WET)),
        L("wendell", "여름엔 가마 앞에 서 있으면 제가 구워지는 것 같아요.", 0, W(season=["summer"])),
        L("wendell", "장날엔 새벽 세 시에 일어나요. 오늘은 두 시 반이었어요.", 0, W(days=MARKET)),
        L("wendell", "틸리 못 봤어요? 점심에 또 올리브 빵 뺏어 갈 텐데.", 0, W(fr=H(10), to=H(12))),
        L("wendell", "동생이 밤새 울어서 반죽하다 졸았어요. 빵이 좀 납작하면 그 탓이에요.", 0, W(fr=H(5), to=H(12))),
        L("wendell", "어머니는 빵은 정직해야 한대요. 속이면 금방 티가 난대요.", 1),
        L("wendell", "틸리는 어릴 때 제 빵에 못을 박은 적이 있어요. 단단한지 보려고요.", 1),
        L("wendell", "찻집 과자, 드셔 봤어요? …아니, 그냥 궁금해서요. 맛이요.", 1, req={"thread": {"id": "bread", "phase": [0, 1]}}),
        L("wendell", "파피가 새벽에 반죽 배우러 와요. 손이 빨라요. …좀 분하게.", 1, req={"thread": {"id": "bread", "phase": [2]}}),
        L("wendell", "이제 파피랑은 서로 레시피 하나씩 바꿔요. 제가 이긴 거예요. 아마.", 1, req={"thread": {"id": "bread", "phase": [3]}}),
        L("wendell", "짜다고 했던 거 기억해요. 그날 이후로 소금은 반 꼬집만 넣어요.", 1, req={"memory": ["salty"]}),
        L("wendell", "동생이 {player}님 목소리 들으면 운 거 그쳐요. 신기하죠.", 1, req={"memory": ["lullaby"]}),
        L("wendell", "이런 비 오는 날엔 그날 찻집 생각나요. 둘이 과자 반씩 나눠 먹던 거.", 1, W(weather=WET), {"memory": ["rain"]}),
        L("wendell", "아버지 얼굴은 잘 기억 안 나요. 가마 불 앞에 서 있던 등만 기억나요.", 2),
        L("wendell", "도시의 큰 빵집에서 편지가 왔었어요. 일 년 전에요. 아직 답을 못 했어요.", 2, req={"memory": ["notebook"]}),
        L("wendell", "제가 떠나면 어머니 혼자 새벽 가마를 봐야 해요. 그게 무서워요. 떠나고 싶은 마음보다요.", 2),
        L("wendell", "제 이름 붙은 빵이 있으면, 아무도 제 얼굴은 몰라도 그 빵은 기억하겠죠.", 2),
        L("wendell", "{player}님은 남는 걸 만들잖아요. 책은 몇 백 년도 가요. 빵은 하루면 끝나고요. 그래도 저는 빵이 좋아요.", 2),
        L("wendell", "가 보라고 해 줬잖아요. 아직 못 갔지만, 그 말은 계속 가지고 다녀요.", 2, req={"memory": ["toldGo"]}),
        L("wendell", "여기 있어 달라고 했잖아요. 그 말 들은 날 반죽이 제일 잘 부풀었어요.", 2, req={"memory": ["toldStay"]}),
        L("wendell", "오늘 첫 빵은 {player}님 거예요. 매일 그렇게 할 거예요. 말리지 마세요.", 3),
        L("wendell", "{player}님이 만든 그 이상한 모양 빵, 아직 말려서 갖고 있어요. 버리라고 해도 안 버려요.", 3, req={"memory": ["myBread"]}),
        L("wendell", "비 오는 날엔 반죽이 천천히 부풀잖아요. 요즘은 그게 좋아요. 같이 있는 시간이 길어져서.", 3, W(weather=WET)),
        L("wendell", "…네. 괜찮아요.", 0, cool=True),
        L("wendell", "빵 식기 전에 오시지. …아니에요, 제가 괜히.", 0, cool=True),
    ],
    "sightings": [
        S("wendell:letter", "새벽 호숫가", LAKE_ROAD2,
          nar("해 뜨기 전 호숫가 길, 웬델이 편지 한 장을 들고 서 있다.", "편지를 반쯤 접었다가, 다시 폈다가, 앞치마 주머니에 넣는다.")
          + say("wendell", "…다음 장날엔 부칠 거야. 진짜로.")
          + nar("웬델은 한숨을 쉬고 빵집 쪽으로 걸어갔다. 손에는 여전히 밀가루가 묻어 있었다."),
          "saw:letter", W(H(4, 30), H(6, 30)), stage=1),
    ],
    "events": [
        E("wendell:first", "새벽의 빵", 1, OVEN,
          nar("해가 뜨기 전, 바깥 화덕 곁에서 웬델이 콧노래를 부르며 반죽을 치대고 있다. 음정이 조금 틀린다.")
          + say("wendell", "어, 일찍 일어나셨네요. 이거 오늘 첫 빵인데… 맛 좀 봐 주실래요? 솔직하게요."),
          W(H(5), H(9), weather=DRY),
          choices=[
              C("“맛있어요”", "warm", say("wendell", "…다행이다. 솔직하게라고 했는데 그 말이 제일 듣고 싶었어요."), "firstBread"),
              C("“조금 짜요”", "honest", say("wendell", "…역시. 소금 한 꼬집이 많았어요. 알았으면서 모른 척했어요.") + nar("웬델은 수첩에 무언가를 적었다. '짜다고 함. 고마운 사람.'"), "salty"),
              C("“콧노래 음정이 틀렸어요”", "tease", say("wendell", "빵 얘기를 해 달라니까요! …틀렸어요? 어디가요?") + nar("웬델은 다시 불러 보다가 또 틀렸다."), "offKey"),
          ], gain=5, opens=2),
        E("wendell:baby", "잠 안 자는 동생", 2, BAKERY_YARD,
          nar("빵집 앞, 웬델이 아기를 안고 좌우로 흔들며 노래를 부른다. 아기는 더 크게 운다.")
          + say("wendell", "왜… 왜 제가 부르면 더 울까요. 어머니가 부르면 바로 자는데."),
          W(H(17), H(19), weather=DRY),
          choices=[
              C("대신 안아서 흔들어 준다", "warm", nar("아기가 딸꾹질을 두 번 하더니 잠들었다.") + say("wendell", "…배신이다. 동생한테 배신당했어요.") + nar("웬델은 웃고 있었다."), "lullaby"),
              C("같이 노래를 부른다 (둘 다 음정이 틀린다)", "tease", nar("음정이 틀린 노래가 둘이 되자 아기가 울음을 멈추고 멀뚱히 쳐다보았다.") + say("wendell", "…너무 이상해서 그친 것 같아요."), "lullaby"),
              C("조용히 곁에 서서 기다린다", "quiet", nar("한참 뒤 아기가 제풀에 잠들었다. 웬델이 소리 없이 입 모양으로 말했다. '고마워요.'"), "lullaby"),
          ], gain=4),
        E("wendell:research", "과자 연구", 2, TEA_FRONT,
          say("wendell", "쉿. 저 창문 너머 과자 보여요? 요즘 저거 사려고 줄을 서요. 제 빵 말고.")
          + say("wendell", "…부탁이 있어요. 하나만 사다 주실래요? 연구용이에요. 연구용."),
          W(H(11), H(12), weather=DRY), req={"thread": {"id": "bread", "phase": [0, 1, 2, 3]}},
          choices=[
              C("사다 준다", "warm", nar("웬델은 과자를 반으로 쪼개 한참 들여다보더니 한 입 먹었다.") + say("wendell", "…맛있다. 분하게 맛있어요. 버터를 먼저 녹였네."), "boughtCake"),
              C("“직접 들어가서 사요”", "tease", say("wendell", "그럼 제가 궁금해하는 거 들키잖아요!") + nar("결국 웬델은 모자를 푹 눌러쓰고 들어갔다. 파피가 바로 알아보고 웃었다."), "wentInside"),
              C("“웬델 빵도 좋아요”", "honest", say("wendell", "…그 말은 좋은데, 그래도 궁금한 건 궁금해요.") + nar("웬델이 웃었다. 조금 편해진 얼굴이었다."), "reassured"),
          ], gain=5, opens=3),
        E("wendell:stalls", "나란한 좌판", 3, PLAZA_STALL_W,
          nar("장터, 웬델의 빵 좌판과 파피의 과자 좌판이 딱 붙어 있다.", "웬델이 빵을 한 줄씩 파피 쪽으로 슬금슬금 옮기고 있다.")
          + say("wendell", "…그냥, 햇빛 드는 쪽으로 옮기는 거예요."),
          W(H(9), H(12), days=MARKET), req={"thread": {"id": "bread", "phase": [1]}},
          choices=[
              C("“햇빛은 반대쪽이에요”", "tease", say("wendell", "…알아요.") + say("poppy", "알면 그만 옮기시죠, 빵집 아드님?") + nar("둘 다 웃음을 참다가 동시에 터뜨렸다."), "stallJoke"),
              C("빵 하나와 과자 하나를 같이 산다", "warm", say("wendell", "…둘 다요? 누구 게 더 맛있는지 꼭 말해 줘요. 아니, 말하지 마요."), "boughtBoth"),
          ], gain=4),
        E("wendell:notebook", "낡은 공책", 3, HILL_READ,
          nar("언덕 벤치 곁 풀밭에 웬델의 공책이 떨어져 있다. 웬델은 조금 떨어진 곳에서 하늘을 보고 있다.", "펼쳐진 쪽에 처음 보는 빵 그림들이 빼곡하다. 가장자리에 도시 이름이 적혀 있다.")
          + say("wendell", "앗, 그거… 제 거예요."),
          W(H(19), H(21), weather=DRY),
          choices=[
              C("“이 빵들, 직접 만든 거예요?”", "honest", say("wendell", "…아직 못 만든 거예요. 지나가던 사람들한테 들은 거 적어 둔 거고요.") + say("wendell", "도시에는 이런 빵이 있대요. 언젠가 가 보고 싶었어요. …있었어요."), "notebook"),
              C("“그림 실력이 빵보다 나은데요”", "tease", say("wendell", "그건 칭찬이에요, 욕이에요?") + nar("웬델은 공책을 받아 들고 가슴에 꼭 안았다. 표지가 닳아 반들반들하다."), "notebook"),
              C("말없이 공책을 덮어 돌려준다", "quiet", say("wendell", "…안 봤어요?") + nar("대답하지 않자 웬델이 작게 웃었다.") + say("wendell", "봤구나. 괜찮아요. {player}님이면."), "notebook"),
          ], gain=6, opens=4),
        E("wendell:letterTalk", "답장하지 못한 편지", 4, BAKERY_FRONT,
          nar("비 오는 저녁, 빵집 처마 밑에서 웬델이 젖은 편지를 들고 있다.")
          + say("wendell", "도시 빵집에서 온 거예요. 와서 배우라고. 일 년 전에.")
          + say("wendell", "가고 싶어요. 근데 제가 가면 어머니가 새벽마다 혼자예요. 동생은 아직 아기고요."),
          W(H(18), H(21), weather=WET),
          choices=[
              C("“가 봐요. 돌아오면 되잖아요”", "honest", say("wendell", "…돌아오면 된다. 그 생각은 못 했어요. 가면 끝인 줄 알았어요."), "toldGo"),
              C("“여기 있어 줘요”", "warm", say("wendell", "…그 말, 조금 기다렸던 것 같아요. 부끄럽게.") + nar("웬델은 편지를 접어 앞치마 주머니 깊숙이 넣었다."), "toldStay"),
              C("“웬델 마음이 먼저예요”", "quiet", say("wendell", "제 마음은… 둘 다예요. 그래서 일 년이나 걸렸나 봐요.") + nar("빗소리만 한참 들렸다."), "hisHeart"),
          ], gain=6),
        E("wendell:myBread", "내 모양 빵", 4, OVEN,
          nar("새벽 네 시 반, 화덕에 첫 불이 들어간다.")
          + say("wendell", "진짜 오셨네요. 이 시간에. …그럼 하나 빚어 보실래요? 아무 모양이나요.")
          + nar("반죽을 받아 빚었다. 무엇을 만들려던 건지 스스로도 모르겠다."),
          W(H(4, 30), H(6)),
          choices=[
              C("“고양이예요”", "tease", say("wendell", "…고양이요? 다리가 다섯 개인데요?") + nar("웬델은 한참 웃다가 그 빵을 제일 좋은 자리에 넣어 구웠다."), "myBread"),
              C("“웬델 빵이에요”", "warm", say("wendell", "…저요? 이게 저예요?") + nar("웬델은 빵을 오래 내려다보았다. 귀가 빨개졌다.") + say("wendell", "…구워서 말려 둘 거예요. 먹으면 아까워서."), "myBread"),
          ], gain=7, opens=5),
        E("wendell:confess", "첫 빵에 새긴 것", 5, OVEN,
          nar("해 뜨기 전 화덕 곁. 웬델이 콧노래를 부르지 않는다. 손을 앞치마에 문지르고, 또 문지른다.")
          + say("wendell", "오늘 첫 빵이에요. …위를 봐 주세요.")
          + nar("둥근 빵 위에 칼집으로 작은 글자가 새겨져 있다. {player}의 이름 첫 글자다.")
          + say("wendell", "말로 하려고 백 번 연습했는데, 결국 빵에 썼어요. 제가 제일 잘하는 걸로 말하고 싶어서요.")
          + say("wendell", "좋아해요. 오래전부터요. 소금 짜다고 말해 준 그날부터였을지도요."),
          W(H(5), H(6, 30)), req={"seen": ["wendell:myBread"]},
          choices=[
              C("빵을 두 손으로 받는다", "warm", say("wendell", "…받아 준 거죠? 그런 거죠?") + nar("웬델이 크게 숨을 내쉬었다. 그제야 콧노래가 나왔다. 여전히 음정이 틀렸다.")),
              C("“이번엔 안 짜요?”", "tease", say("wendell", "…반 꼬집이에요! 아니 지금 그게— 대답은요?!") + nar("웃으며 고개를 끄덕이자 웬델은 앞치마로 얼굴을 가렸다.")),
              C("빵을 반으로 나눠 한쪽을 건넨다", "quiet", nar("웬델이 빵 반쪽을 받아 들었다. 둘은 해가 뜰 때까지 말없이 빵을 먹었다.") + say("wendell", "…이게 대답이면, 제일 좋은 대답이에요.")),
          ], gain=8, confess=True, album="이름을 새긴 첫 빵"),
        E("wendell:dateTea", "찻집의 오후", 4, TEA_INSIDE,
          say("wendell", "여기서 만나자고 한 건… 파피 과자가 요즘 제일 맛있어서요. 인정해요.")
          + nar("파피가 과자 두 접시를 내려놓으며 웬델에게 눈을 찡긋했다.")
          + say("poppy", "빵집 아드님이 인정했대요. 오늘 기념으로 한 조각 더."),
          W(H(14), H(17)), req={"lover": True},
          choices=[
              C("웬델 몫까지 먹는다", "tease", say("wendell", "그건 제 거— …맛있죠? 분하죠? 저도 분해요.") + nar("셋이 함께 웃었다."), "ateHisCake"),
              C("“웬델 빵이 더 좋아요”라고 속삭인다", "warm", say("wendell", "…다 들렸어요. 파피한테도요.") + say("poppy", "안 들렸어요. 하나도요.") + nar("파피는 활짝 웃으며 돌아갔다."), "whisper"),
          ], gain=5),
        E("wendell:trip", "사흘", 4, LAKE_ROAD2,
          nar("새벽 호숫가, 웬델이 짐 보따리를 메고 있다.")
          + say("wendell", "도시 빵집에 사흘만 다녀올게요. 답장했어요. 배워 오려고요. …돌아오려고요.")
          + say("wendell", "사흘 동안 첫 빵을 못 드리는 게 제일 걱정이에요."),
          W(H(4, 30), H(6, 30)), req={"lover": True, "memory": ["notebook"]},
          choices=[
              C("“돌아오면 도시 빵 먼저 구워 줘요”", "warm", say("wendell", "…네. 제일 먼저요. 약속해요."), "tripPromise"),
              C("“사흘이면 저 잊을 거예요?” 하고 놀린다", "tease", say("wendell", "사흘 만에 잊을 거면 일 년 동안 편지를 안 부쳤겠어요?") + nar("웬델은 웃으며 손을 흔들고 떠났다."), "tripTease"),
          ], gain=5),
    ],
}

# ════════════════ 마을 사건에 나오는 원래 이웃들 (말 풀만 — 없으면 예전 대사) ════════════════
people["smith"] = {
    "id": "smith", "pace": 1, "routines": [],
    "lines": [
        L("smith", "…틸리가 요즘 저녁마다 어딜 가는지 아시오?", 0, req={"thread": {"id": "forge", "phase": [0]}}),
        L("smith", "쇠꽃 하나 녹인 걸로 사흘째 말을 안 하오. 쇠는 쇠인데.", 0, req={"thread": {"id": "forge", "phase": [0]}}),
        L("smith", "망치 자루는 새로 깎아 줬소. 말은… 뭐, 말은 됐소.", 0, req={"thread": {"id": "forge", "phase": [1]}}),
        L("smith", "틸리 녀석이 등불 고리에 잎사귀를 새겼더군. …꽤 봐줄 만하오.", 0, req={"thread": {"id": "forge", "phase": [2]}}),
    ],
}
people["poppy"] = {
    "id": "poppy", "pace": 1.5, "routines": [
        R(PLAZA_STALL_P, W(H(8), H(12), days=MARKET), "bread", ["꿀 과자요! 빵집보다 달아요!"]),
    ],
    "lines": [
        L("poppy", "요즘 꿀 과자를 굽기 시작했어요. 찻집 손님들이 좋아해요.", 0, req={"thread": {"id": "bread", "phase": [0, 1]}}),
        L("poppy", "빵집 아드님이 창문 밖에서 자꾸 들여다봐요. 과자가 궁금한가 봐요. 후후.", 0, req={"thread": {"id": "bread", "phase": [0, 1]}}),
        L("poppy", "새벽에 빵 반죽 배우러 다녀요. 웬델 선생님은 무서워요. 반죽한테만요.", 0, req={"thread": {"id": "bread", "phase": [2]}}),
        L("poppy", "웬델이랑 레시피를 하나씩 바꿨어요. 제 과자에 그 집 효모가 들어가요.", 0, req={"thread": {"id": "bread", "phase": [3]}}),
    ],
}
people["postman"] = {
    "id": "postman", "pace": 1, "routines": [],
    "lines": [
        L("postman", "대장간 부녀가 요즘 말이 없대요. 편지 전해 줄 때도 따로따로 받더라고요.", 0, req={"thread": {"id": "forge", "phase": [0]}}),
        L("postman", "빵집 아드님이 도시로 가는 편지를 한 통 맡기려다 도로 가져갔어요. 벌써 세 번째예요.", 0, req={"thread": {"id": "bread", "phase": [0, 1, 2]}}),
    ],
}
people["baker"] = {
    "id": "baker", "pace": 1, "routines": [],
    "lines": [
        L("baker", "웬델이 요즘 찻집 과자 얘기만 해요. 경쟁심인지 뭔지.", 0, req={"thread": {"id": "bread", "phase": [0, 1]}}),
        L("baker", "새벽에 찻집 아가씨가 반죽 배우러 와요. 웬델이 신나서 가르쳐요. 티는 안 내려고 하지만.", 0, req={"thread": {"id": "bread", "phase": [2, 3]}}),
    ],
}

# ════════════════ 마을 사건 ════════════════
threads = [
    {
        "id": "forge", "end": 18,
        "phases": [
            {
                "day": 9,
                "routines": {"tilly": [R(LAKE_ROAD, W(H(18), H(21)), "rest", ["…쇠 아깝다고. 쇠가.", "물수제비도 안 되네, 오늘은."])]},
                "sightings": [S("forge:quarrel", "대장간의 다툼", FORGE_SIDE,
                    nar("대장간 앞에서 큰 소리가 난다.")
                    + say("smith", "쓸데도 없는 걸 만드느라 쇠를 버리냐!")
                    + say("tilly", "버린 거 아니에요! 만든 거예요!")
                    + nar("틸리가 망치를 내려놓고 뛰어나갔다. 대장장이는 한참 그 자리에 서 있다가, 모루를 한 번 쓰다듬었다."),
                    "saw:quarrel", W(H(16, 30), H(18)), npc="tilly")],
            },
            {
                "day": 12,
                "sightings": [S("forge:handle", "새벽의 망치 자루", SMITH_DOOR_SIDE,
                    nar("해 뜨기 전, 대장장이가 새로 깎은 망치 자루를 틸리 방 창문 아래 조용히 세워 둔다.", "손잡이에 작은 잎사귀 무늬가 서툴게 새겨져 있다.")
                    + nar("대장장이는 헛기침을 한 번 하고 대장간으로 들어갔다."),
                    "saw:handle", W(H(5), H(6, 30)), npc="smith")],
            },
            {"day": 14},
        ],
    },
    {
        "id": "bread", "end": 24,
        "phases": [
            {"day": 5},
            {
                "day": 8,
                "sightings": [S("bread:swap", "장터의 비밀", PLAZA_MID,
                    nar("장이 파할 무렵, 파피가 웬델의 좌판에서 빵 하나를 몰래 산다. 모자를 눌러쓴 채로.", "조금 뒤, 웬델도 파피의 좌판에서 과자 하나를 몰래 산다. 역시 모자를 눌러쓴 채로.")
                    + nar("둘은 서로 모르는 척 광장 양 끝에서 각자 산 것을 한 입씩 먹었다. 표정이 똑같았다."),
                    "saw:swap", W(H(12), H(13)), npc="poppy")],
            },
            {
                "day": 12,
                "routines": {"poppy": [R(T(8, 18), W(H(5), H(7)), "bread", ["손목으로 누르라고요? …이렇게?"])]},
            },
            {"day": 18},
        ],
    },
]

out = {"people": people, "threads": threads}
open("/home/user/27maeul/src/content/people.json", "w").write(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
print("ok", {k: (len(v.get("lines", [])), len(v.get("events", []))) for k, v in people.items()})
