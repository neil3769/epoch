import type { Walkthrough } from '../schema';

/*
 * Walkthrough 14: a model gateway that routes, caches and limits LLM calls,
 * through the seven-step framework. Unlocks after S1-S4, S9 (rate limiting),
 * S10 (reliability) and S12 (AI systems).
 */
export const modelGateway: Walkthrough = {
  id: 'w-model-gateway',
  title: 'Model gateway',
  question: 'Design a model gateway: one internal service through which every team calls large language models, with routing, caching, limits and cost tracking.',
  needs: ['S1', 'S2', 'S3', 'S4', 'S9', 'S10', 'S12'],
  minutes: 18,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "40 teams use three model providers. 2,000 calls a second at peak. Each team has a monthly budget."',
      exercises: [
        {
          id: 'wmg-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'One API for all providers', bucket: 0, why: 'The point of a gateway.' },
            { text: 'Budgets and limits per team', bucket: 0, why: 'Stated by the interviewer.' },
            { text: 'Fallback when a provider fails', bucket: 0, why: 'Every AI feature depends on it.' },
            { text: 'Cost recorded per team', bucket: 0, why: 'Budgets need it.' },
            { text: 'Training our own model', bucket: 1, why: 'Far outside a gateway\'s job.' },
            { text: 'A chat interface', bucket: 1, why: 'Teams build their own products on top.' },
          ],
          explain: 'Route, limit, cache, record.',
        },
        {
          id: 'wmg-1-2',
          type: 'mcq',
          prompt: 'Which non-functional requirement matters most?',
          options: [
            { text: 'Little added latency, high uptime' },
            { text: 'Cheapest model for every call', why: 'Teams choose quality per use; the gateway enforces budgets.' },
            { text: 'Store every prompt forever', why: 'A privacy risk and a cost; keep logs for a set time.' },
          ],
          answer: 0,
          explain: 'If the gateway is down, every AI feature is down.',
        },
        {
          id: 'wmg-1-3',
          type: 'scenario',
          prompt: 'Where do the provider API keys live?',
          situation: 'Each provider issues keys that can spend the company\'s money.',
          needs: ['Keys do not leak', 'Total spend is visible and capped'],
          options: [
            { text: 'Only in the gateway', cost: 'One more hop for every call.' },
            {
              text: 'In each team\'s code',
              cost: 'One hop fewer.',
              why: 'Keys spread and leak, and nobody can see or cap total spend.',
            },
          ],
          answer: 0,
          explain: 'Teams get their own gateway keys, which can be limited and revoked.',
        },
      ],
      strong: 'One API across providers, with per-team keys, budgets and rate limits, fallback between providers and cost recorded per call; the gateway must add little latency and stay up, and provider keys live only inside it.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "A call averages 1,500 input and 500 output tokens, and takes about 4 seconds. The average rate is a quarter of the peak."',
      exercises: [
        {
          id: 'wmg-2-1',
          type: 'estimate',
          prompt: 'At peak, how many calls are in flight at once?',
          expr: '2000 * 4',
          answer: 8000,
          tolerance: 2,
          unit: 'calls',
          options: [
            { value: 800, why: '2,000 a second × 4 seconds each = 8,000.' },
            { value: 8000 },
            { value: 80000, why: 'Little\'s law: rate × time = 2,000 × 4 = 8,000.' },
          ],
          work: ['In flight = rate × time = 2,000/s × 4 s = 8,000'],
          explain: 'Little\'s law: most of the gateway\'s work is waiting.',
        },
        {
          id: 'wmg-2-2',
          type: 'estimate',
          prompt: 'Tokens per day, at the average rate?',
          expr: '2000 / 4 * DAY * 2000 / 1e9',
          answer: 86.4,
          tolerance: 2,
          unit: 'billion tokens',
          options: [
            { value: 9, why: '500 calls/s × 86,400 s × 2,000 tokens ≈ 8.6 × 10¹⁰.' },
            { value: 90 },
            { value: 900, why: '4.3 × 10⁷ calls × 2,000 tokens is about 86 billion.' },
          ],
          work: ['500 calls/s × 86,400 s ≈ 4.3 × 10⁷ calls a day', '× 2,000 tokens ≈ 8.6 × 10¹⁰ = 86 billion'],
          explain: 'Billions of tokens a day: cost tracking matters.',
        },
        {
          id: 'wmg-2-3',
          type: 'mcq',
          prompt: 'About 8,000 calls in flight at once. What does the gateway need?',
          options: [
            { text: 'Async I/O: cheap waits on many calls' },
            { text: 'One thread per call, many hosts', why: 'Works, but 8,000 waiting threads waste memory; async waits cheaply.' },
            { text: 'A GPU in every gateway server', why: 'The gateway forwards calls; providers run the models.' },
          ],
          answer: 0,
          explain: 'A few async servers can hold thousands of open calls each.',
        },
      ],
      strong: 'About 8,000 calls in flight at peak and roughly 86 billion tokens a day: the gateway mostly waits, so it uses async I/O, and the token volume makes per-team cost tracking essential.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'Teams call the gateway, never a provider directly.',
      exercises: [
        {
          id: 'wmg-3-1',
          type: 'mcq',
          prompt: 'What request format do teams use?',
          options: [
            { text: 'One request shape for all models' },
            { text: 'Each provider\'s own format', why: 'Switching providers would mean rewriting every team\'s code.' },
            { text: 'A SQL interface to models', why: 'Models take messages, not queries.' },
          ],
          answer: 0,
          explain: 'The gateway translates to each provider\'s format.',
        },
        {
          id: 'wmg-3-2',
          type: 'match-pairs',
          prompt: 'Match each part of the API to what it is for.',
          pairs: [
            { left: 'Team key header', right: 'who is calling, for limits', why: 'Limits and costs are per team.' },
            { left: 'model: "fast" or "best"', right: 'a tier, not a vendor', why: 'The gateway maps tiers to models.' },
            { left: '429 with Retry-After', right: 'over the team\'s limit', why: 'As in S9.' },
            { left: 'Usage in the response', right: 'tokens and cost of this call', why: 'Teams see what they spend.' },
          ],
          explain: 'Tiers let the gateway change models without teams changing code.',
        },
        {
          id: 'wmg-3-3',
          type: 'predict-output',
          prompt: 'Each tier lists models in order of preference; large-a is down. What does each tier route to?',
          code: `routes = {
    "fast": ["mini-a", "mini-b"],
    "best": ["large-a", "large-b"],
}
down = {"large-a"}
def pick(tier):
    for m in routes[tier]:
        if m not in down:
            return m
print(pick("fast"), pick("best"))`,
          answer: 'mini-a large-b',
          typedWrong: [{ answer: 'mini-a large-a', why: 'large-a is down, so the next model in the list is used.' }],
          explain: '"Down" comes from health checks and circuit breakers (S10).',
        },
      ],
      strong: 'One request shape with a team key and a tier ("fast", "best") instead of a vendor; the gateway maps tiers to models in order of preference, returns 429 with Retry-After over limits, and reports usage on every response.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Hot counters in memory, configuration in a database, usage in a log.',
      exercises: [
        {
          id: 'wmg-4-1',
          type: 'bucket-sort',
          prompt: 'Where does each piece of data live?',
          buckets: ['Memory store', 'Database', 'Log store'],
          items: [
            { text: 'Token counters per team', bucket: 0, why: 'Updated on every call: must be fast.' },
            { text: 'Exact-match answer cache', bucket: 0, why: 'Read on every call.' },
            { text: 'Team budgets and keys', bucket: 1, why: 'Small, changed rarely, must be durable.' },
            { text: 'Routing configuration', bucket: 1, why: 'Edited by people, cached in the gateways.' },
            { text: 'Each call\'s tokens and cost', bucket: 2, why: 'Billions of rows, appended, summed later.' },
            { text: 'Latency of each call', bucket: 2, why: 'For dashboards and alerts.' },
          ],
          explain: 'Hot, durable, and append-only data each go where they fit.',
        },
        {
          id: 'wmg-4-2',
          type: 'predict-output',
          prompt: 'Prices are in dollars per million tokens. What does one average call cost?',
          code: `price = {"in": 3, "out": 15}  # $/M
def cost(tin, tout):
    c = tin * price["in"]
    c += tout * price["out"]
    return c / 1e6
print(round(cost(1500, 500), 4))`,
          answer: '0.012',
          typedWrong: [{ answer: '12000', why: 'Prices are per million tokens: divide by a million.' }],
          explain: 'About a cent a call; 43 million calls a day is about $500,000.',
        },
        {
          id: 'wmg-4-3',
          type: 'mcq',
          prompt: 'What is the key of the exact-match cache?',
          options: [
            { text: 'A hash of model, prompt, settings' },
            { text: 'The calling team and the time', why: 'Unrelated to what the answer is.' },
            { text: 'The prompt text, nothing else', why: 'Different models or temperatures give different answers.' },
          ],
          answer: 0,
          explain: 'Everything that changes the answer belongs in the key (S12).',
        },
      ],
      strong: 'Per-team token counters and the exact-match cache in an in-memory store; budgets, keys and routing in a database, cached in each gateway; every call\'s tokens, cost and latency appended to a log store for reports.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Stateless gateways in front of the providers, with shared counters beside them.',
      exercises: [
        {
          id: 'wmg-5-1',
          type: 'diagram',
          prompt: 'Every call checks the team\'s counters and the cache. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 't', kind: 'client', label: 'Team apps' },
              { id: 'g', kind: 'service', label: 'Gateway' },
              { id: 'k', kind: 'cache', label: 'Counters' },
              { id: 'p', kind: 'api', label: 'Providers' },
            ],
            edges: [
              { from: 't', to: 'g' },
              { from: 'g', to: 'k' },
              { from: 'g', to: 'p' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'k',
            options: [
              { kind: 'cache', label: 'In-memory' },
              { kind: 'db', label: 'SQL rows', why: 'A disk write per call at 2,000 a second adds latency to every call.' },
              { kind: 'queue', label: 'Queue', why: 'The limit decision is needed now, not later.' },
            ],
            answer: 0,
          },
          explain: 'Shared by all gateway servers, updated atomically (S9).',
        },
        {
          id: 'wmg-5-2',
          type: 'diagram',
          prompt: 'Tap how a call\'s usage reaches the spend reports.',
          diagram: {
            nodes: [
              { id: 't', kind: 'client', label: 'Team apps' },
              { id: 'g', kind: 'service', label: 'Gateway' },
              { id: 'k', kind: 'cache', label: 'Counters' },
              { id: 'p', kind: 'api', label: 'Providers' },
              { id: 'l', kind: 'queue', label: 'Usage log' },
              { id: 'd', kind: 'db', label: 'Spend' },
            ],
            edges: [
              { from: 't', to: 'g' },
              { from: 'g', to: 'k' },
              { from: 'g', to: 'p' },
              { from: 'g', to: 'l' },
              { from: 'l', to: 'd' },
            ],
          },
          goal: { kind: 'path', answer: ['g', 'l', 'd'] },
          explain: 'Counters give the live limit; the log gives exact totals for reports.',
        },
        {
          id: 'wmg-5-3',
          type: 'mcq',
          prompt: 'Why write usage through a queue rather than straight to the database?',
          options: [
            { text: 'The call need not wait for it' },
            { text: 'Queues compute the cost', why: 'The gateway computes it; the queue only carries it.' },
            { text: 'Databases cannot store usage', why: 'They can; the point is not slowing each call.' },
          ],
          answer: 0,
          explain: 'And a database hiccup never fails a model call.',
        },
      ],
      strong: 'Team apps → stateless gateway servers (several, in two regions) → providers; the gateways check and update shared counters and the cache, and publish usage to a log that fills the spend database.',
      diagram: {
        nodes: [
          { id: 't', kind: 'client', label: 'Team apps' },
          { id: 'g', kind: 'service', label: 'Gateway' },
          { id: 'k', kind: 'cache', label: 'Counters' },
          { id: 'p', kind: 'api', label: 'Providers' },
          { id: 'l', kind: 'queue', label: 'Usage log' },
          { id: 'd', kind: 'db', label: 'Spend' },
        ],
        edges: [
          { from: 't', to: 'g', label: 'team key' },
          { from: 'g', to: 'k', label: 'limits' },
          { from: 'g', to: 'p', label: 'route' },
          { from: 'g', to: 'l', dashed: true },
          { from: 'l', to: 'd' },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: providers that fail, budgets that run out, and caches that answer the wrong question.',
      exercises: [
        {
          id: 'wmg-6-1',
          type: 'scenario',
          prompt: 'Provider A starts timing out on 30% of calls.',
          situation: 'Provider B offers a comparable model.',
          needs: ['Teams keep getting answers', 'Provider A is not swamped'],
          options: [
            { text: 'Breaker opens; fail over to B', cost: 'B may answer slightly differently.' },
            {
              text: 'Retry A until it answers',
              cost: 'Same model every time.',
              why: 'Retries pile onto a struggling provider (S10).',
            },
            {
              text: 'Return errors to all teams',
              cost: 'Honest and simple.',
              why: 'Every AI feature fails while a working provider sits idle.',
            },
          ],
          answer: 0,
          explain: 'The breaker lets a trickle through to A and closes when it recovers.',
        },
        {
          id: 'wmg-6-2',
          type: 'predict-output',
          prompt: 'A team has almost used its budget. The gateway checks with an estimated cost before calling. What does this print?',
          code: `budget, spent = 500.0, 499.99
est = 0.012
def allow():
    return spent + est <= budget
print(allow())`,
          answer: 'False',
          typedWrong: [{ answer: 'True', why: '499.99 + 0.012 = 500.002, just over 500.' }],
          explain: 'Check with an estimate before the call; record the actual cost after it.',
        },
        {
          id: 'wmg-6-3',
          type: 'mcq',
          prompt: 'Should the gateway use a semantic cache for every team?',
          options: [
            { text: 'Only where a team opts in' },
            { text: 'Yes, for every single call', why: 'A similar question can need a different answer, such as for account-specific data (S12).' },
            { text: 'Never, in any case at all', why: 'For FAQ-style features it saves real money.' },
          ],
          answer: 0,
          explain: 'Exact-match caching is safe everywhere; semantic caching only where near-misses are acceptable.',
        },
      ],
      strong: 'Circuit breakers fail over between providers by tier; budgets are checked with an estimate before each call and charged the actual cost after; exact caching is on for all, semantic caching only where a team opts in.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'The gateway is now in front of everything. Make it survive, and keep teams from hurting each other.',
      exercises: [
        {
          id: 'wmg-7-1',
          type: 'mcq',
          prompt: 'The gateway is a single point of failure for every AI feature. What do you do?',
          options: [
            { text: 'Many stateless copies, two regions' },
            { text: 'One very large gateway machine', why: 'One machine failing still takes everything down.' },
            { text: 'Let teams call providers directly', why: 'Loses budgets, key safety and cost tracking.' },
          ],
          answer: 0,
          explain: 'Stateless servers behind a load balancer; shared state lives in the replicated stores.',
        },
        {
          id: 'wmg-7-2',
          type: 'scenario',
          prompt: 'One team\'s batch job sends 1,500 calls a second and starves the others.',
          situation: 'Providers cap the company\'s total rate.',
          needs: ['Interactive features stay fast', 'The batch job still finishes'],
          options: [
            { text: 'Per-team limits and priority', cost: 'The batch job runs slower.' },
            {
              text: 'Add more gateway servers',
              cost: 'More capacity in the gateway.',
              why: 'The providers\' caps are shared; more gateways do not raise them.',
            },
          ],
          answer: 0,
          explain: 'Interactive calls first; batch fills the spare capacity (a bulkhead, S10).',
        },
        {
          id: 'wmg-7-3',
          type: 'bucket-sort',
          prompt: 'Which jobs belong in the gateway, and which in each team?',
          buckets: ['In the gateway', 'In each team'],
          items: [
            { text: 'Holding provider keys', bucket: 0, why: 'One safe place for secrets.' },
            { text: 'Budgets per team', bucket: 0, why: 'Enforced centrally, so they hold.' },
            { text: 'Fallback between providers', bucket: 0, why: 'Done once for everyone.' },
            { text: 'Writing the prompts', bucket: 1, why: 'Only the team knows its feature.' },
            { text: 'Judging answer quality', bucket: 1, why: 'Only the team knows what a good answer is.' },
            { text: 'Choosing fast or best tier', bucket: 1, why: 'A product decision for each feature.' },
          ],
          explain: 'The gateway handles shared concerns; teams own their features.',
        },
      ],
      strong: 'Many stateless gateway copies across two regions remove the single point of failure; per-team limits with priority stop batch jobs starving interactive features; the gateway owns keys, budgets and fallback, teams own prompts and quality.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 't', kind: 'client', label: 'Team apps' },
        { id: 'g', kind: 'service', label: 'Gateway' },
        { id: 'k', kind: 'cache', label: 'Counters' },
        { id: 'p', kind: 'api', label: 'Providers' },
        { id: 'l', kind: 'queue', label: 'Usage log' },
        { id: 'd', kind: 'db', label: 'Spend' },
      ],
      edges: [
        { from: 't', to: 'g', label: 'team key' },
        { from: 'g', to: 'k', label: 'limits' },
        { from: 'g', to: 'p', label: 'route' },
        { from: 'g', to: 'l', dashed: true },
        { from: 'l', to: 'd' },
      ],
    },
    decisions: [
      'One request shape; teams ask for a tier, the gateway picks the model.',
      'Provider keys only in the gateway; teams get revocable gateway keys.',
      'Per-team limits and budgets from shared in-memory counters; usage logged through a queue.',
      'Circuit breakers fail over between providers; async I/O holds about 8,000 calls in flight.',
      'Exact caching for all; semantic caching only where a team opts in.',
    ],
  },
  blank: {
    requirements: [
      'One API to several model providers',
      'Per-team budgets and rate limits',
      'Fallback when a provider fails',
      'Cost recorded per team and call',
      'Little added latency; always up',
    ],
    components: ['client', 'service', 'cache', 'api', 'queue', 'db'],
    firstFive: [
      'Ask the number of teams, providers and calls a second',
      'Say the gateway must add little latency and never be the outage',
      'Estimate calls in flight with Little\'s law',
      'Choose tiers instead of vendor names in the API',
      'Explain limits, budgets and fallback before caching',
    ],
  },
};
