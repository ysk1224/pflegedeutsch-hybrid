// Deterministic learning aids, not an AI evaluation.
export const demoAnswer='Der Patient sind wach und hat leichte Schmerz. Er berichten über seine Schmerzen.';
const rules=[
 [/\bder Patient sind\b/i,'Der Patient ist','Subject–verb agreement','단수 주어에는 ist를 사용합니다.'],
 [/\bleichte Schmerz\b/i,'leichte Schmerzen','Plural noun','복수 Schmerzen을 사용하거나 단수라면 leichten Schmerz로 굴절합니다.'],
 [/\ber berichten\b/i,'er berichtet','Third-person singular','er에는 berichtet를 사용합니다.']
];
export function knownErrors(text){return rules.flatMap(([pattern,correction,label,ko])=>{const match=text.match(pattern);return match?[{original:match[0],correction,label,ko}]:[];});}
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
export function extractFollowup(text){const match=text.match(/(?:^|\n)\s*(?:#{1,6}\s*|\*\*)?Follow-up Language Question(?:\*\*)?\s*:?\s*(?:\*\*)?\s*([^\n]*(?:\n(?!\s*#{1,6}\s|\s*\*\*|\s*---)[^\n]*)*)/i);return match?match[1].trim().slice(0,600):'';}
export function sourceKind(source){const v=String(source??'').toUpperCase().replace(/[- ]/g,'_');return v==='ON_DEVICE'?'device':v==='IN_CLOUD'?'cloud':'unknown';}
