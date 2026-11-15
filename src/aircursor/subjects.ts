import type {SubjectWorkstream} from './types.ts';

export const SUBJECT_WORKSTREAMS: readonly SubjectWorkstream[] = [
  {
    number: '01',
    name: 'Core Sensor & Autostart Arbiter',
    responsibility:
      'Auto-starts active tracking immediately on launch; seamless priority switching between AirPods, Webcam, and Remote.',
    artifacts: 'aircursor_core/arbiter.py, windows/app_controller.py',
    status: 'Active',
  },
  {
    number: '02',
    name: 'Vision & Webcam Gesture Engine',
    responsibility:
      'Real-time face/nose gaze tracking and hand gestures (pinch, palm, fist, peace) with zero cloud dependencies.',
    artifacts: 'aircursor_core/vision_tracker.py',
    status: 'Active',
  },
  {
    number: '03',
    name: 'Universal Web Remote Gateway',
    responsibility:
      'High-performance embedded HTTP/WebSocket server on port 8765 for multi-device cursor and gyro sync.',
    artifacts: 'aircursor_core/web_remote_server.py',
    status: 'Active',
  },
  {
    number: '04',
    name: 'Mobile PWA Touchpad & Gyroscope',
    responsibility:
      'Responsive mobile interface with virtual trackpad, gyroscope air-mouse, quick-actions, and haptics.',
    artifacts: 'aircursor_core/static/remote.html, pwa/',
    status: 'Active',
  },
  {
    number: '05',
    name: 'Bluetooth L2CAP & OpenTrack Broker',
    responsibility:
      'Direct Bluetooth LE/L2CAP discovery and automatic UDP 4242 receiver binding for AirPods Pro head tracking.',
    artifacts: 'windows/sensor_receiver.py, linux/bluetooth.py',
    status: 'Active',
  },
  {
    number: '06',
    name: 'Docker Multi-Arch Containerization',
    responsibility:
      'Multi-stage Dockerfile with Xvfb/noVNC virtual display and offline bundled runtime (amd64/arm64).',
    artifacts: 'Dockerfile, docker-compose.yml',
    status: 'Active',
  },
  {
    number: '07',
    name: 'Kubernetes (K8s) Offline Manifests',
    responsibility:
      'Production Helm chart and K8s manifests (Deployment, Service, Ingress) for air-gapped cluster setups.',
    artifacts: 'k8s/deployment.yaml, k8s/service.yaml',
    status: 'Active',
  },
  {
    number: '08',
    name: 'Write-Once-Run-Anywhere Packaging',
    responsibility:
      'Self-contained offline bundling script embedding all static assets, scripts, and runtime wheels.',
    artifacts: 'package_offline.py',
    status: 'Active',
  },
  {
    number: '09',
    name: 'Windows Integration & Tray Controller',
    responsibility:
      'Floating 72x72 HUD, global hotkeys (Ctrl+Alt+T/S/C), registry autostart, and Win32 SendInput.',
    artifacts: 'windows/overlay.py, windows/control_center.py',
    status: 'Active',
  },
  {
    number: '10',
    name: 'Android Native Companion Client',
    responsibility:
      'Native Android AccessibilityService pointer injection and Bluetooth LE remote controller app.',
    artifacts: 'android/AirCursorAccessibilityService.kt',
    status: 'Active',
  },
  {
    number: '11',
    name: 'Linux & macOS Engine',
    responsibility:
      'Linux /dev/uinput virtual HID driver, 2582-byte MTU socket, and macOS CoreGraphics synthetic driver.',
    artifacts: 'linux/uinput.py, macos/driver.py',
    status: 'Active',
  },
  {
    number: '12',
    name: 'Blender 3D Procedural CAD Engine',
    responsibility:
      'Headless Blender 5.1 automation scripts to generate parametric 3D hardware models (.blend, .obj, .stl).',
    artifacts: 'cad/generate_remote_blender.py',
    status: 'Active',
  },
  {
    number: '13',
    name: 'Physical Remote Concept Suite (5 Designs)',
    responsibility:
      '5 distinct ergonomic hardware concepts with multi-angle WebGL 3D previews and CAD spec sheets.',
    artifacts: 'cad/REMOTE_CONCEPTS.md, WebGL 3D Preview',
    status: 'Active',
  },
  {
    number: '14',
    name: 'QR-Code Local Pairing Protocol',
    responsibility:
      'Generates terminal and GUI QR codes for zero-configuration mobile pairing over LAN.',
    artifacts: 'aircursor_core/pairing_qr.py',
    status: 'Active',
  },
  {
    number: '15',
    name: 'Multi-Platform Integration Test Suite',
    responsibility:
      'Unified test harness validating all 15 subjects across heterogeneous desktop, mobile, and XR nodes.',
    artifacts: 'tests/test_universal_ecosystem.py',
    status: 'Active',
  },
];

export const STACK_ARTIFACTS_SUMMARY: readonly {
  title: string;
  target: string;
  detail: string;
}[] = [
  {
    title: 'Subject 01 — Failsafe Autostart',
    target: 'aircursor_core/arbiter.py',
    detail: 'Priority queue: AirPods (UDP 4242) -> Vision Gaze -> Web Remote (WS 8765). Zero standby pause.',
  },
  {
    title: 'Subject 06/07 — Docker & K8s Offline',
    target: 'Dockerfile | k8s/deployment.yaml',
    detail: 'Multi-arch Xvfb + noVNC headless display, port 8765/4242 exposed, zero external CDN/cloud.',
  },
  {
    title: 'Subject 09/10/11 — OS Native Drivers',
    target: 'Win32 | /dev/uinput | CoreGraphics | Android',
    detail: '72x72 floating HUD, Ctrl+Alt+T/S/C hotkeys, 2582-byte MTU L2CAP, AccessibilityService.',
  },
  {
    title: 'Subject 12 — Blender 5.1 CAD Engine',
    target: 'cad/generate_remote_blender.py',
    detail: 'Parametric bmesh bevels, boolean cutouts, knurl arrays -> exports .blend / .obj / .stl.',
  },
];
