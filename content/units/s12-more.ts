import type { Lesson } from '../schema';

/* S12 lessons 5-9: exact and semantic caching, a model gateway, cost per request, feedback and evaluation loops, checkpoint. */
export const s12More: Lesson[] = [
  // ------------------------------------------------------------------ 5
  {
    id: 's12-05',
    title: 'Exact and semantic caching',
    summary: 'Exact caches are always right but rarely hit; semantic caches hit more but can answer a different question.',
    card: {
      title: 'Exact and semantic caching',
      text: 'An exact cache keys on the whole request (model, prompt and settings), so a hit is always the right answer but only identical requests hit. A semantic cache embeds the question and reuses the answer to a close enough earlier question, which hits far more often but can answer a subtly different question. Use exact caching freely; use semantic caching only where a near miss is harmless, with a strict threshold and nothing personal in the cached answers.',
      see: ['e9-06'],
    },
    exercises: [
      {
        id: 's12-5-1',
        type: 'predict-output',
        prompt: 'The cache key includes the model. Which lookups hit?',
        code: `def key(model, prompt, temp):
    return (model, prompt, temp)

cache = {key("m1", "Hi", 0): "Hello!"}
print(key("m1", "Hi", 0) in cache,
      key("m2", "Hi", 0) in cache)`,
        answer: 'True False',
        typedWrong: [{ answer: 'True True', why: 'A different model is a different key.' }],
        explain: 'Leave the model out and an upgrade keeps serving the old model\'s answers.',
      },
      {
        id: 's12-5-2',
        type: 'predict-output',
        prompt: 'A semantic cache with threshold 0.95. Which earlier questions count as hits for "how do I reset my password"?',
        code: `sims = {"reset my password": 0.97,
        "reset my router": 0.88}
hits = [q for q, s in sims.items()
        if s >= 0.95]
print(hits)`,
        answer: "['reset my password']",
        typedWrong: [{ answer: "['reset my password', 'reset my router']", why: '0.88 is below the threshold.' }],
        explain: 'At a loose 0.85, the router answer would be served for a password question.',
      },
      {
        id: 's12-5-3',
        type: 'bucket-sort',
        prompt: 'How should each be cached?',
        buckets: ['Exact', 'Semantic', 'Do not cache'],
        items: [
          { text: 'Summarising the same document twice', bucket: 0, why: 'Identical requests: an exact key hits.' },
          { text: 'FAQ: what are your opening hours?', bucket: 1, why: 'Many phrasings, one safe answer.' },
          { text: 'An answer quoting the user\'s balance', bucket: 2, why: 'Personal: it must never reach anyone else.' },
          { text: 'Translating an identical string', bucket: 0, why: 'Same input, same output.' },
          { text: 'Medicine dosage questions', bucket: 2, why: 'A near-miss answer could cause harm.' },
          { text: 'How much is shipping to France?', bucket: 1, why: 'Common, generic and harmless if rephrased.' },
        ],
        explain: 'The question is what a wrong hit would cost.',
      },
      {
        id: 's12-5-4',
        type: 'mcq',
        prompt: 'What is the main risk of a semantic cache?',
        options: [
          { text: 'Answering a different question' },
          { text: 'Spending more on every request', why: 'A hit skips the model call entirely.' },
          { text: 'Never getting any hits at all', why: 'It hits more than an exact cache.' },
        ],
        answer: 0,
        explain: '"Cancel my order" and "cancel my subscription" can look close.',
      },
      {
        id: 's12-5-5',
        type: 'estimate',
        prompt: 'One million requests a day at $0.01 each. A cache serves 30% of them. Dollars saved a day?',
        expr: '1e6 / 100 * 0.3',
        answer: 3000,
        tolerance: 1.5,
        unit: '$',
        options: [
          { value: 300, why: '$10,000 a day × 30%.' },
          { value: 3000 },
          { value: 30000, why: 'The whole bill is $10,000 a day.' },
        ],
        work: ['10⁶ × $0.01 = $10,000 a day', '× 0.3 = $3,000'],
        explain: 'And those 30% are answered in milliseconds.',
      },
      {
        id: 's12-5-6',
        type: 'scenario',
        prompt: 'A support bot\'s answers often include the user\'s own order details. Someone proposes a semantic cache over all answers.',
        situation: '"When does my order arrive?" is asked thousands of times a day.',
        needs: ['Lower cost', 'No user sees another user\'s data'],
        options: [
          {
            text: 'Cache only the generic answers',
            cost: 'Fewer hits.',
          },
          {
            text: 'Cache every answer by meaning',
            cost: 'Many more hits.',
            why: 'Ann\'s delivery date would be shown to Bo, who asked the same question.',
          },
        ],
        answer: 0,
        explain: 'Cache the policy text; fetch personal facts fresh for each user.',
      },
      {
        id: 's12-5-7',
        type: 'mcq',
        prompt: 'Why put the prompt version in an exact cache key?',
        options: [
          { text: 'New prompts give new answers' },
          { text: 'It makes keys shorter', why: 'It makes them longer.' },
          { text: 'Providers require it there', why: 'The cache is yours; providers never see it.' },
        ],
        answer: 0,
        explain: 'Otherwise an improved prompt keeps serving the old prompt\'s answers.',
      },
      {
        id: 's12-5-8',
        type: 'fill-blank',
        prompt: 'A semantic hit needs similarity at or above the threshold.',
        code: `def hit(sim, threshold=0.95):
    return sim ___ threshold

print(hit(0.97), hit(0.95), hit(0.88))`,
        answer: ['>='],
        distractors: [
          { text: '>', why: 'Exactly 0.95 should count as a hit.' },
          { text: '<', why: 'That serves the least similar answers.' },
        ],
        expectOutput: 'True True False',
        explain: 'Tune the threshold on real pairs labelled same or different.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 's12-06',
    title: 'A model gateway',
    summary: 'One service holds the keys, budgets and logs, and routes each request to a model with fallbacks.',
    card: {
      title: 'A model gateway',
      text: 'Once several teams call several models, put a gateway between them: one place that holds the provider keys, enforces budgets and rate limits per team, logs every call and routes each request to a model. It can send easy requests to a small, cheap model and fall back to another model or provider when the first fails or is overloaded. Callers see one stable interface, so models can be swapped without changing their code.',
      see: ['e9-05', 'e10-06', 's9-07'],
      diagram: {
        nodes: [
          { id: 'a', kind: 'client', label: 'Team apps' },
          { id: 'g', kind: 'lb', label: 'Gateway' },
          { id: 's', kind: 'model', label: 'Small model' },
          { id: 'l', kind: 'model', label: 'Large model' },
          { id: 'b', kind: 'api', label: 'Backup' },
        ],
        edges: [
          { from: 'a', to: 'g' },
          { from: 'g', to: 's', label: 'easy' },
          { from: 'g', to: 'l', label: 'hard' },
          { from: 'g', to: 'b', label: 'fallback', dashed: true },
        ],
      },
    },
    exercises: [
      {
        id: 's12-6-1',
        type: 'bucket-sort',
        prompt: 'Gateway or app?',
        buckets: ['Gateway', 'App'],
        items: [
          { text: 'Provider API keys', bucket: 0, why: 'Held in one place, never in each app.' },
          { text: 'Per-team monthly budget', bucket: 0, why: 'Enforced centrally across all calls.' },
          { text: 'The support bot\'s prompt', bucket: 1, why: 'It is the app\'s own product logic.' },
          { text: 'Falling back to a second provider', bucket: 0, why: 'Every app gets it for free.' },
          { text: 'Logging tokens and cost per call', bucket: 0, why: 'One consistent record of spend.' },
          { text: 'What to show the user', bucket: 1, why: 'That is the app\'s decision.' },
        ],
        explain: 'Shared plumbing in the gateway; product decisions in the apps.',
      },
      {
        id: 's12-6-2',
        type: 'predict-output',
        prompt: 'The first model times out. What does the gateway return?',
        code: `def call(model):
    if model == "big-a":
        raise TimeoutError
    return f"answer from {model}"

def route(models):
    for m in models:
        try:
            return call(m)
        except TimeoutError:
            continue
    return "busy, try later"

print(route(["big-a", "big-b"]))`,
        answer: 'answer from big-b',
        typedWrong: [{ answer: 'busy, try later', why: 'big-b answers, so the loop returns its answer.' }],
        explain: 'The caller never learns the first model failed, apart from the logs.',
      },
      {
        id: 's12-6-3',
        type: 'predict-output',
        prompt: 'Route short prompts to a small model. Where do these two go?',
        code: `def pick(prompt):
    if len(prompt.split()) < 20:
        return "small"
    return "large"

print(pick("Translate: hello"),
      pick("word " * 50))`,
        answer: 'small large',
        typedWrong: [{ answer: 'small small', why: 'The second prompt has 50 words.' }],
        explain: 'Real routers use a classifier or the task type, checked on an eval set.',
      },
      {
        id: 's12-6-4',
        type: 'scenario',
        prompt: 'Ten teams each keep their own provider keys. One key leaked last month, and nobody knows each team\'s spend.',
        situation: 'Every team calls providers directly.',
        needs: ['Keys in one place', 'Spend per team visible'],
        options: [
          {
            text: 'A gateway holds keys, logs spend',
            cost: 'A service every call now passes through.',
          },
          {
            text: 'Teams report spend each month',
            cost: 'A spreadsheet.',
            why: 'Keys stay scattered and the numbers arrive late and incomplete.',
          },
        ],
        answer: 0,
        explain: 'Run several gateway instances: it is now on every request\'s path.',
      },
      {
        id: 's12-6-5',
        type: 'mcq',
        prompt: 'Before relying on a fallback model, what must you check?',
        options: [
          { text: 'Its score on your eval set' },
          { text: 'A lower price than the first', why: 'Price matters less than whether its answers are good enough.' },
          { text: 'The same parameter count', why: 'Size does not tell you how it does on your task.' },
        ],
        answer: 0,
        explain: 'A fallback that gives bad answers is an outage that looks like success.',
      },
      {
        id: 's12-6-6',
        type: 'estimate',
        prompt: 'A team\'s budget is $500 a month and each call costs $0.004. About how many calls a day?',
        expr: '500 / 0.004 / 30',
        answer: 4167,
        tolerance: 1.5,
        unit: 'calls/day',
        options: [
          { value: 417, why: '125,000 calls a month / 30.' },
          { value: 4167 },
          { value: 41667, why: '$500 buys 125,000 calls a month, not a day.' },
        ],
        work: ['$500 / $0.004 = 125,000 calls a month', '/ 30 ≈ 4,167 a day'],
        explain: 'The gateway can warn at 80% and stop at 100%.',
      },
      {
        id: 's12-6-7',
        type: 'order-steps',
        prompt: 'A request through the gateway, in order.',
        steps: [
          'Check the team\'s key and budget',
          'Choose a model for the request',
          'Call the model',
          'On failure, try the fallback',
          'Log tokens and cost',
          'Return the answer',
        ],
        explain: 'Cheap checks first; logging covers fallbacks too.',
      },
      {
        id: 's12-6-8',
        type: 'fill-blank',
        prompt: 'Allow a call only if it keeps the team within budget.',
        code: `spent = {"search": 480.0}
def allow(t, cost, limit=500):
    return spent[t] + cost ___ limit

print(allow("search", 15),
      allow("search", 20),
      allow("search", 30))`,
        answer: ['<='],
        distractors: [
          { text: '<', why: 'Spending exactly the budget should be allowed.' },
          { text: '>=', why: 'That allows only calls that break the budget.' },
        ],
        expectOutput: 'True True False',
        explain: '495 and 500 fit; 510 does not.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 's12-07',
    title: 'Cost per request',
    summary: 'Tokens in and out, times their prices, over every call a request makes; then times traffic.',
    card: {
      title: 'Cost per request',
      text: 'A request\'s cost is its input tokens times the input price plus its output tokens times the higher output price, summed over every model call it makes. Retrieved context, long system prompts and growing conversation history multiply input tokens; agent steps, retries and fallbacks multiply calls. Write this model down per feature, multiply by expected traffic, and compare the total with what the feature is worth before scaling it.',
      see: ['e3-05', 'e9-01'],
    },
    exercises: [
      {
        id: 's12-7-1',
        type: 'predict-output',
        prompt: 'Prices are $3 per million input tokens and $15 per million output tokens. What does one request cost?',
        code: `IN, OUT = 3.00, 15.00  # $/1M
def cost(t_in, t_out):
    return (t_in * IN
            + t_out * OUT) / 1e6

print(round(cost(4000, 500), 4))`,
        answer: '0.0195',
        typedWrong: [{ answer: '0.0135', why: 'Output tokens cost $15 per million, not $3.' }],
        explain: '$0.012 for the input, $0.0075 for the output.',
      },
      {
        id: 's12-7-2',
        type: 'estimate',
        prompt: 'At $0.02 a request and 50,000 requests a day, what is the 30-day bill in dollars?',
        expr: '0.02 * 50000 * 30',
        answer: 30000,
        tolerance: 1.5,
        unit: '$',
        options: [
          { value: 3000, why: '$1,000 a day for 30 days.' },
          { value: 30000 },
          { value: 300000, why: '$0.02 × 50,000 = $1,000 a day, not $10,000.' },
        ],
        work: ['$0.02 × 50,000 = $1,000 a day', '× 30 = $30,000'],
        explain: 'Small per request, large per month.',
      },
      {
        id: 's12-7-3',
        type: 'bucket-sort',
        prompt: 'Does each add input tokens, or more calls?',
        buckets: ['More input', 'More calls'],
        items: [
          { text: 'Adding ten more retrieved chunks', bucket: 0, why: 'Every chunk is sent as input.' },
          { text: 'A longer system prompt', bucket: 0, why: 'It is sent with every call.' },
          { text: 'An agent taking six steps', bucket: 1, why: 'Each step is a model call.' },
          { text: 'Retrying on invalid JSON', bucket: 1, why: 'Each retry is another call.' },
          { text: 'Keeping the full chat history', bucket: 0, why: 'The history is resent every turn.' },
          { text: 'Falling back to a second model', bucket: 1, why: 'The failed call was paid for too.' },
        ],
        explain: 'Both show up in the bill; only the logs tell you which.',
      },
      {
        id: 's12-7-4',
        type: 'mcq',
        prompt: 'A RAG answer sends 8,000 input tokens and gets 300 back, at $3 and $15 per million. What dominates the cost?',
        options: [
          { text: 'The retrieved context' },
          { text: 'The generated answer', why: '300 × $15 = $0.0045, against $0.024 for the input.' },
          { text: 'The embedding call', why: 'Embedding a short question costs a tiny fraction.' },
        ],
        answer: 0,
        explain: 'Fewer, better chunks (reranking) cut the bill directly.',
      },
      {
        id: 's12-7-5',
        type: 'predict-output',
        prompt: 'An agent resends its growing history at every step. Input tokens over five steps?',
        code: `system, step = 2000, 500
total, ctx = 0, system
for _ in range(5):
    total += ctx    # input sent
    ctx += step     # history grows
print(total)`,
        answer: '15000',
        typedWrong: [{ answer: '10000', why: 'Each step sends the earlier steps too: 2,000, 2,500, 3,000, 3,500, 4,000.' }],
        explain: 'Agent cost grows faster than the number of steps.',
      },
      {
        id: 's12-7-6',
        type: 'scenario',
        prompt: 'A feature earns about $0.01 per use and costs $0.03 per use. What now?',
        situation: 'Each use sends 9,000 input tokens to the largest model.',
        needs: ['Cost below value', 'Quality still acceptable'],
        options: [
          {
            text: 'Cut context, use a smaller model',
            cost: 'Eval runs to prove quality holds.',
          },
          {
            text: 'Launch to everyone as it is',
            cost: 'No work now.',
            why: 'Every use loses two cents; growth makes the loss bigger.',
          },
        ],
        answer: 0,
        explain: 'Measure each change on the eval set; keep the cheapest version that passes.',
      },
      {
        id: 's12-7-7',
        type: 'estimate',
        prompt: 'A million requests a day; input cut from 6,000 to 2,000 tokens at $3 per million tokens. Dollars saved a day?',
        expr: '1e6 * 4000 * 3 / 1e6',
        answer: 12000,
        tolerance: 1.5,
        unit: '$',
        options: [
          { value: 1200, why: '4 × 10⁹ tokens × $3 per 10⁶.' },
          { value: 12000 },
          { value: 120000, why: '4 billion tokens cost $12,000.' },
        ],
        work: ['10⁶ × 4,000 = 4 × 10⁹ tokens', '× $3 / 10⁶ = $12,000'],
        explain: 'Over $4 million a year from trimming context.',
      },
      {
        id: 's12-7-8',
        type: 'fill-blank',
        prompt: 'Output tokens use the output price.',
        code: `def cost(t_in, t_out, p_in, p_out):
    return (t_in * p_in
            + t_out * ___) / 1e6

print(cost(1000, 1000, 3, 15))`,
        answer: ['p_out'],
        distractors: [{ text: 'p_in', why: 'That prices output at the cheaper input rate.' }],
        expectOutput: '0.018',
        explain: '$0.003 in, $0.015 out.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's12-08',
    title: 'Feedback and evaluation loops',
    summary: 'Log each request, collect signals, turn failures into golden-set cases and gate every change on them.',
    card: {
      title: 'Feedback and evaluation loops',
      text: 'Ship an AI feature with a loop around it: log each request with its input, retrieved context, output, model and prompt version, and collect signals such as thumbs, edits, rephrased questions and hand-offs to a person. Turn failures into new cases in the golden set, and run the whole set offline before every prompt, model or retrieval change. Watch live quality too, with a model judge on a sample of traffic, because user signals are sparse and biased.',
      see: ['e5-07', 'e5-08', 'e5-09'],
      diagram: {
        nodes: [
          { id: 'a', kind: 'service', label: 'AI feature' },
          { id: 'l', kind: 'db', label: 'Request log' },
          { id: 'j', kind: 'model', label: 'Judge' },
          { id: 'g', kind: 'db', label: 'Golden set' },
          { id: 'e', kind: 'worker', label: 'Eval run' },
        ],
        edges: [
          { from: 'a', to: 'l', label: 'log' },
          { from: 'l', to: 'j', label: 'sample' },
          { from: 'l', to: 'g', label: 'failures' },
          { from: 'g', to: 'e', label: 'cases' },
        ],
      },
    },
    exercises: [
      {
        id: 's12-8-1',
        type: 'order-steps',
        prompt: 'A failure becomes a test. Put it in order.',
        steps: [
          'A user marks an answer as wrong',
          'Someone reviews the logged request',
          'The correct answer is written down',
          'The case joins the golden set',
          'The next change is checked against it',
        ],
        explain: 'The same failure can never quietly come back.',
      },
      {
        id: 's12-8-2',
        type: 'bucket-sort',
        prompt: 'Explicit or implicit feedback?',
        buckets: ['Explicit', 'Implicit'],
        items: [
          { text: 'A thumbs-down', bucket: 0, why: 'The user said so directly.' },
          { text: 'The user rephrases the same question', bucket: 1, why: 'The first answer probably missed.' },
          { text: 'The user copies the answer', bucket: 1, why: 'It was probably useful.' },
          { text: 'A written complaint', bucket: 0, why: 'Stated directly by the user.' },
          { text: 'The user asks for a person', bucket: 1, why: 'The bot probably failed them.' },
          { text: 'A star rating', bucket: 0, why: 'A deliberate judgement.' },
        ],
        explain: 'Implicit signals are plentiful but noisy; explicit ones are clear but rare.',
      },
      {
        id: 's12-8-3',
        type: 'mcq',
        prompt: 'Why log the prompt and model version with every request?',
        options: [
          { text: 'To see which change broke it' },
          { text: 'To make the log lines shorter', why: 'It makes them slightly longer.' },
          { text: 'Providers require it in logs', why: 'The logs are yours; it is for your own debugging.' },
        ],
        answer: 0,
        explain: 'Quality dropped on Tuesday: was it the prompt, the model or the index?',
      },
      {
        id: 's12-8-4',
        type: 'predict-output',
        prompt: 'Old and new prompt on the same 8 cases (1 = pass). Totals, and cases that used to pass but now fail?',
        code: `old = [1, 1, 0, 1, 0, 1, 1, 1]
new = [1, 1, 1, 1, 0, 1, 0, 1]
broke = sum(a and not b
            for a, b in zip(old, new))
print(sum(old), sum(new), broke)`,
        answer: '6 6 1',
        typedWrong: [{ answer: '6 6 0', why: 'Case 7 passed before and fails now.' }],
        explain: 'Equal totals can hide a regression: look at the cases that changed.',
      },
      {
        id: 's12-8-5',
        type: 'scenario',
        prompt: 'Only 2% of users ever vote, and 0.3% of answers get a thumbs-down. Is quality fine?',
        situation: 'Most unhappy users just leave.',
        needs: ['A real picture of live quality'],
        options: [
          {
            text: 'Judge a live sample too',
            cost: 'A judging call per sampled request.',
          },
          {
            text: 'Trust the thumbs alone',
            cost: 'Nothing new to build.',
            why: 'Votes come from a small, unusual group and miss quiet failures.',
          },
        ],
        answer: 0,
        explain: 'Check the judge itself against human labels now and then.',
      },
      {
        id: 's12-8-6',
        type: 'estimate',
        prompt: 'A judge model checks 2% of 100,000 daily requests at $0.005 per check. Dollars a day?',
        expr: '100000 * 0.02 * 0.005',
        answer: 10,
        tolerance: 1.5,
        unit: '$',
        options: [
          { value: 1, why: '2,000 checks × $0.005 = $10.' },
          { value: 10 },
          { value: 100, why: '2% of 100,000 is 2,000 checks.' },
        ],
        work: ['100,000 × 2% = 2,000 checks', '× $0.005 = $10'],
        explain: 'Cheap insurance against silent quality drops.',
      },
      {
        id: 's12-8-7',
        type: 'mcq',
        prompt: 'A teammate improved the prompt. What happens before it ships?',
        options: [
          { text: 'Run the golden set on it' },
          { text: 'Check it on two examples', why: 'Two examples cannot show a regression elsewhere.' },
          { text: 'Ship and watch the thumbs', why: 'Users find the regressions for you, slowly.' },
        ],
        answer: 0,
        explain: 'Compare case by case with the current version.',
      },
      {
        id: 's12-8-8',
        type: 'fill-blank',
        prompt: 'Find the cases that passed before and fail now.',
        code: `old = {"q1": True, "q2": True}
new = {"q1": True, "q2": False}
broke = [q for q in old
         if old[q] and not new[___]]
print(broke)`,
        answer: ['q'],
        distractors: [{ text: '"q1"', why: 'That checks the same case every time.' }],
        expectOutput: "['q2']",
        explain: 'q2 regressed.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's12-09',
    title: 'Checkpoint: AI systems',
    summary: 'Batching, streaming, GPU queues, vector indexes, retrieval paths, caching, gateways, cost and feedback, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's12-9-1',
        type: 'estimate',
        prompt: 'A step takes 32 ms for a batch of 16. Tokens a second?',
        expr: '16 / 0.032',
        answer: 500,
        tolerance: 1.5,
        unit: 'tokens/s',
        options: [
          { value: 50, why: '31 steps a second × 16 tokens.' },
          { value: 500 },
          { value: 5000, why: '1 / 0.032 s ≈ 31 steps, not 312.' },
        ],
        work: ['1 / 0.032 ≈ 31 steps/s', '× 16 = 500 tokens/s'],
        explain: 'Batching multiplies throughput.',
      },
      {
        id: 's12-9-2',
        type: 'mcq',
        prompt: 'Why stream tokens to a chat user?',
        options: [
          { text: 'The first words come sooner' },
          { text: 'It costs fewer tokens', why: 'The same tokens are produced.' },
          { text: 'The model writes better', why: 'Quality is unchanged.' },
        ],
        answer: 0,
        explain: 'Time to first token is what people feel.',
      },
      {
        id: 's12-9-3',
        type: 'bucket-sort',
        prompt: 'Ingestion path or query path?',
        buckets: ['Ingestion', 'Query'],
        items: [
          { text: 'Chunking a new manual', bucket: 0, why: 'Background work per document.' },
          { text: 'Reranking candidates', bucket: 1, why: 'It runs per question.' },
          { text: 'Embedding chunks in batches', bucket: 0, why: 'Background, and batched for throughput.' },
          { text: 'Embedding the question', bucket: 1, why: 'Every request needs it.' },
          { text: 'Dropping chunks of a deleted file', bucket: 0, why: 'Keeps the index matching its sources.' },
        ],
        explain: 'Slow and batched behind the scenes; fast per request.',
      },
      {
        id: 's12-9-4',
        type: 'estimate',
        prompt: '10 million vectors of 768 four-byte floats. How many GB?',
        expr: '10e6 * 768 * 4 / GB',
        answer: 30.7,
        tolerance: 1.5,
        unit: 'GB',
        options: [
          { value: 3.1, why: '10⁷ × 3,072 bytes ≈ 3 × 10¹⁰ bytes.' },
          { value: 30.7 },
          { value: 307, why: '30.7 billion bytes is about 31 GB.' },
        ],
        work: ['768 × 4 B = 3,072 B', '10⁷ × 3,072 B ≈ 31 GB'],
        explain: 'One large machine holds it; a billion would not fit.',
      },
      {
        id: 's12-9-5',
        type: 'scenario',
        prompt: 'A banking assistant answers "what is my balance?" thousands of times a day. Cache it semantically?',
        situation: 'The answer contains each user\'s own number.',
        needs: ['No user sees another\'s data'],
        options: [
          {
            text: 'Fetch it fresh each time',
            cost: 'A lookup on every question.',
          },
          {
            text: 'Cache the answer by meaning',
            cost: 'Very high hit rate.',
            why: 'Everyone asking would get the first asker\'s balance.',
          },
        ],
        answer: 0,
        explain: 'Personal answers are never shared cache entries.',
      },
      {
        id: 's12-9-6',
        type: 'order-steps',
        prompt: 'Through the model gateway, in order.',
        steps: ['Check key and budget', 'Pick a model', 'Call it', 'Fall back if it fails', 'Log the cost'],
        explain: 'Every call is accounted for, fallbacks included.',
      },
      {
        id: 's12-9-7',
        type: 'predict-output',
        prompt: '$3 per million in, $15 per million out. Cost of 10,000 in and 1,000 out?',
        code: `cost = (10_000 * 3
        + 1_000 * 15) / 1e6
print(cost)`,
        answer: '0.045',
        typedWrong: [{ answer: '0.033', why: 'Output is priced at $15, not $3.' }],
        explain: 'Input dominates: $0.03 of the $0.045.',
      },
      {
        id: 's12-9-8',
        type: 'fill-blank',
        prompt: 'Recall at k: the share of the true top k that were found.',
        code: `exact = {"a", "b", "c", "d"}
found = {"a", "b", "x", "d"}
r = len(exact ___ found) / len(exact)
print(r)`,
        answer: ['&'],
        distractors: [{ text: '|', why: 'The union counts results that were not true neighbours.' }],
        expectOutput: '0.75',
        explain: 'Three of the four true neighbours.',
      },
      {
        id: 's12-9-9',
        type: 'mcq',
        prompt: 'The GPU queue is at its limit. What happens to a new request?',
        options: [
          { text: 'Rejected at once with 503' },
          { text: 'Queued without any limit', why: 'Then every waiting request gets slower.' },
          { text: 'Dropped with no reply', why: 'The client should be told to retry.' },
        ],
        answer: 0,
        explain: 'Fail fast, and scale on queue wait.',
      },
      {
        id: 's12-9-10',
        type: 'mcq',
        prompt: 'A new prompt scores the same total as the old one, but one case that passed now fails. What do you do?',
        options: [
          { text: 'Look at the case that broke' },
          { text: 'Ship: the score is the same', why: 'A real user\'s question now gets a wrong answer.' },
          { text: 'Add cases until it passes', why: 'That hides the regression instead of fixing it.' },
        ],
        answer: 0,
        explain: 'Regressions matter even when the total does not move.',
      },
    ],
  },
];
