import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';
import { feedbackSchema, withDeadline } from './feedback.js';
import { configured, firebaseOptions, generateFeedback, languageOptions, readDeviceAvailability } from './inference.js';

// This document denies all connections through CSP. If an SDK regression tries a
// cloud route, the HTTP request is blocked even after a supported status check.
let model;

function getDeviceModel() {
  if (!model) {
    const app = initializeApp(firebaseOptions, 'pflege-isolated-device');
    model = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      mode: InferenceMode.ONLY_ON_DEVICE,
      onDeviceParams: {
        createOptions: languageOptions,
        promptOptions: { responseConstraint: feedbackSchema }
      }
    });
  }
  return model;
}

window.pflegeDevice = Object.freeze({
  availability: readDeviceAvailability,

  async feedback(prompt, { onDownload, onGenerate, onFirstText }) {
    if (!configured) throw new Error('device-not-configured');
    const started = performance.now();
    const status = await readDeviceAvailability();
    if (!['available', 'downloadable', 'downloading'].includes(status)) {
      throw new Error('device-unavailable');
    }
    const deviceModel = getDeviceModel();
    if (status !== 'available') {
      let active = true;
      try {
        await withDeadline(deviceModel.initializeDeviceModel(value => {
          if (active && Number.isFinite(value)) onDownload(Math.round(value * 100));
        }), 180_000);
      } finally {
        active = false;
      }
    }
    if (await readDeviceAvailability() !== 'available') throw new Error('device-unavailable');
    onGenerate();
    try {
      const result = await generateFeedback(deviceModel, prompt, 'device', { onFirstText });
      return { ...result, total: (performance.now() - started) / 1000 };
    } catch (error) {
      if (error.message === 'feedback-timeout') model = undefined;
      throw error;
    }
  }
});
