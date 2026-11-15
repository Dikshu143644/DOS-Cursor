import * as THREE from 'three';
import type {HardwareConceptId} from '../aircursor/types.ts';
import type {HardwareMaterialSet} from './materials.ts';

export interface ExplodablePart {
  object: THREE.Object3D;
  basePos: THREE.Vector3;
  explodeOffset: THREE.Vector3;
}

export interface BuiltHardwareAssembly {
  root: THREE.Group;
  parts: ExplodablePart[];
  dispose: () => void;
}

function registerPart(
  parent: THREE.Object3D,
  mesh: THREE.Object3D,
  name: string,
  explodeOffset: THREE.Vector3,
  parts: ExplodablePart[]
): void {
  mesh.name = name;
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  parent.add(mesh);
  parts.push({
    object: mesh,
    basePos: mesh.position.clone(),
    explodeOffset,
  });
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const cr = Math.min(r, hw * 0.9, hh * 0.9);
  shape.moveTo(-hw + cr, -hh);
  shape.lineTo(hw - cr, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
  shape.lineTo(hw, hh - cr);
  shape.quadraticCurveTo(hw, hh, hw - cr, hh);
  shape.lineTo(-hw + cr, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
  shape.lineTo(-hw, -hh + cr);
  shape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
  return shape;
}

/**
 * Concept 1: The Cyber-Ring (AirRing Pro) - 7-part composite wearable ring.
 */
function buildAirRing(mats: HardwareMaterialSet): BuiltHardwareAssembly {
  const root = new THREE.Group();
  root.name = 'AirRing Pro';
  const parts: ExplodablePart[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  // 1. Titanium Ring Chassis (Lathe profile for beveled ergonomic cross-section)
  const ringProfile = [
    new THREE.Vector2(0.082, -0.044),
    new THREE.Vector2(0.114, -0.048),
    new THREE.Vector2(0.124, -0.032),
    new THREE.Vector2(0.126, 0.032),
    new THREE.Vector2(0.114, 0.048),
    new THREE.Vector2(0.082, 0.044),
    new THREE.Vector2(0.078, 0.0),
    new THREE.Vector2(0.082, -0.044),
  ];
  const chassisGeo = new THREE.LatheGeometry(ringProfile, 48);
  geometries.push(chassisGeo);
  const chassis = new THREE.Mesh(chassisGeo, mats.primaryShell);
  registerPart(root, chassis, 'Titanium Ring Chassis', new THREE.Vector3(0, 0, 0), parts);

  // 2. Ceramic Inner Liner
  const linerGeo = new THREE.CylinderGeometry(0.081, 0.081, 0.088, 40, 1, true);
  geometries.push(linerGeo);
  const linerMat = mats.secondaryTrim;
  const liner = new THREE.Mesh(linerGeo, linerMat);
  registerPart(root, liner, 'Ceramic Inner Liner', new THREE.Vector3(0, -0.08, 0), parts);

  // 3. Capacitive Outer Touch Bezel
  const bezelGeo = new THREE.TorusGeometry(0.124, 0.01, 16, 48);
  bezelGeo.rotateX(Math.PI / 2);
  geometries.push(bezelGeo);
  const bezel = new THREE.Mesh(bezelGeo, mats.accentMetal);
  registerPart(root, bezel, 'Capacitive Touch Bezel', new THREE.Vector3(0, 0.07, 0), parts);

  // 4. Micro Optical Trackball Saddle + Ball (thumb side)
  const trackPod = new THREE.Group();
  const podBaseGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.064, 0.082, 0.022), {
    depth: 0.028,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.007,
    bevelSegments: 3,
  });
  podBaseGeo.center();
  geometries.push(podBaseGeo);
  const podMesh = new THREE.Mesh(podBaseGeo, mats.secondaryTrim);
  const ballGeo = new THREE.SphereGeometry(0.022, 24, 24);
  geometries.push(ballGeo);
  const ballMesh = new THREE.Mesh(ballGeo, mats.opticalGlass);
  ballMesh.position.z = 0.018;
  trackPod.add(podMesh, ballMesh);
  trackPod.position.set(0, 0.01, 0.13);
  registerPart(root, trackPod, 'Thumb Optical Trackball', new THREE.Vector3(0, 0.03, 0.09), parts);

  // 5. Dual Micro-Switches (Left / Right click rockers)
  const switchGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.032, 0.02, 0.006), {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  switchGeo.center();
  geometries.push(switchGeo);
  const switchGroup = new THREE.Group();
  const leftBtn = new THREE.Mesh(switchGeo, mats.rubberGrip);
  leftBtn.position.set(-0.024, 0, 0);
  const rightBtn = new THREE.Mesh(switchGeo, mats.rubberGrip);
  rightBtn.position.set(0.024, 0, 0);
  switchGroup.add(leftBtn, rightBtn);
  switchGroup.position.set(0, 0.056, 0.102);
  switchGroup.rotation.x = -0.35;
  registerPart(root, switchGroup, 'Left/Right Micro-Switches', new THREE.Vector3(0, 0.09, 0.06), parts);

  // 6. Skin Proximity Sensor Pod
  const proxGeo = new THREE.BoxGeometry(0.036, 0.012, 0.024);
  geometries.push(proxGeo);
  const prox = new THREE.Mesh(proxGeo, mats.opticalGlass);
  prox.position.set(0, -0.008, -0.078);
  registerPart(root, prox, 'Skin Proximity Sensor Pod', new THREE.Vector3(0, -0.04, -0.07), parts);

  // 7. LED Telemetry Arc
  const ledGeo = new THREE.TorusGeometry(0.127, 0.0035, 10, 24, Math.PI * 0.45);
  ledGeo.rotateX(Math.PI / 2);
  ledGeo.rotateY(Math.PI * 0.28);
  geometries.push(ledGeo);
  const led = new THREE.Mesh(ledGeo, mats.emissiveLed);
  led.position.y = 0.022;
  registerPart(root, led, 'LED Telemetry Arc', new THREE.Vector3(0, 0.09, 0.04), parts);

  root.rotation.x = 0.38;
  root.rotation.y = -0.4;

  return {
    root,
    parts,
    dispose: () => geometries.forEach((g) => g.dispose()),
  };
}

/**
 * Concept 2: The Ergonomic Wand (AirWand Elite) - 7-part composite air-mouse baton.
 */
function buildAirWand(mats: HardwareMaterialSet): BuiltHardwareAssembly {
  const root = new THREE.Group();
  root.name = 'AirWand Elite';
  const parts: ExplodablePart[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  // 1. Contoured Aerodynamic Baton Body (LatheGeometry)
  const wandProfile = [
    new THREE.Vector2(0.001, -0.17),
    new THREE.Vector2(0.022, -0.165),
    new THREE.Vector2(0.032, -0.11),
    new THREE.Vector2(0.034, -0.02),
    new THREE.Vector2(0.04, 0.055),
    new THREE.Vector2(0.038, 0.125),
    new THREE.Vector2(0.028, 0.165),
    new THREE.Vector2(0.001, 0.172),
  ];
  const bodyGeo = new THREE.LatheGeometry(wandProfile, 36);
  bodyGeo.scale(0.88, 1, 1.05);
  geometries.push(bodyGeo);
  const body = new THREE.Mesh(bodyGeo, mats.primaryShell);
  registerPart(root, body, 'Aerodynamic Shell Body', new THREE.Vector3(0, 0, 0), parts);

  // 2. Rubberized Ergonomic Grip Sleeve
  const gripProfile = [
    new THREE.Vector2(0.033, -0.115),
    new THREE.Vector2(0.037, -0.04),
    new THREE.Vector2(0.036, 0.025),
    new THREE.Vector2(0.032, 0.025),
    new THREE.Vector2(0.033, -0.115),
  ];
  const gripGeo = new THREE.LatheGeometry(gripProfile, 32);
  gripGeo.scale(0.91, 1, 1.07);
  geometries.push(gripGeo);
  const grip = new THREE.Mesh(gripGeo, mats.rubberGrip);
  registerPart(root, grip, 'Rubberized Grip Sleeve', new THREE.Vector3(0, -0.05, -0.05), parts);

  // 3. Analog Index Finger Trigger
  const trigShape = new THREE.Shape();
  trigShape.moveTo(0, 0);
  trigShape.lineTo(0.038, -0.006);
  trigShape.quadraticCurveTo(0.048, -0.028, 0.024, -0.052);
  trigShape.lineTo(0, -0.04);
  trigShape.closePath();
  const trigGeo = new THREE.ExtrudeGeometry(trigShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  trigGeo.center();
  trigGeo.rotateY(Math.PI / 2);
  geometries.push(trigGeo);
  const trigger = new THREE.Mesh(trigGeo, mats.accentMetal);
  trigger.position.set(0, 0.062, -0.042);
  registerPart(root, trigger, 'Analog Index Trigger', new THREE.Vector3(0, 0.02, -0.075), parts);

  // 4. Knurled Thumb Scroll Wheel
  const wheelGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.014, 24);
  wheelGeo.rotateZ(Math.PI / 2);
  geometries.push(wheelGeo);
  const wheel = new THREE.Mesh(wheelGeo, mats.accentMetal);
  wheel.position.set(0, 0.095, 0.036);
  registerPart(root, wheel, 'Knurled Thumb Scroll Wheel', new THREE.Vector3(0, 0.03, 0.07), parts);

  // 5. 4-Button Action Cluster
  const btnGeo = new THREE.CylinderGeometry(0.009, 0.01, 0.008, 16);
  btnGeo.rotateX(Math.PI / 2);
  geometries.push(btnGeo);
  const cluster = new THREE.Group();
  const offsets: [number, number][] = [
    [0, 0.018],
    [0, -0.018],
    [-0.018, 0],
    [0.018, 0],
  ];
  for (const [bx, by] of offsets) {
    const b = new THREE.Mesh(btnGeo, mats.secondaryTrim);
    b.position.set(bx, by, 0);
    cluster.add(b);
  }
  cluster.position.set(0, 0.042, 0.041);
  registerPart(root, cluster, '4-Button Action Cluster', new THREE.Vector3(0, 0, 0.08), parts);

  // 6. Dual Stem Squeeze Pads
  const padGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.014, 0.068, 0.005), {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });
  padGeo.center();
  padGeo.rotateY(Math.PI / 2);
  geometries.push(padGeo);
  const pads = new THREE.Group();
  const pLeft = new THREE.Mesh(padGeo, mats.emissiveLed);
  pLeft.position.x = -0.035;
  const pRight = new THREE.Mesh(padGeo, mats.emissiveLed);
  pRight.position.x = 0.035;
  pads.add(pLeft, pRight);
  pads.position.set(0, -0.03, 0.005);
  registerPart(root, pads, 'Dual Stem Squeeze Pads', new THREE.Vector3(0.06, 0, 0), parts);

  // 7. Front Optical Emitter Lens Cap
  const lensGeo = new THREE.SphereGeometry(0.025, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
  geometries.push(lensGeo);
  const lens = new THREE.Mesh(lensGeo, mats.opticalGlass);
  lens.position.set(0, 0.155, 0);
  registerPart(root, lens, 'Front Optical Emitter Lens', new THREE.Vector3(0, 0.09, 0), parts);

  root.rotation.x = -0.45;
  root.rotation.z = -0.18;

  return {
    root,
    parts,
    dispose: () => geometries.forEach((g) => g.dispose()),
  };
}

/**
 * Concept 3: The Tactile Pebble Puck (AirPebble Touch) - 7-part composite + InstancedMesh knurling.
 */
function buildAirPebble(mats: HardwareMaterialSet): BuiltHardwareAssembly {
  const root = new THREE.Group();
  root.name = 'AirPebble Touch';
  const parts: ExplodablePart[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  // 1. Magnetic Charging Cradle Base
  const dockGeo = new THREE.CylinderGeometry(0.125, 0.138, 0.022, 48);
  geometries.push(dockGeo);
  const dock = new THREE.Mesh(dockGeo, mats.secondaryTrim);
  dock.position.y = -0.068;
  registerPart(root, dock, 'Magnetic Charging Cradle', new THREE.Vector3(0, -0.09, 0), parts);

  // 2. Lower Puck Chassis & Glide Ring
  const chassisGeo = new THREE.CylinderGeometry(0.114, 0.104, 0.036, 48);
  geometries.push(chassisGeo);
  const chassis = new THREE.Mesh(chassisGeo, mats.primaryShell);
  chassis.position.y = -0.022;
  registerPart(root, chassis, 'Base Chassis & Glide Ring', new THREE.Vector3(0, -0.02, 0), parts);

  // 3. Knurled Aluminum Rotary Edge Ring (uses InstancedMesh for 40 fluted teeth!)
  const rotaryGroup = new THREE.Group();
  const ringBandGeo = new THREE.CylinderGeometry(0.122, 0.122, 0.024, 48);
  geometries.push(ringBandGeo);
  const ringBand = new THREE.Mesh(ringBandGeo, mats.accentMetal);
  rotaryGroup.add(ringBand);

  const toothCount = 40;
  const toothGeo = new THREE.BoxGeometry(0.005, 0.022, 0.006);
  geometries.push(toothGeo);
  const knurlInstanced = new THREE.InstancedMesh(toothGeo, mats.secondaryTrim, toothCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < toothCount; i++) {
    const theta = (i / toothCount) * Math.PI * 2;
    dummy.position.set(Math.cos(theta) * 0.123, 0, Math.sin(theta) * 0.123);
    dummy.rotation.set(0, -theta, 0);
    dummy.updateMatrix();
    knurlInstanced.setMatrixAt(i, dummy.matrix);
  }
  knurlInstanced.instanceMatrix.needsUpdate = true;
  knurlInstanced.computeBoundingSphere();
  rotaryGroup.add(knurlInstanced);
  rotaryGroup.position.y = 0.004;
  registerPart(root, rotaryGroup, 'Knurled Rotary Edge Ring', new THREE.Vector3(0, 0.04, 0), parts);

  // 4. Organic River-Stone Capacitive Multi-Touch Dome (LatheGeometry)
  const domePoints = [
    new THREE.Vector2(0.0, 0.056),
    new THREE.Vector2(0.045, 0.054),
    new THREE.Vector2(0.088, 0.042),
    new THREE.Vector2(0.114, 0.016),
    new THREE.Vector2(0.114, 0.0),
    new THREE.Vector2(0.0, 0.0),
  ];
  const domeGeo = new THREE.LatheGeometry(domePoints, 48);
  domeGeo.scale(1.08, 1, 0.92);
  geometries.push(domeGeo);
  const dome = new THREE.Mesh(domeGeo, mats.primaryShell);
  dome.position.y = 0.016;
  registerPart(root, dome, 'Capacitive Multi-Touch Dome', new THREE.Vector3(0, 0.11, 0), parts);

  // 5. Haptic Actuator Halo Ring
  const haloGeo = new THREE.TorusGeometry(0.095, 0.004, 12, 48);
  haloGeo.rotateX(Math.PI / 2);
  geometries.push(haloGeo);
  const halo = new THREE.Mesh(haloGeo, mats.emissiveLed);
  halo.position.y = 0.018;
  registerPart(root, halo, 'Haptic Actuator Halo', new THREE.Vector3(0, 0.075, 0), parts);

  // 6. Underside Optical Surface Sensor Window
  const sensorGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.008, 24);
  geometries.push(sensorGeo);
  const sensor = new THREE.Mesh(sensorGeo, mats.opticalGlass);
  sensor.position.y = -0.041;
  registerPart(root, sensor, 'Underside Optical Sensor Lens', new THREE.Vector3(0, -0.055, 0), parts);

  // 7. Pogo-Pin Magnetic Contact Array
  const pogoGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.012, 12);
  geometries.push(pogoGeo);
  const pogoGroup = new THREE.Group();
  for (let i = -1; i <= 1; i++) {
    const pin = new THREE.Mesh(pogoGeo, mats.accentMetal);
    pin.position.x = i * 0.022;
    pogoGroup.add(pin);
  }
  pogoGroup.position.set(0, -0.052, 0.06);
  registerPart(root, pogoGroup, 'Pogo-Pin Contact Array', new THREE.Vector3(0, -0.07, 0.06), parts);

  root.rotation.x = 0.25;

  return {
    root,
    parts,
    dispose: () => geometries.forEach((g) => g.dispose()),
  };
}

/**
 * Concept 4: The Cyber-Flick Clip (AirClip Mini) - 7-part wearable clip.
 */
function buildAirClip(mats: HardwareMaterialSet): BuiltHardwareAssembly {
  const root = new THREE.Group();
  root.name = 'AirClip Mini';
  const parts: ExplodablePart[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  // 1. Main Acoustic Capsule Body (Extruded rounded pill)
  const capsuleGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.088, 0.21, 0.042), {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.009,
    bevelSegments: 4,
  });
  capsuleGeo.center();
  geometries.push(capsuleGeo);
  const capsule = new THREE.Mesh(capsuleGeo, mats.primaryShell);
  registerPart(root, capsule, 'Main Acoustic Capsule Body', new THREE.Vector3(0, 0, 0), parts);

  // 2. Spring-Tensioned C-Clip Arm (TubeGeometry)
  const clipCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.07, -0.02),
    new THREE.Vector3(0, 0.085, -0.065),
    new THREE.Vector3(0, 0.01, -0.082),
    new THREE.Vector3(0, -0.085, -0.065),
    new THREE.Vector3(0, -0.095, -0.034),
  ]);
  const clipGeo = new THREE.TubeGeometry(clipCurve, 28, 0.011, 12, false);
  geometries.push(clipGeo);
  const clipArm = new THREE.Mesh(clipGeo, mats.accentMetal);
  registerPart(root, clipArm, 'Spring-Tensioned C-Clip Arm', new THREE.Vector3(0, 0, -0.085), parts);

  // 3. Silicone Collar / Temple Grip Pad
  const padGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.042, 0.11, 0.014), {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  padGeo.center();
  geometries.push(padGeo);
  const pad = new THREE.Mesh(padGeo, mats.rubberGrip);
  pad.position.set(0, -0.01, -0.032);
  registerPart(root, pad, 'Silicone Collar/Temple Pad', new THREE.Vector3(0, 0, -0.045), parts);

  // 4. Chamfered Capacitive Tap Faceplate
  const faceGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.066, 0.145, 0.028), {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
  });
  faceGeo.center();
  geometries.push(faceGeo);
  const faceplate = new THREE.Mesh(faceGeo, mats.opticalGlass);
  faceplate.position.set(0, 0.01, 0.028);
  registerPart(root, faceplate, 'Capacitive Tap Faceplate', new THREE.Vector3(0, 0, 0.08), parts);

  // 5. Micro Tactile Toggle Switch
  const toggleGeo = new THREE.BoxGeometry(0.014, 0.034, 0.016);
  geometries.push(toggleGeo);
  const toggle = new THREE.Mesh(toggleGeo, mats.accentMetal);
  toggle.position.set(0.053, 0.032, 0);
  registerPart(root, toggle, 'Micro Tactile Toggle Switch', new THREE.Vector3(0.065, 0, 0), parts);

  // 6. Voice Mic Perforated Grille
  const grilleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.006, 24);
  grilleGeo.rotateX(Math.PI / 2);
  geometries.push(grilleGeo);
  const grille = new THREE.Mesh(grilleGeo, mats.rubberGrip);
  grille.position.set(0, -0.072, 0.028);
  registerPart(root, grille, 'Voice Mic Perforated Grille', new THREE.Vector3(0, -0.04, 0.065), parts);

  // 7. USB-C & Status LED Collar
  const ledRingGeo = new THREE.TorusGeometry(0.02, 0.004, 10, 24);
  geometries.push(ledRingGeo);
  const ledRing = new THREE.Mesh(ledRingGeo, mats.emissiveLed);
  ledRing.position.set(0, 0.068, 0.028);
  registerPart(root, ledRing, 'USB-C & Status LED Collar', new THREE.Vector3(0, 0.05, 0.065), parts);

  root.rotation.y = -0.35;

  return {
    root,
    parts,
    dispose: () => geometries.forEach((g) => g.dispose()),
  };
}

/**
 * Concept 5: The Modular Thumb-Deck (AirDeck Controller) - 7-part asymmetric handheld.
 */
function buildAirDeck(mats: HardwareMaterialSet): BuiltHardwareAssembly {
  const root = new THREE.Group();
  root.name = 'AirDeck Controller';
  const parts: ExplodablePart[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  // 1. Asymmetric Palm-Contoured Chassis
  const deckShape = new THREE.Shape();
  deckShape.moveTo(-0.075, -0.115);
  deckShape.quadraticCurveTo(-0.092, -0.02, -0.082, 0.095);
  deckShape.quadraticCurveTo(-0.065, 0.132, 0, 0.132);
  deckShape.quadraticCurveTo(0.068, 0.132, 0.086, 0.082);
  deckShape.quadraticCurveTo(0.098, -0.02, 0.078, -0.115);
  deckShape.quadraticCurveTo(0, -0.134, -0.075, -0.115);

  const deckGeo = new THREE.ExtrudeGeometry(deckShape, {
    depth: 0.042,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 4,
  });
  deckGeo.center();
  geometries.push(deckGeo);
  const deckBody = new THREE.Mesh(deckGeo, mats.primaryShell);
  registerPart(root, deckBody, 'Asymmetric Palm Chassis', new THREE.Vector3(0, 0, 0), parts);

  // 2. Textured Side Grip Inserts
  const gripGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.02, 0.13, 0.008), {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  gripGeo.center();
  geometries.push(gripGeo);
  const grips = new THREE.Group();
  const gLeft = new THREE.Mesh(gripGeo, mats.rubberGrip);
  gLeft.position.set(-0.088, -0.025, 0);
  const gRight = new THREE.Mesh(gripGeo, mats.rubberGrip);
  gRight.position.set(0.088, -0.025, 0);
  grips.add(gLeft, gRight);
  registerPart(root, grips, 'Textured Side Grip Inserts', new THREE.Vector3(0.065, 0, 0), parts);

  // 3. Miniature Hall-Effect Thumb Joystick / Trackpad
  const joyGroup = new THREE.Group();
  const collarGeo = new THREE.TorusGeometry(0.032, 0.005, 12, 32);
  const stemGeo = new THREE.CylinderGeometry(0.012, 0.014, 0.022, 20);
  stemGeo.rotateX(Math.PI / 2);
  const capGeo = new THREE.CylinderGeometry(0.026, 0.022, 0.01, 24);
  capGeo.rotateX(Math.PI / 2);
  geometries.push(collarGeo, stemGeo, capGeo);
  const collar = new THREE.Mesh(collarGeo, mats.accentMetal);
  const stem = new THREE.Mesh(stemGeo, mats.secondaryTrim);
  stem.position.z = 0.01;
  const cap = new THREE.Mesh(capGeo, mats.rubberGrip);
  cap.position.z = 0.022;
  joyGroup.add(collar, stem, cap);
  joyGroup.position.set(-0.022, 0.022, 0.032);
  registerPart(root, joyGroup, 'Hall-Effect Thumb Joystick', new THREE.Vector3(0, 0.02, 0.085), parts);

  // 4. Dual Shoulder Bumper Triggers (L1 / R1)
  const bumperGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.056, 0.022, 0.009), {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  bumperGeo.center();
  geometries.push(bumperGeo);
  const bumpers = new THREE.Group();
  const l1 = new THREE.Mesh(bumperGeo, mats.accentMetal);
  l1.position.set(-0.044, 0.135, 0);
  l1.rotation.z = 0.14;
  const r1 = new THREE.Mesh(bumperGeo, mats.accentMetal);
  r1.position.set(0.044, 0.135, 0);
  r1.rotation.z = -0.14;
  bumpers.add(l1, r1);
  registerPart(root, bumpers, 'Dual Shoulder Bumpers (L/R)', new THREE.Vector3(0, 0.08, 0), parts);

  // 5. OLED Battery & Mode Pill (uses procedural CanvasTexture!)
  const oledFrameGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.092, 0.046, 0.014), {
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });
  oledFrameGeo.center();
  const oledScreenGeo = new THREE.PlaneGeometry(0.08, 0.038);
  geometries.push(oledFrameGeo, oledScreenGeo);
  const oledGroup = new THREE.Group();
  const frameMesh = new THREE.Mesh(oledFrameGeo, mats.secondaryTrim);
  const screenMesh = new THREE.Mesh(oledScreenGeo, mats.oledScreen);
  screenMesh.position.z = 0.006;
  oledGroup.add(frameMesh, screenMesh);
  oledGroup.position.set(0.004, 0.086, 0.032);
  registerPart(root, oledGroup, 'OLED Battery & Mode Pill', new THREE.Vector3(0, 0.04, 0.075), parts);

  // 6. Knurled Side Scroll-Roller Assembly
  const rollerGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.048, 24);
  geometries.push(rollerGeo);
  const roller = new THREE.Mesh(rollerGeo, mats.accentMetal);
  roller.position.set(0.092, 0.045, 0.004);
  registerPart(root, roller, 'Side Scroll-Roller Assembly', new THREE.Vector3(0.075, 0, 0), parts);

  // 7. Precision D-Action Pad
  const actionGeo = new THREE.CylinderGeometry(0.011, 0.012, 0.01, 16);
  actionGeo.rotateX(Math.PI / 2);
  geometries.push(actionGeo);
  const actions = new THREE.Group();
  const a1 = new THREE.Mesh(actionGeo, mats.emissiveLed);
  a1.position.set(0, 0.016, 0);
  const a2 = new THREE.Mesh(actionGeo, mats.secondaryTrim);
  a2.position.set(0, -0.016, 0);
  actions.add(a1, a2);
  actions.position.set(0.038, -0.045, 0.032);
  registerPart(root, actions, 'Precision D-Action Pad', new THREE.Vector3(0, -0.03, 0.075), parts);

  root.rotation.x = -0.35;

  return {
    root,
    parts,
    dispose: () => geometries.forEach((g) => g.dispose()),
  };
}

export function buildHardwareConceptModel(
  conceptId: HardwareConceptId,
  mats: HardwareMaterialSet
): BuiltHardwareAssembly {
  switch (conceptId) {
    case 'airring':
      return buildAirRing(mats);
    case 'airwand':
      return buildAirWand(mats);
    case 'airpebble':
      return buildAirPebble(mats);
    case 'airclip':
      return buildAirClip(mats);
    case 'airdeck':
      return buildAirDeck(mats);
  }
}
