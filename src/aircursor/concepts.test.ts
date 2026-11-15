import test from 'node:test';
import assert from 'node:assert/strict';

import {FINISH_PRESETS, HARDWARE_CONCEPTS, VISION_GESTURES} from './concepts.ts';
import {SUBJECT_WORKSTREAMS} from './subjects.ts';

test('all 5 physical hardware remote concepts have complete CAD part specs', () => {
  assert.equal(HARDWARE_CONCEPTS.length, 5);
  const expectedIds = ['airring', 'airwand', 'airpebble', 'airclip', 'airdeck'];
  assert.deepEqual(
    HARDWARE_CONCEPTS.map((c) => c.id),
    expectedIds
  );

  for (const concept of HARDWARE_CONCEPTS) {
    assert.ok(concept.partNames.length >= 3 && concept.partNames.length <= 12);
    assert.ok(concept.controls.length >= 2);
    assert.ok(concept.massGrams > 0);
    assert.ok(concept.blenderScriptTarget.includes('generate_'));
  }
});

test('all 4 finish presets and 4 vision gestures are configured', () => {
  assert.equal(Object.keys(FINISH_PRESETS).length, 4);
  assert.equal(VISION_GESTURES.length, 4);
});

test('all 15 subject workstreams are uniquely numbered 01..15', () => {
  assert.equal(SUBJECT_WORKSTREAMS.length, 15);
  SUBJECT_WORKSTREAMS.forEach((subject, idx) => {
    const expectedNum = String(idx + 1).padStart(2, '0');
    assert.equal(subject.number, expectedNum);
    assert.ok(subject.artifacts.length > 0);
  });
});
