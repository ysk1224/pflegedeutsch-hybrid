// These rules describe only the supplied breathlessness case. Vocabulary is
// checked independently from the three facts so novel sentence order can work
// while unrecognised content stays unverified.
const symptom = /\b(?:atemnot|luftnot|(?:belastungs)?dyspnoe|atemprobleme|atemnotgefühl|kurzatmig(?:keit)?|atemlos(?:igkeit)?|(?:schlecht|wenig|kaum|schwer) luft|außer atem|nach luft (?:ringen|schnappen)|(?:probleme|schwierigkeiten) (?:beim|mit dem) atmen|mühe (?:beim|mit dem|zu) atmen|luft (?:fehlt|fehle)|(?:fehlt|fehle) (?:mir|ihr|ihm) (?:die )?luft|(?:das )?atmen (?:fällt|falle) (?:mir |ihr |ihm )?schwer|(?:fällt|falle) (?:mir|ihr|ihm) (?:das )?atmen schwer|schwer (?:zu )?atmen|(?:das )?atmen schwerf(?:ällt|alle)|f(?:ällt|alle) (?:(?:der patientin|dem patienten) )?(?:das )?atmen schwer)\b/u;
const walking = /(?<!\p{L})(?:gehbelastung|(?:beim|während des|während dem|durch das|beim kurzen) (?:gehen|spazieren(?:gehen)?|fußweg)|(?:zu|beim) fuß(?: gehen)?|(?:wenn|sobald|während) (?:ich|sie|er) (?:gehe|geht|spazieren gehe|spazieren geht)|(?:beim|während) spazieren gehen|(?:zu|beim) fuß unterwegs|beim gang|vom gehen|gehen (?:macht|bereitet|verursacht|löst))(?!\p{L})/u;
const reported = /\b(?:bericht(?:et|en)|schilder(?:t|n)|beschreib(?:t|en)|erklär(?:t|en)|sagt|äußert|klagt|erwähnt|mitteilt|meldet|gibt[^.!?;]*\ban\b|(?:laut|gemäß) (?:der |dem )?patient(?:in|en)?|(?:nach|laut|gemäß) (?:eigenen|ihren|seinen) angaben|(?:nach|laut|gemäß) (?:aussage|angaben) (?:der patientin|des patienten)|patientenangabe[n]?|eigenangabe[n]?|subjektiv|anamnestisch)\b/u;
const clinicalMeasure = /\b(?:spo[2₂]|sauerstoffsättigung|atemfrequenz|atemzüge|puls|herzfrequenz|blutdruck|temperatur|fieber|sättigung|blutzucker|glukose|systolisch|diastolisch)\b/u;
const units = /\d+(?:[.,]\d+)?\s*(?:%|\/\s*min\b|atemzüge\b|mmhg\b|°\s*c\b|mg\s*\/\s*dl\b|mmol\s*\/\s*l\b|bpm\b)/u;
const numeric = /\d/u;
const spelledValue = /\b(?:null|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig|hundert|[a-zäöüß]+und(?:zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig))\b/u;
const diagnosis = /\b(?:asthma|asthmaanfall|pneumonie|lungenentzündung|lungenembolie|copd|herzinsuffizienz|lungenödem|bronchitis|pneumothorax|anämie|hyperventilation|infekt)\b|\bdiagnose\s*:/u;
const observation = /\b(?:beobachtet(?:e|en)?|objektiv|festgestellt|sichtbar|gemessen|zeigte(?:n)?|(?:wir|ich) (?:sahen|sah|beobachteten|beobachtete)|auffällig)\b/u;
const altered = /\b(?:in ruhe|ohne belastung|im (?:liegen|sitzen|schlaf)|beim (?:liegen|sitzen|treppensteigen|rennen|joggen|radfahren)|(?:im|beim) (?:schlafen|stehen)|nach dem gehen|nach belastung|beim sport)\b/u;
const ambiguousTiming = /\b(?:berichtet|schildert|beschreibt|sagt|klagt|äußert) (?:beim|während des) (?:gehen|spazieren)\b/u;
const negative = /\b(?:nicht|nie|ohne|kein(?:e|en|er|es|em)?|verneint|bestreitet)\b/u;
const patient = /\bpatient(?:in|en)?\b/u;
const firstPerson = /\b(?:ich|mir|mich)\b/u;

const coreWords = new Set((
  'atemnot luftnot dyspnoe belastungsdyspnoe atemprobleme atemnotgefühl atem atmen atemlos atemlosigkeit kurzatmig kurzatmigkeit luft außer ' +
  'gehbelastung gehen gehe geht spazieren spazierengehen fuß fußweg gang unterwegs ' +
  'patient patientin patienten patientenangabe patientenangaben eigenangabe eigenangaben subjektiv anamnestisch ' +
  'berichtet berichten schildert schildern beschreibt beschreiben erklärt erklären sagt äußert klagt erwähnt meldet gibt an teilt mit ' +
  'laut nach gemäß eigenen ihren seinen aussage angaben ' +
  'bekomme bekommt bekommen kriege kriegt kriegen fehlt fehle komme kommt kommen werde wird werden bin ist sei gerate gerät geraten ' +
  'trete tritt auftreten auf auftritt auftrete fällt falle fallen schwerfällt schwerfalle atme atmet zu habe hat haben hätte ' +
  'besteht bestehen verspüre verspürt leide leidet merke merkt empfinde empfindet ringe ringt ringen schnappen schnappe schnappt ' +
  'probleme schwierigkeiten mühe schlecht wenig kaum schwer macht machen bereitet verursacht löst eintritt verspüren empfinden fühlt fühle ' +
  'ich mich mir ihr ihm sie er ihre seine der die das dem des den ein eine einer einem ' +
  'wenn sobald während währenddessen beim bei über unter durch dass und es hierbei dabei damit davon vom sich im in zu am um mit nach'
).split(/\s+/u));

const content = text => text.match(/[\p{L}]+/gu) ?? [];
const isSupported = clause => content(clause).every(word => coreWords.has(word));

function getFacts(clause) {
  return {
    symptom: symptom.test(clause),
    walking: walking.test(clause),
    source: reported.test(clause) || /^patient(?:in)?\s*:/u.test(clause) ||
      /\bteilt\b[^.!?;]*\bmit\b/u.test(clause)
  };
}

export function assessCaseFacts(text, stageId, knownAnswer) {
  const clauses = text.split(/[;!?]|\.(?!\d)/u).map(clause => clause.trim()).filter(Boolean);
  const issues = [];
  const add = (id, text) => issues.push({ id, text });

  if (units.test(text) || clauses.some(clause => clinicalMeasure.test(clause) &&
      (numeric.test(clause.replace(/spo[2₂]/gu, '')) || spelledValue.test(clause)))) {
    add('measurement', 'Remove the measurement. The case supplies no vital signs or numeric findings.');
  }
  if (diagnosis.test(text)) {
    add('diagnosis', 'Remove the diagnostic claim. The case supplies the symptom report without a diagnosis.');
  }
  if (clauses.some(clause => observation.test(clause) &&
      (symptom.test(clause) || /\b(?:luft weg(?:blieb|bliebe|bleibt)?|luft fehlte|nicht richtig atmen)\b/u.test(clause)) &&
      !negative.test(clause))) {
    add('observation', 'The patient reported breathlessness. Attribute it to the patient rather than recording it as your own observation.');
  }
  if (clauses.some(clause => symptom.test(clause) && altered.test(clause) && !negative.test(clause))) {
    add('changed-trigger', 'Keep walking as the reported trigger. The case supplies no other trigger.');
  }
  if (clauses.some(clause => (symptom.test(clause) || walking.test(clause)) && negative.test(clause))) {
    add('negated-fact', 'Check the negation. The patient reported breathlessness while walking.');
  }

  const facts = clauses.map(getFacts);
  const supported = clauses.length > 0 && clauses.every(isSupported) && !numeric.test(text) && !/[!?]/u.test(text);
  const supportedClauses = clauses.filter(isSupported);
  if (supportedClauses.length && !knownAnswer && !issues.some(issue => issue.id === 'changed-trigger' || issue.id === 'negated-fact')) {
    const describesSymptom = facts.some(fact => fact.symptom);
    const describesWalking = facts.some(fact => fact.walking);
    const attributesReport = facts.some(fact => fact.source);
    const correctPerspective = stageId === 'patient' ? firstPerson.test(text) && !attributesReport : attributesReport;

    // Supported wording with an explicit error has enough evidence to revise.
    // An unsupported phrase cannot by itself establish an omission.
    if (describesSymptom && !describesWalking && supportedClauses.some(clause => symptom.test(clause))) {
      add('trigger-unconfirmed', 'Add when the patient becomes breathless: while walking.');
    } else if (describesWalking && !describesSymptom && supportedClauses.some(clause => walking.test(clause))) {
      add('symptom-unconfirmed', 'Add that the patient reported breathlessness.');
    } else if (describesSymptom && describesWalking && !correctPerspective) {
      if (stageId !== 'patient' && !patient.test(text) && !firstPerson.test(text)) {
        add('attribution-unconfirmed', 'Make it clear that the symptom was reported by the patient.');
      } else if (stageId === 'patient' && attributesReport && !firstPerson.test(text)) {
        add('patient-perspective', 'Write the patient’s report in the first person.');
      }
    }
  }

  const otherPerson = new Set(['sie', 'er', 'ihr', 'ihm', 'patient', 'patientin', 'patienten']);
  const completeClause = clauses.some((clause, index) => {
    const { symptom, walking, source } = facts[index];
    const attributed = source && (patient.test(clause) || /\b(?:patientenangaben?|eigenangaben?|subjektiv|eigene[nr]? angaben)\b/u.test(clause));
    const quote = /["„“»«]/u.test(clause);
    const perspective = stageId === 'patient'
      ? firstPerson.test(clause) && !source && !content(clause).some(word => otherPerson.has(word))
      : attributed && (!firstPerson.test(clause) || quote);
    return symptom && walking && perspective && !ambiguousTiming.test(clause);
  });
  return { issues, verified: !issues.length && (knownAnswer || (supported && clauses.length === 1 && completeClause)) };
}
