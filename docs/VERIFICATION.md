# Verification record

**Build under test:** v0.8 Competition Edition source in this branch. Tests run on 26 November 2026 (Europe/Berlin).

| Test layer | Result | Evidence |
| --- | --- | --- |
| Node regression suite | 20 passed | Includes both Lab assessment tracks, curated references, abstention on unfamiliar text, cloud allowlist and legacy exercise and storage logic. |
| Vite production build | Passed | Emits separate app and device-frame HTML entry points. |
| Browser automation | Five scenarios passed in headless Chromium 158.0.8127.0 | Desktop exercise and legacy regressions, request capture and cloud errors, denied attestation, device adapter/CSP, responsive accessibility. Firebase and the Prompt API were simulated where used. |
| Unconfigured production bundle | Handover demo works at 1440 and 390 CSS pixels | An additional browser smoke check confirmed zero external requests and no horizontal overflow. |
| Responsive and automated accessibility | 320, 390 and 1440 CSS pixels | No horizontal overflow. Skip-link keyboard focus and judge-demo result focus were checked. Axe reported zero violations against the selected WCAG 2/2.1 A and AA rule tags in the tested state. |

## Network evidence

The test starts a built copy on loopback with a fixture configuration. Playwright intercepts all external requests. The test supplies synthetic strings and fixture credentials, and the provider responses never leave the test process.

| Scenario | Observed browser evidence |
| --- | --- |
| Unsupported device, draft entered and checked, cloud consent off | Zero external requests captured. A programmatic submit without consent also produces zero. Changing a topic resets consent before any request. |
| Consent given and coaching requested | One Firebase AI Logic inference POST for the successful request. The body contains the public case and selected topic. The intercepted App Check header contains the fixture token. No external URL or request body contains the learner-draft marker. Consent resets before another request can be sent. |
| App Check denied | The browser attempts App Check. Zero Firebase AI Logic inference POSTs follow. |
| Ready device and successful grammar suggestion | The Firebase adapter passes the marker to the simulated Chrome Prompt API in the device frame. The app accepts the SDK’s on-device response. Zero external requests are captured. Unavailability after readiness also produces zero external requests. |
| Forced CSP regression probe | Chromium emits a `connect-src` violation and rejects the fetch from the real device frame, with zero external requests captured. |
| Cloud output has an invented finding or hits a quota | The invented example is withheld. The quota failure leaves the lab and consent retry usable. |

Reproduce with `npm ci`, `npm test`, `npm run build`, `npx playwright install chromium` and `npm run test:browser`. See [browser fixtures](../tests/browser/integrity.test.js) and [assessment fixtures](../tests/integrity.test.js). The first browser run exposed a fixture that omitted the reCAPTCHA success callback. The corrected fixture now proves that the inference POST carries the issued App Check token. A separate denied-attestation test proves that the app stops before inference if App Check fails.

## Remaining release checks

- Verify the signed-off v0.8 build on Chrome hardware that supports German/English Gemini Nano. Test a cold/downloadable model and a ready model, including successful SDK source reporting from the protected frame.
- Verify the approved hosted v0.8 URL with App Check enforcement and live Gemini. Repeat the network capture with a synthetic marker and record the actual headers and source labels without publishing tokens or private details. Verify that the hosting response contains the device CSP.
- Check physical Android and desktop Safari/Firefox if available. The Chromium viewport and axe results do not cover real touch keyboards, screen-reader behaviour, or all accessibility requirements.
- Verify story links, open-source license link and the new demo video in a signed-out browser after an authorized update. Capture the hybrid result before making a successful runtime claim.
- No learner study, expert rubric validation, clinical outcome evaluation or model latency benchmark was performed. Known unsupported phrases are covered in tests. Free-form language and factual inference remain limited.

The deployed v0.7 release predates the fix to prevent draft transmission when the local model is unavailable. It is excluded from the safe rollback plan. Retain the previous hosting version for history and prepare an independently verified safe build before changing production.

## Hosted preview and on-device feedback correction

On 26 November 2026, the Firebase preview matched the six files in the configured bundle byte for byte and served the device frame with the restrictive CSP header. On the project owner's desktop Chrome, the Lab showed an actual on-device response in 38.4 seconds for the demo. The German example matched the case. Its generated grammar explanation incorrectly assigned nominative case to the verb. The follow-up patch pairs accepted examples with built-in guidance and regression tests inject that exact model error on both Lab paths. On 27 November 2026, the project owner repeated the on-device run on the patched preview. Chrome displayed “On-device AI” and the case-matched example “Die Patientin berichtet über Atemnot beim Gehen.” The built-in explanation correctly recommended the singular “berichtet”. The UI reported 32.8 seconds for this single result. Cloud coaching on the hosted preview reached an authorization error before inference in the earlier automated check. After the preview domain was added to reCAPTCHA, one live response was held by the example matcher. A later user-run test on 27 November 2026 displayed the actual Cloud AI source and the case-matched example “Der Patient berichtet über Atemnot beim Gehen.” This confirms a successful cloud result on the patched preview, with one observed example rejection. Both source labels were observed on the patched preview. A successful live network payload trace, cold model-download test, and production verification are still pending.

## Production audit and cloud coaching candidate

The deployed audit build matched all six files in the v0.8 feedback-fix bundle, including index-DaBZlm6c.js. The deployed device document served connect-src 'none'. An on-device run on the project owner's Chrome displayed a result in 34.0 seconds. In three live cloud requests, the SDK result reached the curated-example gate and was withheld. This is an availability and demonstration risk even though the gate prevents unsupported output.

The improvement branch changes only the cloud coach's output contract. Gemini chooses A or B among prewritten examples for the selected public topic. An unexpected choice, extra fields, or malformed JSON is rejected. The app resolves the choice to the local approved example and guidance. The privacy boundary and on-device flow remain in place. This candidate is separate from the production release.

Run `node docs/evidence/clinical-audit.mjs` for the item-level synthetic factual rubric audit. The unchanged production rubric recognized six of six curated references. Among 12 fact-preserving paraphrases it marked eight for revision, four for review, and zero as verified. Among 18 deliberately incorrect drafts it marked 14 for revision, four for review, and zero as verified. It identified the intended issue in 11 of the 18 incorrect drafts. This was a purposive fixture audit of one fictional case, without independent reviewers or learners.
