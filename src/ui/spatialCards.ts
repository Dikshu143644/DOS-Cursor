import * as THREE from 'three';
import * as xb from 'xrblocks';
import {buildPairingUri} from '../aircursor/arbiter.ts';
import {
  FINISH_PRESETS,
  getConceptById,
  HARDWARE_CONCEPTS,
  VISION_GESTURES,
} from '../aircursor/concepts.ts';
import {STACK_ARTIFACTS_SUMMARY, SUBJECT_WORKSTREAMS} from '../aircursor/subjects.ts';
import type {
  AirCursorSnapshot,
  FinishId,
  HardwareConceptId,
  RightPanelTab,
  TrackingSourceId,
  VisionGestureId,
} from '../aircursor/types.ts';

export interface SpatialCardsHandlers {
  onSelectSource: (id: TrackingSourceId) => void;
  onToggleSourceConnected: (id: TrackingSourceId) => void;
  onTriggerGesture: (id: VisionGestureId) => void;
  onSensitivityChange: (value: number) => void;
  onSelectConcept: (id: HardwareConceptId) => void;
  onSelectFinish: (id: FinishId) => void;
  onToggleExploded: () => void;
  onSelectRightTab: (tab: RightPanelTab) => void;
  onRunDiagnostics: () => void;
}

export class SpatialCardsRig {
  readonly leftCard: xb.UICard;
  readonly rightCard: xb.UICard;

  private readonly sourceButtons: Record<TrackingSourceId, xb.UIButton>;
  private readonly gestureButtons: Record<VisionGestureId, xb.UIButton>;
  private readonly conceptButtons: Record<HardwareConceptId, xb.UIButton>;
  private readonly tabButtons: Record<RightPanelTab, xb.UIButton>;

  private readonly autostartStatusText: xb.UIText;
  private readonly cursorTelemetryText: xb.UIText;
  private readonly sensitivityLabel: xb.UIText;
  private readonly sensitivitySlider: xb.UISlider;
  private readonly pairingText: xb.UIText;
  private readonly rightTitleText: xb.UIText;
  private readonly rightSubtitleText: xb.UIText;
  private readonly rightBodyText: xb.UIText;
  private readonly explodeButton: xb.UIButton;
  private readonly diagButton: xb.UIButton;

  constructor(qrTexture: THREE.Texture, handlers: SpatialCardsHandlers) {
    // --- LEFT SPATIAL CARD: Arbiter + Vision Gestures + QR Pairing (Subjects 01-04, 14) ---
    this.autostartStatusText = new xb.UIText({
      text: 'AUTOSTART ACTIVE · AIRPODS IMU (60Hz)',
      style: {fontSize: 15, fontWeight: 'bold', color: '#38bdf8'},
    });

    this.cursorTelemetryText = new xb.UIText({
      text: 'Cursor (0.00, 0.00) · Palm Move',
      style: {fontSize: 14, opacity: 0.8},
    });

    const makeSourceBtn = (id: TrackingSourceId, label: string, icon: string) =>
      new xb.UIButton({
        label,
        icon,
        style: {flexGrow: 1, height: 40},
        onClick: () => handlers.onSelectSource(id),
      });

    this.sourceButtons = {
      airpods: makeSourceBtn('airpods', 'AirPods', 'headphones'),
      vision: makeSourceBtn('vision', 'Vision', 'videocam'),
      remote: makeSourceBtn('remote', 'Remote', 'devices'),
    };

    const makeGestureBtn = (id: VisionGestureId, label: string) =>
      new xb.UIButton({
        label,
        style: {flexGrow: 1, height: 38},
        onClick: () => handlers.onTriggerGesture(id),
      });

    this.gestureButtons = {
      palm: makeGestureBtn('palm', 'Palm'),
      pinch: makeGestureBtn('pinch', 'Pinch'),
      fist: makeGestureBtn('fist', 'Fist'),
      peace: makeGestureBtn('peace', 'Peace'),
    };

    this.sensitivityLabel = new xb.UIText({
      text: '1.25x',
      style: {fontSize: 17, fontWeight: 'bold'},
    });

    this.sensitivitySlider = new xb.UISlider({
      ariaLabel: 'Cursor sensitivity',
      min: 0.4,
      max: 2.5,
      step: 0.05,
      value: 1.25,
      style: {width: '100%', height: 38},
      onInput: (val) => handlers.onSensitivityChange(val),
    });

    this.pairingText = new xb.UIText({
      text: 'WS Gateway :8765\nScan QR for Mobile PWA\nTrackpad & Gyro Air-Mouse',
      style: {fontSize: 16, lineHeight: 1.35, whiteSpace: 'pre-line', flexGrow: 1},
    });

    const qrImage = new xb.UIImage({
      src: qrTexture,
      ariaLabel: 'QR code for mobile web remote pairing',
      style: {
        width: 104,
        height: 104,
        borderRadius: 10,
        backgroundColor: '#ffffff',
      },
    });

    this.leftCard = new xb.UICard({
      size: {width: 0.62, height: 'auto'},
      manipulation: true,
      edge: true,
      style: {flexDirection: 'column', gap: 12, padding: 20},
      children: [
        new xb.UIPanel({
          style: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          },
          children: [
            new xb.UIIcon({
              icon: 'mouse',
              style: {width: 28, height: 28, color: '#38bdf8'},
            }),
            new xb.UIText({
              text: 'AirCursor Arbiter & Remote',
              style: {fontSize: 25, fontWeight: 'bold'},
            }),
          ],
        }),
        this.autostartStatusText,
        this.cursorTelemetryText,
        new xb.UIPanel({
          style: {width: '100%', flexDirection: 'row', gap: 8},
          children: [
            this.sourceButtons.airpods,
            this.sourceButtons.vision,
            this.sourceButtons.remote,
          ],
        }),
        new xb.UIButton({
          label: 'Simulate AirPods Disconnect Fallback',
          icon: 'swap_horiz',
          style: {width: '100%', height: 40},
          onClick: () => handlers.onToggleSourceConnected('airpods'),
        }),
        new xb.UIPanel({
          style: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          },
          children: [
            new xb.UIText({text: 'Gain Sensitivity', style: {fontSize: 17}}),
            this.sensitivityLabel,
          ],
        }),
        this.sensitivitySlider,
        new xb.UIText({
          text: 'Subject 02 · Vision Gestures',
          style: {fontSize: 16, fontWeight: 'bold', opacity: 0.88},
        }),
        new xb.UIPanel({
          style: {width: '100%', flexDirection: 'row', gap: 8},
          children: [
            this.gestureButtons.palm,
            this.gestureButtons.pinch,
            this.gestureButtons.fist,
            this.gestureButtons.peace,
          ],
        }),
        new xb.UIPanel({
          style: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 12,
            borderRadius: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
          children: [qrImage, this.pairingText],
        }),
      ],
    });
    this.leftCard.name = 'AirCursor Arbiter Card';
    this.leftCard.position.set(-0.74, 1.42, -1.18);
    this.leftCard.rotation.y = 0.28;

    // --- RIGHT SPATIAL CARD: 5 Hardware Concepts + 15-Subject Matrix + Subject 15 Suite ---
    this.rightTitleText = new xb.UIText({
      text: 'Concept 1: The Cyber-Ring',
      style: {fontSize: 24, fontWeight: 'bold'},
    });
    this.rightSubtitleText = new xb.UIText({
      text: 'AirRing Pro · 11g · 24 x 24 x 9 mm',
      style: {fontSize: 15, opacity: 0.78},
    });

    this.conceptButtons = {
      airring: new xb.UIButton({
        label: '1 Ring',
        style: {flexGrow: 1, height: 38},
        onClick: () => handlers.onSelectConcept('airring'),
      }),
      airwand: new xb.UIButton({
        label: '2 Wand',
        style: {flexGrow: 1, height: 38},
        onClick: () => handlers.onSelectConcept('airwand'),
      }),
      airpebble: new xb.UIButton({
        label: '3 Pebble',
        style: {flexGrow: 1, height: 38},
        onClick: () => handlers.onSelectConcept('airpebble'),
      }),
      airclip: new xb.UIButton({
        label: '4 Clip',
        style: {flexGrow: 1, height: 38},
        onClick: () => handlers.onSelectConcept('airclip'),
      }),
      airdeck: new xb.UIButton({
        label: '5 Deck',
        style: {flexGrow: 1, height: 38},
        onClick: () => handlers.onSelectConcept('airdeck'),
      }),
    };

    this.tabButtons = {
      specs: new xb.UIButton({
        label: 'CAD Specs',
        style: {flexGrow: 1, height: 38},
        onClick: () => handlers.onSelectRightTab('specs'),
      }),
      matrix: new xb.UIButton({
        label: '15 Subjects',
        style: {flexGrow: 1, height: 38},
        onClick: () => handlers.onSelectRightTab('matrix'),
      }),
      stack: new xb.UIButton({
        label: 'Infra & Blender',
        style: {flexGrow: 1, height: 38},
        onClick: () => handlers.onSelectRightTab('stack'),
      }),
    };

    this.rightBodyText = new xb.UIText({
      text: '',
      style: {
        width: '100%',
        fontSize: 16,
        lineHeight: 1.4,
        whiteSpace: 'pre-line',
      },
    });

    const scrollView = new xb.UIScrollView({
      ariaLabel: 'Hardware specifications and 15-subject workstream matrix',
      style: {
        flexGrow: 1,
        flexBasis: 0,
        minHeight: 180,
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
      },
      children: [this.rightBodyText],
    });

    this.explodeButton = new xb.UIButton({
      label: 'Explode CAD',
      icon: 'layers',
      style: {flexGrow: 1, height: 42},
      onClick: () => handlers.onToggleExploded(),
    });

    this.diagButton = new xb.UIButton({
      label: 'Run 15 Tests (15/15)',
      icon: 'verified',
      style: {flexGrow: 1, height: 42},
      onClick: () => handlers.onRunDiagnostics(),
    });

    this.rightCard = new xb.UICard({
      size: {width: 0.64, height: 0.72},
      manipulation: true,
      edge: true,
      style: {flexDirection: 'column', gap: 12, padding: 20},
      children: [
        new xb.UIExitButton(),
        this.rightTitleText,
        this.rightSubtitleText,
        new xb.UIPanel({
          style: {width: '100%', flexDirection: 'row', gap: 6},
          children: HARDWARE_CONCEPTS.map((c) => this.conceptButtons[c.id]),
        }),
        new xb.UIPanel({
          style: {width: '100%', flexDirection: 'row', gap: 8},
          children: [
            this.tabButtons.specs,
            this.tabButtons.matrix,
            this.tabButtons.stack,
          ],
        }),
        scrollView,
        new xb.UIPanel({
          style: {width: '100%', flexDirection: 'row', gap: 10},
          children: [this.explodeButton, this.diagButton],
        }),
      ],
    });
    this.rightCard.name = 'Hardware Concepts & 15-Subject Matrix Card';
    this.rightCard.position.set(0.74, 1.42, -1.18);
    this.rightCard.rotation.y = -0.28;
  }

  sync(snapshot: AirCursorSnapshot): void {
    const activeSource = snapshot.sources[snapshot.activeSource];
    this.autostartStatusText.text = `AUTOSTART ACTIVE · ${activeSource.label.toUpperCase()} (${activeSource.sampleRateHz}Hz)`;

    const activeGesture =
      VISION_GESTURES.find((g) => g.id === snapshot.activeGesture) ??
      VISION_GESTURES[0];
    this.cursorTelemetryText.text = `Cursor (${snapshot.cursorX.toFixed(2)}, ${snapshot.cursorY.toFixed(2)}) · ${activeGesture.label}`;

    this.sensitivityLabel.text = `${snapshot.sensitivity.toFixed(2)}x`;
    this.sensitivitySlider.value = snapshot.sensitivity;

    const uri = buildPairingUri(snapshot.pairingHost, snapshot.pairingPort);
    this.pairingText.text = `WS Gateway :${snapshot.pairingPort}\n${uri.slice(0, 38)}...\nMobile Trackpad & Gyro Ready`;

    (Object.keys(this.sourceButtons) as TrackingSourceId[]).forEach((id) => {
      const btn = this.sourceButtons[id];
      const isSelected = snapshot.activeSource === id;
      const isOnline = snapshot.sources[id].connected;
      btn.style.backgroundColor = isSelected
        ? 'rgba(56, 189, 248, 0.36)'
        : isOnline
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(239, 68, 68, 0.22)';
    });

    (Object.keys(this.gestureButtons) as VisionGestureId[]).forEach((id) => {
      const btn = this.gestureButtons[id];
      btn.style.backgroundColor =
        snapshot.activeGesture === id
          ? 'rgba(52, 211, 153, 0.34)'
          : 'rgba(255, 255, 255, 0.08)';
    });

    const concept = getConceptById(snapshot.selectedConceptId);
    const finish = FINISH_PRESETS[snapshot.selectedFinishId];
    this.rightTitleText.text = concept.title;
    this.rightSubtitleText.text = `${concept.codeName} · ${concept.massGrams}g · ${concept.dimensionsMm} · ${finish.label}`;

    (Object.keys(this.conceptButtons) as HardwareConceptId[]).forEach((id) => {
      this.conceptButtons[id].style.backgroundColor =
        snapshot.selectedConceptId === id
          ? 'rgba(56, 189, 248, 0.36)'
          : 'rgba(255, 255, 255, 0.08)';
    });

    (Object.keys(this.tabButtons) as RightPanelTab[]).forEach((tab) => {
      this.tabButtons[tab].style.backgroundColor =
        snapshot.rightTab === tab
          ? 'rgba(56, 189, 248, 0.36)'
          : 'rgba(255, 255, 255, 0.08)';
    });

    this.explodeButton.label = snapshot.exploded ? 'Assemble CAD' : 'Explode CAD';
    this.explodeButton.style.backgroundColor = snapshot.exploded
      ? 'rgba(245, 158, 11, 0.36)'
      : 'rgba(255, 255, 255, 0.08)';

    this.diagButton.label = `15-Subject Suite (${snapshot.diagnosticsPassCount}/15)`;

    if (snapshot.rightTab === 'specs') {
      this.rightBodyText.text = [
        `FORM FACTOR\n${concept.formFactor}`,
        `\nCONTROLS\n• ${concept.controls.join('\n• ')}`,
        `\nSENSORS\n${concept.sensors}`,
        `\nBEST FOR\n${concept.bestFor}`,
        `\nBLENDER 5.1 CAD TARGET\n${concept.blenderScriptTarget}`,
        `\n7-PART ASSEMBLY\n• ${concept.partNames.join('\n• ')}`,
      ].join('\n');
    } else if (snapshot.rightTab === 'matrix') {
      this.rightBodyText.text = SUBJECT_WORKSTREAMS.map((s) => {
        const diag = snapshot.diagnostics.find((d) => d.subjectNumber === s.number);
        const badge = diag?.passed ? 'PASS' : 'ACTIVE';
        return `${s.number}. ${s.name} [${badge}]\n   ${s.artifacts}`;
      }).join('\n\n');
    } else {
      this.rightBodyText.text = STACK_ARTIFACTS_SUMMARY.map(
        (item) => `${item.title}\n${item.target}\n${item.detail}`
      ).join('\n\n');
    }
  }
}
