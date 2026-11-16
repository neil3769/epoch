import type { LibraryPage } from '../schema';

/** Unit E3 summary page: unlocked in the Library when the unit is finished. */
export const e3Library: LibraryPage = {
  unit: 'E3',
  ideas: [
    {
      title: 'A call is a list of messages',
      text: 'Each message is a dict with a `role` ("user" or "assistant") and its `content`. Rules for the whole conversation go in the separate `system` parameter. The API remembers nothing, so every call resends the conversation you want the model to see.',
    },
    {
      title: 'The reply is an object',
      text: '`content` is a list of blocks; text blocks hold `.text`, tool requests are `tool_use` blocks. `stop_reason` says why it stopped ("end_turn", "max_tokens", "tool_use"), and `usage` counts input and output tokens. Read `stop_reason` before trusting the text.',
    },
    {
      title: 'Tokens, the context window and cost',
      text: 'A token is roughly four characters of English. The system prompt and the whole history are input tokens on every call, so long chats grow slower and dearer; trim or summarise old turns. Cost = (input tokens × input price + output tokens × output price) / 1,000,000, and output is usually the dearer side.',
    },
    {
      title: 'Schema-valid output',
      text: 'Ask for JSON, then validate with a Pydantic model: `Model.model_validate_json(text)` returns typed fields or raises `ValidationError`, whose `e.errors()` say what and where. On failure, send the error back and retry a bounded number of times, then fail clearly. Providers also have a structured-output mode that enforces a schema; still validate.',
    },
    {
      title: 'Tool calls',
      text: 'Describe each tool by name, description and an input JSON schema. When the model stops with "tool_use", your code runs the tool and sends a user message with a `tool_result` block carrying the same `tool_use_id`. Loop until the model answers, with a step limit.',
    },
    {
      title: 'Log every call, read percentiles',
      text: 'Record model, tokens, cost, latency and errors per call. Latency is skewed: p50 is the typical call, p95 the slow tail one call in twenty hits; averages hide that tail.',
    },
  ],
  rules: [
    'Roles: "user" and "assistant" in the list; rules in `system`.',
    'Check `stop_reason`: "max_tokens" means cut off, "tool_use" means run a tool.',
    'Cost = (tin × price_in + tout × price_out) / 1e6.',
    'Validate JSON with `model_validate_json`; dicts with `model_validate`.',
    'Retries are bounded; failure is returned and logged, never hidden.',
    'p95 = sorted(values)[int(0.95 × n)].',
  ],
  example: {
    code: [
      'c = sim.FakeLLM([',
      '    sim.tool_call("calculator",',
      '                  expression="6*7"),',
      '    "It is 42."])',
      'msgs = [{"role": "user",',
      '         "content": "6*7?"}]',
      'for _ in range(3):',
      '    m = c.messages.create(',
      '        model="model-small",',
      '        max_tokens=50,',
      '        tools=sim.tool_specs(),',
      '        messages=msgs)',
      '    if m.stop_reason != "tool_use":',
      '        break',
      '    b = m.content[0]',
      '    r = sim.call_tool(b.name, b.input)',
      '    res = {"type": "tool_result",',
      '           "tool_use_id": b.id,',
      '           "content": json.dumps(r)}',
      '    msgs += [',
      '        {"role": "assistant",',
      '         "content": m.content},',
      '        {"role": "user",',
      '         "content": [res]}]',
      'print(m.content[0].text, len(msgs))',
    ].join('\n'),
    output: 'It is 42. 3',
    notes: [
      'The first reply asks for the calculator ("tool_use"); the code runs it.',
      'The request (assistant) and its result (user, tool_result) go back together, linked by `tool_use_id`.',
      'The second reply is text, so the loop stops; `range(3)` is the step limit.',
    ],
  },
  mistakes: [
    { mistake: 'Treating the reply as a string.', fix: 'Read `msg.content` blocks; keep the ones with type "text".' },
    { mistake: 'Ignoring `stop_reason`.', fix: '"max_tokens" means a cut-off answer; "tool_use" means no answer yet.' },
    { mistake: 'Sending only the newest question.', fix: 'Send the history you want the model to know; it keeps none.' },
    { mistake: 'Trusting JSON because it parsed.', fix: 'Validate fields and types with a Pydantic model.' },
    { mistake: 'Retrying forever.', fix: 'Cap retries and tool steps, then fail clearly and log it.' },
  ],
  forReal:
    'What the app cannot give you: a real model, real latency and real bills. In your plan this is the week 2 build: an async LLM client on httpx (or the provider SDK) with timeouts, retries with exponential backoff on 429 and 5xx, Pydantic schemas, and token and cost logging, tested against a mocked transport. Use the provider\'s current docs for model names and prices, and check its structured-output mode for schema-valid JSON.',
};
