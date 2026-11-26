# PflegeDeutsch Hybrid

**Elevator pitch**

Can you hand over a case in German without changing its facts? Practise the patient’s words, a colleague handover and a nursing note with separate feedback on German and fidelity to the case.

**Platform**

Web / Chrome

## Inspiration

A nurse can know exactly what happened and still hesitate over how to say it in German. A patient might say *Beim Gehen bekomme ich schlecht Luft.* During handover, that becomes an attributed clinical report. In a nursing note, the wording must still make clear where the information came from.

## What it does

The Clinical Communication Integrity Lab follows one fictional patient through three pieces of communication. A learner first writes in the patient’s own voice, then hands over the report to a colleague, then documents it. The lab checks German wording and the supplied case facts separately.

Try the built-in handover mistake. It includes a verb error and an oxygen reading the case never supplied. Fix the verb and the reading still needs revision. Remove the reading, restore the walking trigger and check again to compare the attempts. The nursing note exercise challenges the learner to keep a patient’s report distinct from a direct observation. The lab requests a review when it cannot establish a curated match.

The companion library offers 12 fictional B1–B2 exercises with German references, English and Korean explanations, practice questions and a browser-based review queue.

## How we built it

Firebase AI Logic supports two different kinds of coaching. On supported Chrome devices, Gemini Nano can give draft-specific grammar feedback in a document that blocks network connections. The optional cloud coach uses Gemini on a fixed fictional case and a topic the learner selects. A separate opt-in and Firebase App Check are required. Neither path owns the rubric, and the cloud request never includes the draft.

The study loop works without an AI model. App labels come from the actual SDK response. Our reproducible Chromium tests use fixture models and intercepted responses to test request boundaries, error handling and the practice flow.

## Built during the submission period

The public project history starts in November 2026. It grew from a clinical German practice library into a lab for preserving facts across audiences. The competition edition adds separate assessments, revision comparisons, early model readiness and a clearer boundary between private drafts and cloud coaching. We used standard open-source libraries and an AI coding assistant.

## Try it

Open the demo and click **Try the handover demo**. Inspect **Case facts** and **German wording**, revise the sentence and check it again. No account is required for the lab. Desktop Chrome with the English/German model ready can also test on-device coaching. The configured preview can test optional cloud coaching. See the [judge walkthrough](docs/ARCHITECTURE.md#judge-walkthrough) and [evidence record](docs/VERIFICATION.md).
