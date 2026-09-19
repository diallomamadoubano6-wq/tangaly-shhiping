import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TEMP_PROFILE = 'C:\\Users\\LENOVO\\AppData\\Local\\Temp\\edge_agent_audit_' + Date.now();
const SCREENSHOT_DIR = path.resolve('./responsive-audit-results/agent');

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function auditAgentForViewport(viewportName, width, height) {
  console.log(`\n========================================`);
  console.log(`RUNNING AGENT AUDIT: ${viewportName} (${width}x${height})`);
  console.log(`========================================`);

  const edgeProcess = spawn(EDGE_PATH, [
    '--remote-debugging-port=9227',
    '--headless=new',
    '--disable-gpu',
    `--window-size=${width},${height}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${TEMP_PROFILE}`,
    'about:blank'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9227/json/version');
      if (res.ok) break;
    } catch (e) {}
    await sleep(300);
  }

  const listRes = await fetch('http://127.0.0.1:9227/json/list');
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

  async function takeScreenshot(name) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      const filePath = path.join(SCREENSHOT_DIR, `${viewportName.toLowerCase()}_${name}.png`);
      writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`  📸 Screenshot saved: ${viewportName.toLowerCase()}_${name}.png`);
      return filePath;
    }
  }

  async function evaluate(fnStr) {
    const res = await send('Runtime.evaluate', {
      expression: `(${fnStr})()`,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  // 1. Log in as Agent (agent@tangaly.com / agent123)
  console.log('Logging in as Agent (agent@tangaly.com)...');
  await navigate('http://localhost:3000/login');
  await evaluate(`function() {
    const email = document.getElementById('email');
    const pwd = document.getElementById('password');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (email) {
      setter.call(email, 'agent@tangaly.com');
      email.dispatchEvent(new Event('input', { bubbles: true }));
      email.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (pwd) {
      setter.call(pwd, 'agent123');
      pwd.dispatchEvent(new Event('input', { bubbles: true }));
      pwd.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const form = document.querySelector('form');
    if (form) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.click();
    }
  }`);
  await sleep(4000);

  const checkLayout = `function() {
    const docWidth = document.documentElement.scrollWidth;
    const docHeight = document.documentElement.scrollHeight;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const isOverflowing = docWidth > winWidth;
    
    const sidebar = document.querySelector('aside');
    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
    
    const header = document.querySelector('header');
    const headerRect = header ? header.getBoundingClientRect() : null;
    
    const main = document.querySelector('main');
    const mainRect = main ? main.getBoundingClientRect() : null;

    return {
      viewport: { width: winWidth, height: winHeight },
      doc: { width: docWidth, height: docHeight },
      isOverflowing,
      overflowPx: isOverflowing ? docWidth - winWidth : 0,
      sidebar: sidebarRect ? { width: Math.round(sidebarRect.width), left: Math.round(sidebarRect.left), right: Math.round(sidebarRect.right) } : null,
      main: mainRect ? { width: Math.round(mainRect.width) } : null,
    };
  }`;

  const agentPages = [
    { id: 'agent_dashboard', title: 'Tableau de bord', url: 'http://localhost:3000/operations' },
    { id: 'agent_shipments', title: 'Expéditions', url: 'http://localhost:3000/operations/shipments' },
    { id: 'agent_new', title: 'Nouvelle expédition', url: 'http://localhost:3000/operations/new' },
    { id: 'agent_scanner', title: 'Scanner', url: 'http://localhost:3000/operations/scanner' },
  ];

  const report = {};

  for (const ap of agentPages) {
    console.log(`Testing Agent ${ap.title} (${ap.url})...`);
    await navigate(ap.url);
    const layout = await evaluate(checkLayout);
    await takeScreenshot(ap.id);
    report[ap.id] = { title: ap.title, ...layout };
    console.log(`  Layout check: docWidth=${layout?.doc?.width}, winWidth=${layout?.viewport?.width}, sidebarWidth=${layout?.sidebar?.width}, mainWidth=${layout?.main?.width}`);
    if (layout?.isOverflowing) {
      console.warn(`  ⚠️ HORIZONTAL OVERFLOW: ${layout.overflowPx}px overflow!`);
    } else {
      console.log(`  ✅ Clean layout check`);
    }
  }

  ws.close();
  edgeProcess.kill();
  await sleep(500);

  return report;
}

async function main() {
  const mobile = await auditAgentForViewport('Mobile', 390, 844);
  const tablet = await auditAgentForViewport('Tablet', 768, 1024);

  const fullReport = {
    timestamp: new Date().toISOString(),
    mobile,
    tablet
  };

  const reportFile = path.join(SCREENSHOT_DIR, 'agent-audit-summary.json');
  writeFileSync(reportFile, JSON.stringify(fullReport, null, 2));
  console.log(`\nAgent audit complete! Summary saved to: ${reportFile}`);
}

main().catch(console.error);
