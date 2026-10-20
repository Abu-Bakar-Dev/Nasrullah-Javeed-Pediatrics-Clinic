import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function launchBrowser({ directory, origin, mobile = false }) {
  const browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-sync', '--disable-extensions', '--no-proxy-server', '--remote-debugging-port=0', `--user-data-dir=${directory}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket;
  const close = async () => {
    socket?.close();
    if (browser.exitCode === null) { browser.kill(); await new Promise(resolve => { browser.once('exit', resolve); setTimeout(resolve, 3000); }); }
  };
  try {
    const portFile = join(directory, 'DevToolsActivePort');
    for (let i = 0; !existsSync(portFile) && i < 100; i++) await sleep(100);
    assert(existsSync(portFile), 'Chrome debugging port did not become ready');
    const port = readFileSync(portFile, 'utf8').split('\n')[0];
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let sequence = 0; const pending = new Map(), exceptions = [], externalRequests = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) { const callback = pending.get(message.id); pending.delete(message.id); callback?.(message); }
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
      if (message.method === 'Network.requestWillBeSent') {
        const url = message.params.request.url;
        if (/^https?:/.test(url) && !url.startsWith(origin + '/')) externalRequests.push(url);
      }
    });
    const command = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
      pending.set(id, message => { clearTimeout(timer); message.error ? reject(new Error(message.error.message)) : resolve(message.result); });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const wait = async expression => { for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await sleep(100); } throw new Error(`UI did not become ready: ${expression}\nExceptions: ${JSON.stringify(exceptions.map(e => e.exception?.description || e.text))}`); };
    const click = text => evaluate(`(() => { const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.getClientRects().length && !b.disabled); const label = b => { const copy = b.cloneNode(true); copy.querySelectorAll('.material-symbols-outlined').forEach(s => s.remove()); return copy.textContent.trim(); }; const b = buttons.find(b => label(b) === ${JSON.stringify(text)}) || buttons.find(b => b.textContent.includes(${JSON.stringify(text)})); if (!b) throw new Error('Button missing: ' + ${JSON.stringify(text)}); b.click(); })()`);
    const fill = (selector, value) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('Input missing'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', {bubbles:true})); })()`);
    await command('Runtime.enable'); await command('Network.enable'); await command('Page.enable');
    await command('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1440, height: mobile ? 844 : 1000, deviceScaleFactor: 1, mobile });
    if (mobile) await command('Emulation.setTouchEmulationEnabled', { enabled: true });
    await command('Page.navigate', { url: origin });
    return { command, evaluate, wait, click, fill, close, exceptions, externalRequests };
  } catch (error) { await close(); throw error; }
}
