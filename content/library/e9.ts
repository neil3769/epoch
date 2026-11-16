import type { LibraryPage } from '../schema';

/** Unit E9 summary page: unlocked in the Library when the unit is finished. */
export const e9Library: LibraryPage = {
  unit: 'E9',
  ideas: [
    {
      title: 'Cost',
      text: 'Cost per request = input tokens × input price + output tokens × output price (prices per million tokens; output costs several times more). Read the tokens from each response\'s usage, log them, and break totals down by model: a few large-model requests often dominate.',
    },
    {
      title: 'Latency',
      text: 'p50 is the typical request; p95 the tail that users remember. Report both, never only the mean. For chat, time to first token matters more than total time, which is why streaming helps.',
    },
    {
      title: 'Traces and logs',
      text: 'A trace follows one request; spans time each stage. Open the slowest traces and fix the longest span. Log one structured record per request (id, model, tokens, cost, latency, status), never secrets, and raw prompts only with redaction and a retention limit.',
    },
    {
      title: 'Routing and caching',
      text: 'Send requests to a small model first and escalate on a check code can verify (schema, citations, tests), or route by a rule. Cache repeated questions by a normalised key that includes the model and prompt version, and expire stale entries.',
    },
    {
      title: 'Before and after',
      text: 'Change one thing; run the same golden set; compare cost, p50, p95 and quality in one table; state trade-offs plainly.',
    },
  ],
  rules: [
    'cost = tin × pin + tout × pout, per million.',
    'Report p50 and p95, not the mean.',
    'Fix the longest span first.',
    'One structured log record per request; no secrets.',
    'Small model first; escalate on a check.',
    'Cache key = question + model + prompt version.',
    'One change per measurement; quality in every table.',
  ],
  example: {
    code: [
      'def cost(r):',
      '    pin, pout = PRICES[r["model"]]',
      '    a = r["input_tokens"] * pin',
      '    b = r["output_tokens"] * pout',
      '    return (a + b) / 1e6',
      '',
      'lat = [r["latency_ms"] for r in LOGS]',
      'p50, p95 = np.percentile(',
      '    lat, [50, 95])',
      'total = sum(map(cost, LOGS))',
      'print(round(total, 4),',
      '      round(p50), round(p95))',
    ].join('\n'),
    output: '0.066 722 2000',
    notes: [
      'Cost per request from the logged token counts and the price table.',
      'p50 and p95 in one call.',
      'Forty requests: about 7 cents, 0.7 s typical, 2 s in the tail.',
    ],
  },
  mistakes: [
    { mistake: 'Reporting mean latency.', fix: 'p50 and p95.' },
    { mistake: 'Ignoring output-token prices.', fix: 'They are several times the input price.' },
    { mistake: 'Logging keys or raw personal data.', fix: 'Mask secrets; redact prompts.' },
    { mistake: 'A cache keyed only on the question.', fix: 'Add model and prompt version; normalise.' },
    { mistake: 'Shipping two optimisations at once.', fix: 'Measure one change at a time.' },
    { mistake: 'Calling a cheaper, worse system an improvement.', fix: 'Show quality next to cost.' },
  ],
  forReal:
    'The app\'s logs, prices and clock are simulated. For real (plan weeks 11 and 12): add tracing to your flagship with OpenTelemetry or Langfuse, log one record per request, and build a small dashboard of cost per request, p50 and p95. Then route to a smaller model and add caching, one at a time, each with a before/after table on your golden set.',
};
