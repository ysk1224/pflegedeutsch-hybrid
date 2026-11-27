import { assessIntegrity } from '../../integrity.js';

// Authored and labelled after bbdeaa3 was frozen, before running this file.
// Synthetic engineering examples for this one case. Keep as regression data
// if the rules are changed using any of these results.
const valid = [
  ['patient', 'Wenn ich zu Fuß gehe, kriege ich kaum Luft.'],
  ['patient', 'Ich ringe nach Luft, sobald ich spazieren gehe.'],
  ['patient', 'Während des Gehens wird mir das Atmen schwer.'],
  ['patient', 'Beim Gehen bin ich kurzatmig.'],
  ['patient', 'Ich kriege wenig Luft beim Spazierengehen.'],
  ['patient', 'Auf dem Spaziergang atme ich schwer.'],
  ['patient', 'Zu Fuß habe ich Probleme mit dem Atmen.'],
  ['patient', 'Ich komme beim Gehen außer Atem.'],
  ['patient', 'Beim Gehen verspüre ich Atemnot.'],
  ['patient', 'Sobald ich gehe, werde ich atemlos.'],
  ['handover', 'Die Patientin sagt, dass sie beim Gehen kaum Luft bekommt.'],
  ['handover', 'Der Patient schildert Atembeschwerden bei Gehbelastung.'],
  ['handover', 'Nach seinen Angaben tritt beim Gehen Luftnot auf.'],
  ['handover', 'Der Patient meldet, dass ihm zu Fuß die Luft fehlt.'],
  ['handover', 'Die Patientin gibt an, beim Spazierengehen kurzatmig zu werden.'],
  ['handover', 'Laut der Patientin bekommt sie beim Gehen schlecht Luft.'],
  ['handover', 'Der Patient klagt über Dyspnoe beim Spazieren.'],
  ['handover', 'Beim Gehen hat sie Mühe zu atmen, berichtet die Patientin.'],
  ['handover', 'Die Patientin berichtet, beim Gehen nach Luft zu ringen.'],
  ['handover', 'Sie berichtet über Atemnot beim Gehen.'],
  ['note', 'Patientenangabe: Atembeschwerden beim Spaziergang.'],
  ['note', 'Laut Patientin: Atemlosigkeit beim Gehen.'],
  ['note', 'Subjektiv: Kurzatmigkeit beim Spazierengehen.'],
  ['note', 'Nach eigenen Angaben: Luftnot zu Fuß.'],
  ['note', 'Patient: „Zu Fuß habe ich Atemprobleme.“'],
  ['note', 'Eigenangaben: Beim Gehen wird das Atmen schwer.'],
  ['note', 'Atemnot bei Gehbelastung laut Patient.'],
  ['note', 'Patient schildert Atembeschwerden beim Gehen.'],
  ['note', 'Patientin: „Beim Gehen gerate ich außer Atem.“'],
  ['note', 'Atemnot nach Angabe der Patientin beim Spazieren.']
];
const errors = [
  ['patient', 'Ich habe Luftnot.', 'trigger-unconfirmed'],
  ['patient', 'Beim Gehen.', 'symptom-unconfirmed'],
  ['patient', 'Beim Gehen atme ich normal.', 'negated-fact'],
  ['patient', 'Im Liegen bekomme ich kaum Luft.', 'changed-trigger'],
  ['patient', 'Ich bekomme beim Gehen schlecht Luft und habe Auswurf.', 'unsupported-symptom'],
  ['patient', 'Ich habe seit zwei Wochen Atemnot beim Gehen.', 'unsupported-duration'],
  ['patient', 'Beim Gehen bekomme ich keine Luftnot.', 'negated-fact'],
  ['patient', 'Beim Joggen werde ich kurzatmig.', 'changed-trigger'],
  ['handover', 'Die Patientin beschreibt Luftnot.', 'trigger-unconfirmed'],
  ['handover', 'Der Patient berichtet, dass er beim Spazieren geht.', 'symptom-unconfirmed'],
  ['handover', 'Die Patientin berichtete bei der Übergabe über Atemnot beim Gehen und Schwindel.', 'unsupported-symptom'],
  ['handover', 'Die Patientin schildert Atemnot beim Gehen. Puls hundert.', 'measurement'],
  ['handover', 'Der Patient meldet Atemnot beim Gehen. SpO₂ 87 Prozent.', 'measurement'],
  ['handover', 'Die Patientin meldet Luftnot beim Gehen bei bekannter Anämie.', 'diagnosis'],
  ['handover', 'Der Patient meldet, dass er beim Schlafen Atemnot hat.', 'changed-trigger'],
  ['handover', 'Der Patient schildert Atemnot beim Gehen seit heute.', 'unsupported-duration'],
  ['note', 'Beim Gehen fällt das Atmen schwer.', 'attribution-unconfirmed'],
  ['note', 'Kurzatmigkeit beim Spaziergang objektiv festgestellt.', 'observation'],
  ['note', 'Patient berichtet über Atemnot beim Gehen. Atemfrequenz fünfundzwanzig.', 'measurement'],
  ['note', 'Patientin: „Beim Gehen bin ich kurzatmig.“ Verdacht auf respiratorische Insuffizienz.', 'diagnosis'],
  ['note', 'Patient beschreibt Luftnot beim Gehen und Übelkeit.', 'unsupported-symptom'],
  ['note', 'Eigenangabe: Atemnot auf dem Spaziergang seit mehreren Monaten.', 'unsupported-duration'],
  ['note', 'Eigenangabe: Atemnot beim Gehen. Blutdruck 105/65.', 'measurement'],
  ['note', 'Patientenangabe: Beim Gehen keine Kurzatmigkeit.', 'negated-fact']
];
const uncertain = [
  ['patient', 'Beim Gehen merke ich etwas an meiner Atmung.'],
  ['note', 'Atemnot beim Gehen, Quelle noch zu klären.'],
  ['handover', 'Die Patientin erklärt beim Spazieren, dass sie kurzatmig wird.'],
  ['note', 'Patientin: „Atemnot beim Gehen?“'],
  ['handover', 'Die Patientin berichtet, dass sie geht; Atemnot wurde erwähnt.'],
  ['note', 'Eigenangabe: Unwohlsein beim Gehen.']
];
const dataset = process.argv[2] ? (await import(process.argv[2])).default : { valid, errors, uncertain };
const results = Object.entries(dataset).flatMap(([group, rows]) =>
  rows.map(([stage, draft, expectedIssue]) => {
    const { factual, grammar } = assessIntegrity(draft, stage);
    return { group, draft, stage, expectedIssue, fact: factual.state, grammar: grammar.state,
      issues: factual.issues.map(issue => issue.id) };
  }));
const count = (group, passes) => results.filter(row => row.group === group && passes(row)).length;
const state = (group, name) => count(group, row => row.fact === name);
const metrics = {
  validAccepted: [state('valid', 'verified'), dataset.valid.length],
  validFalseRevision: [state('valid', 'revise'), dataset.valid.length],
  errorsFalseAcceptance: [state('errors', 'verified'), dataset.errors.length],
  errorsExactType: [count('errors', row => row.issues.includes(row.expectedIssue)), dataset.errors.length],
  errorsHeld: [state('errors', 'review'), dataset.errors.length],
  uncertainHeld: [state('uncertain', 'review'), dataset.uncertain.length]
};
console.log(JSON.stringify({ metrics, results }, null, 2));
