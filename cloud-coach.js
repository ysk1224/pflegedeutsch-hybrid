import { initializeApp } from 'firebase/app';
import { getToken, initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';
import { feedbackSchema, withDeadline } from './feedback.js';
import { configured, firebaseOptions, generateFeedback } from './inference.js';

const siteKey = import.meta.env?.VITE_RECAPTCHA_SITE_KEY;
export const cloudConfigured = configured && Boolean(siteKey);

let cloud;

function getCloudService() {
  if (!cloud) {
    const app = initializeApp(firebaseOptions, 'pflege-public-coach');
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: false
    });
    const model = getGenerativeModel(getAI(app, { backend: new GoogleAIBackend() }), {
      mode: InferenceMode.ONLY_IN_CLOUD,
      inCloudParams: {
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
          temperature: 0.2, maxOutputTokens: 420,
          responseMimeType: 'application/json', responseSchema: feedbackSchema
        }
      }
    });
    cloud = { appCheck, model };
  }
  return cloud;
}

const publicTask = Object.freeze({
  audience: 'Explain that first person fits the patient speaking, and attributed third person fits a colleague or the record.',
  attribution: 'Explain the difference between a patient report and a directly observed finding.',
  concise: 'Explain how to express the same case facts in a concise nursing note.'
});

export function buildPublicCoachPrompt(topic) {
  if (typeof topic !== 'string' || !Object.hasOwn(publicTask, topic)) {
    throw new Error('unknown-coach-topic');
  }
  return [
    'You are coaching German for a fictional language exercise. Use only the public case facts supplied here.',
    'The patient reports breathlessness while walking. No measurement, diagnosis or direct observation is supplied.',
    publicTask[topic],
    'Return a JSON object with german (one short German example) and english (up to two explanatory sentences).',
    'Do not add clinical facts, measurements, diagnoses, procedures or treatment recommendations.'
  ].join(' ');
}

export async function requestPublicCoaching(topic, consent) {
  if (consent !== true) throw new Error('cloud-consent-required');
  const prompt = buildPublicCoachPrompt(topic);
  if (!cloudConfigured) throw new Error('cloud-not-configured');
  const { appCheck, model } = getCloudService();
  // The SDK can continue with a dummy App Check token after an error.
  // Require a successful attestation before initiating cloud inference.
  try {
    await withDeadline(getToken(appCheck), 12_000);
  } catch {
    throw new Error('cloud-app-check-failed');
  }
  return generateFeedback(model, prompt, 'cloud');
}
