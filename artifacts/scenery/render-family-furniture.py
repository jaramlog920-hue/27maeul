import json, math
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root=Path('artifacts/scenery'); data=json.loads((root/'family-furniture-visual.json').read_text(encoding='utf-8'))
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',13)
for key,cols,scale in [('tiles',5,7),('motions',4,5)]:
 items=data[key];cw=210;ch=155 if key=='tiles' else 190
 im=Image.new('RGB',(cw*cols,ch*math.ceil(len(items)/cols)), '#efe5d1');d=ImageDraw.Draw(im)
 for i,item in enumerate(items):
  x=(i%cols)*cw;y=(i//cols)*ch
  d.text((x+6,y+6),item['label'],font=font,fill='#4f382b')
  sprite=Image.new('RGBA',(item['w'],item['h']))
  for layer in item['layers']:
   for yy,r in enumerate(layer['rows']):
    for xx,c in enumerate(r):
     color=layer['palette'].get(c)
     if c=='.' or color is None:continue
     ty=yy+layer.get('dy',0)
     if not 0<=ty<item['h']:continue
     if color.startswith('rgba'):color='#9b8873'
     sprite.putpixel((xx,ty),tuple(bytes.fromhex(color.lstrip('#')))+(255,))
  sprite=sprite.resize((item['w']*scale,item['h']*scale),Image.Resampling.NEAREST)
  im.paste(sprite,(x+(cw-sprite.width)//2,y+25),sprite)
  d.line((x,y+ch-1,x+cw,y+ch-1),fill='#c9bbaa')
 if key=='motions':
  # One page per age/appearance or species/age; every phase stays in adjacent columns.
  for page in range(8):
   im.crop((0,page*950,im.width,(page+1)*950)).save(root/f'family-furniture-motion-{page+1}.png')
 else:im.save(root/'family-furniture-20.png')
