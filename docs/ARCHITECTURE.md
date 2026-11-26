# Technical architecture

| Component | Responsibility |
| --- | --- |
| `index.html`, `styles.css`, `src.js` | Responsive scenario editor, AI consent, feedback, reference and follow-up |
| `exercises.js`, `grammar.js`, `learning.js` | Fictional case facts, sample answers, vetted grammar examples, phrase checks and fixed follow-ups |
| `inference.js` | Firebase client and App Check initialization, SDK inference modes, streamed response collection and time limits |
| `feedback.js` | Shared response schema, validation, actual source interpretation and learner-facing errors |
| `study.js` | Compatible loading and saving of review and completion IDs in browser storage |
| `firebase.json`, `.github/workflows/build.yml` | Hosting configuration and reproducible test/build workflow |

## Request and storage boundaries

1. The current case and typed answer are checked in the browser. Known phrase errors add the case ID to the review queue. Drafts stay in memory while the page is open.
2. In a configured build, a learner action initializes the device model through Firebase AI Logic. With cloud consent off, the app selects `ONLY_ON_DEVICE`. With consent on, it selects `PREFER_ON_DEVICE`; the SDK can route to the configured cloud model when local inference is unavailable. The app uses the same routing for follow-up answers.
3. The app sends one structured prompt with the fictional task, reference, verified phrase matches and quoted learner text. German and English are the declared Chrome model languages. Korean explanations remain curated. Schema validation checks response shape and length. The language suggestions still need to be compared with the reference.
4. The app renders complete, validated fields as text and shows the SDK’s actual inference source when available. First-text time counts from the generation call. Total includes model preparation and response parsing. Device-only preparation has a three-minute deadline. Generation has a 45-second deadline and passes an abort signal to the SDK. Browser model download can continue after a local timeout.
5. Only scenario IDs for completion and review are written to local storage by the app. Firebase App Check and Chrome manage their own service state. Cloud mode can send the fictional prompt to Google. A loaded study page can still use the static exercises if inference is unavailable.

## Judge test steps

| Test | Action | Evidence |
| --- | --- | --- |
| On-device | Start in current desktop Chrome with Gemini Nano ready and English/German supported. Load the demo, leave cloud fallback off, and select **Check my German**. | A completed response shows **On-device**. The three phrase checks and reference are separately visible. |
| Device unavailable | On a browser without the built-in model, repeat with consent off. | A recoverable error, the original answer and the static reference remain available. |
| SDK cloud fallback | On that same browser, enable cloud fallback for the fictional case and run the same answer again. | The completed response shows **Cloud**. |
| Study and follow-up | Open the review queue after checking the demo. Open **Follow-up practice** in the handover case and try `Haben Sie andere Symptomen?`. | The rule check suggests `andere Symptome`. The sample is available with or without AI. Reload to confirm the review queue persists. |
| Phone layout | Open on a narrow viewport or phone, select another case and navigate the editor, reference and review buttons. | Controls remain visible and reachable. Changing cases resets cloud consent. |

If local inference is unavailable, check [Chrome’s language and device requirements](https://developer.chrome.com/docs/ai/get-started) and [Firebase’s hybrid setup](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started). Use fictional answers in both environments.
