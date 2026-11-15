import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AirCursorArbiter,
  applyDeadzoneAndGain,
  buildPairingUri,
  generateQrMatrix,
  mapGestureToPointerAction,
} from './arbiter.ts';

test('failsafe autostart activates immediately without standby pause', () => {
  const arbiter = new AirCursorArbiter();
  const snap = arbiter.getSnapshot();
  assert.equal(snap.autostartActive, true);
  assert.equal(snap.activeSource, 'airpods');
  assert.equal(snap.diagnosticsPassCount, 15);
});

test('priority switching falls back cleanly when AirPods disconnect', () => {
  const arbiter = new AirCursorArbiter();
  arbiter.toggleSourceConnected('airpods');
  assert.equal(arbiter.getSnapshot().activeSource, 'vision');

  arbiter.toggleSourceConnected('vision');
  assert.equal(arbiter.getSnapshot().activeSource, 'remote');

  // Even if remote is toggled off while last, failsafe keeps remote alive
  arbiter.toggleSourceConnected('remote');
  assert.equal(arbiter.getSnapshot().activeSource, 'remote');
  assert.equal(arbiter.getSnapshot().sources.remote.connected, true);
});

test('deadzone filters micro-jitter and smoothing clamps to [-1, 1]', () => {
  assert.equal(applyDeadzoneAndGain(0.01, 1.5, 0.015), 0);
  assert.ok(applyDeadzoneAndGain(0.2, 1.5, 0.015) > 0);

  const arbiter = new AirCursorArbiter();
  arbiter.nudgeCursor(10, -10);
  const snap = arbiter.getSnapshot();
  assert.ok(snap.cursorX <= 1 && snap.cursorX >= -1);
  assert.ok(snap.cursorY <= 1 && snap.cursorY >= -1);
});

test('vision gesture mapper maps all 4 gestures accurately', () => {
  assert.equal(mapGestureToPointerAction('palm').buttonState, 'none');
  assert.equal(mapGestureToPointerAction('pinch').buttonState, 'left');
  assert.equal(mapGestureToPointerAction('fist').buttonState, 'drag');
  assert.equal(mapGestureToPointerAction('peace').buttonState, 'right');
});

test('QR generator produces deterministic 25x25 matrix with finder corners', () => {
  const uri = buildPairingUri('192.168.1.42', 8765, 'TEST');
  assert.equal(uri, 'http://192.168.1.42:8765/remote.html?ws=8765&token=TEST');

  const qrA = generateQrMatrix(uri);
  const qrB = generateQrMatrix(uri);
  assert.equal(qrA.length, 25);
  assert.equal(qrA[0].length, 25);
  // Top-left finder outer corner & center dot
  assert.equal(qrA[0][0], true);
  assert.equal(qrA[3][3], true);
  assert.deepEqual(qrA, qrB);
});

test('Subject 15 diagnostics verify all 15 workstreams', () => {
  const arbiter = new AirCursorArbiter();
  arbiter.selectConcept('airdeck');
  const results = arbiter.runDiagnostics();
  assert.equal(results.length, 15);
  assert.equal(results.every((r) => r.passed), true);
});
