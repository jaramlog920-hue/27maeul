const { spawn } = require('node:child_process')
const fs = require('node:fs/promises')
const path = require('node:path')
;(async () => {
  const out = path.resolve('artifacts/youth-fixes-20261020/locations')
  const { build, preview } = await import('vite')
  const result = await build({ configLoader: 'native', build: { outDir: path.join(out, 'runtime-build'), rollupOptions: { input: { auditBridge: path.resolve('artifacts/youth-bridge.ts') } } } })
  const entry = (Array.isArray(result) ? result : [result]).flatMap(r => r.output ?? []).find(f => f.type === 'chunk' && f.name === 'auditBridge' && f.isEntry)
  if (!entry) throw new Error('Missing audit bridge entry')
  await fs.writeFile(path.join(out, 'runtime-build/audit-gallery.html'), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#eee;color:#222;font:16px sans-serif}main{display:flex;flex-wrap:wrap;gap:12px}section{border:1px solid #888;max-width:100%}h2{font-size:16px}canvas{image-rendering:pixelated;max-width:100%;height:auto!important}</style><script type="module" src="/'+entry.fileName+'"></script>');
  const server = await preview({ configFile: false, build: { outDir: path.join(out, 'runtime-build') }, preview: { host: '127.0.0.1', port: 4197, strictPort: true } })
  try {
    const response = await fetch('http://127.0.0.1:4197/', { signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error('Static server HTTP ' + response.status)
    const child = spawn(process.execPath, ['artifacts/youth-location-fixes-browser.cjs'], { env: { ...process.env, AUDIT_BOOT_PROBE: '0', AUDIT_STATIC_BRIDGE: '/' + entry.fileName }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
    let output = ''
    child.stdout.on('data', b => { output += b; process.stdout.write(b) })
    child.stderr.on('data', b => { output += b; process.stderr.write(b) })
    const timer = setTimeout(() => child.kill(), 90000)
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve) })
    clearTimeout(timer)
    await fs.writeFile(path.join(out, 'static-browser.log'), output)
    if (code !== 0) throw new Error('Static UI checker exited ' + code)
  } finally { server.httpServer.closeAllConnections(); await new Promise(resolve => server.httpServer.close(resolve)) }
})().catch(e => { console.error(e); process.exitCode = 1 })
