# Mock judging review

The contest first checks baseline viability. Its four equally weighted criteria then evaluate technological implementation, design, potential impact and idea quality. The web track specifies Chrome’s Gemini Nano 4 through Firebase AI Logic and calls for App Check. A working demo, a public repository with an open-source license, a project description and a video that matches the product matter at the eligibility and evidence stages. See the [official rules](https://firebasehybridaihackathon.devpost.com/rules), [contest page](https://firebasehybridaihackathon.devpost.com/) and [schedule](https://firebasehybridaihackathon.devpost.com/details/dates).

| Criterion | v0.8 evidence | Skeptical reviewer’s objection |
| --- | --- | --- |
| Technological Implementation | SDK-powered local grammar and separate cloud topic coaching, CSP-blocked outbound device-frame requests, explicit cloud consent, verified source labels and fixture tests | The local and cloud paths still need real runs on the exact submitted build. Cloud handles public guidance and makes a smaller contribution to draft-specific learning. A judge may ask what hybrid inference adds compared with the same rubric and curated guidance alone. |
| Design | The landing demo shows two findings in one click. Learners can fix grammar first and then preserve the facts. Keyboard and narrow-view evidence is reproducible. | The powerful interaction is concentrated in one case. The reference-based checks can send a good unfamiliar wording to review. An independent judge could miss the optional AI coaching. |
| Potential Impact | The workflow serves internationally trained nurses and reflects the shift from everyday speech to handover to a source-attributed record. | The case demonstrates a practice mechanism. There is no observed learner adoption or measured improvement, and there is no evidence about downstream clinical outcomes. |
| Quality of the Idea | One statement is expressed for three audiences, with separate assessments of wording and fact preservation. Unsupported observations and readings are visible after a grammar fix. | Evidence-first handover and consent-aware AI already appear in the gallery. The distinctive feature here is language training across registers and a controlled revision exercise. It needs a legible demo and feedback specific enough to help beyond the seeded inputs. |

## Competitor benchmarks

This is a focused set of public, self-reported project descriptions, not a validation of their implementations or a complete gallery ranking.

| Entry | Publicly describes | What our entry must show |
| --- | --- | --- |
| [SignalGlass](https://devpost.com/software/signalglass) | Source-attributed event handovers, maintained uncertainty, replay and consented AI drafting | Why one patient fact must hold across three German registers, plus a concrete contrast between fluent wording and correct facts. |
| [Redact](https://devpost.com/software/redact-4b2kpy) | An inspectable consent and data-redaction flow, runtime paths and request evidence | Comparable visibility of the data boundary. Show the exact categories sent for cloud coaching and prove the draft is absent from live payloads. |
| [HG Hybrid AI](https://devpost.com/software/hg-hybrid-ai) | A direct hybrid routing demonstration with SDK source reporting | Show working source labels quickly. Explain why local analysis takes the draft and cloud coaching can use a fixed public prompt. |

## Priorities before the deadline

1. **Verify the actual runtime paths.** Highest judging value, moderate effort with an eligible Chrome device and authorized Firebase access. Record source labels and a network trace on the exact release. App Check, model availability and the Chrome iframe are release risks.
2. **Make the video show the causal contrast.** Start with the invented reading, revise only the verb, then revise the facts and show the comparison. This is lower effort than broadening the exercise bank. Test that a signed-out reviewer can follow it and reach the same result.
3. **Check the rubric on a small fixed sample.** If an independent German-speaking nursing reviewer is available, compare a fixed set of valid paraphrases and known fact errors. Record disagreements and abstentions with the denominator. Keep any claims scoped to that test. Defer new content if it would delay runtime verification.

Internal cut-off is 30 November 2026 at 18:00 CET. The official deadline is 23:00 CET that day. The release remains conditional on authorized validation and approval for production and Devpost changes.
