# Self-test for src/python/epoch_sim.py, run in Pyodide by verify-content.
# Each block is the kind of code a lab asks for, so this proves the
# stand-ins support it. Any failed assert fails the build.
import asyncio
import json
import epoch_sim as sim

# --- retry with exponential backoff on 429 / 5xx ------------------------------
sim.clock.reset()
client = sim.Client(schedule=[429, 500, 503, 200], body={"items": [1, 2]})


def get_with_retry(url, tries=5, base=0.5):
    for attempt in range(tries):
        r = client.get(url)
        if r.status_code == 429 or r.status_code >= 500:
            sim.sleep(base * 2 ** attempt)
            continue
        return r.raise_for_status().json()
    raise RuntimeError("gave up")


assert get_with_retry("https://api.example.com/items") == {"items": [1, 2]}
assert [c["status"] for c in client.calls] == [429, 500, 503, 200]
assert sim.clock.sleeps == [0.5, 1.0, 2.0], sim.clock.sleeps

# Retry-After header, timeouts, raise_for_status
c2 = sim.Client(schedule=[429, 200], retry_after=3)
assert c2.get("u").headers["Retry-After"] == "3"
c3 = sim.Client(schedule=["timeout", 200])
try:
    c3.get("u")
    raise AssertionError("expected a timeout")
except sim.TimeoutException:
    pass
assert c3.get("u").status_code == 200
try:
    sim.Client(schedule=[500]).get("u").raise_for_status()
    raise AssertionError("expected HTTPStatusError")
except sim.HTTPStatusError as e:
    assert e.response.status_code == 500


# async client, as with httpx.AsyncClient
async def fetch_all():
    async with sim.AsyncClient(schedule=[200]) as ac:
        rs = await asyncio.gather(ac.get("a"), ac.get("b"))
    return [r.status_code for r in rs]


assert await fetch_all() == [200, 200]  # top-level await: the harness allows it

# --- structured output: validate and repair -----------------------------------
llm = sim.FakeLLM(script=['{"name": "Ada", "age": "thirty"}', '{"name": "Ada", "age": 30}'])


def ask_json(prompt, tries=3):
    messages = [{"role": "user", "content": prompt}]
    for _ in range(tries):
        msg = llm.messages.create(model="model-small", max_tokens=200, messages=messages)
        text = msg.content[0].text
        try:
            data = json.loads(text)
            if isinstance(data.get("age"), int):
                return data
            problem = "age must be an integer"
        except json.JSONDecodeError as e:
            problem = str(e)
        messages += [{"role": "assistant", "content": text}, {"role": "user", "content": f"Fix this: {problem}"}]
    raise ValueError("no valid reply")


assert ask_json("Who?") == {"name": "Ada", "age": 30}
assert len(llm.calls) == 2

# usage, max_tokens, errors
m = sim.FakeLLM(script=["word " * 100]).messages.create(model="model-small", max_tokens=10, messages=[{"role": "user", "content": "hi"}])
assert m.stop_reason == "max_tokens" and m.usage.output_tokens == 10
try:
    sim.FakeLLM(script=[sim.RateLimitError()]).messages.create(model="m", max_tokens=5, messages=[{"role": "user", "content": "x"}])
    raise AssertionError("expected RateLimitError")
except sim.APIStatusError as e:
    assert e.status_code == 429
assert sim.fake_llm("hello") == "OK"

# --- agent loop with a step limit ---------------------------------------------
agent = sim.FakeLLM(script=[sim.tool_call("lookup_order", order_id="A101"), sim.tool_call("get_weather", city="Porto"), "Your order is processing; Porto has rain."])
messages = [{"role": "user", "content": "Where is order A101, and what is the weather in Porto?"}]
steps = 0
while True:
    steps += 1
    assert steps <= 5, "step limit"
    msg = agent.messages.create(model="model-small", max_tokens=300, messages=messages, tools=sim.tool_specs())
    if msg.stop_reason != "tool_use":
        break
    block = msg.content[0]
    result = sim.call_tool(block.name, block.input)
    messages += [
        {"role": "assistant", "content": [{"type": "tool_use", "id": block.id, "name": block.name, "input": block.input}]},
        {"role": "user", "content": [{"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(result)}]},
    ]
assert steps == 3 and "processing" in msg.content[0].text
assert sim.call_tool("calculator", {"expression": "2 * (3 + 4)"}) == {"result": 14}
assert "error" in sim.call_tool("calculator", {"expression": "__import__('os')"})
assert "error" in sim.call_tool("nope", {})

# --- retrieval with citations and refusal ------------------------------------
def retrieve(query, k=2, floor=0.5):
    q = sim.embed(query)
    scored = sorted(((sim.cosine(q, d["embedding"]), d) for d in sim.DOCS), key=lambda t: -t[0])
    return [d for s, d in scored[:k] if s >= floor]


hits = retrieve("How do I get a refund on my annual plan?")
assert hits and hits[0]["id"] == "d2", [h["id"] for h in hits]
assert retrieve("password reset link")[0]["id"] == "d1"
assert retrieve("export my notes to pdf")[0]["id"] == "d3"
assert retrieve("what is the capital of france") == []  # nothing relevant: refuse

# --- cost and p95 latency from logs ------------------------------------------
cost = sum(r["input_tokens"] * sim.PRICES[r["model"]][0] / 1e6 + r["output_tokens"] * sim.PRICES[r["model"]][1] / 1e6 for r in sim.LOGS)
assert 0.01 < cost < 1, cost
lat = sorted(r["latency_ms"] for r in sim.LOGS)
p50 = lat[len(lat) // 2]
p95 = lat[min(len(lat) - 1, int(0.95 * len(lat)))]
assert p95 > 2 * p50, (p50, p95)  # the slow tail is visible
assert sum(not r["ok"] for r in sim.LOGS) == 2
assert len({r["model"] for r in sim.LOGS}) == 2

print("epoch_sim self-test passed")
