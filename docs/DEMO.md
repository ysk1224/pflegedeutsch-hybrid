# English demo script and storyboard

**Target duration: 2 minutes 35 seconds.** Record the hosted release candidate. Before recording, confirm that desktop Chrome can run the English/German on-device model and that a second browser without the model can use the consented cloud path. Capture both actual SDK source labels. Edit out waiting time as needed and leave the app’s measured values visible without giving a speed comparison.

| Time | Screen action | English voiceover |
| --- | --- | --- |
| 0:00–0:18 | Open the homepage. Show the scenario selector and choose **B2 · ICU shift handover**. | “For a nurse learning German, knowing what to say at shift handover and being able to say it are two different skills. PflegeDeutsch Hybrid lets internationally trained nurses practise that language with fictional hospital cases.” |
| 0:18–0:42 | Click **Load demo**. Show the patient is awake and reports mild pain, then point to `Der Patient sind` and its correction. | “This patient is awake and reports mild pain. Our example contains three deliberate grammar errors. The built-in rule checks explain changes such as ‘Der Patient ist’. The singular subject takes ‘ist’.” |
| 0:42–1:12 | Leave fallback off in supported desktop Chrome. Check the answer and show the completed **On-device** result and model suggestion. | “Cloud fallback is off. Firebase AI Logic uses the on-device model for this run. Here the source label comes from the SDK response. The app checks the response format before showing the suggested German and its English explanation.” |
| 1:12–1:41 | Switch to a browser without local AI. Show the device-only result, then enable the checkbox and run the same fictional input. Hold on **Cloud**. | “This browser has no compatible local model. The reference remains available. I’m allowing cloud fallback for this fictional case, so Firebase AI Logic can send the request to the cloud. The completed response now shows ‘Cloud’.” |
| 1:41–2:10 | Open the reference and clinical/patient language panel. Open the follow-up, try `Haben Sie andere Symptomen?` and display the correction and example. | “The reference puts clinical German beside the language a patient might use. In this follow-up, ‘Haben Sie andere Symptome?’ uses the accusative plural. The example and Korean grammar notes are available without AI.” |
| 2:10–2:35 | Show **Review queue**, reopen the saved case and end on the mobile layout and title. | “The practice case goes into the review queue when a known error is detected. That lets learners return to the same language task later. The library covers twelve nursing scenarios, from patient questions to documentation and shift handover.” |

## Capture checks

- Record at a readable zoom and keep mouse movement deliberate.
- Capture only fictional answers. Exclude browser profiles, account menus and Firebase console details from the recording.
- Add English captions for German phrases. Check the public YouTube link in a signed-out browser.
- Use the source labels from actual runs. A local model stub or simulated response belongs in testing evidence only.
