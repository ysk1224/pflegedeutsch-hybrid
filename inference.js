import { readFeedback, sourceKind, withDeadline } from './feedback.js';

const env = import.meta.env ?? {};
export const firebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
};
export const configured = Boolean(firebaseOptions.apiKey && firebaseOptions.projectId && firebaseOptions.appId);
export const languageOptions = {
  expectedInputs: [{ type: 'text', languages: ['en', 'de'] }],
  expectedOutputs: [{ type: 'text', languages: ['en', 'de'] }]
};

export async function readDeviceAvailability(provider = globalThis.LanguageModel) {
  if (typeof provider?.availability !== 'function' || typeof provider?.create !== 'function') {
    return 'unsupported';
  }
  try {
    const status = await withDeadline(provider.availability(languageOptions), 4_000);
    if (['available', 'downloadable', 'downloading', 'unavailable'].includes(status)) return status;
  } catch {
    // A blocked or unresponsive capability check does not authorize generation.
  }
  return 'unknown';
}

export async function generateFeedback(model, prompt, expectedSource, { onFirstText = () => {}, readResponse = readFeedback } = {}) {
  const controller = new AbortController();
  const started = performance.now();
  const collect = async () => {
    const result = await model.generateContentStream(prompt, { signal: controller.signal });
    result.response.catch(() => {});
    let first = null;
    for await (const chunk of result.stream) {
      if (controller.signal.aborted) break;
      if (first === null && chunk.text()) {
        first = (performance.now() - started) / 1000;
        onFirstText();
      }
    }
    if (controller.signal.aborted) throw new Error('feedback-timeout');
    const response = await result.response;
    const source = sourceKind(response.inferenceSource);
    if (source !== expectedSource) throw new Error('unexpected-source');
    return { feedback: readResponse(response.text()), source, first };
  };
  return withDeadline(collect(), 45_000, () => controller.abort());
}
