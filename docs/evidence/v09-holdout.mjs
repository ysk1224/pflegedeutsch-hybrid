import { assessIntegrity } from '../../integrity.js';

// Batch A was authored after the rule freeze at 9920e5d and exposed a Unicode issue.
// Batch B was authored after the correction at 14b2784. Its labels were fixed before execution.
// They are distinct from the original 36 development items. These engineering
// labels are not independent bilingual clinical annotations.
const batchA = { accepted: [
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
], incorrect: [
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
], uncertain: [
  ['patient', 'Beim Gehen strengt mich etwas an.'],
  ['handover', 'Die Patientin berichtet beim Gehen über Luftnot.'],
  ['note', 'Bericht über unklare Beschwerden bei Bewegung.'],
  ['handover', 'Patientin meldet Luftnot beim Gehen?']
] };
const batchB = {
  accepted: [
    ['patient', 'Ich bin außer Atem, wenn ich zu Fuß unterwegs bin.'],
    ['patient', 'Beim Spazieren bekomme ich wenig Luft.'],
    ['patient', 'Sobald ich gehe, werde ich kurzatmig.'],
    ['patient', 'Wenn ich gehe, habe ich Schwierigkeiten beim Atmen.'],
    ['patient', 'Beim Gehen habe ich Atemprobleme.'],
    ['patient', 'Wenn ich gehe, fällt mir das Atmen schwer.'],
    ['patient', 'Beim Gehen ringe ich nach Luft.'],
    ['patient', 'Beim Spaziergang wird mir das Atmen mühsam.'],
    ['handover', 'Der Patient schildert Luftnot beim Gehen.'],
    ['handover', 'Die Patientin meldet Atemnot beim Spazieren.'],
    ['handover', 'Laut der Patientin tritt beim Gehen Luftnot auf.'],
    ['handover', 'Die Patientin berichtet über Atemprobleme zu Fuß.'],
    ['handover', 'Der Patient gibt an, beim Gehen außer Atem zu geraten.'],
    ['handover', 'Die Patientin beschreibt Kurzatmigkeit bei Gehbelastung.'],
    ['handover', 'Wenn sie geht, wird sie kurzatmig, sagt die Patientin.'],
    ['handover', 'Beim Spazieren verliert sie den Atem, so die Patientin.'],
    ['note', 'Patientenangaben: Luftnot beim Spazieren.'],
    ['note', 'Subjektiv: Atemprobleme zu Fuß.'],
    ['note', 'Eigenangabe: Beim Gehen schwer zu atmen.'],
    ['note', 'Laut Patientin Dyspnoe bei Gehbelastung.'],
    ['note', 'Nach eigenen Angaben Luftnot beim Gehen.'],
    ['note', 'Patientin schildert Luftnot, wenn sie geht.'],
    ['note', 'Patientin: „Wenn ich gehe, bin ich außer Atem.“'],
    ['note', 'Kurz nach Beginn eines Fußwegs beschriebene Atembeschwerden.']
  ],
  incorrect: [
    ['patient', 'Ich bin kurzatmig.', 'trigger-unconfirmed'],
    ['patient', 'Ich bekomme beim Gehen gut Luft.', 'negated-fact'],
    ['handover', 'Die Patientin schildert Luftnot.', 'trigger-unconfirmed'],
    ['note', 'Subjektiv: Zu Fuß.', 'symptom-unconfirmed'],
    ['note', 'Beim Spazieren tritt Dyspnoe auf.', 'attribution-unconfirmed'],
    ['note', 'Luftnot beim Treppensteigen beobachtet.', 'changed-trigger'],
    ['note', 'Beim Gehen wurde Dyspnoe festgestellt.', 'observation'],
    ['handover', 'Wir beobachteten beim Gehen Atemnot.', 'observation'],
    ['patient', 'Ich bekomme beim Radfahren schlecht Luft.', 'changed-trigger'],
    ['handover', 'Die Patientin meldet Atemnot im Sitzen.', 'changed-trigger'],
    ['patient', 'Beim Gehen verneine ich Atemnot.', 'negated-fact'],
    ['handover', 'Die Patientin schildert Atemnot beim Gehen. Blutzucker 12 mmol/L.', 'measurement'],
    ['note', 'Atemnot zu Fuß laut Patientin. Atemfrequenz 33 pro Minute.', 'measurement'],
    ['note', 'Laut Patientin Luftnot beim Gehen. Puls neunzig.', 'measurement'],
    ['note', 'Eigenangabe: Luftnot beim Gehen. Verdacht auf Asthma.', 'diagnosis'],
    ['handover', 'Der Patient schildert Atemnot beim Gehen durch Herzinsuffizienz.', 'diagnosis'],
    ['note', 'Patientenangabe: Atemnot beim Gehen. Diagnose: Lungenödem.', 'diagnosis'],
    ['note', 'Eigenangabe: Atemnot beim Gehen. Deutliche Zyanose.', 'unsupported-symptom'],
    ['handover', 'Die Patientin schildert Atemnot beim Gehen seit gestern.', 'unsupported-duration'],
    ['patient', 'Wenn ich gehe, bekomme ich schlecht Luft und habe Husten.', 'unsupported-symptom']
  ],
  uncertain: [
    ['patient', 'Ich bin beim Gehen irgendwie verändert.'],
    ['handover', 'Die Patientin schildert beim Gehen Atemnot.'],
    ['note', 'Ich möchte klären, ob die Patientin Atemprobleme schildert.'],
    ['note', 'Luftnot? Gehbelastung?']
  ]
};
const { accepted, incorrect, uncertain } = process.argv.includes('--a') ? batchA : batchB;
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
