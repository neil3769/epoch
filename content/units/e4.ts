import { e4Labs } from '../labs/e4';
import { e4Library } from '../library/e4';
import type { Unit } from '../schema';

/*
 * E4 Prompts and context. Plan weeks 1 (prompt engineering guide) and 4
 * (effective context engineering). Advice follows the provider's prompting
 * best-practices page and its context-engineering article, read 2026-11-16.
 * Snippets build prompts in Python, so their output is checked by running them.
 */
export const e4: Unit = {
  id: 'E4',
  track: 'engineering',
  title: 'Prompts and context',
  blurb: 'Write clear instructions, show examples, structure long inputs with tags, and decide what belongs in the context window.',
  prelude: 'import epoch_sim as sim',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'e4-01',
      title: 'Clear and direct',
      summary: 'Write the prompt for a capable newcomer: the task, the reader, the format, and the reason for each rule.',
      card: {
        title: 'Clear and direct',
        text: 'Write the prompt for a capable new colleague who knows nothing about your project. Say the task, who the answer is for, the format you want, and why each rule exists. If that colleague would have to guess, so will the model.',
        code: `parts = [
    "Summarise this support ticket.",
    "Reader: the on-call engineer.",
    "Format: 3 bullet points.",
    "Why: they read it on a phone.",
]
prompt = "\\n".join(parts)
print(len(parts), "lines")`,
        output: '4 lines',
      },
      exercises: [
        {
          id: 'e4-1-1',
          type: 'mcq',
          prompt: 'Which prompt leaves the model least to guess?',
          options: [
            { text: 'Summarise this ticket in 3 bullets for the on-call engineer' },
            { text: 'Summarise this ticket as well as you possibly can', why: 'It says the task but not the reader or the format, so the model has to guess both.' },
            { text: 'Make this ticket shorter and easier for people', why: '"Shorter" and "easier" for whom, in what shape? The task, reader and format are all left open.' },
          ],
          answer: 0,
          explain: 'Task, reader and format, stated plainly.',
        },
        {
          id: 'e4-1-2',
          type: 'predict-output',
          prompt: 'Numbered steps help when order matters. What does this print?',
          code: `steps = ["Read the ticket",
         "Find the error code",
         "Suggest one fix"]
for i, s in enumerate(steps, 1):
    print(f"{i}. {s}")`,
          answer: '1. Read the ticket\n2. Find the error code\n3. Suggest one fix',
          options: [
            { text: '1. Read the ticket\n2. Find the error code\n3. Suggest one fix' },
            { text: '0. Read the ticket\n1. Find the error code\n2. Suggest one fix', why: '`enumerate(steps, 1)` starts counting at 1.' },
            { text: '1. Suggest one fix\n2. Find the error code\n3. Read the ticket', why: '`enumerate` keeps the list order.' },
          ],
          explain: 'A numbered list tells the model the order and that every step counts.',
        },
        {
          id: 'e4-1-3',
          type: 'mcq',
          prompt: 'The rule "NEVER use ellipses" is sometimes ignored. Which rewrite works better?',
          options: [
            { text: 'Replies are read aloud, so avoid ellipses' },
            { text: 'NEVER EVER use ellipses, this is critical', why: 'Shouting adds no information. Giving the reason lets the model apply the rule sensibly.' },
            { text: 'Repeat "no ellipses" three times in a row', why: 'Repetition is not a reason. The model generalises better from why the rule exists.' },
          ],
          answer: 0,
          explain: 'With the reason, the model can also avoid other things that read badly aloud.',
        },
        {
          id: 'e4-1-4',
          type: 'fill-blank',
          prompt: 'Put the word limit into the prompt.',
          code: `limit = 50
prompt = f"Reply in {___} words."
print(prompt)`,
          answer: ['limit'],
          distractors: [
            { text: '"limit"', why: 'With quotes it is the text "limit", so the prompt would say "Reply in limit words".' },
            { text: 'len', why: '`{len}` inserts the built-in function itself, not the number 50.' },
          ],
          expectOutput: 'Reply in 50 words.',
          explain: 'f-strings put variables into prompt templates.',
        },
        {
          id: 'e4-1-5',
          type: 'mcq',
          prompt: 'Which instruction is likely to work best?',
          options: [
            { text: 'Write in plain paragraphs' },
            { text: "Don't use markdown or bullet lists", why: 'Saying what not to do leaves the model to guess what to do instead. Say the format you want.' },
            { text: 'Avoid formatting where you can', why: '"Where you can" is vague. Name the format you want.' },
          ],
          answer: 0,
          explain: 'Tell the model what to do, not only what to avoid.',
        },
        {
          id: 'e4-1-6',
          type: 'predict-output',
          prompt: 'A quick check for missing parts. What does this print?',
          code: `prompt = "Summarise the ticket."
needed = ["Format:", "Reader:"]
missing = [n for n in needed
           if n not in prompt]
print(missing)`,
          answer: "['Format:', 'Reader:']",
          options: [
            { text: "['Format:', 'Reader:']" },
            { text: '[]', why: 'The prompt never mentions a format or a reader, so both are missing.' },
            { text: "['Reader:']", why: '"Format:" is not in the prompt either.' },
          ],
          explain: 'Prompts are text, so they can be checked by code like anything else.',
        },
        {
          id: 'e4-1-7',
          type: 'spot-bug',
          prompt: 'Which line forgets part of the template?',
          code: `t = "Ticket: {ticket}. Team: {team}."
prompt = t.format(ticket="T-1")
print(prompt)`,
          error: "KeyError: 'team'",
          answer: 1,
          lineWhy: {
            '0': 'The template is fine: it has two slots to fill.',
            '2': 'Never reached.',
          },
          explain: 'Every `{slot}` in a template needs a value: `t.format(ticket="T-1", team="billing")`.',
        },
        {
          id: 'e4-1-8',
          type: 'run-code',
          prompt: 'Set `prompt` to the lines joined with newlines.',
          before: `lines = ["Task: classify the ticket.",
         "Labels: bug, billing.",
         "Reply with one label."]`,
          solution: 'prompt = "\\n".join(lines)',
          tests: [
            'assert prompt.count("\\n") == 2, f"three lines need two newlines, got {prompt.count(chr(10))}"',
            'assert prompt.startswith("Task:") and prompt.endswith("one label."), "keep the lines in order"',
          ].join('\n'),
          placeholder: 'prompt = ...',
          explain: '`"\\n".join(lines)` puts one line under another.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'e4-02',
      title: 'Show examples',
      summary: 'Three to five varied examples, wrapped in tags, show the format and tone better than rules.',
      card: {
        title: 'Show examples',
        text: 'Examples are the most reliable way to show the format and tone you want. Give three to five that look like real inputs and differ from each other, so the model copies the pattern rather than one example\'s quirks. Wrap them in `<example>` tags so they are not mistaken for the real input.',
        code: `shots = [("Refund?", "billing"),
         ("Crash", "bug")]
for q, a in shots:
    s = f"{q} -> {a}"
    print(f"<example>{s}</example>")`,
        output: '<example>Refund? -> billing</example>\n<example>Crash -> bug</example>',
      },
      exercises: [
        {
          id: 'e4-2-1',
          type: 'predict-output',
          prompt: 'How many different labels do these examples show?',
          code: `shots = ["bug", "bug", "bug", "bug"]
print(len(set(shots)))`,
          answer: '1',
          options: [
            { text: '1' },
            { text: '4', why: '`set` keeps each label once, and all four are "bug".' },
          ],
          explain: 'Four examples, one label: the model may learn to answer "bug" every time.',
        },
        {
          id: 'e4-2-2',
          type: 'mcq',
          prompt: 'Why should examples differ from each other?',
          options: [
            { text: 'So it copies the pattern, not a quirk' },
            { text: 'So the prompt looks longer and more serious', why: 'Length is not the goal. Similar examples teach accidental habits (all short, all one label).' },
            { text: 'Because identical examples are not allowed', why: 'They are allowed, just less useful: the model picks up whatever they share.' },
          ],
          answer: 0,
          explain: 'If every example is short, the model learns "short"; if every one is positive, "positive".',
        },
        {
          id: 'e4-2-3',
          type: 'mcq',
          prompt: 'How many examples does the provider\'s prompting guide suggest?',
          options: [
            { text: 'About three to five' },
            { text: 'Exactly one, so it cannot copy', why: 'One example shows a single case; the model may copy its quirks. A few varied ones show the pattern.' },
            { text: 'Fifty or more', why: 'Every example costs tokens on every call, with diminishing returns. A few well-chosen ones do the job.' },
          ],
          answer: 0,
          explain: 'A handful of relevant, varied examples is the usual sweet spot.',
        },
        {
          id: 'e4-2-4',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `shots = [("hi", "greeting"),
         ("bye", "farewell")]
block = "\\n".join(
    f"{q} => {a}" for q, a in shots)
print(block)`,
          answer: 'hi => greeting\nbye => farewell',
          options: [
            { text: 'hi => greeting\nbye => farewell' },
            { text: 'hi => greeting bye => farewell', why: '`"\\n".join` puts each example on its own line.' },
            { text: 'hi greeting\nbye farewell', why: 'The f-string puts " => " between each question and answer.' },
          ],
          explain: 'Building the examples block in code keeps every example in exactly the same format.',
        },
        {
          id: 'e4-2-5',
          type: 'fill-blank',
          prompt: 'Close the example tag.',
          code: `s = "hi -> greeting"
print(f"<example>{s}</___>")`,
          answer: ['example'],
          distractors: [
            { text: 'examples', why: 'The closing tag must match the opening one exactly: `</example>`.' },
            { text: '/example', why: 'The slash is already there; this would give `<//example>`.' },
          ],
          expectOutput: '<example>hi -> greeting</example>',
          explain: 'Matching open and close tags mark exactly where the example starts and ends.',
        },
        {
          id: 'e4-2-6',
          type: 'spot-bug',
          prompt: 'This check fails. Which line causes the problem?',
          code: `golden = ["Refund?", "Crash"]
shots = ["Refund?", "Login"]
leak = set(golden) & set(shots)
assert not leak, f"leak: {leak}"`,
          error: "AssertionError: leak: {'Refund?'}",
          answer: 1,
          raiseLine: 3,
          lineWhy: {
            '0': 'The golden (test) set itself is fine.',
            '2': 'This finds the overlap; it is the check, not the cause.',
            '3': 'The assert is the alarm doing its job.',
          },
          explain: 'An example copied from the test set inflates every eval score (unit E5). Take examples from elsewhere.',
        },
        {
          id: 'e4-2-7',
          type: 'match-pairs',
          prompt: 'Match each problem with its fix.',
          pairs: [
            { left: 'All examples are one label', right: 'vary the labels', why: 'Otherwise the model leans towards that label.' },
            { left: 'Examples read as the input', right: 'wrap them in tags', why: 'Tags mark where examples end and the real input starts.' },
            { left: 'Examples taken from the test set', right: 'use a separate dev set', why: 'Test items in the prompt are leakage.' },
          ],
          explain: 'Good examples are varied, clearly marked, and never from the test set.',
        },
        {
          id: 'e4-2-8',
          type: 'run-code',
          prompt: 'Set `block` to one `<example>` line per pair, joined with newlines.',
          before: `shots = [("Refund?", "billing"),
         ("Crash", "bug")]
t = "<example>{} -> {}</example>"`,
          solution: 'block = "\\n".join(t.format(q, a)\n                  for q, a in shots)',
          tests: 'assert block == "<example>Refund? -> billing</example>\\n<example>Crash -> bug</example>", f"got {block!r}"',
          maxLines: 2,
          placeholder: 'block = ...',
          explain: 'Format each pair with the template, then join them with newlines.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'e4-03',
      title: 'Structure with tags',
      summary: 'Tags separate instructions, documents and input; long documents go first and the question last.',
      card: {
        title: 'Structure with tags',
        text: 'Tags keep the parts of a prompt apart, so instructions, documents, examples and the input each get their own. Put long documents at the top and the question at the end; the provider reports this helps most with long, many-document inputs. Then refer to the parts by name, as in "using the documents in <docs>".',
        code: `doc = "Refunds within 14 days."
q = "Refund after 10 days?"
prompt = (f"<doc>{doc}</doc>\\n"
          f"<q>{q}</q>")
print(prompt)`,
        output: '<doc>Refunds within 14 days.</doc>\n<q>Refund after 10 days?</q>',
      },
      exercises: [
        {
          id: 'e4-3-1',
          type: 'order-lines',
          prompt: 'Order the lines so the document comes first and the question last.',
          lines: [
            { text: 'prompt = ""' },
            { text: 'prompt += "<doc>14 days.</doc>\\n"' },
            { text: 'prompt += "<q>Refund?</q>"' },
            { text: 'print(prompt)' },
          ],
          expectOutput: '<doc>14 days.</doc>\n<q>Refund?</q>',
          explain: 'Start empty, add the document, then the question, then use the prompt.',
        },
        {
          id: 'e4-3-2',
          type: 'mcq',
          prompt: 'A 30-page policy and one question. Where does the question go?',
          options: [
            { text: 'At the end, after the policy' },
            { text: 'At the start, before the policy', why: 'The provider\'s guide puts long documents first and the question last, which it reports works better.' },
            { text: 'Repeated before every page', why: 'That bloats the prompt. Documents on top, question once at the end.' },
          ],
          answer: 0,
          explain: 'Documents first, question last: the model reads the material, then the task.',
        },
        {
          id: 'e4-3-3',
          type: 'predict-output',
          prompt: 'Tags help in replies too. What does this print?',
          code: `reply = "Sure. <answer>yes</answer>"
start = reply.index("<answer>") + 8
end = reply.index("</answer>")
print(reply[start:end])`,
          answer: 'yes',
          options: [
            { text: 'yes' },
            { text: 'Sure. yes', why: 'Slicing from just after `<answer>` to `</answer>` keeps only the tagged part.' },
            { text: '<answer>yes', why: 'The +8 skips past the 8 characters of "<answer>".' },
          ],
          explain: 'Asking for the answer inside tags makes it easy to pull out, whatever else the model writes.',
        },
        {
          id: 'e4-3-4',
          type: 'fill-blank',
          prompt: 'Wrap the document in matching tags.',
          code: `d = "hi"
print(f"<doc>{d}___")`,
          answer: ['</doc>'],
          distractors: [
            { text: '<doc>', why: 'That opens a second tag instead of closing the first.' },
            { text: '<doc/>', why: 'A self-closing tag is a separate empty element; it does not close `<doc>`.' },
          ],
          expectOutput: '<doc>hi</doc>',
          explain: 'Open with `<doc>`, close with `</doc>`.',
        },
        {
          id: 'e4-3-5',
          type: 'spot-bug',
          prompt: 'This check fails. Which line is wrong?',
          code: `p = "<doc>Refunds</doc><q>Why?<q>"
opens = p.count("<q>")
closes = p.count("</q>")
assert opens == closes, "unclosed <q>"`,
          error: 'AssertionError: unclosed <q>',
          answer: 0,
          raiseLine: 3,
          lineWhy: {
            '1': 'Counting opening tags is the check.',
            '2': 'Counting closing tags is the check.',
            '3': 'The assert is the alarm doing its job.',
          },
          explain: 'The question ends with `<q>` instead of `</q>`, so the tag never closes.',
        },
        {
          id: 'e4-3-6',
          type: 'mcq',
          prompt: 'Answers about a 40-page contract keep missing details. Which instruction helps most?',
          options: [
            { text: 'Quote the relevant passages first, then answer' },
            { text: 'Read the contract very carefully this time', why: 'An exhortation adds no structure. Asking for quotes first makes it find the relevant text.' },
            { text: 'Answer in fewer words to stay focused', why: 'Shorter answers do not help it find the details in a long document.' },
          ],
          answer: 0,
          explain: 'Quoting first (for example in `<quotes>` tags) helps the model focus on the parts that matter.',
        },
        {
          id: 'e4-3-7',
          type: 'predict-output',
          prompt: 'Documents with their source. What does this print?',
          code: `docs = {"policy.md": "14 days.",
        "faq.md": "Annual only."}
for name, text in docs.items():
    tag = f'<doc src="{name}">'
    print(tag + text + "</doc>")`,
          answer: '<doc src="policy.md">14 days.</doc>\n<doc src="faq.md">Annual only.</doc>',
          options: [
            { text: '<doc src="policy.md">14 days.</doc>\n<doc src="faq.md">Annual only.</doc>' },
            { text: '<doc src="name">14 days.</doc>\n<doc src="name">Annual only.</doc>', why: 'The f-string fills `{name}` with each file name.' },
            { text: '<doc src="faq.md">Annual only.</doc>\n<doc src="policy.md">14 days.</doc>', why: 'Dicts keep insertion order, so policy.md comes first.' },
          ],
          explain: 'A source on each document lets the model cite where an answer came from.',
        },
        {
          id: 'e4-3-8',
          type: 'run-code',
          prompt: 'Set `prompt` to the document in `<doc>` tags, a newline, then the question in `<q>` tags.',
          before: `doc = "Refunds within 14 days."
q = "Refund after 10 days?"`,
          solution: 'prompt = f"<doc>{doc}</doc>\\n"\nprompt += f"<q>{q}</q>"',
          tests: 'assert prompt == "<doc>Refunds within 14 days.</doc>\\n<q>Refund after 10 days?</q>", f"got {prompt!r}"',
          maxLines: 2,
          placeholder: 'prompt = ...',
          explain: 'Document first, question last, each in its own tag.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'e4-04',
      title: 'The system prompt',
      summary: 'The system prompt sets the role and lasting rules, pitched between rigid if-then rules and vague advice.',
      card: {
        title: 'The system prompt',
        text: 'The system prompt sets who the model is and the rules for every turn, and even one sentence of role helps. Aim between two failures: brittle if-this-then-that rules for every case, and vague advice that assumes context the model lacks. Start small, test it, and add instructions or examples only for failures you actually see.',
        code: `system = (
    "You answer billing questions "
    "for a notes app. Quote the "
    "policy you used. If the policy "
    "does not cover it, say so."
)
print(len(system.split()), "words")`,
        output: '22 words',
      },
      exercises: [
        {
          id: 'e4-4-1',
          type: 'mcq',
          prompt: 'Which system prompt is at the right altitude?',
          options: [
            { text: 'You answer billing questions from the policy and say when it does not cover them' },
            { text: 'If the user says "refund" reply A; if "cancel" reply B; if both, reply C; otherwise reply D', why: 'Hard-coded branches break on the first case nobody listed.' },
            { text: 'Be helpful and do a great job for the user, as you always would', why: 'Vague: it assumes the model knows the product, the policy and what "great" means here.' },
          ],
          answer: 0,
          explain: 'Specific about the job and its limits, without scripting every case.',
        },
        {
          id: 'e4-4-2',
          type: 'mcq',
          prompt: 'Your system prompt has grown to 40 edge-case rules, and replies are erratic. What do you try first?',
          options: [
            { text: 'Trim to the essentials and add a few examples' },
            { text: 'Add a 41st rule for the newest failure', why: 'A pile of rules is the problem. Fewer, clearer instructions plus examples usually work better.' },
            { text: 'Write every rule in capital letters', why: 'Emphasis does not fix conflicting or overlapping rules.' },
          ],
          answer: 0,
          explain: 'Minimal but complete; examples carry patterns that rules struggle to state.',
        },
        {
          id: 'e4-4-3',
          type: 'predict-output',
          prompt: 'Long prompts are often split over lines. What does this print?',
          code: `s = ("Answer briefly."
     "Quote the policy.")
print(s)`,
          answer: 'Answer briefly.Quote the policy.',
          options: [
            { text: 'Answer briefly.Quote the policy.' },
            { text: 'Answer briefly. Quote the policy.', why: 'Adjacent strings are joined exactly as written: no space is added between them.' },
            { text: 'Answer briefly.\nQuote the policy.', why: 'Splitting the code over two lines does not add a newline to the string.' },
          ],
          explain: 'End each piece with a space (or a "\\n") when you split a prompt across lines.',
        },
        {
          id: 'e4-4-4',
          type: 'spot-bug',
          prompt: 'The stand-in rejects this call. Which line is wrong?',
          code: `c = sim.FakeLLM()
c.messages.create(
    model="model-small",
    max_tokens=50,
    messages=[
        {"role": "system",
         "content": "Be brief."},
        {"role": "user",
         "content": "Hi"}])`,
          error: "APIStatusError: 400: unknown role 'system'",
          answer: 5,
          raiseLine: 1,
          lineWhy: {
            '0': 'Making the client is fine.',
            '1': 'Python points at the call, but the call is right; what it is given is wrong.',
            '2': 'A valid model.',
            '3': 'A fine limit.',
            '4': 'A list of messages is right.',
            '6': 'The text is fine; the role next to it is the problem.',
            '7': 'A user message is right.',
            '8': 'Its content is fine.',
          },
          explain: 'Pass the rules as `system="Be brief."`, the separate parameter the provider\'s docs recommend.',
        },
        {
          id: 'e4-4-5',
          type: 'fill-blank',
          prompt: 'Pass the rules the right way.',
          code: `c = sim.FakeLLM()
c.messages.create(
    model="model-small",
    max_tokens=50,
    ___="Be brief.",
    messages=[{"role": "user",
               "content": "Hi"}])
print(c.calls[0]["system"])`,
          answer: ['system'],
          distractors: [
            { text: 'role', why: '`role` belongs inside each message. As a call argument it is not the system prompt.' },
            { text: 'prompt', why: 'There is no `prompt` argument for this; the system prompt is `system=`.' },
          ],
          expectOutput: 'Be brief.',
          explain: '`system=` holds rules that apply to every turn.',
        },
        {
          id: 'e4-4-6',
          type: 'predict-output',
          prompt: 'A check that the system prompt has every section. What does this print?',
          code: `system = "<role>Billing helper</role>"
need = ["<role>", "<rules>"]
print([n for n in need
       if n not in system])`,
          answer: "['<rules>']",
          options: [
            { text: "['<rules>']" },
            { text: '[]', why: 'There is a role section but no `<rules>` section.' },
            { text: "['<role>']", why: '`<role>` is in the prompt; `<rules>` is the missing one.' },
          ],
          explain: 'Sections such as `<role>` and `<rules>` keep a growing system prompt organised.',
        },
        {
          id: 'e4-4-7',
          type: 'mcq',
          prompt: 'You are starting a new system prompt. What order of work does the context-engineering advice suggest?',
          options: [
            { text: 'Start minimal, test, then fix observed failures' },
            { text: 'Write every rule you can think of, then test', why: 'Rules for problems that never happen cost tokens and can conflict. Add them when a failure shows up.' },
            { text: 'Copy a long prompt from the internet unchanged', why: 'It was written for another task. Start from what yours needs and test it.' },
          ],
          answer: 0,
          explain: 'Each addition should answer a failure you have seen, ideally in your eval set.',
        },
        {
          id: 'e4-4-8',
          type: 'run-code',
          prompt: 'Set `system` to a one-sentence role that starts with "You are" and mentions billing.',
          before: '# one sentence, ending with "."',
          solution: 'system = "You are a billing bot."',
          tests: [
            'assert isinstance(system, str) and system.startswith("You are"), "start with \'You are\'"',
            'assert "billing" in system.lower(), "mention billing"',
            'assert system.count(".") == 1 and system.endswith("."), "one sentence, ending with a full stop"',
          ].join('\n'),
          placeholder: 'system = "You are ..."',
          explain: 'One clear sentence of role is a good start.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'e4-05',
      title: 'What belongs in the context',
      summary: 'Send the smallest set of high-signal tokens: the documents this question needs, within a budget.',
      card: {
        title: 'What belongs in the context',
        text: 'Every token you add competes for the model\'s attention, and recall gets worse as the context grows. Aim for the smallest set of high-signal tokens: the documents this question needs, not the whole knowledge base. Picking by relevance within a token budget is cheaper and usually more accurate.',
        code: `q = sim.embed("refund annual plan")
def score(d):
    e = d["embedding"]
    return sim.cosine(q, e)
best = max(sim.DOCS, key=score)
print(best["title"])`,
        output: 'Refund policy',
      },
      exercises: [
        {
          id: 'e4-5-1',
          type: 'predict-output',
          prompt: 'How big is the whole help centre, and its biggest page, in tokens?',
          code: `sizes = [sim.count_tokens(d["text"])
         for d in sim.DOCS]
print(sum(sizes), max(sizes))`,
          answer: '193 33',
          options: [
            { text: '193 33' },
            { text: '33 193', why: 'The sum (all seven pages) comes first, then the biggest single page.' },
            { text: '7 33', why: 'There are 7 pages, but the first number sums their tokens.' },
          ],
          explain: 'Tiny here; a real knowledge base is millions of tokens, so you must choose.',
        },
        {
          id: 'e4-5-2',
          type: 'mcq',
          prompt: 'Should you paste the whole 200-page manual into every prompt "just in case"?',
          options: [
            { text: 'No: send the parts this question needs' },
            { text: 'Yes: more context always helps it', why: 'Recall drops as context grows, and every extra token costs money and time.' },
            { text: 'Yes, as long as it fits the window', why: 'Fitting is not the same as helping. Irrelevant pages dilute the model\'s attention.' },
          ],
          answer: 0,
          explain: 'Relevant and small beats complete and huge.',
        },
        {
          id: 'e4-5-3',
          type: 'predict-output',
          prompt: 'The two pages closest to the question. What does this print?',
          code: `q = sim.embed("export my notes")
def score(d):
    e = d["embedding"]
    return sim.cosine(q, e)
top = sorted(sim.DOCS, key=score,
             reverse=True)[:2]
print([d["id"] for d in top])`,
          answer: "['d3', 'd5']",
          options: [
            { text: "['d3', 'd5']" },
            { text: "['d1', 'd2']", why: 'Those are the first two pages, not the two closest to the question.' },
            { text: "['d5', 'd3']", why: 'Sorted with `reverse=True`, the best match (d3, exporting) comes first.' },
          ],
          explain: 'Rank by similarity, keep the top few: the start of retrieval (unit E6).',
        },
        {
          id: 'e4-5-4',
          type: 'fill-blank',
          prompt: 'Add pages while they still fit the budget.',
          code: `sizes = [30, 25, 20, 10]
budget = 50
used = 0
for n in sizes:
    if used + n ___ budget:
        used += n
print(used)`,
          answer: ['<='],
          distractors: [
            { text: '<', why: 'With `<`, filling the budget exactly (30 + 20 = 50) is refused, so it stops at 40.' },
            { text: '>', why: 'That adds a page only when it overflows the budget: the opposite of the goal.' },
          ],
          expectOutput: '50',
          explain: '30 fits, 25 would overflow, 20 fits exactly, 10 would overflow: 50.',
        },
        {
          id: 'e4-5-5',
          type: 'mcq',
          prompt: 'Answers got worse after you added 30 "just in case" documents. Why?',
          options: [
            { text: 'Low-signal text dilutes the model\'s attention' },
            { text: 'The model refuses prompts over a set length', why: 'Nothing was refused; answers just got worse, which is the sign of diluted attention.' },
            { text: 'The documents made the reply too long', why: 'Input documents do not lengthen the reply; they compete for attention.' },
          ],
          answer: 0,
          explain: 'The provider calls this context rot: recall drops as tokens pile up.',
        },
        {
          id: 'e4-5-6',
          type: 'predict-output',
          prompt: 'A question the help centre does not cover. What does this print?',
          code: `q = sim.embed("capital of France")
embs = [d["embedding"]
        for d in sim.DOCS]
s = [sim.cosine(q, e) for e in embs]
print(max(s))`,
          answer: '0.0',
          options: [
            { text: '0.0' },
            { text: '1.0', why: 'No page shares any topic with the question, so every similarity is 0.' },
          ],
          explain: 'Nothing relevant: send no documents, and let the model say it does not know.',
        },
        {
          id: 'e4-5-7',
          type: 'match-pairs',
          prompt: 'What goes in the context for "Can I get a refund on my annual plan?"',
          pairs: [
            { left: 'The refund policy page', right: 'include it', why: 'It holds the answer.' },
            { left: 'The full product catalogue', right: 'leave it out', why: 'Nothing in it answers this question.' },
            { left: 'Last month\'s chat with this user', right: 'a short summary at most', why: 'Some history may matter; all of it is noise.' },
          ],
          explain: 'Each candidate earns its place by helping this answer.',
        },
        {
          id: 'e4-5-8',
          type: 'run-code',
          prompt: 'Set `best` to the title of the page closest to the question.',
          before: `q = sim.embed("share a notebook")
def score(d):
    e = d["embedding"]
    return sim.cosine(q, e)`,
          solution: 'd = max(sim.DOCS, key=score)\nbest = d["title"]',
          tests: 'assert best == "Sharing a notebook", f"the sharing page is closest, got {best!r}"',
          maxLines: 2,
          placeholder: 'best = ...',
          explain: '`max` with `key=score` finds the most similar page.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'e4-06',
      title: 'Long tasks',
      summary: 'Long chats and agent runs need compaction, notes kept outside the context, and just-in-time retrieval.',
      card: {
        title: 'Long tasks',
        text: 'Long chats and agent runs outgrow any context window, so you decide what stays. Compaction swaps old turns for a short summary, notes saved outside the context can be read back when needed, and documents can be fetched just in time instead of loaded up front. Keep what the next step needs and drop the rest, such as old tool results.',
        code: `turns = [f"t{i}" for i in range(1, 9)]
summary = "summary of t1-t6"
kept = [summary] + turns[-2:]
print(kept)`,
        output: "['summary of t1-t6', 't7', 't8']",
      },
      exercises: [
        {
          id: 'e4-6-1',
          type: 'predict-output',
          prompt: 'Twenty turns of 500 tokens, compacted to a 300-token summary plus the last four. What does this print?',
          code: `turn = [500] * 20
before = sum(turn)
after = 300 + sum(turn[-4:])
print(before, after)`,
          answer: '10000 2300',
          options: [
            { text: '10000 2300' },
            { text: '10000 2000', why: 'Add the 300-token summary to the 4 × 500 kept turns.' },
            { text: '10000 300', why: 'The last four turns are kept in full alongside the summary.' },
          ],
          explain: 'Over 75% fewer tokens, and the recent turns are untouched.',
        },
        {
          id: 'e4-6-2',
          type: 'mcq',
          prompt: 'The context is nearly full. What is the safest thing to drop first?',
          options: [
            { text: 'Old tool results already used' },
            { text: 'The system prompt, to save room', why: 'It holds the rules for every step and is small. Dropping it changes the model\'s behaviour.' },
            { text: 'The user\'s latest message', why: 'That is what the next step must answer.' },
          ],
          answer: 0,
          explain: 'A tool result that has been read and used rarely needs to stay word for word.',
        },
        {
          id: 'e4-6-3',
          type: 'predict-output',
          prompt: 'Notes live outside the context and are read back. What does this print?',
          code: `notes = {}
notes["goal"] = "fix login bug"
notes["done"] = ["found cause"]
context = f"Goal: {notes['goal']}"
print(context)`,
          answer: 'Goal: fix login bug',
          options: [
            { text: 'Goal: fix login bug' },
            { text: "Goal: ['found cause']", why: 'The f-string reads the "goal" key, not "done".' },
            { text: 'Goal: notes', why: '`{notes[\'goal\']}` is replaced by the value stored under "goal".' },
          ],
          explain: 'Only the note needed now goes back into the context.',
        },
        {
          id: 'e4-6-4',
          type: 'mcq',
          prompt: 'An agent works through a long coding task with clear milestones. Which technique fits best?',
          options: [
            { text: 'Notes it writes and rereads' },
            { text: 'One huge context, never trimmed', why: 'It will overflow, and recall drops long before that.' },
            { text: 'Restart from scratch at each milestone', why: 'That loses what was learned. Notes keep progress across resets.' },
          ],
          answer: 0,
          explain: 'A to-do list or notes file carries progress across steps and resets.',
        },
        {
          id: 'e4-6-5',
          type: 'fill-blank',
          prompt: 'Keep the two newest turns.',
          code: `turns = ["a", "b", "c", "d"]
print(turns[___:])`,
          answer: ['-2'],
          distractors: [
            { text: '1', why: '`turns[1:]` keeps everything from index 1: three turns, not the newest two.' },
            { text: '-1', why: '`[-1:]` keeps only the newest turn.' },
          ],
          expectOutput: "['c', 'd']",
          explain: '`[-2:]` always means the last two, however long the list.',
        },
        {
          id: 'e4-6-6',
          type: 'mcq',
          prompt: 'An agent must answer questions about a repository of 10,000 files. What do you put in its context?',
          options: [
            { text: 'Search tools; open files as needed' },
            { text: 'All 10,000 files, loaded up front', why: 'Far too many tokens, and most are irrelevant to any one question.' },
            { text: 'A random sample of 100 of the files', why: 'The right files are unlikely to be in a random sample.' },
          ],
          answer: 0,
          explain: 'Just-in-time retrieval: keep light references and load content when it is needed.',
        },
        {
          id: 'e4-6-7',
          type: 'order-lines',
          prompt: 'Compact the chat. Order the lines so it prints the summary and the two newest turns.',
          lines: [
            { text: 'turns = ["a", "b", "c", "d"]', fixed: true },
            { text: 'old = turns[:-2]' },
            { text: 'summary = "sum(" + ",".join(old) + ")"' },
            { text: 'turns = [summary] + turns[-2:]' },
            { text: 'print(turns)', fixed: true },
          ],
          expectOutput: "['sum(a,b)', 'c', 'd']",
          explain: 'Take the old turns, summarise them, then rebuild the list from the summary and the newest turns.',
        },
        {
          id: 'e4-6-8',
          type: 'run-code',
          prompt: 'Replace all but the last 2 turns with `summary`.',
          before: `turns = ["t1", "t2", "t3", "t4", "t5"]
summary = "summary of t1-t3"`,
          solution: 'turns = [summary] + turns[-2:]',
          tests: 'assert turns == ["summary of t1-t3", "t4", "t5"], f"got {turns}"',
          placeholder: 'turns = ...',
          explain: 'The summary first, then the newest turns.',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'e4-07',
      title: 'Checkpoint',
      checkpoint: true,
      summary: 'You can write a clear prompt with examples and tags, pitch a system prompt, and choose what goes in the context.',
      card: {
        title: 'Checkpoint',
        text: 'Everything from this unit, mixed together. For each one, ask: would a capable newcomer know exactly what to do with this, and is every token earning its place?',
      },
      exercises: [
        {
          id: 'e4-7-1',
          type: 'mcq',
          prompt: 'Which prompt is clearest?',
          options: [
            { text: 'Classify the email as bug, billing or other. Reply with the label only.' },
            { text: 'Look at this email and tell me what you think about what kind it is.', why: 'No list of labels and no format, so replies will vary.' },
            { text: 'Classify the email. Be accurate. Be very accurate. Accuracy matters.', why: 'Repetition adds no information; the labels and the format are still missing.' },
          ],
          answer: 0,
          explain: 'The task, the allowed answers and the format.',
        },
        {
          id: 'e4-7-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `shots = ["billing", "bug", "billing"]
print(sorted(set(shots)))`,
          answer: "['billing', 'bug']",
          options: [
            { text: "['billing', 'bug']" },
            { text: "['billing', 'bug', 'billing']", why: '`set` keeps each label once.' },
            { text: "['bug', 'billing']", why: '`sorted` puts them in alphabetical order: billing before bug.' },
          ],
          explain: 'Two of the three labels are covered; an "other" example is missing.',
        },
        {
          id: 'e4-7-3',
          type: 'fill-blank',
          prompt: 'Put the question last.',
          code: `doc = "<doc>14 days.</doc>"
q = "<q>Refund?</q>"
prompt = ___ + "\\n" + ___
print(prompt)`,
          answer: ['doc', 'q'],
          distractors: [{ text: 'prompt', why: '`prompt` does not exist yet on the right-hand side, so this raises a NameError.' }],
          expectOutput: '<doc>14 days.</doc>\n<q>Refund?</q>',
          explain: 'Document first, question last.',
        },
        {
          id: 'e4-7-4',
          type: 'mcq',
          prompt: 'Where do "always reply in British English" and the bot\'s role belong?',
          options: [
            { text: 'In the system prompt' },
            { text: 'In every user message', why: 'Repeating it in each turn wastes tokens; rules for every turn go in the system prompt.' },
            { text: 'In max_tokens', why: '`max_tokens` is a length cap, not an instruction.' },
          ],
          answer: 0,
          explain: 'Role and lasting rules go in `system=`.',
        },
        {
          id: 'e4-7-5',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `p = ("Use the docs."
     "Cite the source.")
print(len(p.split(".")))`,
          answer: '3',
          options: [
            { text: '3' },
            { text: '2', why: 'Splitting "Use the docs.Cite the source." on "." gives two sentences and an empty string after the last full stop.' },
          ],
          explain: 'The two pieces join with no space between them, a common bug in prompts split over lines.',
        },
        {
          id: 'e4-7-6',
          type: 'predict-output',
          prompt: 'Which page is closest? Type the id.',
          code: `q = sim.embed("can I use it offline")
def score(d):
    e = d["embedding"]
    return sim.cosine(q, e)
print(max(sim.DOCS, key=score)["id"])`,
          answer: 'd4',
          explain: 'The offline-mode page (d4) is the only one that shares the question\'s topic.',
        },
        {
          id: 'e4-7-7',
          type: 'mcq',
          prompt: 'An agent has run for 200 steps and its context is nearly full. What do you do?',
          options: [
            { text: 'Summarise old turns, drop used results' },
            { text: 'Delete the system prompt to make room', why: 'The system prompt is small and holds the rules for every step.' },
            { text: 'Keep going until the provider errors out', why: 'Recall degrades well before the window is full, and then the run fails.' },
          ],
          answer: 0,
          explain: 'Keep what the next step needs; summarise or drop the rest.',
        },
        {
          id: 'e4-7-8',
          type: 'spot-bug',
          prompt: 'Which line forgets a slot?',
          code: `t = "<doc>{doc}</doc>\\n<q>{q}</q>"
p = t.format(q="Refund?")
print(p)`,
          error: "KeyError: 'doc'",
          answer: 1,
          lineWhy: {
            '0': 'The template is fine: document first, question last.',
            '2': 'Never reached.',
          },
          explain: 'Fill every slot: `t.format(doc=doc, q="Refund?")`.',
        },
        {
          id: 'e4-7-9',
          type: 'match-pairs',
          prompt: 'Match each technique to when it helps.',
          pairs: [
            { left: 'examples in tags', right: 'showing format and tone', why: 'Examples are the most reliable way to steer format.' },
            { left: 'documents first, question last', right: 'long inputs', why: 'Reported to help most with long, many-document prompts.' },
            { left: 'compaction', right: 'chats near the window', why: 'Summarise old turns to make room.' },
            { left: 'just-in-time retrieval', right: 'huge knowledge bases', why: 'Load only what the question needs.' },
          ],
          explain: 'Each technique answers a specific problem.',
        },
        {
          id: 'e4-7-10',
          type: 'run-code',
          prompt: 'Finish `fits(used, n)`: True if adding a page of `n` tokens keeps the total within `budget`.',
          before: `budget = 60
def fits(used, n):`,
          solution: '    return used + n <= budget',
          tests: [
            'assert fits(30, 30) is True, "30 + 30 = 60 is exactly the budget: it fits"',
            'assert fits(56, 27) is False, "56 + 27 = 83 is over 60: it does not fit"',
            'kept, used = [], 0',
            'for pid, n in [("d2", 30), ("d7", 26), ("d3", 27)]:',
            '    if fits(used, n):',
            '        kept.append(pid)',
            '        used += n',
            'assert kept == ["d2", "d7"], f"with your fits, the pages kept should be d2 and d7, got {kept}"',
          ].join('\n'),
          placeholder: '    return ...',
          explain: 'Within budget means `used + n <= budget`. Indent the line: it is the body of `fits`.',
        },
      ],
    },
  ],
  labs: e4Labs,
  library: e4Library,
};
