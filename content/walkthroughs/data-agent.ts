import type { Walkthrough } from '../schema';

/*
 * AI design 3: a data-analysis agent over a warehouse, through the
 * seven-step framework. Listed in both tracks: opens after S1-S3, S10 and
 * S12, or after E7, E10 and E11 (lesson "Design: a data-analysis agent").
 */
export const dataAgent: Walkthrough = {
  id: 'w-data-agent',
  title: 'Data-analysis agent',
  question: 'Design an agent that answers business questions, such as "sales by region last quarter", by writing and running queries against the company\'s data warehouse.',
  needs: ['S1', 'S2', 'S3', 'S10', 'S12'],
  orNeeds: ['E7', 'E10', 'E11'],
  tracks: ['engineering', 'system-design'],
  minutes: 18,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "500 analysts and managers. About 200 tables in the warehouse. Answers must be correct and show how they were worked out."',
      exercises: [
        {
          id: 'wda-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Turn questions into SQL', bucket: 0, why: 'The core feature.' },
            { text: 'Run queries safely', bucket: 0, why: 'Generated code must not harm anything.' },
            { text: 'Show the query and result', bucket: 0, why: 'Stated: show how it was worked out.' },
            { text: 'Changing data', bucket: 1, why: 'An analysis agent only reads; writing is a different risk.' },
            { text: 'Scheduled reports', bucket: 1, why: 'Useful later; questions first.' },
            { text: 'Forecasting models', bucket: 1, why: 'A different kind of work from answering with data.' },
          ],
          explain: 'Ask, query safely, answer with the work shown.',
        },
        {
          id: 'wda-1-2',
          type: 'mcq',
          prompt: 'Which requirement matters most?',
          options: [
            { text: 'Correct, with the work shown' },
            { text: 'Answers in under a second', why: 'Queries take seconds; correctness matters more.' },
            { text: 'The SQL kept hidden', why: 'Showing it is how people check the answer.' },
          ],
          answer: 0,
          explain: 'A wrong number in a board meeting is worse than a slow answer.',
        },
        {
          id: 'wda-1-3',
          type: 'scenario',
          prompt: 'What may the agent\'s database account do?',
          situation: 'The agent writes SQL nobody reviews before it runs.',
          needs: ['Generated SQL can never change data'],
          options: [
            { text: 'Read-only, limited tables', cost: 'Some questions cannot be answered.' },
            {
              text: 'Full access, like an admin',
              cost: 'Any question can be answered.',
              why: 'One bad query could change or delete data.',
            },
          ],
          answer: 0,
          explain: 'Least privilege (S10): the account itself enforces the rule.',
        },
      ],
      strong: 'Turn questions into SQL, run them read-only in a sandbox, and answer with the query and result table shown; correctness over speed. No writes, ever.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "Each user asks about 10 questions a day, within working hours. An answer takes about three model calls and one or two queries."',
      exercises: [
        {
          id: 'wda-2-1',
          type: 'estimate',
          prompt: 'Questions per second during an 8-hour working day?',
          expr: '500 * 10 / (8 * HOUR)',
          answer: 0.174,
          tolerance: 2,
          unit: 'questions/s',
          options: [
            { value: 0.02, why: '5,000 / 28,800 s ≈ 0.17.' },
            { value: 0.2 },
            { value: 2, why: '5,000 questions over 8 hours is about one every 6 seconds.' },
          ],
          work: ['500 × 10 = 5,000 a day', '5,000 / (8 × 3,600 s) ≈ 0.17 a second'],
          explain: 'Very light traffic: scale is not the problem.',
        },
        {
          id: 'wda-2-2',
          type: 'estimate',
          prompt: 'Model calls per day?',
          expr: '500 * 10 * 3',
          answer: 15000,
          tolerance: 2,
          unit: 'calls',
          options: [
            { value: 1500, why: '5,000 questions × 3 calls = 15,000.' },
            { value: 15000 },
            { value: 150000, why: '5,000 × 3 is 15,000.' },
          ],
          work: ['5,000 × 3 = 15,000 calls a day'],
          explain: 'Modest; each call can afford a capable model.',
        },
        {
          id: 'wda-2-3',
          type: 'mcq',
          prompt: 'The descriptions of all 200 tables come to 400,000 tokens. What goes in the prompt?',
          options: [
            { text: 'Only the tables relevant to the question' },
            { text: 'All 200 table schemas, every time', why: 'Too long and costly, and the model gets confused.' },
            { text: 'No schemas; let it guess names', why: 'It would invent table and column names.' },
          ],
          answer: 0,
          explain: 'Retrieve the few relevant table descriptions, like RAG over the schema.',
        },
      ],
      strong: 'About 5,000 questions and 15,000 model calls a day: light. The constraint is context, since 400,000 tokens of schema cannot go in every prompt, so relevant tables are retrieved.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'One endpoint for users; a few tools for the agent.',
      exercises: [
        {
          id: 'wda-3-1',
          type: 'order-steps',
          prompt: 'Put the agent\'s work for one question in order.',
          steps: [
            'Find the tables relevant to the question',
            'Write a SQL query',
            'Run it read-only with a time limit',
            'Read the result, fixing the query if it failed',
            'Answer with the query and the result table',
          ],
          explain: 'Steps 2 to 4 may loop, up to a limit.',
        },
        {
          id: 'wda-3-2',
          type: 'match-pairs',
          prompt: 'Match each part to its job.',
          pairs: [
            { left: 'POST /ask', right: 'answer, SQL and table', why: 'What the user sees.' },
            { left: 'Tool: run_sql', right: 'runs one read-only query', why: 'In the sandbox, with limits.' },
            { left: 'Tool: describe_table', right: 'columns and their meaning', why: 'From the data catalogue.' },
            { left: 'Step limit', right: 'stops endless retries', why: 'Bounds time and cost.' },
          ],
          explain: 'Few, narrow tools are easier to make safe (E7).',
        },
        {
          id: 'wda-3-3',
          type: 'mcq',
          prompt: 'Why show the SQL with every answer?',
          options: [
            { text: 'So people can check the work' },
            { text: 'SQL is shorter than prose', why: 'Length is not the point; checking is.' },
            { text: 'The warehouse requires it', why: 'It does not; people need it.' },
          ],
          answer: 0,
          explain: 'An analyst can spot a wrong join or filter in seconds.',
        },
      ],
      strong: 'POST /ask returns the answer, the SQL and the result table; the agent has narrow tools (describe a table, run one read-only query) and a step limit.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Decide what the model sees, and guard what it runs.',
      exercises: [
        {
          id: 'wda-4-1',
          type: 'predict-output',
          prompt: 'A guard in code allows only plain SELECT queries. What does this print?',
          code: `def safe(sql):
    s = sql.strip().lower()
    bad = ("insert", "update",
           "delete", "drop")
    ok = s.startswith("select")
    return ok and not any(
        w in s for w in bad)
print(safe("SELECT * FROM t"),
      safe("select 1; drop table t"))`,
          answer: 'True False',
          typedWrong: [{ answer: 'True True', why: 'The second starts with select but also contains drop.' }],
          explain: 'A second line of defence: the read-only account is the first.',
        },
        {
          id: 'wda-4-2',
          type: 'bucket-sort',
          prompt: 'What goes into the model\'s context?',
          buckets: ['Every prompt', 'Retrieved', 'Never sent'],
          items: [
            { text: 'The user\'s question', bucket: 0, why: 'What it must answer.' },
            { text: 'Rules: read-only, show SQL', bucket: 0, why: 'Standing instructions.' },
            { text: 'Descriptions of relevant tables', bucket: 1, why: 'Found by searching the catalogue.' },
            { text: 'Example queries for similar questions', bucket: 1, why: 'Good worked examples improve the SQL.' },
            { text: 'Raw rows of every table', bucket: 2, why: 'Far too large, and private data has no reason to go to the model.' },
            { text: 'Database passwords', bucket: 2, why: 'Secrets stay in the sandbox\'s configuration.' },
          ],
          explain: 'The model sees structure and examples, not the data itself.',
        },
        {
          id: 'wda-4-3',
          type: 'mcq',
          prompt: 'Where do the table descriptions come from?',
          options: [
            { text: 'A curated data catalogue' },
            { text: 'The model guesses from names', why: 'A column called "amt2" tells it nothing.' },
            { text: 'Users explain each time', why: 'Slow, and every user explains differently.' },
          ],
          answer: 0,
          explain: 'Written by the data team: what each table and column means, and which metrics are official.',
        },
      ],
      strong: 'A data catalogue describes tables, columns and official metrics; relevant descriptions and example queries are retrieved into the prompt; raw data and secrets never are; a code guard backs up the read-only account.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'The agent loops between the model and a sandbox that runs its queries.',
      exercises: [
        {
          id: 'wda-5-1',
          type: 'diagram',
          prompt: 'Generated SQL runs here, isolated, with time and row limits. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'u', kind: 'client', label: 'Analysts' },
              { id: 'a', kind: 'service', label: 'Agent' },
              { id: 'm', kind: 'model', label: 'LLM' },
              { id: 's', kind: 'worker', label: 'Sandbox' },
              { id: 'w', kind: 'db', label: 'Warehouse' },
            ],
            edges: [
              { from: 'u', to: 'a' },
              { from: 'a', to: 'm' },
              { from: 'a', to: 's' },
              { from: 's', to: 'w' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 's',
            options: [
              { kind: 'worker', label: 'Sandbox' },
              { kind: 'service', label: 'Agent itself', why: 'Running generated code in the agent\'s own process risks the whole service.' },
              { kind: 'db', label: 'Prod DB', why: 'Straight to production with full rights is the risk to avoid.' },
            ],
            answer: 0,
          },
          explain: 'Isolated, read-only credentials, time and row limits (E10).',
        },
        {
          id: 'wda-5-2',
          type: 'diagram',
          prompt: 'A query runs. Tap its path from the analyst to the warehouse.',
          diagram: {
            nodes: [
              { id: 'u', kind: 'client', label: 'Analysts' },
              { id: 'a', kind: 'service', label: 'Agent' },
              { id: 'c', kind: 'vector', label: 'Catalogue' },
              { id: 'm', kind: 'model', label: 'LLM' },
              { id: 's', kind: 'worker', label: 'Sandbox' },
              { id: 'w', kind: 'db', label: 'Warehouse' },
            ],
            edges: [
              { from: 'u', to: 'a' },
              { from: 'a', to: 'c' },
              { from: 'a', to: 'm' },
              { from: 'a', to: 's' },
              { from: 's', to: 'w' },
            ],
          },
          goal: { kind: 'path', answer: ['u', 'a', 's', 'w'] },
          explain: 'The model writes the SQL; the agent sends it to the sandbox, never the model directly.',
        },
        {
          id: 'wda-5-3',
          type: 'mcq',
          prompt: 'Why query the warehouse rather than the live orders database?',
          options: [
            { text: 'Heavy queries never slow sales' },
            { text: 'Copies are always more current', why: 'They are slightly behind, which is fine for analysis.' },
            { text: 'Live databases block reads', why: 'They do not; heavy reads just slow everything else.' },
          ],
          answer: 0,
          explain: 'Analysis traffic is kept away from the system that takes orders (S11).',
        },
      ],
      strong: 'Analysts → agent, which retrieves table descriptions from the catalogue, asks the LLM for SQL, runs it in a sandbox with read-only access to the warehouse, and loops on errors up to a step limit.',
      diagram: {
        nodes: [
          { id: 'u', kind: 'client', label: 'Analysts' },
          { id: 'a', kind: 'service', label: 'Agent' },
          { id: 'c', kind: 'vector', label: 'Catalogue' },
          { id: 'm', kind: 'model', label: 'LLM' },
          { id: 's', kind: 'worker', label: 'Sandbox' },
          { id: 'w', kind: 'db', label: 'Warehouse' },
        ],
        edges: [
          { from: 'u', to: 'a' },
          { from: 'a', to: 'c', label: 'tables' },
          { from: 'a', to: 'm', label: 'SQL' },
          { from: 'a', to: 's' },
          { from: 's', to: 'w', label: 'read' },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: an agent that loops, and numbers that must be right.',
      exercises: [
        {
          id: 'wda-6-1',
          type: 'predict-output',
          prompt: 'Each attempt\'s error is listed (None means it worked). The agent stops at its step limit. What does this print?',
          code: `errors = ["no column amt", "timeout",
          "no column amt", None]
def answer(limit):
    for step, e in enumerate(errors):
        if step == limit:
            return "gave up"
        if e is None:
            return f"done: {step + 1}"
print(answer(3), answer(5))`,
          answer: 'gave up done: 4',
          typedWrong: [{ answer: 'done: 4 done: 4', why: 'With a limit of 3, the loop stops before the fourth attempt.' }],
          explain: 'Giving up honestly beats looping forever (E7).',
        },
        {
          id: 'wda-6-2',
          type: 'scenario',
          prompt: 'How do you know the agent\'s numbers are right?',
          situation: 'Two runs of the same question once gave different totals.',
          needs: ['Catch wrong answers before users do'],
          options: [
            { text: 'Golden questions, known answers', cost: 'Someone must write and maintain them.' },
            {
              text: 'Trust the higher number',
              cost: 'No work.',
              why: 'Neither is known to be right.',
            },
            {
              text: 'Ask users to check every answer',
              cost: 'No test set needed.',
              why: 'Users cannot check what they asked the agent to find.',
            },
          ],
          answer: 0,
          explain: 'Run the golden set on every prompt, model or catalogue change.',
        },
        {
          id: 'wda-6-3',
          type: 'mcq',
          prompt: '"Sales" could mean orders placed or orders paid. What should the agent do?',
          options: [
            { text: 'Use the defined metric; say so' },
            { text: 'Pick whichever query is shorter', why: 'Shorter SQL is not the right definition.' },
            { text: 'Average the two numbers', why: 'That number means nothing.' },
          ],
          answer: 0,
          explain: 'The catalogue holds official metric definitions; the answer names the one used.',
        },
      ],
      strong: 'A step limit ends loops with an honest "gave up"; official metric definitions come from the catalogue and are named in the answer; a golden set of questions with known answers gates every change.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'The risks here are runaway queries and data people should not see.',
      exercises: [
        {
          id: 'wda-7-1',
          type: 'scenario',
          prompt: 'An agent query scans 5 TB and runs for 20 minutes.',
          situation: 'The warehouse is shared with every analyst and dashboard.',
          needs: ['No single question blocks the warehouse'],
          options: [
            { text: 'Limit time and scan size', cost: 'Some big questions are refused.' },
            {
              text: 'Let it run; answers matter',
              cost: 'Every question gets answered.',
              why: 'One question can block the warehouse and cost a lot.',
            },
          ],
          answer: 0,
          explain: 'Estimate the scan first; ask the user to narrow the question if it is too big.',
        },
        {
          id: 'wda-7-2',
          type: 'mcq',
          prompt: 'A user asks about salaries they are not allowed to see.',
          options: [
            { text: 'Run as the user, with their rights' },
            { text: 'Run as one shared admin account', why: 'Anyone could read anything through the agent.' },
            { text: 'Tell the model not to reveal it', why: 'Prompts are not access control.' },
          ],
          answer: 0,
          explain: 'The warehouse\'s own permissions decide, per user.',
        },
        {
          id: 'wda-7-3',
          type: 'bucket-sort',
          prompt: 'What may the agent decide, and what must code enforce?',
          buckets: ['Agent decides', 'Code enforces'],
          items: [
            { text: 'Which tables to look at', bucket: 0, why: 'Its judgement, from the catalogue.' },
            { text: 'How to write the SQL', bucket: 0, why: 'Its main job.' },
            { text: 'How to explain the result', bucket: 0, why: 'Wording is the model\'s strength.' },
            { text: 'Read-only access', bucket: 1, why: 'Set on the account, not requested in a prompt.' },
            { text: 'Query time limit', bucket: 1, why: 'Enforced by the sandbox.' },
            { text: 'Which rows the user may see', bucket: 1, why: 'The warehouse\'s permissions, per user.' },
          ],
          explain: 'Judgement to the model, rules to code (E10).',
        },
      ],
      strong: 'Time and scan limits stop runaway queries; queries run with the asking user\'s rights so the agent never widens access; the model judges, code enforces read-only, limits and permissions.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'u', kind: 'client', label: 'Analysts' },
        { id: 'a', kind: 'service', label: 'Agent' },
        { id: 'c', kind: 'vector', label: 'Catalogue' },
        { id: 'm', kind: 'model', label: 'LLM' },
        { id: 's', kind: 'worker', label: 'Sandbox' },
        { id: 'w', kind: 'db', label: 'Warehouse' },
      ],
      edges: [
        { from: 'u', to: 'a' },
        { from: 'a', to: 'c', label: 'tables' },
        { from: 'a', to: 'm', label: 'SQL' },
        { from: 'a', to: 's' },
        { from: 's', to: 'w', label: 'read' },
      ],
    },
    decisions: [
      'Relevant table descriptions retrieved from a catalogue, not all 200 schemas.',
      'SQL runs in a sandbox: read-only, as the asking user, with time and scan limits.',
      'A step limit on the fix-and-retry loop; honest "gave up" when reached.',
      'Every answer shows its SQL, result table and the metric definition used.',
      'A golden set of questions with known answers gates every change.',
    ],
  },
  blank: {
    requirements: [
      'Answer business questions from the warehouse',
      'Correct numbers, with the SQL and table shown',
      'Never change data; respect each user\'s access',
      'No runaway queries',
      'About 5,000 questions a day',
    ],
    components: ['client', 'service', 'vector', 'model', 'worker', 'db'],
    firstFive: [
      'Ask who asks, how many tables, and what "correct" means',
      'Say read-only and least privilege before anything else',
      'Estimate traffic (light) and context size (the real constraint)',
      'Sketch the agent loop: retrieve tables, write SQL, run, fix',
      'Say how answers will be checked with a golden set',
    ],
  },
};
