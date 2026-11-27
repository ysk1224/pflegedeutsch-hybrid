import { initializeApp } from 'firebase/app';
import { getToken, initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';
import { withDeadline } from './feedback.js';
import { buildPublicCoachPrompt, cloudDrillSchema, readPublicCoachDrill } from './cloud-drill.js';
export { buildPublicCoachPrompt } from './cloud-drill.js';
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
          temperature: 0.35, maxOutputTokens: 512,
          responseMimeType: 'application/json', responseSchema: cloudDrillSchema
        }
      }
    });
    cloud = { appCheck, model };
  }
  return cloud;
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
  const options = { readResponse: text => readPublicCoachDrill(topic, text), timeout: 20_000 };
  try {
    return await generateFeedback(model, prompt, 'cloud', options);
  } catch (error) {
    if (!['feedback-format', 'unverified-example'].includes(error.message)) throw error;
    return generateFeedback(model, buildPublicCoachPrompt(topic, true), 'cloud', options);
  }
}
