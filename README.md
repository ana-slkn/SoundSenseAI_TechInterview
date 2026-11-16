# SoundSense summary review

A local QA workbench built with Next.js App Router, React, TypeScript and Tailwind CSS. Uses all 20 supplied synthetic transcript–summary pairs without modifying the source data.

## Run

Requires Node.js 20.9+.

```sh
npm install
npm run dev
```

Open http://localhost:3000. For production: `npm run build` then `npm start`.

## Review workflow

Search or filter the call queue. Compare each unchanged generated summary against suggested findings. Each finding distinguishes contradiction, unsupported claim, required omission or rule breach, explains impact and the relevant rule, and links to highlighted transcript turns. Confirm, dismiss or mark suggestions unsure, then make a separate call-level decision and add notes or a corrected summary. Click **Save decision** to persist the outcome and notes in browser localStorage. Unsaved drafts remain available when switching calls during the current session, but are excluded from exports and lost on reload. Finding assessments save automatically; export JSON for portability. Export includes exact evidence references and source turn text. There is no server storage or cross-device synchronisation. Original synthetic identifying details are visible in transcripts; summary redaction requirements still apply.

The guidelines explain acceptable paraphrasing, privacy exceptions for advice bodies, the DPA exception and financial amount distinctions. Accurate calls are intentionally left clear; a missing category alone is not treated as an error.

## Analysis approach and limits

`lib/reviews.ts` contains **manually curated findings for the supplied fixtures**, not a general-purpose AI evaluator. No API keys, external records, audio or external services are used. The dataset does not include official ground-truth labels: these findings are review suggestions, not an independent accuracy benchmark. Priority is qualitative: high for material changes to payment, authority, consent, hardship or consequences; medium for other required details and privacy breaches. Full transcript review is needed for unsupported claims: linked turns provide context but cannot by themselves prove absence elsewhere.

A production evaluator could expose the same typed finding contract from a server route, validate exact evidence spans, evaluate individual rules and support explicit uncertain findings. It should be tested on independently labelled calls, including silence, voicemail, internal handovers, ASR artefacts, ambiguous directions, and disagreements between reviewers. Those special cases are in the supplied rules but not all occur in these fixtures. Do not claim generalisation from these curated examples.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Tests verify that every claim is actually in the summary, every evidence turn exists in its own call, known accurate calls are clear, and important distinctions remain represented. They validate fixture integrity, not semantic accuracy of all analysis. The build checks the production app; browser interaction testing is separate.
