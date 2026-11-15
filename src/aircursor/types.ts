export type TrackingSourceId = 'airpods' | 'vision' | 'remote';

export type VisionGestureId = 'palm' | 'pinch' | 'fist' | 'peace';

export type HardwareConceptId =
  | 'airring'
  | 'airwand'
  | 'airpebble'
  | 'airclip'
  | 'airdeck';

export type FinishId = 'titanium' | 'obsidian' | 'cobalt' | 'ceramic';

export type RightPanelTab = 'specs' | 'matrix' | 'stack';

export interface TrackingSourceInfo {
  id: TrackingSourceId;
  label: string;
  priority: number;
  protocol: string;
  sampleRateHz: number;
  connected: boolean;
}

export interface VisionGestureSpec {
  id: VisionGestureId;
  label: string;
  action: string;
  icon: string;
  accentHex: string;
}

export interface HardwareConceptSpec {
  id: HardwareConceptId;
  index: number;
  codeName: string;
  title: string;
  tagline: string;
  massGrams: number;
  dimensionsMm: string;
  formFactor: string;
  controls: string[];
  sensors: string;
  bestFor: string;
  blenderScriptTarget: string;
  partNames: string[];
}

export interface FinishPreset {
  id: FinishId;
  label: string;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  emissiveColor: number;
  metalness: number;
  roughness: number;
  swatchHex: string;
}

export interface SubjectWorkstream {
  number: string;
  name: string;
  responsibility: string;
  artifacts: string;
  status: 'Active' | 'Verified';
}

export interface DiagnosticResult {
  subjectNumber: string;
  name: string;
  passed: boolean;
  latencyMs: number;
  detail: string;
}

export interface AirCursorSnapshot {
  autostartActive: boolean;
  activeSource: TrackingSourceId;
  sources: Record<TrackingSourceId, TrackingSourceInfo>;
  activeGesture: VisionGestureId;
  cursorX: number;
  cursorY: number;
  sensitivity: number;
  smoothing: number;
  selectedConceptId: HardwareConceptId;
  selectedFinishId: FinishId;
  exploded: boolean;
  autoRotate: boolean;
  rightTab: RightPanelTab;
  dockCollapsed: boolean;
  pairingPort: number;
  pairingHost: string;
  lastActionLabel: string;
  diagnostics: DiagnosticResult[];
  diagnosticsPassCount: number;
}
