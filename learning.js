// Fixed examples and phrase checks for fictional language practice.
export const demoAnswer = 'Der Patient sind wach und hat leichte Schmerz. Er berichten über seine Schmerzen.';

const agreement = [/\b[Dd]er Patient sind\b/g, match => match.replace('sind', 'ist'),
  'Subject–verb agreement', 'Use ist with the singular subject der Patient.',
  '단수 주어 der Patient에는 ist를 씁니다.'];
const painPlural = [/(?<=\b(?:hat|haben|über) )leichte Schmerz\b/g, () => 'leichte Schmerzen',
  'Noun ending', 'Use leichte Schmerzen in the plural. In accusative singular, use leichten Schmerz.',
  '복수는 leichte Schmerzen, 남성 단수 4격은 leichten Schmerz입니다.'];
const thirdPerson = [/(?<=(?:^|[.!?])\s*)[Ee]r berichten\b/g, match => match.replace('berichten', 'berichtet'),
  'Third-person singular', 'A main clause starting with er uses berichtet.',
  '주절에서 er의 현재형은 berichtet입니다.'];
const symptoms = [/\bHaben Sie andere Symptomen\b/g, match => match.slice(0, -1),
  'Accusative plural', 'Haben takes the accusative. Use andere Symptome here.',
  'haben의 목적어는 4격입니다. 복수 4격은 andere Symptome입니다.'];

const rules = {
  handover: [agreement, painPlural, thirdPerson],
  document: [agreement, painPlural, thirdPerson],
  explain: [[/\bIhr Blutdruck messen\b/g, () => 'Ihren Blutdruck messen',
    'Masculine accusative', 'Use Ihren Blutdruck as the object of messen.',
    'messen의 남성 4격 목적어는 Ihren Blutdruck입니다.']],
  comfort: [[/\bSie sich Sorgen macht\b/g, match => match.replace('macht', 'machen'),
    'Polite Sie', 'With formal Sie, use machen.',
    '존칭 Sie와 함께 machen을 씁니다.']],
  admission: [symptoms],
  sleep: [[/\bHaben Sie in der Nacht aufgewacht\b/g, match => match.replace('Haben', 'Sind'),
    'Perfect auxiliary', 'Aufwachen uses sein in the perfect.',
    'aufwachen의 완료형에는 sein을 씁니다.']]
};

export function knownErrors(text, id = 'handover', followup = false) {
  const checks = followup && id === 'handover' ? [symptoms] : (rules[id] ?? []);
  return checks.flatMap(([pattern, fix, label, english, ko]) =>
    [...text.matchAll(pattern)].flatMap(([original]) => {
      const correction = fix(original);
      return correction === original ? [] : [{ original, correction, label, english, ko }];
    })
  );
}

export const vocabulary={
handover:['Schmerzen angeben','Ich habe Schmerzen.','report pain','통증을 호소하다'],
pain:['Schmerzintensität','Wie stark tut es weh?','pain intensity','통증 강도'],
explain:['Blutdruckmessung','Ich messe Ihren Blutdruck.','blood pressure measurement','혈압 측정'],
clarify:['Zeitpunkt der Beobachtung','Wann war das genau?','time of observation','관찰 시점'],
comfort:['Sorgen äußern','Ich mache mir Sorgen.','express concerns','걱정을 표현하다'],
document:['subjektive Schmerzangabe','Ich habe leichte Schmerzen.','patient-reported pain','주관적 통증 호소'],
dyspnea:['Belastungsdyspnoe','Beim Gehen bekomme ich schlecht Luft.','exertional breathlessness','활동 시 호흡곤란'],
admission:['bekannte Allergien','Haben Sie Allergien?','known allergies','알려진 알레르기'],
mobility:['Mobilisation','Brauchen Sie Hilfe beim Aufstehen?','mobilization','이동 및 활동 보조'],
intake:['orale Flüssigkeitsaufnahme','Ich habe Wasser getrunken.','oral fluid intake','경구 수분 섭취'],
sleep:['nächtliches Erwachen','Ich bin nachts aufgewacht.','night-time awakening','야간 각성'],
escalation:['neu aufgetretener Schwindel','Mir ist plötzlich schwindelig geworden.','new-onset dizziness','새로 발생한 어지럼증']
};

export const followups = {
  handover: { question: 'Ask the patient whether they have any other symptoms. Use formal Sie.', sample: 'Haben Sie andere Symptome?' },
  pain: { question: 'Ask one question beginning with Seit wann.', sample: 'Seit wann haben Sie Schmerzen?' },
  explain: { question: 'Say that you would like to measure the patient’s blood pressure. Start with Ich möchte.', sample: 'Ich möchte Ihren Blutdruck messen.' },
  clarify: { question: 'Ask your colleague when the observation was made. Use an indirect question.', sample: 'Könnten Sie mir sagen, wann die Beobachtung gemacht wurde?' },
  comfort: { question: 'Say “I understand that you are worried” using dass.', sample: 'Ich verstehe, dass Sie sich Sorgen machen.' },
  document: { question: 'Write that the patient reports mild pain. Use angeben.', sample: 'Der Patient gibt leichte Schmerzen an.' },
  dyspnea: { question: 'Say that the patient reports breathlessness while walking. Use beim.', sample: 'Der Patient berichtet über Atemnot beim Gehen.' },
  admission: { question: 'Ask whether the patient has known allergies.', sample: 'Haben Sie bekannte Allergien?' },
  mobility: { question: 'Ask if the patient needs help getting up. Use beim.', sample: 'Brauchen Sie Hilfe beim Aufstehen?' },
  intake: { question: 'Write that the patient reports having drunk water. Use getrunken zu haben.', sample: 'Der Patient gibt an, Wasser getrunken zu haben.' },
  sleep: { question: 'Ask whether the patient woke during the night. Use the perfect tense.', sample: 'Sind Sie in der Nacht aufgewacht?' },
  escalation: { question: 'Politely ask your colleague to assess the patient. Use Könnten Sie.', sample: 'Könnten Sie ihn bitte mitbeurteilen?' }
};
