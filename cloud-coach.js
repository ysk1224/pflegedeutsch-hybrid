import { initializeApp } from 'firebase/app';
import { getToken, initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';
import { withDeadline } from './feedback.js';
import { caseFacts, integrityStages } from './integrity.js';
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
          temperature: 0, maxOutputTokens: 96,
          responseMimeType: 'application/json', responseSchema: choiceSchema
        }
      }
    });
    cloud = { appCheck, model };
  }
  return cloud;
}

const [patient, handover, note] = integrityStages;
const publicTask = Object.freeze({
  audience: {
    instruction: 'Choose an example that helps learners compare patient language with attributed speech.',
    guidance: 'A patient can speak in the first person. A colleague’s handover names the patient as the source of the report.',
    examples: { A: patient.sample, B: handover.sample }
  },
  attribution: {
    instruction: 'Choose the clearest example for explaining a patient report versus a direct observation.',
    guidance: 'Attribute the symptom to the patient. The case supplies no direct observation or measured finding.',
    examples: { A: handover.sample, B: note.sample }
  },
  concise: {
    instruction: 'Choose how to express the same case facts in a concise nursing note.',
    guidance: 'Document the source concisely and keep the walking trigger in the record.',
    examples: { A: note.sample, B: note.accepted[2] }
  }
});

const choiceSchema = {
  type: 'object',
  properties: { choice: { type: 'string', format: 'enum', enum: ['A', 'B'] } },
  required: ['choice']
};

function getTopic(topic) {
  if (typeof topic !== 'string' || !Object.hasOwn(publicTask, topic)) {
    throw new Error('unknown-coach-topic');
  }
  return publicTask[topic];
}

export function buildPublicCoachPrompt(topic) {
  const task = getTopic(topic);
  return [
    'Choose a German example for this public fictional language exercise.',
    caseFacts,
    task.instruction,
    ...Object.entries(task.examples).map(([choice, example]) => `${choice}: ${example}`),
    'Return one JSON object with the choice set to A or B.'
  ].join(' ');
}

export function readPublicCoachChoice(topic, text) {
  const task = getTopic(topic);
  let response;
  try {
    response = JSON.parse(text);
  } catch {
    throw new Error('feedback-format');
  }
  if (!response || Object.keys(response).length !== 1 ||
      typeof response.choice !== 'string' || !Object.hasOwn(task.examples, response.choice)) {
    throw new Error('feedback-format');
  }
  return { german: task.examples[response.choice], english: task.guidance };
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
  return generateFeedback(model, prompt, 'cloud', { readResponse: text => readPublicCoachChoice(topic, text) });
}
