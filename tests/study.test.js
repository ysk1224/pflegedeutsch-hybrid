import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadIds, nextReviewId, saveIds } from '../study.js';

test('review state loads older arrays, filters invalid IDs, and keeps insertion order', () => {
  const valid = new Set(['handover', 'pain']);
  const storage = () => ({ getItem: () => '["pain","removed","handover","pain",false]' });
  const review = loadIds(storage, 'pflege-review', valid);
  assert.deepEqual([...review], ['pain', 'handover']);
  assert.equal(nextReviewId(review, 'unknown'), 'pain');
  assert.equal(nextReviewId(review, 'pain'), 'handover');
  assert.equal(nextReviewId(review, 'handover'), 'pain');
  assert.equal(nextReviewId(new Set(), 'handover'), undefined);
});

test('invalid and blocked storage leave the app usable', () => {
  const blocked = () => { throw Error('blocked'); };
  assert.equal(loadIds(blocked, 'saved', new Set()).size, 0);
  assert.equal(loadIds(() => ({ getItem: () => '{}' }), 'saved', new Set()).size, 0);
  assert.equal(saveIds(blocked, 'saved', new Set()), false);
});

test('saved progress serializes exercise IDs only', () => {
  let written;
  const storage = () => ({ setItem: (key, value) => { written = [key, value]; } });
  assert.equal(saveIds(storage, 'pflege-completed', new Set(['handover'])), true);
  assert.deepEqual(written, ['pflege-completed', '["handover"]']);
});
