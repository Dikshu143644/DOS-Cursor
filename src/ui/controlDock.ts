import {
  FINISH_PRESETS,
  getConceptById,
  HARDWARE_CONCEPTS,
  VISION_GESTURES,
} from '../aircursor/concepts.ts';
import type {
  AirCursorSnapshot,
  FinishId,
  HardwareConceptId,
  RightPanelTab,
  TrackingSourceId,
  VisionGestureId,
} from '../aircursor/types.ts';

export interface DockHandlers {
  onSelectConcept: (id: HardwareConceptId) => void;
  onSelectFinish: (id: FinishId) => void;
  onToggleExploded: () => void;
  onToggleAutoRotate: () => void;
  onSelectSource: (id: TrackingSourceId) => void;
  onToggleSourceConnected: (id: TrackingSourceId) => void;
  onTriggerGesture: (id: VisionGestureId) => void;
  onSelectRightTab: (tab: RightPanelTab) => void;
  onRunDiagnostics: () => void;
  onToggleDock: () => void;
}

export class ControlDock {
  readonly root: HTMLElement;
  private readonly toggleBtn: HTMLButtonElement;
  private readonly dockPanel: HTMLElement;
  private readonly statusLine: HTMLElement;
  private readonly conceptBtns = new Map<HardwareConceptId, HTMLButtonElement>();
  private readonly finishBtns = new Map<FinishId, HTMLButtonElement>();
  private readonly sourceBtns = new Map<TrackingSourceId, HTMLButtonElement>();
  private readonly gestureBtns = new Map<VisionGestureId, HTMLButtonElement>();
  private readonly tabBtns = new Map<RightPanelTab, HTMLButtonElement>();
  private readonly explodeBtn: HTMLButtonElement;
  private readonly rotateBtn: HTMLButtonElement;
  private readonly fallbackBtn: HTMLButtonElement;
  private readonly diagBtn: HTMLButtonElement;

  constructor(handlers: DockHandlers) {
    this.root = document.createElement('div');
    this.root.className = 'aircursor-dock-shell';
    this.root.setAttribute('data-testid', 'aircursor-dock-shell');

    // Minimal top-left studio title badge (static, unobstructed center)
    const badge = document.createElement('header');
    badge.className = 'aircursor-top-badge';
    badge.innerHTML = `
      <span class="aircursor-badge-title">AirCursor Universal Studio</span>
      <span class="aircursor-badge-sub" data-testid="aircursor-status-line">AUTOSTART · AIRPODS IMU 60Hz · 15/15 PASS</span>
    `;
    this.statusLine = badge.querySelector('[data-testid="aircursor-status-line"]')!;
    document.body.appendChild(badge);

    // Collapse / Expand handle inline in dock
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.type = 'button';
    this.toggleBtn.className = 'dock-btn dock-btn-sm aircursor-dock-toggle';
    this.toggleBtn.setAttribute('aria-expanded', 'true');
    this.toggleBtn.setAttribute('aria-label', 'Toggle AirCursor Controls');
    this.toggleBtn.textContent = '▾ Hide';
    this.toggleBtn.addEventListener('click', () => handlers.onToggleDock());

    this.dockPanel = document.createElement('nav');
    this.dockPanel.className = 'aircursor-dock';
    this.dockPanel.setAttribute('aria-label', 'AirCursor Control Dock');

    // Single sleek horizontal control row: Concepts + CAD + Finishes + Sources + Gestures + Diagnostics
    const row = document.createElement('div');
    row.className = 'dock-group';

    const shortConceptNames: Record<HardwareConceptId, string> = {
      airring: 'Ring',
      airwand: 'Wand',
      airpebble: 'Pebble',
      airclip: 'Clip',
      airdeck: 'Deck',
    };

    for (const concept of HARDWARE_CONCEPTS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dock-btn';
      btn.textContent = `${concept.index} ${shortConceptNames[concept.id]}`;
      btn.setAttribute('aria-label', `Select ${concept.codeName}`);
      btn.addEventListener('click', () => handlers.onSelectConcept(concept.id));
      this.conceptBtns.set(concept.id, btn);
      row.appendChild(btn);
    }

    const divider1 = document.createElement('span');
    divider1.className = 'dock-divider';
    row.appendChild(divider1);

    this.explodeBtn = document.createElement('button');
    this.explodeBtn.type = 'button';
    this.explodeBtn.className = 'dock-btn';
    this.explodeBtn.textContent = 'Explode (E)';
    this.explodeBtn.setAttribute('aria-label', 'Toggle Exploded CAD View');
    this.explodeBtn.addEventListener('click', () => handlers.onToggleExploded());
    row.appendChild(this.explodeBtn);

    this.rotateBtn = document.createElement('button');
    this.rotateBtn.type = 'button';
    this.rotateBtn.className = 'dock-btn';
    this.rotateBtn.textContent = 'Spin (A)';
    this.rotateBtn.setAttribute('aria-label', 'Toggle Turntable Rotation');
    this.rotateBtn.addEventListener('click', () => handlers.onToggleAutoRotate());
    row.appendChild(this.rotateBtn);

    for (const finish of Object.values(FINISH_PRESETS)) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'dock-swatch';
      swatch.style.backgroundColor = finish.swatchHex;
      swatch.title = `${finish.label} Finish`;
      swatch.setAttribute('aria-label', `Select ${finish.label} finish`);
      swatch.addEventListener('click', () => handlers.onSelectFinish(finish.id));
      this.finishBtns.set(finish.id, swatch);
      row.appendChild(swatch);
    }

    const divider2 = document.createElement('span');
    divider2.className = 'dock-divider';
    row.appendChild(divider2);

    const sourceList: {id: TrackingSourceId; label: string}[] = [
      {id: 'airpods', label: 'AirPods'},
      {id: 'vision', label: 'Vision'},
      {id: 'remote', label: 'Remote'},
    ];
    for (const s of sourceList) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dock-btn dock-btn-sm';
      btn.textContent = s.label;
      btn.setAttribute('aria-label', `Activate ${s.label} source`);
      btn.addEventListener('click', () => handlers.onSelectSource(s.id));
      this.sourceBtns.set(s.id, btn);
      row.appendChild(btn);
    }

    this.fallbackBtn = document.createElement('button');
    this.fallbackBtn.type = 'button';
    this.fallbackBtn.className = 'dock-btn dock-btn-sm';
    this.fallbackBtn.textContent = 'Fallback';
    this.fallbackBtn.setAttribute('aria-label', 'Simulate AirPods disconnect fallback');
    this.fallbackBtn.addEventListener('click', () =>
      handlers.onToggleSourceConnected('airpods')
    );
    row.appendChild(this.fallbackBtn);

    const divider3 = document.createElement('span');
    divider3.className = 'dock-divider';
    row.appendChild(divider3);

    for (const g of VISION_GESTURES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dock-btn dock-btn-sm';
      btn.textContent = g.label.split(' ')[0];
      btn.setAttribute('aria-label', `Trigger ${g.label} gesture`);
      btn.addEventListener('click', () => handlers.onTriggerGesture(g.id));
      this.gestureBtns.set(g.id, btn);
      row.appendChild(btn);
    }

    const divider4 = document.createElement('span');
    divider4.className = 'dock-divider';
    row.appendChild(divider4);

    const tabs: {id: RightPanelTab; label: string; aria: string}[] = [
      {id: 'specs', label: 'CAD', aria: 'CAD'},
      {id: 'matrix', label: 'Subjects', aria: '15 Subjects'},
      {id: 'stack', label: 'Infra', aria: 'Infra'},
    ];
    for (const t of tabs) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dock-btn dock-btn-sm';
      btn.textContent = t.label;
      btn.setAttribute('aria-label', `View ${t.aria} panel`);
      btn.addEventListener('click', () => handlers.onSelectRightTab(t.id));
      this.tabBtns.set(t.id, btn);
      row.appendChild(btn);
    }

    this.diagBtn = document.createElement('button');
    this.diagBtn.type = 'button';
    this.diagBtn.className = 'dock-btn dock-btn-sm dock-btn-accent';
    this.diagBtn.textContent = 'Tests 15/15';
    this.diagBtn.setAttribute('aria-label', 'Run 15-Subject Ecosystem Test Suite');
    this.diagBtn.addEventListener('click', () => handlers.onRunDiagnostics());
    row.appendChild(this.diagBtn);

    this.dockPanel.append(row);
    this.root.append(this.toggleBtn, this.dockPanel);
    document.body.appendChild(this.root);
  }

  sync(snapshot: AirCursorSnapshot): void {
    const concept = getConceptById(snapshot.selectedConceptId);
    const activeSource = snapshot.sources[snapshot.activeSource];

    document.body.setAttribute(
      'data-aircursor-state',
      snapshot.autostartActive ? 'active' : 'standby'
    );
    document.body.setAttribute('data-concept-id', snapshot.selectedConceptId);
    document.body.setAttribute('data-finish', snapshot.selectedFinishId);
    document.body.setAttribute('data-exploded', String(snapshot.exploded));
    document.body.setAttribute('data-source', snapshot.activeSource);
    document.body.setAttribute('data-gesture', snapshot.activeGesture);
    document.body.setAttribute(
      'data-diagnostics-pass',
      String(snapshot.diagnosticsPassCount)
    );
    document.body.setAttribute(
      'data-dock-collapsed',
      String(snapshot.dockCollapsed)
    );

    this.statusLine.textContent = `${concept.codeName} · ${activeSource.label} (${activeSource.sampleRateHz}Hz) · ${snapshot.lastActionLabel} · ${snapshot.diagnosticsPassCount}/15 PASS`;

    this.conceptBtns.forEach((btn, id) => {
      const active = id === snapshot.selectedConceptId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    this.finishBtns.forEach((btn, id) => {
      const active = id === snapshot.selectedFinishId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    this.sourceBtns.forEach((btn, id) => {
      const active = id === snapshot.activeSource;
      const online = snapshot.sources[id].connected;
      btn.classList.toggle('is-active', active);
      btn.classList.toggle('is-offline', !online);
      btn.setAttribute('aria-pressed', String(active));
    });

    this.gestureBtns.forEach((btn, id) => {
      const active = id === snapshot.activeGesture;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    this.tabBtns.forEach((btn, id) => {
      const active = id === snapshot.rightTab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    this.explodeBtn.classList.toggle('is-active', snapshot.exploded);
    this.explodeBtn.setAttribute('aria-pressed', String(snapshot.exploded));

    this.rotateBtn.classList.toggle('is-active', snapshot.autoRotate);
    this.rotateBtn.setAttribute('aria-pressed', String(snapshot.autoRotate));

    this.fallbackBtn.textContent = snapshot.sources.airpods.connected
      ? 'Fallback'
      : 'Reconnect';

    this.diagBtn.textContent = `Tests ${snapshot.diagnosticsPassCount}/15`;

    this.root.classList.toggle('is-collapsed', snapshot.dockCollapsed);
    this.toggleBtn.setAttribute('aria-expanded', String(!snapshot.dockCollapsed));
    this.toggleBtn.textContent = snapshot.dockCollapsed
      ? '▴ Show (H)'
      : '▾ Hide';
  }

  dispose(): void {
    this.root.remove();
    document.querySelector('.aircursor-top-badge')?.remove();
  }
}
