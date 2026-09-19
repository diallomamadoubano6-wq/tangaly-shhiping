import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const TEMP_PROFILE = 'C:\\Users\\LENOVO\\AppData\\Local\\Temp\\edge_test_profile';
const SCREENSHOT_DIR = path.resolve('./responsive-audit-results');

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Launch headless Edge with CDP
console.log('Starting Edge with remote debugging...');
const edgeProcess = spawn(EDGE_PATH, [
  '--remote-debugging-port=9222',
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${TEMP_PROFILE}`,
  'about:blank'
], { stdio: 'ignore' });

// Wait for CDP to be available
let versionData = null;
for (let i = 0; i < 30; i++) {
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
  console.error('Failed to connect to Edge CDP');
  edgeProcess.kill();
  process.exit(1);
}

console.log('Connected to Edge:', versionData.Browser);

// Get existing target tab
const listRes = await fetch('http://127.0.0.1:9222/json/list');
const tabs = await listRes.json();
const targetTab = tabs.find(t => t.type === 'page') || tabs[0];
const wsUrl = targetTab.webSocketDebuggerUrl;

const ws = new WebSocket(wsUrl);

let msgId = 1;
const pending = new Map();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
  }
};

await new Promise((res) => ws.onopen = res);

function send(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await send('Page.enable');
await send('DOM.enable');
await send('Runtime.enable');

async function setViewport(width, height, isMobile = true) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: isMobile,
    screenOrientation: { angle: 0, type: 'portraitPrimary' }
  });
  await send('Emulation.setVisibleSize', { width, height });
}

async function navigate(url) {
  await send('Page.navigate', { url });
  await sleep(1200); // Turbopack compile wait
}

async function takeScreenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  writeFileSync(filePath, Buffer.from(data, 'base64'));
  console.log(`Saved screenshot: ${name}.png`);
  return filePath;
}

async function evalInPage(fnStr) {
  const res = await send('Runtime.evaluate', {
    expression: `(${fnStr})()`,
    returnByValue: true,
    awaitPromise: true
  });
  return res.result?.value;
}

// Function to check horizontal overflow and layout flaws
const overflowCheckScript = `function() {
  const docWidth = document.documentElement.scrollWidth;
  const winWidth = window.innerWidth;
  const isOverflowing = docWidth > winWidth;
  
  // Find offending elements
  const offenders = [];
  const allEls = document.querySelectorAll('*');
  for (const el of allEls) {
    const r = el.getBoundingClientRect();
    if (r.right > winWidth + 1 || r.left < -1) {
      offenders.push({
        tag: el.tagName,
        id: el.id,
        className: (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 3).join('.') : '',
        right: Math.round(r.right),
        left: Math.round(r.left),
        width: Math.round(r.width)
      });
    }
  }
  
  return {
    docWidth,
    winWidth,
    isOverflowing,
    offendersCount: offenders.length,
    offenders: offenders.slice(0, 10)
  };
}`;

const results = {
  mobile: {},
  tablet: {}
};

const pagesToTest = [
  { name: 'Home', url: 'http://localhost:3000/' },
  { name: 'Devis', url: 'http://localhost:3000/devis' },
  { name: 'Tracking', url: 'http://localhost:3000/tracking' },
  { name: 'Services', url: 'http://localhost:3000/services' },
  { name: 'Contact', url: 'http://localhost:3000/contact' },
  { name: 'Login', url: 'http://localhost:3000/login' },
];

console.log('--- STARTING MOBILE TESTS (390x844) ---');
await setViewport(390, 844, true);

for (const p of pagesToTest) {
  console.log(`Testing ${p.name} on Mobile...`);
  await navigate(p.url);
  const audit = await evalInPage(overflowCheckScript);
  await takeScreenshot(`mobile_${p.name.toLowerCase()}`);
  results.mobile[p.name] = audit;
}

// Test Mobile Hamburger on Home
console.log('Testing Mobile Hamburger menu...');
await navigate('http://localhost:3000/');
await evalInPage(`function() {
  const btn = document.querySelector('button[aria-controls="mobile-menu"]') || document.querySelector('header button');
  if (btn) btn.click();
}`);
await sleep(400);
await takeScreenshot('mobile_home_menu_open');
const menuAudit = await evalInPage(overflowCheckScript);
results.mobile['Home_Menu_Open'] = menuAudit;

// Test Login flow on Mobile to test /client/* pages
console.log('Testing Login & Client Dashboard on Mobile...');
await navigate('http://localhost:3000/login');
await evalInPage(`function() {
  const emailInput = document.getElementById('email');
  const pwdInput = document.getElementById('password');
  if (emailInput) emailInput.value = 'client@tangaly.com';
  if (pwdInput) pwdInput.value = 'client123';
  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
  pwdInput.dispatchEvent(new Event('input', { bubbles: true }));
}`);
await sleep(200);

// Submit login form
await evalInPage(`function() {
  const form = document.querySelector('form');
  if (form) {
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.click();
  }
}`);
await sleep(2000);

const clientPages = [
  { name: 'Client_Dashboard', url: 'http://localhost:3000/client/dashboard' },
  { name: 'Client_Shipments', url: 'http://localhost:3000/client/shipments' },
  { name: 'Client_Quotes', url: 'http://localhost:3000/client/quotes' },
  { name: 'Client_Invoices', url: 'http://localhost:3000/client/invoices' },
  { name: 'Client_Documents', url: 'http://localhost:3000/client/documents' },
  { name: 'Client_Notifications', url: 'http://localhost:3000/client/notifications' },
  { name: 'Client_Profile', url: 'http://localhost:3000/client/profile' },
];

for (const cp of clientPages) {
  console.log(`Testing ${cp.name} on Mobile...`);
  await navigate(cp.url);
  const audit = await evalInPage(overflowCheckScript);
  await takeScreenshot(`mobile_${cp.name.toLowerCase()}`);
  results.mobile[cp.name] = audit;
}

// Test Client Drawer Sidebar opening
console.log('Testing Client Sidebar drawer on Mobile...');
await navigate('http://localhost:3000/client/dashboard');
await evalInPage(`function() {
  const btn = document.querySelector('button[aria-label="Ouvrir le menu"]');
  if (btn) btn.click();
}`);
await sleep(400);
await takeScreenshot('mobile_client_sidebar_open');
const sidebarAudit = await evalInPage(overflowCheckScript);
results.mobile['Client_Sidebar_Open'] = sidebarAudit;

// Test Shipments item click to open details panel on Mobile
console.log('Testing Client Shipments detail panel on Mobile...');
await navigate('http://localhost:3000/client/shipments');
await evalInPage(`function() {
  const firstCard = document.querySelector('button[aria-label^="Expédition"]');
  if (firstCard) firstCard.click();
}`);
await sleep(400);
await takeScreenshot('mobile_client_shipments_detail_open');
const detailAudit = await evalInPage(overflowCheckScript);
results.mobile['Client_Shipments_Detail_Open'] = detailAudit;


console.log('--- STARTING TABLET TESTS (768x1024) ---');
await setViewport(768, 1024, true);

for (const p of pagesToTest) {
  console.log(`Testing ${p.name} on Tablet...`);
  await navigate(p.url);
  const audit = await evalInPage(overflowCheckScript);
  await takeScreenshot(`tablet_${p.name.toLowerCase()}`);
  results.tablet[p.name] = audit;
}

for (const cp of clientPages) {
  console.log(`Testing ${cp.name} on Tablet...`);
  await navigate(cp.url);
  const audit = await evalInPage(overflowCheckScript);
  await takeScreenshot(`tablet_${cp.name.toLowerCase()}`);
  results.tablet[cp.name] = audit;
}

// Test Shipments detail at 768px
await navigate('http://localhost:3000/client/shipments');
await evalInPage(`function() {
  const firstCard = document.querySelector('button[aria-label^="Expédition"]');
  if (firstCard) firstCard.click();
}`);
await sleep(400);
await takeScreenshot('tablet_client_shipments_detail_open');
const tabletDetailAudit = await evalInPage(overflowCheckScript);
results.tablet['Client_Shipments_Detail_Open'] = tabletDetailAudit;

// Output JSON report
const reportPath = path.join(SCREENSHOT_DIR, 'audit-report.json');
writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`Audit complete! Results saved to ${reportPath}`);

// Cleanup
edgeProcess.kill();
process.exit(0);
