import fs from 'node:fs'
import crypto from 'node:crypto'

it('ships forty read-only motion cards with working direction, cast, pause and scrub controls',()=>{
  const html=fs.readFileSync('public/assets/furniture/copy-collection.html','utf8')
  const script=html.match(/<script>([\s\S]*)<\/script>/)![1]
  document.body.innerHTML=html.replace(/<script>[\s\S]*<\/script>/,'')
  const draw=vi.fn(),context={clearRect:vi.fn(),drawImage:draw,imageSmoothingEnabled:false}
  const getContext=vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>context as never)
  let callback:FrameRequestCallback=()=>{}
  vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{callback=cb;return 1})
  class ImageStub {complete=true;src=''}
  vi.stubGlobal('Image',ImageStub)
  const setItem=vi.spyOn(Storage.prototype,'setItem')
  try{
    new Function(script)()
    expect(document.querySelectorAll('article')).toHaveLength(40)
    expect(document.querySelector('h2')?.textContent).toContain('유아 씻기대')
    callback(1000)
    expect(draw).toHaveBeenCalledTimes(40)
    const variant=document.querySelector<HTMLSelectElement>('#variant')!;variant.value='alternate';variant.dispatchEvent(new Event('change'))
    expect((draw.mock.calls.at(-1)![0] as ImageStub).src).toContain('-alternate.png')
    const direction=document.querySelector<HTMLSelectElement>('#direction')!;direction.value='side';direction.dispatchEvent(new Event('change'))
    const phase=document.querySelector<HTMLInputElement>('#phase')!;phase.value='2';phase.dispatchEvent(new Event('input'))
    expect(document.querySelector('#status')?.textContent).toContain('가능한 옆면 · 3/4')
    const pets=document.querySelector<HTMLSelectElement>('#petVariant')!;pets.value='dogbaby';pets.dispatchEvent(new Event('change'))
    expect(draw.mock.calls.some(call=>(call[0] as ImageStub).src.includes('copyPetWater-dogbaby.png'))).toBe(true)
    const calls=draw.mock.calls.length;callback(2000);expect(draw).toHaveBeenCalledTimes(calls)
    expect(setItem).not.toHaveBeenCalled()
  }finally{getContext.mockRestore();setItem.mockRestore();vi.unstubAllGlobals();document.body.innerHTML=''}
})

it('matches every generated motion PNG to its stored hash',()=>{
  const manifest=JSON.parse(fs.readFileSync('artifacts/scenery/copy-furniture-manifest.json','utf8'))
  expect(manifest.items).toHaveLength(40)
  for(const item of manifest.items){expect(item.variants).toHaveLength(item.category==='pet'?5:3);for(const variant of item.variants)expect(crypto.createHash('sha256').update(fs.readFileSync(variant.file)).digest('hex')).toBe(variant.sha256)}
  for(const [file,hash]of Object.entries(manifest.sourceHashes))expect(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),file).toBe(hash)
})
