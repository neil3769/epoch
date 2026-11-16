import type { LibraryPage } from '../schema';

/** Unit E8 summary page: unlocked in the Library when the unit is finished. */
export const e8Library: LibraryPage = {
  unit: 'E8',
  ideas: [
    {
      title: 'Endpoints and models',
      text: 'FastAPI turns a function into an endpoint with @app.get or @app.post. Request bodies are Pydantic models taken as the handler\'s argument: FastAPI parses and checks them and replies 422 with the reason if they are wrong. response_model fixes what leaves the server.',
    },
    {
      title: 'Status codes and tests',
      text: 'Raise HTTPException for expected failures: 404 missing, 400 unusable, 503 upstream down; an unhandled exception is a 500 and means a bug. Test with httpx.AsyncClient(transport=ASGITransport(app=app)): the happy path, 422, and each error you raise.',
    },
    {
      title: 'Settings and secrets',
      text: 'Everything that differs between laptop and production comes from environment variables, and they are all strings. Secrets live in an untracked .env locally and in the host\'s or GitHub\'s secret store in production; never in the repository, the image or the logs.',
    },
    {
      title: 'Docker and compose',
      text: 'FROM a slim base, install uv, copy pyproject.toml and uv.lock, uv sync --locked, then copy the code, so code edits reuse the cached install. CMD is what starts the server. compose.yaml runs services together; they reach each other by service name.',
    },
    {
      title: 'CI and deploying',
      text: 'A workflow checks out the code, sets up uv, syncs, lints, tests, then builds the image (needs: test), pushing only from main with a tag per commit. A managed host pulls the image, injects secrets, routes traffic to $PORT once /health passes, keeps logs, and rolls back.',
    },
  ],
  rules: [
    'Body = Pydantic model; 422 is automatic.',
    'Expected failure: HTTPException with a 4xx; 5xx means upstream or a bug.',
    'Test happy path, 422, and every raised error.',
    'Settings from env vars; convert from strings.',
    'Dependency files and install before COPY . .',
    'Services talk by name in compose.',
    'Pin versions: base images, uv, actions.',
    'Lint and test before building; push only from main.',
  ],
  example: {
    code: [
      'app = FastAPI()',
      '',
      'class Ask(BaseModel):',
      '    question: str',
      '',
      '@app.post("/ask")',
      'async def ask(req: Ask):',
      '    if not req.question.strip():',
      '        raise HTTPException(400)',
      '    return {"answer": req.question}',
      '',
      'for body in [{"question": "hi"},',
      '             {"question": " "}, {}]:',
      '    r = await send(app, "POST",',
      '                   "/ask", json=body)',
      '    print(r.status_code)',
    ].join('\n'),
    output: '200\n400\n422',
    notes: [
      'The model declares the body; the handler adds the rule a type cannot express.',
      'send() is httpx.AsyncClient over ASGITransport: the documented way to test async FastAPI code.',
      'Three requests, three outcomes: worked, unusable (400), invalid (422).',
    ],
  },
  mistakes: [
    { mistake: 'Returning an error dict with status 200.', fix: 'Raise HTTPException with the right code.' },
    { mistake: 'Using an env var without converting it.', fix: 'int(os.environ["MAX_TOKENS"]): they are strings.' },
    { mistake: 'COPY . . before installing dependencies.', fix: 'Copy the lock files and install first; code last.' },
    { mistake: 'Connecting to localhost from another compose service.', fix: 'Use the service name, such as db.' },
    { mistake: 'A secret in the repository, image or logs.', fix: 'Secret stores and env vars; mask it in logs.' },
    { mistake: 'Hard-coding port 8000 on a host that sets $PORT.', fix: 'int(os.environ.get("PORT", "8000")).' },
  ],
  forReal:
    'The app runs FastAPI in your browser but cannot run Docker, a CI runner or a host. For real (plan weeks 8 to 10): wrap your flagship in this FastAPI shape, run it locally with uvicorn, write the Dockerfile and build it, add compose if it needs a database, add a GitHub Actions workflow that lints, tests and builds, and deploy the image to a managed host with secrets in its settings. Then break a deploy on purpose and practise the rollback.',
};
