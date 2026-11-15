import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import * as xb from 'xrblocks';
import {AirCursorArbiter, buildPairingUri} from './aircursor/arbiter.ts';
import {HARDWARE_CONCEPTS, VISION_GESTURES} from './aircursor/concepts.ts';
import type {
  AirCursorSnapshot,
  HardwareConceptId,
} from './aircursor/types.ts';
import {CursorArenaRig} from './three/cursorArena.ts';
import {
  buildHardwareConceptModel,
  type BuiltHardwareAssembly,
} from './three/hardwareModels.ts';
import {
  createHardwareMaterialSet,
  type HardwareMaterialSet,
} from './three/materials.ts';
import {ControlDock} from './ui/controlDock.ts';
import {SpatialCardsRig} from './ui/spatialCards.ts';

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = String(
      gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER)
    );
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(
      rendererStr
    );
  } catch {
    return false;
  }
}

export class AirCursorStudio extends xb.Script {
  private readonly arbiter = new AirCursorArbiter();
  private readonly isSoftwareGl = detectSoftwareWebGL();
  private materials!: HardwareMaterialSet;
  private modelViewer!: xb.ModelViewer;
  private activeAssembly: BuiltHardwareAssembly | null = null;
  private activeConceptId: HardwareConceptId | null = null;
  private cursorArena!: CursorArenaRig;
  private spatialCards!: SpatialCardsRig;
  private controlDock!: ControlDock;

  private explodeProgress = 0;
  private elapsedSeconds = 0;
  private validatedUiOnce = false;
  private envRenderTarget: THREE.WebGLRenderTarget | null = null;
  private unsubscribeArbiter: (() => void) | null = null;

  private readonly onKeyDownBound = (event: KeyboardEvent) =>
    this.handleKeyDown(event);
  private readonly onPointerMoveBound = (event: PointerEvent) =>
    this.handlePointerMove(event);

  init(): void {
    const renderer = xb.core.renderer;
    const maxAnisotropy =
      renderer instanceof THREE.WebGLRenderer
        ? Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
        : 4;

    if (renderer instanceof THREE.WebGLRenderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      if (this.isSoftwareGl) {
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
      }

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      this.envRenderTarget = pmrem.fromScene(roomEnv, 0.04);
      xb.core.scene.environment = this.envRenderTarget.texture;
      roomEnv.dispose();
      pmrem.dispose();
    }

    // Warm directional key light + cool sky/ground HemisphereLight fill
    const hemiLight = new THREE.HemisphereLight(0xc8e0ff, 0x1e293b, 1.8);
    this.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.8);
    keyLight.position.set(1.6, 3.4, 1.8);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.2;
      keyLight.shadow.camera.far = 8;
      keyLight.shadow.camera.left = -1.5;
      keyLight.shadow.camera.right = 1.5;
      keyLight.shadow.camera.top = 1.5;
      keyLight.shadow.camera.bottom = -1.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.4);
    rimLight.position.set(-1.8, 2.1, -2.4);
    this.add(rimLight);

    this.materials = createHardwareMaterialSet(
      maxAnisotropy,
      this.isSoftwareGl
    );

    // Center Hardware ModelViewer
    this.modelViewer = new xb.ModelViewer({
      origin: 'center',
      castShadow: !this.isSoftwareGl,
      receiveShadow: !this.isSoftwareGl,
      manipulation: {
        actions: {
          rotate: {axis: 'y'},
          scale: {minScale: 0.65, maxScale: 1.85},
        },
        handle: {action: xb.ManipulationAction.Rotate},
      },
    });
    this.modelViewer.name = 'AirCursor Hardware Showcase';
    this.modelViewer.position.set(0, 1.29, -1.12);
    this.add(this.modelViewer);

    // Spatial Arena & Pedestal
    this.cursorArena = new CursorArenaRig();
    this.add(this.cursorArena);

    // Spatial UI Cards (Left & Right)
    this.spatialCards = new SpatialCardsRig(this.materials.qrTexture, {
      onSelectSource: (id) => this.arbiter.setActiveSource(id),
      onToggleSourceConnected: (id) => this.arbiter.toggleSourceConnected(id),
      onTriggerGesture: (id) => this.arbiter.triggerGesture(id),
      onSensitivityChange: (val) => this.arbiter.setSensitivity(val),
      onSelectConcept: (id) => this.arbiter.selectConcept(id),
      onSelectFinish: (id) => this.arbiter.selectFinish(id),
      onToggleExploded: () => this.arbiter.toggleExploded(),
      onSelectRightTab: (tab) => this.arbiter.setRightTab(tab),
      onRunDiagnostics: () => this.arbiter.runDiagnostics(),
    });
    this.add(this.spatialCards.leftCard, this.spatialCards.rightCard);

    // Collapsible Accessible Bottom Dock
    this.controlDock = new ControlDock({
      onSelectConcept: (id) => this.arbiter.selectConcept(id),
      onSelectFinish: (id) => this.arbiter.selectFinish(id),
      onToggleExploded: () => this.arbiter.toggleExploded(),
      onToggleAutoRotate: () => this.arbiter.toggleAutoRotate(),
      onSelectSource: (id) => this.arbiter.setActiveSource(id),
      onToggleSourceConnected: (id) => this.arbiter.toggleSourceConnected(id),
      onTriggerGesture: (id) => this.arbiter.triggerGesture(id),
      onSelectRightTab: (tab) => this.arbiter.setRightTab(tab),
      onRunDiagnostics: () => this.arbiter.runDiagnostics(),
      onToggleDock: () =>
        this.arbiter.setDockCollapsed(!this.arbiter.getSnapshot().dockCollapsed),
    });

    this.unsubscribeArbiter = this.arbiter.subscribe((snapshot) =>
      this.applySnapshot(snapshot)
    );
    this.applySnapshot(this.arbiter.getSnapshot());

    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
  }

  private applySnapshot(snapshot: AirCursorSnapshot): void {
    this.materials.updateFinish(snapshot.selectedFinishId);
    this.materials.updateOledDisplay(
      snapshot.activeSource,
      snapshot.activeGesture,
      96
    );
    this.materials.updateQrPayload(
      buildPairingUri(snapshot.pairingHost, snapshot.pairingPort)
    );

    if (this.activeConceptId !== snapshot.selectedConceptId) {
      this.swapHardwareConcept(snapshot.selectedConceptId);
    }

    this.cursorArena.setCursorNormalized(
      snapshot.cursorX,
      snapshot.cursorY,
      snapshot.activeGesture
    );

    this.spatialCards.sync(snapshot);
    this.controlDock.sync(snapshot);
  }

  private swapHardwareConcept(conceptId: HardwareConceptId): void {
    const previous = this.activeAssembly;
    const next = buildHardwareConceptModel(conceptId, this.materials);
    next.root.scale.setScalar(1.32);
    this.activeAssembly = next;
    this.activeConceptId = conceptId;
    this.modelViewer.setContent(next.root);
    if (previous) {
      previous.dispose();
    }
  }

  override update(): void {
    const dt = Math.min(Math.max(xb.getDeltaTime(), 0.001), 0.05);
    this.elapsedSeconds += dt;
    const snapshot = this.arbiter.getSnapshot();

    // Smoothly damp Exploded CAD separation across all composite parts
    const targetExplode = snapshot.exploded ? 1 : 0;
    this.explodeProgress = THREE.MathUtils.damp(
      this.explodeProgress,
      targetExplode,
      8,
      dt
    );

    if (this.activeAssembly) {
      for (const part of this.activeAssembly.parts) {
        part.object.position
          .copy(part.basePos)
          .addScaledVector(part.explodeOffset, this.explodeProgress);
      }
      if (snapshot.autoRotate) {
        this.activeAssembly.root.rotation.y += dt * 0.45;
      }
    }

    this.cursorArena.update(dt, this.elapsedSeconds);

    if (!this.validatedUiOnce && this.elapsedSeconds > 0.5) {
      this.validatedUiOnce = true;
      const report = xb.ui?.validate?.();
      if (report && report.ready && !report.ok) {
        console.warn('Spatial UI validation issues:', report.issues);
      }
    }
  }

  override onSelectStart(event: xb.SelectEvent): void {
    if (!event.target) {
      this.arbiter.triggerGesture('pinch');
    }
  }

  override onSelectEnd(event: xb.SelectEvent): void {
    if (!event.target) {
      this.arbiter.triggerGesture('palm');
    }
  }

  private handlePointerMove(event: PointerEvent): void {
    if (window.innerWidth <= 0 || window.innerHeight <= 0) return;
    const nx = (event.clientX / window.innerWidth) * 2 - 1;
    const ny = -((event.clientY / window.innerHeight) * 2 - 1);
    this.cursorArena.setCursorNormalized(
      nx,
      ny,
      this.arbiter.getSnapshot().activeGesture
    );
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '5') {
      const idx = Number(key) - 1;
      const concept = HARDWARE_CONCEPTS[idx];
      if (concept) this.arbiter.selectConcept(concept.id);
    } else if (key === 'e') {
      this.arbiter.toggleExploded();
    } else if (key === 'a') {
      this.arbiter.toggleAutoRotate();
    } else if (key === 'h') {
      this.arbiter.setDockCollapsed(!this.arbiter.getSnapshot().dockCollapsed);
    } else if (key === 't') {
      this.arbiter.runDiagnostics();
    } else if (key === 'g') {
      const current = this.arbiter.getSnapshot().activeGesture;
      const idx = VISION_GESTURES.findIndex((g) => g.id === current);
      const next = VISION_GESTURES[(idx + 1) % VISION_GESTURES.length];
      this.arbiter.triggerGesture(next.id);
    }
  }

  override dispose(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    this.unsubscribeArbiter?.();
    this.activeAssembly?.dispose();
    this.materials?.dispose();
    this.cursorArena?.dispose();
    this.controlDock?.dispose();
    this.envRenderTarget?.dispose();
    super.dispose();
  }
}
