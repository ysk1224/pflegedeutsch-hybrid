# PflegeDeutsch Hybrid

**Clinical German practice for internationally trained nurses preparing to work in German-speaking hospitals.** Practise 12 fictional B1–B2 scenarios covering shift handover, documentation and conversations with patients and colleagues. Each includes a German reference answer, English and Korean language notes, and a follow-up exercise. Educational use only. Use fictional information.

- [Hosted demo](https://pflegedeutsch-hybrid.web.app)
- [Technical architecture and judge test steps](docs/ARCHITECTURE.md)
- [Devpost description](SUBMISSION.md)
- [English demo script and storyboard](docs/DEMO.md)

## Run locally

Use Node 22.12 or later and npm.

```sh
npm ci
npm test
npm run build
npm run dev
```

The app starts in study mode if no Firebase settings are provided. The reference answers, rule-based phrase checks, follow-ups and review queue are available in that mode.

## Enable Firebase AI Logic

1. In a Firebase project you administer, enable Firebase AI Logic with the Gemini Developer API. Confirm the Spark plan and free quota before running or deploying cloud feedback.
2. Register the web app in Firebase App Check with reCAPTCHA Enterprise. Authorize the host and verify Firebase AI Logic App Check enforcement in the Firebase console. Use [Firebase’s localhost setup instructions](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started) for local verification. Keep any debug token outside source control and submission materials.
3. Copy `.env.example` to `.env.local`. Supply the Firebase API key, project ID, web app ID and reCAPTCHA Enterprise site key. Use the web app client configuration from the console. Keep private credentials out of client variables and out of the repository.
4. Restart Vite after configuration changes. For an authorized deploy, confirm the selected Firebase project, run `npm run build` with the intended client configuration, then run `firebase deploy --only hosting --project pflegedeutsch-hybrid` using an authenticated Firebase CLI.

For local inference, use supported desktop Chrome with Gemini Nano available and English/German language support. First use may require a model download. The checkbox for cloud fallback is initially off and resets when changing cases.

## Test and license

The CI workflow installs from the lockfile, runs the Node regression suite and builds the production bundle. See the [judge test steps](docs/ARCHITECTURE.md#judge-test-steps) for live model and browser checks.

MIT license. Content is fictional and written for this project with AI-assisted development. Libraries retain their own licenses.
