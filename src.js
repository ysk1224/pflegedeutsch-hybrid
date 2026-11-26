import { exercises, buildPrompt, validateAnswer } from './exercises.js';
import { referenceFor } from './grammar.js';
import { demoAnswer, followups, knownErrors, vocabulary } from './learning.js';
import { feedbackError } from './feedback.js';
import { configured, requestFeedback } from './inference.js';
import { loadIds, nextReviewId, saveIds } from './study.js';

const $ = id => document.getElementById(id);
const byId = new Map(exercises.map(exercise => [exercise.id, exercise]));
const validIds = new Set(byId.keys());
const storage = () => window.localStorage;
const completedKey = 'pflege-completed';
const reviewKey = 'pflege-review';
const completed = loadIds(storage, completedKey, validIds);
const review = loadIds(storage, reviewKey, validIds);
const drafts = new Map();
const runControls = ['case', 'answer', 'cloud', 'run', 'demo', 'mark', 'followAnswer', 'followRun'];

let exercise = exercises[0];
let busy = false;

function element(tag, text, lang) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (lang) node.lang = lang;
  return node;
}

function showProgress() {
  $('meter').max = exercises.length;
  $('meter').value = completed.size;
  $('progress').textContent = `${completed.size} of ${exercises.length} exercises reviewed`;
  $('reviewCount').textContent = `${review.size} saved ${review.size === 1 ? 'scenario' : 'scenarios'}`;
  $('nextReview').disabled = busy || !review.size;
  $('saveReview').disabled = busy;
  const saved = review.has(exercise.id);
  $('saveReview').setAttribute('aria-pressed', String(saved));
  $('saveReview').textContent = saved ? 'Remove from review' : 'Save for review';
}

function persist(key, ids) {
  if (!saveIds(storage, key, ids)) {
    $('storageStatus').textContent = 'This browser could not save progress. Changes are available until the page closes.';
  }
  showProgress();
}

function markReviewed() {
  completed.add(exercise.id);
  persist(completedKey, completed);
  $('markStatus').textContent = 'Marked as reviewed.';
}

function showExercise(id) {
  drafts.set(exercise.id, [$('answer').value, $('followAnswer').value]);
  exercise = byId.get(id);
  const followup = followups[id];
  $('case').value = id;
  $('scenario').textContent = exercise.task;
  $('criterion').textContent = exercise.check;
  const [draft = '', secondDraft = ''] = drafts.get(id) ?? [];
  $('answer').value = draft;
  $('followAnswer').value = secondDraft;
  $('cloud').checked = false;
  $('sampleText').textContent = exercise.sample;
  $('followQuestion').textContent = followup.question;
  $('followSample').textContent = followup.sample;
  $('reference').open = false;
  $('followPanel').open = false;
  $('followReference').open = false;
  $('errorPanel').hidden = true;
  $('metrics').hidden = true;
  for (const nodeId of ['output', 'followOutput']) $(nodeId).hidden = true;
  for (const nodeId of ['status', 'followStatus', 'markStatus', 'followChecks']) $(nodeId).replaceChildren();

  $('terms').replaceChildren(...exercise.terms.map(([de, en, ko]) => {
    const item = document.createElement('li');
    item.append(element('strong', de, 'de'), ' · ', element('span', en, 'en'), ' · ', element('span', ko, 'ko'));
    return item;
  }));
  $('grammarCards').replaceChildren(...referenceFor(id).map(([title, de, en, ko]) => {
    const card = document.createElement('article');
    card.className = 'grammar-card';
    card.append(element('h3', title), element('p', de, 'de'), element('p', en, 'en'), element('p', ko, 'ko'));
    return card;
  }));
  const labels = ['Clinical German', 'Patient German', 'English', '한국어'];
  const languages = ['de', 'de', 'en', 'ko'];
  $('clinicalPair').replaceChildren(...vocabulary[id].flatMap((value, index) => [
    element('dt', labels[index], index === 3 ? 'ko' : 'en'), element('dd', value, languages[index])
  ]));
  showProgress();
}

function showChecks(checks, followup) {
  const target = $(followup ? 'followChecks' : 'errorCards');
  if (!followup) $('errorPanel').hidden = false;
  target.replaceChildren();
  if (!checks.length) {
    target.append(element('p', 'No match in the phrase checks. Compare your answer with the example.'));
    return;
  }
  for (const { label, original, correction, english, ko } of checks) {
    const card = document.createElement('article');
    card.className = 'error-card';
    card.append(element('h3', label), element('p', `${original} → ${correction}`, 'de'),
      element('p', english, 'en'), element('p', ko, 'ko'));
    target.append(card);
  }
}

function setBusy(active) {
  busy = active;
  for (const id of runControls) $(id).disabled = active;
  showProgress();
}

function showMetrics({ source, first, total }) {
  $('metrics').hidden = false;
  $('actualSource').textContent = { device: 'On-device', cloud: 'Cloud', unknown: 'Unknown' }[source];
  $('firstTime').textContent = first === null ? '—' : `${first.toFixed(1)} s`;
  $('totalTime').textContent = `${total.toFixed(1)} s`;
}

async function checkAnswer(isFollowup) {
  if (busy) return;
  const input = $(isFollowup ? 'followAnswer' : 'answer');
  const status = $(isFollowup ? 'followStatus' : 'status');
  const output = $(isFollowup ? 'followOutput' : 'output');
  const answer = input.value;
  const validation = validateAnswer(answer, input.maxLength);
  if (validation) {
    status.textContent = validation;
    input.focus();
    return;
  }

  output.hidden = true;
  $('metrics').hidden = true;
  const checks = knownErrors(answer, exercise.id, isFollowup);
  showChecks(checks, isFollowup);
  if (checks.length && !review.has(exercise.id)) {
    review.add(exercise.id);
    persist(reviewKey, review);
  }

  if (!configured) {
    status.textContent = 'Phrase check complete. Open the example for comparison.';
    return;
  }

  const allowCloud = $('cloud').checked;
  const followup = isFollowup ? followups[exercise.id] : null;
  setBusy(true);
  status.textContent = 'Preparing AI feedback…';
  try {
    const result = await requestFeedback(buildPrompt(exercise, answer, followup, checks), allowCloud, {
      onDownload: percent => { status.textContent = `Preparing the device model · ${percent}%`; },
      onGenerate: () => { status.textContent = 'Generating AI feedback…'; },
      onFirstText: () => { status.textContent = 'Checking the response format…'; }
    });
    output.replaceChildren(element('h3', 'AI-suggested German'), element('p', result.feedback.german, 'de'),
      element('h3', 'AI explanation · English'), element('p', result.feedback.english, 'en'));
    output.hidden = false;
    showMetrics(result);
    const description = { device: 'On-device AI', cloud: 'Cloud AI', unknown: 'Source unavailable' };
    status.textContent = `${description[result.source]} · ${result.total.toFixed(1)} s total`;
    if (!isFollowup) markReviewed();
  } catch (error) {
    status.textContent = feedbackError(error, allowCloud);
  } finally {
    setBusy(false);
  }
}

for (const item of exercises) {
  const option = element('option', `${item.level} · ${item.title}`);
  option.value = item.id;
  $('case').append(option);
}

$('case').addEventListener('change', event => showExercise(event.target.value));
$('practiceForm').addEventListener('submit', event => { event.preventDefault(); void checkAnswer(false); });
$('followForm').addEventListener('submit', event => { event.preventDefault(); void checkAnswer(true); });
$('mark').addEventListener('click', markReviewed);
$('saveReview').addEventListener('click', () => {
  if (review.has(exercise.id)) review.delete(exercise.id);
  else review.add(exercise.id);
  persist(reviewKey, review);
});
$('nextReview').addEventListener('click', () => {
  const id = nextReviewId(review, exercise.id);
  if (!id) return;
  showExercise(id);
  $('case').focus();
});
$('demo').addEventListener('click', () => {
  showExercise('handover');
  $('answer').value = demoAnswer;
  showChecks(knownErrors(demoAnswer, 'handover'), false);
  $('status').textContent = 'Fictional demo loaded. Check your German to save detected errors for review.';
  $('answer').focus();
});

$('modePanel').hidden = !configured;
$('setup').hidden = configured;
showExercise(exercise.id);
