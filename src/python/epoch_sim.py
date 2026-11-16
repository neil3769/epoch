"""Stand-ins for network services, for Epoch's engineering labs.

Pyodide has no network, so labs import these instead. Their interfaces copy
the real libraries closely enough that the code you write transfers:

    llm      FakeLLM: client.messages.create(...) like the Anthropic SDK
    http     Client / AsyncClient: .get / .post like httpx, replies on a schedule
    docs     DOCS with precomputed embeddings, embed(), cosine()
    tools    TOOLS with JSON-schema inputs, call_tool()
    logs     LOGS of past requests (tokens, latency) and PRICES
    clock    virtual time: sleep() moves it forward instantly

Everything is deterministic: the same code gives the same result every run.
DIFFERENCES lists what is not like the real thing.
"""

import json
import math
import re

DIFFERENCES = """\
- No network: replies are scripted or computed here, never from a real model or server.
- Time is virtual: clock.sleep(2) returns at once and moves clock.time() on by 2.
  Real code uses time.sleep / asyncio.sleep.
- Token counts are an estimate (about 4 characters per token); real tokenizers differ.
- Model names and prices are made up for practice; check your provider's price page.
- FakeLLM answers from a script you give it, so its replies are not "intelligent".
- Errors carry only status_code and a message; real SDK errors carry more detail.
"""

# ------------------------------------------------------------------ clock ---


class Clock:
    """Virtual time, so retries with backoff finish instantly."""

    def __init__(self):
        self.t = 0.0
        self.sleeps = []

    def time(self):
        return self.t

    def sleep(self, seconds):
        seconds = max(0.0, float(seconds))
        self.sleeps.append(seconds)
        self.t += seconds

    async def asleep(self, seconds):
        self.sleep(seconds)

    def advance(self, seconds):
        """Time passing that your code did not ask for (network latency). Not logged in sleeps."""
        self.t += max(0.0, float(seconds))

    def reset(self):
        self.t = 0.0
        self.sleeps = []


clock = Clock()


def sleep(seconds):
    """Stand-in for time.sleep: advances the virtual clock."""
    clock.sleep(seconds)


async def async_sleep(seconds):
    """Stand-in for asyncio.sleep."""
    clock.sleep(seconds)


def count_tokens(text):
    """Rough token estimate: about four characters per token."""
    return max(1, math.ceil(len(str(text)) / 4))


# -------------------------------------------------------------------- llm ---


class APIStatusError(Exception):
    """An error reply from the API, with its HTTP status code."""

    def __init__(self, status_code, message=""):
        super().__init__(f"{status_code}: {message}")
        self.status_code = status_code
        self.message = message


class RateLimitError(APIStatusError):
    def __init__(self, message="rate limited"):
        super().__init__(429, message)


class InternalServerError(APIStatusError):
    def __init__(self, message="server error"):
        super().__init__(500, message)


class Usage:
    def __init__(self, input_tokens, output_tokens):
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        # The real API also reports prompt-cache tokens; nothing is cached here.
        self.cache_creation_input_tokens = 0
        self.cache_read_input_tokens = 0

    def __repr__(self):
        return f"Usage(input_tokens={self.input_tokens}, output_tokens={self.output_tokens})"


class TextBlock:
    type = "text"

    def __init__(self, text):
        self.text = text

    def __repr__(self):
        return f"TextBlock(text={self.text!r})"


class ToolUseBlock:
    type = "tool_use"

    def __init__(self, id, name, input):
        self.id = id
        self.name = name
        self.input = input

    def __repr__(self):
        return f"ToolUseBlock(name={self.name!r}, input={self.input!r})"


class Message:
    type = "message"
    role = "assistant"

    def __init__(self, id, model, content, stop_reason, usage):
        self.id = id
        self.model = model
        self.content = content
        self.stop_reason = stop_reason
        self.usage = usage

    def __repr__(self):
        return f"Message(stop_reason={self.stop_reason!r}, content={self.content!r}, usage={self.usage!r})"


def _text_of(content):
    if isinstance(content, str):
        return content
    parts = []
    for block in content:
        if isinstance(block, dict):
            parts.append(str(block.get("text") or block.get("content") or block.get("input") or ""))
        else:
            parts.append(str(getattr(block, "text", "")))
    return " ".join(parts)


def tool_call(name, **input):
    """Script entry: the model asks to call a tool."""
    return {"tool": name, "input": input}


class FakeLLM:
    """A scripted model. Use it like the Anthropic client:

        client = FakeLLM(script=["Hello!", '{"name": "Ada"}'])
        msg = client.messages.create(model="model-small", max_tokens=100,
                                     messages=[{"role": "user", "content": "Hi"}])
        msg.content[0].text, msg.usage.input_tokens, msg.stop_reason

    Each call takes the next script entry: a string (a text reply), tool_call(...)
    (a tool request), an exception such as RateLimitError() (raised), or a
    function of the messages (its return value is used). With the script used
    up, it replies "OK".
    """

    def __init__(self, script=None, latency=0.4):
        self.script = list(script or [])
        self.latency = latency
        self.calls = []
        self.messages = self  # so client.messages.create(...) works

    def create(self, model, max_tokens, messages, system=None, tools=None, **kwargs):
        if not isinstance(messages, list) or not messages:
            raise APIStatusError(400, "messages must be a non-empty list")
        for m in messages:
            if m.get("role") not in ("user", "assistant"):
                raise APIStatusError(400, f"unknown role {m.get('role')!r}")
        self.calls.append({"model": model, "messages": messages, "system": system, "tools": tools})
        clock.advance(self.latency)
        reply = self.script.pop(0) if self.script else "OK"
        if callable(reply) and not isinstance(reply, dict):
            reply = reply(messages)
        if isinstance(reply, BaseException):
            raise reply
        prompt = (system or "") + " " + " ".join(_text_of(m["content"]) for m in messages)
        in_tok = count_tokens(prompt) + (20 * len(tools) if tools else 0)
        n = len(self.calls)
        if isinstance(reply, dict) and "tool" in reply:
            block = ToolUseBlock(f"toolu_{n:03d}", reply["tool"], reply["input"])
            out = count_tokens(json.dumps(reply["input"])) + 10
            return Message(f"msg_{n:03d}", model, [block], "tool_use", Usage(in_tok, out))
        text = str(reply)
        out = count_tokens(text)
        stop = "end_turn"
        if out > max_tokens:
            text = text[: max_tokens * 4]
            out = max_tokens
            stop = "max_tokens"
        return Message(f"msg_{n:03d}", model, [TextBlock(text)], stop, Usage(in_tok, out))


def fake_llm(prompt, script=None):
    """Shortcut: one prompt in, the reply text out."""
    client = FakeLLM(script)
    msg = client.messages.create(model="model-small", max_tokens=1024, messages=[{"role": "user", "content": prompt}])
    return msg.content[0].text


# ------------------------------------------------------------------- http ---


class HTTPStatusError(Exception):
    def __init__(self, response):
        super().__init__(f"HTTP {response.status_code}")
        self.response = response


class TimeoutException(Exception):
    pass


class Response:
    def __init__(self, status_code, body=None, headers=None):
        self.status_code = status_code
        self.headers = dict(headers or {})
        self._body = body

    @property
    def text(self):
        return self._body if isinstance(self._body, str) else json.dumps(self._body)

    def json(self):
        return json.loads(self._body) if isinstance(self._body, str) else self._body

    @property
    def is_success(self):
        return 200 <= self.status_code < 300

    def raise_for_status(self):
        if not self.is_success:
            raise HTTPStatusError(self)
        return self

    def __repr__(self):
        return f"<Response [{self.status_code}]>"


class Client:
    """Like httpx.Client, against a flaky endpoint.

        client = Client(schedule=[429, 500, 200])
        r = client.get("https://api.example.com/items")

    Replies follow the schedule (then the last entry repeats). A status
    "timeout" raises TimeoutException. 429 replies carry a Retry-After header
    if retry_after is set. Each call is logged in client.calls with the
    virtual time it happened.
    """

    def __init__(self, schedule=(200,), body=None, retry_after=None, latency=0.1, timeout=None):
        self.schedule = list(schedule) or [200]
        self.body = {"ok": True} if body is None else body
        self.retry_after = retry_after
        self.latency = latency
        self.timeout = timeout
        self.calls = []

    def _reply(self, method, url, json_body=None):
        i = min(len(self.calls), len(self.schedule) - 1)
        status = self.schedule[i]
        self.calls.append({"method": method, "url": url, "json": json_body, "at": clock.time(), "status": status})
        clock.advance(self.latency)
        if status == "timeout":
            raise TimeoutException(f"{method} {url} timed out")
        headers = {}
        if status == 429 and self.retry_after is not None:
            headers["Retry-After"] = str(self.retry_after)
        body = self.body if 200 <= status < 300 else {"error": {429: "rate limited", 500: "server error", 503: "unavailable"}.get(status, "error")}
        return Response(status, body, headers)

    def get(self, url, params=None, headers=None, timeout=None):
        return self._reply("GET", url)

    def post(self, url, json=None, headers=None, timeout=None):
        return self._reply("POST", url, json)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class AsyncClient(Client):
    """Like httpx.AsyncClient: the same, with await."""

    async def get(self, url, params=None, headers=None, timeout=None):
        return self._reply("GET", url)

    async def post(self, url, json=None, headers=None, timeout=None):
        return self._reply("POST", url, json)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False


# ------------------------------------------------------------------- docs ---

# A small help centre for a made-up app, for retrieval labs.
DOCS = [
    {"id": "d1", "title": "Resetting your password", "text": "To reset your password, open Settings, choose Account, then Reset password. A reset link is emailed and expires after 30 minutes."},
    {"id": "d2", "title": "Refund policy", "text": "Annual plans can be refunded within 14 days of purchase. Monthly plans are not refunded, but you can cancel at any time."},
    {"id": "d3", "title": "Exporting your data", "text": "Export your notes as Markdown or PDF from Settings, Data, Export. Large exports are emailed as a zip file."},
    {"id": "d4", "title": "Offline mode", "text": "Notes you opened recently are available offline. Changes made offline sync when you reconnect."},
    {"id": "d5", "title": "Sharing a notebook", "text": "Share a notebook by inviting people by email. Viewers can read; editors can change notes and invite others."},
    {"id": "d6", "title": "Two-factor sign-in", "text": "Turn on two-factor sign-in in Settings, Security. You can use an authenticator app or a security key."},
    {"id": "d7", "title": "Plans and pricing", "text": "The free plan holds 100 notes. The paid plan costs 4 euros a month or 40 euros a year and has no limit."},
]

# Embedding dimensions: one per topic, each with its keywords.
TOPICS = [
    ("account", ["password", "account", "sign", "login", "reset", "security", "two-factor", "authenticator", "key"]),
    ("billing", ["refund", "plan", "plans", "price", "pricing", "pay", "paid", "cost", "costs", "euros", "purchase", "cancel", "money"]),
    ("data", ["export", "data", "markdown", "pdf", "zip", "download", "backup"]),
    ("offline", ["offline", "sync", "reconnect", "internet", "connection"]),
    ("sharing", ["share", "sharing", "invite", "invites", "viewers", "editors", "collaborate", "notebook"]),
    ("notes", ["note", "notes", "notebook", "limit", "write"]),
    ("email", ["email", "emailed", "mail", "link"]),
    ("settings", ["settings", "choose", "open", "turn"]),
]


def _words(text):
    return re.findall(r"[a-z0-9-]+", text.lower())


def embed(text):
    """A toy embedding: how much the text talks about each topic, scaled to length 1."""
    words = _words(text)
    v = [float(sum(words.count(k) for k in keys)) for _, keys in TOPICS]
    n = math.sqrt(sum(x * x for x in v))
    return [round(x / n, 4) for x in v] if n else v


def cosine(a, b):
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if not na or not nb:
        return 0.0
    return sum(x * y for x, y in zip(a, b)) / (na * nb)


for _d in DOCS:
    _d["embedding"] = embed(_d["title"] + " " + _d["text"])


# ------------------------------------------------------------------ tools ---


def _get_weather(city):
    table = {"lisbon": (19, "sunny"), "porto": (15, "rain"), "london": (9, "cloudy"), "madrid": (14, "clear")}
    t = table.get(str(city).lower())
    if t is None:
        return {"error": f"unknown city {city!r}"}
    return {"city": city, "temp_c": t[0], "sky": t[1]}


def _calculator(expression):
    if not re.fullmatch(r"[0-9+\-*/(). ]+", str(expression)):
        return {"error": "only numbers and + - * / ( ) are allowed"}
    try:
        return {"result": eval(expression, {"__builtins__": {}}, {})}
    except Exception as e:  # noqa: BLE001 - shown to the model as a tool error
        return {"error": type(e).__name__}


def _lookup_order(order_id):
    orders = {"A100": "shipped", "A101": "processing", "A102": "delivered"}
    status = orders.get(str(order_id))
    return {"order_id": order_id, "status": status} if status else {"error": f"no order {order_id!r}"}


TOOLS = {
    "get_weather": {
        "description": "Current weather for a city.",
        "input_schema": {"type": "object", "properties": {"city": {"type": "string"}}, "required": ["city"]},
        "fn": _get_weather,
    },
    "calculator": {
        "description": "Evaluate an arithmetic expression.",
        "input_schema": {"type": "object", "properties": {"expression": {"type": "string"}}, "required": ["expression"]},
        "fn": _calculator,
    },
    "lookup_order": {
        "description": "Status of an order by id.",
        "input_schema": {"type": "object", "properties": {"order_id": {"type": "string"}}, "required": ["order_id"]},
        "fn": _lookup_order,
    },
}


def tool_specs():
    """The tools as you would pass them to messages.create(tools=...)."""
    return [{"name": n, "description": t["description"], "input_schema": t["input_schema"]} for n, t in TOOLS.items()]


def call_tool(name, args):
    if name not in TOOLS:
        return {"error": f"unknown tool {name!r}"}
    try:
        return TOOLS[name]["fn"](**args)
    except TypeError as e:
        return {"error": f"bad arguments: {e}"}


# ------------------------------------------------------------------- logs ---

# Made-up prices in euros per million tokens: (input, output).
PRICES = {"model-small": (0.25, 1.25), "model-large": (3.0, 15.0)}


def _make_logs():
    seed = 7
    out = []
    for i in range(40):
        seed = (seed * 1103515245 + 12345) % 2**31
        model = "model-large" if seed % 5 == 0 else "model-small"
        in_tok = 200 + seed % 1800
        seed = (seed * 1103515245 + 12345) % 2**31
        out_tok = 50 + seed % 450
        seed = (seed * 1103515245 + 12345) % 2**31
        latency = 300 + seed % 900 + (2500 if i in (6, 23) else 0) + (800 if model == "model-large" else 0)
        out.append({"request_id": f"r{i:02d}", "model": model, "input_tokens": in_tok, "output_tokens": out_tok, "latency_ms": latency, "ok": i not in (11, 30)})
    return out


LOGS = _make_logs()
