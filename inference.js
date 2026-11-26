import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';
import { feedbackSchema, readFeedback, verifiedSource, withDeadline } from './feedback.js';

const env = import.meta.env;
export const configured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID &&
  env.VITE_FIREBASE_APP_ID && env.VITE_RECAPTCHA_SITE_KEY);

let ai;
const models = new Map();

function getModel(allowCloud) {
  if (!ai) {
    const app = initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID
    });
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    ai = getAI(app, { backend: new GoogleAIBackend() });
  }
  if (!models.has(allowCloud)) {
    models.set(allowCloud, getGenerativeModel(ai, {
      mode: allowCloud ? InferenceMode.PREFER_ON_DEVICE : InferenceMode.ONLY_ON_DEVICE,
      inCloudParams: {
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 650,
          responseMimeType: 'application/json',
          responseSchema: feedbackSchema
        }
      },
      onDeviceParams: {
        createOptions: {
          expectedInputs: [{ type: 'text', languages: ['en', 'de'] }],
          expectedOutputs: [{ type: 'text', languages: ['en', 'de'] }]
        },
        promptOptions: { responseConstraint: feedbackSchema }
      }
    }));
  }
  return models.get(allowCloud);
}

export async function requestFeedback(prompt, allowCloud, { onDownload, onGenerate, onFirstText }) {
  const started = performance.now();
  const model = getModel(allowCloud);
  let preparing = true;
  try {
    const preparation = model.initializeDeviceModel(value => {
      if (preparing && Number.isFinite(value)) onDownload(Math.round(value * 100));
    });
    if (allowCloud) {
      // Firebase can use the cloud while the device model is still downloading.
      preparation.catch(() => {});
    } else {
      await withDeadline(preparation, 180_000);
    }
  } finally {
    preparing = false;
  }

  const controller = new AbortController();
  const generationStarted = performance.now();
  onGenerate();
  const streamFeedback = async () => {
    const stream = await model.generateContentStream(prompt, { signal: controller.signal });
    // The SDK exposes separate stream and aggregate promises. Observe both on errors.
    stream.response.catch(() => {});
    let first = null;
    for await (const chunk of stream.stream) {
      if (controller.signal.aborted) break;
      if (first === null && chunk.text()) {
        first = (performance.now() - generationStarted) / 1000;
        onFirstText();
      }
    }
    if (controller.signal.aborted) throw new Error('feedback-timeout');
    const response = await stream.response;
    return {
      feedback: readFeedback(response.text()),
      source: verifiedSource(response.inferenceSource, allowCloud),
      first,
      total: (performance.now() - started) / 1000
    };
  };

  try {
    return await withDeadline(streamFeedback(), 45_000, () => controller.abort());
  } catch (error) {
    if (controller.signal.aborted) models.delete(allowCloud);
    throw error;
  }
}
