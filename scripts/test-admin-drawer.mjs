import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TEMP_PROFILE = 'C:\\Users\\LENOVO\\AppData\\Local\\Temp\\edge_admin_drawer_' + Date.now();
const SCREENSHOT_DIR = path.resolve('./responsive-audit-results/admin');

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureDrawer(viewportName, width, height) {
  console.log(`Testing Admin Drawer on ${viewportName} (${width}x${height})...`);
  const edgeProcess = spawn(EDGE_PATH, [
    '--remote-debugging-port=9223',
    '--headless=new',
    '--disable-gpu',
    `--window-size=${width},${height}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${TEMP_PROFILE}`,
    'about:blank'
  ], { stdio: 'ignore' });

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (e) {}
    await sleep(300);
  }

  if (!versionData) {
    edgeProcess.kill();
    return;
  }

  const listRes = await fetch('http://127.0.0.1:9223/json/list');
  const tabs = await listRes.json();
  const targetTab = tabs.find((t) => t.type === 'page') || tabs[0];
  const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve } = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg.result || { error: msg.error });
      }
    } catch (err) {}
  };

  await new Promise((r) => (ws.onopen = r));

  function send(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve) => {
      pending.set(id, { resolve });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: width < 1024,
  });

  async function navigate(url) {
    await send('Page.navigate', { url });
    await sleep(2500);
  }

  async function evaluate(fnStr) {
    const res = await send('Runtime.evaluate', {
      expression: `(${fnStr})()`,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  async function takeScreenshot(name) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      const filePath = path.join(SCREENSHOT_DIR, `${viewportName.toLowerCase()}_${name}.png`);
      writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`  📸 Screenshot saved: ${viewportName.toLowerCase()}_${name}.png`);
      return filePath;
    }
  }

  // 1. Login
  console.log('  Navigating to /login...');
  await navigate('http://localhost:3000/login');
  await evaluate(`function() {
    const email = document.getElementById('email');
    const pwd = document.getElementById('password');
    if (email) email.value = 'admin@tangaly.com';
    if (pwd) pwd.value = 'admin123';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    pwd.dispatchEvent(new Event('input', { bubbles: true }));
    const form = document.querySelector('form');
    if (form) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.click();
    }
  }`);
  console.log('  Submitted login form, waiting 3.5s...');
  await sleep(3500);

  // 2. Go to /admin
  console.log('  Navigating to /admin...');
  await navigate('http://localhost:3000/admin');
  await sleep(3000);

  const state = await evaluate(`function() {
    const toggle = document.getElementById('admin-menu-toggle');
    const aside = document.querySelector('aside');
    return {
      url: window.location.href,
      hasToggle: !!toggle,
      toggleDisplay: toggle ? window.getComputedStyle(toggle).display : null,
      hasAside: !!aside,
      asideClass: aside ? aside.className : null
    };
  }`);
  console.log('  Page state before click:', JSON.stringify(state));

  // 3. Click hamburger menu button
  const clicked = await evaluate(`function() {
    const btn = document.getElementById('admin-menu-toggle');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }`);
  console.log(`  Hamburger button clicked: ${clicked}`);
  await sleep(1000);

  // 4. Capture screenshot of drawer open
  await takeScreenshot('admin_sidebar_open');

  ws.close();
  edgeProcess.kill();
  await sleep(500);
}

async function run() {
  await captureDrawer('Mobile', 390, 844);
  await captureDrawer('Tablet', 768, 1024);
  console.log('Admin drawer test complete!');
}

run().catch(console.error);
