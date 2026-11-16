import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadReviews, saveReview } from '../lib/review-storage';

test('local storage persists only explicit saves and preserves other calls', async () => {
  const values = new Map<string, string>();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  try {
    assert.deepEqual(await loadReviews(), {});
    const review = { decision: 'Acceptable', notes: 'Checked', findings: {} };
    await saveReview('CALL-001', review);
    review.notes = 'Unsaved edit';
    assert.equal((await loadReviews())['CALL-001'].notes, 'Checked');
    await saveReview('CALL-002', { ...review, decision: 'Uncertain' });
    assert.equal(Object.keys(await loadReviews()).length, 2);
    values.set('soundsense-reviews-v1', 'invalid json');
    await assert.rejects(loadReviews());
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
