// Keep the local server and isolated UI checker under one process lifetime.
const { spawn } = require('node:child_process')
const fs = require('node:fs/promises')
const path = require('node:path')
;(async () => {
  const out = path.resolve('artifacts/detail-audit/round-2-20261019/003-storage-put-browser')
  await fs.mkdir(out, { recursive: true })
  const { createServer } = await import('vite')
  const server = await createServer({ configLoader: 'native', server: { host: '127.0.0.1', port: 4197, strictPort: true } })
  try {
    await server.listen()
    const response = await fetch('http://127.0.0.1:4197/', { signal: AbortSignal.timeout(10000) })
    const html = await response.text()
    const proof = { httpStatus: response.status, htmlBytes: Buffer.byteLength(html), hasRoot: html.includes('id="root"') }
    await fs.writeFile(path.join(out, 'http-probe.json'), JSON.stringify(proof, null, 2))
    if (!response.ok || !proof.hasRoot) throw new Error('HTTP entry not ready')
    process.stdout.write('HTTP probe ' + JSON.stringify(proof) + '\n')
    const child = spawn(process.execPath, ['artifacts/detail-r2-storage-put-check.cjs'], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
    let output = ''
    child.stdout.on('data', b => { output += b; process.stdout.write(b) })
    child.stderr.on('data', b => { output += b; process.stderr.write(b) })
    const timer = setTimeout(() => child.kill(), 90000)
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve) })
    clearTimeout(timer)
    await fs.writeFile(path.join(out, 'browser.log'), output)
    if (code !== 0) throw new Error('UI checker exited ' + code)
  } finally { await server.close() }
})().catch(e => { console.error(e); process.exitCode = 1 })
