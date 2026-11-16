import type { LibraryPage } from '../schema';

/** Unit E4 summary page: unlocked in the Library when the unit is finished. */
export const e4Library: LibraryPage = {
  unit: 'E4',
  ideas: [
    {
      title: 'Write for a capable newcomer',
      text: 'State the task, who the answer is for, the format, and the reason behind each rule; numbered steps when order matters. Say what to do rather than only what to avoid. If a colleague with no context would have to guess, the model will too.',
    },
    {
      title: 'Show, with a few varied examples',
      text: 'Three to five examples that look like real inputs and differ from each other set format and tone better than rules. Wrap them in tags, and never take them from your test set.',
    },
    {
      title: 'Structure long prompts with tags',
      text: 'Separate instructions, documents, examples and input with consistent tags, each document with an id or source. Put long documents first and the question last; for long documents, ask for the relevant quotes before the answer. Tags in the reply (such as `<answer>`) make output easy to extract.',
    },
    {
      title: 'The system prompt at the right altitude',
      text: 'One sentence of role plus the lasting rules, in the separate `system` parameter. Avoid both brittle if-then scripts and vague advice. Start minimal, test, and add instructions or examples only for failures you observe.',
    },
    {
      title: 'Context is a budget',
      text: 'Recall drops as the context grows, and every token costs. Send the smallest set of high-signal tokens: the pages this question needs, chosen by relevance within a token budget, and nothing when nothing is relevant. For long tasks, compact old turns, keep notes outside the context, drop used tool results, and fetch documents just in time.',
    },
  ],
  rules: [
    'Task, reader, format, reason: in every prompt that matters.',
    '3 to 5 varied examples, in `<example>` tags, not from the test set.',
    'Long documents first, question last; tag and label each document.',
    'Role and lasting rules go in `system=`.',
    'Fill every `{slot}` in a template; join split strings with a space.',
    'Rank by relevance, keep what fits the budget, drop the rest.',
  ],
  example: {
    code: [
      'docs = {"d2": "Annual: 14 days.",',
      '        "d7": "Paid: 4 a month."}',
      'q = "Refund on my annual plan?"',
      'body = "\\n".join(',
      '    f\'<doc id="{k}">{v}</doc>\'',
      '    for k, v in docs.items())',
      'prompt = (f"<docs>\\n{body}\\n</docs>\\n"',
      '          "Answer from the docs. "',
      '          "Cite the id.\\n"',
      '          f"<q>{q}</q>")',
      'print(prompt)',
    ].join('\n'),
    output: [
      '<docs>',
      '<doc id="d2">Annual: 14 days.</doc>',
      '<doc id="d7">Paid: 4 a month.</doc>',
      '</docs>',
      'Answer from the docs. Cite the id.',
      '<q>Refund on my annual plan?</q>',
    ].join('\n'),
    notes: [
      'Documents first, each tagged with an id the answer can cite.',
      'The instruction says what to do and how to cite; the two string pieces end with a space so the words do not run together.',
      'The question comes last, in its own tag.',
    ],
  },
  mistakes: [
    { mistake: 'Vague task, no format.', fix: 'Name the task, the reader, and the exact output format.' },
    { mistake: 'All examples alike.', fix: 'Vary them; similar examples teach accidental habits.' },
    { mistake: 'Question first, 30 pages after it.', fix: 'Documents first, question last.' },
    { mistake: 'Forty edge-case rules.', fix: 'Trim to the essentials and add examples for real failures.' },
    { mistake: 'Everything "just in case".', fix: 'Send only what this question needs, within a budget.' },
  ],
  forReal:
    'What the app cannot give you: watching a real model react to your wording. In your plan, week 1 reads the provider\'s prompt-engineering guide, and week 4 reads its context-engineering article and compares three setups (prompt and context choices, optionally one local model) before picking the flagship. Score each setup with your E5 eval harness, not by feel.',
};
