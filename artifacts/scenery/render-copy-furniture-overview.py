from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont
root=Path.cwd()
items=json.loads((root/'artifacts/scenery/copy-furniture-manifest.json').read_text(encoding='utf-8'))['items']
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',14)
title=ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf',28)
W=1280; cw=248; ch=166; top=100
out=Image.new('RGB',(W,top+8*ch+20),'#eee4d4');d=ImageDraw.Draw(out)
d.text((25,15),'필사 수집 가구 40종 전체 모음',font=title,fill='#3b3028')
d.text((25,56),'유아 5종 → 어린이 5종 → 나머지 30종 · 실제 게임과 같은 렌더러의 사용 동작 한 장면',font=small,fill='#685443')
labels={'infant':'1순위 · 유아','child':'2순위 · 어린이','bath':'목욕탕','kitchen':'부엌','pet':'애완동물','season':'계절 전시물'}
for i,item in enumerate(items):
    x=20+(i%5)*cw; y=top+(i//5)*ch
    d.rounded_rectangle((x,y,x+cw-10,y+ch-10),radius=8,fill='#fff8ed')
    d.text((x+10,y+7),str(i+1)+'. '+item['name'],font=font,fill='#3b3028')
    d.text((x+10,y+34),labels[item['category']],font=small,fill='#81705d')
    sheet=Image.open(root/item['variants'][0]['file']).convert('RGB')
    crop=sheet.crop((200,36,280,68)).resize((240,96),Image.Resampling.NEAREST)
    out.paste(crop,(x,y+57))
out.save(root/'artifacts/scenery/copy-furniture-all-40.png')
