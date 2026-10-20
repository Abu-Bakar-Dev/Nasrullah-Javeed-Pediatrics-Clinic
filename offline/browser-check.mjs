import { verifyTestAdmin } from './test-admin.mjs';
// Optional Windows browser smoke check. Uses the installed Chrome and a temporary database/profile.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const directory = mkdtempSync(join(tmpdir(), 'clinic-browser-'));
process.env.CLINIC_OFFLINE_DATA = join(directory, 'data');
const server = (await import('./server.mjs')).createClinicServer({ verifyAdmin: verifyTestAdmin });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, socket;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-sync', '--disable-extensions', '--remote-debugging-port=0', `--user-data-dir=${join(directory, 'browser')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  const portFile = join(directory, 'browser', 'DevToolsActivePort');
  for (let i = 0; !existsSync(portFile) && i < 100; i++) await sleep(100);
  assert(existsSync(portFile), 'Chrome debugging port did not become ready');
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0; const pending = new Map(), exceptions = [], externalRequests = [], requests = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const callback = pending.get(message.id); pending.delete(message.id); callback?.(message); }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
    if (message.method === 'Network.requestWillBeSent') {
      const url = message.params.request.url; requests.push(url);
      if (/^https?:/.test(url) && !url.startsWith(origin + '/')) externalRequests.push(url);
    }
  });
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 10000);
    pending.set(id, message => { clearTimeout(timer); message.error ? reject(new Error(message.error.message)) : resolve(message.result); });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const wait = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(100); } throw new Error(`UI did not become ready: ${expression}\n${await evaluate('document.body.innerText')}`); };
  const click = text => evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(${JSON.stringify(text)}))?.click()`);
  const fill = (selector, value) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('Input missing'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', {bubbles:true})); })()`);
  await command('Runtime.enable'); await command('Network.enable'); await command('Page.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: origin });
  await wait('!!document.querySelector("input[name=password]")');
  await fill('input[name=email]', 'abu.bakar041295@gmail.com'); await fill('input[name=password]', 'StrongPass123');
  await evaluate('document.querySelector("form").requestSubmit()');
  await wait('!!document.querySelector("#username")');
  await fill('#username', 'abu.bakar041295@gmail.com'); await fill('#password', 'StrongPass123');
  await evaluate('document.querySelector("form").requestSubmit()');
  await wait('document.body.innerText.includes("Offline · Local database")');
  await click('Patients Directory'); await wait('document.body.innerText.includes("Register New Patient")'); await click('Register New Patient');
  await wait('!!document.querySelector("#fullName")');
  await fill('#fullName', 'Offline Patient'); await fill('#phone', '03337645673'); await fill('#age', '5');
  await evaluate('document.querySelector("form").requestSubmit()');
  await wait('document.body.innerText.includes("Registration Complete")');
  const token = await evaluate('document.body.innerText.match(/P-[A-F0-9]{12}/)?.[0]'); assert(token, 'Generated patient token is visible');
  await command('Page.reload'); await wait('document.body.innerText.includes("Patients Directory")');
  await click('Patients Directory'); await wait('document.body.innerText.includes("Offline Patient")');
  assert((await evaluate('document.body.innerText')).includes(token));
  await click('Settings'); await wait('document.body.innerText.includes("Offline Settings & Backups")');
  await evaluate('document.fonts.ready');
  assert(await evaluate(`document.fonts.check('24px "Material Symbols Outlined"')`), 'Local icon font loaded');
  assert(requests.some(url => url.endsWith('/material-symbols.ttf')), 'Icons loaded from local server');
  assert.deepEqual(externalRequests, [], 'No cloud/font/image requests');
  assert.deepEqual(exceptions, [], 'No browser runtime exceptions');
  console.log('PASS: first-run setup, local login, registration, stable token after reload, settings, local icons, and zero external requests.');
} finally {
  socket?.close();
  if (browser && browser.exitCode === null) { browser.kill(); await new Promise(resolve => { browser.once('exit', resolve); setTimeout(resolve, 3000); }); }
  if (server.listening) await new Promise(resolve => server.close(resolve));
  // Both paths are generated below the OS temporary directory for this check.
  rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
