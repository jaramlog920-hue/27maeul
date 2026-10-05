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

_old_poppy = people["poppy"]

# ════════════════ 코스모 (어부 댁 아들) ════════════════
# 플레이 중: 새벽 호숫가 길에서 그물을 손질하며 손가락을 핥아 바람을 잰다(셋에 하나는 틀린다). 오전엔 나루 끝에서 배를 띄운다.
# 점심은 광장 아래쪽에서 덱스터와 나란히 앉아 마을 소문을 떠든다. 저녁엔 광장에서 아무에게나 농담을 건다.
# 비 오는 날엔 사랑방 구석에서 그물을 깁는다. 안개 낀 날엔 절대 배를 띄우지 않고 호숫가 길에 우두커니 서 있다(이유는 말하지 않는다).
LAKE_W = T(13, 32)
DOCK = T(24, 33)
DOCK_END = T(24, 35)
PLAZA_LOW = T(28, 20)
PLAZA_LOW2 = T(27, 20)
PLAZA_WEST = T(21, 19)
HALL_NETS = T(10, 75)
people["cosmo"] = {
    "id": "cosmo", "pace": 1.4, "dislikes": ["honey"],
    "routines": [
        R(LAKE_W, W(H(5, 30), H(10)), "net", ["(손가락을 핥아 든다) …동풍. 아마도.", "그물 구멍 하나에 물고기 한 마리 도망."]),
        R(DOCK, W(H(10), H(12), weather=DRY), "net", ["오늘은 큰 놈 올 것 같은데."]),
        R(PLAZA_LOW, W(H(12), H(13), weather=DRY), "bread", ["덱스터, 그 얘기 들었어? 아니 이거 비밀인데."], with_="dexter"),
        R(LAKE_W, W(H(13), H(17))),
        R(PLAZA_WEST, W(H(17), H(19), weather=DRY), "wait", ["거기 지나가는 분! 오늘 운세 봐 드릴까요? 공짜예요, 틀려도."]),
        R(HALL_NETS, W(H(8), H(18), weather=WET), "net", ["비 오면 그물 깁는 날. 물고기들 쉬는 날."]),
        R(LAKE_W, W(H(6), H(18), weather=["fog"]), "wait", ["…오늘은 안 나가요. 그냥요."]),
    ],
    "offDays": {"chance": 0.07, "routines": [R(PLAZA_WEST, W(H(9), H(17)), "rest", ["오늘은 배도 쉬고 나도 쉬고."])]},
    "lines": [
        L("cosmo", "호수 바람이 서쪽이면 내일은 맑아요. 틀리면 동쪽 바람 탓이고요.", 0),
        L("cosmo", "물고기는 오늘 다 휴가래요. 한 마리도 안 왔어요.", 0),
        L("cosmo", "그물 냄새 나요? 미안해요, 이건 빠지지 않아요. 평생.", 0),
        L("cosmo", "비 오는 날엔 물고기가 수면 가까이 올라와요. 근데 저는 안 나가요. 추워서.", 0, W(weather=WET)),
        L("cosmo", "여름 호수는 따뜻해서 좋아요. …들어가진 않지만요.", 0, W(season=["summer"])),
        L("cosmo", "겨울엔 호수가 가장자리부터 얼어요. 얼음 깨지는 소리 들어 봤어요? 좀 무서워요. 아니 멋져요.", 0, W(season=["winter"])),
        L("cosmo", "장날엔 생선 값 흥정하는 게 낚시보다 어려워요.", 0, W(days=MARKET)),
        L("cosmo", "안개 낀 날은… 그냥 쉬는 날이에요.", 0, W(weather=["fog"])),
        L("cosmo", "형이 도시로 간 뒤로 배는 제가 몰아요. 형이 더 잘 몰았는데.", 1),
        L("cosmo", "덱스터는 양 이름을 다 외워요. 백 마리 넘는데. 저는 제 그물 구멍도 못 세요.", 1),
        L("cosmo", "루디 형은 말이 없어서 좋아요. 제가 두 사람 몫 떠드니까요.", 1),
        L("cosmo", "배가 부서졌어요. 폭풍에. …괜찮아요. 웃기죠? 괜찮아요.", 1, req={"thread": {"id": "boat", "phase": [0]}}),
        L("cosmo", "루디 형이 배를 고치는데 제 말은 하나도 안 들어요. 뱃머리가 제 배인데!", 1, req={"thread": {"id": "boat", "phase": [1]}}),
        L("cosmo", "배가 다시 떴어요! 루디 형이랑 첫 낚시 갔는데 형이 더 많이 잡았어요. 인생.", 1, req={"thread": {"id": "boat", "phase": [2, 3]}}),
        L("cosmo", "그날 같이 웃어 줘서 좋았어요. 제 농담에 웃는 사람 드물거든요.", 1, req={"memory": ["laughedTogether"]}),
        L("cosmo", "이런 비 오는 날엔 그날 그물 같이 깁던 거 생각나요. 손 찔렸죠, 그때?", 1, W(weather=WET), {"memory": ["rain"]}),
        L("cosmo", "어릴 때 형이 물에 빠졌어요. 저는 배 위에서 보기만 했어요. 손이 안 움직였어요.", 2),
        L("cosmo", "그래서 농담을 해요. 조용하면 그날 소리가 들려서요.", 2),
        L("cosmo", "언젠가 안개 낀 날에도 배를 띄워 보고 싶어요. 혼자는 말고요.", 2),
        L("cosmo", "안개 속에서 날 봤죠. 괜찮아요. 오히려 좀 편해요. 이제 척 안 해도 되니까.", 2, req={"memory": ["saw:froze"]}),
        L("cosmo", "오늘 농담 준비 안 했어요. {player}님 앞에선 요즘 자꾸 까먹어요.", 3),
        L("cosmo", "배 이름 바꿨어요. 뭔지는 안 알려 줄 거예요. 배 뒤에 가서 직접 봐요.", 3),
        L("cosmo", "안개 낀 날, 이제는 같이 나가 줄래요? 무섭긴 한데 {player}님 있으면 덜해요.", 3, W(weather=["fog"])),
        L("cosmo", "…오늘은 농담할 기분 아니에요.", 0, cool=True),
        L("cosmo", "어, 왔어요? …아니에요, 그냥 물 보고 있었어요.", 0, cool=True),
    ],
    "sightings": [
        S("cosmo:froze", "안개 낀 나루", DOCK_END,
          nar("안개 낀 저녁, 나루 끝에 코스모가 서 있다. 배 밧줄을 쥔 손이 떨린다.", "배에 오르려다 멈추고, 한 발 물러선다. 또 오르려다 멈춘다.")
          + say("cosmo", "…괜찮아. 괜찮다고. 형은 괜찮았잖아.")
          + nar("코스모는 결국 밧줄을 내려놓고 오래 물을 바라보았다. 평소의 웃음기가 하나도 없는 얼굴이다."),
          "saw:froze", W(H(17), H(19), weather=["fog", "rain"]), stage=2),
    ],
    "events": [
        E("cosmo:weather", "날씨 점", 1, LAKE_W,
          say("cosmo", "잠깐! 움직이지 마요.")
          + nar("코스모가 손가락을 핥아 하늘로 쳐든다. 아주 진지하다.")
          + say("cosmo", "내일은… 맑아요. 제 점은 셋에 둘은 맞아요. 믿어요?"),
          W(H(6), H(10), weather=DRY),
          choices=[
              C("“믿어요”", "warm", say("cosmo", "와, 처음으로 믿는 사람 나왔다! 내일 비 오면 제 탓 아니에요. 바람 탓이에요."), "believedWeather"),
              C("같이 손가락을 핥아 든다", "tease", nar("둘이 나란히 손가락을 쳐들었다. 지나가던 어부가 이상하게 쳐다보았다.") + say("cosmo", "…동풍이죠? 동풍 맞죠? 아, 우리 둘 다 틀렸을 수도."), "laughedTogether"),
              C("“셋에 하나는 틀린다고요?”", "honest", say("cosmo", "그러니까 셋에 둘은 맞잖아요! 사람도 그 정도면 잘하는 거예요."), "oneInThree"),
          ], gain=5, opens=2),
        E("cosmo:nets", "비 오는 날의 그물", 2, HALL_NETS,
          nar("사랑방 구석, 코스모가 그물을 무릎에 펼쳐 놓고 깁고 있다. 바늘에 손가락을 찔리고 또 찔린다.")
          + say("cosmo", "아얏. 이건 그물이 저를 깁는 거예요.")
          + say("cosmo", "좀 도와줄래요? 여기 매듭 좀 잡아 줘요."),
          W(H(9), H(17), weather=WET),
          choices=[
              C("매듭을 잡아 준다", "warm", nar("코스모가 콧노래를 부르며 그물을 기웠다. 두 시간이 금방 갔다.") + say("cosmo", "비 오는 날 이렇게 빨리 간 거 처음이에요."), "mendedNets"),
              C("“같이 찔려 드릴게요” 하고 바늘을 든다", "tease", nar("둘 다 세 번씩 찔렸다. 코스모가 배를 잡고 웃었다.") + say("cosmo", "우리 둘 다 어부는 못 하겠다."), "laughedTogether"),
          ], gain=5),
        E("cosmo:gossip", "광장의 소문", 2, PLAZA_WEST,
          say("cosmo", "들었어요? 대장간 틸리가 요즘 저녁마다 호숫가에 혼자 있대요. 제가 봤어요. 물수제비 한 번도 못 뜨던데.")
          + say("cosmo", "아, 이런 얘기하면 안 되나? …근데 걱정돼서 하는 말이에요. 진짜로."),
          W(H(17), H(19), weather=DRY),
          choices=[
              C("“틸리한테 직접 물어봐요”", "honest", say("cosmo", "…그렇죠. 제가 가면 또 농담이나 할 텐데.") + say("cosmo", "그래도 가 볼게요. 물수제비 알려 주러."), "toldAsk"),
              C("“소문 대장님” 하고 놀린다", "tease", say("cosmo", "소문 대장이 아니라 마을 걱정 대장이에요! …둘 다인가."), "gossipKing"),
              C("잠자코 끝까지 들어 준다", "quiet", nar("코스모는 한참 떠들다가 문득 멈췄다.") + say("cosmo", "…다 들어 준 사람 처음이에요. 다들 중간에 가거든요."), "listenedAll"),
          ], gain=6, opens=3),
        E("cosmo:boat", "부서진 배", 3, DOCK,
          nar("나루에 뱃머리가 부서진 배가 매여 있다. 코스모가 그 앞에서 웃고 있다. 이상하게 웃는다.")
          + say("cosmo", "폭풍이 제 배를 좋아했나 봐요. 꽉 안아 줬어요. 너무 세게."),
          W(H(9), H(17)), req={"thread": {"id": "boat", "phase": [0, 1]}},
          choices=[
              C("“안 웃어도 돼요”", "honest", say("cosmo", "…웃는 게 편해서 그래요.") + nar("코스모의 입꼬리가 천천히 내려왔다.") + say("cosmo", "사실 좀 울 것 같아요. 형이 물려준 배라서."), "stoppedJoking"),
              C("같이 뱃머리 조각을 줍는다", "warm", nar("둘이 물가에 흩어진 나뭇조각을 모았다. 코스모가 조각 하나를 오래 들여다보았다.") + say("cosmo", "…이거, 형이 새긴 거예요. 제 이름."), "pickedPieces"),
          ], gain=6),
        E("cosmo:fogWalk", "안개", 3, LAKE_W,
          nar("안개가 짙은 아침. 코스모가 호숫가 길에 서서 배를 보지 않는다.")
          + say("cosmo", "오늘은 안 나가요. 안개 낀 날은 원래 안 나가요. 어부들 규칙이에요.")
          + say("cosmo", "…사실 그런 규칙 없어요."),
          W(H(6), H(12), weather=["fog"]),
          choices=[
              C("“왜 안 나가요?”", "honest", say("cosmo", "형이 안개 낀 날 빠졌어요. 저는 배 위에 있었고요. 손이 안 움직였어요.") + say("cosmo", "처음 말해요. 이거."), "toldBrother"),
              C("말없이 같이 안개를 본다", "quiet", nar("한참 뒤 코스모가 작게 말했다.") + say("cosmo", "…고마워요. 아무것도 안 물어봐 줘서."), "fogQuiet"),
          ], gain=7, opens=4),
        E("cosmo:rowTogether", "노 젓기", 4, DOCK,
          say("cosmo", "배 다 고쳤어요! 루디 형이 뱃머리에 뭘 새겨 줬어요. 보러 올래요? 아니, 타 볼래요?")
          + nar("맑은 날의 호수. 코스모가 노를 건넨다."),
          W(H(10), H(15), weather=["sunny"]), req={"seen": ["cosmo:fogWalk"]},
          choices=[
              C("노를 받아 젓는다", "warm", nar("배가 빙글빙글 한자리를 맴돌았다. 코스모가 뒤로 넘어갈 듯 웃었다.") + say("cosmo", "완벽해요! 호수에서 제일 어지러운 배예요."), "rowedCircle"),
              C("“코스모가 저어요, 전 경치 볼래요”", "tease", say("cosmo", "손님 모시는 뱃사공이 됐네. 요금은 농담 세 개예요.") + nar("호수 한가운데서 코스모가 농담 대신 조용히 말했다.") + say("cosmo", "여기서 보면 마을이 한눈에 보여요. {player}님 집 지붕도요."), "sawVillage"),
          ], gain=7, opens=5),
        E("cosmo:confess", "안개 속에서", 5, DOCK,
          nar("안개 낀 아침. 나루에 코스모가 배 밧줄을 쥐고 서 있다. 손이 떨리지 않는다.")
          + say("cosmo", "오늘 나갈 거예요. 안개 속으로. 혼자는 무섭고요.")
          + nar("호수 한가운데, 하얀 안개뿐이다. 코스모가 노를 멈춘다. 농담을 하지 않는다.")
          + say("cosmo", "농담 없이 말할게요. 한 번만.")
          + say("cosmo", "좋아해요. 안개보다 {player}님이 없는 게 더 무서워졌어요. 그래서 오늘 나올 수 있었어요."),
          W(H(6), H(11), weather=["fog"]), req={"seen": ["cosmo:rowTogether"]},
          choices=[
              C("노를 같이 잡는다", "warm", nar("둘이 노를 나눠 잡자 배가 곧게 나아갔다. 안개가 조금씩 걷혔다.") + say("cosmo", "…이게 대답이죠? 농담 아니죠?")),
              C("“농담 없는 코스모, 처음 봐요”", "tease", say("cosmo", "…그러니까 대답을 빨리 해 줘야 다시 농담하죠!") + nar("웃으며 고개를 끄덕이자 코스모가 노를 놓치고 허둥댔다. 둘 다 웃었다.")),
              C("조용히 곁에 앉는다", "quiet", nar("배가 안개 속을 천천히 떠돌았다. 코스모가 처음으로 오래 조용했다. 편한 얼굴이었다.")),
          ], gain=8, confess=True, album="안개 속의 배"),
        E("cosmo:boatName", "배 이름", 4, DOCK,
          say("cosmo", "배 뒤를 봐요. 새 이름.")
          + nar("배 꼬리에 서툰 글씨가 새겨져 있다. 주인공의 이름이다. 루디가 새겨 준 것 같다. 한 글자가 거꾸로다."),
          W(H(10), H(16), weather=DRY), req={"lover": True},
          choices=[
              C("“한 글자 거꾸로예요”", "tease", say("cosmo", "…루디 형! 아니 괜찮아요, 이게 더 귀여워요. 그렇다고 해 줘요."), "backwardName"),
              C("“고마워요” 하고 배를 쓰다듬는다", "warm", say("cosmo", "이제 이 배는 안 부서져요. 이름이 너무 소중해서요. …방금 그거 농담 아니에요."), "boatNamed"),
          ], gain=5),
        E("cosmo:jealous", "형의 편지", 4, LAKE_W,
          say("cosmo", "형한테 편지 왔어요. 도시에서 같이 일하자고요. 배도 크대요.")
          + say("cosmo", "…가고 싶은 마음 반, 여기 있고 싶은 마음 반이에요. 반은 {player}님 때문이고요."),
          W(H(17), H(19)), req={"lover": True, "seen": ["cosmo:boatName"]},
          choices=[
              C("“같이 생각해 봐요”", "honest", say("cosmo", "…같이요. 네. 혼자 정하면 또 웃고 넘길 것 같았어요."), "decideTogether"),
              C("“여기 있어요, 제 뱃사공이잖아요”", "tease", say("cosmo", "요금 농담 세 개 아직 못 받았는데 가긴 어딜 가요.") + nar("코스모는 편지를 접어 그물 상자 맨 아래에 넣었다."), "staysBoatman"),
          ], gain=4, cool=1),
    ],
}

# ════════════════ 루디 (제본 골목 목수 댁 아들) ════════════════
# 플레이 중: 목수 집 앞 길에서 하루 종일 나무를 재고 깎는다. 손 뼘으로 무엇이든 잰다. 귀 뒤에 연필을 꽂고 있지만 쓰는 걸 본 사람이 없다.
# 점심은 우물가 풀밭에서 혼자 먹는다. 저녁이면 서고 문 앞 길에 서서 문을 올려다보다가 들어가지 않고 돌아간다.
# 장날엔 광장에 작은 가구를 내놓는다. 밤늦게 공방 앞에서 끌로 나무판에 글자를 새기며 연습한다(목격 — 글자가 자꾸 틀린다).
CARP_FRONT = T(15, 23)
WELL_GRASS = T(18, 12)
LIB_PATH = T(24, 7)
PLAZA_FURN = T(20, 20)
HALL_WOOD = T(9, 71)
people["rudy"] = {
    "id": "rudy", "pace": 0.6, "dislikes": ["herb"],
    "routines": [
        R(CARP_FRONT, W(H(7), H(12)), "wood", ["(손 뼘으로 재며) …일곱 뼘 반.", "결이 곧다."]),
        R(WELL_GRASS, W(H(12), H(13), weather=DRY), "bread", ["…."]),
        R(CARP_FRONT, W(H(13), H(18)), "wood", ["(대패 소리)", "…아니야. 다시."]),
        R(LIB_PATH, W(H(18), H(19), weather=DRY), "wait", ["…언젠가."]),
        R(PLAZA_FURN, W(H(8), H(12), days=MARKET), "wood", ["의자. 튼튼함. 싸게."]),
        R(HALL_WOOD, W(H(8), H(18), weather=WET), "wood", ["비 오는 날 나무는 말을 안 들어."]),
    ],
    "offDays": {"chance": 0.05, "routines": [R(T(19, 12), W(H(9), H(16)), "rest", ["오늘은 나무 말고 구름."])]},
    "lines": [
        L("rudy", "…안녕하세요.", 0),
        L("rudy", "의자 다리가 흔들리면 가져와요. 고쳐요.", 0),
        L("rudy", "비 오는 날 나무는 부어요. 사람도 좀 그렇고요.", 0, W(weather=WET)),
        L("rudy", "여름엔 나무가 잘 말라요. 좋은 계절.", 0, W(season=["summer"])),
        L("rudy", "장날. 의자 셋 팔았어요. 많이 판 거예요.", 0, W(days=MARKET)),
        L("rudy", "…이 책장은 일곱 뼘 반. 서고 책장은 아홉 뼘.", 0),
        L("rudy", "제본 골목에서 책 표지 나무는 제가 깎아요. 속은… 다른 사람들이 해요.", 1),
        L("rudy", "코스모는 시끄러워요. 그래서 같이 있으면 편해요. 제가 말 안 해도 되니까.", 1),
        L("rudy", "아버지는 제가 이어받길 원해요. 저도요. 아마.", 1),
        L("rudy", "코스모 배 뱃머리를 새로 깎아요. 코스모가 자꾸 참견해요. …그래도 들어요.", 1, req={"thread": {"id": "boat", "phase": [0, 1]}}),
        L("rudy", "배에 이름을 새겼어요. 코스모 형 이름. 글자가 좀 삐뚤어요.", 1, req={"thread": {"id": "boat", "phase": [2, 3]}}),
        L("rudy", "그때 선반 수평 봐 줬죠. 아직 수평이에요.", 1, req={"memory": ["level"]}),
        L("rudy", "이런 비 오는 날엔 사랑방에서 같이 나뭇결 보던 거 생각나요.", 1, W(weather=WET), {"memory": ["rain"]}),
        L("rudy", "…저, 글자 읽는 게 느려요. 줄이 춤을 춰요. 아무한테도 말 안 했어요.", 2, req={"seen": ["rudy:label"]}),
        L("rudy", "책을 만드는 골목에 사는데 책을 못 읽어요. 우습죠.", 2, req={"seen": ["rudy:label"]}),
        L("rudy", "서고 앞에 가끔 서 있어요. 들어가 본 적은 없어요. 읽는 사람들 곳 같아서.", 2),
        L("rudy", "나무는 좋아요. 결을 읽으면 되니까. 결은 안 춤춰요.", 2),
        L("rudy", "밤에 새긴 글자, 봤죠. …틀린 거 알아요. 매일 하나씩은 덜 틀려요.", 2, req={"memory": ["saw:carving"]}),
        L("rudy", "오늘 {player}님 이름 새겼어요. 한 번에 맞게.", 3),
        L("rudy", "서고에 같이 가 줄래요? 이제는 들어가 보고 싶어요.", 3),
        L("rudy", "천천히 읽어 줘요. 그 목소리로 들으면 줄이 덜 춤춰요.", 3),
        L("rudy", "…네.", 0, cool=True),
        L("rudy", "(대패질만 한다)", 0, cool=True),
    ],
    "sightings": [
        S("rudy:carving", "밤의 끌 소리", CARP_FRONT,
          nar("밤늦은 목수 집 앞. 등불 하나 아래서 루디가 나무판에 끌로 글자를 새기고 있다.", "한 글자 새기고, 한참 들여다보고, 대패로 밀어 버린다. 다시 새긴다.")
          + say("rudy", "…ㄹ이 아니라 ㄷ. 또.")
          + nar("나무판 옆에 대패로 밀어낸 얇은 나무 부스러기가 산처럼 쌓여 있다."),
          "saw:carving", W(H(21), H(22, 30), weather=DRY), stage=1),
    ],
    "events": [
        E("rudy:level", "수평", 1, CARP_FRONT,
          nar("루디가 선반 하나를 들고 한쪽 눈을 감고 있다.")
          + say("rudy", "…저기서 봐 줄래요. 기울었어요?"),
          W(H(8), H(17), weather=DRY, days=WORKDAYS),
          choices=[
              C("“왼쪽이 조금 높아요”", "honest", nar("루디가 대패를 두 번 밀었다. 다시 보라는 듯 고개를 까딱했다.") + say("rudy", "…고마워요. 눈이 좋네요."), "level"),
              C("“완벽해요”", "warm", nar("루디가 수평자를 대 보더니 작게 웃었다.") + say("rudy", "…왼쪽이 높아요. 그래도 고마워요."), "level"),
          ], gain=4, opens=2),
        E("rudy:label", "표지의 글자", 2, CARP_FRONT,
          say("rudy", "…이거, 뭐라고 쓰여 있어요?")
          + nar("루디가 제본 골목에서 온 책 표지 나무판을 내민다. 위에 적힌 책 제목이 또렷하다. 루디는 판을 쥔 채 눈을 피한다."),
          W(H(9), H(17), days=WORKDAYS),
          choices=[
              C("천천히 소리 내어 읽어 준다", "warm", nar("루디가 입 모양으로 따라 읽었다. 두 번.") + say("rudy", "…고마워요. 이거 비밀이에요."), "readForHim"),
              C("“혹시 읽기 어려워요?”", "honest", say("rudy", "…줄이 춤춰요. 어릴 때부터.") + nar("루디는 판을 내려놓고 오래 손을 털었다.") + say("rudy", "처음 말해요."), "askedReading"),
          ], gain=5),
        E("rudy:lunch", "우물가의 점심", 2, WELL_GRASS,
          nar("우물가 풀밭에 루디가 혼자 앉아 빵을 먹고 있다. 옆에 작은 나무 새가 놓여 있다.")
          + say("rudy", "…같이 먹을래요."),
          W(H(12), H(13), weather=DRY),
          choices=[
              C("나무 새를 들어 본다", "warm", say("rudy", "쉬는 시간에 깎았어요. …가져요.") + nar("나무 새는 손바닥에 쏙 들어왔다. 날개 결이 곱다."), "woodBird"),
              C("아무 말 없이 나란히 먹는다", "quiet", nar("둘 다 한마디도 하지 않았다. 빵이 다 떨어질 무렵 루디가 말했다.") + say("rudy", "…좋았어요. 이런 거."), "quietLunch"),
              C("“매일 여기서 혼자 먹어요?”", "honest", say("rudy", "…시끄러운 게 무서운 건 아닌데, 조용한 게 좋아요.") + say("rudy", "{player}님이 있어도 조용해서 좋네요."), "askedAlone"),
          ], gain=6, opens=3),
        E("rudy:library", "서고 문 앞", 3, LIB_PATH,
          nar("저녁, 루디가 서고 문 앞 길에 서서 문을 올려다보고 있다. 한 발 다가섰다가 멈춘다.")
          + say("rudy", "…저 안, 어때요? 읽는 사람들만 들어가는 곳 같아서."),
          W(H(18), H(19), weather=DRY),
          choices=[
              C("“책장 보러 들어가요. 루디 전문이잖아요”", "warm", say("rudy", "…책장.") + nar("루디가 처음으로 서고 문턱을 넘었다. 책장 모서리를 손 뼘으로 재며 작게 중얼거렸다.") + say("rudy", "아홉 뼘. 맞았어요."), "enteredLibrary"),
              C("“못 읽어도 들어갈 수 있어요”", "honest", say("rudy", "…그 말, 누군가 해 주길 기다렸나 봐요.") + nar("루디는 오늘은 들어가지 않았다. 대신 문을 한 번 쓰다듬고 돌아섰다. 걸음이 가벼웠다."), "canEnter"),
          ], gain=6),
        E("rudy:carvingTalk", "틀린 글자", 3, CARP_FRONT,
          nar("루디의 작업대 위에 글자 새긴 나무판이 여러 장 있다. 대부분 한두 글자가 틀렸다.")
          + say("rudy", "…연습해요. 밤마다. 끌로 새기면 줄이 안 춤춰요. 손으로 기억하니까."),
          W(H(13), H(18), weather=DRY), req={"seen": ["rudy:label"]},
          choices=[
              C("틀린 글자 옆에 맞는 글자를 손가락으로 써 준다", "warm", nar("루디가 손가락 끝을 따라 끌을 움직였다. 이번엔 맞았다.") + say("rudy", "…또 해 줘요. 내일도."), "taughtLetter", {"id": "letterLesson", "at": CARP_FRONT, "from": H(13), "to": H(18)}),
              C("“이 정도면 거의 다 맞았어요”", "honest", say("rudy", "거의는… 책에선 안 돼요. 그래도 좋은 말이에요."), "almostRight"),
          ], gain=7, opens=4),
        E("rudy:shelf", "책장", 4, CARP_FRONT,
          nar("루디의 작업대에 작은 책장 하나가 서 있다. 모서리가 둥글게 다듬어져 있다.")
          + say("rudy", "…{player}님 책상 옆 자리. 일곱 뼘 반. 재 봤어요. 몰래."),
          W(H(9), H(18), weather=DRY), req={"seen": ["rudy:carvingTalk"]},
          choices=[
              C("“몰래 재러 왔었어요?”", "tease", say("rudy", "…창문으로. 손 뼘은 멀리서도 돼요.") + nar("루디의 귀가 새빨개졌다."), "spyMeasure"),
              C("책장을 쓰다듬는다", "warm", say("rudy", "…좋아요? 다행이다.") + nar("루디는 그 말만 하고 한참 대패를 만지작거렸다."), "gotShelf"),
          ], gain=7, opens=5),
        E("rudy:confess", "새긴 이름", 5, CARP_FRONT,
          nar("저녁, 루디가 작은 나무판 하나를 내민다. 말없이.", "나무판에 글자가 새겨져 있다. 주인공의 이름, 그리고 그 아래 '좋아해요'. 한 글자가 틀렸다. '좋아헤요'.")
          + say("rudy", "…틀렸죠. 알아요. 백 번 새겼는데 마지막에 손이 떨렸어요.")
          + say("rudy", "말로 하면 더 틀릴 것 같아서요."),
          W(H(17), H(19, 30), weather=DRY), req={"seen": ["rudy:shelf"]},
          choices=[
              C("“이게 제일 맞는 글자예요”", "warm", say("rudy", "…틀린 게요?") + nar("고개를 끄덕이자 루디가 처음으로 소리 내어 웃었다.")),
              C("틀린 글자를 손가락으로 고쳐 써 준다", "tease", nar("루디가 나무판을 보고, 이쪽을 보고, 다시 나무판을 보았다.") + say("rudy", "…이거 대답 맞죠? 첨삭이 아니라?")),
              C("나무판을 받아 가슴에 안는다", "quiet", nar("루디는 아무 말도 하지 않았다. 손 뼘으로 무언가를 재려다 그만두고, 그냥 손을 내밀었다.")),
          ], gain=8, confess=True, album="틀린 글자 한 줄"),
        E("rudy:readTogether", "천천히 읽기", 4, LIB_PATH,
          say("rudy", "…서고 안에 같이 가요. 오늘은 한 줄만 읽어 볼래요. {player}님이 옆에 있으면.")
          + nar("서고 긴 탁자에서, 루디가 손가락으로 줄을 짚으며 한 글자씩 소리 낸다. 느리지만 틀리지 않는다."),
          W(H(18), H(20), weather=DRY), req={"lover": True},
          choices=[
              C("다 읽을 때까지 기다린다", "quiet", say("rudy", "…다 읽었어요. 한 줄. 처음으로.") + nar("루디가 책 모서리를 손 뼘으로 쟀다. 기쁠 때 하는 버릇인 것 같다."), "firstLine"),
              C("한 줄 끝날 때마다 박수를 친다", "tease", say("rudy", "…서고에서 박수 치면 안 돼요.") + nar("그래도 루디는 다음 줄을 더 빨리 읽었다."), "clapped"),
          ], gain=5),
        E("rudy:silence", "말 없는 사흘", 4, CARP_FRONT,
          nar("루디가 사흘째 말이 없다. 평소보다도 더.")
          + say("rudy", "…아버지가 제본 골목 일을 맡으래요. 표지만이 아니라 속까지. 읽어야 하는 일이요.")
          + say("rudy", "못 한다고 말 못 했어요."),
          W(H(9), H(18), weather=DRY, days=WORKDAYS), req={"lover": True, "seen": ["rudy:readTogether"]},
          choices=[
              C("“같이 아버지께 말씀드려요”", "honest", say("rudy", "…같이요. 네.") + nar("그날 저녁, 목수 집에서 오래 이야기 소리가 들렸다. 다음 날 루디는 표지 일만 하기로 했다. 대신 속은 천천히 배우기로."), "toldFather"),
              C("“읽는 건 제가 할게요, 둘이 하면 돼요”", "warm", say("rudy", "…둘이 하는 제본. 좋다.") + nar("루디가 사흘 만에 처음으로 웃었다."), "bindTogether"),
          ], gain=4, cool=1),
    ],
}

# ════════════════ 덱스터 (양치기 댁 아들) ════════════════
# 플레이 중: 새벽 양 우리 안에서 양 한 마리 한 마리 이름을 부르며 센다. 오전엔 언덕 벤치 근처 풀밭에 양을 풀어 놓고 누워 구름을 본다.
# 점심은 코스모와 광장 아래. 오후엔 다시 우리. 맑은 밤엔 언덕에 누워 별을 센다. 겨울엔 약방 앞을 서성인다(양 약).
# 해 질 녘 언덕의 돌 밑에 무언가를 숨긴다(목격 — 별에 대한 시).
PEN = T(3, 28)
PEN2 = T(4, 28)
HILL_GRASS = T(13, 12)
HILL_STARS = T(15, 12)
APOTH_SIDE = T(19, 29)
HILL_STONE = T(12, 13)
people["dexter"] = {
    "id": "dexter", "pace": 1.1, "dislikes": ["oil"],
    "routines": [
        R(PEN, W(H(5), H(10)), "sheep", ["구름이, 솜이, 말랑이… 말랑이 어디 갔어.", "아흔여덟, 아흔아홉… 하나 모자라. 아, 나구나."]),
        R(HILL_GRASS, W(H(10), H(12), weather=DRY), "sheep", ["저 구름은 양 같다. 양은 구름 같고."]),
        R(PLAZA_LOW2, W(H(12), H(13), weather=DRY), "bread", ["코스모, 그 소문 벌써 세 번째야."], with_="cosmo"),
        R(PEN2, W(H(13), H(18)), "sheep", ["흰둥이, 거기 울타리 먹지 마."]),
        R(HILL_STARS, W(H(20), H(22), weather=["sunny", "wind", "hot"]), "rest", ["…하나, 둘, 저건 아까 센 거."]),
        R(APOTH_SIDE, W(H(10), H(13), season=["winter"]), "wait", ["양 기침약… 또 사러 왔다고 하면 바질이 웃을 텐데."]),
        R(PEN, W(H(6), H(18), weather=WET), "sheep", ["비 오면 양들이 서로 붙어 있어. 나도 끼고 싶다."]),
    ],
    "offDays": {"chance": 0.08, "routines": [R(HILL_GRASS, W(H(6), H(18)), "rest", ["오늘은 양들이 날 치는 날."])]},
    "lines": [
        L("dexter", "아, 안녕하세요. …방금 무슨 말 하려고 했더라.", 0),
        L("dexter", "양이 백두 마리예요. 이름 다 있어요. 제일 늦게 태어난 애는 '늦잠'이에요.", 0),
        L("dexter", "비 오는 날엔 양털이 무거워져요. 양들도 저도 느릿느릿.", 0, W(weather=WET)),
        L("dexter", "여름엔 털 깎는 날이 있어요. 양들이 가벼워서 신나서 뛰어요.", 0, W(season=["summer"])),
        L("dexter", "겨울엔 양들이 기침을 해요. 약방에 자주 가요.", 0, W(season=["winter"])),
        L("dexter", "맑은 밤 언덕에 누우면 별이 쏟아질 것 같아요.", 0, W(fr=H(18), to=H(23), weather=DRY)),
        L("dexter", "코스모는 소문을 가져오고 저는 까먹어요. 둘이 합치면 비밀이 안전해요.", 1),
        L("dexter", "아버지는 말을 안 해도 양 기분을 알아요. 저는 아직 반만 알아요.", 1),
        L("dexter", "바질은 양 약을 줄 때마다 저보고도 먹으래요. 저는 양이 아닌데.", 1),
        L("dexter", "주니퍼는 벌 얘기할 때만 말이 많아져요. 저도 양 얘기할 때만 그래요. 비슷해요.", 1),
        L("dexter", "늦잠이가 젖을 떼고는 풀을 잘 안 먹어요. 어린 양이요. 오늘은 마을 풀을 다 뜯어 볼 거예요.", 1, req={"thread": {"id": "lamb", "phase": [0]}}),
        L("dexter", "주니퍼가 벌통 들에서 토끼풀을 뜯었대요! 늦잠이한테 아직 안 줘 본 풀이에요.", 1, req={"thread": {"id": "lamb", "phase": [1]}}),
        L("dexter", "늦잠이가 토끼풀 잎을 먹었어요. 이제 아침마다 제일 먼저 우리 문 앞에 와 있어요. 늦잠이인데요.", 1, req={"thread": {"id": "lamb", "phase": [2, 3]}}),
        L("dexter", "그날 같이 센 별, 아직 기억해요? 저는 백열두 개까지 셌어요.", 1, req={"memory": ["countedStars"]}),
        L("dexter", "비 오는 날엔 그날 우리에서 양들이랑 같이 비 피하던 거 생각나요.", 1, W(weather=WET), {"memory": ["rain"]}),
        L("dexter", "사람들은 제가 멍하다고 해요. 사실은 딴 걸 너무 열심히 보고 있는 거예요.", 2),
        L("dexter", "양들은 제가 지켜요. 양을 해치려는 게 있으면 저 무서워져요. 진짜로요.", 2),
        L("dexter", "언덕 돌 밑에 뭐가 있는지 봤죠. …다 읽었어요? 아니, 말하지 마요.", 2, req={"memory": ["saw:poem"]}),
        L("dexter", "언젠가 이 마을 별자리 지도를 그리고 싶어요. 제가 붙인 이름으로요.", 2),
        L("dexter", "오늘 별 하나 더 찾았어요. 이름은 아직 안 붙였어요. 같이 붙여요.", 3),
        L("dexter", "양들이 {player}님 오면 다 고개를 들어요. 저처럼요.", 3),
        L("dexter", "…음. 네.", 0, cool=True),
        L("dexter", "(양만 쓰다듬는다)", 0, cool=True),
    ],
    "sightings": [
        S("dexter:poem", "언덕의 돌", HILL_STONE,
          nar("해 질 녘 언덕. 덱스터가 주위를 두리번거리더니 납작한 돌을 들춘다.", "돌 밑에 접힌 종이가 여러 장 있다. 새 종이 한 장을 넣고, 돌을 다시 덮는다.")
          + say("dexter", "…오늘 별은 '양털 구름 옆 작은 불빛'. 음, 너무 길다.")
          + nar("덱스터는 돌을 두 번 토닥이고 우리 쪽으로 걸어갔다."),
          "saw:poem", W(H(18), H(19, 30), weather=DRY), stage=2),
    ],
    "events": [
        E("dexter:count", "양 세기", 1, PEN,
          say("dexter", "아흔여덟, 아흔아홉… 하나 모자라요. 같이 세 줄래요? 제가 자꾸 저를 세서요."),
          W(H(5, 30), H(10), weather=DRY),
          choices=[
              C("같이 센다", "warm", nar("둘이 세니 백두 마리가 딱 맞았다.") + say("dexter", "…역시 제가 저를 셌네요. 고마워요."), "countedSheep"),
              C("“덱스터도 한 마리로 쳐요”", "tease", say("dexter", "그럼 백세 마리네. 저는 이름이 뭐죠? …'멍텅이'요? 너무해요.") + nar("덱스터는 웃으며 그 이름을 받아들였다."), "meungtung"),
          ], gain=5, opens=2),
        E("dexter:clouds", "구름 보기", 2, HILL_GRASS,
          nar("언덕 풀밭에 덱스터가 대자로 누워 있다. 양들이 그 둘레에서 풀을 뜯는다.")
          + say("dexter", "누워 봐요. 저 구름, 뭐 같아요?"),
          W(H(10), H(12), weather=["sunny", "wind"]),
          choices=[
              C("“양이요”", "warm", say("dexter", "역시. 모든 구름은 양이에요. 저 사람 알아요, 틀린 적 없어요."), "cloudSheep"),
              C("“덱스터 머리 같아요”", "tease", say("dexter", "부스스하다는 거죠? …맞아요.") + nar("덱스터는 머리를 헝클어뜨리며 웃었다."), "cloudHair"),
              C("말없이 나란히 눕는다", "quiet", nar("구름이 셋 지나갈 동안 아무도 말하지 않았다. 양 한 마리가 덱스터 배 위에 턱을 올렸다."), "cloudQuiet"),
          ], gain=5),
        E("dexter:stars", "별 세기", 2, HILL_STARS,
          say("dexter", "오늘은 백 개까지 세 볼 거예요. 도와줄래요? 저쪽 하늘 반만 맡아 줘요."),
          W(H(20), H(22), weather=["sunny", "wind", "hot"]),
          choices=[
              C("반을 맡아 센다", "warm", nar("둘이 합쳐 백열두 개. 덱스터가 풀밭을 두드리며 좋아했다.") + say("dexter", "신기록! 혼자선 늘 마흔에서 졸았거든요."), "countedStars"),
              C("“저 별은 이름 있어요?”", "honest", say("dexter", "…제가 붙인 건 있어요. 비밀인데.") + say("dexter", "저건 '늦잠이의 방울'. 제일 늦게 떠요."), "starName"),
          ], gain=6, opens=3),
        E("dexter:angry", "울타리", 3, PEN2,
          nar("양 우리 울타리가 부서져 있다. 덱스터가 얼굴이 굳은 채 울타리를 세운다. 처음 보는 표정이다.")
          + say("dexter", "밤에 어떤 사람이 개를 풀어 놨어요. 양 둘이 다쳤어요.")
          + say("dexter", "…화내면 안 되는데 화가 나요."),
          W(H(13), H(18), weather=DRY), req={"seen": ["dexter:stars"]},
          choices=[
              C("같이 울타리를 세운다", "warm", nar("말없이 말뚝을 박았다. 해가 질 무렵 울타리가 다 섰다.") + say("dexter", "…고마워요. 화 좀 가라앉았어요."), "builtFence"),
              C("“화나는 게 당연해요”", "honest", say("dexter", "…그래도 돼요? 저 화내면 무섭대요.") + say("dexter", "양들 지킬 때만 그래요. 그건 괜찮은 거죠?"), "angerOk"),
          ], gain=6),
        E("dexter:poemFound", "돌 밑의 종이", 3, HILL_STONE,
          nar("해 질 녘 언덕, 덱스터가 납작한 돌 앞에 앉아 있다. 이쪽을 보고 화들짝 놀란다.")
          + say("dexter", "아, 아무것도 아니에요. 돌이에요. 그냥 돌."),
          W(H(18), H(19, 30), weather=DRY), req={"memory": ["saw:poem"]},
          choices=[
              C("“그 시, 읽어 줄래요?”", "warm", say("dexter", "…시라는 거 알아요?! 봤어요?!") + nar("한참 얼굴을 가리고 있더니, 종이 한 장을 꺼내 소리 내어 읽었다. 별 하나에 양 이름을 붙인 짧은 시였다.") + say("dexter", "…처음 누구한테 읽어 줬어요."), "heardPoem"),
              C("“돌이 참 좋은 돌이네요”", "tease", say("dexter", "…네. 아주 좋은 돌이에요. 비밀을 잘 지켜요.") + nar("덱스터가 웃음을 참다가 결국 터뜨렸다."), "goodStone"),
          ], gain=7, opens=4),
        E("dexter:poemNew", "돌 밑의 종이", 3, HILL_STONE,
          nar("해 질 녘 언덕, 덱스터가 납작한 돌을 들추다 이쪽을 보고 굳는다. 돌 밑에 접힌 종이가 여러 장 보인다.")
          + say("dexter", "…봤어요? 이거, 별에 대해 쓴 거예요. 시는 아니고. 음, 시예요."),
          W(H(18), H(19, 30), weather=DRY), req={"notMemory": ["saw:poem"], "notSeen": ["dexter:poemFound"]},
          choices=[
              C("“읽어 줄래요?”", "warm", nar("덱스터가 한 장을 골라 떨리는 목소리로 읽었다.") + say("dexter", "…어때요. 아니, 말하지 마요. 얼굴 보니까 알겠어요."), "heardPoem"),
              C("“모른 척할게요”", "quiet", say("dexter", "…고마워요. 근데 이상하게 들켜서 좋아요."), "keptPoemSecret"),
          ], gain=7, opens=4),
        E("dexter:winterNight", "겨울 우리", 4, PEN,
          nar("눈 오는 밤, 양 우리 안에 덱스터가 양들 사이에 끼어 앉아 있다. 양 하나가 기침을 한다.")
          + say("dexter", "오늘 밤은 여기서 잘 거예요. 이 애가 무서워해서요.")
          + say("dexter", "…사실 저도 좀 무서워요. 겨울은 양을 데려가요."),
          W(H(19), H(22), season=["winter"]),
          choices=[
              C("양들 사이에 같이 앉는다", "warm", nar("양털 속은 생각보다 따뜻했다. 덱스터가 잠결에 양 이름을 하나씩 불렀다. 마지막엔 주인공의 이름이었다."), "sheepNight"),
              C("“내일 약방에 같이 가요”", "honest", say("dexter", "…같이요? 네. 바질이 저한테도 약 먹이려 하면 막아 줘요."), "winterPromise", {"id": "sheepMedicine", "at": APOTH_SIDE, "from": H(9), "to": H(13)}),
          ], gain=7, opens=5),
        E("dexter:confess", "이름 붙인 별", 5, HILL_STARS,
          nar("맑은 밤 언덕. 덱스터가 하늘 한쪽을 가리킨다.")
          + say("dexter", "저 별 보여요? 양털 구름 오른쪽, 작은 거.")
          + say("dexter", "몇 달 전에 찾았어요. 이름을 못 붙였어요. 어떤 이름도 안 맞아서요.")
          + say("dexter", "…오늘 붙일게요. {player}별. 제 별자리 지도 한가운데 둘 거예요. 제일 좋아하는 거니까요."),
          W(H(20), H(22, 30), weather=["sunny", "wind", "hot"]), req={"seen": ["dexter:winterNight"]},
          choices=[
              C("“그 옆 별은 덱스터별이에요”", "warm", say("dexter", "…옆에요? 그럼 둘이 같이 뜨는 거네요.") + nar("덱스터가 풀밭에 벌렁 누워 한참 웃었다.")),
              C("“이름이 너무 길어요”", "tease", say("dexter", "시도 길게 쓰는 사람이라… 대답이 먼저예요!") + nar("웃으며 고개를 끄덕이자 덱스터가 별을 한 번 더 세었다. 하나.")),
              C("말없이 그 별을 오래 본다", "quiet", nar("별이 조금 기울 때까지 둘은 누워 있었다. 덱스터가 조용히 손을 찾아 잡았다.")),
          ], gain=8, confess=True, album="이름을 붙인 별"),
        E("dexter:map", "별자리 지도", 4, HILL_STARS,
          say("dexter", "지도 다 그렸어요! 마을 하늘 별자리. 이름 붙인 거 서른 개.")
          + nar("양가죽 위에 별들이 점으로 찍혀 있고, 가운데 두 별이 선으로 이어져 있다."),
          W(H(20), H(22), weather=DRY), req={"lover": True},
          choices=[
              C("“서고에 걸어요”", "warm", say("dexter", "…서고에요? 제 지도가 책들 옆에?") + nar("덱스터는 지도를 품에 안고 한참 서 있었다."), "mapLibrary"),
              C("“양 이름 별이 스물아홉 개네요”", "tease", say("dexter", "서른 개예요. 하나는 {player}별이니까요."), "mapCount"),
          ], gain=5),
        E("dexter:forgot", "잊어버린 약속", 4, PEN,
          say("dexter", "…어제 언덕에서 기다리기로 했죠. 저 까먹었어요. 양 털 깎다가.")
          + say("dexter", "까먹는 거, 고치고 싶어요. 근데 잘 안 돼요. 미안해요."),
          W(H(8), H(17), weather=DRY), req={"lover": True, "seen": ["dexter:map"]},
          choices=[
              C("“다음엔 제가 데리러 갈게요”", "warm", say("dexter", "…그럼 까먹어도 괜찮네요. 아니, 그래도 안 까먹을게요."), "pickUp"),
              C("“솔직히 좀 서운했어요”", "honest", say("dexter", "…네. 말해 줘서 고마워요. 손목에 실 묶어 둘게요. 약속 생각나게.") + nar("덱스터가 양털로 손목에 실을 감았다. 며칠 동안 그 실을 풀지 않았다."), "stringWrist"),
          ], gain=4, cool=1),
    ],
}

# ════════════════ 바질 (약방 아들) ════════════════
# 플레이 중: 새벽 북쪽 울타리 곁에서 이슬 맺힌 약초를 딴다(나뭇가지에 긁힌 자국이 늘 있다). 낮엔 약방 앞에서 약초를 고르고 말린다.
# 점심은 찻집 앞에서 파피에게 찻잎을 대 준다. 가을·겨울 저녁엔 대장간에 들러 대장장이 기침을 살핀다.
# 누구를 봐도 건강을 걱정하는 말부터 한다. 해 뜨기 전 고목에 올라가 이끼를 따다 떨어지고 혼자 웃는다(목격).
HERB_NORTH = T(11, 1)
SHOP = T(18, 29)
TEA_SIDE = T(31, 10)
SMITH_VISIT = T(44, 24)
TREE_FOOT = T(10, 13)
people["basil"] = {
    "id": "basil", "pace": 1.0, "dislikes": ["soot"],
    "routines": [
        R(HERB_NORTH, W(H(5), H(7), weather=DRY), "herb", ["이슬 있을 때 따야 향이 살아. …아얏, 가시."]),
        R(SHOP, W(H(7), H(12)), "herb", ["이건 박하, 이건 쑥, 이건… 그냥 풀이네.", "말리는 건 그늘에서. 해는 향을 가져가."]),
        R(TEA_SIDE, W(H(12), H(13), weather=DRY, days=WORKDAYS), "tea", ["파피 씨, 이번 찻잎은 한 번 덖었어요."], with_="poppy"),
        R(SHOP, W(H(13), H(18))),
        R(SMITH_VISIT, W(H(18), H(19), season=["autumn", "winter"]), "herb", ["기침은 좀 어떠세요. …네, 또 괜찮다고 하시겠죠."]),
    ],
    "offDays": {"chance": 0.06, "routines": [R(TREE_FOOT, W(H(5), H(11)), "herb", ["오늘은 저 높은 가지 이끼. 떨어지지 말자. 이번엔."])]},
    "lines": [
        L("basil", "안녕하세요. 안색이 좋네요. 물은 하루 여덟 잔 드세요?", 0),
        L("basil", "약초는 햇볕 말고 그늘에서 말려요. 사람도 가끔 그래야 하고요.", 0),
        L("basil", "비 오는 날엔 관절 아픈 분들이 많이 와요. 약방이 붐벼요.", 0, W(weather=WET)),
        L("basil", "여름엔 벌레 물린 데 바르는 약이 제일 많이 나가요.", 0, W(season=["summer"])),
        L("basil", "겨울엔 기침약. 대장장이 아저씨는 한 번도 안 드세요. 걱정돼요.", 0, W(season=["winter"])),
        L("basil", "손등 긁힌 거요? …아, 이건 약초 따다가. 별거 아니에요.", 0),
        L("basil", "약초 캐 오면 어머니가 사 드려요. 흰 꽃 핀 풀포기요. 독풀이랑 헷갈리지 마시고요.", 0),
        L("basil", "파피 씨 찻집에 찻잎을 대요. 파피 씨는 제 찻잎이 제일 향이 좋대요. …그런 거 적어 두진 않았어요.", 1),
        L("basil", "덱스터는 양 약을 사면서 늘 자기는 멀쩡하대요. 눈 밑이 까만데.", 1),
        L("basil", "틸리 씨 아버님 기침, 불 때문만은 아닐 거예요. 틸리 씨한텐 말 못 했어요.", 1),
        L("basil", "어릴 때 잔치 차에 잠 오는 풀을 잘못 넣었어요. 마을 사람 절반이 모닥불 앞에서 잤대요. …지금도 놀림받아요.", 1),
        L("basil", "양한테 토끼풀 잎만 떼어 줘 보라고 했어요. 양은 처음이라 떨렸어요. 잘 먹더라고요.", 1, req={"thread": {"id": "lamb", "phase": [2, 3]}}),
        L("basil", "그때 같이 약초 고른 거, 손이 빨랐어요. 약방에 취직하실래요? 농담이에요. 반만.", 1, req={"memory": ["sortedHerbs"]}),
        L("basil", "이런 비 오는 날은 그날 약방 처마 밑에서 비 긋던 거 생각나요.", 1, W(weather=WET), {"memory": ["rain"]}),
        L("basil", "사실 조심하는 거, 지겨워요. 가끔은 높은 가지에 막 올라가고 싶어요.", 2),
        L("basil", "새벽에 나무에서 떨어지는 거 봤죠. …약방 아들이 다친다는 거 비밀이에요.", 2, req={"memory": ["saw:treeFall"]}),
        L("basil", "제가 지키는 사람들은 많은데, 저를 챙기는 건 제가 잘 못해요.", 2),
        L("basil", "언젠가 산 너머에서만 자란다는 약초를 직접 캐 보고 싶어요. 책에서만 봤어요.", 2),
        L("basil", "오늘 {player}님 차는 박하 둘, 꿀 하나, 그리고 비밀 하나 넣었어요.", 3),
        L("basil", "손등 긁힌 거 이제 {player}님이 발라 줘요. 제가 바르면 대충 발라요.", 3),
        L("basil", "…네, 괜찮으세요? 그럼 됐어요.", 0, cool=True),
        L("basil", "약초만 고르고 있을게요.", 0, cool=True),
    ],
    "sightings": [
        S("basil:treeFall", "새벽의 고목", TREE_FOOT,
          nar("해 뜨기 전, 언덕 곁 고목 위에서 부스럭 소리가 난다. 바질이 높은 가지에 매달려 이끼를 긁어모으고 있다.", "뚝. 가지가 부러지고 바질이 엉덩방아를 찧는다.")
          + say("basil", "…아. 아하하. 하하.")
          + nar("바질은 혼자 한참 웃다가, 손등의 긁힌 자국을 보고 옷소매로 가렸다. 이끼 주머니는 꼭 쥐고 있었다."),
          "saw:treeFall", W(H(5), H(6, 30), weather=DRY), stage=1),
    ],
    "events": [
        E("basil:checkup", "안색", 1, SHOP,
          say("basil", "잠깐만요. 눈 밑이 좀 까만데요. 어젯밤 몇 시에 주무셨어요? 솔직하게요."),
          W(H(8), H(17), days=WORKDAYS),
          choices=[
              C("솔직하게 말한다", "honest", say("basil", "…그 시간이면 올빼미랑 같이 깨 있던 거예요.") + nar("바질이 말린 꽃잎 한 줌을 종이에 싸 주었다.") + say("basil", "자기 전에 우려 드세요. 처방이에요."), "sleepTea"),
              C("“바질 씨 손등이 더 걱정인데요”", "tease", say("basil", "제 손등은… 약초가 저를 공격한 거예요. 흔한 일이에요.") + nar("바질은 소매를 끌어내렸다. 귀가 조금 빨갰다."), "noticedHands"),
          ], gain=5, opens=2),
        E("basil:sort", "약초 고르기", 2, SHOP,
          nar("약방 앞 평상에 약초가 산더미처럼 쌓여 있다. 바질이 한숨을 쉰다.")
          + say("basil", "이거 오늘 안에 다 골라야 해요. 박하, 쑥, 독풀. 독풀은 절대 섞이면 안 돼요. 도와주실래요?"),
          W(H(9), H(17), weather=DRY),
          choices=[
              C("잎을 하나하나 비춰 보며 고른다", "warm", nar("해 질 녘에 다 끝났다. 바질이 독풀 더미를 가리켰다.") + say("basil", "…하나도 안 틀렸어요. 제 첫날보다 나아요."), "sortedHerbs"),
              C("냄새로 고른다", "tease", say("basil", "냄새로요? …그거 제 방법인데.") + nar("둘이 약초에 코를 박고 킁킁대는 걸 지나가던 아이가 보고 웃었다."), "sniffing"),
          ], gain=5),
        E("basil:legend", "잔치의 전설", 2, TEA_SIDE,
          say("poppy", "바질 씨, 그 얘기 해 줘요. 잔치 날 온 마을이 잠든 얘기.")
          + say("basil", "…안 할 거예요.")
          + say("poppy", "제가 할게요! 바질 씨가 열 살 때 잔치 차에—")
          + say("basil", "그만요! …잠 오는 풀을 넣었어요. 박하랑 헷갈려서요. 모닥불 앞에서 다들 코를 골았어요."),
          W(H(12), H(13), weather=DRY, days=WORKDAYS),
          choices=[
              C("크게 웃는다", "tease", say("basil", "웃을 줄 알았어요. …그래도 그날 제일 잘 잤대요, 다들.") + nar("바질도 결국 따라 웃었다."), "laughedLegend"),
              C("“그 뒤로 약초를 두 번 보게 됐겠네요”", "honest", say("basil", "…네. 그래서 잎을 두 번 봐요. 사람 얼굴도요."), "twiceLook"),
          ], gain=6, opens=3),
        E("basil:smith", "대장간의 저녁", 3, SMITH_VISIT,
          nar("대장간 곁, 바질이 약병을 들고 서 있다. 대장장이는 괜찮다며 손을 젓고 들어가 버렸다.")
          + say("basil", "…또 안 받으셨어요. 기침 소리가 달라졌는데.")
          + say("basil", "틸리 씨한테 말해야 할까요? 겁주기 싫은데."),
          W(H(18), H(19, 30), season=["autumn", "winter"]),
          choices=[
              C("“틸리한테 말해요. 틸리도 알아야 해요”", "honest", say("basil", "…네. 제가 무서워서 미룬 거예요. 틸리 씨 말고요."), "tellTilly"),
              C("“약을 차에 섞어 드려요”", "tease", say("basil", "…약사가 할 말은 아니지만, 좋은 생각이에요.") + nar("다음 날부터 대장장이의 찻잔에서 은은한 박하 향이 났다."), "sneakyTea"),
          ], gain=6),
        E("basil:tree", "높은 가지", 3, TREE_FOOT,
          nar("해 뜨기 전 고목 아래, 바질이 나무를 올려다보며 소매를 걷고 있다.")
          + say("basil", "…보셨어요? 아니, 못 본 걸로 해 주세요. 약방 아들은 나무 안 타요.")
          + say("basil", "근데 저 위 이끼가 제일 좋은 약이 돼요."),
          W(H(5), H(7), weather=DRY),
          choices=[
              C("“밑에서 받쳐 줄게요”", "warm", nar("바질이 가지를 타고 올라가 이끼를 긁어모았다. 내려올 때 한 번 미끄러졌지만 이번엔 떨어지지 않았다.") + say("basil", "…처음으로 안 긁혔어요."), "heldTree"),
              C("“저도 올라갈래요”", "tease", say("basil", "안 돼요! 위험— …아니, 같이 가요. 제가 뒤에서.") + nar("나무 위에서 본 새벽 마을은 작고 조용했다. 바질이 조그맣게 말했다.") + say("basil", "이거 보려고 올라오는 거예요. 사실은."), "climbedTogether"),
          ], gain=7, opens=4),
        E("basil:mountain", "산 너머의 약초", 4, SHOP,
          nar("비 오는 날, 약방 처마 밑. 바질이 낡은 약초 책을 펼쳐 한 그림을 짚는다.")
          + say("basil", "이거요. 산 너머에서만 자란대요. 언젠가 캐러 가고 싶어요. …어머니는 위험하대요.")
          + say("basil", "저는 늘 남 걱정만 하고, 제가 하고 싶은 건 걱정만 하다 말아요."),
          W(H(10), H(18), weather=WET),
          choices=[
              C("“같이 계획을 짜 봐요”", "warm", say("basil", "…계획이요? 위험하지 않게?") + nar("바질이 처음으로 신나서 종이에 길을 그렸다. 준비물 목록이 서른 줄이었다."), "planTrip"),
              C("“바질 씨도 걱정해 주는 사람이 있어야 해요”", "honest", say("basil", "…그런 말 처음 들어요.") + nar("바질은 책을 덮고 한참 빗소리를 들었다."), "worryForHim"),
          ], gain=7, opens=5),
        E("basil:confess", "처방전", 5, SHOP,
          nar("저녁 약방 앞. 바질이 약봉지 하나를 내민다. 겉에 처방전처럼 글씨가 빼곡하다.")
          + say("basil", "읽어 보세요. 제가 쓴 거예요.")
          + nar("'증상: 약방 문이 열릴 때마다 {player}님인지 돌아봄. 약초를 고르다 {player}님 좋아하는 향을 따로 모음. 밤에 잠이 안 옴.' 맨 아래에 '진단: 좋아함. 처방: 없음. 낫고 싶지 않음.'")
          + say("basil", "…정확하게 말하고 싶었어요. 제가 잘하는 방식으로요."),
          W(H(17), H(19), weather=DRY), req={"seen": ["basil:mountain"]},
          choices=[
              C("“같은 증상이에요”", "warm", say("basil", "…같은 증상이면, 같이 안 낫는 수밖에 없네요.") + nar("바질이 처음으로 걱정 없는 얼굴로 웃었다.")),
              C("“처방이 없다고요?” 하고 놀린다", "tease", say("basil", "…있어요. 매일 보는 거요. 이건 제가 처방하는 거고요.")),
              C("약봉지를 소중히 접어 넣는다", "quiet", nar("바질이 그걸 보고 한참 아무 말도 하지 못했다. 그러다 조용히 말했다.") + say("basil", "…평생 간직할 처방이네요.")),
          ], gain=8, confess=True, album="처방전 한 장"),
        E("basil:blend", "{player}님 차", 4, TEA_SIDE,
          say("basil", "파피 씨한테 부탁해서 새 차를 만들었어요. 박하, 꿀, 그리고… 비밀.")
          + say("poppy", "메뉴판에 올렸어요. 이름은 '약방 아들의 고백'이요.")
          + say("basil", "파피 씨!!"),
          W(H(12), H(15), weather=DRY), req={"lover": True},
          choices=[
              C("그 차를 주문한다", "tease", say("basil", "…주문하지 마세요. 아니, 하세요. 제가 우릴게요."), "orderedBlend"),
              C("“비밀 재료가 뭐예요?”", "honest", say("basil", "…새벽에 고목 위에서 딴 이끼 조금. 처음으로 안 긁히고 딴 거예요."), "secretMoss"),
          ], gain=5),
        E("basil:worry", "걱정 많은 날", 4, SHOP,
          say("basil", "어제 비 맞고 다니셨다면서요. 열은요? 목은요? 잠은요?")
          + nar("바질이 약병 다섯 개를 줄 세운다. 평소보다 목소리가 높다.")
          + say("basil", "…죄송해요. 걱정이 너무 많죠. 연인한테까지 약사처럼 굴어서."),
          W(H(9), H(17)), req={"lover": True, "seen": ["basil:blend"]},
          choices=[
              C("“걱정해 줘서 좋아요. 다섯 개는 좀 많지만”", "warm", say("basil", "…세 개로 줄일게요. 아니 네 개.") + nar("바질이 웃었다. 조금 힘이 빠진 얼굴이었다."), "fourBottles"),
              C("“가끔은 그냥 괜찮냐고만 물어봐 줘요”", "honest", say("basil", "…괜찮아요?") + nar("고개를 끄덕이자 바질이 약병을 전부 치웠다.") + say("basil", "그럼 됐어요. 진짜로요."), "justAsk"),
          ], gain=4, cool=1),
    ],
}

# ════════════════ 메리골드 (포도원 할아버지 댁 손녀) ════════════════
# 플레이 중: 새벽부터 포도원 입구와 할아버지 집 앞을 뛰어다닌다. 오전 늦게 빵집까지 심부름을 뛴다(늘 뛴다).
# 오후엔 할아버지 곁에서 포도 넝쿨을 손질하며 쉬지 않고 말한다. 저녁엔 광장 가운데서 아무나 붙잡고 포도 자랑을 한다.
# 장날엔 광장 입구에서 포도를 판다. 비 오는 날엔 할아버지 방 안. 밤늦게 할아버지 집 앞에서 동전을 세다 운다(목격).
VINE_GATE = T(37, 8)
VINE_EDGE = T(38, 9)
BAKERY_RUN = T(8, 19)
PLAZA_TOP = T(24, 13)
PLAZA_GRAPES = T(21, 13)
GRANDPA_ROOM = T(34, 43)
GRANDPA_FRONT = T(36, 7)
people["marigold"] = {
    "id": "marigold", "pace": 1.6, "dislikes": ["soot"],
    "routines": [
        R(VINE_GATE, W(H(6), H(11)), "grape", ["하나 따고 하나 먹고. 아니 하나 따고 두 개 먹고.", "할아버지! 이쪽 넝쿨 제가 할게요!"]),
        R(BAKERY_RUN, W(H(11), H(12), weather=DRY, days=WORKDAYS), "bread", ["웬델! 할아버지 빵 두 개! 빨리!"]),
        R(VINE_EDGE, W(H(13), H(17))),
        R(PLAZA_TOP, W(H(17), H(18, 30), weather=DRY), "grape", ["올해 포도는 역대 최고예요. 작년에도 그랬지만요!"]),
        R(PLAZA_GRAPES, W(H(7), H(12), days=MARKET), "grape", ["포도요 포도! 할아버지 포도요!"]),
        R(GRANDPA_ROOM, W(H(8), H(18), weather=WET), "rest", ["할아버지, 무릎 아프면 제가 할게요. 다 할게요."]),
    ],
    "offDays": {"chance": 0.05, "routines": [R(T(19, 12), W(H(10), H(16)), "rest", ["오늘은 아무것도 안 할 거야. …한 시간만."])]},
    "lines": [
        L("marigold", "안녕하세요! 포도 드실래요? 드세요! 안 드시면 제가 먹어요!", 0),
        L("marigold", "할아버지 포도는 해를 많이 볼수록 달아져요. 저처럼요. 농담이에요. 반만.", 0),
        L("marigold", "비 오는 날엔 할아버지 무릎이 아프대요. 그래서 제가 두 배로 일해요.", 0, W(weather=WET)),
        L("marigold", "가을엔 포도 따느라 잠을 못 자요. 행복한 못 잠이요.", 0, W(season=["autumn"])),
        L("marigold", "겨울엔 넝쿨을 잘라요. 아프게 잘라야 봄에 잘 자란대요.", 0, W(season=["winter"])),
        L("marigold", "장날엔 포도가 제일 먼저 다 팔려요! …오늘은 두 번째였어요. 꿀 과자한테 졌어요.", 0, W(days=MARKET)),
        L("marigold", "할아버지는 말이 없어요. 대신 제가 두 사람 몫 떠들어요.", 1),
        L("marigold", "틸리는 제 제일 친한 친구예요. 틸리는 모르지만요. 아직 말 안 했어요.", 1),
        L("marigold", "웬델한테 빵 심부름 가면 늘 하나 더 줘요. 할아버지 몫이래요. 사실 제 몫인 거 알아요.", 1),
        L("marigold", "엄마 아빠는 도시에 있어요. 저는 할아버지가 좋아서 여기 남았어요. 그렇게 말해요, 늘.", 1),
        L("marigold", "그때 같이 넝쿨 자른 거, 할아버지가 손이 야무지대요. 칭찬 드문 분이에요!", 1, req={"memory": ["prunedTogether"]}),
        L("marigold", "비 오는 날이면 그날 할아버지 방에서 셋이 차 마시던 거 생각나요.", 1, W(weather=WET), {"memory": ["rain"]}),
        L("marigold", "…할아버지가 요즘 넝쿨 앞에서 오래 서 계세요. 쉬는 거래요. 전 무서워요.", 2),
        L("marigold", "도시 사람이 포도원 사겠다고 편지를 보냈어요. 할아버지는 태웠어요. 저는 그 편지 내용을 외워요.", 2),
        L("marigold", "밤에 동전 세는 거 봤죠. …포도원 지키려면 얼마 있어야 하는지 계산해요. 모자라요.", 2, req={"memory": ["saw:ledger"]}),
        L("marigold", "제가 떠들면 사람들이 웃잖아요. 웃는 동안은 아무도 제 걱정 안 해요. 그게 편해요.", 2),
        L("marigold", "언젠가 제 이름 붙은 포도나무를 심고, 거기서 포도주 대신 포도즙을 만들 거예요. 아이들도 마실 수 있게.", 2),
        L("marigold", "오늘 제일 잘 익은 송이는 {player}님 거예요! 할아버지한테도 안 줬어요!", 3),
        L("marigold", "요즘은 밤에 동전 안 세요. 대신 {player}님이랑 할 일 목록 세요. 길어요.", 3),
        L("marigold", "…오늘은 할 말이 없어요. 저한테 이런 날도 있어요.", 0, cool=True),
        L("marigold", "포도 드실래요? …아니에요, 괜찮아요.", 0, cool=True),
    ],
    "sightings": [
        S("marigold:ledger", "밤의 동전", GRANDPA_FRONT,
          nar("늦은 밤 할아버지 집 앞 계단. 메리골드가 작은 자루를 쏟아 동전을 센다.", "한 번 세고, 다시 센다. 손가락이 멈춘다.")
          + say("marigold", "…모자라. 삼 년은 더 모아야 돼.")
          + nar("메리골드는 소매로 눈을 문지르고, 동전을 자루에 넣고, 아무 일 없다는 듯 기지개를 켰다. 그리고 한참 앉아 있었다."),
          "saw:ledger", W(H(21, 30), H(23), weather=DRY), stage=2),
    ],
    "events": [
        E("marigold:run", "심부름", 1, BAKERY_RUN,
          nar("메리골드가 빵 봉지를 안고 뛰어오다 거의 부딪힐 뻔한다.")
          + say("marigold", "앗 죄송해요! 급해요! 아니 안 급해요, 그냥 늘 뛰어요!")
          + say("marigold", "근데 처음 보는 분이다. 포도 드실래요?"),
          W(H(11), H(12), weather=DRY, days=WORKDAYS),
          choices=[
              C("포도를 받는다", "warm", say("marigold", "좋은 사람이다! 포도 받는 사람은 다 좋은 사람이에요. 제 기준이에요."), "tookGrape"),
              C("“왜 늘 뛰어요?”", "honest", say("marigold", "…걸으면 생각이 따라와서요. 뛰면 못 따라와요! 하하.") + nar("메리골드는 웃으며 다시 뛰어갔다. 마지막 말만 조금 작았다."), "whyRun"),
          ], gain=5, opens=2),
        E("marigold:prune", "넝쿨 자르기", 2, VINE_GATE,
          say("marigold", "겨울 준비예요. 넝쿨을 잘라야 해요. 아프게 잘라야 봄에 잘 자란대요.")
          + say("marigold", "…도와줄래요? 할아버지 무릎이 요즘 안 좋아서요."),
          W(H(8), H(16), season=["autumn", "winter"]),
          choices=[
              C("가위를 받는다", "warm", nar("해 질 녘까지 넝쿨을 잘랐다. 할아버지가 멀리서 보고 고개를 한 번 끄덕였다.") + say("marigold", "끄덕였다! 할아버지가 끄덕였어요! 엄청난 칭찬이에요!"), "prunedTogether"),
              C("“아프게 잘라야 한다는 거, 사람한테도 그래요?”", "honest", say("marigold", "…사람은 안 잘랐으면 좋겠어요.") + nar("메리골드가 가위질을 멈췄다가 다시 시작했다. 한동안 말이 없었다. 처음 있는 일이었다."), "pruneTalk"),
          ], gain=5),
        E("marigold:bossy", "할 일 목록", 2, PLAZA_TOP,
          nar("광장 가운데서 메리골드가 종이 한 장을 들고 선언한다.")
          + say("marigold", "올해 가을 잔치는 제가 맡아요! 할 일 마흔일곱 개! 도와줄 사람 한 명 모집!")
          + nar("주위 이웃들이 슬금슬금 흩어진다."),
          W(H(17), H(18, 30), weather=DRY),
          choices=[
              C("손을 든다", "warm", say("marigold", "최고! 1번부터 23번까지 부탁해요!") + nar("반이었다."), "volunteered"),
              C("“마흔일곱 개를 혼자 하려고요?”", "honest", say("marigold", "…네. 원래 그래요. 부탁하는 게 서툴러서요.") + say("marigold", "그러니까 방금 그게 부탁이었어요. 들어줄래요?"), "askedHelp"),
              C("목록에 '메리골드 쉬기'를 적어 넣는다", "tease", say("marigold", "…48번. 쉬기. 이거 제일 어려운 건데.") + nar("메리골드가 크게 웃었다. 종이는 소중하게 접어 넣었다."), "restItem"),
          ], gain=6, opens=3),
        E("marigold:rainTea", "할아버지 방", 3, GRANDPA_ROOM,
          nar("비 오는 날 할아버지 방. 메리골드가 할아버지 무릎에 담요를 덮어 드리고, 차를 세 잔 따른다.")
          + say("marigold", "앉아요! 할아버지, 이분이 그 필사하시는 분이에요.")
          + say("grandpa", "…알고 있다."),
          W(H(10), H(17), weather=WET),
          choices=[
              C("할아버지께 포도원 이야기를 청한다", "warm", nar("할아버지가 드물게 길게 말했다. 첫 포도나무를 심던 날 이야기였다. 메리골드는 처음 듣는 얘기라며 눈을 크게 떴다."), "grandpaStory"),
              C("조용히 차를 마신다", "quiet", nar("셋이 빗소리를 들으며 차를 마셨다. 메리골드가 오랜만에 떠들지 않았다. 할아버지가 손녀의 머리를 한 번 쓰다듬었다."), "quietTea"),
          ], gain=6),
        E("marigold:ledgerTalk", "모자란 동전", 3, GRANDPA_FRONT,
          nar("저녁, 할아버지 집 앞 계단. 메리골드가 동전 자루를 등 뒤로 감춘다.")
          + say("marigold", "…아무것도 아니에요. 동전이에요. 그냥 동전."),
          W(H(19), H(21), weather=DRY), req={"memory": ["saw:ledger"]},
          choices=[
              C("“포도원 지키려고 모으는 거죠”", "honest", say("marigold", "…들켰다.") + say("marigold", "할아버지 돌아가시면 엄마 아빠가 팔 거래요. 제가 사면 안 팔리잖아요. 삼 년 더 모아야 해요."), "knowsLedger"),
              C("옆에 앉아 같이 센다", "warm", nar("둘이 동전을 셌다. 역시 모자랐다. 그런데 메리골드가 웃었다.") + say("marigold", "혼자 셀 땐 모자라면 울었는데, 같이 세니까 웃기네요."), "countedCoins"),
          ], gain=7, opens=4),
        E("marigold:ledgerNew", "포도원의 값", 3, GRANDPA_FRONT,
          nar("저녁, 할아버지 집 앞. 메리골드가 편지 한 장을 들고 서 있다. 도시 사람이 보낸, 포도원을 사겠다는 편지의 베낀 글이다.")
          + say("marigold", "…할아버지는 이거 태우셨어요. 제가 몰래 베꼈어요. 값이 얼마인지 알아야 해서요."),
          W(H(19), H(21), weather=DRY), req={"notMemory": ["saw:ledger"], "notSeen": ["marigold:ledgerTalk"]},
          choices=[
              C("“혼자 짊어지지 마요”", "warm", say("marigold", "…그런 말, 할아버지도 안 해 줬어요. 할아버지도 혼자 짊어지는 사람이라서.") + nar("메리골드가 편지를 접어 품에 넣었다. 처음으로 뛰지 않고 걸어서 집에 들어갔다."), "knowsLedger"),
              C("“같이 방법을 찾아봐요”", "honest", say("marigold", "방법… 목록 만들어야겠다! 마흔여덟 개쯤!") + nar("메리골드가 웃었다. 조금 울면서."), "knowsLedger"),
          ], gain=7, opens=4),
        E("marigold:grandpaIll", "넝쿨 앞의 할아버지", 4, VINE_EDGE,
          nar("포도원 입구, 할아버지가 넝쿨을 붙잡고 서 있다. 메리골드가 뛰어가 부축한다.")
          + say("marigold", "괜찮으시대요. 쉬는 거래요. 매번 그래요.")
          + say("marigold", "…할아버지 없으면 저 이 마을에 있을 이유가 없어져요. 그게 제일 무서워요."),
          W(H(13), H(17)), req={"seen": ["marigold:rainTea"]},
          choices=[
              C("“이유가 할아버지만은 아니잖아요”", "warm", say("marigold", "…그렇죠. 틸리도 있고, 웬델 빵도 있고, 그리고…") + nar("메리골드가 말을 멈추고 이쪽을 오래 보았다."), "moreReasons"),
              C("할아버지를 함께 부축해 집에 모신다", "quiet", nar("할아버지를 방에 눕혀 드리고 나오자, 메리골드가 계단에 주저앉아 소리 없이 울었다. 한참 뒤 코를 풀고 일어났다.") + say("marigold", "…됐다. 이제 뛸 수 있어요."), "helpedGrandpa"),
          ], gain=7, opens=5),
        E("marigold:confess", "먼저 물어볼게요", 5, PLAZA_TOP,
          nar("저녁 광장. 메리골드가 종이 한 장을 들고 곧장 걸어온다. 뛰지 않는다.")
          + say("marigold", "할 일 목록 새로 만들었어요. 한 개짜리.")
          + nar("종이에 한 줄이 적혀 있다. '1. {player}님한테 좋아한다고 말하기.'")
          + say("marigold", "…지금 하는 중이에요. 좋아해요. 대답은 천천히 해도 돼요. 아니, 빨리 해 주세요. 저 기다리는 거 제일 못해요!"),
          W(H(17), H(18, 30), weather=DRY), req={"seen": ["marigold:grandpaIll"]},
          choices=[
              C("“저도요. 목록에 체크해요”", "warm", nar("메리골드가 종이에 크게 체크 표시를 했다. 그리고 광장이 떠나가라 소리를 질렀다. 지나가던 이웃들이 박수를 쳤다.")),
              C("종이 뒷면에 '2. 대답 듣기 ✓'라고 쓴다", "tease", say("marigold", "…2번까지 해결! 이런 목록 처음이에요. 다 끝났는데 기분이 좋아요.")),
              C("메리골드의 손을 잡는다", "quiet", nar("메리골드가 처음으로 아무 말도 하지 못했다. 한참 뒤에 아주 작게 말했다.") + say("marigold", "…이거 체크해도 돼요?")),
          ], gain=8, confess=True, album="한 줄짜리 할 일 목록"),
        E("marigold:juice", "첫 포도즙", 4, VINE_GATE,
          say("marigold", "제 이름 붙은 포도나무에서 처음 딴 거예요! 포도주 말고 포도즙. 누구나 마실 수 있게.")
          + nar("메리골드가 작은 잔 두 개에 보랏빛 즙을 따른다. 할아버지가 멀리서 지켜본다."),
          W(H(9), H(17), weather=DRY, season=["autumn", "summer"]), req={"lover": True},
          choices=[
              C("할아버지께 먼저 한 잔 드리자고 한다", "warm", nar("할아버지가 한 모금 마시고 오래 말이 없더니, 손녀의 머리를 쓰다듬었다.") + say("grandpa", "…포도원은 네 것이다. 이제 안 판다.") + nar("메리골드가 잔을 떨어뜨렸다."), "grandpaGave"),
              C("건배한다", "tease", say("marigold", "건배! 첫 잔은 우리 거, 둘째 잔은 할아버지 거, 셋째 잔은 또 우리 거!"), "toasted"),
          ], gain=5),
        E("marigold:tooMuch", "마흔아홉 번째", 4, PLAZA_TOP,
          say("marigold", "잔치 준비, 할아버지 약, 포도원, 장날… 그리고 우리 데이트! 오늘 다 할 거예요!")
          + nar("메리골드의 눈 밑이 까맣다. 손에 든 목록이 두 장이다."),
          W(H(17), H(18, 30), weather=DRY), req={"lover": True, "seen": ["marigold:juice"]},
          choices=[
              C("“데이트는 목록에서 빼요. 오늘은 쉬는 날”", "warm", say("marigold", "…빼요? 싫어요! 아니… 알았어요. 대신 쉬는 거 옆에 있어 줘요.") + nar("광장 벤치에서 메리골드는 오 분 만에 잠들었다."), "restDay"),
              C("“솔직히 걱정돼요”", "honest", say("marigold", "…저도요. 저 자꾸 너무 많이 해요. 무서우면 더 해요.") + say("marigold", "목록 반 나눠 줄래요? 이번엔 진짜 부탁이에요."), "splitList"),
          ], gain=4, cool=1),
    ],
}

# ════════════════ 페넬로피 (베 짜는 집 딸) ════════════════
# 플레이 중: 아침부터 베 짜는 집 앞에서 실을 고른다. 점심은 호숫가 길 끝에서 혼자, 늘 같은 자리에 같은 자세로 앉는다.
# 오후엔 다시 실. 해 질 녘엔 찻집에서 파피와 차를 마신다(파피 앞에서만 조금 웃는다). 비 오는 날엔 베틀 방에서 나오지 않는다.
# 다 짠 천을 실 한 올 때문에 전부 풀어 버리는 모습을 볼 수 있다(목격). 결정을 할 때 오래 망설인다.
WEAVER_FRONT = T(31, 29)
LAKE_END = T(19, 32)
TEA_TABLE_SIDE = T(42, 62)
WEAVER_ROOM = T(6, 53)
people["penelope"] = {
    "id": "penelope", "pace": 0.7, "dislikes": ["soot"],
    "routines": [
        R(WEAVER_FRONT, W(H(7), H(12)), "weave", ["이 파랑… 아니, 저 파랑. 아니, 처음 파랑.", "실은 거짓말을 안 해요."]),
        R(LAKE_END, W(H(12), H(13), weather=DRY), "rest", ["…."]),
        R(WEAVER_FRONT, W(H(13), H(17))),
        R(TEA_TABLE_SIDE, W(H(17), H(18, 30)), "tea", ["파피, 오늘은 같은 차. …아니, 다른 거. 아니, 같은 거."], with_="poppy"),
        R(WEAVER_ROOM, W(H(7), H(17), weather=WET), "weave", ["비 오는 날엔 실이 차분해요. 저도요."]),
    ],
    "offDays": {"chance": 0.05, "routines": [R(T(26, 12), W(H(9), H(16)), "rest", ["오늘은 아무것도 안 짜요. 결정했어요. …아마도."])]},
    "lines": [
        L("penelope", "안녕하세요. 그 옷, 실이 좋네요. 어느 집에서 짰는지 궁금하네요.", 0),
        L("penelope", "실은 거짓말을 안 해요. 한 올만 틀려도 다 보여요.", 0),
        L("penelope", "비 오는 날엔 실이 차분해요. 좋은 천이 나와요.", 0, W(weather=WET)),
        L("penelope", "봄엔 꽃잎으로 실을 물들여요. 봄 냄새가 나요.", 0, W(season=["spring"])),
        L("penelope", "겨울 담요 주문이 밀려 있어요. 손가락이 쉴 틈이 없어요.", 0, W(season=["winter"])),
        L("penelope", "…무슨 말을 하려고 했는데. 두 가지 중에 뭘 말할지 고르다가 잊었어요.", 0),
        L("penelope", "파피는 제가 차를 세 번 바꿔 주문해도 웃어요. 좋은 사람이에요.", 1),
        L("penelope", "어머니는 베틀 앞에서 한 번도 망설인 적이 없대요. 저는 매번 망설여요.", 1),
        L("penelope", "메리골드는 목록을 너무 많이 만들어요. 저는 목록을 만들까 말까를 고민해요.", 1),
        L("penelope", "점심은 늘 호숫가 그 자리에서 먹어요. 바꾸면 하루 종일 이상해서요.", 1),
        L("penelope", "그때 파랑 골라 준 거, 그 천 아직 제일 아껴요.", 1, req={"memory": ["pickedBlue"]}),
        L("penelope", "이런 비 오는 날엔 베틀 방에서 같이 실 감던 거 생각나요.", 1, W(weather=WET), {"memory": ["rain"]}),
        L("penelope", "다 짠 천을 푼 거, 봤죠. 한 올 틀렸어요. 아무도 모를 한 올이요. 저는 알아요.", 2, req={"memory": ["saw:unpick"]}),
        L("penelope", "틀리는 게 무서워요. 틀리면 다시 하면 된다는 거 아는데, 손이 먼저 풀어 버려요.", 2),
        L("penelope", "도시 공방에서 오라는 말이 있었어요. 세 해 전에. 고르다가 기회가 지나갔어요.", 2),
        L("penelope", "언젠가 한 번도 풀지 않은 천을 짜고 싶어요. 틀린 올까지 그대로 둔 거요.", 2),
        L("penelope", "오늘 짠 천에 한 올 틀린 게 있어요. 안 풀었어요. {player}님 생각하다 틀린 거라서요.", 3),
        L("penelope", "요즘은 덜 망설여요. {player}님한테 가는 길은 고민 안 하니까요.", 3),
        L("penelope", "…나중에요. 지금은 실을 고르는 중이라서.", 0, cool=True),
        L("penelope", "…네. 그럴 수 있죠.", 0, cool=True),
    ],
    "sightings": [
        S("penelope:unpick", "풀어 버린 천", WEAVER_FRONT,
          nar("해 질 녘, 베 짜는 집 앞. 페넬로피가 다 짠 긴 천을 무릎에 펼쳐 놓고 한 곳을 오래 들여다본다.", "그리고 가위 끝으로 실 한 올을 걸어, 천을 처음부터 풀기 시작한다. 표정이 없다.")
          + say("penelope", "…여기. 한 올. 괜찮아. 다시 하면 돼.")
          + nar("풀린 실이 발밑에 둥글게 쌓여 갔다. 해가 다 질 때까지 페넬로피는 멈추지 않았다."),
          "saw:unpick", W(H(18, 30), H(20), weather=DRY), stage=2),
    ],
    "events": [
        E("penelope:blue", "두 가지 파랑", 1, WEAVER_FRONT,
          say("penelope", "…잠깐만요. 이 둘 중에 어느 쪽이 하늘 같아요?")
          + nar("페넬로피가 파란 실 두 타래를 내민다. 거의 같은 색이다."),
          W(H(8), H(16), weather=DRY, days=WORKDAYS),
          choices=[
              C("왼쪽을 고른다", "warm", say("penelope", "…왼쪽. 네. 왼쪽이요. 저도 그 생각이었어요. 한 시간 전부터.") + nar("페넬로피는 오른쪽 타래를 아쉬운 듯 한 번 쓰다듬었다."), "pickedBlue"),
              C("“둘 다 같아 보여요”", "honest", say("penelope", "…그렇죠? 저만 다르게 보이는 거죠?") + nar("페넬로피가 처음으로 웃었다. 아주 작게."), "sameBlue"),
          ], gain=4, opens=2),
        E("penelope:lunch", "같은 자리", 2, LAKE_END,
          nar("호숫가 길 끝, 페넬로피가 늘 앉는 자리에 앉아 있다. 오늘은 옆자리에 작은 방석이 하나 더 있다.")
          + say("penelope", "…그 방석은 그냥 있던 거예요. 앉아도 돼요. 아니, 앉으려면 앉고요."),
          W(H(12), H(13), weather=DRY),
          choices=[
              C("방석에 앉는다", "warm", say("penelope", "…다행이다. 사실 가져온 거예요. 세 번 가져갔다 다시 가져왔어요."), "sharedLunch"),
              C("“일부러 가져왔죠?”", "tease", say("penelope", "…아니에요. …네.") + nar("페넬로피가 얼굴을 돌렸다. 귀가 빨갰다."), "cushionTease"),
          ], gain=5),
        E("penelope:teaOrder", "세 번째 주문", 2, TEA_TABLE_SIDE,
          say("poppy", "페넬로피, 오늘은 뭐로 할래요? 같은 거? 다른 거?")
          + say("penelope", "…같은 거. 아니, 다른 거. …{player}님은 뭐 드세요?"),
          W(H(17), H(18, 30)),
          choices=[
              C("“같은 걸로 두 잔이요”", "warm", say("penelope", "…같은 거. 좋아요. 이번엔 안 바꿀래요.") + say("poppy", "기적이다!"), "sameTea"),
              C("“페넬로피가 골라 줘요”", "honest", nar("페넬로피가 메뉴판을 오래 들여다보았다. 오 분 뒤.") + say("penelope", "…꽃차. 두 잔. 결정했어요.") + say("poppy", "기록 갱신! 오 분!"), "sheChose"),
          ], gain=6, opens=3),
        E("penelope:unpickTalk", "한 올", 3, WEAVER_FRONT,
          nar("베 짜는 집 앞, 페넬로피 발밑에 풀린 실이 둥글게 쌓여 있다.")
          + say("penelope", "…다 짠 거였어요. 한 올 틀려서 풀었어요. 사흘 걸린 천이에요."),
          W(H(13), H(18), weather=DRY), req={"seen": ["penelope:teaOrder"]},
          choices=[
              C("“틀린 올, 저는 못 찾겠어요”", "honest", say("penelope", "…저는 알아요. 그게 문제예요.") + say("penelope", "모르는 척 두면 매일 그 한 올만 보여요."), "oneThread"),
              C("풀린 실을 같이 감는다", "warm", nar("둘이 말없이 실을 감았다. 둥근 실타래가 다 감기자 페넬로피가 작게 말했다.") + say("penelope", "…다음엔 한 올쯤 두어 볼까요. 틀린 채로."), "windTogether"),
          ], gain=6),
        E("penelope:hesitate1", "망설임", 3, LAKE_END,
          nar("호숫가 길 끝. 페넬로피가 무언가 말하려다 입을 다문다. 세 번째다.")
          + say("penelope", "…아니에요. 다음에 말할게요. 오늘 말하면 틀릴 것 같아서."),
          W(H(12), H(13), weather=DRY), req={"seen": ["penelope:unpickTalk"]},
          choices=[
              C("“기다릴게요”", "warm", say("penelope", "…기다려 준다는 말, 좋네요. 오래 걸릴지도 몰라요."), "willWait"),
              C("“틀려도 괜찮아요”", "honest", say("penelope", "…그 말은 아직 믿기 어려워요. 그래도 듣기는 좋아요."), "okToBeWrong"),
          ], gain=6, opens=4),
        E("penelope:hesitate2", "두 번째 망설임", 4, TEA_TABLE_SIDE,
          nar("찻집. 페넬로피가 찻잔을 두 손으로 감싸고 있다. 파피가 눈치껏 멀리 가 있다.")
          + say("penelope", "…도시 공방에서 또 편지가 왔어요. 이번엔 가 볼까 해요.")
          + say("penelope", "근데 가면 여기서 놓치는 게 있을 것 같아요. 뭘 놓치는지 말하면… 틀릴까 봐 말 못 하겠어요."),
          W(H(17), H(18, 30)), req={"seen": ["penelope:hesitate1"]},
          choices=[
              C("“놓치는 게 뭔지 들어 보고 싶어요”", "honest", say("penelope", "…다음에요. 한 번만 더 기다려 줘요. 이번엔 진짜 마지막이에요."), "almostSaid"),
              C("“가도, 안 가도 괜찮아요”", "warm", say("penelope", "…그 말이 제일 어려워요. 둘 다 괜찮으면 고를 수가 없잖아요.") + nar("페넬로피가 웃었다. 울 것 같은 얼굴로."), "bothOk"),
          ], gain=7, opens=5),
        E("penelope:confess", "틀린 채로 둔 한 올", 5, WEAVER_FRONT,
          nar("해 질 녘, 베 짜는 집 앞. 페넬로피가 작은 천 한 장을 내민다. 하늘빛 바탕에 흰 꽃무늬.", "가운데 실 한 올이 틀려 있다. 풀지 않고 그대로 두었다.")
          + say("penelope", "…이거 짜다가 {player}님 생각하느라 한 올 틀렸어요. 풀지 않았어요. 처음으로요.")
          + say("penelope", "도시엔 안 가요. 고민 많이 했어요. 이번 건 고민한 거 중에 제일 쉬웠어요.")
          + say("penelope", "좋아해요. 틀린 한 올까지 다요."),
          W(H(18), H(20), weather=DRY), req={"seen": ["penelope:hesitate2"]},
          choices=[
              C("틀린 한 올을 손가락으로 쓸어 본다", "warm", say("penelope", "…거기가 제일 좋은 데예요.") + nar("페넬로피가 처음으로 망설이지 않고 손을 잡았다.")),
              C("“망설임 세 번, 기다린 보람 있네요”", "tease", say("penelope", "…세었어요? 네 번이에요. 한 번은 몰래 망설였어요.")),
              C("천을 받아 소중히 접는다", "quiet", nar("페넬로피가 한참 그 손을 보다가, 아주 작게 고개를 끄덕였다. 결정한 사람의 얼굴이었다.")),
          ], gain=8, confess=True, album="틀린 채로 둔 한 올"),
        E("penelope:weaveTogether", "둘이 짜는 천", 4, WEAVER_ROOM,
          say("penelope", "베틀 앞에 앉아 봐요. 둘이 한 줄씩 번갈아 짜요. 틀려도 안 풀기로 해요. 약속해요.")
          + nar("비 오는 날의 베틀 방. 덜그럭거리는 소리 사이로 두 사람의 줄이 섞인다."),
          W(H(10), H(17), weather=WET), req={"lover": True},
          choices=[
              C("일부러 한 올 틀린다", "tease", say("penelope", "…방금 일부러 그랬죠. 안 풀 거예요. 약속했으니까.") + nar("페넬로피가 그 한 올을 오래 보다가 웃었다."), "deliberateMistake"),
              C("조용히 박자를 맞춘다", "quiet", nar("해가 질 무렵, 천 한 뼘이 완성됐다. 두 사람의 결이 조금씩 달랐는데, 그게 무늬가 되었다."), "sharedCloth"),
          ], gain=5),
        E("penelope:silentDay", "고르지 못한 날", 4, WEAVER_FRONT,
          nar("페넬로피가 실 앞에서 반나절째 아무것도 고르지 못하고 있다.")
          + say("penelope", "…오늘 저녁에 뭘 할지 {player}님이랑 정하려고 했는데, 제가 둘 중에 못 골라서 아무 말도 못 했어요. 미안해요."),
          W(H(13), H(17), weather=DRY), req={"lover": True, "seen": ["penelope:weaveTogether"]},
          choices=[
              C("“오늘은 제가 고를게요”", "warm", say("penelope", "…네. 오늘은 맡길게요. 편하다, 이거.") + nar("그날 저녁 둘은 정자에서 노을을 봤다. 페넬로피는 한 번도 망설이지 않았다."), "chooseForHer"),
              C("“둘 다 하면 되죠”", "tease", say("penelope", "…둘 다요? 그런 방법이 있었어요?") + nar("페넬로피가 한참 멍하다가 웃음을 터뜨렸다."), "bothPlans"),
          ], gain=4, cool=1),
    ],
}

# ════════════════ 주니퍼 (벌 치는 집 딸) ════════════════
# 플레이 중: 아침 벌통 들에서 벌을 관찰하며 공책에 적는다(말을 걸면 벌 이야기부터 한다). 한낮엔 큰길 위 꽃 풀밭에서 벌이 어느 꽃에 앉는지 센다.
# 해 질 녘 언덕에서 공책을 정리한다. 비 오는 날엔 사랑방에서 벌 그림을 그린다. 아무도 없는 풀밭에서 벌 춤을 따라 추는 모습을 볼 수 있다(목격).
HIVES = T(36, 31)
MEADOW = T(26, 12)
HILL_NOTES = T(16, 13)
HALL_DRAW = T(11, 74)
MEADOW_DANCE = T(27, 12)
people["juniper"] = {
    "id": "juniper", "pace": 0.8, "dislikes": ["soot"],
    "routines": [
        R(HIVES, W(H(6), H(11)), "bee", ["둘, 셋… 여덟 번 흔들면 동쪽 꽃밭.", "오늘 여왕벌 기분 좋음. 적어 두자."]),
        R(MEADOW, W(H(11), H(14), weather=DRY), "bee", ["노란 꽃 열둘, 흰 꽃 셋. 벌들은 노란 게 좋아."]),
        R(HIVES, W(H(14), H(17))),
        R(HILL_NOTES, W(H(17), H(19), weather=DRY), "book", ["오늘 관찰 끝. 벌 이백열한 마리. 아마도."]),
        R(HALL_DRAW, W(H(9), H(17), weather=WET), "book", ["비 오면 벌은 집에. 나도 집에. 비슷해."]),
    ],
    "offDays": {"chance": 0.05, "routines": [R(MEADOW_DANCE, W(H(9), H(15)), "bee", ["오늘은 벌 말고 나비. 나비는 춤을 안 춰서 서운해."])]},
    "lines": [
        L("juniper", "아, 안녕하세요. 벌 좋아하세요? 아, 아니면 됐어요. 아니, 좋아하셨으면 좋겠어요.", 0),
        L("juniper", "벌은 춤으로 꽃 있는 곳을 알려 줘요. 여덟 번 흔들면… 아, 너무 길죠. 죄송해요.", 0),
        L("juniper", "비 오는 날엔 벌들도 집에 있어요. 저도요.", 0, W(weather=WET)),
        L("juniper", "봄엔 벌들이 제일 바빠요. 저도 공책이 두 권 필요해요.", 0, W(season=["spring"])),
        L("juniper", "겨울엔 벌들이 뭉쳐서 서로 데워요. 가운데랑 바깥을 번갈아요. 공평하죠.", 0, W(season=["winter"])),
        L("juniper", "…어, 네. 음. 네. (벌 이야기를 할까 말까 망설이는 중)", 0),
        L("juniper", "어머니는 벌한테 말을 걸어요. 저는 공책에 적어요. 둘 다 이상하대요, 사람들이.", 1),
        L("juniper", "덱스터는 제가 벌 얘기할 때 끝까지 들어 줘요. 양 얘기로 갚아야 하지만요.", 1),
        L("juniper", "바질은 벌에 쏘이면 바를 약을 늘 챙겨 줘요. 한 번도 안 쏘였는데.", 1),
        L("juniper", "벌통 들에서 토끼풀을 뜯었어요. 벌들이 제일 오래 앉았다 가는 데로만요. 양도 그걸 알까요?", 1, req={"thread": {"id": "lamb", "phase": [1, 2, 3]}}),
        L("juniper", "그날 같이 센 꽃, 노란 게 열두 개였죠. 공책에 {player}님 이름도 적었어요.", 1, req={"memory": ["countedFlowers"]}),
        L("juniper", "비 오는 날엔 그날 사랑방에서 같이 벌 그리던 거 생각나요. 다리가 여섯 개 넘었죠, 그때.", 1, W(weather=WET), {"memory": ["rain"]}),
        L("juniper", "사람 앞에선 말이 막혀요. 벌 앞에선 안 그래요. 벌은 제가 이상하다고 안 하니까요.", 2),
        L("juniper", "풀밭에서 춤추는 거 봤죠. …벌 춤이에요. 진짜로 연구예요. 반쯤은.", 2, req={"memory": ["saw:dance"]}),
        L("juniper", "벌은 혼자 꿀을 못 만들어요. 저는 뭐든 혼자 하려고 했어요. 그게 잘못이었나 봐요.", 2),
        L("juniper", "언젠가 벌 공책을 책으로 엮고 싶어요. 서고에 한 칸만 있으면 좋겠어요.", 2),
        L("juniper", "오늘 공책 맨 뒤에 {player}님 관찰 기록 썼어요. …안 보여 줄 거예요.", 3),
        L("juniper", "이제 사람 앞에서도 말이 좀 덜 막혀요. 연습 상대가 좋아서요.", 3),
        L("juniper", "아, 아, 안녕하세요. 저 바빠요. 벌이. 벌이 바빠요.", 0, cool=True),
        L("juniper", "(공책에 얼굴을 묻는다)", 0, cool=True),
    ],
    "sightings": [
        S("juniper:dance", "풀밭의 춤", MEADOW_DANCE,
          nar("아무도 없는 꽃 풀밭. 주니퍼가 공책을 옆에 내려놓고 일어선다.", "엉덩이를 좌우로 흔들며 여덟 자를 그리듯 빙글빙글 돈다. 진지하다. 아주 진지하다.")
          + say("juniper", "…여덟 번. 동쪽. 좋아. 이제 알겠다, 너희 마음.")
          + nar("멀리서 벌 한 마리가 주니퍼 머리 위를 한 바퀴 돌고 갔다. 주니퍼가 공책에 무언가를 급히 적었다."),
          "saw:dance", W(H(15), H(17), weather=["sunny", "hot"], season=["spring", "summer"]), stage=1),
    ],
    "events": [
        E("juniper:flowers", "꽃 세기", 1, MEADOW,
          nar("꽃 풀밭에 주니퍼가 쪼그려 앉아 공책에 줄을 긋고 있다. 이쪽을 보자 공책을 떨어뜨린다.")
          + say("juniper", "아! 아, 죄송해요. 벌이… 아니 꽃이… 세고 있었어요. 노란 꽃."),
          W(H(11), H(14), weather=DRY),
          choices=[
              C("같이 센다", "warm", nar("노란 꽃 열둘, 흰 꽃 셋. 주니퍼가 공책에 적고, 한 줄을 더 적었다. 이쪽 이름이었다.") + say("juniper", "…관찰 도우미. 적어 뒀어요."), "countedFlowers"),
              C("“벌들은 어느 꽃을 좋아해요?”", "honest", say("juniper", "노란 거요! 꿀이 많거든요. 그리고 흰 꽃은 향이— 아, 너무 많이 말했다.") + say("juniper", "…질문해 준 사람 처음이에요."), "askedBees"),
          ], gain=5, opens=2),
        E("juniper:rainDraw", "벌 그림", 2, HALL_DRAW,
          nar("비 오는 날 사랑방. 주니퍼가 벌 그림을 그리고 있다. 다리가 여덟 개다.")
          + say("juniper", "…다리 여섯 개 맞아요. 알아요. 그리다 보면 자꾸 늘어요."),
          W(H(9), H(17), weather=WET),
          choices=[
              C("옆에서 같이 그린다", "warm", nar("둘의 벌 그림이 나란히 놓였다. 이쪽 벌은 다리가 열 개였다.") + say("juniper", "…제가 이겼다. 아니, 졌나."), "drewBees"),
              C("“여덟 개짜리 새로운 벌이네요”", "tease", say("juniper", "…신종 발견. 이름 붙여 줄래요? 공책에 적을게요."), "newSpecies"),
          ], gain=5),
        E("juniper:stung", "첫 번째 침", 2, HIVES,
          nar("벌통 앞에서 주니퍼가 손을 감싸 쥐고 있다. 눈에 눈물이 고였다.")
          + say("juniper", "쏘였어요. 제 잘못이에요. 급하게 움직였어요. 벌이 놀랐어요.")
          + say("juniper", "…벌은 쏘면 죽어요. 저 때문에."),
          W(H(7), H(16), weather=DRY), req={"seen": ["juniper:flowers"]},
          choices=[
              C("바질에게 받은 약을 발라 준다", "warm", nar("주니퍼가 약을 바르는 동안 한 번도 손을 빼지 않았다.") + say("juniper", "…바질이 늘 챙겨 준 약, 처음 써 봐요. 제가 쓰는 게 아니라 발라 주시네요."), "treatedSting"),
              C("“벌도 주니퍼를 지키려던 거예요”", "honest", say("juniper", "…집을 지키려던 거죠. 알아요. 그래서 더 미안해요.") + nar("주니퍼는 벌통 앞에 작은 꽃 하나를 놓았다."), "flowerForBee"),
          ], gain=6, opens=3),
        E("juniper:lamb", "토끼풀 한 묶음", 3, HIVES,
          nar("벌통 들에 주니퍼가 토끼풀 묶음을 두 손으로 들고 서 있다. 풀줄기로 꼭꼭 묶었다.")
          + say("juniper", "덱스터네 어린 양이 젖을 떼고 풀을 잘 안 먹는대요. 이건… 먹을까요? 제가 갖다주면 이상할까요?"),
          W(H(8), H(17)), req={"thread": {"id": "lamb", "phase": [1]}},
          choices=[
              C("같이 덱스터에게 가져간다", "warm", nar("덱스터가 토끼풀 묶음을 받아 들고 눈이 동그래졌다. 주니퍼는 뒤에서 조용히 서 있었다.") + say("dexter", "주니퍼… 고마워. 진짜로. 이건 아직 안 줘 본 풀이야.") + nar("주니퍼의 얼굴이 새빨개졌다."), "broughtLamb"),
              C("“주니퍼가 직접 내밀어 봐요”", "honest", say("juniper", "…제가요? 네. 해 볼게요.") + nar("주니퍼는 양 우리 울타리 앞에 쪼그려 앉아 토끼풀을 내밀고, 벌 이야기를 작게 들려주었다. 어린 양이 코를 벌름거리며 다가왔다."), "heldLamb"),
          ], gain=7),
        E("juniper:dancePlay", "벌 춤", 3, MEADOW_DANCE,
          nar("꽃 풀밭. 주니퍼가 이쪽을 보고 굳는다.")
          + say("juniper", "…봤죠. 춤. 그날.")
          + say("juniper", "연구예요. 진짜로요. …같이 해 볼래요? 여덟 번 흔들고 동쪽."),
          W(H(15), H(17), weather=["sunny", "hot"]), req={"memory": ["saw:dance"]},
          choices=[
              C("같이 춘다", "tease", nar("둘이 풀밭에서 엉덩이를 흔들며 빙글빙글 돌았다. 지나가던 코스모가 멈춰 서서 박수를 쳤다.") + say("juniper", "…코스모한테 들켰다. 내일 온 마을이 알겠다.") + nar("주니퍼는 웃고 있었다."), "dancedTogether"),
              C("“어떤 뜻이에요, 그 춤?”", "honest", say("juniper", "…'좋은 걸 찾았으니 같이 가자'는 뜻이에요.") + nar("말해 놓고 주니퍼가 공책으로 얼굴을 가렸다."), "danceMeaning"),
          ], gain=7, opens=4),
        E("juniper:danceNew", "풀밭의 공책", 3, MEADOW_DANCE,
          nar("꽃 풀밭. 주니퍼의 공책이 바람에 넘어간다. 한 쪽에 사람 그림이 있다. 벌 춤을 추는 사람. 그 옆에 적힌 이름은 주인공의 것이다.")
          + say("juniper", "아! 그, 그건… 벌 춤 연구 상대로 어떤 분이 좋을까 적어 본 거예요!"),
          W(H(15), H(17), weather=["sunny", "hot"]), req={"notMemory": ["saw:dance"], "notSeen": ["juniper:dancePlay"]},
          choices=[
              C("“연구 상대 해 줄게요”", "warm", nar("주니퍼가 공책 뒤에서 눈만 내밀었다.") + say("juniper", "…진짜요? 여덟 번 흔들어야 해요. 부끄러워도요."), "danceMeaning"),
              C("모른 척 공책을 덮어 준다", "quiet", say("juniper", "…고마워요. 근데 이상하게 들킨 게 싫지 않아요."), "notebookClosed"),
          ], gain=7, opens=4),
        E("juniper:avoid", "피해 다니는 날들", 4, HILL_NOTES,
          nar("요즘 주니퍼가 보이기만 하면 방향을 바꾼다. 오늘은 언덕에서 딱 마주쳤다. 도망칠 곳이 없다.")
          + say("juniper", "…피한 거 맞아요. 죄송해요.")
          + say("juniper", "{player}님 앞에만 서면 공책에 적을 말이 하나도 안 떠올라요. 벌한테도 이런 적 없었어요. 그래서 무서워서요."),
          W(H(17), H(19), weather=DRY), req={"seen": ["juniper:stung"]},
          choices=[
              C("“그럼 제가 먼저 말할게요”", "warm", say("juniper", "…네. 그래 주세요. 저는 들을게요. 적지 않고요."), "youTalkFirst"),
              C("“공책에 안 적어도 돼요”", "honest", say("juniper", "…안 적어도 기억할 수 있을까요?") + say("juniper", "…할 수 있을 것 같아요. 이건."), "noNotes"),
          ], gain=7, opens=5),
        E("juniper:confess", "여덟 번", 5, MEADOW_DANCE,
          nar("꽃 풀밭. 주니퍼가 공책 없이 서 있다. 처음 보는 모습이다.")
          + say("juniper", "말로 하면 막혀서요. 벌처럼 할게요.")
          + nar("주니퍼가 이쪽을 향해 여덟 번 흔든다. 그리고 한 걸음 다가온다.")
          + say("juniper", "…'좋은 걸 찾았으니 같이 가자'는 뜻이에요. 좋아해요. 공책에 쓸 수 없을 만큼요."),
          W(H(15), H(18), weather=["sunny", "hot", "wind"]), req={"seen": ["juniper:avoid"]},
          choices=[
              C("같이 여덟 번 흔든다", "tease", nar("주니퍼가 웃음을 터뜨렸다. 처음 듣는 큰 웃음이었다.") + say("juniper", "…대답 맞죠? 벌 말로는 '응'이에요!")),
              C("“같이 가요”", "warm", say("juniper", "…같이.") + nar("주니퍼가 공책 대신 손을 내밀었다. 벌 한 마리가 두 사람 사이를 지나갔다.")),
              C("말없이 한 걸음 다가간다", "quiet", nar("주니퍼가 숨을 멈췄다. 그리고 아주 작게, 공책에 적을 수 없는 말을 했다.")),
          ], gain=8, confess=True, album="여덟 번의 춤"),
        E("juniper:book", "벌 공책의 책", 4, HILL_NOTES,
          say("juniper", "공책 열두 권을 책으로 엮고 싶어요. {player}님이 엮어 줄래요? 서고에 한 칸만.")
          + nar("주니퍼가 닳은 공책 더미를 내민다. 맨 위 공책 표지에 벌 그림, 그리고 작게 두 사람 이름."),
          W(H(17), H(19), weather=DRY), req={"lover": True},
          choices=[
              C("“서고에 벌 칸을 만들어요”", "warm", say("juniper", "…벌 칸. 마을 서고에.") + nar("주니퍼가 공책을 끌어안고 한참 서 있었다. 그리고 벌 춤을 한 번 추었다."), "beeShelf"),
              C("“표지 이름은 어느 분이 썼어요?”", "tease", say("juniper", "…벌이요. 벌이 썼어요.") + nar("주니퍼는 얼굴을 가리고 웃었다."), "coverNames"),
          ], gain=5),
        E("juniper:quietDay", "말이 없는 날", 4, HIVES,
          nar("주니퍼가 벌통 앞에서 반나절째 공책만 들여다본다. 말을 걸어도 고개만 끄덕인다.")
          + say("juniper", "…어머니가 제 공책을 보셨어요. 쓸데없는 거 적는다고. 벌은 벌이지 무슨 연구냐고.")
          + say("juniper", "그 뒤로 말이 안 나와요. {player}님한테도요. 미안해요."),
          W(H(9), H(16), weather=DRY), req={"lover": True, "seen": ["juniper:book"]},
          choices=[
              C("말없이 옆에 앉아 벌을 같이 본다", "quiet", nar("한참 뒤 주니퍼가 먼저 입을 열었다.") + say("juniper", "…저 벌, 방금 여덟 번 흔들었어요. 봤어요?"), "watchedBees"),
              C("“어머니께 공책 보여 드려요, 같이”", "honest", say("juniper", "…같이요? 네.") + nar("그날 저녁 벌 치는 집에서 주니퍼 목소리가 오래 들렸다. 벌 얘기였다. 어머니가 끝까지 들었다."), "showedMother"),
          ], gain=4, cool=1),
    ],
}

# ════════════════ 파피 (정원 찻집 종업원) ════════════════
# 플레이 중: 새벽 호숫가 길에서 편지를 쓴다(누구에게 쓰는지는 말하지 않는다). 아침엔 찻집 앞을 쓸고, 문을 열면 하루 종일 찻집 안에서 손님을 맞는다.
# 손님마다 주문을 외운다. 문 닫은 뒤 편지 나르는 이웃 집 앞에 들렀다 간다. 장날엔 꿀 과자 좌판.
LAKE_LETTER = T(30, 32)
TEA_SWEEP = T(31, 10)
TEA_WORK = T(44, 62)
POST_DROP = T(44, 23)
people["poppy"] = {
    "id": "poppy", "pace": 1.5, "dislikes": ["soot"],
    "routines": [
        R(LAKE_LETTER, W(H(6), H(7), weather=DRY), "book", ["…언니는 잘 지내. 여긴 호수가 예뻐. 이 말 벌써 세 번째 쓰네."]),
        R(TEA_SWEEP, W(H(7), H(8), weather=DRY), "rest", ["오늘 첫 손님은 누굴까. 바질 씨겠지, 찻잎 들고."]),
        R(TEA_WORK, W(H(8), H(19)), "tea", ["어서 오세요! …아, 늘 드시던 거죠?", "찻잎은 끓기 직전에. 직전에."]),
        R(POST_DROP, W(H(19), H(19, 40), weather=DRY), "wait", ["이번엔 답장이 올까."]),
        R(PLAZA_STALL_P, W(H(8), H(12), days=MARKET), "bread", ["꿀 과자요! 빵집보다 달아요!"]),
    ],
    "offDays": {"chance": 0.04, "routines": [R(LAKE_LETTER, W(H(8), H(12)), "rest", ["오늘은 문 늦게 열래. 한 번쯤."])]},
    "lines": [
        L("poppy", "어서 오세요! 오늘은 꽃차가 향이 좋아요.", 0),
        L("poppy", "손님들 주문은 다 외워요. 틸리는 뜨거운 거, 덱스터는 식은 거, 페넬로피는… 매번 달라요.", 0),
        L("poppy", "비 오는 날엔 손님이 늘어요. 다들 따뜻한 게 그리운가 봐요.", 0, W(weather=WET)),
        L("poppy", "여름엔 차가운 꽃차를 내요. 얼음은 없어서 우물물로 식혀요. 비밀이에요.", 0, W(season=["summer"])),
        L("poppy", "겨울 찻집은 창에 김이 서려서 좋아요. 손가락으로 그림 그려도 돼요.", 0, W(season=["winter"])),
        L("poppy", "장날엔 꿀 과자가 제일 먼저 떨어져요. …빵집 아드님한테 말하지 마세요.", 0, W(days=MARKET)),
        L("poppy", "바질 씨 찻잎이 제일 향이 좋아요. 바질 씨 앞에선 말 안 해요. 들뜨니까요.", 1),
        L("poppy", "페넬로피는 망설일 때 귀엽다고 말하면 더 망설여요. 그래서 안 말해요.", 1),
        L("poppy", "저 이 마을 사람 아니에요. 두 해 전에 혼자 왔어요. 다들 원래 있던 사람처럼 대해 줘서… 가끔 잊어요.", 1),
        L("poppy", "새벽마다 쓰는 편지요? 동생한테요. 다섯 살 어려요. 답장은… 가끔 와요.", 1, req={"memory": ["saw:letterPoppy"]}),
        L("poppy", "그때 새 차 이름 지어 준 거, 메뉴판에 올렸어요. 제일 잘 팔려요!", 1, req={"memory": ["namedTea"]}),
        L("poppy", "이런 비 오는 날엔 그날 창에 김 서린 데 같이 그림 그리던 거 생각나요.", 1, W(weather=WET), {"memory": ["rain"]}),
        L("poppy", "집에는 못 가요. 가면 다시 못 나올 것 같아서요. 여기가 좋아요. 여기 있어도 되는 거죠?", 2),
        L("poppy", "제일 무서운 건 제가 '잠깐 있다 가는 사람'이 되는 거예요. 찻잔처럼. 씻어서 치우면 끝인.", 2),
        L("poppy", "언젠가 제 찻집을 하고 싶어요. 동생도 부르고요. 여기, 이 호숫가에.", 2),
        L("poppy", "{player}님 찻잔은 따로 둬요. 아무도 못 써요. 주인 아주머니도요.", 2, req={"seen": ["poppy:cup"]}),
        L("poppy", "오늘 차엔 제 마음을 좀 넣었어요. …농담 반이에요. 반은 진짜.", 3),
        L("poppy", "동생한테 편지에 {player}님 얘기 썼어요. 답장이 바로 왔어요. 처음으로요!", 3),
        L("poppy", "…어서 오세요. 늘 드시던 거죠.", 0, cool=True),
        L("poppy", "(평소보다 짧게 웃는다) 차 나왔어요.", 0, cool=True),
    ],
    "sightings": [
        S("poppy:letter", "새벽의 편지", LAKE_LETTER,
          nar("해 뜨기 전 호숫가 길. 파피가 무릎에 종이를 대고 편지를 쓴다. 쓰다가 지우고, 다시 쓴다.")
          + say("poppy", "…'언니는 여기서 행복해. 걱정 마.' …행복한 거 맞지, 나?")
          + nar("파피는 편지를 접어 앞치마 주머니에 넣고, 기지개를 크게 켜고, 찻집 쪽으로 뛰어갔다. 벌써 웃는 얼굴이었다."),
          "saw:letterPoppy", W(H(6), H(7), weather=DRY), stage=1),
    ],
    "events": [
        E("poppy:order", "늘 드시던 거", 1, TEA_WORK,
          say("poppy", "어서 오세요! 처음 오셨죠? 제가 손님 주문 다 외워요. 두 번째부터는 '늘 드시던 거'로 드려요.")
          + say("poppy", "그러니까 처음이 중요해요. 뭘로 하실래요?"),
          W(H(8), H(19)),
          choices=[
              C("꽃차를 주문한다", "warm", say("poppy", "꽃차! 좋은 선택. 이제 평생 꽃차예요. 도망 못 가요."), "flowerTea"),
              C("“파피가 좋아하는 걸로요”", "tease", say("poppy", "…어머, 그런 주문 처음이에요.") + nar("파피가 찻잔을 고르다 한참 망설였다. 결국 꿀 넣은 박하차가 나왔다.") + say("poppy", "제가 제일 좋아하는 거예요. 아무한테도 안 알려 준 건데."), "herFavorite"),
          ], gain=5, opens=2),
        E("poppy:window", "김 서린 창", 2, TEA_WORK,
          nar("비 오는 찻집. 창에 김이 뽀얗게 서려 있다. 파피가 손가락으로 조그만 찻잔 그림을 그리고 있다.")
          + say("poppy", "손님 없을 땐 이거 해요. 비밀이에요. 같이 그릴래요?"),
          W(H(10), H(18), weather=WET),
          choices=[
              C("옆에 호수를 그린다", "warm", nar("찻잔 옆에 호수, 그 옆에 파피가 작은 집을 그렸다.") + say("poppy", "…제 찻집이에요. 언젠가요."), "drewWindow"),
              C("파피 얼굴을 그린다", "tease", say("poppy", "코가 왜 이렇게 커요!") + nar("파피가 웃으며 그 옆에 주인공 얼굴을 그렸다. 귀가 엄청 컸다."), "drewFaces"),
          ], gain=5),
        E("poppy:cup", "따로 둔 찻잔", 2, TEA_WORK,
          nar("찻집. 파피가 선반 맨 위에서 찻잔 하나를 꺼낸다. 다른 찻잔들과 무늬가 다르다.")
          + say("poppy", "이거, {player}님 거예요. 장터에서 샀어요. 다른 손님은 이걸로 안 드려요.")
          + say("poppy", "…이상한가요? 손님마다 찻잔 따로 두는 거."),
          W(H(9), H(18)), req={"seen": ["poppy:order"]},
          choices=[
              C("“좋아요, 제 자리가 생긴 것 같아서”", "warm", say("poppy", "…자리. 네. 그런 거예요. 여기 {player}님 자리.") + nar("파피가 찻잔을 조심스럽게 내려놓았다."), "ownCup"),
              C("“다른 사람 것도 있어요?”", "honest", say("poppy", "…아뇨. 이거 하나예요.") + nar("파피가 말해 놓고 얼굴이 빨개졌다."), "onlyCup"),
          ], gain=6, opens=3),
        E("poppy:letterTalk", "동생", 3, LAKE_LETTER,
          nar("새벽 호숫가. 파피가 편지를 쓰다가 이쪽을 보고 급히 접는다.")
          + say("poppy", "…일찍 일어나셨네요. 편지요? 아, 그냥.")
          + say("poppy", "…동생한테요. 집엔 못 가서요. 가면 다시 못 나올 것 같아서요."),
          W(H(6), H(7), weather=DRY), req={"seen": ["poppy:cup"]},
          choices=[
              C("“못 나올 것 같은 이유, 들어도 돼요?”", "honest", say("poppy", "…집에선 제가 늘 누구 딸, 누구 언니였어요. 여기선 그냥 파피예요.") + say("poppy", "그게 좋아서 도망 온 거예요. 동생만 두고. 그게 미안해요."), "heardFamily"),
              C("“동생한테 이 호수 얘기 써 줘요”", "warm", nar("파피가 편지를 다시 펴서 한 줄을 더 썼다. 그리고 보여 주었다. '호숫가에 친절한 사람이 있어.'") + say("poppy", "…이 줄은 사실이라서 쓰기 쉬워요."), "letterLine"),
          ], gain=6),
        E("poppy:teaName", "새 차 이름", 3, TEA_WORK,
          say("poppy", "새 차를 만들었어요! 꽃잎 셋, 꿀 조금, 박하 한 잎. 근데 이름이 없어요.")
          + say("poppy", "지어 주실래요? 메뉴판에 올릴 거예요. 이상한 이름이어도요."),
          W(H(9), H(18)), req={"seen": ["poppy:letterTalk"]},
          choices=[
              C("“호숫가 새벽”", "warm", say("poppy", "…호숫가 새벽. 제가 편지 쓰는 시간이네요.") + nar("파피가 메뉴판에 또박또박 적었다. 그 이름만 글씨가 제일 컸다."), "namedTea"),
              C("“파피의 비밀”", "tease", say("poppy", "비밀을 메뉴판에 올리면 비밀이 아니잖아요!") + nar("그래도 파피는 적었다. 그 차는 그 주에 제일 많이 팔렸다."), "namedTea"),
          ], gain=7, opens=4),
        E("poppy:closing", "문 닫은 찻집", 4, TEA_WORK,
          nar("문 닫은 저녁 찻집. 의자가 다 올라가 있다. 파피가 찻잔을 닦다가 멈춘다.")
          + say("poppy", "…주인 아주머니가 찻집을 그만두실 수도 있대요. 그럼 저는 여기 있을 이유가 없어져요.")
          + say("poppy", "잠깐 있다 가는 사람. 그게 제일 무서웠는데."),
          W(H(18, 30), H(19, 30)), req={"seen": ["poppy:teaName"]},
          choices=[
              C("“파피가 여기 있는 이유는 찻집만이 아니에요”", "warm", say("poppy", "…그럼 뭐예요? 말해 줘요. 들으면 버틸 수 있을 것 같아요.") + nar("대답하자 파피가 찻잔을 내려놓고 한참 창밖을 보았다."), "reasonToStay"),
              C("“파피 찻집을 하면 되잖아요”", "honest", say("poppy", "…제 찻집?") + nar("파피가 김 서린 창에 그렸던 작은 집 그림을 떠올리는 얼굴이 되었다.") + say("poppy", "…해 볼까요. 무서운데, 해 볼까요."), "ownShop"),
          ], gain=7, opens=5),
        E("poppy:confess", "마지막 손님", 5, TEA_WORK,
          nar("문 닫은 찻집. 파피가 의자 두 개만 내려놓았다. 탁자에 찻잔 둘. 하나는 늘 따로 두던 그 찻잔이다.")
          + say("poppy", "오늘은 제가 손님이에요. {player}님이 차 우려 주세요.")
          + nar("서툴게 우린 차를 파피가 한 모금 마신다. 조금 쓰다.")
          + say("poppy", "…써요. 제일 맛있어요.")
          + say("poppy", "좋아해요. 잠깐 있다 가는 사람 말고, 오래 있는 사람이 되고 싶어요. {player}님 옆에."),
          W(H(19), H(20, 30)), req={"seen": ["poppy:closing"]},
          choices=[
              C("“오래 있어요. 제 옆에”", "warm", nar("파피가 웃다가 울다가 다시 웃었다. 찻잔을 두 손으로 감쌌다.")),
              C("“다음엔 안 쓰게 우릴게요”", "tease", say("poppy", "안 돼요. 쓴 게 좋아요. 이거 '마지막 손님'이라고 메뉴에 올릴 거예요. 둘만 아는 메뉴로.")),
              C("따로 둔 찻잔에 차를 한 잔 더 따른다", "quiet", nar("파피가 그 찻잔을 한참 보다가, 조용히 말했다.") + say("poppy", "…이제 이 잔, 우리 거네요.")),
          ], gain=8, confess=True, album="마지막 손님"),
        E("poppy:sister", "답장", 4, POST_DROP,
          say("poppy", "답장 왔어요! 동생이 여름에 놀러 온대요! 호수 보러요!")
          + say("poppy", "…{player}님 소개해도 돼요? 동생이 궁금하대요. 편지에 너무 많이 써서요."),
          W(H(19), H(20), weather=DRY), req={"lover": True},
          choices=[
              C("“물론이죠. 찻집에서 기다릴게요”", "warm", say("poppy", "…우리 찻집이요? 아직 아닌데. 벌써 그렇게 불렀어요.") + nar("파피가 편지를 가슴에 꼭 안았다."), "meetSister"),
              C("“편지에 뭐라고 썼는데요?”", "tease", say("poppy", "…비밀이에요. 동생 오면 동생한테 물어보세요. 다 불 거예요, 걔.") + nar("파피가 웃으며 편지를 등 뒤로 숨겼다."), "letterSecret"),
          ], gain=5),
        E("poppy:tired", "웃지 않는 날", 4, TEA_WORK,
          nar("찻집. 파피가 평소처럼 웃는데, 웃음이 짧다. 찻잔을 두 번 떨어뜨릴 뻔한다.")
          + say("poppy", "…괜찮아요. 아니, 안 괜찮아요. 손님들 앞에선 늘 웃어야 해서, {player}님 앞에서까지 웃다가 힘들어졌어요.")
          + say("poppy", "{player}님 앞에서는 안 웃어도 돼요? 가끔은?"),
          W(H(14), H(18)), req={"lover": True, "seen": ["poppy:sister"]},
          choices=[
              C("“안 웃어도 돼요. 제 앞에선 쉬어요”", "warm", nar("파피가 앞치마를 풀고 의자에 털썩 앉았다. 한참 아무 표정 없이 창밖을 보았다. 편해 보였다."), "restFace"),
              C("“힘들다고 말해 줘서 다행이에요”", "honest", say("poppy", "…네. 처음 말해 봐요. 힘들다는 말.") + say("poppy", "말하니까 좀 덜 힘들어요. 신기하다."), "saidTired"),
          ], gain=4, cool=1),
    ],
}

# 첫 두 사람 때 넣은 파피의 마을 사건 말·장날 자리는 그대로 이어 붙인다
people["poppy"]["lines"] = _old_poppy["lines"] + people["poppy"]["lines"]

# ════════════════ 원래 이웃들이 전하는 새 마을 사건 ════════════════
people["fisher"] = {"id": "fisher", "pace": 1, "routines": [], "lines": [
    L("fisher", "코스모 배가 폭풍에 부서졌소. 녀석이 웃고 다니는데, 그게 더 마음이 쓰이오.", 0, req={"thread": {"id": "boat", "phase": [0]}}),
    L("fisher", "목수 아들이 뱃머리를 깎는데, 둘이 하루 종일 투닥거리오. 좋은 징조요.", 0, req={"thread": {"id": "boat", "phase": [1]}}),
    L("fisher", "배가 다시 떴소. 뱃머리에 이름을 새겼더군. 삐뚤빼뚤하지만.", 0, req={"thread": {"id": "boat", "phase": [2]}}),
]}
people["carpenter"] = {"id": "carpenter", "pace": 1, "routines": [], "lines": [
    L("carpenter", "루디가 요즘 나루에 가 있소. 어부 아들 배를 고친다고. 제 일보다 열심이오.", 0, req={"thread": {"id": "boat", "phase": [0, 1]}}),
]}
people["shepherd"] = {"id": "shepherd", "pace": 1, "routines": [], "lines": [
    L("shepherd", "어린 양 하나가 젖을 떼고 풀을 안 먹어요. 그 애는 원래 입이 짧아요. 덱스터가 온 마을 풀을 한 줌씩 뜯어 와요.", 0, req={"thread": {"id": "lamb", "phase": [0]}}),
    L("shepherd", "벌 치는 집 딸이 토끼풀을 뜯어다 줬대요. 덱스터가 그 집에 양털을 한 자루 갖다줬어요.", 0, req={"thread": {"id": "lamb", "phase": [1, 2]}}),
]}
people["beekeeper"] = {"id": "beekeeper", "pace": 1, "routines": [], "lines": [
    L("beekeeper", "우리 딸이 벌통 들 토끼풀을 한 아름 뜯어 갔어요. 벌보다 양을 먼저 챙긴 건 처음이에요.", 0, req={"thread": {"id": "lamb", "phase": [1, 2]}}),
]}

threads.append({
    "id": "boat", "end": 30,
    "phases": [
        {"day": 20, "routines": {
            "cosmo": [R(DOCK, W(H(9), H(17)), "wait", ["…괜찮아. 배는 또 만들면 돼. 형 배는 못 만들지만."])],
            "rudy": [R(T(23, 32), W(H(13), H(17)), "wood", ["뱃머리. 열한 뼘."])],
        }},
        {"day": 23, "sightings": [S("boat:argue", "나루의 말다툼", DOCK,
            say("cosmo", "뱃머리는 뾰족해야 물을 가르지!")
            + say("rudy", "…둥글어야 안 부서져.")
            + say("cosmo", "형이 만든 건 뾰족했다고!")
            + nar("루디가 대패를 내려놓고 한참 코스모를 보았다. 그리고 뾰족한 선을 조금 남긴 둥근 뱃머리를 그려 보였다. 코스모가 입을 다물었다."),
            "saw:boatArgue", W(H(13), H(15)), npc="rudy")]},
        {"day": 26, "sightings": [S("boat:launch", "다시 뜬 배", DOCK,
            nar("나루. 새 뱃머리를 단 배가 물에 미끄러져 들어간다. 코스모가 노를 잡고, 루디가 뱃머리를 손 뼘으로 한 번 잰다.")
            + say("cosmo", "형! 아니, 루디 형! 같이 타요!")
            + nar("루디는 고개를 젓다가, 결국 배에 올랐다. 배가 조금 기울었다. 둘 다 웃었다."),
            "saw:launch", W(H(10), H(12), weather=DRY), npc="cosmo")]},
    ],
})
threads.append({
    "id": "lamb", "end": 37,
    "phases": [
        {"day": 30, "routines": {"dexter": [
            R(HILL_GRASS, W(H(6), H(10)), "wait", ["언덕 풀 한 줌. 늦잠이가 이것도 고개를 돌리려나."]),
            R(MEADOW_DANCE, W(H(10), H(14)), "wait", ["꽃 핀 풀은 냄새가 다르네. 한 줌만 더."]),
            R(LAKE_ROAD, W(H(14), H(18)), "wait", ["물가 풀은 부드럽다던데. 이것도 싸 가자."]),
        ]}},
        {"day": 32, "sightings": [S("lamb:clover", "벌통 들의 토끼풀", HIVES,
            nar("벌통 들. 주니퍼가 벌이 오래 앉았다 가는 꽃자리만 골라 토끼풀을 뜯고 있다. 바구니가 금세 불룩해진다.")
            + say("juniper", "벌들이 제일 오래 머무는 데가 제일 달대. …양도 그럴까.")
            + nar("주니퍼는 토끼풀을 풀줄기로 묶고, 양 우리 쪽을 한참 바라보았다."),
            "saw:lambClover", W(H(8), H(12)), npc="juniper")]},
        {"day": 33, "sightings": [S("lamb:firstBite", "양 우리의 첫 입", PEN2,
            nar("양 우리. 덱스터가 토끼풀을 내밀고, 어린 양은 냄새만 맡다 고개를 돌린다. 주니퍼는 울타리 밖에서 공책을 꼭 쥐고 있고, 지나가던 바질이 걸음을 멈춘다.")
            + say("basil", "꽃 말고 잎만 떼어 줘 봐요. 쑥떡도 어린잎으로 해야 부드럽거든요.")
            + say("dexter", "…먹는다. 늦잠이가 먹어요! 늦잠만 자던 애가.")
            + nar("셋이 동시에 웃었다. 늦잠이가 딸꾹질을 했다."),
            "saw:lambFirstBite", W(H(9), H(12), weather=DRY), npc="basil")]},
    ],
})

out = {"people": people, "threads": threads}
open("/home/user/27maeul/src/content/people.json", "w").write(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
print("ok", {k: (len(v.get("lines", [])), len(v.get("events", []))) for k, v in people.items()})
