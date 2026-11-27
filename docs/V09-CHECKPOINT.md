# v0.9 competition checkpoint

- Production and Devpost still point to the approved v0.8 release. Keep them until live candidate verification meets the release gates.
- YouTube Studio confirmed Public for video HKgy5Z1SRN8 after reload. Fresh signed-out browser playback verification is still pending.
- The cloud coach generates two bounded German phrasings in different clinical registers. It validates the grammar constructions and separate case facts, then uses the generated wording in an interactive source-attribution exercise. It retries once for invalid output under the same explicit request. The cloud request has no learner-draft input.
- Case validation composes symptom, walking and source from supported wording. An unrecognised formulation is held for review. Exact grammar matching remains distinct. Known morphology errors continue to get revision guidance.
- Candidate Node 22 tests, Chromium 5 scenarios and Vite build pass. The earlier 36-item set now has 11/12 paraphrases accepted, 0/18 errors accepted and 18/18 intended error types identified. This is a development set.
- Outstanding release gates: held-out rubric test; 10 real cloud attempts on one exact preview; verify an actual provider POST excludes a synthetic draft marker and no provider POST happens before consent; signed-out playback; independent learner validation if available. Avoid changing production until these results are recorded.

## First held-out test

The original 44-item test was authored after 9920e5d. Before any follow-up changes it accepted 13/20 valid rephrasings, incorrectly sent 4/20 valid answers to revision, approved 0/20 fact errors, identified 17/20 exact error types, and kept all four deliberately uncertain inputs in review. It exposed German Unicode word-boundary problems, which this checkpoint corrects. A second unseen test is required after that correction. Do not score the first set as untouched after this point.

The preview-only audit observer records sanitized metadata from the SDK's real outgoing POST call and its HTTP status. It is enabled only on the existing preview host and audit query. The ordinary production bundle contains no observer.

## Hosted checkpoint and second held-out set

- Preview release b3d508ca329460d6 serves v0.9 code commit 14b2784 at the existing allowlisted review URL. Production remains v0.8. The preview contains a temporary observer, so do not clone this instrumented preview to live.
- In one real Chrome session, 10/10 explicitly consented cloud requests returned HTTP 200 and displayed a validated drill across three topics. No retry was needed. The two-register text varied across the runs, and a source-identification answer received immediate correct feedback. See [sanitized live results](evidence/v09-live-cloud.json).
- The trace showed zero provider POSTs before consent. Every observed provider request body contained the public case and excluded the synthetic learner draft marker. It does not contain raw prompts, credentials, headers or user data.
- The untouched second set has 24 factual paraphrases, 20 erroneous sentences and four deliberately uncertain items. The final rule build accepted 19/24 positive variants (79.2%), revised 1/24 in error (4.2%), approved 0/20 erroneous sentences, identified 15/20 intended error types (75%), and held 3/4 uncertain inputs. Five actual fact errors were routed to review without an error-type finding. Run node docs/evidence/v09-holdout.mjs. Do not use either held-out set to claim clinical accuracy or tune wording and reuse it as unseen.
- Final code tests pass 23 Node, five browser scenarios and the Vite build. No independent learner was recruited or tested. The 90% factual acceptance target was missed, so keep the v0.8 production and Devpost versions. Next checkpoint needs a new independent held-out set if the detector changes.
