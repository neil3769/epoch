import type { LibraryPage } from '../schema';

/** Unit E7 summary page: unlocked in the Library when the unit is finished. */
export const e7Library: LibraryPage = {
  unit: 'E7',
  ideas: [
    {
      title: 'Workflow or agent',
      text: 'In a workflow your code fixes the steps (chaining, routing, parallel calls). In an agent the model picks the next step in a loop until it decides it is done. Use the simplest level that works: one call, then a call with retrieval, then a workflow, and an agent only when the steps cannot be known in advance. Chained steps compound errors (0.95 to the 20th is 0.36) and every step costs a call.',
    },
    {
      title: 'The loop',
      text: 'Call the model with the tool specs. If `stop_reason` is "tool_use", append its reply as an assistant turn, run every requested tool, and append one user turn holding a tool_result per request (matched by `tool_use_id`). Repeat until it answers. Failed tools go back as results with `is_error` so the model can recover.',
    },
    {
      title: 'Limits',
      text: 'Cap the number of model calls, stop on a repeated identical call, add up each call\'s cost and stop past a budget, and time the run. When a limit stops the run, return a clear "stopped" result with the reason and the cost, never a half-answer that looks final.',
    },
    {
      title: 'Tools and MCP',
      text: 'The model sees only a tool\'s name, description and input schema: write them like documentation, one job per tool, the least power needed, small results. MCP is a standard for getting tools (model-controlled), resources (app-controlled) and prompts (user-controlled) from a separate server, over JSON-RPC 2.0 (`tools/list`, `tools/call`) via stdio or HTTP.',
    },
    {
      title: 'Prompt injection',
      text: 'Anything the agent reads can carry instructions, and the model cannot reliably tell them from yours. Treat tool output as data, give tools least privilege, have a person approve risky or irreversible actions, and use filters only as tripwires.',
    },
  ],
  rules: [
    'Simplest first: call, retrieval, workflow, then agent.',
    'Results follow their request, matched by tool_use_id.',
    'All results for one reply go in one user turn.',
    'Tool failures go back as is_error results.',
    'Step limit, repeat check, spend budget, timeout.',
    'A stopped run says it stopped, and why.',
    'One job per tool; least privilege; small results.',
    'Risky actions need a person\'s approval.',
  ],
  example: {
    code: [
      'c = sim.FakeLLM([',
      '    sim.tool_call("get_weather",',
      '                  city="Paris"),',
      '    sim.tool_call("get_weather",',
      '                  city="Lisbon"),',
      '    "19C in Lisbon."])',
      'msgs = [{"role": "user",',
      '         "content": "Warm city?"}]',
      'steps = 0',
      'while steps < 5:',
      '    steps += 1',
      '    r = ask(c, msgs)',
      '    if r.stop_reason != "tool_use":',
      '        break',
      '    msgs += tool_turns(r)',
      'print(steps, r.content[0].text)',
    ].join('\n'),
    output: '3 19C in Lisbon.',
    notes: [
      '`ask` calls the model with the tool specs; `tool_turns` returns the assistant turn and the results turn.',
      'Paris is unknown, so its result goes back with `is_error`; the model then tries Lisbon.',
      'The step limit (5) is a ceiling: the run finishes on step 3.',
    ],
  },
  mistakes: [
    { mistake: 'Building an agent for a task with fixed steps.', fix: 'Write the steps as a workflow; it is cheaper and predictable.' },
    { mistake: 'Appending only the tool result.', fix: 'Append the assistant turn with the request first.' },
    { mistake: 'Letting a tool exception crash the loop.', fix: 'Catch it and send it back as an is_error result.' },
    { mistake: 'No step limit, or a counter that never increases.', fix: 'Count every model call at the top of the loop.' },
    { mistake: 'Only counting steps.', fix: 'Add a spend budget and a timeout: one long call can cost more than many.' },
    { mistake: 'Trusting text in tool results or third-party MCP servers.', fix: 'Treat it as data; limit tools; require approval for risky actions.' },
  ],
  forReal:
    'Here the model is scripted, so you never see a real model choose badly. For the plan\'s weeks 5 to 7, build this loop against the real API with two or three of your own tools, log every step (tool, input, error, tokens, cost), set limits, and try to break it: feed it a page with an injected instruction and check that your guards hold. Then expose one tool through a small MCP server and connect it from an MCP client.',
};
