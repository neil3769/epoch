import { e3Labs } from '../labs/e3';
import { e3Library } from '../library/e3';
import type { Unit } from '../schema';

/*
 * E3 Calling an LLM. Plan week 2 (the async LLM client: schemas, token and
 * cost logging). Snippets call `sim.FakeLLM`, a stand-in with the same shape
 * as the Anthropic Python SDK's `client.messages.create` (checked against the
 * Messages API docs on 2026-11-16). Prices are made up; the unit says so.
 */
export const e3: Unit = {
  id: 'E3',
  track: 'engineering',
  title: 'Calling an LLM',
  blurb: 'Messages and roles, tokens and the context window, cost, schema-valid output with Pydantic, tool calls, and logging latency.',
  prelude: 'import json\nimport epoch_sim as sim',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'e3-01',
      title: 'Messages and roles',
      summary: 'A call sends a list of role-and-content messages; rules for the whole chat go in the separate system parameter.',
      card: {
        title: 'Messages and roles',
        text: 'A chat API takes a list of messages, each a dict with a `role` and its `content`. The roles alternate: `user` is you, and `assistant` is the model\'s earlier replies. Instructions for the whole conversation go in a separate `system` parameter, not in the list.',
        code: `messages = [
    {"role": "user",
     "content": "Hi"},
    {"role": "assistant",
     "content": "Hello!"},
    {"role": "user",
     "content": "What is 2+2?"},
]
print([m["role"] for m in messages])`,
        output: "['user', 'assistant', 'user']",
      },
      exercises: [
        {
          id: 'e3-1-1',
          type: 'predict-output',
          prompt: 'The model replied, and you add its reply. What does this print?',
          code: `msgs = [{"role": "user",
         "content": "Hi"}]
reply = "Hello!"
msgs.append({"role": "assistant",
             "content": reply})
print([m["role"] for m in msgs])`,
          answer: "['user', 'assistant']",
          options: [
            { text: "['user', 'assistant']" },
            { text: "['user', 'user']", why: 'The appended message has role "assistant": it is the model\'s reply.' },
            { text: "['assistant', 'user']", why: '`append` adds to the end, so the reply comes after your message.' },
          ],
          explain: 'Each reply goes back into the list as an assistant message, so the next call sees the whole conversation.',
        },
        {
          id: 'e3-1-2',
          type: 'mcq',
          prompt: 'Every reply should be in French. Where does "Answer in French." go?',
          options: [
            { text: 'In the separate `system` parameter' },
            { text: 'In a message with role "system" in the list', why: 'In this API the system prompt is its own top-level parameter. The list holds the user and assistant turns.' },
            { text: 'In the last assistant message', why: 'Assistant messages are what the model said. Writing your rules there pretends the model said them.' },
          ],
          answer: 0,
          explain: '`system="Answer in French."` applies to the whole conversation.',
        },
        {
          id: 'e3-1-3',
          type: 'fill-blank',
          prompt: 'Build the message for your question.',
          code: `q = "Hi"
msg = {"role": ___, "content": q}
print(msg)`,
          answer: ['"user"'],
          distractors: [
            { text: '"assistant"', why: 'Assistant messages are the model\'s replies. Your question is a user message.' },
            { text: '"system"', why: 'System rules go in their own parameter, not in a message.' },
          ],
          expectOutput: "{'role': 'user', 'content': 'Hi'}",
          explain: 'What you send is always role "user".',
        },
        {
          id: 'e3-1-4',
          type: 'spot-bug',
          prompt: 'The call is rejected. Which line is wrong?',
          code: `client = sim.FakeLLM()
msgs = [{"role": "User",
         "content": "Hi"}]
client.messages.create(
    model="model-small",
    max_tokens=50,
    messages=msgs)`,
          error: "APIStatusError: 400: unknown role 'User'",
          answer: 1,
          raiseLine: 3,
          lineWhy: {
            '0': 'Making the client is fine.',
            '2': 'The content is fine; the problem is the role next to it.',
            '3': 'Python points at the call, but the call is right. It fails because of what is in `msgs`.',
            '4': 'A model name is required and this one is valid.',
            '5': '`max_tokens` is required and 50 is fine.',
            '6': 'Passing the list is right; its first message is the problem.',
          },
          explain: 'Roles are lower-case: "user". A 400 error means the request itself was malformed.',
        },
        {
          id: 'e3-1-5',
          type: 'mcq',
          prompt: 'Your second call sends only the new question, and the model has forgotten your name from the first turn. Why?',
          options: [
            { text: 'The API keeps no memory between calls' },
            { text: 'The model forgets names, for privacy reasons', why: 'It has no memory to forget from. Each call sees only what you send in it.' },
            { text: 'max_tokens was too low to keep the name', why: '`max_tokens` limits the reply length, not memory. The first turn was simply not sent.' },
          ],
          answer: 0,
          explain: 'Every call is independent; the conversation is whatever list you send.',
        },
        {
          id: 'e3-1-6',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `msgs = [{"role": "user",
         "content": "Hi"}]
msgs.append({"role": "assistant",
             "content": "Hey"})
msgs.append({"role": "user",
             "content": "Bye"})
print(len(msgs), msgs[1]["content"])`,
          answer: '3 Hey',
          options: [
            { text: '3 Hey' },
            { text: '3 Hi', why: 'Index 1 is the second message, the assistant\'s "Hey". Index 0 is "Hi".' },
            { text: '2 Hey', why: 'One message plus two appends makes three.' },
          ],
          explain: 'The list grows by one message per turn, alternating user and assistant.',
        },
        {
          id: 'e3-1-7',
          type: 'match-pairs',
          prompt: 'Match each part of a call to what it holds.',
          pairs: [
            { left: 'role "user"', right: 'what you send', why: 'Your questions and, later, tool results.' },
            { left: 'role "assistant"', right: "the model's past replies", why: 'You add these back so the next call sees them.' },
            { left: 'system parameter', right: 'rules for the whole chat', why: 'Set once per call, outside the message list.' },
          ],
          explain: 'Two roles in the list, and the system prompt beside it.',
        },
        {
          id: 'e3-1-8',
          type: 'run-code',
          prompt: "Add the model's reply to `msgs` as an assistant message.",
          before: `msgs = [{"role": "user",
         "content": "Hi"}]
reply = "Hello!"`,
          solution: 'msgs.append({"role": "assistant",\n             "content": reply})',
          tests: [
            'assert len(msgs) == 2, f"msgs should have 2 messages, has {len(msgs)}"',
            'assert msgs[-1] == {"role": "assistant", "content": "Hello!"}, f"last message should be the assistant reply, got {msgs[-1]}"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'msgs.append(...)',
          explain: 'A dict with role "assistant" and the reply as content.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'e3-02',
      title: 'The reply object',
      summary: 'A reply holds a list of content blocks, a stop_reason and a usage count; text blocks carry the words.',
      card: {
        title: 'The reply object',
        text: 'The reply is an object, not a string: `content` is a list of blocks, and a text block keeps the words in `.text`. `stop_reason` says why it stopped and `usage` counts the tokens. Here `sim.FakeLLM` stands in for the real client and has the same shape.',
        code: `client = sim.FakeLLM(["Paris."])
msg = client.messages.create(
    model="model-small",
    max_tokens=50,
    messages=[{"role": "user",
               "content": "City?"}])
print(msg.content[0].text)
print(msg.stop_reason)`,
        output: 'Paris.\nend_turn',
      },
      exercises: [
        {
          id: 'e3-2-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `client = sim.FakeLLM(["Rome."])
msg = client.messages.create(
    model="model-small",
    max_tokens=50,
    messages=[{"role": "user",
               "content": "City?"}])
print(type(msg.content).__name__)`,
          answer: 'list',
          options: [
            { text: 'list' },
            { text: 'str', why: '`content` is a list of blocks. The words are in a block\'s `.text`.' },
            { text: 'dict', why: 'It is a list, even when there is only one block in it.' },
          ],
          explain: 'A reply can hold several blocks: text, tool calls and more.',
        },
        {
          id: 'e3-2-2',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `client = sim.FakeLLM(["Hi there"])
msg = client.messages.create(
    model="model-small",
    max_tokens=50,
    messages=[{"role": "user",
               "content": "Hi"}])
for block in msg.content:
    if block.type == "text":
        print(block.text)`,
          answer: 'Hi there',
          explain: 'Looping over the blocks and keeping the text ones is the safe way to read a reply.',
        },
        {
          id: 'e3-2-3',
          type: 'predict-output',
          prompt: 'The model asks to use a tool instead of answering. What does this print?',
          code: `client = sim.FakeLLM([sim.tool_call(
    "get_weather", city="Porto")])
msg = client.messages.create(
    model="model-small",
    max_tokens=50,
    messages=[{"role": "user",
               "content": "Porto?"}])
print(msg.stop_reason)`,
          answer: 'tool_use',
          options: [
            { text: 'tool_use' },
            { text: 'end_turn', why: '"end_turn" means it finished its answer. Here it stopped to ask for a tool.' },
            { text: 'max_tokens', why: 'That means the reply was cut off by the length limit, which did not happen.' },
          ],
          explain: 'Check `stop_reason` before reading text: "tool_use" means the model is waiting for you to run a tool.',
        },
        {
          id: 'e3-2-4',
          type: 'spot-bug',
          prompt: 'Which line treats the reply as if it were a string?',
          code: `client = sim.FakeLLM(["YES"])
msg = client.messages.create(
    model="model-small",
    max_tokens=5,
    messages=[{"role": "user",
               "content": "Ok?"}])
print(msg.lower())`,
          error: "AttributeError: 'Message' object has no attribute 'lower'",
          answer: 6,
          lineWhy: {
            '0': 'The scripted client is fine.',
            '1': 'The call itself is right.',
            '2': 'A valid model name.',
            '3': 'A small limit is fine for a one-word answer.',
            '4': 'The message list is well formed.',
            '5': 'The content is fine.',
          },
          explain: 'Read the text first: `msg.content[0].text.lower()`.',
        },
        {
          id: 'e3-2-5',
          type: 'mcq',
          prompt: 'Why loop over `msg.content` instead of always reading `msg.content[0].text`?',
          options: [
            { text: 'The first block may be a tool call' },
            { text: 'Looping is faster than indexing into it', why: 'Speed is not the reason: a reply has a handful of blocks at most.' },
            { text: 'content[0] is always an empty block', why: 'It usually holds the answer. The problem is when it holds something other than text.' },
          ],
          answer: 0,
          explain: 'Blocks have a `type`; keep the "text" ones.',
        },
        {
          id: 'e3-2-6',
          type: 'fill-blank',
          prompt: "Read the reply's words.",
          code: `client = sim.FakeLLM(["Rome"])
msg = client.messages.create(
    model="model-small",
    max_tokens=5,
    messages=[{"role": "user",
               "content": "City?"}])
print(msg.___[0].___)`,
          answer: ['content', 'text'],
          distractors: [
            { text: 'usage', why: '`usage` holds the token counts, not the words, and cannot be indexed.' },
            { text: 'type', why: '`.type` gives the block\'s kind ("text"), not its words.' },
          ],
          expectOutput: 'Rome',
          explain: '`content` is the list of blocks; `.text` is the words in a text block.',
        },
        {
          id: 'e3-2-7',
          type: 'predict-output',
          prompt: 'The stand-in counts about 4 characters per token. What does this print?',
          code: `client = sim.FakeLLM(["Hello there!"])
msg = client.messages.create(
    model="model-small",
    max_tokens=50,
    messages=[{"role": "user",
               "content": "Hi"}])
print(msg.usage.output_tokens)`,
          answer: '3',
          options: [
            { text: '3' },
            { text: '12', why: 'That is the number of characters. Tokens are pieces of words, about 4 characters each here.' },
            { text: '2', why: '"Hello there!" is 12 characters: 12 / 4 = 3 tokens.' },
          ],
          explain: '`usage.output_tokens` counts the reply; real tokenizers split text differently, but the idea is the same.',
        },
        {
          id: 'e3-2-8',
          type: 'run-code',
          prompt: "Set `text` to the reply's words.",
          before: `client = sim.FakeLLM(["Lisbon."])
msg = client.messages.create(
    model="model-small",
    max_tokens=20,
    messages=[{"role": "user",
               "content": "City?"}])`,
          solution: 'text = msg.content[0].text',
          tests: 'assert text == "Lisbon.", f"text should be the words of the reply, got {text!r}"',
          placeholder: 'text = ...',
          explain: 'First block, then its `.text`.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'e3-03',
      title: 'Tokens and max_tokens',
      summary: 'Models count tokens, about four characters each in English; max_tokens caps the reply and cuts it off when hit.',
      card: {
        title: 'Tokens and max_tokens',
        text: 'Models read and write tokens, pieces of words; in English a token is roughly four characters. You pay for tokens and are limited by them, as `usage.input_tokens` and `usage.output_tokens` show. `max_tokens` caps the reply, and when it is hit `stop_reason` is "max_tokens" and the answer is cut off.',
        code: `text = "Hello, world!"
print(sim.count_tokens(text))`,
        output: '4',
      },
      exercises: [
        {
          id: 'e3-3-1',
          type: 'predict-output',
          prompt: 'At about 4 characters per token, type what this prints.',
          code: `text = "a" * 40
print(sim.count_tokens(text))`,
          answer: '10',
          typedWrong: [{ answer: '40', why: 'That is the character count. At 4 characters per token, 40 characters is 10 tokens.' }],
          explain: 'A quick estimate: characters divided by four.',
        },
        {
          id: 'e3-3-2',
          type: 'predict-output',
          prompt: 'A long reply with a small limit. What does this print?',
          code: `client = sim.FakeLLM(["word " * 50])
msg = client.messages.create(
    model="model-small",
    max_tokens=10,
    messages=[{"role": "user",
               "content": "Talk"}])
u = msg.usage
why = msg.stop_reason
print(why, u.output_tokens)`,
          answer: 'max_tokens 10',
          options: [
            { text: 'max_tokens 10' },
            { text: 'end_turn 63', why: 'The full reply would be about 63 tokens, but the limit is 10, so it was cut off there.' },
            { text: 'end_turn 10', why: 'Being cut off by the limit is reported as "max_tokens", not "end_turn".' },
          ],
          explain: 'The reply stops at the limit. Always check `stop_reason` before trusting the text is complete.',
        },
        {
          id: 'e3-3-3',
          type: 'mcq',
          prompt: 'Replies keep ending mid-sentence, and `stop_reason` is "max_tokens". What do you do?',
          options: [
            { text: 'Raise max_tokens or ask for less' },
            { text: 'Lower max_tokens so it finishes sooner', why: 'A lower cap cuts it off sooner. The cap is what is stopping it.' },
            { text: 'Retry until one finishes by chance', why: 'The cap is the same every time, so long answers keep being cut. Change the cap or the request.' },
          ],
          answer: 0,
          explain: 'The answer was longer than the cap allowed.',
        },
        {
          id: 'e3-3-4',
          type: 'predict-output',
          prompt: 'A long system prompt. What does this print?',
          code: `c = sim.FakeLLM()
m = c.messages.create(
    model="model-small",
    max_tokens=20,
    system="x" * 400,
    messages=[{"role": "user",
               "content": "Hi"}])
print(m.usage.input_tokens)`,
          answer: '101',
          options: [
            { text: '101' },
            { text: '1', why: 'The input is not just "Hi": the 400-character system prompt is sent too.' },
            { text: '400', why: 'That is characters, not tokens. About 403 characters is 101 tokens.' },
          ],
          explain: 'The system prompt counts as input tokens on every single call.',
        },
        {
          id: 'e3-3-5',
          type: 'fill-blank',
          prompt: 'Warn when the reply was cut off.',
          code: `client = sim.FakeLLM(["long " * 20])
msg = client.messages.create(
    model="model-small",
    max_tokens=5,
    messages=[{"role": "user",
               "content": "Talk"}])
if msg.stop_reason == ___:
    print("cut off")
else:
    print("complete")`,
          answer: ['"max_tokens"'],
          distractors: [
            { text: '"end_turn"', why: '"end_turn" means it finished on its own: the opposite case.' },
            { text: '"tool_use"', why: 'That means it wants a tool, not that it ran out of room.' },
          ],
          expectOutput: 'cut off',
          explain: 'Check for "max_tokens" and handle a cut-off answer instead of using it as if it were whole.',
        },
        {
          id: 'e3-3-6',
          type: 'mcq',
          prompt: 'Which are input tokens on every call in a long chat?',
          options: [
            { text: 'The system prompt and all past turns' },
            { text: 'Only the newest question you ask', why: 'You resend the whole conversation each time, so all of it is input again.' },
            { text: 'Only the previous reply and question', why: 'All earlier messages are resent, not just the last reply.' },
          ],
          answer: 0,
          explain: 'This is why long chats get slower and dearer turn by turn.',
        },
        {
          id: 'e3-3-7',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `text = "tokens are pieces!!!"
n = sim.count_tokens(text)
print(len(text) / n)`,
          answer: '4.0',
          options: [
            { text: '4.0' },
            { text: '5.0', why: '20 characters make 5 tokens here, so 20 / 5 = 4.0 characters per token.' },
            { text: '20', why: 'That is the length. Dividing by the 5 tokens gives 4.0.' },
          ],
          explain: 'The stand-in uses the rule of thumb exactly; real text averages near it.',
        },
        {
          id: 'e3-3-8',
          type: 'run-code',
          prompt: 'Set `cut` to True if the reply was cut off by the limit.',
          before: `client = sim.FakeLLM(["word " * 30])
msg = client.messages.create(
    model="model-small",
    max_tokens=5,
    messages=[{"role": "user",
               "content": "Talk"}])`,
          solution: 'cut = msg.stop_reason == "max_tokens"',
          tests: 'assert cut is True, f"the reply hit max_tokens, so cut should be True, got {cut!r}"',
          placeholder: 'cut = ...',
          explain: 'Compare `stop_reason` with "max_tokens".',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'e3-04',
      title: 'The context window',
      summary: 'The whole conversation is resent each call and must fit the context window; trim the oldest turns, keep the system prompt.',
      card: {
        title: 'The context window',
        text: 'The API remembers nothing between calls, so you resend the whole conversation every time. Each turn adds tokens, and the total must fit in the model\'s context window. When a chat grows too long, drop or summarise the oldest turns and keep the system prompt.',
        code: `history = []
for q in ["Hi", "And then?", "Why?"]:
    history.append(q)
    sent = len("".join(history))
    print(len(history), sent)`,
        output: '1 2\n2 11\n3 15',
      },
      exercises: [
        {
          id: 'e3-4-1',
          type: 'predict-output',
          prompt: 'Each turn adds 100 tokens, and every call resends all turns so far. Over three calls, how many input tokens are sent? Type it.',
          code: `turn = 100
sent = 0
for n in range(1, 4):
    sent += n * turn
print(sent)`,
          answer: '600',
          typedWrong: [{ answer: '300', why: 'That counts each turn once. But call 2 resends turn 1, and call 3 resends turns 1 and 2: 100 + 200 + 300.' }],
          explain: 'Total input grows faster than the chat: long conversations get expensive.',
        },
        {
          id: 'e3-4-2',
          type: 'predict-output',
          prompt: 'Keep the last three turns. What does this print?',
          code: `history = ["a", "b", "c", "d", "e"]
keep = history[-3:]
print(keep)`,
          answer: "['c', 'd', 'e']",
          options: [
            { text: "['c', 'd', 'e']" },
            { text: "['a', 'b', 'c']", why: '`[-3:]` takes from the end. `[:3]` would take the first three.' },
            { text: "['d', 'e']", why: '`[-3:]` starts three from the end, so it keeps three items.' },
          ],
          explain: 'Dropping the oldest turns keeps the recent context, which usually matters most.',
        },
        {
          id: 'e3-4-3',
          type: 'fill-blank',
          prompt: 'Drop the oldest turn until the chat fits in the window.',
          code: `window = 10
turns = [4, 3, 5, 2]
while sum(turns) > window:
    turns.___(0)
print(turns)`,
          answer: ['pop'],
          distractors: [
            { text: 'remove', why: '`remove(0)` looks for the value 0, which is not in the list, so it raises a ValueError.' },
            { text: 'insert', why: '`insert` adds an item, and needs two arguments.' },
            { text: 'index', why: '`index(0)` searches for the value 0 and changes nothing.' },
          ],
          expectOutput: '[3, 5, 2]',
          explain: '`pop(0)` removes the first (oldest) item; 14 tokens drop to 10, which fits.',
        },
        {
          id: 'e3-4-4',
          type: 'predict-output',
          prompt: 'The system prompt is kept separately. What does this print?',
          code: `system = "Be brief."
turns = ["t1", "t2", "t3", "t4"]
turns = turns[-2:]
print(system, turns)`,
          answer: "Be brief. ['t3', 't4']",
          options: [
            { text: "Be brief. ['t3', 't4']" },
            { text: "['t3', 't4']", why: 'The system prompt is a separate variable, so trimming turns does not touch it.' },
            { text: "Be brief. ['t1', 't2']", why: '`[-2:]` keeps the newest two turns.' },
          ],
          explain: 'Trim the conversation, never the rules: the system prompt stays on every call.',
        },
        {
          id: 'e3-4-5',
          type: 'mcq',
          prompt: 'A support chat is about to overflow the context window. What do you do?',
          options: [
            { text: 'Drop or summarise the oldest turns' },
            { text: 'Drop the system prompt first, to save room', why: 'The system prompt holds the rules for every reply. It is usually small and should stay.' },
            { text: 'Raise max_tokens to give it more room', why: '`max_tokens` limits the reply. The input is what overflows, and it makes room for neither.' },
          ],
          answer: 0,
          explain: 'Old turns matter least; a summary can keep their key facts in a few tokens.',
        },
        {
          id: 'e3-4-6',
          type: 'mcq',
          prompt: 'Every call in a long chat feels slower and costs more than the last. Why?',
          options: [
            { text: 'Each call resends the growing history' },
            { text: 'The model slows down as it gets tired', why: 'Models do not tire. The input simply grows with every turn.' },
            { text: 'Replies get longer and longer over time', why: 'Reply length need not change; the resent history is what grows.' },
          ],
          answer: 0,
          explain: 'Input tokens add cost and latency on every call.',
        },
        {
          id: 'e3-4-7',
          type: 'predict-output',
          prompt: 'A chat of three questions and three replies. What does this print?',
          code: `msgs = []
for q in ["a", "b", "c"]:
    msgs.append({"role": "user",
                 "content": q})
    msgs.append({"role": "assistant",
                 "content": "ok"})
print(len(msgs))`,
          answer: '6',
          options: [
            { text: '6' },
            { text: '3', why: 'Each turn adds two messages: your question and the reply.' },
            { text: '4', why: 'Three loops, two appends each: six messages.' },
          ],
          explain: 'This whole list is what the next call has to send.',
        },
        {
          id: 'e3-4-8',
          type: 'run-code',
          prompt: 'Keep only the last 4 messages in `msgs`.',
          before: 'msgs = ["m1", "m2", "m3",\n        "m4", "m5", "m6"]',
          solution: 'msgs = msgs[-4:]',
          tests: 'assert msgs == ["m3", "m4", "m5", "m6"], f"keep the newest four, got {msgs}"',
          placeholder: 'msgs = ...',
          explain: '`[-4:]` keeps the four newest.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'e3-05',
      title: 'The cost of a call',
      summary: 'Cost is input tokens times the input price plus output tokens times the output price, both per million.',
      card: {
        title: 'The cost of a call',
        text: 'Prices are quoted per million tokens, and output usually costs several times more than input. A call costs its input tokens times the input price, plus its output tokens times the output price, divided by a million. The prices here are made up for practice; real ones are on your provider\'s pricing page.',
        code: `price_in, price_out = 3.0, 15.0
tin, tout = 2000, 500
cost = (tin * price_in
        + tout * price_out) / 1e6
print(cost)`,
        output: '0.0135',
      },
      exercises: [
        {
          id: 'e3-5-1',
          type: 'predict-output',
          prompt: 'A million input tokens at 0.25 per million. What does this print?',
          code: `print(1_000_000 * 0.25 / 1e6)`,
          answer: '0.25',
          options: [
            { text: '0.25' },
            { text: '250000.0', why: 'Prices are per million tokens, so divide by a million.' },
            { text: '0.00025', why: 'That would be the price of a thousand tokens. A million tokens costs the full 0.25.' },
          ],
          explain: '"0.25 per million" means a million tokens costs 0.25.',
        },
        {
          id: 'e3-5-2',
          type: 'predict-output',
          prompt: 'The stand-in prices for model-small. What does this print?',
          code: `pin, pout = sim.PRICES["model-small"]
tin, tout = 4000, 800
print((tin * pin + tout * pout) / 1e6)`,
          answer: '0.002',
          options: [
            { text: '0.002' },
            { text: '0.0012', why: 'Input is 4000 × 0.25 = 1000 and output 800 × 1.25 = 1000: 2000 per million.' },
            { text: '2000.0', why: 'Divide by a million: prices are per million tokens.' },
          ],
          explain: 'Input and output each cost 0.001 here, despite very different token counts.',
        },
        {
          id: 'e3-5-3',
          type: 'mcq',
          prompt: 'Input costs 3 and output 15 per million tokens. Which saves more?',
          options: [
            { text: 'A reply 1,000 tokens shorter' },
            { text: 'A prompt 1,000 tokens shorter', why: 'Input is the cheaper side here: 1,000 input tokens cost a fifth of 1,000 output tokens.' },
            { text: 'Both save the same', why: 'The prices differ: output tokens cost five times more here.' },
          ],
          answer: 0,
          explain: 'Output is usually the dearer side, so asking for shorter answers pays off.',
        },
        {
          id: 'e3-5-4',
          type: 'fill-blank',
          prompt: 'Finish the cost formula.',
          code: `pin, pout = 3.0, 15.0
tin, tout = 1000, 200
cost = (tin * pin + tout * ___) / ___
print(cost)`,
          answer: ['pout', '1e6'],
          distractors: [
            { text: 'pin', why: 'Output tokens are charged at the output price.' },
            { text: '1000', why: 'Prices are per million tokens, so divide by 1e6, not a thousand.' },
          ],
          expectOutput: '0.006',
          explain: '1000 × 3 + 200 × 15 = 6000 per million, which is 0.006.',
        },
        {
          id: 'e3-5-5',
          type: 'predict-output',
          prompt: 'A call costs 0.002 and runs 10,000 times a day. Type the daily cost.',
          code: `print(round(10_000 * 0.002, 2))`,
          answer: '20.0',
          typedWrong: [{ answer: '20', why: 'Multiplying by a float gives a float, so `round` returns 20.0.' }],
          explain: 'Tiny per-call costs add up: always multiply by real traffic.',
        },
        {
          id: 'e3-5-6',
          type: 'spot-bug',
          prompt: 'Which line breaks the cost lookup?',
          code: `model = "model-smal"
tin, tout = 500, 100
pin, pout = sim.PRICES[model]
print((tin * pin + tout * pout) / 1e6)`,
          error: "KeyError: 'model-smal'",
          answer: 0,
          raiseLine: 2,
          lineWhy: {
            '1': 'Token counts are fine.',
            '2': 'Python points here, but the lookup is right. It fails because the name it is given is misspelt.',
            '3': 'The formula is right and is never reached.',
          },
          explain: 'A typo in the model name. Keeping prices in one table keyed by model catches it loudly.',
        },
        {
          id: 'e3-5-7',
          type: 'predict-output',
          prompt: 'Read the token counts from a reply. What does this print?',
          code: `c = sim.FakeLLM(["x" * 400])
m = c.messages.create(
    model="model-large",
    max_tokens=500,
    messages=[{"role": "user",
               "content": "y" * 39}])
u = m.usage
print(u.input_tokens, u.output_tokens)`,
          answer: '10 100',
          options: [
            { text: '10 100' },
            { text: '39 400', why: 'Those are character counts. At about 4 characters per token: 10 in, 100 out.' },
            { text: '100 10', why: 'Input is your short message (10 tokens); output is the long reply (100).' },
          ],
          explain: 'Every reply reports its own usage: the numbers you need for cost.',
        },
        {
          id: 'e3-5-8',
          type: 'run-code',
          prompt: 'Set `cost` for this call from `u` and the prices.',
          before: `pin, pout = sim.PRICES["model-large"]
c = sim.FakeLLM(["x" * 400])
m = c.messages.create(
    model="model-large",
    max_tokens=500,
    messages=[{"role": "user",
               "content": "y" * 39}])
tin = m.usage.input_tokens
tout = m.usage.output_tokens`,
          solution: 'cost = (tin * pin + tout * pout) / 1e6',
          tests: 'assert abs(cost - (10 * 3.0 + 100 * 15.0) / 1e6) < 1e-12, f"10 in at 3.0 and 100 out at 15.0 per million: 0.00153, got {cost}"',
          placeholder: 'cost = ...',
          explain: 'Input tokens at the input price plus output tokens at the output price, per million.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'e3-06',
      title: 'Schema-valid output',
      summary: 'A Pydantic model is the schema: model_validate_json turns JSON text into a typed object or raises ValidationError.',
      card: {
        title: 'Schema-valid output',
        text: 'When code will use a reply, ask for JSON and check it against a schema before trusting it. A Pydantic model is that schema: `model_validate_json` turns the text into a typed object or raises a `ValidationError`. Providers also offer a structured-output mode that enforces a schema, and validating stays the safety net.',
        code: `from pydantic import BaseModel

class Refund(BaseModel):
    allowed: bool
    days: int

r = Refund.model_validate_json(
    '{"allowed": true, "days": 14}')
print(r.days + 1)`,
        output: '15',
      },
      exercises: [
        {
          id: 'e3-6-1',
          type: 'predict-output',
          prompt: 'The model wrote the number as text. What does this print?',
          code: `from pydantic import BaseModel

class Refund(BaseModel):
    allowed: bool
    days: int

r = Refund.model_validate_json(
    '{"allowed": true, "days": "14"}')
print(r.days, type(r.days).__name__)`,
          answer: '14 int',
          options: [
            { text: '14 int' },
            { text: '14 str', why: 'The field is declared `int`, and Pydantic converts the text "14" into the number 14.' },
            { text: 'error', why: '"14" is clearly a number, so by default Pydantic converts it rather than rejecting it.' },
          ],
          explain: 'You get the declared types, whatever the JSON looked like, as long as it converts cleanly.',
        },
        {
          id: 'e3-6-2',
          type: 'predict-output',
          prompt: 'Now the model wrote words. What does this print?',
          code: `from pydantic import BaseModel
from pydantic import ValidationError

class Refund(BaseModel):
    days: int

text = '{"days": "two weeks"}'
try:
    Refund.model_validate_json(text)
    print("valid")
except ValidationError:
    print("invalid")`,
          answer: 'invalid',
          options: [
            { text: 'invalid' },
            { text: 'valid', why: '"two weeks" cannot become an int, so validation fails.' },
          ],
          explain: 'Bad data stops here, before your code uses it.',
        },
        {
          id: 'e3-6-3',
          type: 'predict-output',
          prompt: 'A field is missing. Type what this prints.',
          code: `from pydantic import BaseModel
from pydantic import ValidationError

class Refund(BaseModel):
    allowed: bool
    days: int

text = '{"allowed": true}'
try:
    Refund.model_validate_json(text)
except ValidationError as e:
    print(e.errors()[0]["type"])`,
          answer: 'missing',
          explain: '`e.errors()` lists each problem with its type and location: here, "days" is missing.',
        },
        {
          id: 'e3-6-4',
          type: 'fill-blank',
          prompt: 'Declare the field so `r.days + 1` works.',
          code: `from pydantic import BaseModel

class Refund(BaseModel):
    days: ___

r = Refund.model_validate_json(
    '{"days": 14}')
print(r.days + 1)`,
          answer: ['int'],
          distractors: [
            { text: 'str', why: 'As a string, `r.days + 1` would raise a TypeError (text plus a number).' },
            { text: 'bool', why: '14 is not a valid boolean, so validation fails.' },
          ],
          expectOutput: '15',
          explain: 'The type you declare is the type your code gets.',
        },
        {
          id: 'e3-6-5',
          type: 'mcq',
          prompt: 'Why validate with a Pydantic model instead of only `json.loads`?',
          options: [
            { text: 'json.loads checks syntax, not the fields' },
            { text: "json.loads cannot read a model's JSON", why: 'It reads it fine. It just accepts any JSON, with any keys and types.' },
            { text: 'Pydantic makes the model reply faster', why: 'Validation runs after the reply arrives and does not change the model.' },
          ],
          answer: 0,
          explain: '`{"days": "soon"}` is valid JSON, but not a valid Refund.',
        },
        {
          id: 'e3-6-6',
          type: 'spot-bug',
          prompt: 'Which line reads the field the wrong way?',
          code: `from pydantic import BaseModel

class Refund(BaseModel):
    days: int

r = Refund.model_validate_json(
    '{"days": 14}')
print(r["days"])`,
          error: "TypeError: 'Refund' object is not subscriptable",
          answer: 7,
          lineWhy: {
            '0': 'The import is right.',
            '2': 'Defining the model is right.',
            '3': 'An int field is what we want.',
            '5': 'Validating the text is right.',
            '6': 'The JSON is valid.',
          },
          explain: 'A model is an object: use `r.days`. `r.model_dump()` gives a dict if you need one.',
        },
        {
          id: 'e3-6-7',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `from pydantic import BaseModel

class Refund(BaseModel):
    allowed: bool
    days: int

r = Refund(allowed=True, days=14)
print(r.model_dump())`,
          answer: "{'allowed': True, 'days': 14}",
          options: [
            { text: "{'allowed': True, 'days': 14}" },
            { text: '{"allowed": true, "days": 14}', why: '`model_dump` gives a Python dict (True, single quotes). `model_dump_json` would give JSON text.' },
            { text: 'Refund(allowed=True, days=14)', why: 'That is how the object itself prints. `model_dump()` turns it into a dict.' },
          ],
          explain: '`model_dump()` for a dict, `model_dump_json()` for JSON text.',
        },
        {
          id: 'e3-6-8',
          type: 'run-code',
          prompt: 'Set `r` to `text` validated as a Refund.',
          before: `from pydantic import BaseModel

class Refund(BaseModel):
    allowed: bool
    days: int

text = '{"allowed": false, "days": 0}'`,
          solution: 'r = Refund.model_validate_json(text)',
          tests: [
            'assert isinstance(r, Refund), f"r should be a Refund, got {type(r).__name__}"',
            'assert r.allowed is False and r.days == 0, f"r should hold allowed=False, days=0, got {r}"',
          ].join('\n'),
          placeholder: 'r = ...',
          explain: '`Refund.model_validate_json(text)` parses and checks in one step.',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'e3-07',
      title: 'Repairing bad output',
      summary: 'On a ValidationError, send the error back and ask again, a few times at most, then fail cleanly.',
      card: {
        title: 'Repairing bad output',
        text: 'However clear the prompt, models sometimes reply with broken JSON or a wrong field. Catch the `ValidationError`, send its message back as a new user turn, and ask again, a few times at most. After that, give up cleanly and log it rather than pass bad data on.',
        code: `from pydantic import BaseModel
from pydantic import ValidationError

class Wait(BaseModel):
    days: int

parse = Wait.model_validate_json
for text in ['{"days": "two"}',
             '{"days": 2}']:
    try:
        print("ok", parse(text).days)
    except ValidationError:
        print("retry")`,
        output: 'retry\nok 2',
      },
      exercises: [
        {
          id: 'e3-7-1',
          type: 'predict-output',
          prompt: 'The first reply is bad, the second good. What does this print?',
          code: `from pydantic import BaseModel
from pydantic import ValidationError

class Wait(BaseModel):
    days: int

parse = Wait.model_validate_json
replies = ["nope", '{"days": 3}']
tries = 0
for text in replies:
    tries += 1
    try:
        w = parse(text)
        break
    except ValidationError:
        pass
print(tries, w.days)`,
          answer: '2 3',
          options: [
            { text: '2 3' },
            { text: '1 3', why: '"nope" is not JSON, so the first try fails and a second is needed.' },
            { text: '2 nope', why: '`w` is only set by a successful parse, which gives days = 3.' },
          ],
          explain: 'The loop stops at the first reply that validates.',
        },
        {
          id: 'e3-7-2',
          type: 'predict-output',
          prompt: 'Every reply is bad. What does this print?',
          code: `from pydantic import BaseModel
from pydantic import ValidationError

class Wait(BaseModel):
    days: int

parse = Wait.model_validate_json
result = None
for text in ["x", "y", "z"]:
    try:
        result = parse(text)
        break
    except ValidationError:
        pass
print(result)`,
          answer: 'None',
          options: [
            { text: 'None' },
            { text: 'z', why: 'A failed parse never assigns `result`, so it stays None.' },
            { text: 'error', why: 'Every ValidationError is caught, so the loop ends quietly.' },
          ],
          explain: 'After the last try, None says clearly that it failed. The caller must handle it.',
        },
        {
          id: 'e3-7-3',
          type: 'mcq',
          prompt: 'Validation failed. What should the next request include?',
          options: [
            { text: 'The bad reply and the validation error' },
            { text: 'The same question again, unchanged', why: 'Without being told what was wrong, the model is likely to repeat the mistake.' },
            { text: 'Nothing: accept the reply as it is', why: 'It failed validation, so your code cannot safely use it.' },
          ],
          answer: 0,
          explain: 'Add the bad reply as an assistant turn and the error as a user turn asking for a fix.',
        },
        {
          id: 'e3-7-4',
          type: 'fill-blank',
          prompt: 'Catch the right error.',
          code: `from pydantic import BaseModel
from pydantic import ValidationError

class Wait(BaseModel):
    days: int

try:
    Wait.model_validate_json('{}')
except ___:
    print("invalid")`,
          answer: ['ValidationError'],
          distractors: [
            { text: 'KeyError', why: 'Pydantic reports a missing field as a ValidationError, not a KeyError, so this would not catch it.' },
            { text: 'ZeroDivisionError', why: 'Nothing is divided here; this would not catch the validation failure.' },
          ],
          expectOutput: 'invalid',
          explain: 'Pydantic raises one exception type for every kind of invalid input.',
        },
        {
          id: 'e3-7-5',
          type: 'predict-output',
          prompt: 'Where did it go wrong? What does this print?',
          code: `from pydantic import BaseModel
from pydantic import ValidationError

class Wait(BaseModel):
    days: int

try:
    Wait.model_validate_json(
        '{"days": "soon"}')
except ValidationError as e:
    print(e.errors()[0]["loc"])`,
          answer: "('days',)",
          options: [
            { text: "('days',)" },
            { text: "'soon'", why: '"loc" is where the problem is (which field), not the bad value.' },
            { text: '0', why: '"loc" names the field, as a tuple: ("days",).' },
          ],
          explain: 'The location tells you (and the model) which field to fix.',
        },
        {
          id: 'e3-7-6',
          type: 'mcq',
          prompt: 'Three tries have all failed validation. What should the code do?',
          options: [
            { text: 'Return a clear failure and log it' },
            { text: 'Use the last reply anyway, as is', why: 'It failed validation, so passing it on spreads bad data.' },
            { text: 'Keep retrying until it finally works', why: 'Unbounded retries can loop forever and keep costing money.' },
          ],
          answer: 0,
          explain: 'Bounded retries, then an explicit failure the caller can handle.',
        },
        {
          id: 'e3-7-7',
          type: 'spot-bug',
          prompt: 'The data is already a dict, not JSON text. Which line should change?',
          code: `from pydantic import BaseModel

class Wait(BaseModel):
    days: int

data = {"days": 2}
w = Wait.model_validate_json(data)
print(w.days)`,
          error: 'ValidationError: 1 validation error for Wait...',
          answer: 6,
          lineWhy: {
            '0': 'The import is right.',
            '2': 'The model is defined correctly.',
            '3': 'An int field is right.',
            '5': 'A dict is a fine way to hold data; the next line just reads it the wrong way.',
            '7': 'Never reached.',
          },
          explain: '`model_validate_json` takes JSON text. For a dict, use `Wait.model_validate(data)`.',
        },
        {
          id: 'e3-7-8',
          type: 'run-code',
          prompt: 'Add `fix` to `msgs` as a user message, so the model sees what to correct.',
          before: `msgs = []
err = "days: Input should be an int"
fix = "Fix: " + err`,
          solution: 'msgs.append({"role": "user",\n             "content": fix})',
          tests: [
            'assert len(msgs) == 1, f"add one message, got {len(msgs)}"',
            'm = msgs[0]',
            'assert m.get("role") == "user", f"the role should be user, got {m.get(\'role\')!r}"',
            'assert m.get("content") == fix, "the content should be the fix request"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'msgs.append(...)',
          explain: 'The error goes back as a user turn, so the model can see exactly what to fix.',
        },
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      id: 'e3-08',
      title: 'Tool calls',
      summary: 'The model asks for a tool with a tool_use block; your code runs it and sends a tool_result back.',
      card: {
        title: 'Tool calls',
        text: 'You describe tools to the model by name, description and a JSON schema for their input. When it wants one, it stops with `stop_reason` "tool_use" and a `tool_use` block holding the tool\'s `name` and `input`, and your code runs the tool. You then send the result back in a `tool_result` block, and the model writes its answer.',
        code: `c = sim.FakeLLM([sim.tool_call(
    "get_weather", city="Porto")])
m = c.messages.create(
    model="model-small",
    max_tokens=100,
    tools=sim.tool_specs(),
    messages=[{"role": "user",
               "content": "Porto?"}])
b = m.content[0]
print(m.stop_reason, b.name, b.input)`,
        output: "tool_use get_weather {'city': 'Porto'}",
      },
      exercises: [
        {
          id: 'e3-8-1',
          type: 'predict-output',
          prompt: 'Your code runs the tool the model asked for. Type what this prints.',
          code: `c = sim.FakeLLM([sim.tool_call(
    "get_weather", city="Porto")])
m = c.messages.create(
    model="model-small",
    max_tokens=100,
    tools=sim.tool_specs(),
    messages=[{"role": "user",
               "content": "Porto?"}])
b = m.content[0]
r = sim.call_tool(b.name, b.input)
print(r["sky"])`,
          answer: 'rain',
          explain: 'The model chose the tool and its input; your code ran it and got real data.',
        },
        {
          id: 'e3-8-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `spec = sim.TOOLS["calculator"]
schema = spec["input_schema"]
print(schema["required"])`,
          answer: "['expression']",
          options: [
            { text: "['expression']" },
            { text: "['calculator']", why: 'That is the tool\'s name. `required` lists the input fields the model must fill.' },
            { text: '[]', why: 'The calculator needs an expression to work, so it is required.' },
          ],
          explain: 'The input schema tells the model exactly which arguments to provide.',
        },
        {
          id: 'e3-8-3',
          type: 'mcq',
          prompt: 'Who runs a tool you define, such as get_weather?',
          options: [
            { text: 'Your code, then it sends the result back' },
            { text: "The model itself, on the provider's servers", why: 'For tools you define, the model only asks. It cannot reach your functions or data.' },
            { text: 'Nobody: the model makes up a likely result', why: 'The model waits for the tool_result you send. If it guessed, there would be no point in tools.' },
          ],
          answer: 0,
          explain: 'The model decides what to call; your code does the calling.',
        },
        {
          id: 'e3-8-4',
          type: 'fill-blank',
          prompt: 'Send the tool result back.',
          code: `msg = {"role": "user",
       "content": [{
           "type": ___,
           "tool_use_id": "toolu_001",
           "content": "15C, rain"}]}
print(msg["content"][0]["type"])`,
          answer: ['"tool_result"'],
          distractors: [
            { text: '"tool_use"', why: '"tool_use" is the block the model sends to ask. Your answer to it is a "tool_result".' },
            { text: '"text"', why: 'A text block carries no `tool_use_id`, so the model could not link the result to its request.' },
          ],
          expectOutput: 'tool_result',
          explain: 'A user message with a tool_result block, linked by `tool_use_id` to the model\'s request.',
        },
        {
          id: 'e3-8-5',
          type: 'predict-output',
          prompt: 'A tool request, then an answer. What does this print?',
          code: `c = sim.FakeLLM([
    sim.tool_call("calculator",
                  expression="6*7"),
    "It is 42."])
msgs = [{"role": "user",
         "content": "6*7?"}]
for _ in range(2):
    m = c.messages.create(
        model="model-small",
        max_tokens=50, messages=msgs)
    print(m.stop_reason)`,
          answer: 'tool_use\nend_turn',
          options: [
            { text: 'tool_use\nend_turn' },
            { text: 'end_turn\nend_turn', why: 'The first reply is a tool request, which stops with "tool_use".' },
            { text: 'tool_use\ntool_use', why: 'The second reply is the text answer, which ends with "end_turn".' },
          ],
          explain: 'A tool call takes (at least) two calls: one to ask for the tool, one to answer with its result.',
        },
        {
          id: 'e3-8-6',
          type: 'spot-bug',
          prompt: 'Which line passes the input the wrong way?',
          code: `c = sim.FakeLLM([sim.tool_call(
    "get_weather", city="Porto")])
m = c.messages.create(
    model="model-small",
    max_tokens=100,
    messages=[{"role": "user",
               "content": "Porto?"}])
b = m.content[0]
r = sim.call_tool(b.name, **b.input)`,
          error: "TypeError: call_tool() got an unexpected keyword argument 'city'",
          answer: 8,
          lineWhy: {
            '0': 'Scripting a tool call is fine.',
            '1': 'The tool name and input are valid.',
            '2': 'The call is right.',
            '3': 'A valid model.',
            '4': 'Enough tokens for a tool request.',
            '5': 'The message list is well formed.',
            '6': 'The content is fine.',
            '7': 'The first block is the tool_use block.',
          },
          explain: '`call_tool` takes the input as one dict: `sim.call_tool(b.name, b.input)`.',
        },
        {
          id: 'e3-8-7',
          type: 'mcq',
          prompt: 'The model asked lookup_order for an id that does not exist, and the tool returned an error. What do you send back?',
          options: [
            { text: 'The error, as the tool_result' },
            { text: 'Nothing: stop the conversation', why: 'The model is waiting for a result. Sending the error lets it tell the user, or try another id.' },
            { text: 'A made-up order status', why: 'Inventing data is exactly what tools are meant to prevent.' },
          ],
          answer: 0,
          explain: 'Errors are results too; the model can recover from them.',
        },
        {
          id: 'e3-8-8',
          type: 'run-code',
          prompt: 'Set `r` by running the tool the model asked for.',
          before: `c = sim.FakeLLM([sim.tool_call(
    "get_weather", city="Porto")])
m = c.messages.create(
    model="model-small",
    max_tokens=100,
    messages=[{"role": "user",
               "content": "Porto?"}])
b = m.content[0]`,
          solution: 'r = sim.call_tool(b.name, b.input)',
          tests: 'assert r == {"city": "Porto", "temp_c": 15, "sky": "rain"}, f"run get_weather for Porto, got {r}"',
          placeholder: 'r = ...',
          explain: 'The block carries both the tool name and its input.',
        },
      ],
    },

    // ------------------------------------------------------------------ 9
    {
      id: 'e3-09',
      title: 'Latency and p95',
      summary: 'Log every call, and read latency as percentiles: p50 is the typical call, p95 the slow tail.',
      card: {
        title: 'Latency and p95',
        text: 'Log every call: the model, its tokens, its cost and how long it took. Latency is uneven, so report percentiles: p50 is the typical call, and p95 is the slow tail that one call in twenty hits. An average hides that tail, but users feel it.',
        code: `lat = sorted([320, 410, 380, 2900,
              350, 400, 390, 360,
              370, 340])
p50 = lat[len(lat) // 2]
p95 = lat[int(0.95 * len(lat))]
print(p50, p95)`,
        output: '380 2900',
      },
      exercises: [
        {
          id: 'e3-9-1',
          type: 'predict-output',
          prompt: 'The same ten latencies, as an average. What does this print?',
          code: `lat = [320, 410, 380, 2900, 350,
       400, 390, 360, 370, 340]
print(sum(lat) / len(lat))`,
          answer: '622.0',
          options: [
            { text: '622.0' },
            { text: '380.0', why: 'That is the median (p50). The one slow 2900 ms call pulls the average up.' },
            { text: '2900.0', why: 'That is the slowest call. The average spreads it over all ten.' },
          ],
          explain: 'The average (622) describes no real call: most were near 380, one was 2900.',
        },
        {
          id: 'e3-9-2',
          type: 'predict-output',
          prompt: 'Time a call on the virtual clock. What does this print?',
          code: `c = sim.FakeLLM(["ok"], latency=0.8)
t0 = sim.clock.time()
c.messages.create(
    model="model-small",
    max_tokens=5,
    messages=[{"role": "user",
               "content": "Hi"}])
print(round(sim.clock.time() - t0, 2))`,
          answer: '0.8',
          options: [
            { text: '0.8' },
            { text: '0.0', why: 'The call takes time; the clock is read before and after it.' },
            { text: '1.6', why: 'One call with 0.8 s latency moves the clock on by 0.8.' },
          ],
          explain: 'Read the clock before and after the call. Real code uses `time.perf_counter()`.',
        },
        {
          id: 'e3-9-3',
          type: 'fill-blank',
          prompt: 'Pick the p95 latency.',
          code: `lat = sorted(range(100, 2100, 100))
p95 = lat[int(___ * len(lat))]
print(p95)`,
          answer: ['0.95'],
          distractors: [
            { text: '0.5', why: '0.5 gives the middle value: p50, not p95.' },
            { text: '95', why: '95 × 20 is far past the end of the list, so it raises an IndexError.' },
          ],
          expectOutput: '2000',
          explain: '95% of the way along the sorted list: the value only 1 call in 20 exceeds.',
        },
        {
          id: 'e3-9-4',
          type: 'mcq',
          prompt: 'p50 is 400 ms and p95 is 3 s. What do users experience?',
          options: [
            { text: 'Most are quick; 1 call in 20 is slow' },
            { text: 'Every call takes about 3 seconds', why: 'Half the calls take 400 ms or less. Only the slowest 5% take 3 s or more.' },
            { text: 'Calls take 1.7 seconds on average', why: 'Percentiles are not an average of p50 and p95; that number describes no call.' },
          ],
          answer: 0,
          explain: 'A heavy user making 20 calls will almost certainly hit the slow tail.',
        },
        {
          id: 'e3-9-5',
          type: 'predict-output',
          prompt: 'Total cost from a log. What does this print?',
          code: `log = [(0.002, 410), (0.003, 380),
       (0.004, 2900)]
total = sum(c for c, ms in log)
print(round(total, 4))`,
          answer: '0.009',
          options: [
            { text: '0.009' },
            { text: '3690', why: 'That adds the latencies. Each record is (cost, ms), and this sums the first item.' },
            { text: '0.004', why: 'That is the dearest call. The sum covers all three.' },
          ],
          explain: 'With every call logged, cost per request and per day is a sum away.',
        },
        {
          id: 'e3-9-6',
          type: 'predict-output',
          prompt: 'The stand-in request log. What does this print?',
          code: `bad = [r for r in sim.LOGS
       if not r["ok"]]
print(len(sim.LOGS), len(bad))`,
          answer: '40 2',
          options: [
            { text: '40 2' },
            { text: '40 38', why: '`bad` keeps the records where ok is False: only 2 of them failed.' },
            { text: '2 40', why: 'The first number is the whole log (40), the second the failures (2).' },
          ],
          explain: 'Log failures too: an error rate belongs next to latency and cost.',
        },
        {
          id: 'e3-9-7',
          type: 'order-lines',
          prompt: 'Time a 1.5-second step on the virtual clock. Order the lines so it prints 1.5.',
          lines: [
            { text: 't0 = sim.clock.time()' },
            { text: 'sim.clock.advance(1.5)' },
            { text: 't1 = sim.clock.time()' },
            { text: 'print(t1 - t0)' },
          ],
          expectOutput: '1.5',
          explain: 'Start time, the work, end time, then the difference.',
        },
        {
          id: 'e3-9-8',
          type: 'run-code',
          prompt: 'Set `p95` for these 20 latencies.',
          before: `lat = sorted([
    200, 210, 190, 205, 220, 215,
    198, 230, 240, 185, 202, 212,
    225, 195, 208, 218, 199, 1500,
    260, 900])`,
          solution: 'p95 = lat[int(0.95 * len(lat))]',
          tests: 'assert p95 == 1500, f"95% along 20 sorted values is index 19: 1500, got {p95}"',
          placeholder: 'p95 = ...',
          explain: 'Sort, then take the value 95% of the way along.',
        },
      ],
    },

    // ----------------------------------------------------------------- 10
    {
      id: 'e3-10',
      title: 'Checkpoint',
      checkpoint: true,
      summary: 'You can build a call, read its reply and usage, price it, validate its output, handle a tool call and read a p95.',
      card: {
        title: 'Checkpoint',
        text: 'Everything from this unit, mixed together. For each one, ask: what is actually sent, what comes back, and what can go wrong with it?',
      },
      exercises: [
        {
          id: 'e3-10-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `c = sim.FakeLLM(["Hi!"])
m = c.messages.create(
    model="model-small",
    max_tokens=10,
    messages=[{"role": "user",
               "content": "Hello"}])
t = m.content[0].text
print(t, m.stop_reason)`,
          answer: 'Hi! end_turn',
          options: [
            { text: 'Hi! end_turn' },
            { text: 'Hi! max_tokens', why: '"Hi!" is one token, far under the limit of 10, so it finished normally.' },
            { text: 'Hello end_turn', why: '"Hello" is what you sent. The reply text is "Hi!".' },
          ],
          explain: 'Text from the first block, and why the model stopped.',
        },
        {
          id: 'e3-10-2',
          type: 'mcq',
          prompt: 'You want every reply to be under 50 words. Where does that rule go?',
          options: [
            { text: 'In the system parameter' },
            { text: 'In max_tokens=50', why: '`max_tokens` cuts the reply off mid-sentence. It is a hard cap, not an instruction to be brief.' },
            { text: 'In the first assistant message', why: 'Assistant messages are the model\'s own past replies, not rules for it.' },
          ],
          answer: 0,
          explain: 'Ask for brevity in the system prompt; keep max_tokens as a safety cap above it.',
        },
        {
          id: 'e3-10-3',
          type: 'predict-output',
          prompt: 'Type the cost of this call.',
          code: `pin, pout = 2.0, 10.0
tin, tout = 3000, 600
print((tin * pin + tout * pout) / 1e6)`,
          answer: '0.012',
          typedWrong: [{ answer: '12000.0', why: 'Divide by a million: prices are per million tokens.' }],
          explain: '6000 + 6000 = 12000 per million, so 0.012.',
        },
        {
          id: 'e3-10-4',
          type: 'fill-blank',
          prompt: 'Validate the reply as a Refund.',
          code: `from pydantic import BaseModel

class Refund(BaseModel):
    days: int

text = '{"days": 30}'
r = Refund.___(text)
print(r.days)`,
          answer: ['model_validate_json'],
          distractors: [
            { text: 'model_validate', why: '`model_validate` expects a dict. For JSON text, use `model_validate_json`.' },
            { text: 'model_dump', why: '`model_dump` turns a model into a dict; it does not parse anything.' },
          ],
          expectOutput: '30',
          explain: 'Text in, typed object out (or a ValidationError).',
        },
        {
          id: 'e3-10-5',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `c = sim.FakeLLM([sim.tool_call(
    "lookup_order", order_id="A102")])
m = c.messages.create(
    model="model-small",
    max_tokens=50,
    messages=[{"role": "user",
               "content": "A102?"}])
b = m.content[0]
r = sim.call_tool(b.name, b.input)
print(m.stop_reason, r["status"])`,
          answer: 'tool_use delivered',
          options: [
            { text: 'tool_use delivered' },
            { text: 'end_turn delivered', why: 'The reply is a tool request, so it stopped with "tool_use".' },
            { text: 'tool_use A102', why: '"A102" is the id the model passed in. The tool returned its status: delivered.' },
          ],
          explain: 'The model asked, your code looked it up.',
        },
        {
          id: 'e3-10-6',
          type: 'mcq',
          prompt: 'A chat app slows down and costs more the longer each conversation runs. What is the first fix?',
          options: [
            { text: 'Trim or summarise old turns' },
            { text: 'Lower max_tokens', why: 'The growth is in the resent input, not the reply length.' },
            { text: 'Remove the system prompt', why: 'It is small and holds the rules; the growing history is the cost.' },
          ],
          answer: 0,
          explain: 'Every call resends the history; keep it bounded.',
        },
        {
          id: 'e3-10-7',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `lat = sorted([100] * 18 + [900, 5000])
p50 = lat[len(lat) // 2]
p95 = lat[int(0.95 * len(lat))]
print(p50, p95)`,
          answer: '100 5000',
          options: [
            { text: '100 5000' },
            { text: '100 900', why: 'Index int(0.95 × 20) = 19 is the last value: 5000.' },
            { text: '550 5000', why: 'p50 is the middle of the sorted list, which is 100: most calls are fast.' },
          ],
          explain: 'Typical call 100 ms; the slow tail is 50 times worse.',
        },
        {
          id: 'e3-10-8',
          type: 'spot-bug',
          prompt: 'Which line ignores that the model asked for a tool?',
          code: `c = sim.FakeLLM([sim.tool_call(
    "calculator", expression="2+2")])
m = c.messages.create(
    model="model-small",
    max_tokens=50,
    messages=[{"role": "user",
               "content": "2+2?"}])
print(m.content[0].text)`,
          error: "AttributeError: 'ToolUseBlock' object has no attribute 'text'",
          answer: 7,
          lineWhy: {
            '0': 'Scripting a tool request is fine.',
            '1': 'The tool and its input are valid.',
            '2': 'The call is right.',
            '3': 'A valid model.',
            '4': 'Enough tokens.',
            '5': 'The message list is fine.',
            '6': 'The content is fine.',
          },
          explain: 'Check `m.stop_reason` (or each block\'s `type`) first: this block is a tool request, not text.',
        },
        {
          id: 'e3-10-9',
          type: 'match-pairs',
          prompt: 'Match each problem to the fix.',
          pairs: [
            { left: 'stop_reason is "max_tokens"', right: 'raise the cap or ask for less', why: 'The reply was cut off at the limit.' },
            { left: 'ValidationError on the reply', right: 'send the error back and retry', why: 'A bounded repair loop.' },
            { left: 'stop_reason is "tool_use"', right: 'run the tool, send a tool_result', why: 'The model is waiting for the result.' },
            { left: 'Calls slower as chats grow', right: 'trim old turns', why: 'The resent history keeps growing.' },
          ],
          explain: 'Each reply tells you what to do next, if you read it.',
        },
        {
          id: 'e3-10-10',
          type: 'run-code',
          prompt: 'Set `text` to the words of the reply, joining all its text blocks.',
          before: `c = sim.FakeLLM(["Lisbon is lovely."])
m = c.messages.create(
    model="model-small",
    max_tokens=20,
    messages=[{"role": "user",
               "content": "Lisbon?"}])
blocks = m.content`,
          solution: 'text = "".join(b.text for b in blocks\n               if b.type == "text")',
          tests: 'assert text == "Lisbon is lovely.", f"text should be the reply\'s words, got {text!r}"',
          maxLines: 2,
          placeholder: 'text = ...',
          explain: 'Keep the text blocks and join their words.',
        },
      ],
    },
  ],
  labs: e3Labs,
  library: e3Library,
};
