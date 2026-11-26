// Curated, static language reference; not model-generated.
export const grammar={
handover:[['Subject–verb agreement','Der Patient ist wach. Er berichtet über leichte Schmerzen.','A singular subject takes ist and berichtet. Schmerzen is plural.','단수 주어에는 ist, berichtet를 사용합니다. Schmerzen은 복수형입니다.'],['berichten vs. angeben','Er berichtet über Schmerzen. Er gibt Schmerzen an.','berichten is inseparable; angeben is separable. über takes the accusative here.','berichten은 비분리동사, angeben은 분리동사입니다. 여기서 über는 4격을 요구합니다.']],
pain:[['Question word order','Seit wann haben Sie Schmerzen?','The finite verb follows the question phrase, before the subject Sie.','의문사구 뒤에 정동사, 그 뒤에 주어 Sie가 옵니다.']],
explain:[['Modal construction','Ich möchte Ihren Blutdruck messen.','The infinitive messen goes at the end; Ihren Blutdruck is masculine accusative.','동사원형 messen은 끝에 오며 Ihren Blutdruck는 남성 4격입니다.']],
clarify:[['Indirect question','Könnten Sie bitte wiederholen, wann die Beobachtung gemacht wurde?','The finite auxiliary wurde is at the end of the subordinate clause.','간접의문문에서는 정동사 wurde가 절 끝에 옵니다.']],
comfort:[['Reflexive expression','Sie machen sich Sorgen.','sich Sorgen machen means to worry; sich refers back to Sie.','sich Sorgen machen은 걱정하다라는 뜻이며 sich는 주어 Sie를 가리킵니다.']],
document:[['Reported symptom','Der Patient berichtet über leichte Schmerzen.','berichten über + accusative identifies the reported information.','berichten über + 4격으로 환자의 진술을 표시합니다.']],
dyspnea:[['Nominalized infinitive','Der Patient berichtet über Atemnot beim Gehen.','beim = bei dem; Gehen is a nominalized infinitive and is capitalized.','beim = bei dem이며 명사화된 동사 Gehen은 대문자로 씁니다.']],
admission:[['Polite question','Haben Sie bekannte Allergien?','Yes/no questions start with the finite verb. Allergien is plural accusative here.','예/아니오 의문문은 정동사로 시작하며 Allergien은 여기서 복수 4격입니다.']],
mobility:[['bei + dative','Brauchen Sie Hilfe beim Aufstehen?','bei requires dative; beim is bei dem.','bei는 3격 전치사이며 beim은 bei dem입니다.']],
intake:[['Separable verb and perfect infinitive','Der Patient gibt an, 200 ml Wasser getrunken zu haben.','angeben separates in a main clause. getrunken zu haben expresses an earlier action.','angeben은 주절에서 분리되며 getrunken zu haben은 앞선 행위를 나타냅니다.']],
sleep:[['Perfect auxiliaries','Wie haben Sie geschlafen? Sind Sie aufgewacht?','schlafen uses haben; aufwachen uses sein in the perfect.','schlafen의 완료형은 haben, aufwachen은 sein을 사용합니다.']],
escalation:[['Polite request','Könnten Sie ihn bitte mitbeurteilen?','Könnten softens the request; ihn is masculine accusative.','Könnten은 정중한 요청이며 ihn은 남성 4격입니다.']]
};
export function referenceFor(id){return grammar[id]??[];}
export function referenceText(id){return referenceFor(id).map(row=>row.slice(0,3).join(' — ')).join('\n');}
