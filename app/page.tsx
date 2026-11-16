'use client';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Headphones,
  HelpCircle,
  ListFilter,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  calls,
  findingsFor,
  riskFor,
  rules,
  type Finding,
} from '@/lib/reviews';
import {
  loadReviews,
  saveReview,
  storageMode,
  type Review,
} from '@/lib/review-storage';
const empty: Review = { decision: 'Unreviewed', notes: '', findings: {} };
export default function Home() {
  return (
    <AuthGate>
      {(account) => (
        <ReviewWorkspace
          key={account.id}
          accountLabel={account.label}
          onSignOut={account.signOut}
        />
      )}
    </AuthGate>
  );
}
function ReviewWorkspace({
  accountLabel,
  onSignOut,
}: {
  accountLabel: string;
  onSignOut?: () => Promise<void>;
}) {
  const [selected, setSelected] = useState('CALL-003');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All calls');
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [drafts, setDrafts] = useState<Record<string, Review>>({});
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [tab, setTab] = useState('Findings');
  const [active, setActive] = useState<string[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const parsed = await loadReviews();
        const valid: Record<string, Review> = {};
        for (const c of calls) {
          const r = parsed?.[c.id];
          if (
            r &&
            [
              'Unreviewed',
              'Acceptable',
              'Needs correction',
              'Uncertain',
            ].includes(r.decision) &&
            typeof r.notes === 'string' &&
            r.findings &&
            typeof r.findings === 'object'
          )
            valid[c.id] = r;
        }
        if (!cancelled) {
          setReviews(valid);
          setReady(true);
        }
      } catch {
        if (!cancelled)
          setStorageError(
            `Could not load reviews from ${storageMode}. Check your connection and database setup, then reload to retry.`,
          );
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!showRules) return;
    const previous = document.activeElement as HTMLElement | null;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowRules(false);
      if (event.key === 'Tab') {
        const buttons =
          document.querySelectorAll<HTMLButtonElement>('.modal button');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [showRules]);
  const call = calls.find((c) => c.id === selected)!;
  const findings = findingsFor(selected);
  const review = reviews[selected] ?? empty;
  const draft = drafts[selected] ?? review;
  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(review);
  function updateDraft(patch: Partial<Review>) {
    setDrafts((old) => ({ ...old, [selected]: { ...draft, ...patch } }));
    setNotice('');
  }
  async function saveDecision() {
    const callId = selected;
    const snapshot = { ...draft };
    setSaving(true);
    setNotice('');
    try {
      await saveReview(callId, snapshot);
      setReviews((old) => ({ ...old, [callId]: snapshot }));
      setStorageError('');
      setNotice(`Decision saved for ${callId} · ${storageMode}.`);
    } catch {
      setStorageError(
        'Decision could not be saved. Your draft is still available; try saving again.',
      );
    } finally {
      setSaving(false);
    }
  }
  const reviewed = calls.filter(
    (c) => reviews[c.id]?.decision && reviews[c.id].decision !== 'Unreviewed',
  ).length;
  const visible = calls.filter(
    (c) =>
      `${c.id} ${c.summary}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === 'All calls' ||
        (filter === 'Unreviewed' &&
          (!reviews[c.id] || reviews[c.id].decision === 'Unreviewed')) ||
        (filter === 'Flagged' && findingsFor(c.id).length > 0) ||
        (filter === 'Clear' && !findingsFor(c.id).length)),
  );
  function choose(id: string) {
    setSelected(id);
    setActive([]);
    setTab('Findings');
    setNotice('');
  }
  function evidence(f: Finding) {
    setActive(f.turns);
    document
      .getElementById(`${selected}-${f.turns[0]}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function exportReviews() {
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      analysisSource:
        'Curated fixture analysis; not an automated general-purpose evaluator',
      calls: calls.map((c) => ({
        callId: c.id,
        callDate: c.call_date,
        review: reviews[c.id] ?? empty,
        suggestedFindings: findingsFor(c.id).map((f) => ({
          ...f,
          evidence: f.turns.map((t) => ({
            reference: `${c.id}/${t}`,
            text: c.transcript
              .split('\n')
              .find((line) => line.startsWith(t + ' ')),
          })),
        })),
      })),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soundsense-reviews.json';
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Reviews exported.');
  }

  return (
    <div className="app-shell">
      <aside className="rail">
        <div className="brand-mark">
          <Activity size={25} />
        </div>
        <button className="rail-active" aria-label="Review workspace">
          <ClipboardCheck size={21} />
        </button>
        <button
          onClick={() => setShowRules(true)}
          aria-label="Review guidelines"
        >
          <ShieldCheck size={21} />
        </button>
        <div className="rail-bottom">
          <button onClick={() => setShowRules(true)} aria-label="Help">
            <HelpCircle size={20} />
          </button>
          <div className="avatar">QA</div>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <a href="/" className="wordmark">
            soundsense<span> / </span>
            <span className="header-subtitle">Quality assurance</span>
          </a>
          <div className="header-right">
            <span className="dataset-tag">
              <span /> Exercise dataset
            </span>
            <div className="header-divider" />
            <span className="reviewer-label" title={accountLabel}>
              {accountLabel}
            </span>
            {storageMode === 'Supabase' && (
              <button
                className="button secondary"
                disabled={!onSignOut || saving}
                onClick={() => {
                  if (
                    Object.entries(drafts).some(
                      ([id, draft]) =>
                        JSON.stringify(draft) !==
                        JSON.stringify(reviews[id] ?? empty),
                    ) &&
                    !window.confirm('Sign out and discard your unsaved drafts?')
                  )
                    return;
                  void onSignOut?.();
                }}
              >
                Sign out
              </button>
            )}
            <div className="avatar small">QA</div>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">COLLECTIONS INTELLIGENCE</div>
              <h1>Every detail matters.</h1>
              <p>Review call summaries. Keep the next conversation informed.</p>
            </div>
            <button className="button secondary" onClick={exportReviews}>
              <ArrowDownToLine size={16} /> Export reviews
            </button>
          </div>
          <div className="stats">
            <div>
              <span className="stat-icon">
                <Headphones size={19} />
              </span>
              <div>
                <span className="stat-number">20</span>
                <span className="stat-label">Calls in this batch</span>
              </div>
            </div>
            <div>
              <span className="stat-icon amber">
                <ListFilter size={19} />
              </span>
              <div>
                <span className="stat-number">
                  {calls.filter((c) => findingsFor(c.id).length).length}
                </span>
                <span className="stat-label">With suggested findings</span>
              </div>
            </div>
            <div>
              <span className="stat-icon green">
                <CheckCheck size={19} />
              </span>
              <div>
                <span className="stat-number">
                  {reviewed}
                  <small> / 20</small>
                </span>
                <span className="stat-label">Reviewed by you</span>
              </div>
              <div className="progress-track">
                <div style={{ width: `${reviewed * 5}%` }} />
              </div>
            </div>
          </div>
          <div className="workbench-heading">
            <h2>
              Summary review <span>20 calls</span>
            </h2>
            <button className="text-button" onClick={() => setShowRules(true)}>
              <ShieldCheck size={15} /> Review guidelines{' '}
              <ChevronRight size={14} />
            </button>
          </div>
          {storageError && (
            <div role="alert" className="alert">
              {storageError}
            </div>
          )}
          <div className="workbench">
            <section className="queue" aria-label="Call queue">
              <div className="queue-controls">
                <label className="search">
                  <Search size={16} />
                  <input
                    aria-label="Search calls"
                    placeholder="Search calls…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Filter calls"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {['All calls', 'Unreviewed', 'Flagged', 'Clear'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="queue-label">
                CALL <span>REVIEW SIGNAL</span>
              </div>
              <div className="call-list">
                {visible.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => choose(c.id)}
                    className={`call-item ${selected === c.id ? 'selected' : ''}`}
                  >
                    <div>
                      <strong>{c.id}</strong>
                      <span className={`signal ${riskFor(c.id).toLowerCase()}`}>
                        {riskFor(c.id) === 'Clear'
                          ? 'No findings'
                          : riskFor(c.id) + ' priority'}
                      </span>
                    </div>
                    <div>
                      <span>
                        20 Oct 2026 <i>·</i> {c.estimated_duration}
                      </span>
                      <span>
                        {reviews[c.id]?.decision &&
                        reviews[c.id].decision !== 'Unreviewed' ? (
                          <Check size={13} />
                        ) : findingsFor(c.id).length ? (
                          `${findingsFor(c.id).length} findings`
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                  </button>
                ))}
                {!visible.length && (
                  <p className="empty">No calls match your filters.</p>
                )}
              </div>
              <div className="queue-footer">
                {visible.length} of 20 calls <span>Synthetic data</span>
              </div>
            </section>
            <section className="review-panel">
              <div className="call-heading">
                <div>
                  <h2>
                    {call.id}
                    <span
                      className={`signal ${riskFor(selected).toLowerCase()}`}
                    >
                      {riskFor(selected) === 'Clear'
                        ? 'No findings'
                        : riskFor(selected) + ' priority'}
                    </span>
                  </h2>
                  <p>
                    20 October 2026 <span>·</span> {call.estimated_duration}{' '}
                    estimated <span>·</span> Transcript reference
                  </p>
                </div>
                <div className="nav-arrows">
                  <button
                    aria-label="Previous call"
                    disabled={calls[0].id === selected}
                    onClick={() => choose(calls[calls.indexOf(call) - 1].id)}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    aria-label="Next call"
                    disabled={calls.at(-1)?.id === selected}
                    onClick={() => choose(calls[calls.indexOf(call) + 1].id)}
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <div className="summary-block">
                <div className="section-label">
                  <FileText size={15} /> GENERATED SUMMARY{' '}
                  <span>Original · unchanged</span>
                </div>
                <p>{call.summary}</p>
              </div>
              <div className="tabs" role="tablist">
                {['Findings', 'Transcript', 'Decision'].map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                  >
                    {t}
                    {t === 'Findings' && <span>{findings.length}</span>}
                  </button>
                ))}
              </div>
              <div className="tab-body">
                {tab === 'Findings' && (
                  <>
                    <div className="analysis-note">
                      <ShieldCheck size={17} />
                      <p>
                        <strong>Evidence-led suggestions</strong> Curated for
                        this exercise. Verify each finding before making your
                        decision.
                      </p>
                    </div>
                    {!findings.length ? (
                      <div className="clear-state">
                        <ShieldCheck size={32} />
                        <h3>No material issues identified</h3>
                        <p>
                          The curated review found no required information lost
                          or changed. Read the transcript to confirm your
                          decision.
                        </p>
                        <button
                          className="button secondary"
                          onClick={() => setTab('Transcript')}
                        >
                          Read transcript <ArrowRight size={15} />
                        </button>
                      </div>
                    ) : (
                      findings.map((f, i) => (
                        <article className="finding" key={f.id}>
                          <div className="finding-top">
                            <span
                              className={`finding-number ${f.severity.toLowerCase()}`}
                            >
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="category">{f.category}</span>
                            <span className="certainty">{f.certainty}</span>
                          </div>
                          <h3>{f.title}</h3>
                          <blockquote>“{f.claim}”</blockquote>
                          <p>{f.explanation}</p>
                          <div className="rule-line">
                            <ShieldCheck size={13} />
                            <span>{f.rule}</span>
                          </div>
                          <div className="finding-bottom">
                            <button
                              className="evidence-link"
                              onClick={() => {
                                setTab('Transcript');
                                setActive(f.turns);
                                setTimeout(() => evidence(f), 80);
                              }}
                            >
                              {selected} / {f.turns.join(', ')}{' '}
                              <ArrowRight size={13} />
                            </button>
                            <div className="finding-actions">
                              {['Confirm', 'Dismiss', 'Unsure'].map((d) => (
                                <button
                                  key={d}
                                  aria-pressed={draft.findings[f.id] === d}
                                  className={
                                    draft.findings[f.id] === d ? 'chosen' : ''
                                  }
                                  onClick={() =>
                                    updateDraft({
                                      findings: {
                                        ...draft.findings,
                                        [f.id]:
                                          draft.findings[f.id] === d ? '' : d,
                                      },
                                    })
                                  }
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </>
                )}
                {tab === 'Transcript' && (
                  <>
                    <div className="transcript-notice">
                      The transcript is the reference. Original synthetic
                      identifiers are shown here; summary privacy rules still
                      apply.
                    </div>
                    {call.transcript.split('\n').map((line) => {
                      const match = line.match(
                        /^(T\d+) \[([^\]]+)\] ([^:]+): (.*)$/,
                      );
                      if (!match) return <p key={line}>{line}</p>;
                      const [, id, time, speaker, text] = match;
                      return (
                        <div
                          key={id}
                          id={`${selected}-${id}`}
                          className={`turn ${active.includes(id) ? 'highlight' : ''}`}
                        >
                          <div>
                            <span>{id}</span>
                            <time>{time}</time>
                            <strong>{speaker}</strong>
                          </div>
                          <p>{text}</p>
                        </div>
                      );
                    })}
                  </>
                )}
                {tab === 'Decision' && (
                  <div className="decision-form">
                    <h3>Your review decision</h3>
                    <p>
                      Assess whether the summary could meaningfully mislead a
                      colleague. Suggestions are separate from your final
                      decision.
                    </p>
                    <label htmlFor="decision">Outcome</label>
                    <select
                      id="decision"
                      value={draft.decision}
                      onChange={(e) =>
                        updateDraft({ decision: e.target.value })
                      }
                    >
                      {[
                        'Unreviewed',
                        'Acceptable',
                        'Needs correction',
                        'Uncertain',
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                    <label htmlFor="notes">Reviewer notes</label>
                    <textarea
                      id="notes"
                      placeholder="Explain your decision, cite turns, or draft a corrected summary…"
                      rows={7}
                      value={draft.notes}
                      onChange={(e) => updateDraft({ notes: e.target.value })}
                    />
                    <p className="saved" role="status">
                      {hasUnsavedChanges
                        ? 'Unsaved changes. Click Save decision to save your review.'
                        : notice ||
                          `Storage: ${storageMode}. Changes are saved only when you click Save decision.`}
                    </p>
                    <div className="decision-count">
                      {Object.values(draft.findings).filter(Boolean).length} of{' '}
                      {findings.length} suggestions assessed
                    </div>
                  </div>
                )}
              </div>
              <div className="review-footer">
                <span>
                  <span
                    className={`status-dot ${review.decision === 'Unreviewed' ? '' : 'done'}`}
                  />
                  {review.decision}
                </span>
                <button
                  className="button primary"
                  disabled={
                    !ready ||
                    saving ||
                    (tab === 'Decision' && !hasUnsavedChanges)
                  }
                  onClick={() =>
                    tab === 'Decision' ? saveDecision() : setTab('Decision')
                  }
                >
                  {tab === 'Decision'
                    ? saving
                      ? 'Saving…'
                      : 'Save decision'
                    : 'Make a decision'}
                  <ArrowRight size={15} />
                </button>
              </div>
            </section>
          </div>
          <footer className="page-footer">
            <span>
              <ShieldCheck size={13} /> Grounded in the transcript. Guided by
              the rules.
            </span>
            <span>{storageMode} storage · 20 fictional calls</span>
          </footer>
          <div className="sr-only" role="status">
            {notice}
          </div>
        </main>
      </div>
      {showRules && (
        <div className="modal-backdrop" onClick={() => setShowRules(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guidelines-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2 id="guidelines-title">Review guidelines</h2>
              <button
                autoFocus
                onClick={() => setShowRules(false)}
                aria-label="Close guidelines"
              >
                <X size={20} />
              </button>
            </div>
            <p>
              Judge the summary against the transcript and the supplied
              generation rules, not external account records.
            </p>
            {rules.map(([title, description]) => (
              <div className="guideline" key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
            <button
              className="button primary"
              onClick={() => setShowRules(false)}
            >
              Return to review <Check size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
