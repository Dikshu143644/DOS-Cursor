import * as xb from 'xrblocks';
import {AirCursorStudio} from './AirCursorStudio.ts';

function start(): void {
  const options = new xb.Options();
  options.setAppTitle('AirCursor Universal Studio');
  options.setAppDescription(
    '15-Subject Universal Control Ecosystem & 5 Procedural Hardware Remote Concepts'
  );
  options.enableReticles();
  options.enableHandRays();
  options.xrButton.showEnterSimulatorButton = true;

  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') {
    options.xrButton.alwaysAutostartSimulator = true;
  }

  xb.add(new AirCursorStudio());
  void xb.init(options);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
