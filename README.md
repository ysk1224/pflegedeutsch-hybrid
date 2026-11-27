# PflegeDeutsch Hybrid

Clinical German practice for internationally trained nurses. The **Clinical Communication Integrity Lab** uses a fictional breathlessness case to practise patient speech, shift handover and a concise nursing record. The lab checks case facts and German wording separately and lets learners revise each draft and compare their attempts.

The scenario library includes 12 fictional B1–B2 exercises with references, English and Korean notes, follow-up questions and a local review queue. Use fictional information only.

- [Architecture and judge walkthrough](docs/ARCHITECTURE.md)
- [Reproducible verification and limits](docs/VERIFICATION.md)
- [Judging evidence and comparison](docs/COMPETITION-REVIEW.md)
- [Devpost draft](SUBMISSION.md)
- [English demo script](docs/DEMO.md)

## Run locally

Use Node 22.12 or later and npm.

```sh
npm ci
npm test
npm run build
npm run dev
```

Open the local URL printed by Vite and select **Try the handover demo**. No account or AI credentials are needed for the lab, scenario library or review queue. For the security smoke tests use the built preview. The Vite development client cannot open its hot-reload WebSocket in the restricted on-device frame.

```sh
npx playwright install chromium
npm run test:browser
```

The browser tests build a separate temporary bundle with fake Firebase settings. They intercept provider requests and do not need network credentials. Linux CI installs Chromium dependencies through Playwright. An existing compatible Chromium binary can be selected with `PFLEGE_CHROMIUM`.

## Enable optional AI

1. In a Firebase project you administer, enable Firebase AI Logic with the Gemini Developer API. Confirm model availability and the free quota for that project.
2. Register the web app in Firebase App Check with reCAPTCHA Enterprise, authorize the hostname and confirm App Check enforcement for Firebase AI Logic. Keep debug tokens outside the repository and any public browser bundle.
3. Copy `.env.example` to `.env.local` and use the public web configuration values. The first three entries configure the local SDK. The reCAPTCHA site key also enables cloud coaching. Restart Vite or rebuild after configuration changes.
4. Use supported desktop Chrome with Gemini Nano available for English/German. The on-device model may need a browser-managed download. The lab displays readiness and lets you start without it.
5. Run `npm run build` and `npx vite preview` to verify the built app. Follow the [release checks](docs/VERIFICATION.md#remaining-release-checks) before publishing to a shared host.

Drafts remain in page memory. Cloud coaching is a separate, one-time opt-in for a fixed topic and public case. The draft never enters the cloud request. The public Firebase Hosting URL and previously submitted demo represent the deployed version independently of this branch.

MIT license. See [LICENSE](LICENSE).
