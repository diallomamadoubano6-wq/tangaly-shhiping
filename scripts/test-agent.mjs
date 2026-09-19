import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TEMP_PROFILE = 'C:\\Users\\LENOVO\\AppData\\Local\\Temp\\edge_agent_profile_' + Date.now();
const LOCAL_SCREENSHOT_DIR = path.resolve('./responsive-audit-results/agent');
const ARTIFACT_SCREENSHOT_DIR = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\147b1563-7c85-476a-b3a4-0a5d2f9363bd\\screenshots';

if (!existsSync(LOCAL_SCREENSHOT_DIR)) {
  mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
}
if (!existsSync(ARTIFACT_SCREENSHOT_DIR)) {
  mkdirSync(ARTIFACT_SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const AGENT_PAGES = [
  { name: 'dashboard', path: '/operations' },
  { name: 'new_shipment', path: '/operations/new' },
  { name: 'shipments', path: '/operations/shipments' },
  { name: 'tracking', path: '/operations/tracking' },
  { name: 'expenses', path: '/operations/expenses' },
  { name: 'invoices', path: '/operations/invoices' },
  { name: 'transfers', path: '/operations/transfers' },
  { name: 'clients', path: '/operations/clients' },
  { name: 'calculator', path: '/operations/calculator' },
  { name: 'returns', path: '/operations/returns' },
  { name: 'scanner', path: '/operations/scanner' },
  { name: 'settings', path: '/operations/settings' }
];

async function auditAgentForViewport(viewportName, width, height) {
  console.log(`\n========================================`);
  console.log(`RUNNING AGENT AUDIT: ${viewportName} (${width}x${height})`);
  console.log(`========================================`);

  const tempProfile = 'C:\\Users\\LENOVO\\AppData\\Local\\Temp\\edge_agent_' + viewportName + '_' + Date.now();

  const edgeProcess = spawn(EDGE_PATH, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--disable-gpu',
    `--window-size=${width},${height}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfile}`,
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for CDP
  let versionData = null;
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (e) {}
    await sleep(400);
  }

  if (!versionData) {
    console.error('Could not connect to Edge');
    edgeProcess.kill();
    return {};
  }

  await sleep(600);
  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const tabs = await listRes.json();
  const targetTab = tabs.find((t) => t.type === 'page' && t.webSocketDebuggerUrl) || tabs[0];
  if (!targetTab || !targetTab.webSocketDebuggerUrl) {
    console.error('No valid page tab found');
    edgeProcess.kill();
    return {};
  }
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
  await sleep(400);

  function send(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve) => {
      pending.set(id, { resolve });
      ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          resolve({ timeout: true });
        }
      }, 5000);
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
    await sleep(2000);
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression: `(${expression})()`,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async function captureScreenshot(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      const localFilePath = path.join(LOCAL_SCREENSHOT_DIR, filename);
      writeFileSync(localFilePath, Buffer.from(res.data, 'base64'));
      const artifactFilePath = path.join(ARTIFACT_SCREENSHOT_DIR, filename);
      writeFileSync(artifactFilePath, Buffer.from(res.data, 'base64'));
      console.log(`  [Screenshot saved: ${filename}]`);
    }
  }

  // 1. Log in as agent
  console.log('Logging in as agent...');
  await navigate('http://localhost:3000/login');
  await sleep(2000);

  const loginRes = await evaluate(`function() {
    const email = document.getElementById('email');
    const pwd = document.getElementById('password');
    if (email) {
      email.value = 'agent@tangaly.com';
      email.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (pwd) {
      pwd.value = 'agent123';
      pwd.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const form = document.querySelector('form');
    if (form) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.click();
        return true;
      }
    }
    return false;
  }`);
  console.log('  Login form submitted:', loginRes);
  await sleep(3500);

  // 2. Audit all agent pages
  const results = {};

  for (const page of AGENT_PAGES) {
    console.log(`Auditing: ${page.name} (${page.path})...`);
    await navigate(`http://localhost:3000${page.path}`);
    await sleep(1500);

    const metrics = await evaluate(`function() {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const bodyW = document.body ? document.body.scrollWidth : 0;
      const maxScroll = Math.max(docW, bodyW);
      const overflow = Math.max(0, maxScroll - winW);
      
      const sidebarEl = document.querySelector('aside');
      const sidebarW = sidebarEl ? sidebarEl.getBoundingClientRect().width : 0;
      const sidebarVisible = sidebarEl ? window.getComputedStyle(sidebarEl).display !== 'none' : false;
      const sidebarTransform = sidebarEl ? window.getComputedStyle(sidebarEl).transform : 'none';

      const mainEl = document.querySelector('main');
      const mainW = mainEl ? mainEl.getBoundingClientRect().width : 0;

      return {
        windowWidth: winW,
        scrollWidth: maxScroll,
        horizontalOverflow: overflow,
        sidebarWidth: sidebarW,
        sidebarVisible: sidebarVisible,
        sidebarTransform: sidebarTransform,
        mainWidth: mainW,
        pass: overflow === 0
      };
    }`);

    results[page.name] = metrics;
    console.log(`  Result: ${metrics?.pass ? 'PASS (0px overflow)' : 'FAIL (' + metrics?.horizontalOverflow + 'px overflow)'}, mainWidth: ${metrics?.mainWidth}px`);

    const filename = `${viewportName}_agent_${page.name}.png`;
    await captureScreenshot(filename);
  }

  // 3. Test Drawer toggle on mobile/tablet
  if (width < 1024) {
    console.log(`Testing navigation drawer toggle on ${viewportName}...`);
    await navigate('http://localhost:3000/operations');
    await sleep(1000);

    // Open drawer
    const opened = await evaluate(`function() {
      const btn = document.getElementById('operations-menu-toggle');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }`);

    await sleep(500);
    if (opened) {
      console.log('  Drawer opened successfully!');
      await captureScreenshot(`${viewportName}_agent_sidebar_open.png`);

      // Close drawer via close button or backdrop overlay
      await evaluate(`function() {
        const closeBtn = document.getElementById('operations-sidebar-close');
        if (closeBtn) {
          closeBtn.click();
          return true;
        }
        return false;
      }`);
      await sleep(400);
    }
  }

  ws.close();
  edgeProcess.kill();
  return results;
}

async function main() {
  console.log('Starting automated audit of Espace Agent / Opérations...');

  const mobileResults = await auditAgentForViewport('mobile', 390, 844);
  await sleep(2000);
  const tabletResults = await auditAgentForViewport('tablet', 768, 1024);

  const summary = {
    timestamp: new Date().toISOString(),
    mobile: mobileResults,
    tablet: tabletResults
  };

  const summaryPath = path.join(LOCAL_SCREENSHOT_DIR, 'agent-audit-summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('\n========================================');
  console.log('AGENT AUDIT COMPLETE!');
  console.log(`Summary saved to: ${summaryPath}`);
  console.log('========================================\n');
}

main().catch(console.error);
