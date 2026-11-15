import * as THREE from 'three';
import {generateQrMatrix} from '../aircursor/arbiter.ts';
import {FINISH_PRESETS} from '../aircursor/concepts.ts';
import type {FinishId, TrackingSourceId, VisionGestureId} from '../aircursor/types.ts';

export interface HardwareMaterialSet {
  primaryShell: THREE.MeshPhysicalMaterial;
  secondaryTrim: THREE.MeshStandardMaterial;
  rubberGrip: THREE.MeshStandardMaterial;
  opticalGlass: THREE.MeshPhysicalMaterial;
  accentMetal: THREE.MeshStandardMaterial;
  emissiveLed: THREE.MeshStandardMaterial;
  oledScreen: THREE.MeshStandardMaterial;
  oledCanvas: HTMLCanvasElement;
  oledContext: CanvasRenderingContext2D | null;
  oledTexture: THREE.CanvasTexture;
  qrTexture: THREE.CanvasTexture;
  brushedBump: THREE.CanvasTexture;
  knurlBump: THREE.CanvasTexture;
  updateFinish: (finishId: FinishId) => void;
  updateOledDisplay: (
    source: TrackingSourceId,
    gesture: VisionGestureId,
    batteryPct: number
  ) => void;
  updateQrPayload: (uri: string) => void;
  dispose: () => void;
}

function createBrushedMetalBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y++) {
      const v = 110 + Math.floor(Math.sin(y * 1.7) * 14 + (Math.random() - 0.5) * 28);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, 256, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

function createKnurlBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#404040';
    ctx.fillRect(0, 0, 256, 256);
    const step = 16;
    for (let y = 0; y < 256; y += step) {
      for (let x = 0; x < 256; x += step) {
        const grad = ctx.createRadialGradient(
          x + step / 2,
          y + step / 2,
          1,
          x + step / 2,
          y + step / 2,
          step * 0.48
        );
        grad.addColorStop(0, '#f0f0f0');
        grad.addColorStop(1, '#303030');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, step, step);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createHardwareMaterialSet(
  maxAnisotropy = 4,
  isSoftwareGl = false
): HardwareMaterialSet {
  const brushedBump = createBrushedMetalBumpTexture(maxAnisotropy);
  const knurlBump = createKnurlBumpTexture(maxAnisotropy);

  const oledCanvas = document.createElement('canvas');
  oledCanvas.width = 256;
  oledCanvas.height = 128;
  const oledContext = oledCanvas.getContext('2d');
  const oledTexture = new THREE.CanvasTexture(oledCanvas);
  oledTexture.colorSpace = THREE.SRGBColorSpace;
  oledTexture.anisotropy = maxAnisotropy;

  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = 256;
  qrCanvas.height = 256;
  const qrContext = qrCanvas.getContext('2d');
  const qrTexture = new THREE.CanvasTexture(qrCanvas);
  qrTexture.colorSpace = THREE.SRGBColorSpace;
  qrTexture.magFilter = THREE.NearestFilter;
  qrTexture.minFilter = THREE.LinearFilter;

  const initial = FINISH_PRESETS.titanium;

  const primaryShell = new THREE.MeshPhysicalMaterial({
    color: initial.primaryColor,
    metalness: initial.metalness,
    roughness: initial.roughness,
    bumpMap: brushedBump,
    bumpScale: 0.0025,
    anisotropy: 0.75,
    clearcoat: 0.35,
    clearcoatRoughness: 0.2,
  });

  const secondaryTrim = new THREE.MeshStandardMaterial({
    color: initial.secondaryColor,
    metalness: 0.35,
    roughness: 0.52,
  });

  const rubberGrip = new THREE.MeshStandardMaterial({
    color: 0x1a1d24,
    metalness: 0.04,
    roughness: 0.84,
    bumpMap: knurlBump,
    bumpScale: 0.004,
  });

  const opticalGlass = new THREE.MeshPhysicalMaterial({
    color: 0x0b1524,
    metalness: 0.05,
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.45,
    transparent: true,
    opacity: isSoftwareGl ? 0.78 : 0.92,
    ior: 1.54,
  });

  const accentMetal = new THREE.MeshStandardMaterial({
    color: initial.accentColor,
    metalness: 0.85,
    roughness: 0.2,
  });

  const emissiveLed = new THREE.MeshStandardMaterial({
    color: initial.accentColor,
    emissive: initial.emissiveColor,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.1,
  });

  const oledScreen = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: oledTexture,
    emissive: 0xffffff,
    emissiveMap: oledTexture,
    emissiveIntensity: 0.85,
    roughness: 0.12,
    metalness: 0.1,
  });

  const updateFinish = (finishId: FinishId) => {
    const preset = FINISH_PRESETS[finishId];
    primaryShell.color.setHex(preset.primaryColor);
    primaryShell.metalness = preset.metalness;
    primaryShell.roughness = preset.roughness;
    secondaryTrim.color.setHex(preset.secondaryColor);
    accentMetal.color.setHex(preset.accentColor);
    emissiveLed.color.setHex(preset.accentColor);
    emissiveLed.emissive.setHex(preset.emissiveColor);
  };

  const updateOledDisplay = (
    source: TrackingSourceId,
    gesture: VisionGestureId,
    batteryPct: number
  ) => {
    if (!oledContext) return;
    oledContext.fillStyle = '#070b14';
    oledContext.fillRect(0, 0, 256, 128);

    oledContext.strokeStyle = '#38bdf8';
    oledContext.lineWidth = 3;
    oledContext.strokeRect(6, 6, 244, 116);

    oledContext.fillStyle = '#38bdf8';
    oledContext.font = 'bold 22px monospace';
    oledContext.textAlign = 'left';
    oledContext.fillText(`AIRDECK  ${batteryPct}%`, 18, 38);

    oledContext.fillStyle = '#e2e8f0';
    oledContext.font = '18px sans-serif';
    oledContext.fillText(`SRC: ${source.toUpperCase()}`, 18, 72);

    oledContext.fillStyle = '#34d399';
    oledContext.fillText(`GESTURE: ${gesture.toUpperCase()}`, 18, 102);

    oledTexture.needsUpdate = true;
  };

  const updateQrPayload = (uri: string) => {
    if (!qrContext) return;
    const matrix = generateQrMatrix(uri, 25);
    const size = matrix.length;
    const pad = 16;
    const cell = (256 - pad * 2) / size;

    qrContext.fillStyle = '#ffffff';
    qrContext.fillRect(0, 0, 256, 256);

    qrContext.fillStyle = '#0f172a';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          qrContext.fillRect(
            Math.round(pad + c * cell),
            Math.round(pad + r * cell),
            Math.ceil(cell),
            Math.ceil(cell)
          );
        }
      }
    }
    qrTexture.needsUpdate = true;
  };

  updateOledDisplay('airpods', 'palm', 96);
  updateQrPayload('http://192.168.1.42:8765/remote.html?ws=8765&token=AIR-8765');

  return {
    primaryShell,
    secondaryTrim,
    rubberGrip,
    opticalGlass,
    accentMetal,
    emissiveLed,
    oledScreen,
    oledCanvas,
    oledContext,
    oledTexture,
    qrTexture,
    brushedBump,
    knurlBump,
    updateFinish,
    updateOledDisplay,
    updateQrPayload,
    dispose: () => {
      primaryShell.dispose();
      secondaryTrim.dispose();
      rubberGrip.dispose();
      opticalGlass.dispose();
      accentMetal.dispose();
      emissiveLed.dispose();
      oledScreen.dispose();
      oledTexture.dispose();
      qrTexture.dispose();
      brushedBump.dispose();
      knurlBump.dispose();
    },
  };
}
