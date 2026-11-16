import type { Lab } from '../schema';

const DIFFERS =
  'FastAPI and Pydantic are the real libraries, running in your browser. Requests go to the app in-process through httpx\'s ASGITransport (as in FastAPI\'s async tests), not over a network, and handlers are `async def` because the browser has no threads. Docker and GitHub Actions cannot run here, so their files are read as text and YAML.';

/*
 * Unit E8 labs. Lab 1 builds an /ask endpoint with scaffolding: models,
 * handler, errors, its tests. Lab 2 starts every step from an empty function:
 * settings from the environment, an app factory, a smoke test, a Dockerfile
 * checker, CI commands from a workflow, image tags.
 */
export const e8Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'e8-lab-1',
    title: 'An /ask endpoint',
    intro: 'Build the endpoint an LLM service is made around: a request model, a response model, the handler with its errors, a health check, and the tests that prove it.',
    summary: 'You built and tested a typed FastAPI endpoint with proper status codes.',
    minutes: 12,
    unlockAfter: 'e8-04',
    differs: DIFFERS,
    given: ['app = FastAPI()', '', 'def answer(q):', '    return "echo: " + q'].join('\n'),
    steps: [
      {
        goal: 'Finish `Ask`: a required `question` and an optional `max_words` that defaults to 50.',
        starter: 'class Ask(BaseModel):\n    question: str\n    max_words: int = ___',
        solution: 'class Ask(BaseModel):\n    question: str\n    max_words: int = 50',
        tests: 'assert Ask(question="hi").max_words == 50, "max_words defaults to 50"\nassert Ask(question="hi", max_words=9).max_words == 9, "and can be set"',
        hints: ['A default value makes a field optional.', 'class Ask(BaseModel):\n    question: str\n    max_words: int = ___'],
      },
      {
        goal: 'Finish `Reply`: an `answer` (str) and a `words` count (int).',
        starter: 'class Reply(BaseModel):\n    answer: str\n    words: ___',
        solution: 'class Reply(BaseModel):\n    answer: str\n    words: int',
        tests: 'r = Reply(answer="a b", words=2)\nassert r.words == 2 and isinstance(r.words, int), "words is an int"',
        hints: ['A count is a whole number.', 'class Reply(BaseModel):\n    answer: str\n    words: ___'],
      },
      {
        goal: 'Finish the POST `/ask` handler: 400 for a blank question, otherwise a `Reply` built from `answer()`.',
        starter:
          '@app.post("/ask",\n          response_model=Reply)\nasync def ask(req: Ask):\n    if not req.question.strip():\n        raise HTTPException(___)\n    text = answer(req.question)\n    n = len(text.split())\n    return Reply(answer=text,\n                 words=___)',
        solution:
          '@app.post("/ask",\n          response_model=Reply)\nasync def ask(req: Ask):\n    if not req.question.strip():\n        raise HTTPException(400)\n    text = answer(req.question)\n    n = len(text.split())\n    return Reply(answer=text,\n                 words=n)',
        tests: [
          'r = await send(app, "POST", "/ask", json={"question": "hi there"})',
          'assert r.status_code == 200, f"valid question: 200; got {r.status_code}"',
          'assert r.json() == {"answer": "echo: hi there", "words": 3}, f"got {r.json()}"',
          'r = await send(app, "POST", "/ask", json={"question": "  "})',
          'assert r.status_code == 400, f"blank question: 400; got {r.status_code}"',
        ].join('\n'),
        hints: [
          'A blank question is valid JSON but unusable: 400. words is the count n.',
          '@app.post("/ask",\n          response_model=Reply)\nasync def ask(req: Ask):\n    if not req.question.strip():\n        raise HTTPException(___)\n    text = answer(req.question)\n    n = len(text.split())\n    return Reply(answer=text,\n                 words=___)',
        ],
      },
      {
        goal: 'Finish `check()`: send a valid question, an empty body and a blank question, and return their three status codes.',
        starter:
          'async def check():\n    bodies = [{"question": "hi"}, {},\n              {"question": " "}]\n    codes = []\n    for b in bodies:\n        r = await send(\n            app, "POST", "/ask",\n            json=b)\n        codes.append(r.___)\n    return codes',
        solution:
          'async def check():\n    bodies = [{"question": "hi"}, {},\n              {"question": " "}]\n    codes = []\n    for b in bodies:\n        r = await send(\n            app, "POST", "/ask",\n            json=b)\n        codes.append(r.status_code)\n    return codes',
        tests: 'got = await check()\nassert got == [200, 422, 400], f"valid, missing field, blank: [200, 422, 400]; got {got}"',
        hints: ['Each response has its status code as an attribute.', 'async def check():\n    bodies = [{"question": "hi"}, {},\n              {"question": " "}]\n    codes = []\n    for b in bodies:\n        r = await send(\n            app, "POST", "/ask",\n            json=b)\n        codes.append(r.___)\n    return codes'],
        explain: 'Happy path, validation, and your own error: one test each.',
      },
      {
        goal: 'Add GET `/health` returning `{"ok": True}`.',
        starter: '@app.get("/health")\nasync def health():\n    return ___',
        solution: '@app.get("/health")\nasync def health():\n    return {"ok": True}',
        tests: 'r = await send(app, "GET", "/health")\nassert r.status_code == 200 and r.json() == {"ok": True}, f"got {r.status_code} {r.text}"',
        hints: ['Return a dict; FastAPI makes it JSON.', '@app.get("/health")\nasync def health():\n    return ___'],
        explain: 'The host will poll this before sending traffic.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'e8-lab-2',
    title: 'Ready to ship',
    intro:
      'Write the pieces around a service that make it shippable, each from an empty function: settings from the environment, an app factory, a smoke test, a Dockerfile checker, the commands a CI workflow runs, and image tags.',
    summary: 'You wrote the glue that takes a service from your laptop to a host.',
    minutes: 18,
    unlockAfter: 'e8-11',
    differs: DIFFERS,
    given: ['class Ask(BaseModel):', '    question: str'].join('\n'),
    steps: [
      {
        goal: 'Write `load_settings(env)`: from a dict of environment variables return `{"model", "max_tokens", "api_key"}`. MODEL defaults to "small", MAX_TOKENS to 200 (as an int); API_KEY is required, so a missing key raises KeyError.',
        starter: 'def load_settings(env):\n    pass',
        solution:
          'def load_settings(env):\n    model = env.get("MODEL", "small")\n    raw = env.get("MAX_TOKENS", "200")\n    return {"model": model,\n            "max_tokens": int(raw),\n            "api_key": env["API_KEY"]}',
        tests: [
          's = load_settings({"API_KEY": "sk-test-1"})',
          'assert s == {"model": "small", "max_tokens": 200, "api_key": "sk-test-1"}, f"defaults; got {s}"',
          's = load_settings({"API_KEY": "k", "MODEL": "big", "MAX_TOKENS": "50"})',
          'assert s["model"] == "big" and s["max_tokens"] == 50, f"read and convert; got {s}"',
          'try:',
          '    load_settings({})',
          '    raise AssertionError("a missing API_KEY should raise KeyError")',
          'except KeyError:',
          '    pass',
        ].join('\n'),
        hints: [
          '.get with a default for optional settings, square brackets for the required one, int() for the number.',
          'def load_settings(env):\n    model = env.get("MODEL", ___)\n    raw = env.get("MAX_TOKENS", "200")\n    return {"model": model,\n            "max_tokens": int(raw),\n            "api_key": env[___]}',
        ],
        explain: 'Pass os.environ in production and a plain dict in tests.',
      },
      {
        goal: 'Write `make_app(model)`: a FastAPI app with GET `/health` (`{"ok": True}`) and POST `/ask` taking an `Ask`, raising 400 for a blank question and otherwise returning `{"answer": model(question)}`.',
        starter: 'def make_app(model):\n    pass',
        solution:
          'def make_app(model):\n    app = FastAPI()\n\n    @app.get("/health")\n    async def health():\n        return {"ok": True}\n\n    @app.post("/ask")\n    async def ask(req: Ask):\n        q = req.question\n        if not q.strip():\n            raise HTTPException(400)\n        return {"answer": model(q)}\n\n    return app',
        tests: [
          'app = make_app(str.upper)',
          'r = await send(app, "GET", "/health")',
          'assert r.json() == {"ok": True}, f"/health: got {r.status_code} {r.text}"',
          'r = await send(app, "POST", "/ask", json={"question": "hi"})',
          'assert r.json() == {"answer": "HI"}, f"/ask should call model; got {r.text}"',
          'r = await send(app, "POST", "/ask", json={"question": ""})',
          'assert r.status_code == 400, f"blank: 400; got {r.status_code}"',
        ].join('\n'),
        hints: [
          'Create the app inside the function, define both routes on it, return it. Passing the model in makes it easy to test.',
          'def make_app(model):\n    app = FastAPI()\n\n    @app.get("/health")\n    async def health():\n        return {"ok": True}\n\n    @app.post("/ask")\n    async def ask(req: Ask):\n        q = req.question\n        if not q.strip():\n            raise HTTPException(___)\n        return {"answer": model(___)}\n\n    return app',
        ],
      },
      {
        goal: 'Write `async def smoke(app)`: check GET /health is 200, a valid /ask is 200, a blank /ask is 400 and an empty body is 422. Return a list naming each check that failed (empty if all pass).',
        starter: 'async def smoke(app):\n    pass',
        solution:
          'async def smoke(app):\n    failed = []\n    r = await send(app, "GET",\n                   "/health")\n    if r.status_code != 200:\n        failed.append("health")\n    cases = [("valid", "hi", 200),\n             ("blank", " ", 400)]\n    for name, q, want in cases:\n        body = {"question": q}\n        r = await send(\n            app, "POST", "/ask",\n            json=body)\n        if r.status_code != want:\n            failed.append(name)\n    r = await send(app, "POST",\n                   "/ask", json={})\n    if r.status_code != 422:\n        failed.append("empty")\n    return failed',
        tests: [
          'assert await smoke(make_app(str.upper)) == [], "a correct app passes every check"',
          'bad = FastAPI()',
          '@bad.post("/ask")',
          'async def ask(req: Ask):',
          '    return {"answer": "x"}',
          'got = await smoke(bad)',
          'assert got == ["health", "blank"], f"no /health and no blank check: [\'health\', \'blank\']; got {got}"',
        ].join('\n'),
        hints: [
          'Check /health, then the two questions in a loop, then the empty body; collect the names that fail.',
          'async def smoke(app):\n    failed = []\n    r = await send(app, "GET",\n                   "/health")\n    if r.status_code != 200:\n        failed.append("health")\n    cases = [("valid", "hi", 200),\n             ("blank", " ", ___)]\n    for name, q, want in cases:\n        body = {"question": q}\n        r = await send(\n            app, "POST", "/ask",\n            json=body)\n        if r.status_code != want:\n            failed.append(name)\n    r = await send(app, "POST",\n                   "/ask", json={})\n    if r.status_code != ___:\n        failed.append("empty")\n    return failed',
        ],
        explain: 'Run this against every new deploy before switching traffic.',
      },
      {
        goal: 'Write `docker_problems(df)`: return a list of problems found in a Dockerfile text: "no FROM" if the first line is not FROM, "code first" if `COPY . .` comes before the first `uv sync`, and "no CMD" if no line starts with CMD.',
        starter: 'def docker_problems(df):\n    pass',
        solution:
          'def docker_problems(df):\n    lines = df.strip().splitlines()\n    ops = [l.split()[0]\n           for l in lines]\n    out = []\n    if ops[0] != "FROM":\n        out.append("no FROM")\n    code = 99\n    if "COPY . ." in lines:\n        code = lines.index("COPY . .")\n    sync = 99\n    for i, l in enumerate(lines):\n        if "uv sync" in l:\n            sync = i\n            break\n    if code < sync:\n        out.append("code first")\n    if "CMD" not in ops:\n        out.append("no CMD")\n    return out',
        tests: [
          'good = "FROM python:3.12-slim\\nCOPY uv.lock ./\\nRUN uv sync --locked\\nCOPY . .\\nCMD [\\"uv\\", \\"run\\", \\"serve\\"]"',
          'assert docker_problems(good) == [], f"a good file has no problems; got {docker_problems(good)}"',
          'bad = "WORKDIR /app\\nCOPY . .\\nRUN uv sync --locked"',
          'got = docker_problems(bad)',
          'assert got == ["no FROM", "code first", "no CMD"], f"got {got}"',
        ].join('\n'),
        hints: [
          'Split into lines and first words; find the line index of "COPY . ." and of the first "uv sync"; compare.',
          'def docker_problems(df):\n    lines = df.strip().splitlines()\n    ops = [l.split()[0]\n           for l in lines]\n    out = []\n    if ops[0] != ___:\n        out.append("no FROM")\n    code = 99\n    if "COPY . ." in lines:\n        code = lines.index("COPY . .")\n    sync = 99\n    for i, l in enumerate(lines):\n        if "uv sync" in l:\n            sync = i\n            break\n    if code < sync:\n        out.append("code first")\n    if ___ not in ops:\n        out.append("no CMD")\n    return out',
        ],
        explain: 'Real linters such as hadolint check many more rules the same way.',
      },
      {
        goal: 'Write `ci_commands(text)`: parse a workflow (YAML text) and return every `run` command, job by job, in order.',
        starter: 'def ci_commands(text):\n    pass',
        solution:
          'def ci_commands(text):\n    wf = yaml.safe_load(text)\n    out = []\n    for job in wf["jobs"].values():\n        for s in job.get("steps", []):\n            if "run" in s:\n                out.append(s["run"])\n    return out',
        tests: [
          'text = "jobs:\\n  test:\\n    steps:\\n      - uses: actions/checkout@v7\\n      - run: uv run pytest\\n  image:\\n    steps:\\n      - run: docker build -t api ."',
          'got = ci_commands(text)',
          'assert got == ["uv run pytest", "docker build -t api ."], f"got {got}"',
        ].join('\n'),
        hints: [
          'safe_load, then loop over jobs and their steps, keeping steps that have "run".',
          'def ci_commands(text):\n    wf = yaml.safe_load(text)\n    out = []\n    for job in wf["jobs"].___():\n        for s in job.get("steps", []):\n            if ___ in s:\n                out.append(s["run"])\n    return out',
        ],
      },
      {
        goal: 'Write `image_tags(name, sha, branch)`: always `name:<first 7 of sha>`, plus `name:latest` when the branch is main.',
        starter: 'def image_tags(name, sha, branch):\n    pass',
        solution:
          'def image_tags(name, sha, branch):\n    tags = [f"{name}:{sha[:7]}"]\n    if branch == "main":\n        tags.append(f"{name}:latest")\n    return tags',
        tests: [
          'assert image_tags("api", "3f9c2e71ab", "main") == ["api:3f9c2e7", "api:latest"], "main gets both tags"',
          'assert image_tags("api", "3f9c2e71ab", "fix-x") == ["api:3f9c2e7"], "other branches: the commit tag only"',
        ].join('\n'),
        hints: ['A list with the commit tag; append latest only for main.', 'def image_tags(name, sha, branch):\n    tags = [f"{name}:{sha[:___]}"]\n    if branch == ___:\n        tags.append(f"{name}:latest")\n    return tags'],
        explain: 'Deploy by commit tag, so a rollback names an exact version.',
      },
    ],
  },
];
