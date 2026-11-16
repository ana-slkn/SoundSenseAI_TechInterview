import source from '../soundsense-exercise-data/candidate-calls.json';
export type Category =
  'Contradiction' | 'Unsupported claim' | 'Required omission' | 'Rule breach';
export type Finding = {
  id: string;
  category: Category;
  severity: 'High' | 'Medium' | 'Low';
  title: string;
  claim: string;
  explanation: string;
  rule: string;
  turns: string[];
  certainty: 'Definite' | 'Needs judgement';
};
export type Call = (typeof source)[number];
export const calls: Call[] = [...source].sort((a, b) =>
  a.id.localeCompare(b.id),
);
const f = (
  category: Category,
  severity: Finding['severity'],
  title: string,
  claim: string,
  explanation: string,
  rule: string,
  turns: string[],
  certainty: Finding['certainty'] = 'Definite',
): Finding => ({
  id: '',
  category,
  severity,
  title,
  claim,
  explanation,
  rule,
  turns,
  certainty,
});
const fixtures: Record<string, Finding[]> = {
  'CALL-002': [
    f(
      'Contradiction',
      'High',
      'Payment promise changed',
      'agreed to pay £150',
      'The customer corrected £150 to £100. The agreed commitment is £100 through the portal on 23 October.',
      'Future promises: preserve the final agreed amount, date and method.',
      ['T14', 'T15', 'T16'],
    ),
  ],
  'CALL-003': [
    f(
      'Contradiction',
      'High',
      'Consent was explicitly refused',
      'Consent gained to record vulnerability',
      'The customer refused permission to record anxiety and the agent acknowledged that refusal.',
      'Consent requires permission and customer agreement.',
      ['T09', 'T10', 'T11'],
    ),
    f(
      'Required omission',
      'High',
      'No money for food is missing',
      'they reported anxiety',
      'The customer explicitly has no money for food. This severe hardship must be retained alongside the partner leaving with all savings.',
      'Severe hardship: preserve specific crises.',
      ['T08'],
    ),
    f(
      'Rule breach',
      'Medium',
      'Arrears amount must be removed',
      'arrears of £460',
      'The figure is supported, but current arrears values are prohibited. Use “arrears were discussed”.',
      'Arrears/balances: never include numerical values.',
      ['T05'],
    ),
  ],
  'CALL-008': [
    f(
      'Unsupported claim',
      'High',
      'Default notice was not established',
      'confirmed a default notice had been issued',
      'The transcript mentions an arrears letter and missed payment, but never establishes that a default notice was issued. Remove this claim. Absence is assessed against the entire transcript.',
      'Only report events supported by the transcript.',
      ['T06', 'T07', 'T15'],
    ),
  ],
  'CALL-009': [
    f(
      'Contradiction',
      'High',
      'Deferral described as a refusal',
      'refused an I&E assessment',
      'The customer agrees to an assessment tomorrow evening; they cannot do it while at work. Record a deferral to 21 October after 6 pm, not refusal.',
      'Distinguish a deferred assessment from a declined assessment.',
      ['T11', 'T12', 'T13', 'T14', 'T15', 'T20'],
    ),
  ],
  'CALL-010': [
    f(
      'Required omission',
      'High',
      'Specific Direct Debit cancellation cause lost',
      'A new Direct Debit instruction was set up',
      'The husband cancelled the Direct Debit by mistake while separating joint finances during divorce. This explains the missed payment and must be retained.',
      'Specific cause: do not generalise or omit the reason for non-payment.',
      ['T08', 'T09', 'T10'],
    ),
  ],
  'CALL-011': [
    f(
      'Required omission',
      'Medium',
      'Website signposting omitted',
      'referred to MoneyHelper',
      'The agent also directed the customer to the company support page. Include “customer signposted”.',
      'Signposting: use the required phrase when company website support is advised.',
      ['T15', 'T22'],
    ),
  ],
  'CALL-012': [
    f(
      'Contradiction',
      'High',
      'Temporary authority made ongoing',
      'ongoing Authority to Act was verified',
      'Authority for the father applies only to this call. Ongoing access was explicitly excluded.',
      'Authority to Act: preserve its verified scope.',
      ['T07', 'T08', 'T09', 'T23'],
    ),
  ],
  'CALL-013': [
    f(
      'Contradiction',
      'High',
      'Future promise reported as a completed payment',
      'Payment made',
      'No payment was taken today. The £60 bank transfer is a future promise for 23 October.',
      'Actions taken: only report payment made when successful.',
      ['T12', 'T17', 'T22', 'T23'],
    ),
    f(
      'Required omission',
      'Medium',
      'Declined immediate payment omitted',
      'customer agreed to pay £60',
      'The agent explicitly requested a payment during the call and the customer declined because funds were unavailable.',
      'Payment attempts: record explicit unsuccessful attempts to secure payment.',
      ['T11', 'T12'],
    ),
  ],
  'CALL-014': [
    f(
      'Rule breach',
      'Medium',
      'Identifying employer retained',
      'Cedar Lane Distribution',
      'Remove the employer name while retaining the gap between jobs and the partial first wage.',
      'Privacy: redact identifying employers and other private entities.',
      ['T08'],
    ),
  ],
  'CALL-015': [
    f(
      'Required omission',
      'High',
      'Explicit warning missing',
      'An I&E assessment was arranged',
      'The agent explicitly warned of risk of further action. This warning must be reported using that phrase.',
      'Consequences: include “risk of further action” when explicitly warned.',
      ['T13', 'T15'],
    ),
    f(
      'Required omission',
      'Medium',
      'Reason for loss of second job missing',
      'Loss of an evening cleaning job',
      'The office closed and the customer was not relocated. Include this specific cause, rather than only the loss of work.',
      'Specific cause: preserve the events causing hardship.',
      ['T08'],
    ),
  ],
  'CALL-016': [
    f(
      'Rule breach',
      'Medium',
      'Immediate payment amount exposed',
      'Payment of £230 made',
      'The payment succeeded, but its amount must be removed. Use “Payment made.” Future payment amounts are treated differently.',
      'Immediate payments: never include amounts taken during the call.',
      ['T10', 'T14'],
    ),
  ],
  'CALL-017': [
    f(
      'Contradiction',
      'High',
      'Contact hold extended incorrectly',
      'thirty-day hold',
      'The applied hold is fourteen days, not thirty. A colleague could otherwise delay necessary contact.',
      'Actions taken: preserve the actual hold duration.',
      ['T13', 'T19'],
    ),
    f(
      'Required omission',
      'High',
      'Bereavement and frozen funds omitted',
      'Consent gained to record vulnerability',
      'The customer’s mother died and their joint bank account was frozen, trapping the money reserved for the car. Employment continues; access to funds is the obstacle.',
      'Severe hardship: retain bereavement and frozen-account specifics.',
      ['T06', 'T08', 'T10', 'T11', 'T12'],
    ),
  ],
  'CALL-018': [
    f(
      'Contradiction',
      'High',
      'Authority reported despite refusal',
      'Authority to Act was verified',
      'The customer refused authority and the agent refused disclosure to the partner. Record that no Authority to Act was granted.',
      'Third parties: record refusal to discuss details without authority.',
      ['T08', 'T10', 'T22'],
    ),
    f(
      'Required omission',
      'Medium',
      'I&E refusal missing',
      'The agent checked understanding',
      'The customer explicitly declined the assessment; the agent acknowledged it.',
      'I&E refusal: state when the customer declines an assessment.',
      ['T14', 'T15', 'T16'],
    ),
  ],
  'CALL-019': [
    f(
      'Contradiction',
      'Medium',
      'Call direction reversed',
      'The customer called the company',
      'The agent initiated contact asking for the customer. The company called and reached the customer.',
      'Contact outcome: infer direction from the opening exchange.',
      ['T01', 'T02'],
    ),
    f(
      'Required omission',
      'High',
      'Consent confirmation missing',
      'customer disclosed the condition',
      'The customer agreed to recording depression and reduced pay. Include “Consent gained to record vulnerability”.',
      'Consent: explicitly record when permission was obtained.',
      ['T09', 'T10', 'T11'],
    ),
    f(
      'Contradiction',
      'Medium',
      'Callback window made exact',
      '23 October at 2 pm',
      'The agreed window is after 2 pm, not an appointment at exactly 2 pm.',
      'Next steps: retain the agreed timing and qualifications.',
      ['T15', 'T22'],
    ),
  ],
  'CALL-020': [
    f(
      'Contradiction',
      'High',
      'Tentative amount turned into a promise',
      'agreed to pay £80 on 23 October',
      'The customer explicitly withdrew the tentative £80 and the agent agreed not to record a promise. The Friday call is for review.',
      'Future promises: distinguish suggestions from commitments.',
      ['T16', 'T17', 'T22'],
    ),
    f(
      'Required omission',
      'High',
      'Risk warning omitted',
      'neither the notice nor all arrears were resolved',
      'The agent explicitly states that the account remains at risk of further action. Preserve that warning.',
      'Consequences: include “risk of further action” when warned.',
      ['T19'],
    ),
    f(
      'Required omission',
      'Medium',
      'Childcare cost missing',
      'emergency childcare during a three-day school closure',
      'The £210 emergency childcare cost affected ability to pay and is required.',
      'Situational costs: include specific financial values.',
      ['T10', 'T12'],
    ),
  ],
};
export function findingsFor(id: string): Finding[] {
  return (fixtures[id] ?? []).map((finding, i) => ({
    ...finding,
    id: `${id}-F${i + 1}`,
  }));
}
export function riskFor(id: string) {
  const findings = findingsFor(id);
  return findings.some((f) => f.severity === 'High')
    ? 'High'
    : findings.length
      ? 'Medium'
      : 'Clear';
}
export const rules = [
  [
    'Evidence first',
    'Use the supplied transcript as the sole factual reference. An unsupported claim is not proof that the opposite happened. Cite call ID and local turn ID together.',
  ],
  [
    'Material accuracy',
    'Preserve payment success or failure, final promises, dates, methods, authority scope, consent and consequences. Distinguish deferrals, proposals and confirmed commitments.',
  ],
  [
    'Required details',
    'Include specific hardship causes, situational costs, severe crises, zero-hour work, explicit I&E refusals, vulnerability consent and relevant advice or holds when discussed.',
  ],
  [
    'Privacy and amounts',
    'Remove names, phone numbers and identifying entities. Retain named advice bodies. Hide arrears, balances and immediate payment amounts; retain situational costs and future promises.',
  ],
  [
    'DPA and call status',
    'For agent–customer calls, say DPA completed only after full verification or confirmed pre-call security; otherwise use “no DPA stated with agent”. Apply special incomplete, internal and voicemail rules.',
  ],
  [
    'Acceptable summarisation',
    'Paraphrasing and shortening are acceptable when the meaning and required details remain. Do not flag a category merely because it is absent. Ignore ASR artefacts during holds.',
  ],
  [
    'Format and terminology',
    'Use professional British English, complete sentences and 2–5 sentences. Use “next steps”, “customer signposted” for company website support, and “risk of further action” for explicit warnings.',
  ],
];
