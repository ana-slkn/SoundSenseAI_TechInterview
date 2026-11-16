import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calls, findingsFor, riskFor } from '../lib/reviews';
test('All evidence resolves to a real transcript turn and claims occur in the summary', () => {
  for (const call of calls)
    for (const f of findingsFor(call.id)) {
      assert.ok(call.summary.includes(f.claim), `${f.id}: claim absent`);
      for (const t of f.turns)
        assert.ok(
          call.transcript.split('\n').some((line) => line.startsWith(t + ' ')),
          `${f.id}: ${t}`,
        );
    }
});
test('Accurate calls remain clear, including a future amount matching an immediate amount', () => {
  for (const id of [
    'CALL-001',
    'CALL-004',
    'CALL-005',
    'CALL-006',
    'CALL-007',
  ]) {
    assert.deepEqual(findingsFor(id), []);
    assert.equal(riskFor(id), 'Clear');
  }
});
test('Critical distinctions are represented independently', () => {
  assert.ok(findingsFor('CALL-003').some((f) => f.title.includes('Consent')));
  assert.ok(findingsFor('CALL-009').some((f) => f.title.includes('Deferral')));
  assert.equal(findingsFor('CALL-020').length, 3);
  assert.equal(
    new Set(calls.flatMap((c) => findingsFor(c.id).map((f) => f.id))).size,
    calls.flatMap((c) => findingsFor(c.id)).length,
  );
});
