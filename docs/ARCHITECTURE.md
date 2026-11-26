# Technical architecture

| File | Responsibility |
| --- | --- |
| `integrity.js` | Fictional source, three communication steps, separate grammar and case-fact checks, attempt comparison |
| `lab-ui.js`, `index.html`, `styles.css` | Case brief, stage navigation, two verdicts, revision and coach actions |
| `device.html`, `device.js`, `device-client.js` | Same-origin iframe, early capability check and isolated Firebase AI Logic on-device inference |
| `cloud-coach.js` | Separate Firebase app and App Check, topic allowlist and explicit-consent cloud inference |
| `inference.js`, `feedback.js` | SDK source verification, streaming, deadlines, output shape and user-facing failures |
| `src.js`, `exercises.js`, `grammar.js`, `learning.js`, `study.js` | Scenario library, vocabulary, follow-ups and browser review queue |
| `vite.config.js`, `firebase.json` | Two HTML entries and a hosting response CSP for the device frame |

## Request boundaries

| Action | Data used | Processing |
| --- | --- | --- |
| Check draft, compare attempts or check phrases | Current draft and curated rubric | Synchronous JavaScript in the browser. No SDK request. |
| On-device grammar feedback | Draft, case and language prompt | Frame checks the Chrome Prompt API, calls Firebase AI Logic with `ONLY_ON_DEVICE`, and accepts only an SDK `on_device` response. The document and hosting CSP deny `connect-src`. The input form is in the parent document. |
| Request cloud coaching | A public case prompt and an allowlisted topic | Explicit consent is consumed per request. App Check gets a valid token before invoking Gemini with `ONLY_IN_CLOUD`. The cloud caller has no parameter for a draft. Token auto-refresh is disabled. |
| Review library | Reviewed and saved exercise IDs | Browser local storage readable across visits. Lab drafts and attempts remain in page memory. |

Capability checks run before a draft is needed. A configured build distinguishes unavailable, unsupported, downloadable, downloading, ready and unknown states. Device initialization and generation have time limits. Chrome can continue a browser-managed model download after the app times out. The cloud path checks App Check within 12 seconds and limits generation to 45 seconds. The application only shows an AI source after it validates the actual SDK source and structured output. An AI example in the lab must match a curated factual form. Its accompanying generated explanation is advisory and can still be imperfect. Neither AI path changes an assessment.

The case rubric deliberately abstains on unrecognized wording. Known contradictions and missing or unconfirmed details are scoped to the supplied fictional scenario. A curated match is a match with bounded examples, with no general fluency or clinical competence claim. The reference and all checks remain accessible without AI. The cloud coach provides public instructional examples on unsupported devices and keeps draft-specific coaching local.

## Judge walkthrough

| Test | Action | Expected evidence |
| --- | --- | --- |
| First-use demo | Select **Try the handover demo**. | The same draft gets a fact flag for the invented oxygen reading and a separate flag for German subject–verb agreement. |
| Separate assessments | Change only `berichten` to `berichtet` and check again. Then open **Reference and revision tip**, choose **Use reference as draft**, and check the draft. | Grammar can match while the reading is still flagged. The revision comparison reports the change independently. |
| Documentation and uncertainty | Choose **Next step**, then **Check a practice mistake**. Try an unfamiliar valid paraphrase. | The draft confuses patient report with direct observation. An unfamiliar form can receive a review status without being marked correct. |
| Device AI | On supported desktop Chrome with the German/English model ready, request **On-device grammar feedback**. | A matching result shows the actual device label. Otherwise the activity remains usable and displays an explanation. |
| Consented cloud | Open **Optional cloud coaching**, choose a topic, check consent and request coaching. | A matching result shows the actual cloud label. Consent resets after the request. |
| Review library | Load the ICU demo and run phrase checks. Open follow-up and try `Haben Sie andere Symptomen?`. | Reference, explanation and review queue remain usable without an AI model. |

[Chrome built-in AI requirements](https://developer.chrome.com/docs/ai/get-started) · [Firebase AI Logic web hybrid setup](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started)
