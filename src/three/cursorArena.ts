import * as THREE from 'three';
import {VISION_GESTURES} from '../aircursor/concepts.ts';
import type {VisionGestureId} from '../aircursor/types.ts';
import {createRadialShadowTexture} from './materials.ts';

/**
 * Spatial 3D Cursor Arena & Studio Pedestal providing instant visual feedback
 * for Subject 01 (Autostart Arbiter), Subject 02 (Vision Gestures), and
 * Subject 03/04 (Web Remote Cursor Telemetry).
 */
export class CursorArenaRig extends THREE.Group {
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];
  private readonly textures: THREE.Texture[] = [];

  private readonly cursorOrb: THREE.Mesh;
  private readonly cursorHalo: THREE.Mesh;
  private readonly orbMaterial: THREE.MeshStandardMaterial;
  private readonly haloMaterial: THREE.MeshBasicMaterial;
  private readonly targetPos = new THREE.Vector3(0, 1.58, -1.04);
  private readonly currentPos = new THREE.Vector3(0, 1.58, -1.04);
  private targetScale = 1;
  private currentScale = 1;

  constructor() {
    super();
    this.name = 'AirCursor Spatial Arena';

    // Studio Pedestal beneath center ModelViewer (at y = 1.09, z = -1.12)
    const pedestalGeo = new THREE.CylinderGeometry(0.24, 0.27, 0.036, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x161b26,
      metalness: 0.72,
      roughness: 0.3,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, 1.08, -1.12);
    pedestal.receiveShadow = true;
    pedestal.xb = {pointerEvents: 'none'};

    const ringGeo = new THREE.TorusGeometry(0.245, 0.004, 12, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const pedestalRing = new THREE.Mesh(ringGeo, ringMat);
    pedestalRing.position.set(0, 1.1, -1.12);
    pedestalRing.xb = {pointerEvents: 'none'};

    const shadowTex = createRadialShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(0.44, 0.44);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.position.set(0, 1.102, -1.12);
    contactShadow.xb = {pointerEvents: 'none'};

    // Floating Spatial AirCursor Orb + Gesture Halo
    const orbGeo = new THREE.SphereGeometry(0.015, 24, 24);
    this.orbMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.5,
      roughness: 0.15,
      metalness: 0.2,
    });
    this.cursorOrb = new THREE.Mesh(orbGeo, this.orbMaterial);
    this.cursorOrb.position.copy(this.currentPos);
    this.cursorOrb.xb = {pointerEvents: 'none'};

    const haloGeo = new THREE.TorusGeometry(0.026, 0.0028, 12, 32);
    this.haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.78,
    });
    this.cursorHalo = new THREE.Mesh(haloGeo, this.haloMaterial);
    this.cursorHalo.position.copy(this.currentPos);
    this.cursorHalo.xb = {pointerEvents: 'none'};

    this.geometries.push(pedestalGeo, ringGeo, shadowGeo, orbGeo, haloGeo);
    this.materials.push(
      pedestalMat,
      ringMat,
      shadowMat,
      this.orbMaterial,
      this.haloMaterial
    );
    this.textures.push(shadowTex);

    this.add(pedestal, pedestalRing, contactShadow, this.cursorOrb, this.cursorHalo);
  }

  setCursorNormalized(nx: number, ny: number, gesture: VisionGestureId): void {
    this.targetPos.set(nx * 0.34, 1.58 + ny * 0.12, -1.0);
    const spec =
      VISION_GESTURES.find((g) => g.id === gesture) ?? VISION_GESTURES[0];
    this.orbMaterial.color.set(spec.accentHex);
    this.orbMaterial.emissive.set(spec.accentHex);
    this.haloMaterial.color.set(spec.accentHex);
    this.targetScale = gesture === 'pinch' ? 0.68 : gesture === 'fist' ? 1.38 : 1.0;
  }

  update(dt: number, elapsed: number): void {
    const safeDt = Math.min(Math.max(dt, 0.001), 0.05);
    const alpha = 1 - Math.exp(-10 * safeDt);
    this.currentPos.lerp(this.targetPos, alpha);
    this.currentScale = THREE.MathUtils.damp(
      this.currentScale,
      this.targetScale,
      12,
      safeDt
    );

    this.cursorOrb.position.copy(this.currentPos);
    this.cursorOrb.position.y += Math.sin(elapsed * 2.2) * 0.006;
    this.cursorOrb.scale.setScalar(this.currentScale);

    this.cursorHalo.position.copy(this.cursorOrb.position);
    this.cursorHalo.rotation.z = elapsed * 1.4;
    this.cursorHalo.scale.setScalar(this.currentScale * (1 + Math.sin(elapsed * 3) * 0.06));
  }

  dispose(): void {
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
  }
}
