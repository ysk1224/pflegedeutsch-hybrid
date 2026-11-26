import { assessIntegrity, buildIntegrityLanguagePrompt, compareAttempts, integrityStages, patientQuote } from './integrity.js';
import { cloudConfigured, requestPublicCoaching } from './cloud-coach.js';
import { feedbackError } from './feedback.js';
import { requestDeviceFeedback } from './device-client.js';

const $ = id => document.getElementById(id);
const controls = [...document.querySelectorAll('button[data-stage]')];
const progress = new Map(integrityStages.map(stage => [stage.id, { draft: '', count: 0 }]));
const draft = $('labDraft');
const headings = { revise: 'Revise', review: 'Needs review', verified: 'Curated match' };
let stage = integrityStages[0];
let deviceRequest = 0;
let cloudBusy = false;

function textNode(tag, text, lang) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (lang) node.lang = lang;
  return node;
}

function renderVerdict(id, verdict) {
  const target = $(id);
  const panel = target.querySelector('div');
  target.dataset.verdict = verdict.state;
  panel.replaceChildren(textNode('strong', headings[verdict.state]), textNode('p', verdict.summary));
  if (verdict.issues.length) {
    const list = textNode('ul', '');
    list.append(...verdict.issues.map(issue => textNode('li', issue.text)));
    panel.append(list);
  }
}

function renderReview() {
  const completed = integrityStages.filter(item => {
    const record = progress.get(item.id);
    const text = item.id === stage.id ? draft.value : record.draft;
    return text === record.checkedDraft && record.latest?.factual.state === 'verified' &&
      record.latest.grammar.state === 'verified';
  }).length;
  $('labProgress').textContent = `${completed} of ${integrityStages.length} steps match the curated wording and facts`;
  const record = progress.get(stage.id);
  $('labReview').hidden = !record.latest;
  if (!record.latest) return;
  renderVerdict('factResult', record.latest.factual);
  renderVerdict('grammarResult', record.latest.grammar);
  const stale = draft.value !== record.checkedDraft;
  $('attemptStatus').textContent = stale
    ? 'Your draft has changed. Check it again to compare with the last attempt.'
    : `Attempt ${record.count} · ${record.comparison}`;
  $('nextStage').hidden = stage.id === 'note';
}

function clearDevice() {
  deviceRequest++;
  $('labDevice').disabled = $('labDevice').dataset.ready !== 'true';
  $('labDeviceStatus').textContent = '';
  $('labDeviceOutput').hidden = true;
  $('labDeviceOutput').replaceChildren();
}

function selectStage(id, focus = false) {
  progress.get(stage.id).draft = draft.value;
  stage = integrityStages.find(item => item.id === id);
  for (const control of controls) {
    if (control.dataset.stage === id) control.setAttribute('aria-current', 'step');
    else control.removeAttribute('aria-current');
  }
  $('stageTitle').textContent = stage.title;
  $('stageInstruction').textContent = stage.instruction;
  $('labTip').textContent = stage.success;
  $('labSample').textContent = stage.sample;
  $('labReference').open = false;
  draft.value = progress.get(id).draft;
  draft.setCustomValidity('');
  clearDevice();
  renderReview();
  if (focus) $('stageTitle').focus();
}

function checkDraft() {
  if (!validDraft()) return;
  const record = progress.get(stage.id);
  const result = assessIntegrity(draft.value, stage.id);
  record.comparison = compareAttempts(record.latest, result);
  record.latest = result;
  record.checkedDraft = draft.value;
  record.count++;
  renderReview();
  $('labResultTitle').focus();
}

function validDraft() {
  draft.setCustomValidity(draft.value.trim() ? '' : 'Enter a German draft first.');
  return draft.reportValidity();
}

function draftChanged() {
  draft.setCustomValidity('');
  clearDevice();
  renderReview();
}

function loadMistake() {
  draft.value = stage.demo;
  draftChanged();
  checkDraft();
}

function showSuggestion(output, feedback) {
  output.replaceChildren(textNode('p', feedback.german, 'de'), textNode('p', feedback.english, 'en'));
  output.hidden = false;
}

function acceptPublicExample(german, stageId) {
  // A known factual match limits the displayed AI example to the case rubric.
  return assessIntegrity(german, stageId).factual.state === 'verified';
}

$('patientQuote').textContent = patientQuote;
selectStage(stage.id);
for (const control of controls) control.addEventListener('click', () => selectStage(control.dataset.stage, true));
$('judgeTry').addEventListener('click', () => { selectStage('handover'); loadMistake(); });
$('labMistake').addEventListener('click', loadMistake);
$('nextStage').addEventListener('click', () => selectStage(integrityStages[integrityStages.indexOf(stage) + 1].id, true));
$('reviseDraft').addEventListener('click', () => draft.focus());
$('tryReference').addEventListener('click', () => {
  draft.value = stage.sample;
  draftChanged();
  draft.focus();
});
draft.addEventListener('input', draftChanged);
$('labForm').addEventListener('submit', event => { event.preventDefault(); checkDraft(); });

$('labDevice').addEventListener('click', async () => {
  if (!validDraft()) return;
  const request = ++deviceRequest;
  const requestStage = stage;
  const status = $('labDeviceStatus');
  const output = $('labDeviceOutput');
  const statusForRequest = { set textContent(value) { if (request === deviceRequest) status.textContent = value; } };
  $('labDevice').disabled = true;
  output.hidden = true;
  status.textContent = 'Opening the on-device model…';
  try {
    const result = await requestDeviceFeedback(buildIntegrityLanguagePrompt(requestStage, draft.value), statusForRequest);
    if (request !== deviceRequest) return;
    if (!acceptPublicExample(result.feedback.german, requestStage.id)) throw new Error('unverified-example');
    showSuggestion(output, result.feedback);
    status.textContent = `On-device AI · ${result.total.toFixed(1)} s total · Grammar suggestion`;
  } catch (error) {
    if (request === deviceRequest) status.textContent = feedbackError(error);
  } finally {
    if (request === deviceRequest) $('labDevice').disabled = false;
  }
});

function syncCoachControls() {
  $('coachRun').disabled = !cloudConfigured || cloudBusy || !$('coachConsent').checked;
  $('coachConsent').disabled = !cloudConfigured || cloudBusy;
  $('coachTopic').disabled = !cloudConfigured || cloudBusy;
}
if (!cloudConfigured) $('coachStatus').textContent = 'Cloud coaching is unavailable in this build.';
$('coachConsent').addEventListener('change', syncCoachControls);
$('coachTopic').addEventListener('change', () => {
  $('coachConsent').checked = false;
  $('coachOutput').hidden = true;
  $('coachStatus').textContent = '';
  syncCoachControls();
});
$('coachForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!cloudConfigured || cloudBusy || !$('coachConsent').checked) return;
  cloudBusy = true;
  const output = $('coachOutput');
  const status = $('coachStatus');
  const request = requestPublicCoaching($('coachTopic').value, $('coachConsent').checked);
  $('coachConsent').checked = false;
  syncCoachControls();
  output.hidden = true;
  status.textContent = 'Requesting cloud coaching…';
  try {
    const result = await request;
    if (!integrityStages.some(item => acceptPublicExample(result.feedback.german, item.id))) {
      throw new Error('unverified-example');
    }
    showSuggestion(output, result.feedback);
    status.textContent = 'Cloud AI · Public-case coaching';
  } catch (error) {
    status.textContent = feedbackError(error, true);
  } finally {
    cloudBusy = false;
    syncCoachControls();
  }
});
syncCoachControls();
