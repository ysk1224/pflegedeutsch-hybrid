import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feedbackError, readFeedback, sourceKind, verifiedSource, withDeadline } from '../feedback.js';

test('structured feedback is only accepted with both bounded, nonempty strings', () => {
  assert.deepEqual(readFeedback('{"german":"  Er berichtet. ","english":"Verb in singular."}'),
    { german: 'Er berichtet.', english: 'Verb in singular.' });
  for (const text of ['Not JSON', 'null', '{}', '{"german":true,"english":"text"}',
    '{"german":" ","english":"text"}', '{"german":"valid","english":"text","extra":1}',
    JSON.stringify({ german: 'x'.repeat(2001), english: 'text' })]) {
    assert.throws(() => readFeedback(text), /feedback-format/);
  }
});

test('SDK response is the source of labels, independent of requested mode', () => {
  assert.equal(sourceKind('ON_DEVICE'), 'device');
  assert.equal(sourceKind('IN_CLOUD'), 'cloud');
  assert.equal(sourceKind(undefined), 'unknown');
  assert.equal(verifiedSource('ON_DEVICE', true), 'device');
  assert.equal(verifiedSource('IN_CLOUD', true), 'cloud');
  assert.equal(verifiedSource(undefined, false), 'unknown');
  assert.throws(() => verifiedSource('IN_CLOUD', false), /unexpected-source/);
});

test('deadline resolves promptly, preserves failures and calls cancellation on timeout', async () => {
  let timedOut = false;
  const cancel = () => { timedOut = true; };
  assert.equal(await withDeadline(Promise.resolve('done'), 50, cancel), 'done');
  await assert.rejects(withDeadline(Promise.reject(Error('SDK failure')), 50, cancel), /SDK failure/);
  assert.equal(timedOut, false);
  await assert.rejects(withDeadline(new Promise(() => {}), 5, cancel), /feedback-timeout/);
  assert.equal(timedOut, true);
});

test('learner-facing errors preserve a study path and suppress provider internals', () => {
  assert.match(feedbackError({ code: 'AI/unsupported' }, false), /On-device AI is unavailable/);
  assert.match(feedbackError(Error('403 provider internals'), true), /authorized/);
  assert.match(feedbackError(Error('429 request limit'), true), /quota/);
  assert.match(feedbackError(Error('feedback-timeout'), false), /Your answer is still here/);
  assert.doesNotMatch(feedbackError(Error('403 provider internals'), true), /internals/);
});
