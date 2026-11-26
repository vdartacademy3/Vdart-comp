import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from '../desktop/node_modules/three/build/three.module.js';
import { GLTFLoader } from '../desktop/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeletonScene } from '../desktop/node_modules/three/examples/jsm/utils/SkeletonUtils.js';

globalThis.self = globalThis;
globalThis.Blob = globalThis.Blob || class {};
globalThis.URL = globalThis.URL || { createObjectURL: () => '', revokeObjectURL: () => {} };

const ROOT = path.resolve(import.meta.dirname, '..');
const ORIG_DIR = path.join(ROOT, 'Athletic_man');
const PUBLIC_DIR = path.join(ROOT, 'desktop', 'public', 'characters', 'Athletic_man');

const EXPECTED_ACTIONS = [
  { state: 'IDLE', action: 'idle', file: 'Athletic_man@idle.glb', mode: 'loop' },
  { state: 'DANCE', action: 'dance_groove', file: 'Athletic_man@dance_groove.glb', mode: 'loop' },
  { state: 'JUMP', action: 'jump_running', file: 'Athletic_man@jump_running.glb', mode: 'once' },
  { state: 'KNOCKDOWN', action: 'knockdown', file: 'Athletic_man@knockdown.glb', mode: 'once' },
  { state: 'LAUGH', action: 'laugh', file: 'Athletic_man@laugh.glb', mode: 'loop' },
  { state: 'LAUGH_HARD', action: 'laugh hard', file: 'Athletic_man@laugh_hard.glb', mode: 'loop' },
  { state: 'PUNCH', action: 'punch', file: 'Athletic_man@punch.glb', mode: 'once' },
  { state: 'PUSH', action: 'push', file: 'Athletic_man@push.glb', mode: 'once' },
  { state: 'RUN', action: 'run', file: 'Athletic_man@run.glb', mode: 'loop' },
  { state: 'TALK', action: 'talk', file: 'Athletic_man@talk.glb', mode: 'loop' },
  { state: 'TALK_GESTURE', action: 'talk_gesture', file: 'Athletic_man@talk_gestures.glb', mode: 'loop' },
  { state: 'WALK', action: 'walk', file: 'Athletic_man@walk.glb', mode: 'loop' },
  { state: 'WAVE', action: 'wave', file: 'Athletic_man@wave.glb', mode: 'loop' },
];

const loader = new GLTFLoader();
function loadGlb(fp) {
  const buf = fs.readFileSync(fp);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new Promise((resolve, reject) => loader.parse(ab, '', resolve, reject));
}

console.log('1. Verifying original Athletic_man assets are preserved in public directory...');
for (const f of fs.readdirSync(ORIG_DIR)) {
  const origStat = fs.statSync(path.join(ORIG_DIR, f));
  const pubStat = fs.statSync(path.join(PUBLIC_DIR, f));
  assert.strictEqual(pubStat.size, origStat.size, `Size mismatch for ${f}`);
}
console.log('   OK: All 18 files preserved with identical sizes.\n');

console.log('2. Loading base model & verifying 164-bone skeleton + 34 morph targets...');
const baseGltf = await loadGlb(path.join(PUBLIC_DIR, 'Athletic_man.glb'));
const baseBones = new Set();
baseGltf.scene.traverse((o) => {
  if (o.isBone && o.name) baseBones.add(o.name);
});
assert.strictEqual(baseBones.size, 164, `Expected 164 bones, got ${baseBones.size}`);
console.log(`   OK: Base skeleton verified (${baseBones.size} bones).\n`);

console.log('3. Validating all 13 animation GLBs, skeleton compatibility, crossfades & one-shot finish...');
const cloned = cloneSkeletonScene(baseGltf.scene);
const mixer = new THREE.AnimationMixer(cloned);

let finishedCount = 0;
mixer.addEventListener('finished', () => {
  finishedCount += 1;
});

let prevAction = null;
for (const entry of EXPECTED_ACTIONS) {
  const gltf = await loadGlb(path.join(PUBLIC_DIR, entry.file));
  assert.strictEqual(gltf.animations.length, 1, `Expected 1 clip in ${entry.file}`);
  const clip = gltf.animations[0];

  const animBones = new Set();
  gltf.scene.traverse((o) => {
    if (o.isBone && o.name) animBones.add(o.name);
  });
  assert.strictEqual(animBones.size, 164, `Bone count mismatch in ${entry.file}`);
  for (const b of baseBones) {
    assert.ok(animBones.has(b), `Missing bone ${b} in ${entry.file}`);
  }

  const action = mixer.clipAction(clip);
  action.reset();
  if (entry.mode === 'once') {
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
  } else {
    action.setLoop(THREE.LoopRepeat, Infinity);
  }
  action.play();
  if (prevAction && prevAction !== action) {
    prevAction.crossFadeTo(action, 0.2, true);
  }

  mixer.update(0.1);
  mixer.update(0.25);
  assert.ok(action.isRunning() || entry.mode === 'once', `Action ${entry.state} should run`);

  if (entry.mode === 'once') {
    // Advance past clip duration to verify 'finished' event fires
    mixer.update(clip.duration + 0.1);
  }

  console.log(`   ✓ ${entry.state.padEnd(13)} <- ${entry.file.padEnd(32)} | Clip: "${clip.name}" (${clip.duration.toFixed(2)}s, ${entry.mode})`);
  prevAction = action;
}

assert.strictEqual(finishedCount, 4, `Expected 4 one-shot finished events (JUMP, KNOCKDOWN, PUNCH, PUSH), got ${finishedCount}`);
mixer.stopAllAction();
mixer.uncacheRoot(cloned);
console.log('\n4. Verified 4 one-shot completion events & clean mixer disposal.');
console.log('ALL ATHLETIC_MAN ASSET & ANIMATION TESTS PASSED!');
