import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { build, preview } from 'vite';

const sentinel = 'LEARNER_DRAFT_MUST_STAY_LOCAL';
const validResponse = {
  german: 'Patientin berichtet über Atemnot beim Gehen.',
  english: 'The main verb should be in the nominative case.'
};
let dist;
let server;
let browser;
let url;

before(async () => {
  const chromiumPath = process.env.PFLEGE_CHROMIUM;
  Object.assign(process.env, {
    VITE_FIREBASE_API_KEY: 'fixture-key',
    VITE_FIREBASE_PROJECT_ID: 'fixture-project',
    VITE_FIREBASE_APP_ID: '1:123:web:abcd',
    VITE_RECAPTCHA_SITE_KEY: 'fixture-site-key'
  });
  dist = await mkdtemp(join(tmpdir(), 'pflege-browser-'));
  await build({ build: { outDir: dist, emptyOutDir: true }, logLevel: 'silent' });
  server = await preview({ build: { outDir: dist }, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
  url = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({
    executablePath: chromiumPath,
    args: chromiumPath ? ['--no-sandbox', '--disable-dev-shm-usage'] : []
  });
});

after(async () => {
  await browser?.close();
  await server?.close();
  if (dist) await rm(dist, { recursive: true, force: true });
});

async function fixture(t, settings = {}) {
  const context = await browser.newContext(settings);
  t.after(() => context.close());
  const external = [];
  const cloud = [];
  let respond = validResponse;
  let allowAttestation = true;
  await context.route('**/*', async route => {
    const request = route.request();
    const target = new URL(request.url());
    if (target.origin === url) return route.continue();
    external.push({ url: target.href, body: request.postData() });
    const headers = {
      'access-control-allow-origin': url,
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': request.headers()['access-control-request-headers'] ?? '*'
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (target.pathname === '/recaptcha/enterprise.js' && target.hostname === 'www.google.com') {
      return route.fulfill({ contentType: 'application/javascript', body: `
        let widget;
        window.grecaptcha = { enterprise: {
          ready(callback) { callback(); },
          render(container, options) { widget = options; return 1; },
          execute() { widget.callback(); return Promise.resolve('fixture-recaptcha-token'); }
        } };
      ` });
    }
    if (target.hostname === 'content-firebaseappcheck.googleapis.com') {
      if (!allowAttestation) return route.fulfill({ status: 403, headers, json: {} });
      return route.fulfill({ headers, json: { token: 'fixture-app-check-token', ttl: '3600s' } });
    }
    if (target.hostname === 'firebasevertexai.googleapis.com') {
      cloud.push({ body: request.postData(), headers: request.headers() });
      if (respond === 429) return route.fulfill({ status: 429, headers, json: { error: { message: 'Quota exceeded' } } });
      return route.fulfill({
        headers,
        contentType: 'text/event-stream',
        body: `data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(respond) }] } }] })}\n\n`
      });
    }
    return route.abort();
  });
  const page = await context.newPage();
  const uncaught = [];
  page.on('pageerror', error => uncaught.push(error.message));
  t.after(() => assert.deepEqual(uncaught, []));
  return {
    page, external, cloud,
    setResponse: value => { respond = value; },
    denyAttestation: () => { allowAttestation = false; }
  };
}

async function waitForText(page, id, pattern) {
  await page.waitForFunction(([selector, source]) => new RegExp(source).test(document.querySelector(selector)?.textContent),
    [id, pattern.source], { timeout: 8_000 });
}

async function openCoach(page) {
  await page.getByText('Optional cloud coaching · public case only', { exact: true }).click();
}

test('Chromium desktop: ready before practice, 3 steps, independent checks, revision and legacy study', async t => {
  const { page, external } = await fixture(t, { viewport: { width: 1440, height: 900 } });
  await page.goto(url);
  await waitForText(page, '#deviceStatus', /unsupported|unavailable/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 1440);
  await page.getByRole('button', { name: 'Try the handover demo' }).click();
  await waitForText(page, '#factResult', /Remove the measurement/);
  await waitForText(page, '#grammarResult', /Use singular/);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'labResultTitle');
  const seededDraft = await page.locator('#labDraft').inputValue();
  await page.locator('#labDraft').fill(seededDraft.replace('berichten', 'berichtet'));
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  await waitForText(page, '#grammarResult', /Curated match/);
  await waitForText(page, '#factResult', /Remove the measurement/);
  await page.getByText('Reference and revision tip', { exact: true }).click();
  await page.getByRole('button', { name: 'Use reference as draft' }).click();
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  await waitForText(page, '#attemptStatus', /Attempt 3 .*Case facts: now matches/);
  await page.getByRole('button', { name: 'Next step' }).click();
  await page.getByRole('button', { name: 'Check a practice mistake' }).click();
  await waitForText(page, '#factResult', /your observation/);
  await page.getByRole('button', { name: '1. Patient voice' }).click();
  await page.getByRole('button', { name: 'Check a practice mistake' }).click();
  await waitForText(page, '#factResult', /walking trigger/);
  await page.locator('#labDraft').fill('Beim Spazieren gerate ich außer Atem.');
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  await waitForText(page, '#factResult', /Needs review/);
  await page.getByRole('button', { name: 'Load demo', exact: true }).click();
  await page.getByRole('button', { name: 'Check my German' }).click();
  await waitForText(page, '#reviewCount', /1 saved scenario/);
  await page.getByText('Follow-up practice', { exact: true }).click();
  await page.locator('#followAnswer').fill('Haben Sie andere Symptomen?');
  await page.getByRole('button', { name: 'Check follow-up', exact: true }).click();
  await waitForText(page, '#followChecks', /Symptome/);
  await page.getByText('Reference answer and vocabulary', { exact: true }).click();
  await page.getByRole('button', { name: 'Mark as reviewed' }).click();
  await page.reload();
  await waitForText(page, '#progress', /1 of 12/);
  await page.getByRole('button', { name: 'Open next saved case' }).click();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'case');
  assert.deepEqual(external, []);
});

test('Chromium request capture: no external traffic before consent; cloud sends only public data', async t => {
  const { page, external, cloud, setResponse } = await fixture(t);
  await page.goto(url);
  await waitForText(page, '#deviceStatus', /unsupported|unavailable/);
  await page.locator('#labDraft').fill(sentinel);
  await page.getByRole('button', { name: 'Check draft', exact: true }).click();
  await openCoach(page);
  assert.equal(await page.locator('#coachRun').isDisabled(), true);
  await page.locator('#coachForm').evaluate(form => form.dispatchEvent(new SubmitEvent('submit', { cancelable: true })));
  assert.deepEqual(external, []);
  await page.locator('#coachConsent').check();
  await page.locator('#coachTopic').selectOption('concise');
  assert.equal(await page.locator('#coachConsent').isChecked(), false);
  assert.equal(await page.locator('#coachRun').isDisabled(), true);
  assert.deepEqual(external, []);
  await page.locator('#coachConsent').check();
  await page.locator('#coachRun').click();
  await waitForText(page, '#coachStatus', /Cloud AI/);
  assert.match(await page.locator('#coachOutput').innerText(), /Document the source/);
  assert.doesNotMatch(await page.locator('#coachOutput').innerText(), /nominative case/);
  assert.equal(await page.locator('#coachConsent').isChecked(), false);
  assert.equal(cloud.length, 1);
  assert.match(cloud[0].body, /breathlessness while walking/);
  assert.match(cloud[0].body, /concise nursing note/);
  assert.equal(cloud[0].headers['x-firebase-appcheck'], 'fixture-app-check-token');
  assert.ok(external.every(item => !JSON.stringify(item).includes(sentinel)));
  assert.equal(await page.locator('#labDraft').inputValue(), sentinel);
  await page.locator('#coachForm').evaluate(form => form.dispatchEvent(new SubmitEvent('submit', { cancelable: true })));
  assert.equal(cloud.length, 1);

  setResponse({ german: 'Die Sauerstoffsättigung beträgt 80 %.', english: 'Invented measurement' });
  await page.locator('#coachConsent').check();
  await page.locator('#coachRun').click();
  await waitForText(page, '#coachStatus', /could not be matched/);
  assert.equal(await page.locator('#coachOutput').isVisible(), false);
  setResponse(429);
  await page.locator('#coachConsent').check();
  await page.locator('#coachRun').click();
  await waitForText(page, '#coachStatus', /quota/);
  assert.equal(cloud.length, 3);
  assert.equal(await page.locator('#coachConsent').isEnabled(), true);
  assert.ok(external.every(item => !JSON.stringify(item).includes(sentinel)));
});

test('Chromium denied attestation does not reach cloud inference', async t => {
  const { page, cloud, external, denyAttestation } = await fixture(t);
  denyAttestation();
  await page.goto(url);
  await openCoach(page);
  await page.locator('#coachConsent').check();
  await page.locator('#coachRun').click();
  await waitForText(page, '#coachStatus', /could not be authorized/);
  assert.ok(external.some(item => item.url.includes('firebaseappcheck.googleapis.com')));
  assert.deepEqual(cloud, []);
});

test('Chromium on-device path: Firebase adapter, unavailable change and CSP network block', async t => {
  const { page, external } = await fixture(t);
  await page.addInitScript(response => {
    if (window === window.top) return;
    window.modelState = 'available';
    window.LanguageModel = {
      async availability() { return window.modelState; },
      async create() {
        return {
          promptStreaming(messages) {
            window.modelInput = JSON.stringify(messages);
            return new ReadableStream({
              start(controller) { controller.enqueue(JSON.stringify(response)); controller.close(); }
            });
          }
        };
      }
    };
  }, validResponse);
  await page.goto(url);
  await waitForText(page, '#deviceStatus', /model ready/);
  const frame = page.frames().find(item => item.url().endsWith('/device.html'));
  assert.ok(frame);
  await page.getByRole('button', { name: '3. Nursing record' }).click();
  await page.locator('#labDraft').fill(sentinel);
  await page.locator('#labDevice').click();
  await waitForText(page, '#labDeviceStatus', /On-device AI/);
  assert.match(await page.locator('#labDeviceOutput').innerText(), /Document the source/);
  assert.doesNotMatch(await page.locator('#labDeviceOutput').innerText(), /nominative case/);
  assert.match(await frame.evaluate(() => window.modelInput), new RegExp(sentinel));
  assert.deepEqual(external, []);

  await frame.evaluate(() => { window.modelState = 'unavailable'; });
  await page.locator('#labDevice').click();
  await waitForText(page, '#labDeviceStatus', /compatible on-device model is not ready/);
  assert.deepEqual(external, []);

  const directive = await frame.evaluate(async () => {
    const violation = new Promise(resolve => window.addEventListener('securitypolicyviolation', event => {
      resolve(event.effectiveDirective);
    }, { once: true }));
    try {
      await fetch('https://firebasevertexai.googleapis.com/csp-regression-probe', { method: 'POST', body: 'fictional-test' });
      return 'fetch escaped';
    } catch {
      return violation;
    }
  });
  assert.equal(directive, 'connect-src');
  assert.deepEqual(external, []);
});

test('Chromium responsive keyboard and automated accessibility at 320, 390 and 1440 pixels', async t => {
  const { page, external } = await fixture(t, { isMobile: true, hasTouch: true });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto(url);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Skip to the lab');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'integrity');
    await page.getByRole('button', { name: 'Try the handover demo' }).click();
    await openCoach(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.evaluate(axe.source);
    const violations = await page.evaluate(async () => (await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
    })).violations.map(({ id, nodes }) => ({ id, selectors: nodes.map(node => node.target) })));
    assert.deepEqual(violations, []);
  }
  assert.deepEqual(external, []);
});
