import type { Walkthrough } from '../schema';

/*
 * AI design 2: a document-extraction pipeline for invoices, through the
 * seven-step framework. Listed in both tracks: opens after S1-S3, S8 and
 * S12, or after E3, E5 and E11 (lesson "Design: document extraction").
 */
export const docExtraction: Walkthrough = {
  id: 'w-doc-extraction',
  title: 'Document extraction',
  question: 'Design a pipeline that extracts the supplier, date, line items and total from 100,000 invoices a day, in PDFs and scans, into a database.',
  needs: ['S1', 'S2', 'S3', 'S8', 'S12'],
  orNeeds: ['E3', 'E5', 'E11'],
  tracks: ['engineering', 'system-design'],
  minutes: 17,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "Invoices come from thousands of suppliers in many layouts. About a fifth are scans. Wrong totals cost money."',
      exercises: [
        {
          id: 'wde-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Read PDFs and scans', bucket: 0, why: 'Stated: a fifth are scans.' },
            { text: 'Extract fields to a schema', bucket: 0, why: 'The core job.' },
            { text: 'Check that totals add up', bucket: 0, why: 'Wrong totals cost money.' },
            { text: 'Send doubtful ones to a person', bucket: 0, why: 'Some will always need a human.' },
            { text: 'Paying the invoices', bucket: 1, why: 'Payment is another system, with its own approvals.' },
            { text: 'Supplier fraud detection', bucket: 1, why: 'Valuable, but a separate project.' },
          ],
          explain: 'Read, extract, check, and route the doubtful ones to people.',
        },
        {
          id: 'wde-1-2',
          type: 'mcq',
          prompt: 'Which requirement matters most?',
          options: [
            { text: 'Correct fields, or flagged' },
            { text: 'Results within a second', why: 'Invoices can wait minutes; background processing is fine.' },
            { text: 'Zero human involvement', why: 'Some will always need a person; aim to keep that share small.' },
          ],
          answer: 0,
          explain: 'A wrong total saved silently is the worst outcome.',
        },
        {
          id: 'wde-1-3',
          type: 'scenario',
          prompt: 'How fast must an invoice be processed?',
          situation: 'Invoices are paid within 30 days of arriving.',
          needs: ['Processed well before payment', 'Sensible cost'],
          options: [
            { text: 'Within an hour, in background', cost: 'Not instant.' },
            {
              text: 'Within a second, in line',
              cost: 'Instant results.',
              why: 'Costly real-time capacity for no benefit.',
            },
          ],
          answer: 0,
          explain: 'A queue lets the pipeline absorb bursts such as month-end.',
        },
      ],
      strong: 'Read PDFs and scans, extract fields to a fixed schema, check them in code, and send doubtful invoices to a person; correctness first, results within an hour. Payment and fraud detection later.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "Invoices average two pages of about 800 tokens each; the fields come back as about 300 tokens. Prices: $3 per million input tokens, $15 per million output."',
      exercises: [
        {
          id: 'wde-2-1',
          type: 'estimate',
          prompt: 'Invoices per second, on average?',
          expr: '100000 / DAY',
          answer: 1.16,
          tolerance: 2,
          unit: 'invoices/s',
          options: [
            { value: 0.1, why: '100,000 / 86,400 ≈ 1.2.' },
            { value: 1.2 },
            { value: 12, why: 'That would be a million invoices a day.' },
          ],
          work: ['100,000 / 86,400 s ≈ 1.2 a second'],
          explain: 'A gentle average; month-end bursts matter more.',
        },
        {
          id: 'wde-2-2',
          type: 'estimate',
          prompt: 'Input tokens per day?',
          expr: '100000 * 2 * 800 / 1e6',
          answer: 160,
          tolerance: 2,
          unit: 'million tokens',
          options: [
            { value: 16, why: '100,000 × 1,600 = 1.6 × 10⁸ = 160 million.' },
            { value: 160 },
            { value: 1600, why: '1.6 × 10⁸ is 160 million, not 1.6 billion.' },
          ],
          work: ['2 pages × 800 = 1,600 tokens an invoice', '× 100,000 = 1.6 × 10⁸ = 160 million'],
          explain: 'Scans add OCR work before any tokens.',
        },
        {
          id: 'wde-2-3',
          type: 'estimate',
          prompt: 'Model cost per day?',
          expr: '100000 * (2 * 800 * 3 + 300 * 15) / 1e6',
          answer: 930,
          tolerance: 2,
          unit: '$/day',
          options: [
            { value: 90, why: '1,600 × $3/M + 300 × $15/M ≈ $0.0093 an invoice × 100,000.' },
            { value: 900 },
            { value: 9000, why: '$0.0093 × 100,000 is about $930.' },
          ],
          work: ['1,600 × $3/M = $0.0048; 300 × $15/M = $0.0045', '$0.0093 × 100,000 ≈ $930 a day'],
          explain: 'Under a cent an invoice, far cheaper than typing them in.',
        },
      ],
      strong: 'About one invoice a second on average with month-end bursts, 160 million input tokens and about $930 a day: cheap per invoice, so accuracy and the review workload are what matter.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'Upload, then wait: the work happens in the background.',
      exercises: [
        {
          id: 'wde-3-1',
          type: 'order-steps',
          prompt: 'Put one invoice\'s journey in order.',
          steps: [
            'The invoice file is uploaded',
            'Text is extracted, with OCR for scans',
            'The model returns the fields as JSON',
            'Code validates the fields',
            'Valid results are saved; others go to review',
          ],
          explain: 'Validation sits between the model and the database.',
        },
        {
          id: 'wde-3-2',
          type: 'match-pairs',
          prompt: 'Match each part of the interface to its job.',
          pairs: [
            { left: 'POST /invoices', right: 'accepts a file, returns a job id', why: 'Returns at once.' },
            { left: 'GET /invoices/{id}', right: 'status and fields', why: 'Pending, done or in review.' },
            { left: 'Review queue', right: 'invoices a person must check', why: 'Failed checks land here.' },
            { left: 'Webhook', right: 'tells the caller it is done', why: 'So nobody has to poll.' },
          ],
          explain: 'An asynchronous API, like the notification service.',
        },
        {
          id: 'wde-3-3',
          type: 'mcq',
          prompt: 'Why return a job id instead of the fields?',
          options: [
            { text: 'The work takes seconds to minutes' },
            { text: 'Fields are secret until paid', why: 'Nothing is secret; the result is simply not ready yet.' },
            { text: 'Job ids are smaller', why: 'Size is not the reason; time is.' },
          ],
          answer: 0,
          explain: 'HTTP 202 Accepted with a job id.',
        },
      ],
      strong: 'POST /invoices returns 202 and a job id; GET shows status and fields; a webhook announces completion; failed checks go to a review queue for people.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Keep the files, the fields, and enough history to trace any result.',
      exercises: [
        {
          id: 'wde-4-1',
          type: 'predict-output',
          prompt: 'Code checks that the line items add up to the total. What does this print?',
          code: `items = [60.0, 40.0]
total = 110.0
s = sum(items)
print(s, abs(s - total) < 0.01)`,
          answer: '100.0 False',
          typedWrong: [{ answer: '100.0 True', why: 'The items sum to 100, but the total says 110.' }],
          explain: 'Checks in code catch what the model gets wrong: a misread total or a missed line.',
        },
        {
          id: 'wde-4-2',
          type: 'bucket-sort',
          prompt: 'Where does each piece of data live?',
          buckets: ['Object store', 'Database'],
          items: [
            { text: 'Original PDFs', bucket: 0, why: 'Blobs, kept as the record.' },
            { text: 'Page images of scans', bucket: 0, why: 'Shown to reviewers.' },
            { text: 'OCR text', bucket: 0, why: 'Kept so extraction can be re-run cheaply.' },
            { text: 'Extracted fields', bucket: 1, why: 'Queried by finance.' },
            { text: 'Review decisions', bucket: 1, why: 'Who changed what, and why.' },
            { text: 'Model and prompt version', bucket: 1, why: 'Stored with each result.' },
          ],
          explain: 'Files in object storage; fields and history in a database.',
        },
        {
          id: 'wde-4-3',
          type: 'mcq',
          prompt: 'Why store the model and prompt version with each result?',
          options: [
            { text: 'To trace and re-run bad batches' },
            { text: 'Every database row needs one', why: 'Most rows do not; these do because results can be re-run.' },
            { text: 'To charge suppliers', why: 'Suppliers are not charged for extraction.' },
          ],
          answer: 0,
          explain: 'When a prompt change causes errors, you find and redo exactly those invoices.',
        },
      ],
      strong: 'Files, page images and OCR text in object storage; extracted fields, review decisions and the model and prompt version of every result in a database, so bad batches can be traced and re-run.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Files land in storage, a queue feeds workers, and doubtful results reach people.',
      exercises: [
        {
          id: 'wde-5-1',
          type: 'diagram',
          prompt: 'Uploads arrive in bursts; workers take them at their own pace. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'u', kind: 'client', label: 'Uploads' },
              { id: 's', kind: 'store', label: 'Files' },
              { id: 'q', kind: 'queue', label: 'Jobs' },
              { id: 'w', kind: 'worker', label: 'Extractors' },
            ],
            edges: [
              { from: 'u', to: 's' },
              { from: 's', to: 'q' },
              { from: 'q', to: 'w' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'q',
            options: [
              { kind: 'queue', label: 'Job queue' },
              { kind: 'service', label: 'Direct call', why: 'A burst of uploads would overwhelm the workers and the model limits.' },
              { kind: 'cache', label: 'Cache', why: 'A cache can drop entries; jobs must not be lost.' },
            ],
            answer: 0,
          },
          explain: 'A durable queue: nothing is lost, and bursts wait their turn (S8).',
        },
        {
          id: 'wde-5-2',
          type: 'diagram',
          prompt: 'An invoice that passes its checks. Tap its path from upload to the results.',
          diagram: {
            nodes: [
              { id: 'u', kind: 'client', label: 'Uploads' },
              { id: 's', kind: 'store', label: 'Files' },
              { id: 'q', kind: 'queue', label: 'Jobs' },
              { id: 'w', kind: 'worker', label: 'Extractors' },
              { id: 'm', kind: 'model', label: 'LLM' },
              { id: 'd', kind: 'db', label: 'Results' },
            ],
            edges: [
              { from: 'u', to: 's' },
              { from: 's', to: 'q' },
              { from: 'q', to: 'w' },
              { from: 'w', to: 'm' },
              { from: 'w', to: 'd' },
            ],
          },
          goal: { kind: 'path', answer: ['u', 's', 'q', 'w', 'd'] },
          explain: 'The model call is a side trip from the worker, which validates and saves.',
        },
        {
          id: 'wde-5-3',
          type: 'mcq',
          prompt: 'An extractor crashes halfway through an invoice. What happens?',
          options: [
            { text: 'The job returns to the queue' },
            { text: 'The invoice is lost', why: 'The job is only removed once acknowledged.' },
            { text: 'The whole batch restarts', why: 'Each invoice is its own job.' },
          ],
          answer: 0,
          explain: 'Unacknowledged jobs reappear; saving is idempotent by invoice id (S8).',
        },
      ],
      strong: 'Uploads go to object storage and a job queue; extractor workers OCR, call the model, validate and save results; failures go to a review list that people work through.',
      diagram: {
        nodes: [
          { id: 'u', kind: 'client', label: 'Uploads' },
          { id: 's', kind: 'store', label: 'Files' },
          { id: 'q', kind: 'queue', label: 'Jobs' },
          { id: 'w', kind: 'worker', label: 'Extractors' },
          { id: 'm', kind: 'model', label: 'LLM' },
          { id: 'd', kind: 'db', label: 'Results' },
          { id: 'r', kind: 'client', label: 'Reviewers' },
        ],
        edges: [
          { from: 'u', to: 's' },
          { from: 's', to: 'q' },
          { from: 'q', to: 'w' },
          { from: 'w', to: 'm', label: 'fields' },
          { from: 'w', to: 'd', label: 'checked' },
          { from: 'd', to: 'r', label: 'review' },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: what to do when the model\'s output fails the checks.',
      exercises: [
        {
          id: 'wde-6-1',
          type: 'predict-output',
          prompt: 'Each attempt\'s outcome is listed; the worker tries up to a limit and returns the try that worked, or sends the invoice to review. What does this print?',
          code: `tries = ["bad json", "bad sum", "ok"]
def run(limit):
    for n in range(limit):
        if tries[n] == "ok":
            return n + 1
    return "to review"
print(run(2), run(3))`,
          answer: 'to review 3',
          typedWrong: [{ answer: '3 3', why: 'With a limit of 2 the third attempt never runs, so it goes to review.' }],
          explain: 'Retry with the error message a small number of times, then a person.',
        },
        {
          id: 'wde-6-2',
          type: 'scenario',
          prompt: 'A new supplier\'s layout confuses the model: 40% of its invoices fail the checks.',
          situation: 'The supplier sends a few hundred invoices a month.',
          needs: ['Fix that supplier', 'No harm to the others'],
          options: [
            { text: 'Add examples for it, re-test', cost: 'Prompt work for each tricky layout.' },
            {
              text: 'Relax the validation checks',
              cost: 'Fewer reviews.',
              why: 'Wrong totals would then reach the database.',
            },
          ],
          answer: 0,
          explain: 'Run the labelled set before and after, so other suppliers do not get worse.',
        },
        {
          id: 'wde-6-3',
          type: 'mcq',
          prompt: 'How do you measure extraction quality?',
          options: [
            { text: 'Field by field on a labelled set' },
            { text: 'Share of invoices processed', why: 'Processed is not the same as correct.' },
            { text: 'The model\'s own confidence', why: 'Models can be confidently wrong.' },
          ],
          answer: 0,
          explain: 'Totals and dates matter more than, say, the supplier\'s address line.',
        },
      ],
      strong: 'Validate every result in code, retry with the error a limited number of times, then send it to a person; fix weak layouts with examples, checked on a labelled set scored field by field.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Survive month-end, then shrink the pile waiting for people.',
      exercises: [
        {
          id: 'wde-7-1',
          type: 'scenario',
          prompt: 'Month-end: 500,000 invoices arrive in one day.',
          situation: 'Five times the usual volume.',
          needs: ['Nothing lost', 'All done within a day or two'],
          options: [
            { text: 'Queue absorbs it; add workers', cost: 'Some invoices wait hours.' },
            {
              text: 'Reject uploads over the limit',
              cost: 'Keeps load flat.',
              why: 'Suppliers must resend, and nothing is gained since the work can wait.',
            },
          ],
          answer: 0,
          explain: 'Workers scale with the queue length, within the model provider\'s limits.',
        },
        {
          id: 'wde-7-2',
          type: 'mcq',
          prompt: '10% of invoices go to people, and reviewers cannot keep up. What do you do?',
          options: [
            { text: 'Fix the top failure causes' },
            { text: 'Lower the bar for saving', why: 'Errors then reach payments.' },
            { text: 'Hire reviewers forever', why: 'Treats the symptom; the causes stay.' },
          ],
          answer: 0,
          explain: 'Group review cases by reason; a few layouts usually cause most of them.',
        },
        {
          id: 'wde-7-3',
          type: 'bucket-sort',
          prompt: 'Who handles each part: code, the model, or a person?',
          buckets: ['Code checks', 'Model', 'Person'],
          items: [
            { text: 'Totals add up', bucket: 0, why: 'Arithmetic: exact in code.' },
            { text: 'The date is a real date', bucket: 0, why: 'A simple rule.' },
            { text: 'Reading a messy layout', bucket: 1, why: 'What the model is good at.' },
            { text: 'Finding the supplier name', bucket: 1, why: 'Varies by layout.' },
            { text: 'An unreadable scan', bucket: 2, why: 'Neither code nor model can fix it.' },
            { text: 'A total that fails twice', bucket: 2, why: 'Retries are used up.' },
          ],
          explain: 'Model for reading, code for rules, people for what is left.',
        },
      ],
      strong: 'A queue and more workers absorb month-end; the review pile shrinks by fixing the commonest failure causes, never by loosening checks; code checks rules, the model reads, people take the rest.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'u', kind: 'client', label: 'Uploads' },
        { id: 's', kind: 'store', label: 'Files' },
        { id: 'q', kind: 'queue', label: 'Jobs' },
        { id: 'w', kind: 'worker', label: 'Extractors' },
        { id: 'm', kind: 'model', label: 'LLM' },
        { id: 'd', kind: 'db', label: 'Results' },
        { id: 'r', kind: 'client', label: 'Reviewers' },
      ],
      edges: [
        { from: 'u', to: 's' },
        { from: 's', to: 'q' },
        { from: 'q', to: 'w' },
        { from: 'w', to: 'm', label: 'fields' },
        { from: 'w', to: 'd', label: 'checked' },
        { from: 'd', to: 'r', label: 'review' },
      ],
    },
    decisions: [
      'Upload returns a job id; a durable queue feeds extractor workers.',
      'The model fills a fixed schema; code validates totals, dates and required fields.',
      'Retry with the error a few times, then send to a person.',
      'Every result stores its model and prompt version, so bad batches can be re-run.',
      'Quality scored field by field on a labelled set; about $930 a day.',
    ],
  },
  blank: {
    requirements: [
      'Extract supplier, date, items and total from PDFs and scans',
      'Totals must be right, or the invoice flagged',
      '100,000 invoices a day, with month-end bursts',
      'Results within an hour',
      'People review what fails',
    ],
    components: ['client', 'store', 'queue', 'worker', 'model', 'db'],
    firstFive: [
      'Ask the volume, layouts, share of scans and how fast results are needed',
      'Say correctness first: wrong totals cost money',
      'Estimate tokens and daily cost',
      'Sketch upload, queue, workers, validation and review',
      'Say how quality will be measured, field by field',
    ],
  },
};
