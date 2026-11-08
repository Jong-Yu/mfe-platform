import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// Run against the already-running proof server: node tests/verify.mjs
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 4173}`;
const outputDirectory = fileURLToPath(new URL('../artifacts/verification/', import.meta.url));
const registryResponse = await fetch(`${baseURL}/registry.json`);
assert.equal(registryResponse.status, 200);
const selectedRegistry = await registryResponse.json();
const artifactPrefixes = [...new Set(Object.values(selectedRegistry.artifacts).filter((a) => a.service !== 'platform').map((a) => `${a.service}_${a.version.replaceAll('.', '_')}`))];
const selectedB = (role) => selectedRegistry.artifacts[selectedRegistry.runtimeBindings[selectedRegistry.applications[role].id].b];
const expectedVersions = Object.fromEntries(['A', 'C', 'A-copy'].map((id) => [id, selectedB(id === 'C' ? 'C' : 'A').version]));
const expectedDependencies = Object.fromEntries(['A', 'C', 'A-copy'].map((id) => {
  const b = selectedB(id === 'C' ? 'C' : 'A');
  return [id, selectedRegistry.artifacts[selectedRegistry.runtimeBindings[b.id].d].version];
}));
const report = { baseURL, startedAt: new Date().toISOString(), checks: [], scenarios: [], status: 'running' };

await mkdir(outputDirectory, { recursive: true });

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    const bundled = '/Users/jong-yu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js';
    return import(pathToFileURL(bundled).href);
  }
}

const { chromium } = await loadPlaywright();
const explicitExecutable = process.env.CHROME_EXECUTABLE_PATH;
const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const launchOptions = { headless: true };
if (explicitExecutable) launchOptions.executablePath = explicitExecutable;
else if (existsSync(localChrome)) launchOptions.executablePath = localChrome;

let browser;
let currentPage;

async function check(name, action) {
  const started = Date.now();
  try {
    const result = await action();
    report.checks.push({ name, status: 'passed', durationMs: Date.now() - started });
    console.log(`PASS ${name}`);
    return result;
  } catch (error) {
    report.checks.push({ name, status: 'failed', durationMs: Date.now() - started, error: error.message });
    throw error;
  }
}

function widget(page, instanceId) {
  return page.getByTestId(`widget-${instanceId}`);
}

async function waitForWidgets(page, ids) {
  for (const id of ids) await widget(page, id).getByTestId('version').waitFor({ state: 'visible' });
}

async function readText(locator) {
  return (await locator.innerText()).trim();
}

async function readCount(page, instanceId) {
  const text = await readText(widget(page, instanceId).getByTestId('count'));
  assert.match(text, /^\d+$/, `Count for ${instanceId} must be a numeric text value, got ${JSON.stringify(text)}`);
  return Number(text);
}

async function snapshot(page) {
  return page.evaluate(() => window.__MFE_PROOF__.getSnapshot());
}

function activeIds(state) {
  return state.activeInstances.map((item) => typeof item === 'string' ? item : (item.instanceId ?? item.id)).sort();
}

function subscriptionCount(state) {
  const value = state.activeSubscriptions;
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) return value.length;
  assert.fail('getSnapshot().activeSubscriptions must be a number or array');
}

function eventCount(state, instanceId) {
  const entry = state.eventCounts?.[instanceId];
  if (typeof entry === 'number') return entry;
  const active = state.activeInstances.find((item) => typeof item === 'object' && (item.instanceId ?? item.id) === instanceId);
  if (typeof active?.eventCount === 'number') return active.eventCount;
  return undefined;
}

async function assertActive(page, ids) {
  await page.waitForFunction((expected) => {
    const snapshot = window.__MFE_PROOF__.getSnapshot();
    const actual = snapshot.activeInstances.map((item) => typeof item === 'string' ? item : (item.instanceId ?? item.id)).sort();
    return JSON.stringify(actual) === JSON.stringify([...expected].sort());
  }, ids);
  const state = await snapshot(page);
  assert.deepEqual(activeIds(state), [...ids].sort());
  assert.equal(subscriptionCount(state), ids.length, 'One subscription should belong to each mounted widget');
  return state;
}

async function assertIdentities(page, ids) {
  const identities = await page.evaluate(() => window.__MFE_PROOF__.identities());
  assert.deepEqual(identities.map((entry) => entry.instanceId).sort(), [...ids].sort());
  for (const identity of identities) {
    assert.equal(identity.reactMatches, true, `${identity.instanceId} must use the shared React identity`);
    assert.equal(identity.contextMatches, true, `${identity.instanceId} must use the shared platform context identity`);
  }
  return identities;
}

async function assertVersions(page, ids) {
  for (const id of ids) {
    assert.match(await readText(widget(page, id).getByTestId('version')), new RegExp(expectedVersions[id].replaceAll('.', '\\.')));
    assert.match(await readText(widget(page, id).getByTestId('dependency')), new RegExp(`D\\s*${expectedDependencies[id].replaceAll('.', '\\.')}`));
  }
}

async function styles(page, instanceId) {
  return widget(page, instanceId).evaluate((card) => {
    const result = {};
    for (const role of ['panel', 'button']) {
      const selector = `[data-css-role="${role}"]`;
      const element = card.matches(selector) ? card : card.querySelector(selector);
      if (!element) throw new Error(`Missing ${selector} in ${card.dataset.testid}`);
      const computed = getComputedStyle(element);
      result[role] = {
        classes: [...element.classList],
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderColor: computed.borderColor,
      };
    }
    return result;
  });
}

function assertDifferentVersionStyles(a, c) {
  for (const role of ['panel', 'button']) {
    const aClasses = a[role].classes.filter((className) => className.includes(`__${role}__`));
    const cClasses = c[role].classes.filter((className) => className.includes(`__${role}__`));
    assert(aClasses.length > 0, `B v1 should expose a generated CSS Module class for local .${role}`);
    assert(cClasses.length > 0, `B v2 should expose a generated CSS Module class for local .${role}`);
    assert(!a[role].classes.includes(role), `B v1 must not leak bare global .${role}`);
    assert(!c[role].classes.includes(role), `B v2 must not leak bare global .${role}`);
    assert(a[role].classes.every((className) => !c[role].classes.includes(className)), `B v1 and B v2 ${role} class names must be disjoint`);
    assert.notEqual(a[role].backgroundColor, c[role].backgroundColor, `Both B versions need distinct ${role} background colors`);
    assert.notEqual(a[role].backgroundColor, 'rgba(0, 0, 0, 0)', `${role} v1 background must actually be applied`);
    assert.notEqual(c[role].backgroundColor, 'rgba(0, 0, 0, 0)', `${role} v2 background must actually be applied`);
  }
}

async function emitAndVerify(page, ids, removedIds = []) {
  const before = await snapshot(page);
  for (const id of ids) assert.equal(typeof eventCount(before, id), 'number', `Missing event count for ${id}`);
  await page.getByTestId('emit-event').click();
  await page.waitForFunction(({ ids, expected }) => {
    const state = window.__MFE_PROOF__.getSnapshot();
    return ids.every((id) => {
      const entry = state.activeInstances.find((item) => typeof item === 'object' && (item.instanceId ?? item.id) === id);
      return (state.eventCounts?.[id] ?? entry?.eventCount) === expected[id];
    });
  }, { ids, expected: Object.fromEntries(ids.map((id) => [id, eventCount(before, id) + 1])) });
  const after = await snapshot(page);
  for (const id of ids) assert.equal(eventCount(after, id), eventCount(before, id) + 1);
  for (const id of removedIds) {
    const count = eventCount(after, id);
    if (count !== undefined) assert.equal(count, eventCount(before, id), `Unmounted ${id} must not receive events`);
  }
  return after;
}

async function createScenario(name) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  currentPage = page;
  const scenario = { name, remoteEntries: [], consoleErrors: [], pageErrors: [], failedRequests: [] };
  report.scenarios.push(scenario);
  page.on('response', (response) => {
    if (/\/remoteEntry\.js(?:\?|$)/.test(response.url())) scenario.remoteEntries.push({ url: response.url(), status: response.status() });
  });
  page.on('pageerror', (error) => scenario.pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const entry = { text: message.text(), location: message.location() };
    if (!/favicon\.ico/.test(`${entry.text} ${entry.location.url}`)) scenario.consoleErrors.push(entry);
  });
  page.on('requestfailed', (request) => {
    if (!/favicon\.ico/.test(request.url())) scenario.failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
  });
  return { page, context, scenario };
}

function assertNoBrowserErrors(scenario) {
  assert.deepEqual(scenario.pageErrors, [], `${scenario.name}: uncaught browser errors`);
  assert.deepEqual(scenario.consoleErrors, [], `${scenario.name}: browser console errors`);
  assert.deepEqual(scenario.failedRequests, [], `${scenario.name}: failed network requests`);
}

function registryArtifactIds(registry) {
  const ids = new Set();
  function visit(value) {
    if (typeof value === 'string') {
      for (const match of value.matchAll(/(?:mf_)?((?:platform|a|b|c|d)_\d+_\d+_\d+_[a-f\d]+)(?=$|[^a-z\d_])/g)) ids.add(match[1]);
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        visit(key);
        visit(item);
      }
    }
  }
  visit(registry);
  return [...ids].sort();
}

async function runFullScenario(order) {
  const { page, context, scenario } = await createScenario(`cold-${order}`);
  const expectedOrder = order === 'ac' ? ['A', 'C'] : ['C', 'A'];
  await check(`${order}: cold load and requested mount order`, async () => {
    await page.goto(`${baseURL}/?order=${order}`, { waitUntil: 'networkidle' });
    await waitForWidgets(page, ['A', 'C']);
    await assertActive(page, ['A', 'C']);
    await page.waitForFunction(() => window.__MFE_PROOF__.mountOrder.length >= 2);
    scenario.mountOrder = await page.evaluate(() => [...window.__MFE_PROOF__.mountOrder]);
    assert.deepEqual(scenario.mountOrder.slice(0, 2), expectedOrder);
    scenario.runtimeBinding = await page.evaluate(() => ({
      compositionId: window.__MFE_PROOF__.compositionId,
      platformArtifactId: window.__MFE_PROOF__.platformArtifactId,
      registry: window.__MFE_PROOF__.registry,
      diagnostics: window.__MFE_PROOF__.getRuntimeDiagnostics(),
    }));
    assert.equal(typeof scenario.runtimeBinding.compositionId, 'string');
    assert(scenario.runtimeBinding.compositionId.length > 0);
    assert.equal(scenario.runtimeBinding.compositionId, scenario.runtimeBinding.registry.compositionId);
    assert.equal(scenario.runtimeBinding.platformArtifactId, scenario.runtimeBinding.registry.artifacts.platform.id);
    assert.equal(scenario.runtimeBinding.registry.selected.platform, scenario.runtimeBinding.platformArtifactId);
    const platformContainer = scenario.runtimeBinding.diagnostics.containers.find((container) => container.id === scenario.runtimeBinding.platformArtifactId);
    assert(platformContainer, 'The runtime must record its selected platform container');
    assert.equal(platformContainer.loadCount, 1);
    assert.equal(platformContainer.initCount, 1);
    await assertVersions(page, ['A', 'C']);
    scenario.identities = await assertIdentities(page, ['A', 'C']);
  });

  const originalStyles = { A: await styles(page, 'A'), C: await styles(page, 'C') };
  await check(`${order}: same CSS names, distinct version styles`, async () => {
    assertDifferentVersionStyles(originalStyles.A, originalStyles.C);
    scenario.initialStyles = originalStyles;
  });

  await check(`${order}: independent counters, inputs, and scoped caches`, async () => {
    assert.equal(await readCount(page, 'A'), 0);
    assert.equal(await readCount(page, 'C'), 0);
    const emptyA = await readText(widget(page, 'A').getByTestId('cache-value'));
    const emptyC = await readText(widget(page, 'C').getByTestId('cache-value'));
    assert.equal(emptyA, emptyC, 'Both new scopes should have the same empty-cache display');
    await widget(page, 'A').getByTestId('increment').click();
    await widget(page, 'A').getByTestId('increment').click();
    assert.equal(await readCount(page, 'A'), 2);
    assert.equal(await readCount(page, 'C'), 0);
    await widget(page, 'C').getByTestId('increment').click();
    await widget(page, 'A').getByTestId('input').fill(`A-value-${order}`);
    await widget(page, 'A').getByTestId('cache-write').click();
    assert.equal(await readText(widget(page, 'A').getByTestId('cache-value')), `A-value-${order}`);
    assert.equal(await readText(widget(page, 'C').getByTestId('cache-value')), emptyC);
    assert.equal(await widget(page, 'C').getByTestId('input').inputValue(), '');
    await widget(page, 'C').getByTestId('input').fill(`C-value-${order}`);
    await widget(page, 'C').getByTestId('cache-write').click();
    assert.equal(await readText(widget(page, 'C').getByTestId('cache-value')), `C-value-${order}`);
    await widget(page, 'A').getByTestId('cache-read').click();
    assert.equal(await readText(widget(page, 'A').getByTestId('cache-value')), `A-value-${order}`);
    assert.equal(await widget(page, 'A').getByTestId('input').inputValue(), `A-value-${order}`);
    assert.equal(await readCount(page, 'A'), 2);
    assert.equal(await readCount(page, 'C'), 1);
  });

  await check(`${order}: duplicate B v1 instance has isolated state and shared runtime identities`, async () => {
    await page.getByTestId('add-a-copy').click();
    await waitForWidgets(page, ['A-copy']);
    await assertActive(page, ['A', 'C', 'A-copy']);
    await assertVersions(page, ['A-copy']);
    await assertIdentities(page, ['A', 'C', 'A-copy']);
    assert.equal(await readCount(page, 'A-copy'), 0);
    assert.equal(await widget(page, 'A-copy').getByTestId('input').inputValue(), '');
    assert.notEqual(await readText(widget(page, 'A-copy').getByTestId('cache-value')), `A-value-${order}`);
    for (let i = 0; i < 3; i += 1) await widget(page, 'A-copy').getByTestId('increment').click();
    await widget(page, 'A-copy').getByTestId('input').fill(`copy-value-${order}`);
    await widget(page, 'A-copy').getByTestId('cache-write').click();
    assert.equal(await readText(widget(page, 'A-copy').getByTestId('cache-value')), `copy-value-${order}`);
    await widget(page, 'A').getByTestId('cache-read').click();
    await widget(page, 'C').getByTestId('cache-read').click();
    assert.equal(await readText(widget(page, 'A').getByTestId('cache-value')), `A-value-${order}`);
    assert.equal(await readText(widget(page, 'C').getByTestId('cache-value')), `C-value-${order}`);
    assert.equal(await readCount(page, 'A'), 2);
    assert.equal(await readCount(page, 'C'), 1);
    assert.equal(await readCount(page, 'A-copy'), 3);
    assert.deepEqual(await styles(page, 'A-copy'), originalStyles.A);
    assert.deepEqual(await styles(page, 'A'), originalStyles.A);
    assert.deepEqual(await styles(page, 'C'), originalStyles.C);
    await emitAndVerify(page, ['A', 'C', 'A-copy']);
  });

  await check(`${order}: portals stay inside their assigned scope`, async () => {
    for (const id of ['A', 'C', 'A-copy']) {
      await widget(page, id).getByTestId('open-popup').click();
      const popup = page.getByTestId(`popup-${id}`);
      await popup.waitFor({ state: 'visible' });
      assert.equal(await popup.evaluate((element) => element.closest('[data-portal-scope]')?.getAttribute('data-portal-scope')), id);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(outputDirectory, order === 'ac' ? 'dashboard.png' : 'dashboard-ca.png'), fullPage: true });
  });

  await check(`${order}: unmount releases one scope, subscription, and portal without disturbing survivors`, async () => {
    const before = await snapshot(page);
    await page.getByTestId('remove-a').click();
    await widget(page, 'A').waitFor({ state: 'detached' });
    await page.getByTestId('popup-A').waitFor({ state: 'detached' });
    const after = await assertActive(page, ['C', 'A-copy']);
    assert.equal(subscriptionCount(after), subscriptionCount(before) - 1);
    await assertIdentities(page, ['C', 'A-copy']);
    assert.equal(await readCount(page, 'A-copy'), 3);
    assert.equal(await readCount(page, 'C'), 1);
    assert.equal(await readText(widget(page, 'A-copy').getByTestId('cache-value')), `copy-value-${order}`);
    assert.equal(await readText(widget(page, 'C').getByTestId('cache-value')), `C-value-${order}`);
    assert.deepEqual(await styles(page, 'A-copy'), originalStyles.A);
    assert.deepEqual(await styles(page, 'C'), originalStyles.C);
    await emitAndVerify(page, ['C', 'A-copy'], ['A']);
    for (const id of ['C', 'A-copy']) {
      assert.equal(await page.getByTestId(`popup-${id}`).count(), 1, `${id}'s popup must survive A's removal`);
    }
    await page.getByTestId('remove-c').click();
    await page.getByTestId('remove-a-copy').click();
    scenario.finalSnapshot = await assertActive(page, []);
    assert.equal(await page.locator('[data-testid^="popup-"]').count(), 0);
  });

  await check(`${order}: all seven independently served artifacts and containers are present`, async () => {
    const registryResponse = await page.request.get(`${baseURL}/registry.json`);
    assert.equal(registryResponse.status(), 200, 'The runtime registry must be available');
    scenario.registry = await registryResponse.json();
    const platformConsumers = [scenario.registry.shell, ...Object.values(scenario.registry.artifacts).filter((artifact) => artifact.service === 'b')];
    for (const consumer of platformConsumers) {
      assert.equal(consumer.dependencies.platform, undefined, `${consumer.id} must not compile a concrete SDK artifact into its business dependencies`);
      assert.equal(consumer.runtimeRequirements.platform, '>=1.0.0 <2.0.0', `${consumer.id} must declare its supported runtime SDK range`);
      assert.equal(consumer.runtimeRequirements.react, '19.3.1');
      assert.equal(consumer.runtimeRequirements['react-dom'], '19.3.1');
    }
    scenario.registryArtifactIds = registryArtifactIds(scenario.registry);
    scenario.loadedArtifacts = await page.evaluate(() => [...window.__MFE_PROOF__.loadedArtifacts]);
    scenario.containerNames = await page.evaluate(() => Object.keys(window).filter((key) => key.startsWith('mf_')).sort());
    const platformPrefix = `platform_${scenario.registry.artifacts.platform.version.replaceAll('.', '_')}`;
    const selectedArtifactPrefixes = [platformPrefix, ...artifactPrefixes];
    const artifactIds = selectedArtifactPrefixes.map((prefix) => {
      const matches = scenario.loadedArtifacts.filter((id) => new RegExp(`^${prefix}_[a-f\\d]+$`).test(id));
      assert.equal(matches.length, 1, `Expected one content-addressed ${prefix} artifact, got ${JSON.stringify(matches)}`);
      return matches[0];
    });
    for (const prefix of ['a_1_0_0', 'c_1_0_0']) {
      assert(scenario.registryArtifactIds.some((id) => id.startsWith(`${prefix}_`)), `Runtime registry must select ${prefix}`);
    }
    for (const registryId of scenario.registryArtifactIds) {
      assert(scenario.loadedArtifacts.includes(registryId), `Registry artifact ${registryId} was not loaded`);
    }
    for (const artifactId of artifactIds) {
      assert(scenario.loadedArtifacts.includes(artifactId), `Missing loaded artifact ${artifactId}`);
      assert(scenario.containerNames.includes(`mf_${artifactId}`), `Missing unique container mf_${artifactId}`);
      const responses = scenario.remoteEntries.filter((entry) => new URL(entry.url).pathname === `/artifacts/${artifactId}/remoteEntry.js`);
      assert(responses.length > 0, `No actual network response for ${artifactId}/remoteEntry.js`);
      assert(responses.every((entry) => entry.status >= 200 && entry.status < 400), `Failed remote entry response for ${artifactId}`);
    }
    const roles = order === 'ac' ? ['A', 'C'] : ['C', 'A'];
    const expectedOrder = [scenario.registry.selected.platform, ...roles.flatMap((role) => {
      const app = scenario.registry.applications[role];
      const bId = scenario.registry.runtimeBindings[app.id].b;
      return [app.id, bId, scenario.registry.runtimeBindings[bId].d];
    })];
    const entryPositions = expectedOrder.map((id) => {
      const pathname = `/artifacts/${id}/remoteEntry.js`;
      return scenario.remoteEntries.findIndex((entry) => new URL(entry.url).pathname === pathname);
    });
    for (let index = 1; index < entryPositions.length; index += 1) {
      assert(entryPositions[index] > entryPositions[index - 1], `Actual remoteEntry responses must follow ${expectedOrder.join(' → ')}`);
    }
    scenario.expectedArtifactResponseOrder = expectedOrder;
    assertNoBrowserErrors(scenario);
  });
  await context.close();
  currentPage = undefined;
}

async function runIncrementalStyleScenario(order) {
  const { page, context, scenario } = await createScenario(`incremental-${order}`);
  const [first, second] = order === 'ac' ? ['A', 'C'] : ['C', 'A'];
  await check(`${order}: loading and unloading the other version does not change existing CSS`, async () => {
    await page.goto(`${baseURL}/?empty=1&order=${order}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean(window.__MFE_PROOF__));
    await assertActive(page, []);
    await page.getByTestId(`add-${first.toLowerCase()}`).click();
    await waitForWidgets(page, [first]);
    await assertActive(page, [first]);
    const before = await styles(page, first);
    await page.getByTestId(`add-${second.toLowerCase()}`).click();
    await waitForWidgets(page, [second]);
    await assertActive(page, [first, second]);
    const after = await styles(page, first);
    assert.deepEqual(after, before, `Adding ${second} changed ${first}'s CSS`);
    assertDifferentVersionStyles(await styles(page, 'A'), await styles(page, 'C'));
    await page.getByTestId(`remove-${second.toLowerCase()}`).click();
    await assertActive(page, [first]);
    assert.deepEqual(await styles(page, first), before, `Removing ${second} changed ${first}'s CSS`);
    await emitAndVerify(page, [first]);
    scenario.styles = { before, after };
    assertNoBrowserErrors(scenario);
  });
  await context.close();
  currentPage = undefined;
}

async function runFailureRetryScenario() {
  const { page, context, scenario } = await createScenario('remote-failure-retry');
  await check('remote failure isolation and retry', async () => {
    await page.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean(window.__MFE_PROOF__));
    await page.getByTestId('add-a').click();
    await waitForWidgets(page, ['A']);
    await assertActive(page, ['A']);
    await widget(page, 'A').getByTestId('increment').click();
    await widget(page, 'A').getByTestId('input').fill('preserved-during-remote-failure');
    await widget(page, 'A').getByTestId('cache-write').click();
    const originalStyles = await styles(page, 'A');
    assertNoBrowserErrors(scenario);

    const cArtifact = await page.evaluate(() => window.__MFE_PROOF__.registry.applications.C);
    const cEntryURL = new URL(cArtifact.entry, baseURL).href;
    let abortedRequests = 0;
    const abortEntry = async (route) => {
      abortedRequests += 1;
      await route.abort('failed');
    };
    await page.route(cEntryURL, abortEntry, { times: 1 });
    await page.getByTestId('add-c').click();
    const errorAlert = page.getByRole('alert').filter({ hasText: 'Remote unavailable:' });
    await errorAlert.waitFor({ state: 'visible' });
    assert((await readText(errorAlert)).includes(cArtifact.entry), 'The error must identify the unavailable C artifact');
    await page.waitForFunction(() => !document.querySelector('[data-testid="add-c"]').disabled);
    assert.equal(abortedRequests, 1, 'Only C remoteEntry should be deliberately aborted');
    await assertActive(page, ['A']);
    assert.equal(await widget(page, 'C').count(), 0, 'A failed C load must not leave a mounted C widget');
    assert.equal(await readCount(page, 'A'), 1);
    assert.equal(await widget(page, 'A').getByTestId('input').inputValue(), 'preserved-during-remote-failure');
    await widget(page, 'A').getByTestId('cache-read').click();
    assert.equal(await readText(widget(page, 'A').getByTestId('cache-value')), 'preserved-during-remote-failure');
    assert.deepEqual(await styles(page, 'A'), originalStyles);
    await emitAndVerify(page, ['A']);

    assert.deepEqual(scenario.pageErrors, [], 'The handled remote failure must not produce an uncaught exception');
    assert.equal(scenario.failedRequests.length, 1, 'Exactly the deliberately aborted request may fail');
    assert.equal(scenario.failedRequests[0].url, cEntryURL);
    assert.match(scenario.failedRequests[0].error, /ERR_FAILED/);
    assert(scenario.consoleErrors.some((entry) => entry.text.includes(`Remote unavailable: ${cArtifact.entry}`)), 'The handled loader failure should be reported');
    for (const entry of scenario.consoleErrors) {
      const loaderFailure = entry.text.includes(`Remote unavailable: ${cArtifact.entry}`);
      const resourceFailure = entry.location.url === cEntryURL && /Failed to load resource/.test(entry.text);
      assert(loaderFailure || resourceFailure, `Unexpected console error during the injected failure: ${entry.text}`);
    }
    scenario.expectedFailure = {
      artifact: cArtifact.id,
      entry: cEntryURL,
      failedRequests: [...scenario.failedRequests],
      consoleErrors: [...scenario.consoleErrors],
    };
    const failuresBeforeRetry = scenario.failedRequests.length;
    const consoleErrorsBeforeRetry = scenario.consoleErrors.length;
    const responsesBeforeRetry = scenario.remoteEntries.length;

    await page.unroute(cEntryURL, abortEntry);
    await page.getByTestId('add-c').click();
    await waitForWidgets(page, ['C']);
    await assertActive(page, ['A', 'C']);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.getByRole('alert').count(), 0, 'A successful retry must clear the earlier error');
    await assertVersions(page, ['A', 'C']);
    await assertIdentities(page, ['A', 'C']);
    assert.equal(await readCount(page, 'A'), 1, 'Retrying C must preserve A state');
    assert.equal(await readCount(page, 'C'), 0);
    assert.equal(await widget(page, 'A').getByTestId('input').inputValue(), 'preserved-during-remote-failure');
    await widget(page, 'A').getByTestId('cache-read').click();
    assert.equal(await readText(widget(page, 'A').getByTestId('cache-value')), 'preserved-during-remote-failure');
    assert.deepEqual(await styles(page, 'A'), originalStyles);
    await emitAndVerify(page, ['A', 'C']);
    const retryResponses = scenario.remoteEntries.slice(responsesBeforeRetry);
    assert(retryResponses.some((entry) => entry.url === cEntryURL && entry.status === 200), 'Retry must fetch C remoteEntry successfully after the rejected promise is cleared');
    assert.equal(scenario.failedRequests.length, failuresBeforeRetry, 'Retry must not add failed requests');
    assert.equal(scenario.consoleErrors.length, consoleErrorsBeforeRetry, 'Retry must not add console errors');
    assert.deepEqual(scenario.pageErrors, []);
    scenario.retryResponses = retryResponses;
    scenario.finalSnapshot = await snapshot(page);
  });
  await context.close();
  currentPage = undefined;
}

try {
  browser = await chromium.launch(launchOptions);
  report.browserVersion = browser.version();
  for (const order of ['ac', 'ca']) await runFullScenario(order);
  for (const order of ['ac', 'ca']) await runIncrementalStyleScenario(order);
  await runFailureRetryScenario();
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = { message: error.message, stack: error.stack };
  if (currentPage && !currentPage.isClosed()) {
    await currentPage.screenshot({ path: path.join(outputDirectory, 'failure.png'), fullPage: true }).catch(() => {});
  }
  console.error(error);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  report.passedChecks = report.checks.filter((entry) => entry.status === 'passed').length;
  await writeFile(path.join(outputDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser?.close();
  console.log(`Verification ${report.status}: ${report.passedChecks}/${report.checks.length} checks. Report: ${path.join(outputDirectory, 'report.json')}`);
}
