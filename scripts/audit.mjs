import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TEMP_PROFILE = 'C:\\Users\\LENOVO\\AppData\\Local\\Temp\\edge_test_profile_' + Date.now();
const SCREENSHOT_DIR = path.resolve('./responsive-audit-results');

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runAuditForViewport(viewportName, width, height) {
  console.log(`\n========================================`);
  console.log(`RUNNING AUDIT FOR: ${viewportName} (${width}x${height})`);
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
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) {
          console.warn(`CDP Error (${msg.id}):`, msg.error.message);
          resolve({ error: msg.error });
        } else {
          resolve(msg.result);
        }
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
    await sleep(1500);
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

  const checkLayout = `function() {
    const docWidth = document.documentElement.scrollWidth;
    const docHeight = document.documentElement.scrollHeight;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const isOverflowing = docWidth > winWidth;
    
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
      offenderCount: offenders.length,
      sampleOffenders: offenders.slice(0, 5)
    };
  }`;

  const pages = [
    { id: 'home', title: 'Accueil', url: 'http://localhost:3000/' },
    { id: 'services', title: 'Services', url: 'http://localhost:3000/services' },
    { id: 'tracking', title: 'Suivi Colis', url: 'http://localhost:3000/tracking' },
    { id: 'devis', title: 'Devis Gratuit', url: 'http://localhost:3000/devis' },
    { id: 'contact', title: 'Contact', url: 'http://localhost:3000/contact' },
    { id: 'login', title: 'Connexion', url: 'http://localhost:3000/login' },
  ];

  const report = {};

  for (const p of pages) {
    console.log(`Testing ${p.title} (${p.url})...`);
    await navigate(p.url);
    const layout = await evaluate(checkLayout);
    await takeScreenshot(p.id);
    report[p.id] = { title: p.title, ...layout };
    if (layout?.isOverflowing) {
      console.warn(`  ⚠️ HORIZONTAL OVERFLOW DETECTED: ${layout.overflowPx}px overflow! Offender count: ${layout.offenderCount}`);
    } else {
      console.log(`  ✅ Clean layout (no overflow, docWidth: ${layout?.doc?.width}px, winWidth: ${layout?.viewport?.width}px)`);
    }
  }

  // Test Header Menu / Hamburger
  console.log(`Testing Header Hamburger on ${viewportName}...`);
  await navigate('http://localhost:3000/');
  const hamburgerStateBefore = await evaluate(`function() {
    const burger = document.querySelector('header button');
    const menu = document.getElementById('mobile-menu');
    return { burgerExists: !!burger, burgerVisible: burger ? window.getComputedStyle(burger).display !== 'none' : false, menuOpen: !!menu };
  }`);
  console.log(`  Hamburger status before click:`, hamburgerStateBefore);

  if (hamburgerStateBefore?.burgerVisible) {
    await evaluate(`function() {
      const burger = document.querySelector('header button');
      if (burger) burger.click();
    }`);
    await sleep(400);
    const hamburgerStateAfter = await evaluate(`function() {
      const menu = document.getElementById('mobile-menu');
      return { menuOpen: !!menu, menuHeight: menu ? menu.offsetHeight : 0 };
    }`);
    console.log(`  Mobile menu opened:`, hamburgerStateAfter);
    await takeScreenshot('header_menu_open');
    report['header_mobile_menu'] = { ...hamburgerStateAfter };
  }

  // Test Client space (login first)
  console.log(`Testing Client Space Login...`);
  await navigate('http://localhost:3000/login');
  await evaluate(`function() {
    const email = document.getElementById('email');
    const pwd = document.getElementById('password');
    if (email) email.value = 'client@tangaly.com';
    if (pwd) pwd.value = 'client123';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    pwd.dispatchEvent(new Event('input', { bubbles: true }));
    const form = document.querySelector('form');
    if (form) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.click();
    }
  }`);
  await sleep(2500);

  const clientPages = [
    { id: 'client_dashboard', title: 'Tableau de bord', url: 'http://localhost:3000/client/dashboard' },
    { id: 'client_shipments', title: 'Expéditions', url: 'http://localhost:3000/client/shipments' },
    { id: 'client_quotes', title: 'Devis Client', url: 'http://localhost:3000/client/quotes' },
    { id: 'client_invoices', title: 'Factures Client', url: 'http://localhost:3000/client/invoices' },
    { id: 'client_documents', title: 'Documents Client', url: 'http://localhost:3000/client/documents' },
    { id: 'client_notifications', title: 'Notifications', url: 'http://localhost:3000/client/notifications' },
    { id: 'client_profile', title: 'Profil Client', url: 'http://localhost:3000/client/profile' },
  ];

  for (const cp of clientPages) {
    console.log(`Testing ${cp.title} (${cp.url})...`);
    await navigate(cp.url);
    const layout = await evaluate(checkLayout);
    await takeScreenshot(cp.id);
    report[cp.id] = { title: cp.title, ...layout };
    if (layout?.isOverflowing) {
      console.warn(`  ⚠️ HORIZONTAL OVERFLOW DETECTED: ${layout.overflowPx}px overflow! Offender count: ${layout.offenderCount}`);
    } else {
      console.log(`  ✅ Clean layout (no overflow, docWidth: ${layout?.doc?.width}px, winWidth: ${layout?.viewport?.width}px)`);
    }
  }

  // Test Client Sidebar Drawer (if mobile/tablet drawer header is visible)
  console.log(`Testing Client Sidebar Drawer...`);
  await navigate('http://localhost:3000/client/dashboard');
  const clientHeaderState = await evaluate(`function() {
    const btn = document.querySelector('button[aria-label="Ouvrir le menu"]');
    return { drawerBtnVisible: btn ? window.getComputedStyle(btn).display !== 'none' : false };
  }`);

  if (clientHeaderState?.drawerBtnVisible) {
    await evaluate(`function() {
      const btn = document.querySelector('button[aria-label="Ouvrir le menu"]');
      if (btn) btn.click();
    }`);
    await sleep(400);
    const sidebarState = await evaluate(`function() {
      const sidebar = document.querySelector('aside');
      const rect = sidebar ? sidebar.getBoundingClientRect() : null;
      return { sidebarVisible: rect ? rect.left >= 0 : false, width: rect?.width };
    }`);
    console.log(`  Client Sidebar opened:`, sidebarState);
    await takeScreenshot('client_sidebar_open');
    report['client_sidebar_drawer'] = sidebarState;
  }

  // Test Shipment detail panel toggle
  console.log(`Testing Shipment detail toggle...`);
  await navigate('http://localhost:3000/client/shipments');
  await evaluate(`function() {
    const card = document.querySelector('button[aria-label^="Expédition"]');
    if (card) card.click();
  }`);
  await sleep(400);
  const detailLayout = await evaluate(checkLayout);
  await takeScreenshot('client_shipments_detail_open');
  report['client_shipments_detail'] = detailLayout;

  // Cleanup
  ws.close();
  edgeProcess.kill();
  await sleep(500);

  return report;
}

async function main() {
  const mobileReport = await runAuditForViewport('Mobile', 390, 844);
  const tabletReport = await runAuditForViewport('Tablet', 768, 1024);

  const fullReport = {
    timestamp: new Date().toISOString(),
    mobile: mobileReport,
    tablet: tabletReport
  };

  const reportFile = path.join(SCREENSHOT_DIR, 'audit-summary.json');
  writeFileSync(reportFile, JSON.stringify(fullReport, null, 2));
  console.log(`\n========================================`);
  console.log(`AUDIT COMPLETE! Results written to: ${reportFile}`);
  console.log(`========================================`);
}

main().catch(console.error);
