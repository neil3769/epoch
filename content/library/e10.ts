import type { LibraryPage } from '../schema';

/** Unit E10 summary page: unlocked in the Library when the unit is finished. */
export const e10Library: LibraryPage = {
  unit: 'E10',
  ideas: [
    {
      title: 'The risk list',
      text: 'OWASP\'s Top 10 for LLM applications names the usual failures: prompt injection, sensitive information disclosure, excessive agency, supply chain, data and model poisoning, improper output handling, system prompt leakage, vector and embedding weaknesses, misinformation and unbounded consumption. The 2025 edition is the one on the official site at the time of writing; a 2026 update reorders the list, moving excessive agency up. Check genai.owasp.org for the current edition.',
    },
    {
      title: 'Prompt injection',
      text: 'Instructions and data share one stream of text, so content the app reads (pages, emails, files, tool results) can carry instructions. Filters and fences reduce it; nothing prevents it. Design so that a fooled model can do little harm.',
    },
    {
      title: 'Data leakage',
      text: 'Anything in the context can come out. Keep secrets out of prompts, fetch only the current user\'s data, redact personal data before the model and the logs, and assume the system prompt is public.',
    },
    {
      title: 'Agency',
      text: 'Fewest tools, scoped to the user, read-only by default, a person approves anything destructive or costly, step and spend limits. All enforced in the code that runs tools.',
    },
    {
      title: 'Output and fallback',
      text: 'Escape output before rendering, validate it before acting, never eval it. Retry 429 and 5xx briefly, fall back to a second provider with the same contract, and fail with a clear message.',
    },
  ],
  rules: [
    'Name the risk first; the fix follows.',
    'Assume the model can be fooled; limit what it can do.',
    'No secrets in prompts.',
    'Filter data by user before retrieval.',
    'Check permissions in code, not in the prompt.',
    'Escape, validate, never eval.',
    'Fall back on 429, 5xx and timeouts; not on 4xx.',
  ],
  example: {
    code: [
      'ALLOWED = {"lookup_order"}',
      '',
      'def run(name, args):',
      '    if name not in ALLOWED:',
      '        return {"error": "denied"}',
      '    return sim.call_tool(name, args)',
      '',
      'reply = "<b>hi</b>"',
      'print(run("calculator", {}))',
      'print(html.escape(reply))',
    ].join('\n'),
    output: "{'error': 'denied'}\n&lt;b&gt;hi&lt;/b&gt;",
    notes: [
      'The allowlist runs before any tool.',
      'Output is escaped before it reaches a page.',
      'Neither depends on the model behaving.',
    ],
  },
  mistakes: [
    { mistake: 'Relying on "ignore injected instructions" in the prompt.', fix: 'Limit tools and data instead.' },
    { mistake: 'Keys or codes in the system prompt.', fix: 'Keep them server side, in tools.' },
    { mistake: 'Retrieving every user\'s data, then asking the model to filter.', fix: 'Filter in the query.' },
    { mistake: 'Approval rules written only in the prompt.', fix: 'Check them in the tool code.' },
    { mistake: 'Rendering or eval-ing raw model output.', fix: 'Escape for pages; parse strictly for actions.' },
    { mistake: 'Falling back on a 400.', fix: 'Fix the request; fall back on 429 and 5xx.' },
  ],
  forReal:
    'The app\'s models and tools are simulated. For real (plan week 13): read the current OWASP Top 10 for LLM applications on genai.owasp.org, then red-team your flagship: plant an instruction in a document it retrieves, ask it for its prompt, and try to make its tools do something the user should not. Fix what you find with the layers from this unit (fencing, per-user filtering, an allowlist with approval, output validation), add a fallback provider, and write the results up in the project README.',
};
