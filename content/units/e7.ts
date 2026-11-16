import { e7Labs } from '../labs/e7';
import { e7Library } from '../library/e7';
import type { Unit } from '../schema';
import { e7More } from './e7-more';

/*
 * E7 Agents. Lessons 1 to 5: workflow or agent, when not to use one, the
 * loop by hand, tool errors, step limits. Lessons 6 to 10 are in e7-more.ts.
 * The prelude defines two helpers that lesson 3 introduces: ask(c, msgs)
 * calls the model with sim's tools, and tool_turns(r) runs the requested
 * tools and returns the assistant turn plus the tool results turn.
 */
const PRELUDE = `import json
import epoch_sim as sim

def ask(c, msgs):
    return c.messages.create(
        model="model-small", max_tokens=200,
        tools=sim.tool_specs(), messages=msgs)

def tool_turns(r):
    parts = []
    for b in r.content:
        if b.type != "tool_use":
            continue
        out = sim.call_tool(b.name, b.input)
        parts.append({"type": "tool_result", "tool_use_id": b.id,
                      "content": json.dumps(out), "is_error": "error" in out})
    return [{"role": "assistant", "content": r.content},
            {"role": "user", "content": parts}]`;

export const e7: Unit = {
  id: 'E7',
  track: 'engineering',
  title: 'Agents',
  blurb: 'Workflow or agent and when not to use one; the tool loop by hand; tool errors, step and spend limits; tool design; MCP; prompt injection.',
  prelude: PRELUDE,
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'e7-01',
      title: 'Workflow or agent',
      summary: 'In a workflow your code fixes the steps; in an agent the model picks the next step in a loop.',
      card: {
        title: 'Workflow or agent',
        text: 'In a workflow your code fixes the steps, such as retrieve, then call the model, then check the answer. In an agent the model chooses the next step itself, calling tools in a loop until it decides it is done. Agents handle open-ended tasks, at the price of cost, latency and predictability.',
        code: `c = sim.FakeLLM([
    sim.tool_call("lookup_order",
                  order_id="A100"),
    "Order A100 has shipped."])
q = [{"role": "user",
      "content": "Where is A100?"}]
r = ask(c, q)
print(r.stop_reason)`,
        output: 'tool_use',
      },
      exercises: [
        {
          id: 'e7-1-1',
          type: 'mcq',
          prompt: 'Sort support emails into five categories, then send each to a team. Workflow or agent?',
          options: [
            { text: 'A workflow: the steps never change' },
            { text: 'An agent: every email is different', why: 'The emails differ, but the steps (classify, then route) are always the same.' },
            { text: 'Either: agents are always better', why: 'An agent adds cost and unpredictability for no gain when the steps are known.' },
          ],
          answer: 0,
          explain: 'Known steps in a known order: write them as code (routing).',
        },
        {
          id: 'e7-1-2',
          type: 'mcq',
          prompt: 'Fix a failing test in a codebase you have never seen; which files matter is unknown at the start. Workflow or agent?',
          options: [
            { text: 'An agent: next steps depend on findings' },
            { text: 'A workflow: code fixes every step', why: 'You cannot write the steps in advance: what to read next depends on what was found.' },
          ],
          answer: 0,
          explain: 'Open-ended, unpredictable steps are what agents are for.',
        },
        {
          id: 'e7-1-3',
          type: 'match-pairs',
          prompt: 'Match each pattern to what it does.',
          pairs: [
            { left: 'prompt chaining', right: 'a fixed sequence of calls', why: 'Each call\'s output feeds the next, in an order your code sets.' },
            { left: 'routing', right: 'classify, then pick a path', why: 'One call decides which fixed branch runs.' },
            { left: 'parallel calls', right: 'independent calls, then combine', why: 'Several calls at once, merged by your code.' },
            { left: 'agent', right: 'the model picks its next step', why: 'The loop continues until the model decides it is done.' },
          ],
          explain: 'The first three are workflows: your code holds the plan.',
        },
        {
          id: 'e7-1-4',
          type: 'predict-output',
          prompt: 'A two-step workflow with a stand-in model. What does this print?',
          code: `calls = []
def llm(prompt):
    calls.append(prompt)
    return prompt.upper()

draft = llm("draft")
final = llm("polish " + draft)
print(len(calls), final)`,
          answer: '2 POLISH DRAFT',
          options: [
            { text: '2 POLISH DRAFT' },
            { text: '1 POLISH DRAFT', why: 'Each `llm(...)` is one call: two in total.' },
            { text: '2 polish DRAFT', why: 'The second call upper-cases its whole prompt, "polish DRAFT".' },
          ],
          explain: 'A workflow makes the same number of calls every time: your code decided.',
        },
        {
          id: 'e7-1-5',
          type: 'predict-output',
          prompt: 'Two calls to a scripted model. What does this print?',
          code: `c = sim.FakeLLM([
    sim.tool_call("calculator",
                  expression="2+2"),
    "It is 4."])
q = [{"role": "user",
     "content": "2+2"}]
for _ in range(2):
    r = ask(c, q)
    print(r.stop_reason)`,
          answer: 'tool_use\nend_turn',
          options: [
            { text: 'tool_use\nend_turn' },
            { text: 'end_turn\ntool_use', why: 'The script asks for the calculator first, then answers.' },
            { text: 'tool_use\ntool_use', why: 'The second reply is plain text, so it ends the turn.' },
          ],
          explain: '"tool_use" means the model wants a tool run; "end_turn" means it has answered.',
        },
        {
          id: 'e7-1-6',
          type: 'mcq',
          prompt: 'What do you give up for an agent\'s flexibility?',
          options: [
            { text: 'Cost, latency and predictability' },
            { text: 'Accuracy on every single task', why: 'Agents can be more accurate on open tasks; the price is elsewhere.' },
            { text: 'The ability to use any tools', why: 'Workflows use tools too; the difference is who decides the order.' },
          ],
          answer: 0,
          explain: 'More model calls, more time, and runs that differ each time.',
        },
        {
          id: 'e7-1-7',
          type: 'fill-blank',
          prompt: 'Check that the model has finished, with no tool request.',
          code: `c = sim.FakeLLM(["Done."])
q = [{"role": "user",
     "content": "Hi"}]
r = ask(c, q)
print(r.stop_reason == ___)`,
          answer: ['"end_turn"'],
          distractors: [
            { text: '"tool_use"', why: 'That would mean the model is asking for a tool.' },
            { text: '"max_tokens"', why: 'That means the reply was cut off at the token limit.' },
          ],
          expectOutput: 'True',
          explain: 'An agent loop runs until this is true.',
        },
        {
          id: 'e7-1-8',
          type: 'run-code',
          prompt: 'Set `wants` to True if the reply asks for a tool.',
          before: `c = sim.FakeLLM([sim.tool_call(
    "get_weather", city="Porto")])
q = [{"role": "user",
     "content": "Hi"}]
r = ask(c, q)`,
          solution: 'wants = r.stop_reason == "tool_use"',
          tests: 'assert wants is True, f"the reply asks for get_weather; got {wants!r}"',
          placeholder: 'wants = ...',
          explain: '`stop_reason` says why the model stopped: here, to ask for a tool.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'e7-02',
      title: 'When not to use an agent',
      summary: 'Use the simplest thing that works; agents compound errors and cost, so avoid them where mistakes are expensive.',
      card: {
        title: 'When not to use an agent',
        text: 'Start with the simplest thing that works: one model call, perhaps with retrieval, then a fixed workflow, and an agent only when the steps cannot be known in advance. Every agent step costs a model call, and an early mistake carries into every later step. Avoid agents where errors are expensive and no one checks the result.',
        code: `p = 0.95
for steps in [1, 5, 20]:
    print(steps, round(p ** steps, 2))`,
        output: '1 0.95\n5 0.77\n20 0.36',
      },
      exercises: [
        {
          id: 'e7-2-1',
          type: 'predict-output',
          prompt: 'Each step succeeds 9 times in 10. Type the chance that 10 steps all succeed.',
          code: 'print(round(0.9 ** 10, 2))',
          answer: '0.35',
          typedWrong: [{ answer: '0.9', why: 'All ten must succeed, so the chances multiply: 0.9 × 0.9 × ...' }],
          explain: 'Reliable steps still add up to an unreliable chain.',
        },
        {
          id: 'e7-2-2',
          type: 'mcq',
          prompt: 'Extract the total from an invoice into JSON. What do you build?',
          options: [
            { text: 'One model call with a schema' },
            { text: 'An agent with a PDF reader tool', why: 'There is one fixed step; a loop adds cost and nothing else.' },
            { text: 'A team of cooperating agents', why: 'Far more machinery than a single extraction needs.' },
          ],
          answer: 0,
          explain: 'One call with structured output (unit E3).',
        },
        {
          id: 'e7-2-3',
          type: 'mcq',
          prompt: 'An agent can issue refunds on its own. What is the main worry?',
          options: [
            { text: 'A wrong step costs real money' },
            { text: 'It is slower than a person', why: 'Speed is not the risk; unchecked, irreversible actions are.' },
            { text: 'Refunds do not need any tools', why: 'Issuing a refund is exactly a tool action, and a risky one.' },
          ],
          answer: 0,
          explain: 'Put a person\'s approval in front of irreversible actions (lesson 9).',
        },
        {
          id: 'e7-2-4',
          type: 'mcq',
          prompt: 'An agent solves 80% of tasks. A fixed three-step workflow solves 78% at a fifth of the cost and time. Which do you ship?',
          options: [
            { text: 'The workflow' },
            { text: 'The agent, for its 80%', why: 'Two points of success rarely justify five times the cost and latency, plus less predictable runs.' },
          ],
          answer: 0,
          explain: 'Add complexity only when it measurably pays for itself.',
        },
        {
          id: 'e7-2-5',
          type: 'match-pairs',
          prompt: 'Match each level to when it fits.',
          pairs: [
            { left: 'one call', right: 'the prompt holds all it needs', why: 'Nothing to look up, nothing to decide.' },
            { left: 'call plus retrieval', right: 'answers live in your documents', why: 'Fetch the passages, then one call (unit E6).' },
            { left: 'workflow', right: 'known steps in a fixed order', why: 'Your code sets the order.' },
            { left: 'agent', right: 'steps unknown until it starts', why: 'The model decides as it goes.' },
          ],
          explain: 'Climb only as far as the task needs.',
        },
        {
          id: 'e7-2-6',
          type: 'predict-output',
          prompt: 'The agent made 12 model calls; the workflow makes 3. At 0.002 euros a call, what is the difference?',
          code: `agent, wf = 12, 3
price = 0.002
print(round((agent - wf) * price, 3))`,
          answer: '0.018',
          options: [
            { text: '0.018' },
            { text: '0.024', why: 'That is the agent\'s whole cost; the question asks for the difference (9 calls).' },
            { text: '0.009', why: '9 calls at 0.002 is 0.018.' },
          ],
          explain: 'Small per request, large at a million requests a month.',
        },
        {
          id: 'e7-2-7',
          type: 'fill-blank',
          prompt: 'The chance that 20 steps, each 95% reliable, all succeed.',
          code: 'print(round(0.95 ___ 20, 2))',
          answer: ['**'],
          distractors: [
            { text: '*', why: '0.95 × 20 is 19: not a probability.' },
            { text: '-', why: 'Subtracting gives a negative number, not a chance.' },
          ],
          expectOutput: '0.36',
          explain: 'Independent chances multiply, so it is a power.',
        },
        {
          id: 'e7-2-8',
          type: 'run-code',
          prompt: 'Each step succeeds with probability `p`. Set `ok` to the chance that all 5 steps succeed.',
          before: 'p = 0.9',
          solution: 'ok = p ** 5',
          tests: 'assert abs(ok - 0.59049) < 1e-9, f"0.9 to the power 5 is 0.59049; got {ok}"',
          placeholder: 'ok = ...',
          explain: 'Five 90% steps: barely better than a coin toss.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'e7-03',
      title: 'The loop by hand',
      summary: 'Call the model with tools; while it asks for tools, run them and append both turns; stop when it answers.',
      card: {
        title: 'The loop by hand',
        text: 'An agent is a loop: call the model with the tools, and if it asks for tools, run them, append its request and your results to the messages, and call again. Stop when it replies without asking for a tool. Here `ask(c, msgs)` calls the model with the tools, and `tool_turns(r)` returns the two turns to append, both as built in unit E3.',
        code: `c = sim.FakeLLM([
    sim.tool_call("lookup_order",
                  order_id="A101"),
    "A101 is processing."])
msgs = [{"role": "user",
         "content": "Where is A101?"}]
while True:
    r = ask(c, msgs)
    if r.stop_reason != "tool_use":
        break
    msgs += tool_turns(r)
print(r.content[0].text)`,
        output: 'A101 is processing.',
      },
      exercises: [
        {
          id: 'e7-3-1',
          type: 'predict-output',
          prompt: 'Two tool requests, then an answer. What does this print?',
          code: `c = sim.FakeLLM([
    sim.tool_call("get_weather",
                  city="Lisbon"),
    sim.tool_call("get_weather",
                  city="Porto"),
    "Lisbon is warmer."])
msgs = [{"role": "user",
         "content": "Warmer?"}]
while True:
    r = ask(c, msgs)
    if r.stop_reason != "tool_use":
        break
    msgs += tool_turns(r)
print(len(c.calls), len(msgs))`,
          answer: '3 5',
          options: [
            { text: '3 5' },
            { text: '2 5', why: 'The answer itself takes a third call.' },
            { text: '3 3', why: 'Each tool round appends two turns: 1 + 2 + 2 = 5.' },
          ],
          explain: 'Three calls; the question plus two request/result pairs.',
        },
        {
          id: 'e7-3-2',
          type: 'predict-output',
          prompt: 'After one tool round, what are the roles?',
          code: `c = sim.FakeLLM([sim.tool_call(
    "calculator", expression="6*7")])
msgs = [{"role": "user",
         "content": "6*7?"}]
r = ask(c, msgs)
msgs += tool_turns(r)
print([m["role"] for m in msgs])`,
          answer: "['user', 'assistant', 'user']",
          options: [
            { text: "['user', 'assistant', 'user']" },
            { text: "['user', 'user']", why: 'The model\'s own request goes back first, as an assistant turn.' },
            { text: "['user', 'tool', 'user']", why: 'There is no "tool" role here: results go in a user turn.' },
          ],
          explain: 'Tool results travel in a user turn, right after the assistant turn that asked for them.',
        },
        {
          id: 'e7-3-3',
          type: 'fill-blank',
          prompt: 'Keep going while the model asks for tools.',
          code: `c = sim.FakeLLM([sim.tool_call(
    "calculator", expression="1+2"),
    "3."])
msgs = [{"role": "user",
         "content": "1+2?"}]
while True:
    r = ask(c, msgs)
    if r.stop_reason ___ "tool_use":
        break
    msgs += tool_turns(r)
print(r.content[0].text)`,
          answer: ['!='],
          distractors: [{ text: '==', why: 'That stops at the first tool request, before any tool has run.' }],
          expectOutput: '3.',
          explain: 'Stop only when the model answers without a tool request.',
        },
        {
          id: 'e7-3-4',
          type: 'spot-bug',
          prompt: 'The model never sees its own request. Which line is wrong?',
          code: `c = sim.FakeLLM([sim.tool_call(
    "calculator", expression="1+2")])
msgs = [{"role": "user",
         "content": "1+2?"}]
r = ask(c, msgs)
msgs.append(tool_turns(r)[1])
roles = [m["role"] for m in msgs]
want = ["user", "assistant", "user"]
assert roles == want, roles`,
          error: "AssertionError: ['user', 'user']",
          answer: 5,
          raiseLine: 8,
          lineWhy: {
            '0': 'A scripted tool request is fine.',
            '1': 'Part of the script.',
            '2': 'The question is fine.',
            '3': 'Part of the question.',
            '4': 'Calling the model is right.',
            '6': 'Listing the roles is just for the check.',
            '7': 'This is the order the API expects.',
            '8': 'The check is right.',
          },
          explain: 'Append both turns, `msgs += tool_turns(r)`: the request, then its results. The real API rejects a tool result with no matching request.',
        },
        {
          id: 'e7-3-5',
          type: 'mcq',
          prompt: 'Why send the model\'s tool request back as an assistant turn?',
          options: [
            { text: 'Results must follow their request' },
            { text: 'To make the prompt look longer to it', why: 'Length is not the point; the API matches results to requests by id.' },
            { text: 'Because the API ignores the turn anyway', why: 'The API requires it: a tool result needs the request it answers.' },
          ],
          answer: 0,
          explain: 'The model is stateless: it only knows what it asked for if you send it back.',
        },
        {
          id: 'e7-3-6',
          type: 'mcq',
          prompt: 'The model asks for two tools in one reply. What do you send back?',
          options: [
            { text: 'One user turn holding both results' },
            { text: 'Two user turns, one per result', why: 'All results for one reply go together in the next user turn.' },
            { text: 'Only the first tool\'s result', why: 'Every request needs its result, matched by `tool_use_id`.' },
          ],
          answer: 0,
          explain: 'That is why `tool_turns` loops over every tool_use block.',
        },
        {
          id: 'e7-3-7',
          type: 'predict-output',
          prompt: 'What does the tool result carry? What does this print?',
          code: `c = sim.FakeLLM([sim.tool_call(
    "lookup_order", order_id="A102")])
q = [{"role": "user",
     "content": "?"}]
r = ask(c, q)
part = tool_turns(r)[1]["content"][0]
out = json.loads(part["content"])
print(out["order_id"], out["status"])`,
          answer: 'A102 delivered',
          options: [
            { text: 'A102 delivered' },
            { text: 'A102 shipped', why: 'A100 is the shipped order; A102 is delivered.' },
            { text: 'toolu_001 delivered', why: 'That is the request id; the content holds the tool\'s own output.' },
          ],
          explain: 'The tool\'s output, as JSON text, linked to the request by `tool_use_id`.',
        },
        {
          id: 'e7-3-8',
          type: 'run-code',
          prompt: 'The reply `r` asks for a tool. Add its request and the tool results to `msgs`.',
          before: `c = sim.FakeLLM([sim.tool_call(
    "get_weather", city="Madrid")])
msgs = [{"role": "user",
         "content": "Madrid?"}]
r = ask(c, msgs)`,
          solution: 'msgs += tool_turns(r)',
          tests: [
            'assert len(msgs) == 3, f"question, request, results: 3 turns; got {len(msgs)}"',
            'assert msgs[1]["role"] == "assistant" and msgs[2]["role"] == "user", "request first, then results"',
          ].join('\n'),
          placeholder: 'msgs += ...',
          explain: 'One loop iteration\'s bookkeeping.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'e7-04',
      title: 'When a tool fails',
      summary: 'Send tool failures back to the model as results marked is_error, so it can recover, instead of crashing the loop.',
      card: {
        title: 'When a tool fails',
        text: 'Tools fail: unknown names, bad arguments, missing records, timeouts. Send the failure back to the model as a tool result marked `is_error` instead of crashing the loop, so the model can retry or change course. Keep the message short and say what was wrong.',
        code: `out = sim.call_tool("get_weather",
                    {"city": "Paris"})
print(out)`,
        output: "{'error': \"unknown city 'Paris'\"}",
      },
      exercises: [
        {
          id: 'e7-4-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `args = {"expression": "1/0"}
name = "calculator"
out = sim.call_tool(name, args)
print(out)`,
          answer: "{'error': 'ZeroDivisionError'}",
          options: [
            { text: "{'error': 'ZeroDivisionError'}" },
            { text: "{'result': 0}", why: 'Dividing by zero fails; the tool reports the error instead of raising it.' },
          ],
          explain: 'The tool returns the failure as data, ready to send to the model.',
        },
        {
          id: 'e7-4-2',
          type: 'predict-output',
          prompt: 'A tool that does not exist. What does this print?',
          code: `out = sim.call_tool("send_email", {})
print("error" in out)`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'Unknown tool names come back as an error result.' },
          ],
          explain: 'Models do sometimes ask for tools you never offered.',
        },
        {
          id: 'e7-4-3',
          type: 'mcq',
          prompt: 'A tool raises an exception inside your agent loop. What is the best handling?',
          options: [
            { text: 'Catch it and return it as an error result' },
            { text: 'Let it crash the whole agent run', why: 'One failed lookup should not lose all the work so far.' },
            { text: 'Retry the same call until it works', why: 'A bad argument fails every time; the model needs to see the error to change it.' },
          ],
          answer: 0,
          explain: 'The model can often fix its own mistake once it sees the error.',
        },
        {
          id: 'e7-4-4',
          type: 'predict-output',
          prompt: 'How is the failed result marked? What does this print?',
          code: `c = sim.FakeLLM([sim.tool_call(
    "get_weather", city="Paris")])
q = [{"role": "user",
     "content": "?"}]
r = ask(c, q)
part = tool_turns(r)[1]["content"][0]
print(part["is_error"])`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'The weather tool does not know Paris, so the result is an error.' },
          ],
          explain: '`is_error` tells the model this is a failure, not a normal answer.',
        },
        {
          id: 'e7-4-5',
          type: 'fill-blank',
          prompt: 'Did the tool fail?',
          code: `args = {"order_id": "Z9"}
out = sim.call_tool("lookup_order",
                    args)
print(___ in out)`,
          answer: ['"error"'],
          distractors: [
            { text: '"status"', why: 'A missing order has no status key: this prints False.' },
            { text: '"order_id"', why: 'The error result has no order_id key: this prints False.' },
          ],
          expectOutput: 'True',
          explain: 'Order Z9 does not exist.',
        },
        {
          id: 'e7-4-6',
          type: 'spot-bug',
          prompt: 'Which line makes the tool call fail?',
          code: `args = {"town": "Porto"}
name = "get_weather"
out = sim.call_tool(name, args)
assert "error" not in out, out`,
          error: 'AssertionError: {\'error\': "bad arguments: ...',
          answer: 0,
          raiseLine: 3,
          lineWhy: {
            '1': 'The tool name is right.',
            '2': 'Calling the tool is right; the arguments are not.',
            '3': 'The check is right: the call should succeed.',
          },
          explain: 'The schema asks for `city`, not `town`. Sent back as an error, the model can fix it.',
        },
        {
          id: 'e7-4-7',
          type: 'mcq',
          prompt: 'What should a tool error message contain?',
          options: [
            { text: 'What went wrong, briefly' },
            { text: 'The full stack trace', why: 'Long traces waste context and may leak internals.' },
            { text: 'Just the word "error"', why: 'The model cannot fix what it is not told.' },
          ],
          answer: 0,
          explain: 'Like "unknown city \'Paris\'": enough to act on.',
        },
        {
          id: 'e7-4-8',
          type: 'run-code',
          prompt: 'Set `failed` to True if `out` is an error result.',
          before: `args = {"expression": "x+1"}
name = "calculator"
out = sim.call_tool(name, args)`,
          solution: 'failed = "error" in out',
          tests: 'assert failed is True, f"letters are not allowed in the calculator; got {failed!r}"',
          placeholder: 'failed = ...',
          explain: 'This is the `is_error` flag `tool_turns` sets.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'e7-05',
      title: 'Step limits',
      summary: 'Cap the number of model calls; when the cap is hit, stop and say so. Stop early on repeated identical calls.',
      card: {
        title: 'Step limits',
        text: 'A model can loop, calling the same tool again and again or never deciding it is done. Cap the number of model calls with a step limit, and when it is hit, stop and say so rather than passing off a half-answer as final. Stopping as soon as the same call repeats saves the remaining steps.',
        code: `c = sim.FakeLLM([sim.tool_call(
    "calculator", expression="1+1")]
    * 9)
msgs = [{"role": "user",
         "content": "Add"}]
steps = 0
while steps < 3:
    steps += 1
    r = ask(c, msgs)
    if r.stop_reason != "tool_use":
        break
    msgs += tool_turns(r)
print(steps, r.stop_reason)`,
        output: '3 tool_use',
      },
      exercises: [
        {
          id: 'e7-5-1',
          type: 'mcq',
          prompt: 'An agent ran 40 model calls on a simple order lookup. Which limit was missing?',
          options: [
            { text: 'A limit on the number of steps' },
            { text: 'A limit on tokens per reply', why: '`max_tokens` caps one reply; it cannot stop the loop.' },
            { text: 'A timeout on each tool', why: 'The tools answered; the loop just never ended.' },
          ],
          answer: 0,
          explain: 'A step limit is the first guard every agent needs.',
        },
        {
          id: 'e7-5-2',
          type: 'predict-output',
          prompt: 'A limit of 5; the model needs two tools. What does this print?',
          code: `c = sim.FakeLLM([
    sim.tool_call("lookup_order",
                  order_id="A100"),
    sim.tool_call("lookup_order",
                  order_id="A101"),
    "One shipped, one processing."])
msgs = [{"role": "user",
         "content": "A100, A101?"}]
steps = 0
while steps < 5:
    steps += 1
    r = ask(c, msgs)
    if r.stop_reason != "tool_use":
        break
    msgs += tool_turns(r)
print(steps, r.stop_reason)`,
          answer: '3 end_turn',
          options: [
            { text: '3 end_turn' },
            { text: '5 end_turn', why: 'The loop breaks as soon as the model answers, on step 3.' },
            { text: '2 end_turn', why: 'The answer is the third call: two tool steps, then the answer.' },
          ],
          explain: 'A limit is a ceiling, not a target.',
        },
        {
          id: 'e7-5-3',
          type: 'predict-output',
          prompt: 'Has the agent repeated itself? What does this print?',
          code: `calls = [("lookup_order", "A100"),
         ("calculator", "2*3"),
         ("calculator", "2*3")]
print(calls[-1] == calls[-2])`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'The last two are the same tool with the same input.' },
          ],
          explain: 'The same call with the same input will give the same result: a loop.',
        },
        {
          id: 'e7-5-4',
          type: 'fill-blank',
          prompt: 'Allow at most `max_steps` model calls.',
          code: `c = sim.FakeLLM([sim.tool_call(
    "calculator", expression="1")]
    * 9)
msgs = [{"role": "user",
        "content": "?"}]
max_steps, steps = 3, 0
while steps ___ max_steps:
    steps += 1
    r = ask(c, msgs)
    if r.stop_reason != "tool_use":
        break
    msgs += tool_turns(r)
print(len(c.calls))`,
          answer: ['<'],
          distractors: [
            { text: '<=', why: 'That allows one call too many: 4.' },
            { text: '>', why: '0 > 3 is false, so the loop never runs.' },
          ],
          expectOutput: '3',
          explain: 'Count first, then check: exactly three calls.',
        },
        {
          id: 'e7-5-5',
          type: 'mcq',
          prompt: 'The step limit is hit. What should the agent return?',
          options: [
            { text: 'A clear "stopped" result' },
            { text: 'The last tool output as the answer', why: 'That passes off raw data as a finished answer.' },
            { text: 'An empty string', why: 'The caller cannot tell "stopped" from "said nothing".' },
          ],
          answer: 0,
          explain: 'The caller (or a person) can then decide: retry, raise the limit, or escalate.',
        },
        {
          id: 'e7-5-6',
          type: 'mcq',
          prompt: 'A loop starts `steps = 0` and runs `while steps < 3:`, yet it made 10 model calls. Why?',
          options: [
            { text: '`steps` is never increased' },
            { text: 'The model ignored the limit', why: 'The limit lives in your code; the model cannot see or skip it.' },
            { text: 'A limit of 3 is too low', why: 'A limit of 3 would allow 3 calls, not 10.' },
          ],
          answer: 0,
          explain: 'Count every model call, at the top of the loop.',
        },
        {
          id: 'e7-5-7',
          type: 'mcq',
          prompt: 'How do you choose the step limit?',
          options: [
            { text: 'From real runs, plus a margin' },
            { text: 'As high as possible, to be safe', why: 'A high limit only delays catching a loop, at full cost.' },
            { text: 'Always exactly one step', why: 'Then it is not an agent: it can never use a tool result.' },
          ],
          answer: 0,
          explain: 'Look at how many steps successful runs take, and set the limit a little above.',
        },
        {
          id: 'e7-5-8',
          type: 'run-code',
          prompt: 'Set `looping` to True if the last two calls are identical.',
          before: `calls = [("get_weather", "Porto"),
         ("get_weather", "Porto")]`,
          solution: 'looping = calls[-1] == calls[-2]',
          tests: 'assert looping is True, f"the same city twice in a row; got {looping!r}"',
          placeholder: 'looping = ...',
          explain: 'Stop early: the next step would repeat it again.',
        },
      ],
    },

    ...e7More,
  ],
  labs: e7Labs,
  library: e7Library,
};
