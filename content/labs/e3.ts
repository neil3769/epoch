import type { Lab } from '../schema';

/*
 * Unit E3 labs, against the simulated LLM (`sim.FakeLLM`, same call shape as
 * the Anthropic SDK's `client.messages.create`). Lab 1 is a logged call
 * (the plan's week 2 "token and cost logging"), lab 2 schema-valid replies
 * with a repair loop, lab 3 a tool call by hand from empty functions.
 */
const DIFFERS =
  '`sim.FakeLLM` replies from a script instead of a real model, counts about 4 characters per token, and uses made-up prices. With the real SDK you would write `client = anthropic.Anthropic()` (it reads your API key from the environment) and call `client.messages.create(...)` the same way; real calls cost money, take real time, and the SDK already retries some errors for you.';

export const e3Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'e3-lab-1',
    title: 'A logged LLM call',
    intro:
      'Build the call your plan\'s client needs: send a question with a system prompt, read the text out of the reply, price the call, and log its tokens, cost and time. Then read a p95 from your log.',
    summary: 'You built a logged LLM call: every question records its tokens, cost and latency, and the log gives you a p95.',
    minutes: 12,
    unlockAfter: 'e3-05',
    given: [
      'SYSTEM = "Answer in one sentence."',
      'client = sim.FakeLLM(',
      '    ["Refunds take 14 days."] * 5)',
    ].join('\n'),
    differs: DIFFERS,
    steps: [
      {
        goal: 'Finish `ask(question)`: call the client with `SYSTEM` as the system prompt and the question as one user message, and return the reply object.',
        starter:
          'def ask(question):\n    msg = ___\n    return client.messages.create(\n        model="model-small",\n        max_tokens=100,\n        system=___,\n        messages=[msg])',
        solution:
          'def ask(question):\n    msg = {"role": "user",\n           "content": question}\n    return client.messages.create(\n        model="model-small",\n        max_tokens=100,\n        system=SYSTEM,\n        messages=[msg])',
        tests: [
          'm = ask("Refunds?")',
          'call = client.calls[-1]',
          'assert call["system"] == SYSTEM, f"pass SYSTEM as the system prompt, got {call[\'system\']!r}"',
          'assert call["messages"] == [{"role": "user", "content": "Refunds?"}], f"send one user message with the question, got {call[\'messages\']}"',
          'assert m.stop_reason == "end_turn", "ask should return the reply object"',
        ].join('\n'),
        hints: [
          'System rules go in `system=`; the question is one dict with role "user" in the list.',
          'def ask(question):\n    msg = {"role": ___,\n           "content": ___}\n    return client.messages.create(\n        model="model-small",\n        max_tokens=100,\n        system=___,\n        messages=[msg])',
        ],
        explain: 'The system prompt rides on every call, outside the message list.',
      },
      {
        goal: 'Write `text_of(msg)`: the words of all the text blocks in a reply, joined together.',
        starter: 'def text_of(msg):\n    blocks = msg.content\n    parts = [___ for b in blocks\n             if b.type == "text"]\n    return "".join(parts)',
        solution: 'def text_of(msg):\n    blocks = msg.content\n    parts = [b.text for b in blocks\n             if b.type == "text"]\n    return "".join(parts)',
        tests: [
          't = text_of(ask("Refunds?"))',
          'assert t == "Refunds take 14 days.", f"text_of should give the reply words, got {t!r}"',
          'tool = sim.FakeLLM([sim.tool_call("calculator", expression="1+1")])',
          'm = tool.messages.create(model="model-small", max_tokens=20, messages=[{"role": "user", "content": "1+1"}])',
          'assert text_of(m) == "", "a reply with only a tool request has no text"',
        ].join('\n'),
        hints: [
          'Each text block keeps its words in `.text`.',
          'def text_of(msg):\n    blocks = msg.content\n    parts = [b.___ for b in blocks\n             if b.type == ___]\n    return "".join(parts)',
        ],
        explain: 'Filtering by type means a tool request never crashes your text handling.',
      },
      {
        goal: 'Write `cost_of(msg)`: the cost of a reply from its usage and `sim.PRICES[msg.model]` (input and output prices per million tokens).',
        starter: 'def cost_of(msg):\n    pin, pout = sim.PRICES[msg.model]\n    u = msg.usage\n    return ___',
        solution:
          'def cost_of(msg):\n    pin, pout = sim.PRICES[msg.model]\n    u = msg.usage\n    cost = (u.input_tokens * pin\n            + u.output_tokens * pout)\n    return cost / 1e6',
        tests: [
          'm = ask("Refunds?")',
          'want = (m.usage.input_tokens * 0.25 + m.usage.output_tokens * 1.25) / 1e6',
          'got = cost_of(m)',
          'assert got is not None and abs(got - want) < 1e-12, f"expected {want}, got {got}"',
        ].join('\n'),
        hints: [
          'Input tokens times the input price, plus output tokens times the output price, divided by a million.',
          'def cost_of(msg):\n    pin, pout = sim.PRICES[msg.model]\n    u = msg.usage\n    cost = (u.input_tokens * ___\n            + u.output_tokens * ___)\n    return cost / ___',
        ],
      },
      {
        goal: 'Finish `logged_ask(question, log)`: time the call on `sim.clock`, append a record to `log`, and return the reply text.',
        starter:
          'def logged_ask(question, log):\n    t0 = sim.clock.time()\n    m = ask(question)\n    secs = ___\n    u = m.usage\n    rec = {"in": u.input_tokens,\n           "out": u.output_tokens,\n           "cost": cost_of(m),\n           "secs": secs}\n    log.append(rec)\n    return text_of(m)',
        solution:
          'def logged_ask(question, log):\n    t0 = sim.clock.time()\n    m = ask(question)\n    secs = sim.clock.time() - t0\n    u = m.usage\n    rec = {"in": u.input_tokens,\n           "out": u.output_tokens,\n           "cost": cost_of(m),\n           "secs": secs}\n    log.append(rec)\n    return text_of(m)',
        tests: [
          'log = []',
          't = logged_ask("Refunds?", log)',
          'assert t == "Refunds take 14 days.", f"return the reply text, got {t!r}"',
          'assert len(log) == 1, "append one record per call"',
          'r = log[0]',
          'assert abs(r["secs"] - 0.4) < 1e-9, f"the stand-in takes 0.4 s per call, got {r[\'secs\']}"',
          'assert r["cost"] > 0 and r["in"] > 0 and r["out"] > 0, f"record tokens and cost, got {r}"',
        ].join('\n'),
        hints: [
          'Seconds taken is the clock now minus the clock before the call.',
          '    secs = sim.clock.___() - ___',
        ],
        explain: 'Every call now leaves a record: this is the "token and cost logging" from your plan\'s week 2 client.',
      },
      {
        goal: 'Write `p95(values)`: sort them and return the value 95% of the way along.',
        starter: 'def p95(values):\n    s = sorted(values)\n    return ___',
        solution: 'def p95(values):\n    s = sorted(values)\n    return s[int(0.95 * len(s))]',
        tests: [
          'assert p95([5, 1, 9, 3] * 5) == 9, "20 values: index 19 of the sorted list"',
          'vals = [100] * 19 + [3000]',
          'assert p95(vals) == 3000, f"one slow call in 20 is the p95, got {p95(vals)}"',
          'assert p95(list(range(100))) == 95, f"0..99: p95 is 95, got {p95(list(range(100)))}"',
        ].join('\n'),
        hints: [
          'The index is `int(0.95 * len(s))`.',
          'def p95(values):\n    s = sorted(values)\n    return s[int(___ * len(s))]',
        ],
        explain: 'Feed it the "secs" from your log and you can quote the p95 latency of your client.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'e3-lab-2',
    title: 'Schema-valid replies',
    intro:
      'Make a model\'s reply safe for code: validate it with Pydantic, explain what was wrong, and ask again with the error until it is right or you have tried enough. Less scaffolding this time.',
    summary: 'You built a repair loop: replies are validated against a schema, and bad ones go back with their error, a bounded number of times.',
    minutes: 12,
    unlockAfter: 'e3-07',
    given: [
      'from pydantic import BaseModel',
      'from pydantic import ValidationError',
      '',
      'class Refund(BaseModel):',
      '    allowed: bool',
      '    days: int',
      '',
      'check = Refund.model_validate_json',
    ].join('\n'),
    differs: DIFFERS,
    steps: [
      {
        goal: 'Write `parse(text)`: the reply validated as a `Refund`, or `None` if it is not valid.',
        starter: 'def parse(text):\n    try:\n        return ___\n    except ValidationError:\n        return None',
        solution: 'def parse(text):\n    try:\n        return check(text)\n    except ValidationError:\n        return None',
        tests: [
          'r = parse(\'{"allowed": true, "days": 14}\')',
          'assert isinstance(r, Refund) and r.days == 14, f"valid JSON should give a Refund, got {r!r}"',
          'assert parse("Sure! 14 days.") is None, "text that is not JSON should give None"',
          'assert parse(\'{"allowed": true}\') is None, "a missing field should give None"',
        ].join('\n'),
        hints: [
          '`check(text)` (which is `Refund.model_validate_json`) parses and validates in one go.',
          'def parse(text):\n    try:\n        return ___(text)\n    except ValidationError:\n        return ___',
        ],
      },
      {
        goal: 'Write `problem(text)`: the first error\'s "msg" if the reply is invalid, or "" if it is valid.',
        starter: 'def problem(text):\n    ___',
        solution:
          'def problem(text):\n    try:\n        check(text)\n        return ""\n    except ValidationError as e:\n        return e.errors()[0]["msg"]',
        tests: [
          'assert problem(\'{"allowed": true, "days": 14}\') == "", "a valid reply has no problem"',
          'p = problem(\'{"allowed": true}\')',
          'assert p == "Field required", f"a missing field gives \'Field required\', got {p!r}"',
          'p = problem(\'{"allowed": true, "days": "soon"}\')',
          'assert "integer" in p, f"a non-number for days should mention an integer, got {p!r}"',
        ].join('\n'),
        hints: [
          'Catch the ValidationError as `e`; `e.errors()` is a list of dicts, each with a "msg".',
          'def problem(text):\n    try:\n        check(text)\n        return ___\n    except ValidationError as e:\n        return e.errors()[0][___]',
        ],
        explain: 'This message is what you send back to the model so it knows what to fix.',
      },
      {
        goal: 'Finish `ask_refund(client, q, tries=3)`: on a bad reply, add it as an assistant turn and "Fix: " plus the problem as a user turn, then ask again.',
        starter:
          'def ask_refund(client, q, tries=3):\n    msgs = [{"role": "user",\n             "content": q}]\n    for _ in range(tries):\n        m = client.messages.create(\n            model="model-small",\n            max_tokens=100,\n            messages=msgs)\n        text = m.content[0].text\n        r = parse(text)\n        if r is not None:\n            return r\n        ___\n    return None',
        solution:
          'def ask_refund(client, q, tries=3):\n    msgs = [{"role": "user",\n             "content": q}]\n    for _ in range(tries):\n        m = client.messages.create(\n            model="model-small",\n            max_tokens=100,\n            messages=msgs)\n        text = m.content[0].text\n        r = parse(text)\n        if r is not None:\n            return r\n        fix = "Fix: " + problem(text)\n        msgs = msgs + [\n            {"role": "assistant",\n             "content": text},\n            {"role": "user",\n             "content": fix}]\n    return None',
        tests: [
          'c = sim.FakeLLM(["14 days!", \'{"allowed": true, "days": 14}\'])',
          'r = ask_refund(c, "Refund?")',
          'assert isinstance(r, Refund) and r.days == 14, f"the second reply is valid, so return it, got {r!r}"',
          'assert len(c.calls) == 2, f"one retry was needed, got {len(c.calls)} calls"',
          'second = c.calls[1]["messages"]',
          'assert [x["role"] for x in second] == ["user", "assistant", "user"], f"retry should send question, bad reply, fix request; got {[x[\'role\'] for x in second]}"',
          'assert second[-1]["content"].startswith("Fix: "), "the fix request should start with \'Fix: \'"',
          'c = sim.FakeLLM(["no"] * 5)',
          'assert ask_refund(c, "Refund?") is None, "give up with None after the tries run out"',
          'assert len(c.calls) == 3, f"stop after 3 tries, got {len(c.calls)} calls"',
        ].join('\n'),
        hints: [
          'Make a new list: the old messages, then the bad reply (role "assistant"), then "Fix: " + problem(text) (role "user").',
          '        fix = "Fix: " + ___(text)\n        msgs = msgs + [\n            {"role": ___,\n             "content": text},\n            {"role": "user",\n             "content": ___}]',
        ],
        explain: 'Bounded retries with the real error: the standard way to get schema-valid output when a schema mode is not available.',
      },
      {
        goal: 'Write `success_rate(client, questions)`: the share of questions for which `ask_refund` returned a Refund.',
        starter: 'def success_rate(client, questions):\n    ___',
        solution:
          'def success_rate(client, questions):\n    ok = 0\n    for q in questions:\n        if ask_refund(client, q):\n            ok += 1\n    return ok / len(questions)',
        tests: [
          'good = \'{"allowed": false, "days": 0}\'',
          'c = sim.FakeLLM([good, "x", "y", "z", good])',
          's = success_rate(c, ["q1", "q2", "q3"])',
          'assert abs(s - 2 / 3) < 1e-9, f"q1 ok, q2 fails 3 times, q3 ok: 2/3, got {s}"',
        ].join('\n'),
        hints: [
          'Count the questions where `ask_refund` gives back something that is not None.',
          'def success_rate(client, questions):\n    ok = 0\n    for q in questions:\n        if ask_refund(client, ___):\n            ok += 1\n    return ok / ___',
        ],
        explain: 'A success rate is an eval of your whole pipeline, retries included: report it with the cost of the extra calls.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'e3-lab-3',
    title: 'A tool call by hand',
    intro:
      'Write the tool-calling round trip yourself: find the tool request, run it, send the result back, and loop until the model answers, with a step limit. Every step starts from an empty function.',
    summary: 'You wrote a tool-calling loop by hand: find the request, run the tool, return a tool_result, and stop at a step limit.',
    minutes: 14,
    unlockAfter: 'e3-10',
    differs: DIFFERS,
    steps: [
      {
        goal: 'Write `tool_block(msg)`: the first block in `msg.content` whose `type` is "tool_use", or `None`.',
        starter: 'def tool_block(msg):\n    pass',
        solution: 'def tool_block(msg):\n    for b in msg.content:\n        if b.type == "tool_use":\n            return b\n    return None',
        tests: [
          'c = sim.FakeLLM([sim.tool_call("get_weather", city="Lisbon"), "Sunny."])',
          'q = [{"role": "user", "content": "Lisbon?"}]',
          'm = c.messages.create(model="model-small", max_tokens=50, messages=q)',
          'b = tool_block(m)',
          'assert b is not None and b.name == "get_weather", f"find the get_weather request, got {b!r}"',
          'm = c.messages.create(model="model-small", max_tokens=50, messages=q)',
          'assert tool_block(m) is None, "a text reply has no tool block: None"',
        ].join('\n'),
        hints: [
          'Loop over the blocks and return the first one with type "tool_use".',
          'def tool_block(msg):\n    for b in msg.content:\n        if b.type == ___:\n            return b\n    return ___',
        ],
      },
      {
        goal: 'Write `result_message(block)`: run the tool with `sim.call_tool`, and return a user message whose content is one tool_result block with `tool_use_id` and the result as JSON text.',
        starter: 'def result_message(block):\n    pass',
        solution:
          'def result_message(block):\n    r = sim.call_tool(block.name,\n                      block.input)\n    part = {"type": "tool_result",\n            "tool_use_id": block.id,\n            "content": json.dumps(r)}\n    return {"role": "user",\n            "content": [part]}',
        tests: [
          'c = sim.FakeLLM([sim.tool_call("lookup_order", order_id="A100")])',
          'm = c.messages.create(model="model-small", max_tokens=50, messages=[{"role": "user", "content": "A100?"}])',
          'b = m.content[0]',
          'msg = result_message(b)',
          'assert msg["role"] == "user", "tool results go back as a user message"',
          'part = msg["content"][0]',
          'assert part["type"] == "tool_result", f"the block type should be tool_result, got {part[\'type\']!r}"',
          'assert part["tool_use_id"] == b.id, "link the result to the request with tool_use_id"',
          'assert json.loads(part["content"]) == {"order_id": "A100", "status": "shipped"}, f"content should be the tool result as JSON, got {part[\'content\']!r}"',
        ].join('\n'),
        hints: [
          'Run the tool, then wrap the result: role "user", content a list with one dict of type "tool_result", the block\'s id, and `json.dumps(result)`.',
          'def result_message(block):\n    r = sim.call_tool(block.name,\n                      block.input)\n    part = {"type": ___,\n            "tool_use_id": ___,\n            "content": json.dumps(r)}\n    return {"role": "user",\n            "content": [part]}',
        ],
      },
      {
        goal: 'Write `next_messages(msgs, msg)`: a new list with the model\'s reply added as an assistant turn (`msg.content`), then the tool result message.',
        starter: 'def next_messages(msgs, msg):\n    pass',
        solution:
          'def next_messages(msgs, msg):\n    turn = {"role": "assistant",\n            "content": msg.content}\n    b = tool_block(msg)\n    res = result_message(b)\n    return msgs + [turn, res]',
        tests: [
          'c = sim.FakeLLM([sim.tool_call("calculator", expression="2*21")])',
          'q = [{"role": "user", "content": "2*21?"}]',
          'm = c.messages.create(model="model-small", max_tokens=50, messages=q)',
          'out = next_messages(q, m)',
          'assert len(q) == 1, "do not change the old list; build a new one"',
          'assert [x["role"] for x in out] == ["user", "assistant", "user"], f"expected user, assistant, user; got {[x[\'role\'] for x in out]}"',
          'assert out[1]["content"] is m.content, "the assistant turn should carry the reply\'s content blocks"',
          'assert json.loads(out[2]["content"][0]["content"]) == {"result": 42}, "then the tool result"',
        ].join('\n'),
        hints: [
          'The assistant turn holds `msg.content` as it came; then add `result_message` for its tool block.',
          'def next_messages(msgs, msg):\n    turn = {"role": ___,\n            "content": msg.content}\n    b = tool_block(msg)\n    res = ___(b)\n    return msgs + [turn, res]',
        ],
        explain: 'The model needs to see its own request next to your result, in that order.',
      },
      {
        goal: 'Write `answer(client, q, max_steps=4)`: call the model, run tools while it asks for them, and return its final text; return "stopped" if it is still asking after `max_steps` calls.',
        starter: 'def answer(client, q, max_steps=4):\n    pass',
        solution:
          'def answer(client, q, max_steps=4):\n    msgs = [{"role": "user",\n             "content": q}]\n    for _ in range(max_steps):\n        m = client.messages.create(\n            model="model-small",\n            max_tokens=200,\n            tools=sim.tool_specs(),\n            messages=msgs)\n        if tool_block(m) is None:\n            return m.content[0].text\n        msgs = next_messages(msgs, m)\n    return "stopped"',
        tests: [
          'c = sim.FakeLLM([sim.tool_call("lookup_order", order_id="A101"), sim.tool_call("get_weather", city="Porto"), "Processing; rain in Porto."])',
          'a = answer(c, "Order A101, and Porto weather?")',
          'assert a == "Processing; rain in Porto.", f"after two tools, return the final text, got {a!r}"',
          'assert len(c.calls) == 3, f"three calls: two tool requests and the answer, got {len(c.calls)}"',
          'last = c.calls[-1]["messages"]',
          'assert len(last) == 5, f"the last call should carry the question plus two request/result pairs, got {len(last)} messages"',
          'assert c.calls[0]["tools"], "send the tool specs so the model knows what it can call"',
          'loop = sim.FakeLLM([sim.tool_call("calculator", expression="1+1")] * 10)',
          'a = answer(loop, "Loop?", max_steps=3)',
          'assert a == "stopped" and len(loop.calls) == 3, f"stop after max_steps calls, got {a!r} after {len(loop.calls)} calls"',
        ].join('\n'),
        hints: [
          'Loop at most `max_steps` times: call with `tools=sim.tool_specs()`; no tool block means you are done; otherwise extend the messages with `next_messages`.',
          'def answer(client, q, max_steps=4):\n    msgs = [{"role": "user",\n             "content": q}]\n    for _ in range(___):\n        m = client.messages.create(\n            model="model-small",\n            max_tokens=200,\n            tools=sim.tool_specs(),\n            messages=msgs)\n        if tool_block(m) is None:\n            return ___\n        msgs = ___(msgs, m)\n    return "stopped"',
        ],
        explain: 'This loop, with a step limit, is the core of every agent (unit E7).',
      },
    ],
  },
];
