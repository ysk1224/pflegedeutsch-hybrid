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
