import { assessIntegrity } from '../../integrity.js';

// Labels were assigned from the single fictional source case before running the checker.
// These examples were written for an engineering audit and have no independent clinical adjudication.
const corpus = {
  reference: [
    ['patient', 'Beim Gehen bekomme ich schlecht Luft.'],
    ['patient', 'Wenn ich gehe, bekomme ich schlecht Luft.'],
    ['handover', 'Die Patientin berichtet über Atemnot beim Gehen.'],
    ['handover', 'Die Patientin gibt an, beim Gehen schlecht Luft zu bekommen.'],
    ['note', 'Patientenangabe: Atemnot beim Gehen.'],
    ['note', 'Subjektiv: Atemnot beim Gehen laut Patientin.']
  ],
  validParaphrase: [
    ['patient', 'Wenn ich gehe, fällt mir das Atmen schwer.'],
    ['patient', 'Beim Spazieren gerate ich außer Atem.'],
    ['patient', 'Gehen macht mich kurzatmig.'],
    ['patient', 'Beim Gehen werde ich kurzatmig.'],
    ['handover', 'Die Patientin schildert, dass ihr beim Gehen das Atmen schwerfällt.'],
    ['handover', 'Nach Aussage der Patientin tritt beim Spazieren Luftnot auf.'],
    ['handover', 'Die Patientin berichtet über Dyspnoe beim Gehen.'],
    ['handover', 'Beim Gehen bekomme sie schlecht Luft, sagt die Patientin.'],
    ['note', 'Eigenangabe: Beim Gehen fällt der Patientin das Atmen schwer.'],
    ['note', 'Nach eigenen Angaben kurzatmig beim Gehen.'],
    ['note', 'Laut Patientin gerät sie beim Spazieren außer Atem.'],
    ['note', 'Die Patientin beschreibt Atemnot bei Gehbelastung.']
  ],
  error: [
    ['patient', 'Ich bekomme schlecht Luft.', 'trigger-unconfirmed'],
    ['handover', 'Die Patientin berichtet über Atemnot.', 'trigger-unconfirmed'],
    ['note', 'Patientenangabe: Atemnot.', 'trigger-unconfirmed'],
    ['note', 'Die Patientin berichtet vom Gehen.', 'symptom-unconfirmed'],
    ['note', 'Atemnot beim Gehen beobachtet.', 'observation'],
    ['note', 'Atemnot beim Gehen objektiv festgestellt.', 'observation'],
    ['handover', 'Beim Gehen zeigte die Patientin Atemnot.', 'observation'],
    ['note', 'Wir sahen, wie ihr beim Gehen die Luft wegblieb.', 'observation'],
    ['handover', 'Die Patientin berichtet über Atemnot beim Gehen. SpO₂ 92 %.', 'measurement'],
    ['note', 'Patientin berichtet über Atemnot beim Gehen. Atemfrequenz 28.', 'measurement'],
    ['note', 'Patientin berichtet über Atemnot beim Gehen. Blutdruck 160/95.', 'measurement'],
    ['note', 'Patientin berichtet über Atemnot beim Gehen. Blutzucker 120 mg/dL.', 'measurement'],
    ['note', 'Patientin berichtet über Atemnot beim Gehen. Verdacht auf Pneumonie.', 'diagnosis'],
    ['handover', 'Die Patientin berichtet über Atemnot beim Gehen. Eine Lungenembolie liegt vor.', 'diagnosis'],
    ['note', 'Patientin berichtet über Atemnot beim Gehen. Lungenödem vorhanden.', 'diagnosis'],
    ['note', 'Patientin berichtet über Atemnot beim Gehen. Bronchitis liegt vor.', 'diagnosis'],
    ['handover', 'Die Patientin berichtet über Atemnot in Ruhe.', 'changed-trigger'],
    ['note', 'Laut Patientin tritt die Atemnot nur beim Treppensteigen auf.', 'changed-trigger']
  ]
};

const details = Object.entries(corpus).flatMap(([group, entries]) => entries.map(([stage, draft, expectedIssue]) => {
  const { factual } = assessIntegrity(draft, stage);
  return { group, stage, draft, expectedIssue, verdict: factual.state, issues: factual.issues.map(issue => issue.id) };
}));
const summary = Object.fromEntries(Object.keys(corpus).map(group => {
  const rows = details.filter(row => row.group === group);
  return [group, {
    total: rows.length,
    verified: rows.filter(row => row.verdict === 'verified').length,
    revise: rows.filter(row => row.verdict === 'revise').length,
    review: rows.filter(row => row.verdict === 'review').length,
    ...(group === 'error' ? { expectedIssueFound: rows.filter(row => row.issues.includes(row.expectedIssue)).length } : {})
  }];
}));

console.log(JSON.stringify({ summary, details }, null, 2));
