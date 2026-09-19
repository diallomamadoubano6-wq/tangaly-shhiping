import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TEMP_PROFILE = 'C:\\Users\\LENOVO\\AppData\\Local\\Temp\\edge_admin_profile_' + Date.now();
const SCREENSHOT_DIR = path.resolve('./responsive-audit-results/admin');

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function auditAdminForViewport(viewportName, width, height) {
  console.log(`\n========================================`);
  console.log(`RUNNING ADMIN AUDIT: ${viewportName} (${width}x${height})`);
  console.log(`========================================`);

  const edgeProcess = spawn(EDGE_PATH, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--disable-gpu',
    `--window-size=${width},${height}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${TEMP_PROFILE}`,
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for CDP
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (e) {}
    await sleep(300);
  }

  if (!versionData) {
    console.error('Could not connect to Edge');
    edgeProcess.kill();
    return {};
  }

  const listRes = await fetch('http://127.0.0.1:9222/json/list');
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

  async function takeScreenshot(name) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      const filePath = path.join(SCREENSHOT_DIR, `${viewportName.toLowerCase()}_${name}.png`);
      writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`  📸 Screenshot saved: ${viewportName.toLowerCase()}_${name}.png`);
      return filePath;
    }
    return null;
  }

  async function evaluate(fnStr) {
    const res = await send('Runtime.evaluate', {
      expression: `(${fnStr})()`,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  // 1. Log in as Super Admin
  console.log('Logging in as Admin (admin@tangaly.com)...');
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
  await sleep(3000);

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

    const offenders = [];
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const r = el.getBoundingClientRect();
      if (r.right > winWidth + 1.5 || r.left < -1.5) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          className: (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 2).join('.') : undefined,
          right: Math.round(r.right),
          left: Math.round(r.left),
          width: Math.round(r.width)
        });
      }
    }

    return {
      viewport: { width: winWidth, height: winHeight },
      doc: { width: docWidth, height: docHeight },
      isOverflowing,
      overflowPx: isOverflowing ? docWidth - winWidth : 0,
      sidebar: sidebarRect ? { width: Math.round(sidebarRect.width), left: Math.round(sidebarRect.left), right: Math.round(sidebarRect.right) } : null,
      header: headerRect ? { width: Math.round(headerRect.width), height: Math.round(headerRect.height) } : null,
      main: mainRect ? { width: Math.round(mainRect.width) } : null,
      offenderCount: offenders.length,
      sampleOffenders: offenders.slice(0, 5)
    };
  }`;

  const adminPages = [
    { id: 'admin_dashboard', title: 'Vue d\'ensemble', url: 'http://localhost:3000/admin' },
    { id: 'admin_shipments', title: 'Expéditions', url: 'http://localhost:3000/admin/shipments' },
    { id: 'admin_users', title: 'Comptes & Accès', url: 'http://localhost:3000/admin/users' },
    { id: 'admin_quotes', title: 'Devis', url: 'http://localhost:3000/admin/quotes' },
    { id: 'admin_invoices', title: 'Factures', url: 'http://localhost:3000/admin/invoices' },
    { id: 'admin_scanner', title: 'Scanner QR', url: 'http://localhost:3000/admin/scanner' },
  ];

  const report = {};

    for (const ap of adminPages) {
    console.log(`Testing Admin ${ap.title} (${ap.url})...`);
    await navigate(ap.url);
    const layout = await evaluate(checkLayout);
    await takeScreenshot(ap.id);
    report[ap.id] = { title: ap.title, ...layout };
    console.log(`  Layout check: docWidth=${layout?.doc?.width}, winWidth=${layout?.viewport?.width}, sidebarWidth=${layout?.sidebar?.width}, mainWidth=${layout?.main?.width}`);
    if (layout?.isOverflowing) {
      console.warn(`  ⚠️ HORIZONTAL OVERFLOW: ${layout.overflowPx}px overflow! Offender count: ${layout.offenderCount}`);
    } else {
      console.log(`  ✅ Clean layout`);
    }

    if (ap.id === 'admin_dashboard') {
      console.log('  Testing sidebar drawer open...');
      await evaluate(`function() {
        const btn = document.getElementById('admin-menu-toggle');
        if (btn) btn.click();
      }`);
      await sleep(600);
      await takeScreenshot('admin_sidebar_open');
      await evaluate(`function() {
        const btn = document.getElementById('admin-sidebar-close');
        if (btn) btn.click();
      }`);
      await sleep(600);
    }
  }

  // Cleanup
  ws.close();
  edgeProcess.kill();
  await sleep(500);

  return report;
}

async function main() {
  const mobileReport = await auditAdminForViewport('Mobile', 390, 844);
  const tabletReport = await auditAdminForViewport('Tablet', 768, 1024);

  const fullReport = {
    timestamp: new Date().toISOString(),
    mobile: mobileReport,
    tablet: tabletReport
  };

  const reportFile = path.join(SCREENSHOT_DIR, 'admin-audit-summary.json');
  writeFileSync(reportFile, JSON.stringify(fullReport, null, 2));
  console.log(`\n========================================`);
  console.log(`ADMIN AUDIT COMPLETE! Results saved to: ${reportFile}`);
  console.log(`========================================`);
}

main().catch(console.error);
