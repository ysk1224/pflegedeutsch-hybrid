import { assessIntegrity } from '../../integrity.js';

// Items and labels were authored after the v0.9 rule freeze at 9920e5d.
// They are distinct from the original 36 development items. These engineering
// labels are not independent bilingual clinical annotations.
const accepted = [
  ['patient', 'Ich kriege schlecht Luft, wenn ich gehe.'],
  ['patient', 'Beim Gehen fällt mir das Atmen schwer.'],
  ['patient', 'Wenn ich spazieren gehe, gerate ich außer Atem.'],
  ['patient', 'Zu Fuß werde ich kurzatmig.'],
  ['patient', 'Beim Gehen habe ich Mühe zu atmen.'],
  ['patient', 'Wenn ich gehe, bekomme ich wenig Luft.'],
  ['patient', 'Beim Gehen fehlt mir die Luft.'],
  ['patient', 'Auf einem Spaziergang muss ich nach Luft ringen.'],
  ['handover', 'Die Patientin erklärt, dass ihr beim Gehen die Luft fehlt.'],
  ['handover', 'Beim Gehen tritt laut der Patientin Dyspnoe auf.'],
  ['handover', 'Nach Aussage der Patientin besteht Atemnot beim Gehen.'],
  ['handover', 'Die Patientin gibt an, beim Spazieren kurzatmig zu werden.'],
  ['handover', 'Die Patientin teilt mit, dass sie beim Gehen atemlos wird.'],
  ['handover', 'Die Patientin sagt, zu Fuß werde sie kurzatmig.'],
  ['note', 'Laut der Patientin: Dyspnoe zu Fuß.'],
  ['note', 'Nach Angaben der Patientin: Luftnot beim Spazieren.'],
  ['note', 'Eigenangabe: Beim Gehen kurzatmig.'],
  ['note', 'Subjektiv: Beim Gehen gerät sie außer Atem.'],
  ['note', 'Patientenangaben: Beim Gehen fällt das Atmen schwer.'],
  ['note', 'Gehen löst nach Aussage der Patientin Luftnot aus.']
];
const incorrect = [
  ['patient', 'Ich werde kurzatmig.', 'trigger-unconfirmed'],
  ['handover', 'Die Patientin schildert Atemnot.', 'trigger-unconfirmed'],
  ['note', 'Patientenangabe: Beim Spazieren.', 'symptom-unconfirmed'],
  ['handover', 'Laut Patientin beim Gehen.', 'symptom-unconfirmed'],
  ['note', 'Beim Gehen tritt Atemnot auf.', 'attribution-unconfirmed'],
  ['handover', 'Die Patientin zeigte beim Gehen Luftnot.', 'observation'],
  ['note', 'Das Team hat beim Gehen Kurzatmigkeit festgestellt.', 'observation'],
  ['note', 'Beim Gehen war Luftnot sichtbar.', 'observation'],
  ['patient', 'Im Schlaf werde ich kurzatmig.', 'changed-trigger'],
  ['handover', 'Nach Aussage der Patientin tritt beim Radfahren Atemnot auf.', 'changed-trigger'],
  ['note', 'Patientenangabe: Luftnot nach dem Gehen.', 'changed-trigger'],
  ['patient', 'Wenn ich gehe, bekomme ich keine Atemnot.', 'negated-fact'],
  ['handover', 'Die Patientin beschreibt Luftnot beim Gehen. Der Puls ist 120.', 'measurement'],
  ['note', 'Patientenangabe: Dyspnoe zu Fuß. Glukose 12 mmol/L.', 'measurement'],
  ['note', 'Laut Patientin Atemnot beim Gehen. Sauerstoffsättigung vierundneunzig Prozent.', 'measurement'],
  ['handover', 'Beim Gehen Luftnot laut Patientin. Atemnot bei einem Asthmaanfall.', 'diagnosis'],
  ['note', 'Eigenangabe: Dyspnoe beim Gehen. Verdacht auf Pneumothorax.', 'diagnosis'],
  ['handover', 'Die Patientin meldet beim Gehen Luftnot. Es besteht eine Hypoxämie.', 'diagnosis'],
  ['note', 'Subjektiv: Atemnot beim Gehen. Seit drei Monaten.', 'unsupported-duration'],
  ['handover', 'Laut Patientin Atemnot beim Gehen und Brustdruck.', 'unsupported-symptom']
];
const uncertain = [
  ['patient', 'Beim Gehen strengt mich etwas an.'],
  ['handover', 'Die Patientin berichtet beim Gehen über Luftnot.'],
  ['note', 'Bericht über unklare Beschwerden bei Bewegung.'],
  ['handover', 'Patientin meldet Luftnot beim Gehen?']
];
const records = Object.entries({ accepted, incorrect, uncertain }).flatMap(([group, cases]) =>
  cases.map(([stage, draft, expectedType]) => {
    const { factual, grammar } = assessIntegrity(draft, stage);
    return { group, stage, draft, expectedType, factual: factual.state, grammar: grammar.state,
      issues: factual.issues.map(issue => issue.id) };
  }));
const tally = (group, state) => records.filter(row => row.group === group && row.factual === state).length;
const metrics = {
  accepted: [tally('accepted', 'verified'), accepted.length],
  falseRevision: [tally('accepted', 'revise'), accepted.length],
  falseAcceptance: [tally('incorrect', 'verified'), incorrect.length],
  exactErrorType: [records.filter(row => row.group === 'incorrect' && row.issues.includes(row.expectedType)).length, incorrect.length],
  incorrectSentForReview: [tally('incorrect', 'review'), incorrect.length],
  uncertainHeld: [tally('uncertain', 'review'), uncertain.length]
};
console.log(JSON.stringify({ metrics, records }, null, 2));
