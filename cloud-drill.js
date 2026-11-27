import { assessIntegrity, caseFacts } from './integrity.js';

const patientVoice = /^(?:Beim (?:Gehen|Spazieren) (?:bekomme ich schlecht Luft|werde ich kurzatmig|gerate ich außer Atem)|Ich (?:bekomme beim (?:Gehen|Spazieren) schlecht Luft|werde beim (?:Gehen|Spazieren) kurzatmig|gerate beim (?:Gehen|Spazieren) außer Atem))\.?$/u;
const handoverVoice = /^(?:Die Patientin|Der Patient) (?<source>berichtet über|schildert|beschreibt) (?<symptom>Atemnot|Luftnot|Dyspnoe) (?<trigger>beim Gehen|beim Spazieren)\.?$/u;
const noteVoice = /^(?<source>Patientenangabe|Eigenangabe|Laut Patientin|Laut Patient|Subjektiv):? (?<symptom>Atemnot|Luftnot|Dyspnoe) (?<trigger>beim Gehen|beim Spazieren)\.?$/u;

const tasks = Object.freeze({
  audience: {
    first: 'patient', second: 'handover',
    purpose: 'Compare the patient’s own words with what a colleague should hear.',
    guidance: 'The handover identifies the report as coming from the patient and retains what triggered the symptom.'
  },
  attribution: {
    first: 'handover', second: 'note',
    purpose: 'Reframe the handover as a note, preserving the source.',
    guidance: 'An objective nursing record may include a subjective symptom if the source is clearly marked.'
  },
  concise: {
    first: 'handover', second: 'note',
    purpose: 'Compress a full handover into a brief source-attributed nursing note.',
    guidance: 'A concise note can omit the full sentence structure while keeping the symptom, trigger and source.'
  }
});

const styles = {
  patient: {
    title: 'Patient voice', pattern: patientVoice,
    instructions: 'Start with “Beim Gehen”, “Beim Spazieren” or “Ich”. Use “bekomme … schlecht Luft”, “werde … kurzatmig” or “gerate … außer Atem”.'
  },
  handover: {
    title: 'Colleague handover', pattern: handoverVoice,
    instructions: 'Start with “Die Patientin” or “Der Patient”. Follow with “berichtet über”, “schildert” or “beschreibt”. Then use “Atemnot”, “Luftnot” or “Dyspnoe” followed by “beim Gehen” or “beim Spazieren”.'
  },
  note: {
    title: 'Nursing record', pattern: noteVoice,
    instructions: 'Start with “Patientenangabe:”, “Eigenangabe:”, “Laut Patientin” or “Laut Patient”. Follow with “Atemnot”, “Luftnot” or “Dyspnoe” and “beim Gehen” or “beim Spazieren”.'
  }
};

export const cloudDrillSchema = {
  type: 'object',
  properties: { first: { type: 'string' }, second: { type: 'string' } },
  required: ['first', 'second']
};

function taskFor(topic) {
  if (typeof topic !== 'string' || !Object.hasOwn(tasks, topic)) throw new Error('unknown-coach-topic');
  return tasks[topic];
}

export function buildPublicCoachPrompt(topic, repair = false) {
  const task = taskFor(topic);
  return [
    'Compose two short German examples for this fictional clinical language drill.',
    caseFacts,
    task.purpose,
    'Use the same symptom term and walking phrase across the examples when the two registers allow it.',
    `First: ${styles[task.first].instructions}`,
    `Second: ${styles[task.second].instructions}`,
    'Use the listed constructions only. Return JSON with first and second, with neither labels nor explanations.',
    repair ? 'This is a format repair. Prefer beim Gehen, Atemnot and the simplest source phrasing.' : ''
  ].join(' ').trim();
}

function readLine(text, stage) {
  if (typeof text !== 'string' || text.length > 160) throw new Error('feedback-format');
  const sentence = text.normalize('NFC').trim();
  const parts = styles[stage].pattern.exec(sentence);
  if (!parts || assessIntegrity(sentence, stage).factual.state !== 'verified') throw new Error('unverified-example');
  return { sentence, title: styles[stage].title, parts: parts.groups };
}

export function readPublicCoachDrill(topic, text) {
  const task = taskFor(topic);
  let response;
  try {
    response = JSON.parse(text);
  } catch {
    throw new Error('feedback-format');
  }
  if (!response || Object.keys(response).length !== 2) throw new Error('feedback-format');
  const first = readLine(response.first, task.first);
  const second = readLine(response.second, task.second);
  return {
    lines: [first, second],
    guidance: task.guidance,
    question: 'Which phrase in the second example shows where the information came from?',
    options: [second.parts.trigger, second.parts.source, second.parts.symptom],
    answer: second.parts.source
  };
}
