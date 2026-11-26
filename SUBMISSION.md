# PflegeDeutsch Hybrid

**Tagline**
Practise clinical German for a hospital shift with fictional cases, verified grammar notes and device-first AI feedback.

**Platform**
Web / Chrome

## Inspiration

A nurse can know what to communicate during a handover and still hesitate over how to say it in German. The language changes with the audience. A colleague might use *Belastungsdyspnoe*, while a patient might say *Beim Gehen bekomme ich schlecht Luft.* Nurses learning German need a way to practise those differences before using them in a real shift.

## What it does

PflegeDeutsch Hybrid gives internationally trained nurses 12 short B1–B2 exercises for handover, patient questions, documentation and speaking to colleagues. Write a German response, compare it with a reference, and work through a follow-up. The exercise includes clinical and patient-friendly German, with English and Korean learning notes.

Selected phrase checks explain recurring errors and add the scenario to a review queue. For example, *Haben Sie andere Symptome?* uses the accusative plural after *haben*. *Symptomen* is the dative plural.

## How we built it

We built a small web app with Vite and Firebase AI Logic. The default request mode is `ONLY_ON_DEVICE`. If the learner authorizes cloud fallback for the fictional case, the app uses `PREFER_ON_DEVICE`, giving the Firebase SDK the choice of Chrome’s Gemini Nano when available or the configured Gemini Flash Lite cloud model. The app displays the source reported by the SDK for each valid response. Firebase App Check is integrated through reCAPTCHA Enterprise.

We give both model paths the same curated grammar references and require a structured German suggestion and short English explanation. The app validates the response before displaying it. Korean explanations and follow-up questions come from the exercise library. The reference and local review tools remain available when AI is unavailable. The app stores reviewed and saved scenario IDs in the browser. It uses fictional practice data.

## Built during the submission period

The public repository history begins on November 26, 2026. During the contest window the project grew into a 12-case study tool with Firebase AI Logic, curated references and bilingual grammar hints. The v0.7 release candidate adds a responsive workflow, structured model output, fixed follow-up exercises, automatic review routing for selected phrase errors and regression coverage. We used standard open-source libraries and an AI coding assistant.

## Links

- [Web app](https://pflegedeutsch-hybrid.web.app)
- [Public source code](https://github.com/ysk1224/pflegedeutsch-hybrid)
- [Judge testing instructions](docs/ARCHITECTURE.md#judge-test-steps)

## Submission handoff

Confirm the hosted page serves the release candidate, verify both inference sources on the hosted build, and insert the public YouTube video URL in Devpost before submission. Confirm that the default-branch source and judging link match the hosted build.
