import type { Lab } from '../schema';

/*
 * Unit S1 labs. Lab 1: read an HTTP request, with scaffolding (request
 * line, query string, status line, retry rule). Lab 2, from empty
 * functions: measure a service from request timings (latencies, a
 * nearest-rank percentile, throughput, Little's law, fan-out tail).
 */
export const s1Labs: Lab[] = [
  {
    id: 's1-lab-1',
    title: 'Read a request',
    intro: 'Take apart a raw HTTP request the way a server does: the request line, the query string, the status line of the reply, and when a client may retry.',
    summary: 'You parsed a request and wrote the retry rule for methods and statuses.',
    minutes: 12,
    unlockAfter: 's1-05',
    differs: 'Real servers also parse headers, bodies, encodings and much more, and libraries such as FastAPI do it for you. The logic of each step is the same.',
    steps: [
      {
        goal: 'Finish `request_line(line)`: return the method, path and version from a line such as `GET /a?x=1 HTTP/1.1`.',
        starter: 'def request_line(line):\n    method, path, version = \\\n        line.split(___)\n    return method, path, version',
        solution: 'def request_line(line):\n    method, path, version = \\\n        line.split(" ")\n    return method, path, version',
        tests: 'assert request_line("GET /a?x=1 HTTP/1.1") == ("GET", "/a?x=1", "HTTP/1.1"), f"got {request_line(\'GET /a?x=1 HTTP/1.1\')}"',
        hints: ['The three parts are separated by single spaces.', 'def request_line(line):\n    method, path, version = \\\n        line.split(___)\n    return method, path, version'],
      },
      {
        goal: 'Finish `query(path)`: the query string as a dict, `{}` if there is none.',
        starter: 'def query(path):\n    if "?" not in path:\n        return {}\n    qs = path.split("?", 1)[1]\n    pairs = [p.split("=", 1)\n             for p in qs.split(___)]\n    return dict(pairs)',
        solution: 'def query(path):\n    if "?" not in path:\n        return {}\n    qs = path.split("?", 1)[1]\n    pairs = [p.split("=", 1)\n             for p in qs.split("&")]\n    return dict(pairs)',
        tests: [
          'assert query("/s?q=cat&page=2") == {"q": "cat", "page": "2"}, f"got {query(\'/s?q=cat&page=2\')}"',
          'assert query("/home") == {}, "no query string: empty dict"',
        ].join('\n'),
        hints: ['Pairs are joined by &.', 'def query(path):\n    if "?" not in path:\n        return {}\n    qs = path.split("?", 1)[1]\n    pairs = [p.split("=", 1)\n             for p in qs.split(___)]\n    return dict(pairs)'],
        explain: 'Values stay strings: "2", not 2. Converting is the app\'s job.',
      },
      {
        goal: 'Finish `status_line(code)`: for example `HTTP/1.1 404 Not Found`, using `REASONS`.',
        starter: 'REASONS = {\n    200: "OK", 404: "Not Found",\n    429: "Too Many Requests",\n    503: "Service Unavailable"}\n\ndef status_line(code):\n    reason = REASONS[___]\n    return f"HTTP/1.1 {code} {reason}"',
        solution: 'REASONS = {\n    200: "OK", 404: "Not Found",\n    429: "Too Many Requests",\n    503: "Service Unavailable"}\n\ndef status_line(code):\n    reason = REASONS[code]\n    return f"HTTP/1.1 {code} {reason}"',
        tests: [
          'assert status_line(404) == "HTTP/1.1 404 Not Found", f"got {status_line(404)!r}"',
          'assert status_line(200) == "HTTP/1.1 200 OK", "200 OK"',
        ].join('\n'),
        hints: ['Look the reason up by the code.', 'REASONS = {\n    200: "OK", 404: "Not Found",\n    429: "Too Many Requests",\n    503: "Service Unavailable"}\n\ndef status_line(code):\n    reason = REASONS[___]\n    return f"HTTP/1.1 {code} {reason}"'],
      },
      {
        goal: 'Finish `may_retry(method, code)`: True only for an idempotent method with a 429 or 5xx status.',
        starter: 'IDEMPOTENT = {"GET", "PUT", "DELETE"}\n\ndef may_retry(method, code):\n    later = code == 429 or code >= 500\n    idem = method in IDEMPOTENT\n    return later and ___',
        solution: 'IDEMPOTENT = {"GET", "PUT", "DELETE"}\n\ndef may_retry(method, code):\n    later = code == 429 or code >= 500\n    idem = method in IDEMPOTENT\n    return later and idem',
        tests: [
          'assert may_retry("GET", 503), "GET after 503: retry"',
          'assert not may_retry("POST", 503), "POST may have worked: no blind retry"',
          'assert not may_retry("GET", 404), "404 will not change"',
          'assert may_retry("PUT", 429), "PUT after 429: retry later"',
        ].join('\n'),
        hints: ['Both conditions must hold.', 'IDEMPOTENT = {"GET", "PUT", "DELETE"}\n\ndef may_retry(method, code):\n    later = code == 429 or code >= 500\n    idem = method in IDEMPOTENT\n    return later and ___'],
        explain: 'POST joins the list once it carries an idempotency key (S9).',
      },
    ],
  },
  {
    id: 's1-lab-2',
    title: 'Measure a service',
    intro: 'From a list of (start, end) times in seconds, compute what a dashboard shows: latencies, a percentile, throughput, requests in progress, and the chance a fan-out page is slow. Each piece from an empty function.',
    summary: 'You computed latency, percentiles, throughput and Little\'s law from raw timings.',
    minutes: 15,
    unlockAfter: 's1-07',
    steps: [
      {
        goal: 'Write `latencies(spans)`: the duration of each `(start, end)` pair.',
        starter: 'def latencies(spans):\n    pass',
        solution: 'def latencies(spans):\n    return [e - s for s, e in spans]',
        tests: 'assert latencies([(0, 2), (1, 1.5)]) == [2, 0.5], f"got {latencies([(0, 2), (1, 1.5)])}"',
        hints: ['A list comprehension over the pairs.', 'def latencies(spans):\n    return [e - s for s, ___ in spans]'],
      },
      {
        goal: 'Write `percentile(values, p)` by nearest rank: sort, then take the value at position ⌈p/100 × n⌉ − 1 (at least 0).',
        starter: 'def percentile(values, p):\n    pass',
        solution: 'import math\n\ndef percentile(values, p):\n    v = sorted(values)\n    k = math.ceil(p / 100 * len(v))\n    return v[max(k - 1, 0)]',
        tests: [
          'xs = list(range(1, 101))',
          'assert percentile(xs, 50) == 50 and percentile(xs, 99) == 99, f"got {percentile(xs, 50)}, {percentile(xs, 99)}"',
          'assert percentile([5, 1, 3], 0) == 1, "p0 is the smallest"',
        ].join('\n'),
        hints: [
          'math.ceil for the rank; sorted for the order.',
          'import math\n\ndef percentile(values, p):\n    v = sorted(values)\n    k = math.ceil(p / 100 * len(v))\n    return v[max(k - ___, 0)]',
        ],
        explain: 'NumPy interpolates instead; both are fine as long as you say which.',
      },
      {
        goal: 'Write `throughput(spans)`: requests finished per second, from the first start to the last end.',
        starter: 'def throughput(spans):\n    pass',
        solution: 'def throughput(spans):\n    t0 = min(s for s, _ in spans)\n    t1 = max(e for _, e in spans)\n    return len(spans) / (t1 - t0)',
        tests: 'assert throughput([(0, 1), (0, 2), (1, 2), (2, 4)]) == 1.0, f"4 requests in 4 s; got {throughput([(0, 1), (0, 2), (1, 2), (2, 4)])}"',
        hints: ['Count ÷ (last end − first start).', 'def throughput(spans):\n    t0 = min(s for s, _ in spans)\n    t1 = max(e for _, e in spans)\n    return len(spans) / (t1 - ___)'],
      },
      {
        goal: 'Write `in_progress(rate, latency)`: requests in progress by Little\'s law.',
        starter: 'def in_progress(rate, latency):\n    pass',
        solution: 'def in_progress(rate, latency):\n    return rate * latency',
        tests: 'assert in_progress(400, 0.25) == 100, f"got {in_progress(400, 0.25)}"',
        hints: ['Throughput times latency.', 'def in_progress(rate, latency):\n    return rate ___ latency'],
      },
      {
        goal: 'Write `slow_page(n, p_slow)`: the chance that at least one of `n` parallel calls is slow, if each is slow with chance `p_slow`.',
        starter: 'def slow_page(n, p_slow):\n    pass',
        solution: 'def slow_page(n, p_slow):\n    return 1 - (1 - p_slow) ** n',
        tests: [
          'assert abs(slow_page(100, 0.01) - 0.634) < 0.001, f"got {slow_page(100, 0.01)}"',
          'assert slow_page(1, 0.5) == 0.5, "one call: its own chance"',
        ].join('\n'),
        hints: ['1 minus the chance that all n are fast.', 'def slow_page(n, p_slow):\n    return 1 - (1 - p_slow) ** ___'],
        explain: 'The reason large systems chase p99 and p99.9.',
      },
    ],
  },
];
