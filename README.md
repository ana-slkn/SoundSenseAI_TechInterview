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

Search or filter the call queue. Compare each unchanged generated summary against suggested findings. Each finding distinguishes contradiction, unsupported claim, required omission or rule breach, explains impact and the relevant rule, and links to highlighted transcript turns. Confirm, dismiss or mark suggestions unsure, then make a separate call-level decision and add notes or a corrected summary. Click **Save decision** to persist the outcome and notes to the configured storage backend. Unsaved drafts remain available when switching calls during the current session, but are excluded from exports and lost on reload. Finding assessments are also drafts until you save; export JSON for portability. Export includes exact evidence references and source turn text. Without Supabase configuration, storage defaults to this browser. Original synthetic identifying details are visible in transcripts; summary redaction requirements still apply.

The guidelines explain acceptable paraphrasing, privacy exceptions for advice bodies, the DPA exception and financial amount distinctions. Accurate calls are intentionally left clear; a missing category alone is not treated as an error.

## Analysis approach and limits

`lib/reviews.ts` contains **manually curated findings for the supplied fixtures**, not a general-purpose AI evaluator. The analysis uses no external records, audio or AI services. Supabase is optional for review persistence. The dataset does not include official ground-truth labels: these findings are review suggestions, not an independent accuracy benchmark. Priority is qualitative: high for material changes to payment, authority, consent, hardship or consequences; medium for other required details and privacy breaches. Full transcript review is needed for unsupported claims: linked turns provide context but cannot by themselves prove absence elsewhere.

A production evaluator could expose the same typed finding contract from a server route, validate exact evidence spans, evaluate individual rules and support explicit uncertain findings. It should be tested on independently labelled calls, including silence, voicemail, internal handovers, ASR artefacts, ambiguous directions, and disagreements between reviewers. Those special cases are in the supplied rules but not all occur in these fixtures. Do not claim generalisation from these curated examples.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Tests verify that every claim is actually in the summary, every evidence turn exists in its own call, known accurate calls are clear, and important distinctions remain represented. They validate fixture integrity, not semantic accuracy of all analysis. The build checks the production app; browser interaction testing is separate.

## Supabase setup

1. Create a project at https://supabase.com/dashboard (the app does not create one automatically).
2. In the SQL editor, run `supabase/migrations/202611160001_create_reviews.sql` once.
3. In Authentication → Sign In / Providers, enable **Allow anonymous sign-ins**.
4. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the project URL and publishable key from the project Connect/API settings. Never use a secret or service-role key in these variables.
5. Restart `npm run dev`. The decision panel should show **Storage: Supabase**. Save a review, reload, and verify it is restored. In the Supabase table editor, confirm the row exists in `reviews`.

The database stores one review per call per authenticated user. Anonymous authentication preserves the current no-login experience, and row-level security restricts reads and writes to the session owner's rows. Clearing browser storage loses that anonymous identity; another browser gets a separate identity and cannot retrieve those reviews. Permanent authentication would be needed for cross-device access. See [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous) and [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

When neither environment variable is set, the existing local browser mode remains available. Existing local reviews are not uploaded automatically. Once Supabase is configured, failures are displayed and never silently fall back to local saving. Outcome, notes and finding assessments all require **Save decision**; failed saves retain the draft, and exports contain only successfully saved reviews. The supplied calls and curated findings remain repository fixtures; only reviewer work is stored in the database. Concurrent edits in separate tabs use last-write-wins semantics.

The migration and live persistence require a real Supabase project to verify. No database has been provisioned by this repository.
