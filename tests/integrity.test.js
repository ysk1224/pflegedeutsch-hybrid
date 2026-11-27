import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicCoachPrompt, requestPublicCoaching } from '../cloud-coach.js';
import { readPublicCoachDrill } from '../cloud-drill.js';
import { readDeviceAvailability } from '../inference.js';
import { assessIntegrity, buildIntegrityLanguagePrompt, compareAttempts, integrityStages } from '../integrity.js';

const hasIssue = (verdict, id) => verdict.issues.some(issue => issue.id === id);

test('all stages have curated reference matches and their demos expose the intended issues', () => {
  const issueIds = ['trigger-unconfirmed', 'measurement', 'observation'];
  for (const [index, stage] of integrityStages.entries()) {
    const demo = assessIntegrity(stage.demo, stage.id);
    assert.ok(hasIssue(demo.factual, issueIds[index]));
    const revised = assessIntegrity(stage.sample, stage.id);
    assert.equal(revised.factual.state, 'verified');
    assert.equal(revised.grammar.state, 'verified');
    assert.match(compareAttempts(demo, revised), /Case facts: now passes/);
  }
});

test('fluent wording can contain unsupported measurements or lack attribution', () => {
  const fluent = assessIntegrity('Die Patientin berichtet über Atemnot beim Gehen. Die SpO₂ beträgt 92 %.', 'handover');
  assert.equal(fluent.grammar.state, 'verified');
  assert.equal(fluent.factual.state, 'revise');
  assert.ok(hasIssue(fluent.factual, 'measurement'));
  const note = assessIntegrity('Atemnot beim Gehen beobachtet.', 'note');
  assert.equal(note.grammar.state, 'verified');
  assert.ok(hasIssue(note.factual, 'observation'));
});

test('the facts can match while a grammar rule still flags revision', () => {
  const result = assessIntegrity('Die Patientin berichtet über Atemnot beim gehen.', 'handover');
  assert.equal(result.factual.state, 'verified');
  assert.equal(result.grammar.state, 'revise');
});

test('specific unsupported diagnoses, values and changed triggers are flagged', () => {
  for (const [text, issue] of [
    ['Es besteht Verdacht auf eine Pneumonie.', 'diagnosis'],
    ['Es liegt eine Lungenembolie vor.', 'diagnosis'],
    ['Atemnot in Ruhe beobachtet.', 'changed-trigger'],
    ['Patientin berichtet über Atemnot beim Gehen. Atemfrequenz 25.', 'measurement'],
    ['Patientin berichtet über Atemnot beim Gehen. Blutzucker 120 mg/dL.', 'measurement']
  ]) {
    const result = assessIntegrity(text, 'note').factual;
    if (issue) assert.ok(hasIssue(result, issue), text);
    else assert.equal(result.state, 'review', text);
  }
});

test('uncertain or unseen answers cannot receive a positive automatic verdict', () => {
  for (const text of [
    'Patientin berichtet über Atemnot beim Gehen. SpO₂ nicht gemessen.',
    'Patientin berichtet über Atemnot beim Gehen. Keine Pneumonie.',
    'Die Patientin berichtet über Atemnot beim Gehen?'
  ]) {
    assert.notEqual(assessIntegrity(text, 'handover').factual.state, 'verified', text);
    assert.notEqual(assessIntegrity(text, 'handover').grammar.state, 'verified', text);
  }
  assert.throws(() => assessIntegrity('   ', 'patient'), /Enter a German draft/);
  assert.throws(() => assessIntegrity('Ein Satz.', 'bad-stage'), /Enter a German draft/);
});

test('cloud allowlist accepts neither draft text nor coercible consent', async () => {
  assert.match(buildPublicCoachPrompt('attribution'), /breathlessness while walking/);
  for (const value of ['private draft', 'constructor', 'toString', undefined, { topic: 'attribution' }]) {
    assert.throws(() => buildPublicCoachPrompt(value), /unknown-coach-topic/);
  }
  for (const value of [false, undefined, 'true', 1]) {
    await assert.rejects(requestPublicCoaching('attribution', value), /cloud-consent-required/);
  }
  assert.match(buildIntegrityLanguagePrompt(integrityStages[0], 'Private draft'), /Private draft/);
});

test('readiness distinguishes missing APIs, provider failures and supported statuses', async () => {
  assert.equal(await readDeviceAvailability(null), 'unsupported');
  for (const value of ['available', 'downloading', 'downloadable', 'unavailable']) {
    assert.equal(await readDeviceAvailability({ availability: async () => value, create() {} }), value);
  }
  assert.equal(await readDeviceAvailability({ availability: async () => 'new-status', create() {} }), 'unknown');
  assert.equal(await readDeviceAvailability({ availability: async () => { throw Error(); }, create() {} }), 'unknown');
});


test('cloud creates a varied two-register drill with a locally graded attribution question', () => {
  const patient = 'Beim Spazieren werde ich kurzatmig.';
  const handover = 'Die Patientin schildert Luftnot beim Spazieren.';
  const note = 'Eigenangabe: Luftnot beim Spazieren.';
  for (const [topic, first, second, answer] of [
    ['audience', patient, handover, 'schildert'],
    ['attribution', handover, note, 'Eigenangabe'],
    ['concise', handover, note, 'Eigenangabe']
  ]) {
    const drill = readPublicCoachDrill(topic, JSON.stringify({ first, second }));
    assert.deepEqual(drill.lines.map(line => line.sentence), [first, second]);
    assert.equal(drill.answer, answer);
    assert.equal(drill.options.length, 3);
  }
  assert.throws(() => readPublicCoachDrill('attribution', '{"first":"x","second":"y","advice":"z"}'), /feedback-format/);
  for (const second of ['Atemnot beim Gehen beobachtet.', 'Patientenangabe: SpO₂ 92 %.', 'Patientenangabe: Atemnot aufgrund einer Pneumonie.']) {
    assert.throws(() => readPublicCoachDrill('attribution', JSON.stringify({ first: handover, second })), /unverified-example/);
  }
});

test('uncertain drafts are held, and the fact verdict is separate from wording', () => {
  const unknown = assessIntegrity('Laut der Patientin kommt es zur Lufthunger-Episode beim Gehen.', 'note');
  assert.equal(unknown.factual.state, 'review');
  assert.deepEqual(unknown.factual.issues, []);
  for (const draft of [
    'Beim Gehen bin ich nicht kurzatmig.',
    'Beim Gehen gerate ich außer Atem. Außerdem habe ich Brustschmerzen.',
    'Beim Gehen gerate ich außer Atem. Es besteht Verdacht auf Bronchitis.',
    'Beim Gehen gerate ich außer Atem. Blutdruck hundertachtzig.'
  ]) {
    assert.notEqual(assessIntegrity(draft, 'patient').factual.state, 'verified');
  }
  const revised = assessIntegrity('Beim Gehen werde ich kurzatmig.', 'patient');
  assert.equal(assessIntegrity('Beim Spazieren gerät sie außer Atem, sagt die Patientin.', 'handover').factual.state, 'verified');
  assert.equal(assessIntegrity('Die Patientin berichtet beim Gehen über Atemnot.', 'handover').factual.state, 'review');
  assert.equal(revised.factual.state, 'verified');
  assert.equal(revised.grammar.state, 'review');
});
