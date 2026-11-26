import { configured } from './inference.js';

const frame = document.getElementById('deviceFrame');

function deviceService() {
  return frame.contentWindow?.pflegeDevice;
}

const statusLabels = {
  available: 'On-device model ready',
  downloadable: 'On-device model can be downloaded',
  downloading: 'On-device model is downloading',
  unavailable: 'On-device model unavailable on this device',
  unsupported: 'On-device AI unsupported in this browser',
  unknown: 'On-device readiness could not be confirmed'
};

export async function showDeviceAvailability(status, buttons) {
  if (!configured) {
    status.textContent = 'On-device AI is unconfigured in this build. The local checks are available.';
    return;
  }
  status.textContent = 'Checking on-device support…';
  // The inline iframe starts loading before the application module.
  if (!deviceService()) {
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 3_000);
      frame.addEventListener('load', () => { clearTimeout(timeout); resolve(); }, { once: true });
    });
  }
  const state = await deviceService()?.availability() ?? 'unknown';
  status.textContent = statusLabels[state];
  for (const button of buttons) {
    const ready = ['available', 'downloadable', 'downloading'].includes(state);
    button.dataset.ready = String(ready);
    button.disabled = !ready;
    button.hidden = false;
  }
}

export function requestDeviceFeedback(prompt, status) {
  const service = deviceService();
  if (!service) throw new Error('device-unavailable');
  return service.feedback(prompt, {
    onDownload: percent => { status.textContent = `Preparing the device model · ${percent}%`; },
    onGenerate: () => { status.textContent = 'Generating on-device language feedback…'; },
    onFirstText: () => { status.textContent = 'Checking the response format…'; }
  });
}
