import { e8Labs } from '../labs/e8';
import { e8Library } from '../library/e8';
import type { Lesson, Unit } from '../schema';
import { e8More } from './e8-more';

/*
 * E8 Shipping a service (plan weeks 8-10). Lessons 1-5: a FastAPI endpoint,
 * request and response models, status codes, API tests, configuration and
 * secrets; lessons 6-12 (e8-more.ts): a Dockerfile line by line, layers and
 * caching, docker compose, GitHub Actions, a CI pipeline, deploying to a
 * managed host, checkpoint.
 *
 * FastAPI, httpx and PyYAML run in Pyodide. The prelude's send() calls an app
 * through httpx's ASGITransport (FastAPI's documented way to test async code),
 * so no server or network is needed. Handlers are `async def`: Pyodide has no
 * threads, and FastAPI runs plain `def` handlers in a thread pool.
 * step(name, *inputs) records a stage, as in E11. rebuilt(df, changed) lists the Dockerfile lines (1-based) that Docker's
 * layer cache would run again after `changed` files change: a simplified model
 * (COPY sources only; "." matches everything).
 *
 * Versions checked against the docs on 2026-11-16: uv 0.13.8, actions/checkout@v7,
 * astral-sh/setup-uv@v9, docker/build-push-action@v7, compose.yaml without `version:`.
 */
const PRELUDE = `import json
import os
import httpx
import yaml
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

async def send(app, verb, url, **kw):
    t = httpx.ASGITransport(
        app=app,
        raise_app_exceptions=False)
    c = httpx.AsyncClient(
        transport=t,
        base_url="http://t")
    async with c:
        return await c.request(
            verb, url, **kw)

def step(name, *inputs):
    return f"{name}({', '.join(inputs)})"

def rebuilt(df, changed):
    out, dirty = [], False
    lines = df.strip().splitlines()
    for n, line in enumerate(lines, 1):
        op, *args = line.split()
        if op == "COPY":
            srcs = [a for a in args[:-1]
                    if not a.startswith("--")]
            if any(s == "." or s in changed
                   for s in srcs):
                dirty = True
        if dirty:
            out.append(n)
    return out`;

const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'e8-01',
    title: 'A web service',
    summary: 'An endpoint is a method on a path; FastAPI turns an async function into one with a decorator.',
    card: {
      title: 'A web service',
      text: 'A web service answers HTTP requests: a method (GET reads, POST sends data) on a path, returning a status code and a JSON body. FastAPI turns an `async def` function into an endpoint with a decorator such as `@app.get("/health")`. In these lessons `await send(app, "GET", "/health")` sends a request straight to the app, with no network.',
      code: `app = FastAPI()

@app.get("/health")
async def health():
    return {"ok": True}

r = await send(app, "GET", "/health")
print(r.status_code, r.json())`,
      output: "200 {'ok': True}",
    },
    exercises: [
      {
        id: 'e8-1-1',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `app = FastAPI()

@app.get("/hello")
async def hello():
    return {"msg": "hi"}

r = await send(app, "GET", "/hello")
print(r.json()["msg"])`,
        answer: 'hi',
        typedWrong: [{ answer: "{'msg': 'hi'}", why: 'The code prints only the "msg" field.' }],
        explain: 'FastAPI turns the returned dict into a JSON body.',
      },
      {
        id: 'e8-1-2',
        type: 'mcq',
        prompt: 'A client sends a question for the model to answer. Which method?',
        options: [
          { text: 'POST: data in the request body' },
          { text: 'GET: data in the address', why: 'GET is for reading; long text and private data do not belong in a URL.' },
          { text: 'DELETE: it uses the input up', why: 'DELETE removes a resource; asking a question creates a reply.' },
        ],
        answer: 0,
        explain: 'GET reads, POST sends data to be processed.',
      },
      {
        id: 'e8-1-3',
        type: 'predict-output',
        prompt: 'A path parameter with a type. What does this print?',
        code: `app = FastAPI()

@app.get("/x/{item_id}")
async def item(item_id: int):
    return {"double": item_id * 2}

r = await send(app, "GET", "/x/21")
print(r.json())`,
        answer: "{'double': 42}",
        options: [
          { text: "{'double': 42}" },
          { text: "{'double': '2121'}", why: 'The type hint int makes FastAPI convert "21" to the number 21.' },
          { text: "{'double': 21}", why: 'The handler doubles it.' },
        ],
        explain: 'Type hints are how FastAPI parses and checks the path.',
      },
      {
        id: 'e8-1-4',
        type: 'predict-output',
        prompt: 'The same endpoint, given letters. Type the status code.',
        code: `app = FastAPI()

@app.get("/x/{item_id}")
async def item(item_id: int):
    return {"double": item_id * 2}

r = await send(app, "GET", "/x/abc")
print(r.status_code)`,
        answer: '422',
        typedWrong: [
          { answer: '200', why: '"abc" is not an int, so FastAPI rejects it before your function runs.' },
          { answer: '500', why: 'Nothing crashed: FastAPI checked the input and refused it.' },
        ],
        explain: '422: the input does not fit the declared type.',
      },
      {
        id: 'e8-1-5',
        type: 'fill-blank',
        prompt: 'Make the endpoint answer GET requests.',
        code: `app = FastAPI()

@app.___("/health")
async def health():
    return {"ok": True}

r = await send(app, "GET", "/health")
print(r.status_code)`,
        answer: ['get'],
        distractors: [
          { text: 'post', why: 'Then a GET gets 405 Method Not Allowed.' },
          { text: 'put', why: 'Also only answers PUT: GET gets 405.' },
        ],
        expectOutput: '200',
        explain: 'The decorator names the method.',
      },
      {
        id: 'e8-1-6',
        type: 'mcq',
        prompt: 'What does a 404 status mean?',
        options: [
          { text: 'Nothing exists at that path or id' },
          { text: 'The server crashed', why: 'That is 500.' },
          { text: 'The input had the wrong type', why: 'That is 422.' },
        ],
        answer: 0,
        explain: 'Clients can tell "not found" from "broken" by the code alone.',
      },
      {
        id: 'e8-1-7',
        type: 'match-pairs',
        prompt: 'Match each status code to its meaning.',
        pairs: [
          { left: '200', right: 'OK', why: 'It worked.' },
          { left: '404', right: 'not found', why: 'No such path or item.' },
          { left: '422', right: 'invalid input', why: 'Failed validation.' },
          { left: '500', right: 'server error', why: 'A bug or crash on our side.' },
        ],
        explain: '4xx: the client\'s fault. 5xx: ours.',
      },
      {
        id: 'e8-1-8',
        type: 'run-code',
        prompt: 'Add a GET endpoint at `/ping` that returns `{"pong": True}`.',
        before: 'app = FastAPI()',
        solution: `@app.get("/ping")
async def ping():
    return {"pong": True}`,
        tests: [
          'r = await send(app, "GET", "/ping")',
          'assert r.status_code == 200, f"GET /ping should work; got {r.status_code}"',
          'assert r.json() == {"pong": True}, f"got {r.json()}"',
        ].join('\n'),
        maxLines: 3,
        placeholder: '@app.get("/ping")\nasync def ping():\n    return ...',
        explain: 'Decorator, async function, return a dict.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'e8-02',
    title: 'Request and response models',
    summary: 'A Pydantic model declares the request body; FastAPI parses it, checks it, and replies 422 if it is wrong.',
    card: {
      title: 'Request and response models',
      text: 'Declare what a request body must contain as a Pydantic model and take it as the handler\'s argument: FastAPI parses the JSON, checks the types, and replies 422 with the reason if they are wrong. `response_model` does the same for what you send back, so only declared fields leave the server.',
      code: `app = FastAPI()

class Ask(BaseModel):
    question: str
    max_words: int = 50

@app.post("/ask")
async def ask(req: Ask):
    return {"n": len(req.question)}

body = {"question": "hi"}
r = await send(app, "POST", "/ask",
               json=body)
print(r.status_code, r.json())`,
      output: "200 {'n': 2}",
    },
    exercises: [
      {
        id: 'e8-2-1',
        type: 'predict-output',
        prompt: 'The body has no `question`. Type the status code.',
        code: `app = FastAPI()

class Ask(BaseModel):
    question: str

@app.post("/ask")
async def ask(req: Ask):
    return {"ok": True}

r = await send(app, "POST", "/ask",
               json={})
print(r.status_code)`,
        answer: '422',
        typedWrong: [{ answer: '400', why: 'FastAPI\'s own validation errors are 422.' }],
        explain: 'Your function never ran: the body failed the model.',
      },
      {
        id: 'e8-2-2',
        type: 'predict-output',
        prompt: 'An optional field. Type what this prints.',
        code: `app = FastAPI()

class Ask(BaseModel):
    question: str
    max_words: int = 50

@app.post("/ask")
async def ask(req: Ask):
    return {"max": req.max_words}

body = {"question": "hi"}
r = await send(app, "POST", "/ask",
               json=body)
print(r.json()["max"])`,
        answer: '50',
        typedWrong: [{ answer: 'None', why: 'A field with a default takes that default when missing.' }],
        explain: 'Defaults make fields optional.',
      },
      {
        id: 'e8-2-3',
        type: 'predict-output',
        prompt: 'The handler returns more than the response model. What does this print?',
        code: `app = FastAPI()

class Public(BaseModel):
    name: str

@app.get("/me", response_model=Public)
async def me():
    return {"name": "Ana",
            "api_key": "sk-1"}

r = await send(app, "GET", "/me")
print(r.json())`,
        answer: "{'name': 'Ana'}",
        options: [
          { text: "{'name': 'Ana'}" },
          { text: "{'name': 'Ana', 'api_key': 'sk-1'}", why: 'response_model drops fields it does not declare.' },
          { text: "{'api_key': 'sk-1'}", why: 'name is declared, so it is kept.' },
        ],
        explain: 'A safety net against leaking internal fields.',
      },
      {
        id: 'e8-2-4',
        type: 'mcq',
        prompt: 'Why give an endpoint a response_model?',
        options: [
          { text: 'Only declared fields leave the server' },
          { text: 'It makes every endpoint faster', why: 'It adds a check; the point is a fixed, safe shape.' },
          { text: 'FastAPI requires it', why: 'It is optional, but worth it for anything public.' },
        ],
        answer: 0,
        explain: 'It also documents the shape in the automatic /docs page.',
      },
      {
        id: 'e8-2-5',
        type: 'fill-blank',
        prompt: 'Take the body as the model.',
        code: `app = FastAPI()

class Ask(BaseModel):
    question: str

@app.post("/ask")
async def ask(req: ___):
    return {"n": len(req.question)}

body = {"question": "hey"}
r = await send(app, "POST", "/ask",
               json=body)
print(r.json())`,
        answer: ['Ask'],
        distractors: [
          { text: 'dict', why: 'A plain dict has no .question attribute, so the handler crashes (500).' },
          { text: 'str', why: 'A bare str makes FastAPI look for a query parameter, not a JSON body.' },
        ],
        expectOutput: "{'n': 3}",
        explain: 'The type hint tells FastAPI what to parse and check.',
      },
      {
        id: 'e8-2-6',
        type: 'predict-output',
        prompt: 'Where was the problem? What does this print?',
        code: `app = FastAPI()

class Ask(BaseModel):
    question: str

@app.post("/ask")
async def ask(req: Ask):
    return {"ok": True}

r = await send(app, "POST", "/ask",
               json={"q": "hi"})
print(r.json()["detail"][0]["loc"])`,
        answer: "['body', 'question']",
        options: [
          { text: "['body', 'question']" },
          { text: "['body', 'q']", why: 'The error names the missing field, question; q is simply ignored.' },
          { text: "['query', 'question']", why: 'Models are read from the JSON body.' },
        ],
        explain: 'Clients get told exactly which field is wrong.',
      },
      {
        id: 'e8-2-7',
        type: 'mcq',
        prompt: 'When does FastAPI check the body against the model?',
        options: [
          { text: 'Before your function runs' },
          { text: 'After your function returns', why: 'Your function receives an already-checked object.' },
          { text: 'Only if you call .validate()', why: 'It happens automatically for every request.' },
        ],
        answer: 0,
        explain: 'Inside the handler, req.question is guaranteed to be a str.',
      },
      {
        id: 'e8-2-8',
        type: 'run-code',
        prompt: 'Define a model `Item` with a `name` (str) and a `price` (float).',
        solution: `class Item(BaseModel):
    name: str
    price: float`,
        tests: [
          'it = Item(name="pen", price=2)',
          'assert it.price == 2.0 and isinstance(it.price, float), f"price is a float; got {it.price!r}"',
          'try:',
          '    Item(name="pen", price="cheap")',
          '    raise AssertionError("price should reject \'cheap\'")',
          'except ValueError:',
          '    pass',
        ].join('\n'),
        maxLines: 3,
        placeholder: 'class Item(BaseModel):\n    ...',
        explain: 'Pydantic\'s ValidationError is a ValueError.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'e8-03',
    title: 'Status codes and errors',
    summary: 'Raise HTTPException for expected failures (404, 400, 503); 422 is automatic; a 500 means a bug.',
    card: {
      title: 'Status codes and errors',
      text: 'Signal expected failures with status codes: raise `HTTPException(404)` for a missing item, 400 for a request that is valid but unusable, 503 when a provider you depend on is down. FastAPI returns 422 for invalid input by itself; an unhandled exception becomes a 500, which should mean a bug.',
      code: `app = FastAPI()
ITEMS = {1: "pen"}

@app.get("/items/{i}")
async def get_item(i: int):
    if i not in ITEMS:
        raise HTTPException(404)
    return {"name": ITEMS[i]}

r = await send(app, "GET", "/items/9")
print(r.status_code, r.json())`,
      output: "404 {'detail': 'Not Found'}",
    },
    exercises: [
      {
        id: 'e8-3-1',
        type: 'predict-output',
        prompt: 'The same app, item 1. What does this print?',
        code: `app = FastAPI()
ITEMS = {1: "pen"}

@app.get("/items/{i}")
async def get_item(i: int):
    if i not in ITEMS:
        raise HTTPException(404)
    return {"name": ITEMS[i]}

r = await send(app, "GET", "/items/1")
print(r.status_code, r.json())`,
        answer: "200 {'name': 'pen'}",
        options: [
          { text: "200 {'name': 'pen'}" },
          { text: "404 {'detail': 'Not Found'}", why: 'Item 1 exists.' },
          { text: "200 {'name': 'ITEMS[1]'}", why: 'The value is looked up: "pen".' },
        ],
        explain: 'The happy path.',
      },
      {
        id: 'e8-3-2',
        type: 'mcq',
        prompt: 'Your /ask endpoint cannot reach the model provider. Which status?',
        options: [
          { text: '503: service unavailable' },
          { text: '400: bad request from the user', why: 'The request was fine; the failure is upstream.' },
          { text: '404: the route is not found', why: 'The endpoint exists; it cannot do its job right now.' },
        ],
        answer: 0,
        explain: 'A 5xx tells clients to retry later; a 4xx says fix your request.',
      },
      {
        id: 'e8-3-3',
        type: 'spot-bug',
        prompt: 'A missing item should give 404. Which line is wrong?',
        code: `app = FastAPI()
ITEMS = {1: "pen"}

@app.get("/items/{i}")
async def get_item(i: int):
    if i not in ITEMS:
        return {"error": "missing"}
    return {"name": ITEMS[i]}

r = await send(app, "GET", "/items/9")
code = r.status_code
assert code == 404, code`,
        error: 'AssertionError: 200',
        answer: 6,
        raiseLine: 11,
        lineWhy: {
          '0': 'The app.',
          '1': 'The data.',
          '3': 'The route is right.',
          '4': 'The handler signature is right.',
          '5': 'Checking for a missing item is right.',
          '7': 'The found case is right.',
          '9': 'The test request.',
          '10': 'Reading the status code.',
          '11': 'The test is right: missing means 404.',
        },
        explain: 'Returning a dict means 200. Raise `HTTPException(404)` instead.',
      },
      {
        id: 'e8-3-4',
        type: 'predict-output',
        prompt: 'A bug in the handler. What does this print?',
        code: `app = FastAPI()

@app.get("/ratio")
async def ratio():
    return {"r": 1 / 0}

r = await send(app, "GET", "/ratio")
print(r.status_code, r.text)`,
        answer: '500 Internal Server Error',
        options: [
          { text: '500 Internal Server Error' },
          { text: "422 {'detail': 'division by zero'}", why: 'Unhandled exceptions are hidden from clients as a plain 500.' },
          { text: "200 {'r': 0}", why: 'Dividing by zero raises; it does not return 0.' },
        ],
        explain: 'Clients see no details; the traceback goes to your logs.',
      },
      {
        id: 'e8-3-5',
        type: 'fill-blank',
        prompt: 'Report a missing item.',
        code: `app = FastAPI()

@app.get("/items/{i}")
async def get_item(i: int):
    raise HTTPException(___)

r = await send(app, "GET", "/items/3")
print(r.status_code)`,
        answer: ['404'],
        distractors: [
          { text: '200', why: 'An exception with 200 would claim success.' },
          { text: '500', why: '500 means our bug; a missing item is expected.' },
        ],
        expectOutput: '404',
        explain: 'Expected failures get 4xx codes you choose.',
      },
      {
        id: 'e8-3-6',
        type: 'mcq',
        prompt: 'The question is a valid string but empty. Which status do you raise?',
        options: [
          { text: '400: valid shape, unusable value' },
          { text: '500: it cannot be answered', why: '500 is for our own bugs.' },
          { text: '200 with an error message inside', why: 'Clients and monitoring check codes; a 200 hides the failure.' },
        ],
        answer: 0,
        explain: 'Or reject it in the model (`min_length=1`), which gives 422.',
      },
      {
        id: 'e8-3-7',
        type: 'match-pairs',
        prompt: 'Match each situation to its status code.',
        pairs: [
          { left: 'unknown order id', right: '404', why: 'Nothing at that id.' },
          { left: 'body missing a field', right: '422', why: 'FastAPI validation.' },
          { left: 'provider unreachable', right: '503', why: 'Upstream down: retry later.' },
          { left: 'bug in our code', right: '500', why: 'Unhandled exception.' },
        ],
        explain: 'The code alone tells a client what to do next.',
      },
      {
        id: 'e8-3-8',
        type: 'run-code',
        prompt: 'Write a POST `/ask` handler taking an `Ask`: raise 400 if `question` is only spaces, else return `{"ok": True}`.',
        before: `app = FastAPI()

class Ask(BaseModel):
    question: str`,
        solution: `@app.post("/ask")
async def ask(req: Ask):
    if not req.question.strip():
        raise HTTPException(400)
    return {"ok": True}`,
        tests: [
          'r = await send(app, "POST", "/ask", json={"question": "   "})',
          'assert r.status_code == 400, f"blank question: 400; got {r.status_code}"',
          'r = await send(app, "POST", "/ask", json={"question": "hi"})',
          'assert r.status_code == 200 and r.json() == {"ok": True}, f"valid question: 200; got {r.status_code}"',
        ].join('\n'),
        maxLines: 5,
        placeholder: '@app.post("/ask")\nasync def ask(req: Ask):\n    ...',
        explain: '`.strip()` turns spaces-only into "", which is falsy.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'e8-04',
    title: 'Testing the API',
    summary: 'Send requests in code and assert status and JSON: the happy path, invalid input, and each error.',
    card: {
      title: 'Testing the API',
      text: 'Test an API by sending it requests in code and checking the status and the JSON. With FastAPI, `httpx.AsyncClient(transport=ASGITransport(app=app))` calls the app directly, with no server or network, and `send` here is exactly that. Test the happy path, invalid input (422) and each error you raise.',
      code: `app = FastAPI()

@app.get("/up")
async def up():
    return {"ok": True}

async def test_up():
    r = await send(app, "GET", "/up")
    assert r.status_code == 200
    assert r.json() == {"ok": True}

await test_up()
print("passed")`,
      output: 'passed',
    },
    exercises: [
      {
        id: 'e8-4-1',
        type: 'order-lines',
        prompt: 'Put the test in order.',
        lines: [
          { text: 'app = FastAPI()', fixed: true },
          { text: '@app.get("/up")', fixed: true },
          { text: 'async def up():', fixed: true },
          { text: '    return {"ok": True}', fixed: true },
          { text: 'r = await send(app, "GET", "/up")' },
          { text: 'body = r.json()' },
          { text: 'print(r.status_code, body)' },
        ],
        expectOutput: "200 {'ok': True}",
        explain: 'Request, read the body, check (here, print) both.',
      },
      {
        id: 'e8-4-2',
        type: 'mcq',
        prompt: 'Which set of tests covers an /ask endpoint best?',
        options: [
          { text: 'Valid, missing field, blank question' },
          { text: 'One valid question, many times', why: 'Repeats test the same path; errors go unchecked.' },
          { text: 'Only the error cases', why: 'The happy path matters most of all.' },
        ],
        answer: 0,
        explain: 'Happy path, 422, and each error you raise yourself.',
      },
      {
        id: 'e8-4-3',
        type: 'spot-bug',
        prompt: 'A test of invalid input fails. Which line is wrong?',
        code: `app = FastAPI()

class Ask(BaseModel):
    question: str

@app.post("/ask")
async def ask(req: Ask):
    return {"ok": True}

r = await send(app, "POST", "/ask",
               json={})
code = r.status_code
assert code == 200, code`,
        error: 'AssertionError: 422',
        answer: 12,
        lineWhy: {
          '0': 'The app.',
          '2': 'The model.',
          '3': 'One required field.',
          '5': 'The route.',
          '6': 'The handler takes the model.',
          '7': 'Its reply.',
          '9': 'Sending an empty body on purpose.',
          '10': 'The empty body itself.',
          '11': 'Reading the status code.',
        },
        explain: 'The app is right to answer 422; the test should expect it.',
      },
      {
        id: 'e8-4-4',
        type: 'predict-output',
        prompt: 'Type what this test prints.',
        code: `app = FastAPI()

@app.get("/items/{i}")
async def item(i: int):
    raise HTTPException(404)

r = await send(app, "GET", "/items/7")
print(r.status_code == 404)`,
        answer: 'True',
        typedWrong: [{ answer: '404', why: 'It prints the comparison, which is True.' }],
        explain: 'Error paths deserve tests too.',
      },
      {
        id: 'e8-4-5',
        type: 'fill-blank',
        prompt: 'Check the status code.',
        code: `app = FastAPI()

@app.get("/up")
async def up():
    return {"ok": True}

r = await send(app, "GET", "/up")
print(r.___)`,
        answer: ['status_code'],
        distractors: [
          { text: 'json()', why: 'That is the body: {\'ok\': True}.' },
          { text: 'text', why: 'That is the raw body as text.' },
        ],
        expectOutput: '200',
        explain: 'httpx responses have .status_code, .json() and .text.',
      },
      {
        id: 'e8-4-6',
        type: 'mcq',
        prompt: 'Why test through ASGITransport rather than a running server?',
        options: [
          { text: 'Fast, with no ports or network' },
          { text: 'A server cannot be tested', why: 'It can; it is just slower and can clash over ports in CI.' },
          { text: 'It tests the Docker image too', why: 'It calls the app in-process; the image is tested separately.' },
        ],
        answer: 0,
        explain: 'Hundreds of these run in a second in CI.',
      },
      {
        id: 'e8-4-7',
        type: 'predict-output',
        prompt: 'A custom error message. What does this print?',
        code: `app = FastAPI()

@app.get("/q")
async def q():
    raise HTTPException(400, "empty")

r = await send(app, "GET", "/q")
print(r.status_code, r.json())`,
        answer: "400 {'detail': 'empty'}",
        options: [
          { text: "400 {'detail': 'empty'}" },
          { text: "400 {'error': 'empty'}", why: 'FastAPI puts the message under "detail".' },
          { text: '500 Internal Server Error', why: 'HTTPException is expected, so it becomes its own status.' },
        ],
        explain: 'Assert on detail too, so the message stays useful.',
      },
      {
        id: 'e8-4-8',
        type: 'run-code',
        prompt: 'Send GET `/items/1` to `app` and set `name` to the name in the reply.',
        before: `app = FastAPI()
ITEMS = {1: "pen"}

@app.get("/items/{i}")
async def get_item(i: int):
    return {"name": ITEMS[i]}`,
        solution: 'r = await send(app, "GET", "/items/1")\nname = r.json()["name"]',
        tests: 'assert name == "pen", f"item 1 is a pen; got {name!r}"',
        maxLines: 2,
        placeholder: 'r = await send(...)\nname = ...',
        explain: 'Await the request, then read the JSON.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'e8-05',
    title: 'Configuration and secrets',
    summary: 'Settings and secrets come from environment variables, never from the code or the repository.',
    card: {
      title: 'Configuration and secrets',
      text: 'Settings that differ between your laptop and production (API keys, model names, limits) come from environment variables: `os.environ["API_KEY"]` fails loudly if it is missing, `os.environ.get("MODEL", "small")` falls back to a default. Secrets never go in the repository: locally they sit in an untracked `.env` file, in production in the host\'s secret settings.',
      code: `os.environ["MODEL"] = "model-large"
env = os.environ
print(env.get("MODEL", "small"),
      env.get("REGION", "eu"))`,
      output: 'model-large eu',
    },
    exercises: [
      {
        id: 'e8-5-1',
        type: 'predict-output',
        prompt: 'A required setting is missing. What does this print?',
        code: `os.environ.pop("API_KEY", None)
try:
    key = os.environ["API_KEY"]
except KeyError as e:
    print("missing", e)`,
        answer: "missing 'API_KEY'",
        options: [
          { text: "missing 'API_KEY'" },
          { text: 'None', why: 'Square brackets raise KeyError; only .get returns None.' },
          { text: 'missing', why: 'The KeyError carries the missing name, printed after it.' },
        ],
        explain: 'Fail at startup, not on the first user request.',
      },
      {
        id: 'e8-5-2',
        type: 'mcq',
        prompt: 'Where does the production API key live?',
        options: [
          { text: 'In the host\'s secret settings' },
          { text: 'In config.py, in the repository', why: 'Anyone who can read the repository can use it; keys get scraped within minutes.' },
          { text: 'In the Docker image', why: 'Images are shared and cached; a key baked in leaks with them.' },
        ],
        answer: 0,
        explain: 'Injected as an environment variable at runtime.',
      },
      {
        id: 'e8-5-3',
        type: 'mcq',
        prompt: 'What happens to your local `.env` file?',
        options: [
          { text: 'It is listed in .gitignore' },
          { text: 'It is committed, so others get it', why: 'Then every secret in it is public.' },
          { text: 'It is copied into the image', why: 'Keep it out with .dockerignore too.' },
        ],
        answer: 0,
        explain: 'Commit a `.env.example` with the names but no values.',
      },
      {
        id: 'e8-5-4',
        type: 'fill-blank',
        prompt: 'Read a setting with a default.',
        code: `os.environ.pop("TIMEOUT_S", None)
t = os.environ.___("TIMEOUT_S", "30")
print(t)`,
        answer: ['get'],
        distractors: [
          { text: 'getenv', why: '`getenv` is a function in os (`os.getenv`), not a method of os.environ.' },
          { text: 'items', why: '`.items()` lists every variable; it takes no name.' },
        ],
        expectOutput: '30',
        explain: '`os.getenv("TIMEOUT_S", "30")` does the same.',
      },
      {
        id: 'e8-5-5',
        type: 'spot-bug',
        prompt: 'Which line leaks a secret?',
        code: `os.environ["API_KEY"] = "sk-test-123"
key = os.environ["API_KEY"]
log = f"calling model, key={key}"
assert "sk-" not in log, "key in log"`,
        error: 'AssertionError: key in log',
        answer: 2,
        raiseLine: 3,
        lineWhy: {
          '0': 'A test value standing in for the real key.',
          '1': 'Reading it from the environment is right.',
          '3': 'The check is right: logs are read by many people and tools.',
        },
        explain: 'Never log secrets; log a masked form such as `sk-***`.',
      },
      {
        id: 'e8-5-6',
        type: 'run-code',
        prompt: 'Set `masked` to the first 3 characters of `key` followed by `***`.',
        before: 'key = "sk-test-123"',
        solution: 'masked = key[:3] + "***"',
        tests: 'assert masked == "sk-***", f"expected sk-***; got {masked}"',
        placeholder: 'masked = ...',
        explain: 'Enough to tell keys apart in a log, useless to an attacker.',
      },
      {
        id: 'e8-5-7',
        type: 'mcq',
        prompt: 'Development should use a small model; production a large one. How?',
        options: [
          { text: 'Read MODEL from the environment' },
          { text: 'An if on the computer\'s name', why: 'Fragile; every new machine needs a code change.' },
          { text: 'Two branches of the code', why: 'The same code should run everywhere; only settings differ.' },
        ],
        answer: 0,
        explain: 'Same image, different environment variables.',
      },
      {
        id: 'e8-5-8',
        type: 'predict-output',
        prompt: 'Environment variables and numbers. Type what this prints.',
        code: `os.environ["MAX_TOKENS"] = "200"
n = os.environ["MAX_TOKENS"]
print(n + "0", int(n) + 1)`,
        answer: '2000 201',
        typedWrong: [{ answer: '2000 2001', why: 'int(n) is the number 200, so + 1 gives 201.' }],
        explain: 'Every environment variable is a string: convert it.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'e8-06',
    title: 'Reading a Dockerfile',
    summary: 'FROM a base, WORKDIR, COPY files, RUN build commands, ENV settings, CMD at start.',
    card: {
      title: 'Reading a Dockerfile',
      text: 'A Dockerfile is the recipe for an image, read top to bottom: `FROM` picks a base image, `WORKDIR` sets the folder, `COPY` brings files in, `RUN` runs a command while building, and `ENV` sets a variable. `CMD` is different: it is what runs each time a container starts. Here the Dockerfile is a Python string, so code can inspect it.',
      code: `df = """FROM python:3.12-slim
RUN pip install uv==0.13.8
WORKDIR /app
COPY . .
RUN uv sync --locked --no-dev
ENV PORT=8000
CMD ["uv", "run", "serve"]"""
for line in df.splitlines():
    print(line.split()[0], end=" ")`,
      output: 'FROM RUN WORKDIR COPY RUN ENV CMD',
    },
    exercises: [
      {
        id: 'e8-6-1',
        type: 'mcq',
        prompt: 'What does the first line give you?',
        code: `FROM python:3.12-slim
WORKDIR /app`,
        options: [
          { text: 'A small Linux image with Python 3.12' },
          { text: 'Python installed on your laptop', why: 'It is the starting image inside the container, not your machine.' },
          { text: 'Your project\'s dependencies', why: 'Those come later, from RUN uv sync.' },
        ],
        answer: 0,
        explain: '"slim" leaves out compilers and docs: smaller, fewer vulnerabilities.',
      },
      {
        id: 'e8-6-2',
        type: 'mcq',
        prompt: 'When does each line run?',
        code: `RUN uv sync --locked --no-dev
CMD ["uv", "run", "serve"]`,
        options: [
          { text: 'RUN when building; CMD at each start' },
          { text: 'Both when the container starts', why: 'RUN is baked into the image at build time.' },
          { text: 'Both when building', why: 'CMD only records what to run later.' },
        ],
        answer: 0,
        explain: 'Install once at build; start the server many times.',
      },
      {
        id: 'e8-6-3',
        type: 'match-pairs',
        prompt: 'Match each instruction to its job.',
        pairs: [
          { left: 'FROM', right: 'the base image', why: 'Where the image starts.' },
          { left: 'COPY', right: 'bring files in', why: 'From your folder into the image.' },
          { left: 'RUN', right: 'a command at build time', why: 'Its result is saved in the image.' },
          { left: 'CMD', right: 'the command at start', why: 'Runs in every container.' },
        ],
        explain: 'Enough to read most Dockerfiles you will meet.',
      },
      {
        id: 'e8-6-4',
        type: 'predict-output',
        prompt: 'Type how many build commands this Dockerfile runs.',
        code: `df = """FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install uv==0.13.8
RUN uv sync --locked
CMD ["uv", "run", "serve"]"""
lines = df.splitlines()
ops = [l.split()[0] for l in lines]
print(ops.count("RUN"))`,
        answer: '2',
        typedWrong: [{ answer: '3', why: 'CMD is not a build command: it runs when a container starts.' }],
        explain: 'Two RUN lines.',
      },
      {
        id: 'e8-6-5',
        type: 'mcq',
        prompt: 'The container runs, but http://localhost:8000 on your laptop gets no answer. Most likely?',
        options: [
          { text: 'Port not published, or app on 127.0.0.1' },
          { text: 'The image is too large to run', why: 'Size does not stop a server answering.' },
          { text: 'FROM picks the wrong Python version', why: 'Then it would not start at all.' },
        ],
        answer: 0,
        explain: 'Run with `-p 8000:8000`, and bind the server to 0.0.0.0 inside the container.',
      },
      {
        id: 'e8-6-6',
        type: 'mcq',
        prompt: 'This image fails at start with "ModuleNotFoundError: app". What is missing?',
        code: `FROM python:3.12-slim
RUN pip install uv==0.13.8
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --locked
CMD ["uv", "run", "serve"]`,
        options: [
          { text: 'COPY . . to bring in the code' },
          { text: 'A second FROM line for the app', why: 'One base is enough; the code was never copied.' },
          { text: 'EXPOSE 8000', why: 'EXPOSE only documents a port; it cannot add missing code.' },
        ],
        answer: 0,
        explain: 'Only the dependency files were copied.',
      },
      {
        id: 'e8-6-7',
        type: 'mcq',
        prompt: 'Why pin `uv==0.13.8` rather than install the latest?',
        options: [
          { text: 'The same build every time' },
          { text: 'Older versions are faster', why: 'Speed is not the reason; repeatability is.' },
          { text: 'pip cannot install the latest', why: 'It can; an unpinned build just changes under you.' },
        ],
        answer: 0,
        explain: 'Pin tools and base images; upgrade on purpose.',
      },
      {
        id: 'e8-6-8',
        type: 'run-code',
        prompt: 'Set `base` to the image named on the FROM line of `df`.',
        before: `df = """FROM python:3.12-slim
WORKDIR /app"""`,
        solution: 'base = df.splitlines()[0].split()[1]',
        tests: 'assert base == "python:3.12-slim", f"got {base!r}"',
        placeholder: 'base = ...',
        explain: 'First line, second word.',
      },
    ],
  },
];

export const e8: Unit = {
  id: 'E8',
  track: 'engineering',
  title: 'Shipping a service',
  blurb: 'A FastAPI endpoint with request and response models and tests; settings and secrets; a Dockerfile line by line; docker compose; a GitHub Actions pipeline; deploying to a managed host.',
  prelude: PRELUDE,
  lessons: [...lessons, ...e8More],
  labs: e8Labs,
  library: e8Library,
};
