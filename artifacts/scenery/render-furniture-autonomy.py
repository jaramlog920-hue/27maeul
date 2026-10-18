import json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path('artifacts/scenery'); data=json.loads((root/'furniture-autonomy-visual.json').read_text(encoding='utf-8'))
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',12)
for n,sheet in enumerate(data,1):
 cw=190;ch=178;items=sheet['frames'];im=Image.new('RGB',(cw*4,ch*math.ceil(len(items)/4)),'#efe5d1');d=ImageDraw.Draw(im)
 for i,item in enumerate(items):
  x=(i%4)*cw;y=(i//4)*ch;d.text((x+4,y+3),item['label'],font=font,fill='#493225')
  sprite=Image.new('RGBA',(item['w'],item['h']))
  for layer in item['layers']:
   for yy,row in enumerate(layer['rows']):
    for xx,c in enumerate(row):
     col=layer['palette'].get(c)
     if c=='.' or col is None:continue
     if col.startswith('rgba'):col='#bfae92'
     sprite.putpixel((xx,yy),tuple(bytes.fromhex(col.lstrip('#')))+(255,))
  sprite=sprite.resize((item['w']*3,item['h']*3),Image.Resampling.NEAREST)
  im.paste(sprite,(x+(cw-sprite.width)//2,y+22),sprite)
  d.line((x,y+ch-1,x+cw,y+ch-1),fill='#c9bbaa')
 im.save(root/f'furniture-autonomy-{n}.png')
