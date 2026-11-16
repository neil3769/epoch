import type { Lesson } from '../schema';

/* E8 lessons 7 to 12: layers and caching (the prelude's rebuilt()), docker
 * compose and GitHub Actions read through PyYAML, a CI pipeline, deploying to
 * a managed host, and the checkpoint. */

const GOOD = `df = """FROM python:3.12-slim
RUN pip install uv==0.13.8
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev
COPY . .
CMD ["uv", "run", "serve"]"""`;

const BAD = `df = """FROM python:3.12-slim
RUN pip install uv==0.13.8
COPY . .
RUN uv sync --locked --no-dev
CMD ["uv", "run", "serve"]"""`;

const CI = `wf = yaml.safe_load("""
name: ci
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: astral-sh/setup-uv@v9
      - run: uv sync --locked
      - run: uv run ruff check
      - run: uv run pytest
""")`;

export const e8More: Lesson[] = [
  // ------------------------------------------------------------------ 7
  {
    id: 'e8-07',
    title: 'Layers and caching',
    summary: 'Each line is a cached layer; once one changes, everything after reruns. Copy dependency files first, code last.',
    card: {
      title: 'Layers and caching',
      text: 'Each Dockerfile line makes a cached layer, and a rebuild reuses layers until one changes; from there on, every line runs again. So copy the dependency files and install first, then copy the code: editing code then skips the slow install. Here `rebuilt(df, changed)` lists the line numbers Docker would run again.',
      code: `${GOOD}
print(rebuilt(df, ["app.py"]))`,
      output: '[5, 6]',
    },
    exercises: [
      {
        id: 'e8-7-1',
        type: 'predict-output',
        prompt: 'The code is copied before installing. You edit app.py. What does this print?',
        code: `${BAD}
print(rebuilt(df, ["app.py"]))`,
        answer: '[3, 4, 5]',
        options: [
          { text: '[3, 4, 5]' },
          { text: '[5]', why: 'COPY . . on line 3 includes app.py, so line 3 and everything after rerun.' },
          { text: '[1, 2, 3, 4, 5]', why: 'Lines before the first change stay cached.' },
        ],
        explain: 'Every code edit reinstalls every dependency: slow builds.',
      },
      {
        id: 'e8-7-2',
        type: 'predict-output',
        prompt: 'The good order. You add a dependency, so uv.lock changes. What does this print?',
        code: `${GOOD}
print(rebuilt(df, ["uv.lock"]))`,
        answer: '[3, 4, 5, 6]',
        options: [
          { text: '[3, 4, 5, 6]' },
          { text: '[5, 6]', why: 'uv.lock is copied on line 3, so the install reruns too.' },
          { text: '[4]', why: 'Everything after the first changed layer reruns.' },
        ],
        explain: 'Correct: new dependencies need a new install.',
      },
      {
        id: 'e8-7-3',
        type: 'mcq',
        prompt: 'Why copy pyproject.toml and uv.lock before the rest of the code?',
        options: [
          { text: 'Code edits then skip the install' },
          { text: 'uv needs them in a separate folder', why: 'Same folder; the order is about caching.' },
          { text: 'The image ends up smaller', why: 'Same files either way; builds are just faster.' },
        ],
        answer: 0,
        explain: 'Dependencies change rarely; code changes all the time.',
      },
      {
        id: 'e8-7-4',
        type: 'fill-blank',
        prompt: 'Copy only the dependency files on line 3.',
        code: `df = """FROM python:3.12-slim
RUN pip install uv==0.13.8
COPY ___ ./
RUN uv sync --locked --no-dev
COPY . .
CMD ["uv", "run", "serve"]"""
print(rebuilt(df, ["app.py"]))`,
        answer: ['pyproject.toml uv.lock'],
        distractors: [
          { text: '.', why: 'Copying everything first means any edit reruns the install.' },
          { text: 'app.py', why: 'Then editing app.py reruns the install.' },
        ],
        expectOutput: '[5, 6]',
        explain: 'An app.py edit now reruns only the last two lines.',
      },
      {
        id: 'e8-7-5',
        type: 'mcq',
        prompt: 'What belongs in `.dockerignore`?',
        options: [
          { text: '.venv, .git and .env' },
          { text: 'pyproject.toml and uv.lock', why: 'The build needs those to install dependencies.' },
          { text: 'The source code', why: 'The image needs the code to run it.' },
        ],
        answer: 0,
        explain: 'Smaller, faster builds, and no secrets in the image.',
      },
      {
        id: 'e8-7-6',
        type: 'predict-output',
        prompt: 'You edit only README.md. What does this print?',
        code: `${GOOD}
print(rebuilt(df, ["README.md"]))`,
        answer: '[5, 6]',
        options: [
          { text: '[5, 6]' },
          { text: '[]', why: 'COPY . . includes README.md, so its layer changes.' },
          { text: '[3, 4, 5, 6]', why: 'README.md is not copied on line 3.' },
        ],
        explain: 'Add files the image does not need to .dockerignore and they stop busting the cache.',
      },
      {
        id: 'e8-7-7',
        type: 'mcq',
        prompt: 'A teammate\'s image contains the production `.env` file. How did it get there?',
        options: [
          { text: 'COPY . . with no .dockerignore entry' },
          { text: 'ENV lines copy .env automatically', why: 'ENV sets one variable; it reads no files.' },
          { text: 'The base image included it', why: 'The base image cannot know your files.' },
        ],
        answer: 0,
        explain: 'Anyone who pulls the image can read it: rotate the keys.',
      },
      {
        id: 'e8-7-8',
        type: 'run-code',
        prompt: 'Set `n` to how many lines rerun in this Dockerfile when app.py changes.',
        before: BAD,
        solution: 'n = len(rebuilt(df, ["app.py"]))',
        tests: 'assert n == 3, f"lines 3, 4 and 5 rerun; got {n}"',
        placeholder: 'n = ...',
        explain: 'Three, including the install: the order to fix.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 'e8-08',
    title: 'docker compose',
    summary: 'compose.yaml runs several containers together; services reach each other by service name.',
    card: {
      title: 'docker compose',
      text: '`compose.yaml` describes containers that run together, such as your API and a database: each service has an `image` or a `build`, plus `ports`, `environment` and `depends_on`. `docker compose up` starts them on one network where services reach each other by name (`db:5432`, not `localhost`). The old top-level `version:` key is obsolete.',
      code: `c = yaml.safe_load("""
services:
  api:
    build: .
    ports: ["8000:8000"]
    depends_on: [db]
  db:
    image: postgres:18
""")
print(list(c["services"]))`,
      output: "['api', 'db']",
    },
    exercises: [
      {
        id: 'e8-8-1',
        type: 'mcq',
        prompt: 'In `ports: ["8080:8000"]`, which number is on your laptop?',
        options: [
          { text: '8080: host first, container second' },
          { text: '8000: the container side first', why: 'The order is HOST:CONTAINER.' },
          { text: 'Both: they must match', why: 'They can differ; that is the point of mapping.' },
        ],
        answer: 0,
        explain: 'Open http://localhost:8080; the app listens on 8000 inside.',
      },
      {
        id: 'e8-8-2',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `c = yaml.safe_load("""
services:
  api:
    build: .
    depends_on: [db, cache]
  db:
    image: postgres:18
  cache:
    image: redis:8
""")
api = c["services"]["api"]
print(api["depends_on"])`,
        answer: "['db', 'cache']",
        options: [
          { text: "['db', 'cache']" },
          { text: "['api', 'db', 'cache']", why: 'That would be the list of services; api depends on two.' },
          { text: "'db, cache'", why: 'YAML\'s [a, b] is a list.' },
        ],
        explain: 'Compose starts db and cache before api.',
      },
      {
        id: 'e8-8-3',
        type: 'mcq',
        prompt: 'Inside compose, what host does the API use to reach the database service `db`?',
        options: [
          { text: 'db' },
          { text: 'localhost', why: 'Inside the api container, localhost is the api container itself.' },
          { text: 'Your laptop\'s IP address', why: 'Services talk over compose\'s own network, by name.' },
        ],
        answer: 0,
        explain: 'For example DATABASE_URL=postgresql://db:5432/app.',
      },
      {
        id: 'e8-8-4',
        type: 'mcq',
        prompt: 'An old compose file starts with `version: "3.8"`. What now?',
        options: [
          { text: 'Delete it: it is obsolete' },
          { text: 'Upgrade it to version 4', why: 'There is no version to set: Compose ignores it and warns.' },
          { text: 'Keep it: it is required', why: 'The current spec does not need it.' },
        ],
        answer: 0,
        explain: 'Also prefer the file name compose.yaml.',
      },
      {
        id: 'e8-8-5',
        type: 'fill-blank',
        prompt: 'Point the API at the database service.',
        code: `c = yaml.safe_load("""
services:
  api:
    environment:
      DB_HOST: ___
  db:
    image: postgres:18
""")
api = c["services"]["api"]
env = api["environment"]
print(env["DB_HOST"] in c["services"])`,
        answer: ['db'],
        distractors: [
          { text: 'localhost', why: 'That is the api container itself, not the database.' },
          { text: 'postgres', why: 'That is the image name; the service is called db.' },
        ],
        expectOutput: 'True',
        explain: 'Use the service name as the host.',
      },
      {
        id: 'e8-8-6',
        type: 'mcq',
        prompt: 'The API starts before Postgres is ready and crashes. `depends_on: [db]` is set. Why?',
        options: [
          { text: 'It waits for start, not readiness' },
          { text: 'depends_on is ignored by Compose', why: 'It sets the start order; it just does not wait for health.' },
          { text: 'The ports are wrong', why: 'The crash is about timing, not ports.' },
        ],
        answer: 0,
        explain: 'Add a healthcheck to db and `condition: service_healthy`, and retry connections.',
      },
      {
        id: 'e8-8-7',
        type: 'run-code',
        prompt: 'Set `host_port` to the host side of the api service\'s first port mapping, as a string.',
        before: `c = yaml.safe_load("""
services:
  api:
    ports: ["8080:8000"]
""")`,
        solution: 'p = c["services"]["api"]["ports"][0]\nhost_port = p.split(":")[0]',
        tests: 'assert host_port == "8080", f"host first: 8080; got {host_port!r}"',
        maxLines: 2,
        placeholder: 'p = ...\nhost_port = ...',
        explain: 'Quote port mappings in YAML so "80:80"-style values stay strings.',
      },
      {
        id: 'e8-8-8',
        type: 'mcq',
        prompt: 'Where does POSTGRES_PASSWORD come from in compose?',
        options: [
          { text: 'An untracked .env file Compose reads' },
          { text: 'Typed into compose.yaml, committed', why: 'Then it is in the repository for everyone.' },
          { text: 'The postgres image', why: 'The image expects you to set it.' },
        ],
        answer: 0,
        explain: 'Compose substitutes ${POSTGRES_PASSWORD} from .env or the shell.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 'e8-09',
    title: 'GitHub Actions',
    summary: 'A workflow file says when it runs and which jobs; each job runs steps that use an action or run a command.',
    card: {
      title: 'GitHub Actions',
      text: 'A workflow is a YAML file in `.github/workflows/`: `on` says when it runs (push, pull_request), and `jobs` run their `steps` on a fresh machine (`runs-on: ubuntu-latest`). Each step either `uses` a published action, such as `actions/checkout@v7`, or `run`s a shell command.',
      code: `${CI}
steps = wf["jobs"]["test"]["steps"]
print(len(steps), steps[0])`,
      output: "5 {'uses': 'actions/checkout@v7'}",
    },
    exercises: [
      {
        id: 'e8-9-1',
        type: 'mcq',
        prompt: 'Why is `actions/checkout` the first step?',
        options: [
          { text: 'The machine starts without your code' },
          { text: 'It checks the code for errors', why: 'It downloads the repository; linting comes later.' },
          { text: 'It is optional decoration', why: 'Without it, uv sync finds no project.' },
        ],
        answer: 0,
        explain: 'Every job starts on a clean machine.',
      },
      {
        id: 'e8-9-2',
        type: 'predict-output',
        prompt: 'Which steps run commands? What does this print?',
        code: `${CI}
steps = wf["jobs"]["test"]["steps"]
print([s["run"] for s in steps
       if "run" in s][-1])`,
        answer: 'uv run pytest',
        options: [
          { text: 'uv run pytest' },
          { text: 'astral-sh/setup-uv@v9', why: 'That step uses an action; it has no run.' },
          { text: 'uv sync --locked', why: '[-1] is the last run step.' },
        ],
        explain: 'Tests run last, after lint.',
      },
      {
        id: 'e8-9-3',
        type: 'mcq',
        prompt: 'What does `@v7` in `actions/checkout@v7` do?',
        options: [
          { text: 'Pins the action\'s major version' },
          { text: 'Picks Python version 3.7 for it', why: 'It is the action\'s version, not Python\'s.' },
          { text: 'Runs the step seven times', why: 'It is a version tag.' },
        ],
        answer: 0,
        explain: 'Pin versions so a new release cannot break your pipeline unannounced.',
      },
      {
        id: 'e8-9-4',
        type: 'mcq',
        prompt: 'A step needs an API key. How does the workflow get it?',
        code: `- run: uv run pytest
  env:
    API_KEY: \${{ secrets.API_KEY }}`,
        options: [
          { text: 'From the repository\'s secrets' },
          { text: 'From a file in the repository', why: 'secrets.* is stored in GitHub settings, not in files.' },
          { text: 'GitHub makes one up', why: 'You add it under Settings → Secrets and variables → Actions.' },
        ],
        answer: 0,
        explain: 'GitHub masks secret values in the logs.',
      },
      {
        id: 'e8-9-5',
        type: 'predict-output',
        prompt: 'Type the machine this job runs on.',
        code: `${CI}
print(wf["jobs"]["test"]["runs-on"])`,
        answer: 'ubuntu-latest',
        typedWrong: [{ answer: 'test', why: '"test" is the job\'s name; runs-on names the machine.' }],
        explain: 'A fresh Linux machine for every run.',
      },
      {
        id: 'e8-9-6',
        type: 'mcq',
        prompt: 'What happens to the job if `uv run ruff check` fails?',
        options: [
          { text: 'It stops and is marked failed' },
          { text: 'It continues to pytest', why: 'Steps stop at the first failure unless told otherwise.' },
          { text: 'GitHub retries it forever', why: 'There are no automatic retries; you fix and push.' },
        ],
        answer: 0,
        explain: 'A failed check blocks the pull request (with branch protection).',
      },
      {
        id: 'e8-9-7',
        type: 'run-code',
        prompt: 'Set `actions` to the list of `uses` values in the test job, in order.',
        before: CI,
        solution: 'steps = wf["jobs"]["test"]["steps"]\nactions = [s["uses"] for s in steps\n           if "uses" in s]',
        tests: 'assert actions == ["actions/checkout@v7", "astral-sh/setup-uv@v9"], f"got {actions}"',
        maxLines: 3,
        placeholder: 'steps = ...\nactions = ...',
        explain: 'Two actions, then three commands.',
      },
      {
        id: 'e8-9-8',
        type: 'match-pairs',
        prompt: 'Match each key to its job.',
        pairs: [
          { left: 'on', right: 'when the workflow runs', why: 'push, pull_request, a schedule…' },
          { left: 'runs-on', right: 'which machine', why: 'For example ubuntu-latest.' },
          { left: 'uses', right: 'a published action', why: 'Reusable steps, pinned by version.' },
          { left: 'run', right: 'a shell command', why: 'Anything you would type in a terminal.' },
        ],
        explain: 'Four keys cover most workflows.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 'e8-10',
    title: 'A CI pipeline',
    summary: 'Lint, test, then build the image on every push; publish images only from main.',
    card: {
      title: 'A CI pipeline',
      text: 'A typical pipeline checks out the code, installs uv, syncs the locked dependencies, runs `ruff check` and `pytest`, then builds the Docker image; any failing step fails the pull request. A second job with `needs: test` builds only after the tests pass, and pushes images (with `docker/build-push-action@v7`) only from main.',
      code: `wf = yaml.safe_load("""
jobs:
  test:
    runs-on: ubuntu-latest
  image:
    needs: test
    runs-on: ubuntu-latest
""")
print(wf["jobs"]["image"]["needs"])`,
      output: 'test',
    },
    exercises: [
      {
        id: 'e8-10-1',
        type: 'mcq',
        prompt: 'Why lint and test before building the image?',
        options: [
          { text: 'Fail fast, before the slow steps' },
          { text: 'Docker needs the lint report', why: 'The build does not read it; order is about speed and gating.' },
          { text: 'GitHub requires that order', why: 'Any order is allowed; this one wastes the least time.' },
        ],
        answer: 0,
        explain: 'Seconds to find a lint error; minutes to build an image.',
      },
      {
        id: 'e8-10-2',
        type: 'predict-output',
        prompt: 'Does this pipeline install exactly the locked versions? Type what this prints.',
        code: `${CI}
steps = wf["jobs"]["test"]["steps"]
runs = [s.get("run", "")
        for s in steps]
ok = ["--locked" in r for r in runs]
print(any(ok))`,
        answer: 'True',
        typedWrong: [{ answer: 'False', why: 'The third step runs `uv sync --locked`.' }],
        explain: '--locked fails the build if uv.lock is out of date, instead of quietly changing versions.',
      },
      {
        id: 'e8-10-3',
        type: 'mcq',
        prompt: 'Tests pass on your laptop and fail in CI with "ModuleNotFoundError: httpx". Most likely?',
        options: [
          { text: 'httpx was never declared' },
          { text: 'CI machines cannot install httpx', why: 'They can install anything that is declared.' },
          { text: 'pytest is broken in CI', why: 'It ran and found a missing module: a dependency problem.' },
        ],
        answer: 0,
        explain: '`uv add httpx` records it in pyproject.toml and uv.lock. CI catches exactly this.',
      },
      {
        id: 'e8-10-4',
        type: 'fill-blank',
        prompt: 'Build the image only after the tests pass.',
        code: `wf = yaml.safe_load("""
jobs:
  test:
    runs-on: ubuntu-latest
  image:
    ___: test
    runs-on: ubuntu-latest
""")
job = wf["jobs"]["image"]
print(job.get("needs"))`,
        answer: ['needs'],
        distractors: [
          { text: 'after', why: 'Actions has no "after" key; jobs without needs run in parallel.' },
          { text: 'uses', why: 'uses is for steps that call an action.' },
        ],
        expectOutput: 'test',
        explain: 'Without needs, both jobs start at once.',
      },
      {
        id: 'e8-10-5',
        type: 'mcq',
        prompt: 'When should CI push the image to the registry?',
        options: [
          { text: 'Only on main, after tests pass' },
          { text: 'On every branch push', why: 'Unreviewed branches would overwrite deployable images.' },
          { text: 'Never: build on the server', why: 'A tested, versioned image is what the host should run.' },
        ],
        answer: 0,
        explain: 'Pull requests build to check; main builds and pushes.',
      },
      {
        id: 'e8-10-6',
        type: 'predict-output',
        prompt: 'Tag images with the commit. Type what this prints.',
        code: `sha = "3f9c2e71ab04d5"
print(f"api:{sha[:7]}")`,
        answer: 'api:3f9c2e7',
        typedWrong: [{ answer: 'api:latest', why: 'The tag uses the first 7 characters of the commit id.' }],
        explain: 'A tag per commit lets you deploy, and roll back to, an exact version.',
      },
      {
        id: 'e8-10-7',
        type: 'mcq',
        prompt: 'CI takes 9 minutes, mostly reinstalling dependencies. First fix?',
        options: [
          { text: 'Cache uv\'s downloads between runs' },
          { text: 'Delete the slowest of the tests', why: 'Tests are the point; cache the install instead.' },
          { text: 'Run CI once a day', why: 'Then broken code is found a day late.' },
        ],
        answer: 0,
        explain: 'setup-uv has `enable-cache: true`.',
      },
      {
        id: 'e8-10-8',
        type: 'run-code',
        prompt: 'Set `first` to the name of the job that needs no other job, so it starts first.',
        before: `wf = yaml.safe_load("""
jobs:
  deploy:
    needs: image
  test: {}
  image:
    needs: test
""")
jobs = wf["jobs"]`,
        solution: 'first = [j for j, v in jobs.items()\n         if "needs" not in v][0]',
        tests: 'assert first == "test", f"test needs nothing; got {first!r}"',
        maxLines: 2,
        placeholder: 'first = ...',
        explain: 'GitHub orders jobs by their needs for you: test, image, deploy.',
      },
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    id: 'e8-11',
    title: 'Deploying to a managed host',
    summary: 'The host pulls your image, injects secrets, routes traffic to its port, checks health, keeps logs, and rolls back.',
    card: {
      title: 'Deploying to a managed host',
      text: 'A managed host (Render, Fly.io, Cloud Run and the like) runs your container for you: CI pushes the image to a registry, and the host pulls it, sets your secrets as environment variables, and sends traffic to the port it names, often in `$PORT`. It checks a health endpoint before switching traffic, keeps your logs, and can roll back to the previous image.',
      code: `os.environ["PORT"] = "10000"
p = os.environ.get("PORT", "8000")
port = int(p)
print(port)`,
      output: '10000',
    },
    exercises: [
      {
        id: 'e8-11-1',
        type: 'mcq',
        prompt: 'The host says "listen on $PORT". Your app always uses 8000. What happens?',
        options: [
          { text: 'Health checks fail; no traffic arrives' },
          { text: 'The host remaps the port for you', why: 'Many hosts send traffic only to the port they gave you.' },
          { text: 'It works, just slower', why: 'Nothing reaches the app at all.' },
        ],
        answer: 0,
        explain: 'Read PORT from the environment, with 8000 as the local default.',
      },
      {
        id: 'e8-11-2',
        type: 'predict-output',
        prompt: 'No PORT set locally. Type what this prints.',
        code: `os.environ.pop("PORT", None)
p = os.environ.get("PORT", "8000")
port = int(p)
print(port)`,
        answer: '8000',
        typedWrong: [{ answer: 'None', why: '.get returns the default "8000", converted to 8000.' }],
        explain: 'One line that works locally and on the host.',
      },
      {
        id: 'e8-11-3',
        type: 'mcq',
        prompt: 'What is a health endpoint for?',
        options: [
          { text: 'The host checks the app is ready' },
          { text: 'Users check their own health', why: 'It is for machines: load balancers and the host.' },
          { text: 'It speeds up requests', why: 'It only answers "I am up".' },
        ],
        answer: 0,
        explain: 'New versions get traffic only once /health answers 200.',
      },
      {
        id: 'e8-11-4',
        type: 'run-code',
        prompt: 'Add GET `/health` to `app`, returning `{"status": "ok"}`.',
        before: 'app = FastAPI()',
        solution: `@app.get("/health")
async def health():
    return {"status": "ok"}`,
        tests: 'r = await send(app, "GET", "/health")\nassert r.status_code == 200 and r.json() == {"status": "ok"}, f"got {r.status_code} {r.text}"',
        maxLines: 3,
        placeholder: '@app.get("/health")\n...',
        explain: 'Keep it cheap: no model calls in a health check.',
      },
      {
        id: 'e8-11-5',
        type: 'mcq',
        prompt: 'A deploy breaks the /ask endpoint. Fastest safe move?',
        options: [
          { text: 'Roll back to the previous image' },
          { text: 'Debug it live in production', why: 'Users suffer while you debug; restore first, investigate after.' },
          { text: 'Push a quick fix without CI', why: 'Skipping tests is how the second outage happens.' },
        ],
        answer: 0,
        explain: 'Commit-tagged images make rollback one click.',
      },
      {
        id: 'e8-11-6',
        type: 'order-lines',
        prompt: 'Put the release in order.',
        lines: [
          { text: 'img = step("build", "repo")' },
          { text: 'tested = step("test", img)' },
          { text: 'pushed = step("push", tested)' },
          { text: 'live = step("deploy", pushed)' },
          { text: 'print(live)', fixed: true },
        ],
        expectOutput: 'deploy(push(test(build(repo))))',
        explain: 'Here `step` records what each stage was given. Nothing reaches users untested.',
      },
      {
        id: 'e8-11-7',
        type: 'mcq',
        prompt: 'Where do you look first when users report errors after a deploy?',
        options: [
          { text: 'The host\'s logs for that version' },
          { text: 'Your laptop\'s terminal output', why: 'Production runs elsewhere; its logs are on the host.' },
          { text: 'The Dockerfile', why: 'Logs show what failed; then trace it to the cause.' },
        ],
        answer: 0,
        explain: 'Log enough to debug (request id, status, latency), never secrets.',
      },
      {
        id: 'e8-11-8',
        type: 'mcq',
        prompt: 'What does a managed host save you compared with your own server?',
        options: [
          { text: 'OS updates, TLS and scaling' },
          { text: 'Writing a Dockerfile yourself', why: 'Most hosts run the image you build.' },
          { text: 'Paying for compute', why: 'You still pay; you trade money for less operations work.' },
        ],
        answer: 0,
        explain: 'You still own the app, its config, its logs and its costs.',
      },
    ],
  },

  // ------------------------------------------------------------------ 12
  {
    id: 'e8-12',
    title: 'Checkpoint: shipping a service',
    summary: 'Endpoints, models, errors, tests, settings, Docker, compose, CI and deploying, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions from the whole unit, from endpoints to deploys. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 'e8-12-1',
        type: 'predict-output',
        prompt: 'Type the status code.',
        code: `app = FastAPI()

class Ask(BaseModel):
    question: str

@app.post("/ask")
async def ask(req: Ask):
    return {"ok": True}

r = await send(app, "POST", "/ask",
               json={"question": 5})
print(r.status_code)`,
        answer: '422',
        typedWrong: [{ answer: '200', why: '5 is not a string: Pydantic rejects it in strict JSON parsing.' }],
        explain: 'FastAPI checks the body against the model before your code runs.',
      },
      {
        id: 'e8-12-2',
        type: 'mcq',
        prompt: 'An order id does not exist. What does the handler do?',
        options: [
          { text: 'raise HTTPException(404)' },
          { text: 'return {"error": "no order"}', why: 'That is a 200: clients think it worked.' },
          { text: 'Let the KeyError become a 500', why: '500 means a bug; a missing order is expected.' },
        ],
        answer: 0,
        explain: 'Expected failures: 4xx you choose.',
      },
      {
        id: 'e8-12-3',
        type: 'fill-blank',
        prompt: 'Only declared fields leave the server.',
        code: `app = FastAPI()

class Public(BaseModel):
    name: str

@app.get("/me", ___=Public)
async def me():
    return {"name": "Ana",
            "role": "admin"}

r = await send(app, "GET", "/me")
print(r.json())`,
        answer: ['response_model'],
        distractors: [
          { text: 'model', why: 'The argument is response_model.' },
          { text: 'status_code', why: 'That sets the status, not the shape.' },
        ],
        expectOutput: "{'name': 'Ana'}",
        explain: 'role never reaches the client.',
      },
      {
        id: 'e8-12-4',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `os.environ["MAX_TOKENS"] = "100"
limit = os.environ["MAX_TOKENS"]
assert limit + 50 == 150, limit`,
        error: 'TypeError: can only concatenate str (not "int") to str',
        answer: 1,
        raiseLine: 2,
        lineWhy: {
          '0': 'Settings arrive as strings, as here.',
          '2': 'The check is right once limit is a number.',
        },
        explain: 'Convert: `int(os.environ["MAX_TOKENS"])`.',
      },
      {
        id: 'e8-12-5',
        type: 'predict-output',
        prompt: 'You edit app.py. What does this print?',
        code: `${GOOD}
print(rebuilt(df, ["app.py"]))`,
        answer: '[5, 6]',
        options: [
          { text: '[5, 6]' },
          { text: '[3, 4, 5, 6]', why: 'app.py is copied on line 5, after the install.' },
          { text: '[6]', why: 'Line 5 copies app.py, so it reruns too.' },
        ],
        explain: 'The install on line 4 stays cached.',
      },
      {
        id: 'e8-12-6',
        type: 'mcq',
        prompt: 'In compose, the API connects to Postgres at `localhost:5432` and fails. Fix?',
        options: [
          { text: 'Use the service name: db:5432' },
          { text: 'Publish 5432 on the laptop', why: 'The API container\'s localhost is itself; publishing does not change that.' },
          { text: 'Add version: "3" to the file', why: 'version is obsolete and unrelated.' },
        ],
        answer: 0,
        explain: 'Services find each other by name.',
      },
      {
        id: 'e8-12-7',
        type: 'predict-output',
        prompt: 'Type how many steps run commands rather than actions.',
        code: `${CI}
steps = wf["jobs"]["test"]["steps"]
print(sum("run" in s for s in steps))`,
        answer: '3',
        typedWrong: [{ answer: '5', why: 'Two of the five steps use actions.' }],
        explain: 'sync, lint, test.',
      },
      {
        id: 'e8-12-8',
        type: 'mcq',
        prompt: 'Where does the production API key live?',
        options: [
          { text: 'The host\'s secret settings' },
          { text: 'In the Docker image, for speed', why: 'Anyone with the image has the key.' },
          { text: 'In the repository, encrypted', why: 'Then you also ship the means to decrypt it; use the host\'s secret store.' },
        ],
        answer: 0,
        explain: 'And GitHub\'s secrets for CI.',
      },
      {
        id: 'e8-12-9',
        type: 'run-code',
        prompt: 'Write a POST `/echo` endpoint that takes a `Msg` and returns `{"text": ...}` with the message\'s text in capitals.',
        before: `app = FastAPI()

class Msg(BaseModel):
    text: str`,
        solution: `@app.post("/echo")
async def echo(m: Msg):
    return {"text": m.text.upper()}`,
        tests: [
          'r = await send(app, "POST", "/echo", json={"text": "hi"})',
          'assert r.status_code == 200 and r.json() == {"text": "HI"}, f"got {r.status_code} {r.text}"',
          'r = await send(app, "POST", "/echo", json={})',
          'assert r.status_code == 422, "take the body as Msg so missing text gives 422"',
        ].join('\n'),
        maxLines: 3,
        placeholder: '@app.post("/echo")\n...',
        explain: 'Model in, dict out: the core of every endpoint.',
      },
      {
        id: 'e8-12-10',
        type: 'mcq',
        prompt: 'A deploy went out and errors jumped. First move?',
        options: [
          { text: 'Roll back, then investigate' },
          { text: 'Investigate while it is live', why: 'Users keep failing while you look.' },
          { text: 'Restart the container and wait', why: 'A restart brings back the same broken version.' },
        ],
        answer: 0,
        explain: 'Restore service first; find the cause from the logs after.',
      },
    ],
  },
];
