import type { LibraryPage } from '../schema';

/** Unit E11 summary page: unlocked in the Library when the unit is finished. */
export const e11Library: LibraryPage = {
  unit: 'E11',
  ideas: [
    {
      title: 'RAG, fine-tuning or long context',
      text: 'RAG for large or changing knowledge that must be cited. Long context for a small, fixed text (with prompt caching). Fine-tuning for behaviour (format, tone, a narrow task) once prompting has run out, not for facts.',
    },
    {
      title: 'Evaluating an LLM app',
      text: 'A golden set of 50 to 100 real inputs; the simplest check that fits (exact match, rules, then a model judge checked against your own labels); retrieval and generation measured separately; every change before and after on the same set.',
    },
    {
      title: 'Hallucinations, latency and cost',
      text: 'Ground answers in retrieved sources, require citations, refuse without evidence, and check citations in code. Cost is tokens × price: fewer tokens, routing to a small model, caching. Report p95 latency; stream replies; run independent calls in parallel.',
    },
    {
      title: 'Injection and agents',
      text: 'Prompt injection cannot be filtered out reliably: give tools least privilege, treat fetched text as data, and have a person approve risky actions. Use an agent only when the steps cannot be known in advance: errors compound (0.95¹⁰ ≈ 0.6).',
    },
    {
      title: 'The four practice designs',
      text: 'Support chatbot: split, embed, index; hybrid search, rerank, answer with citations or refuse. Extraction: parse, extract with a schema, validate in code, retry once, human review. Data-analysis agent: schema in the prompt, SQL in a read-only sandbox, step limit, show the query. Code review: per-file review with context, filter and cap comments, post as suggestions; measure acceptance.',
    },
  ],
  rules: [
    'Changing or large knowledge: RAG. Small and fixed: long context. Behaviour: fine-tune.',
    'Golden set first; measure before and after.',
    'Retrieve, cite, refuse, check.',
    'Cost = tokens × price; report p95.',
    'Assume injection succeeds; limit what it can do.',
    'Fixed steps: workflow. Unknown steps: agent, with limits.',
    'In a design: data flow, failure handling, evaluation, cost.',
  ],
  example: {
    code: [
      'def backoff(tries, base):',
      '    return [base * 2 ** i',
      '            for i in range(tries)]',
      '',
      'def extract_json(s):',
      '    i = s.find("{")',
      '    j = s.rfind("}")',
      '    try:',
      '        return json.loads(s[i:j + 1])',
      '    except json.JSONDecodeError:',
      '        return None',
      '',
      'print(backoff(4, 0.5))',
      'print(extract_json(\'OK: {"n": 3}\'))',
      'print(round(50_000 * 0.0105, 2))',
    ].join('\n'),
    output: "[0.5, 1.0, 2.0, 4.0]\n{'n': 3}\n525.0",
    notes: [
      'Backoff: waits double each try; add jitter in real code.',
      'JSON from a chatty reply: slice between the braces, catch the decode error.',
      'A daily cost: 50,000 requests × $0.0105 each. State numbers like this out loud.',
    ],
  },
  mistakes: [
    { mistake: 'Fine-tuning to add facts.', fix: 'Facts change and need citing: retrieve them.' },
    { mistake: 'Judging a change on a handful of examples.', fix: 'A fixed golden set, before and after.' },
    { mistake: 'Relying on a filter or system prompt against injection.', fix: 'Least privilege and human approval.' },
    { mistake: 'Reaching for an agent first.', fix: 'Start with one call or a fixed workflow.' },
    { mistake: 'A design with no evaluation or failure path.', fix: 'Say how you measure it and what happens when a stage fails.' },
  ],
  forReal:
    'Interviews are spoken: practise saying these answers aloud in two minutes each, with a number in every answer. For each of the four designs, whiteboard it in 45 minutes: requirements, data flow, failure handling, evaluation, cost. Then do mock interviews with a friend or a recording, as the plan schedules for weeks 15 to 17, and two easy-to-medium coding problems a week from January.',
};
