import { e1Labs } from '../labs/e1';
import { e1Library } from '../library/e1';
import type { Unit } from '../schema';

/*
 * E1 A real Python project. Plan week 1 (repo skeleton with uv, pyproject.toml,
 * ruff, pytest, pre-commit). Facts checked against the uv, Python packaging,
 * pytest, ruff, pre-commit and typing docs on 2026-11-16. TOML is read with
 * the standard library's tomllib, and pytest runs in Pyodide, so most answers
 * are executed; shell commands and tool behaviour are hand-checked.
 */
export const e1: Unit = {
  id: 'E1',
  track: 'engineering',
  title: 'A real Python project',
  blurb: 'Lay out a project with uv and pyproject.toml, use type hints, write and read pytest tests, and know what ruff and pre-commit do.',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'e1-01',
      title: 'The project layout',
      summary: 'uv init makes pyproject.toml and a src/ package; uv.lock pins exact versions and is committed.',
      card: {
        title: 'The project layout',
        text: '`uv init` starts a project: a `pyproject.toml` describing it, a `.python-version`, a README, and your code. With a `src/` layout the package lives in `src/<name>/`, so tests import the installed package rather than whatever folder they run from. The first `uv run` creates `.venv` and `uv.lock`, the exact versions of every dependency.',
        code: `files = [
    "pyproject.toml", "README.md",
    ".python-version", "uv.lock",
    "src/notes/__init__.py",
    "tests/test_notes.py",
]
pkg = [f for f in files
       if f.startswith("src/")]
print(pkg)`,
        output: "['src/notes/__init__.py']",
      },
      exercises: [
        {
          id: 'e1-1-1',
          type: 'match-pairs',
          prompt: 'Match each file to its job.',
          pairs: [
            { left: 'pyproject.toml', right: 'describes the project', why: 'Name, version, Python version, dependencies, build settings.' },
            { left: 'uv.lock', right: 'exact versions installed', why: 'Every dependency pinned, so every machine gets the same set.' },
            { left: '.python-version', right: 'which Python to use', why: 'uv creates `.venv` with this version.' },
            { left: 'src/notes/', right: 'your package code', why: 'The importable package, under `src/`.' },
          ],
          explain: 'Four files you will see at the top of every modern Python repo.',
        },
        {
          id: 'e1-1-2',
          type: 'mcq',
          prompt: 'Should `uv.lock` go into git?',
          options: [
            { text: 'Yes: everyone then installs the same versions' },
            { text: 'No: it is generated, so it can be ignored', why: 'It is generated, but it records exact versions. Without it, two machines can resolve different ones.' },
            { text: 'Only for libraries, never for apps', why: 'uv\'s guide says to check it into version control; for apps it matters most.' },
          ],
          answer: 0,
          explain: 'Commit the lockfile; never edit it by hand.',
        },
        {
          id: 'e1-1-3',
          type: 'mcq',
          prompt: 'Should the `.venv` folder go into git?',
          options: [
            { text: 'No: uv rebuilds it from the lockfile' },
            { text: 'Yes: it saves everyone installing packages', why: 'It is large and machine-specific; `uv sync` recreates it exactly from `uv.lock`.' },
            { text: 'Yes, but only the Python binary in it', why: 'Nothing in `.venv` belongs in git; it is rebuilt from the lockfile.' },
          ],
          answer: 0,
          explain: 'Commit the recipe (`pyproject.toml`, `uv.lock`), not the environment.',
        },
        {
          id: 'e1-1-4',
          type: 'predict-output',
          prompt: 'From a file path to the module you import. What does this print?',
          code: `path = "src/notes/api.py"
mod = path.removeprefix("src/")
mod = mod.removesuffix(".py")
print(mod.replace("/", "."))`,
          answer: 'notes.api',
          options: [
            { text: 'notes.api' },
            { text: 'src.notes.api', why: '`src/` is removed first: with a src layout you import `notes.api`, not `src.notes.api`.' },
            { text: 'notes/api', why: 'The slashes are replaced with dots at the end.' },
          ],
          explain: 'With a src layout, `src/notes/api.py` is imported as `notes.api`.',
        },
        {
          id: 'e1-1-5',
          type: 'mcq',
          prompt: 'Why put the package under `src/`?',
          options: [
            { text: 'Tests then import the installed package' },
            { text: 'Python cannot import from the top folder', why: 'It can, and that is the problem: tests may pass by importing loose files instead of the real package.' },
            { text: 'uv refuses to work without it', why: 'uv supports both layouts; `src/` is a choice that catches packaging mistakes early.' },
          ],
          answer: 0,
          explain: 'If something is missing from the package, the tests notice.',
        },
        {
          id: 'e1-1-6',
          type: 'predict-output',
          prompt: 'Versions are not plain strings. What does this print?',
          code: `a, b = "3.9", "3.14"
print(a > b)
ta = tuple(map(int, a.split(".")))
tb = tuple(map(int, b.split(".")))
print(ta > tb)`,
          answer: 'True\nFalse',
          options: [
            { text: 'True\nFalse' },
            { text: 'False\nFalse', why: 'As strings, "3.9" > "3.14" compares "9" with "1" and says True.' },
            { text: 'True\nTrue', why: 'As numbers, (3, 9) is less than (3, 14).' },
          ],
          explain: 'Compare versions as numbers (tools use proper version parsing), never as text.',
        },
        {
          id: 'e1-1-7',
          type: 'fill-blank',
          prompt: 'Run the tests inside the project\'s environment.',
          code: `uv ___ pytest`,
          answer: ['run'],
          distractors: [
            { text: 'add', why: '`uv add pytest` adds pytest as a dependency; it does not run anything.' },
            { text: 'init', why: '`uv init` creates a new project.' },
          ],
          explain: '`uv run` checks the environment matches the lockfile, then runs the command in it.',
        },
        {
          id: 'e1-1-8',
          type: 'run-code',
          prompt: 'Set `pkg` to the package name in `path`.',
          before: 'path = "src/notes/__init__.py"',
          solution: 'pkg = path.split("/")[1]',
          tests: 'assert pkg == "notes", f"the folder under src/ is the package: notes; got {pkg!r}"',
          placeholder: 'pkg = ...',
          explain: 'Split on "/" and take the folder after `src`.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'e1-02',
      title: 'pyproject.toml',
      summary: 'pyproject.toml holds name, version, requires-python, dependencies, scripts and the build backend.',
      card: {
        title: 'pyproject.toml',
        text: '`pyproject.toml` is the project\'s ID card: `[project]` has the `name`, `version`, `requires-python` and `dependencies`, and `[build-system]` says which tool builds it. `[project.scripts]` turns a function into a command you can type. Python reads TOML with the built-in `tomllib`, which is how tools see the file too.',
        code: `import tomllib
text = """
[project]
name = "notes-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["httpx>=0.28"]
"""
p = tomllib.loads(text)["project"]
print(p["name"], p["dependencies"])`,
        output: "notes-api ['httpx>=0.28']",
      },
      exercises: [
        {
          id: 'e1-2-1',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `import tomllib
text = """
[project]
name = "notes-api"
version = "0.2.1"
"""
p = tomllib.loads(text)["project"]
print(p["version"])`,
          answer: '0.2.1',
          explain: 'A TOML table becomes a dict, and its keys become dict keys.',
        },
        {
          id: 'e1-2-2',
          type: 'predict-output',
          prompt: 'A command entry point. What does this print?',
          code: `import tomllib
text = """
[project.scripts]
notes = "notes.cli:main"
"""
s = tomllib.loads(text)
print(s["project"]["scripts"])`,
          answer: "{'notes': 'notes.cli:main'}",
          options: [
            { text: "{'notes': 'notes.cli:main'}" },
            { text: "{'notes': 'main'}", why: 'The value is the whole string "notes.cli:main": module, colon, function.' },
            { text: 'notes.cli:main', why: 'This prints the whole scripts table, a dict, not one value.' },
          ],
          explain: 'A dotted table name such as `[project.scripts]` nests one table inside another.',
        },
        {
          id: 'e1-2-3',
          type: 'mcq',
          prompt: 'What does `notes = "notes.cli:main"` under `[project.scripts]` do?',
          options: [
            { text: 'Typing `notes` runs main() in notes/cli.py' },
            { text: 'It imports notes.cli when Python starts', why: 'Nothing runs at start-up; it defines a command for the terminal.' },
            { text: 'It renames the package to "main"', why: 'The package name stays the same; "main" is the function the command calls.' },
          ],
          answer: 0,
          explain: 'Installing the project creates a `notes` command that calls that function.',
        },
        {
          id: 'e1-2-4',
          type: 'spot-bug',
          prompt: 'Which line is not valid TOML?',
          code: `import tomllib
text = """
[project]
name = "notes-api"
version = 0.1.0
"""
tomllib.loads(text)`,
          error: 'TOMLDecodeError: Expected newline or end of document after a statement...',
          answer: 4,
          raiseLine: 6,
          lineWhy: {
            '0': 'tomllib is in the standard library.',
            '1': 'The string holding the TOML starts here.',
            '2': 'A valid table header.',
            '3': 'A quoted string value: valid.',
            '5': 'The string ends here.',
            '6': 'Python reports the error from this call, but the problem is in the text it reads.',
          },
          explain: 'Versions are strings in TOML: `version = "0.1.0"`. `0.1.0` is not a valid number.',
        },
        {
          id: 'e1-2-5',
          type: 'fill-blank',
          prompt: 'Read TOML from a string.',
          code: `import tomllib
text = 'name = "notes"'
print(tomllib.___(text)["name"])`,
          answer: ['loads'],
          distractors: [
            { text: 'load', why: '`tomllib.load` reads from an open binary file, not a string.' },
            { text: 'dumps', why: 'tomllib only reads TOML; it has no `dumps`.' },
          ],
          expectOutput: 'notes',
          explain: '`loads` for a string, `load` for a file opened in binary mode.',
        },
        {
          id: 'e1-2-6',
          type: 'predict-output',
          prompt: 'The build backend uv sets up by default. What does this print?',
          code: `import tomllib
text = """
[build-system]
requires = ["uv_build>=0.13,<0.14"]
build-backend = "uv_build"
"""
d = tomllib.loads(text)
b = d["build-system"]
print(b["build-backend"])`,
          answer: 'uv_build',
          options: [
            { text: 'uv_build' },
            { text: "['uv_build>=0.13,<0.14']", why: 'That is `requires`, the build tool to install. `build-backend` names the one to run.' },
            { text: 'hatchling', why: 'hatchling is another backend, but this file names uv_build.' },
          ],
          explain: '`[build-system]` tells any installer which tool builds the package.',
        },
        {
          id: 'e1-2-7',
          type: 'mcq',
          prompt: 'Which `[project]` field can never be left to the build tool to fill in?',
          options: [
            { text: 'name' },
            { text: 'version', why: 'version is often marked dynamic (filled by the build backend, from git tags for example).' },
            { text: 'dependencies', why: 'Fields like dependencies can be dynamic too. Only `name` cannot.' },
          ],
          answer: 0,
          explain: 'The packaging guide: `name` is required and is the only field that cannot be dynamic.',
        },
        {
          id: 'e1-2-8',
          type: 'run-code',
          prompt: 'Set `deps` to the project\'s dependency list.',
          before: `import tomllib
text = """
[project]
name = "notes-api"
dependencies = ["httpx>=0.28"]
"""`,
          solution: 'data = tomllib.loads(text)\ndeps = data["project"]["dependencies"]',
          tests: 'assert deps == ["httpx>=0.28"], f"got {deps!r}"',
          maxLines: 2,
          placeholder: 'data = ...\ndeps = ...',
          explain: 'Parse, then go down: project, then dependencies.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'e1-03',
      title: 'Dependencies with uv',
      summary: 'uv add records a dependency and locks it; --dev puts tools in a dev group; uv run uses the locked environment.',
      card: {
        title: 'Dependencies with uv',
        text: '`uv add httpx` records the dependency in `pyproject.toml` and pins its exact version in `uv.lock`, while `uv add --dev pytest` puts development-only tools in a separate group. `uv run pytest` checks the environment matches the lock, then runs the command inside it. Commit `uv.lock`, so every machine installs the same versions.',
        code: `import tomllib
text = """
[project]
dependencies = ["httpx>=0.28.1"]

[dependency-groups]
dev = ["pytest>=9.0.0"]
"""
d = tomllib.loads(text)
print(d["dependency-groups"]["dev"])`,
        output: "['pytest>=9.0.0']",
      },
      exercises: [
        {
          id: 'e1-3-1',
          type: 'predict-output',
          prompt: 'How many runtime and dev dependencies? What does this print?',
          code: `import tomllib
text = """
[project]
dependencies = ["httpx", "pydantic"]

[dependency-groups]
dev = ["pytest", "ruff", "mypy"]
"""
d = tomllib.loads(text)
run = d["project"]["dependencies"]
dev = d["dependency-groups"]["dev"]
print(len(run), len(dev))`,
          answer: '2 3',
          options: [
            { text: '2 3' },
            { text: '5 0', why: 'Dev tools are listed separately, under `[dependency-groups]`.' },
            { text: '3 2', why: 'The project needs 2 packages to run; the 3 tools are for development.' },
          ],
          explain: 'Users of your package install only the runtime dependencies.',
        },
        {
          id: 'e1-3-2',
          type: 'mcq',
          prompt: 'You run `uv add --dev ruff`. Where is ruff recorded?',
          options: [
            { text: 'In the dev group, not in dependencies' },
            { text: 'In `[project] dependencies`', why: 'That is for packages the code needs to run. `--dev` keeps tools separate.' },
            { text: 'Only in uv.lock, not in pyproject.toml', why: 'It is recorded in pyproject.toml (the dev group) and locked in uv.lock.' },
          ],
          answer: 0,
          explain: 'A linter is needed to develop the project, not to run it.',
        },
        {
          id: 'e1-3-3',
          type: 'mcq',
          prompt: 'Tests pass on your laptop but fail in CI with a different httpx version. What prevents this?',
          options: [
            { text: 'Commit uv.lock and install from it' },
            { text: 'Delete pyproject.toml', why: 'Then there is no project description at all.' },
            { text: 'Use the newest httpx everywhere', why: '"Newest" changes over time; the lockfile pins the exact same version for everyone.' },
          ],
          answer: 0,
          explain: 'The lockfile makes installs reproducible.',
        },
        {
          id: 'e1-3-4',
          type: 'match-pairs',
          prompt: 'Match each command to what it does.',
          pairs: [
            { left: 'uv add httpx', right: 'add a runtime dependency', why: 'Records it in pyproject.toml and updates the lock.' },
            { left: 'uv add --dev pytest', right: 'add a development tool', why: 'Goes into the dev group.' },
            { left: 'uv run pytest', right: 'run in the project env', why: 'Syncs with the lock first, then runs.' },
            { left: 'uv sync', right: 'install from the lockfile', why: 'Makes `.venv` match `uv.lock`.' },
          ],
          explain: 'Four commands cover most day-to-day work.',
        },
        {
          id: 'e1-3-5',
          type: 'predict-output',
          prompt: 'Splitting a requirement string. What does this print?',
          code: `spec = "httpx>=0.28,<1"
name = spec.split(">=")[0]
rest = spec[len(name):]
print(name, rest.split(","))`,
          answer: "httpx ['>=0.28', '<1']",
          options: [
            { text: "httpx ['>=0.28', '<1']" },
            { text: "httpx ['0.28', '1']", why: 'The operators are kept: `rest` starts right after the name, at ">=".' },
            { text: "httpx>=0.28 ['<1']", why: '`split(">=")[0]` stops before ">=", so the name is just "httpx".' },
          ],
          explain: '`>=0.28,<1` means at least 0.28 but below 1: a range the lockfile then pins to one version.',
        },
        {
          id: 'e1-3-6',
          type: 'predict-output',
          prompt: 'Versions as tuples. What does this print?',
          code: `have = (0, 28, 1)
need = (0, 28)
print(have >= need, have < (1,))`,
          answer: 'True True',
          options: [
            { text: 'True True' },
            { text: 'False True', why: 'Tuples compare item by item: (0, 28, 1) starts with (0, 28) and is longer, so it is greater.' },
            { text: 'True False', why: '0 < 1 in the first position, so (0, 28, 1) < (1,).' },
          ],
          explain: '0.28.1 satisfies ">=0.28,<1".',
        },
        {
          id: 'e1-3-7',
          type: 'mcq',
          prompt: 'Why `uv run pytest` rather than just `pytest`?',
          options: [
            { text: 'It uses the project\'s locked environment' },
            { text: 'Plain pytest cannot find test files', why: 'pytest finds tests either way. The difference is which Python and packages it uses.' },
            { text: 'uv run makes the tests faster', why: 'Speed is not the point; using the right environment is.' },
          ],
          answer: 0,
          explain: 'Plain `pytest` might be a global install with other package versions.',
        },
        {
          id: 'e1-3-8',
          type: 'run-code',
          prompt: '`data` is a parsed pyproject. Add `"ruff"` to its dev group, as `uv add --dev ruff` would.',
          before: `data = {
    "project": {"dependencies": []},
    "dependency-groups": {
        "dev": ["pytest"]}}`,
          solution: 'dev = data["dependency-groups"]["dev"]\ndev.append("ruff")',
          tests: [
            'dev = data["dependency-groups"]["dev"]',
            'assert dev == ["pytest", "ruff"], f"dev group should be pytest and ruff, got {dev}"',
            'assert data["project"]["dependencies"] == [], "runtime dependencies stay empty"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'data["dependency-groups"]...',
          explain: 'Dev tools go in the dev group, leaving runtime dependencies alone.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'e1-04',
      title: 'Type hints',
      summary: 'Type hints state what goes in and comes out; tools check them, Python does not at run time.',
      card: {
        title: 'Type hints',
        text: 'Type hints say what a function takes and returns, as in `def total(xs: list[float]) -> float`. Python does not check them while the code runs; tools such as mypy and your editor check them beforehand. They document intent and catch mistakes like passing text where a number was meant.',
        code: `def double(x: int) -> int:
    return x * 2

print(double("ab"))`,
        output: 'abab',
      },
      exercises: [
        {
          id: 'e1-4-1',
          type: 'predict-output',
          prompt: 'The hint says int. What does this print?',
          code: `def double(x: int) -> int:
    return x * 2

print(double(2.5))`,
          answer: '5.0',
          options: [
            { text: '5.0' },
            { text: 'TypeError', why: 'Hints are not checked at run time, so a float goes through.' },
            { text: '5', why: '2.5 * 2 is a float: 5.0.' },
          ],
          explain: 'A type checker would flag this call; Python runs it anyway.',
        },
        {
          id: 'e1-4-2',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `def double(x: int) -> int:
    return x * 2

hints = double.__annotations__
print(hints["return"].__name__)`,
          answer: 'int',
          explain: 'Hints are stored on the function, which is how tools read them.',
        },
        {
          id: 'e1-4-3',
          type: 'fill-blank',
          prompt: 'The function takes a list of floats.',
          code: `def mean(xs: ___[float]) -> float:
    return sum(xs) / len(xs)

print(mean.__annotations__["xs"])`,
          answer: ['list'],
          distractors: [
            { text: 'tuple', why: 'That would mean a tuple of one float, not a list of floats.' },
            { text: 'float', why: '`float[float]` is not a valid type: float cannot be subscripted.' },
          ],
          expectOutput: 'list[float]',
          explain: '`list[float]` is a list whose items are floats.',
        },
        {
          id: 'e1-4-4',
          type: 'predict-output',
          prompt: 'The return type allows None. What does this print?',
          code: `def find(name: str) -> int | None:
    ids = {"ada": 1}
    return ids.get(name)

print(find("bob"))`,
          answer: 'None',
          options: [
            { text: 'None' },
            { text: 'KeyError', why: '`.get` returns None for a missing key instead of raising.' },
            { text: '0', why: 'A missing key gives None, not 0.' },
          ],
          explain: '`int | None` warns every caller: check for None before using the result.',
        },
        {
          id: 'e1-4-5',
          type: 'mcq',
          prompt: 'Does Python stop you calling `double("ab")` when `x: int`?',
          options: [
            { text: 'No: a type checker such as mypy flags it' },
            { text: 'Yes: it raises a TypeError at once', why: 'The runtime ignores hints, as `double("ab")` printing "abab" shows.' },
            { text: 'Yes, but only inside a test', why: 'Tests do not enforce hints either; a type checker does.' },
          ],
          answer: 0,
          explain: 'Run a type checker (in CI or your editor) to get the benefit.',
        },
        {
          id: 'e1-4-6',
          type: 'spot-bug',
          prompt: 'The hint warned that `find` may return None. Which line ignores that?',
          code: `def find(name: str) -> int | None:
    ids = {"ada": 1}
    return ids.get(name)

n = find("bob")
print(n + 1)`,
          error: "TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'",
          answer: 5,
          lineWhy: {
            '0': 'The signature honestly says the result may be None.',
            '1': 'A small lookup table is fine.',
            '2': '`.get` returns None for a missing name, as the hint promised.',
            '4': 'Calling find is fine; using its result unchecked is the problem.',
          },
          explain: 'Check first: `if n is not None:`. A type checker would have flagged `n + 1`.',
        },
        {
          id: 'e1-4-7',
          type: 'predict-output',
          prompt: 'A dict return type. What does this print?',
          code: `Counts = dict[str, int]

def count(ws: list[str]) -> Counts:
    out: Counts = {}
    for w in ws:
        out[w] = out.get(w, 0) + 1
    return out

print(count(["a", "b", "a"]))`,
          answer: "{'a': 2, 'b': 1}",
          options: [
            { text: "{'a': 2, 'b': 1}" },
            { text: "{'a': 1, 'b': 1}", why: '"a" appears twice, so its count is 2.' },
            { text: "['a', 'b', 'a']", why: 'The function builds and returns a dict of counts.' },
          ],
          explain: 'A named type (`Counts`) keeps long hints readable.',
        },
        {
          id: 'e1-4-8',
          type: 'run-code',
          prompt: 'Write `area(w, h)` with float hints for both inputs and the result.',
          solution: 'def area(w: float, h: float) -> float:\n    return w * h',
          tests: [
            'assert area(2, 3) == 6, "area(2, 3) should be 6"',
            'h = area.__annotations__',
            'assert h == {"w": float, "h": float, "return": float}, f"hint w, h and the result as float; got {h}"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'def area(w: float, ...) -> ...:\n    return w * h',
          explain: '`def area(w: float, h: float) -> float:`.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'e1-05',
      title: 'A pytest test',
      summary: 'pytest runs test_ functions in test_*.py files; tests use plain assert and pytest.raises.',
      card: {
        title: 'A pytest test',
        text: 'pytest finds files named `test_*.py` (or `*_test.py`) and runs every function in them whose name starts with `test`. A test is a plain function with plain `assert`s, and `pytest.raises` checks that an error happens. Run `uv run pytest`, and each test passes or fails on its own.',
        code: `import pytest

def add(a, b):
    return a + b

def test_add():
    assert add(2, 3) == 5

def test_bad_type():
    with pytest.raises(TypeError):
        add(1, "x")

test_add()
test_bad_type()
print("both passed")`,
        output: 'both passed',
      },
      exercises: [
        {
          id: 'e1-5-1',
          type: 'predict-output',
          prompt: 'Which files does pytest collect by default? What does this print?',
          code: `import fnmatch
files = ["test_api.py", "api.py",
         "api_test.py", "tests.py"]
pats = ["test_*.py", "*_test.py"]
found = [f for f in files
         if any(fnmatch.fnmatch(f, p)
                for p in pats)]
print(found)`,
          answer: "['test_api.py', 'api_test.py']",
          options: [
            { text: "['test_api.py', 'api_test.py']" },
            { text: "['test_api.py']", why: '`*_test.py` is also a default pattern, so api_test.py is collected.' },
            { text: "['api_test.py']", why: 'test_api.py matches the first pattern, `test_*.py`.' },
          ],
          explain: 'Name test files `test_<thing>.py` and pytest finds them.',
        },
        {
          id: 'e1-5-2',
          type: 'predict-output',
          prompt: 'Which of these functions are tests? What does this print?',
          code: `names = ["test_add", "helper",
         "check_add", "test_div"]
print([n for n in names
       if n.startswith("test")])`,
          answer: "['test_add', 'test_div']",
          options: [
            { text: "['test_add', 'test_div']" },
            { text: "['test_add', 'check_add', 'test_div']", why: '"check_add" does not start with "test", so pytest would not run it.' },
            { text: "['test_add']", why: 'test_div starts with "test" too.' },
          ],
          explain: 'A function called `check_add` is silently never run: name tests `test_...`.',
        },
        {
          id: 'e1-5-3',
          type: 'fill-blank',
          prompt: 'Check that dividing by zero raises.',
          code: `import pytest

with pytest.___(ZeroDivisionError):
    1 / 0
print("ok")`,
          answer: ['raises'],
          distractors: [
            { text: 'approx', why: '`pytest.approx` compares numbers loosely; it does not catch errors.' },
            { text: 'warns', why: '`pytest.warns` checks for warnings, not exceptions, so the ZeroDivisionError escapes.' },
          ],
          expectOutput: 'ok',
          explain: 'The test passes only if the block raises that error.',
        },
        {
          id: 'e1-5-4',
          type: 'predict-output',
          prompt: 'Floats in tests. What does this print?',
          code: `import pytest

x = 0.1 + 0.2
print(x == 0.3)
print(x == pytest.approx(0.3))`,
          answer: 'False\nTrue',
          options: [
            { text: 'False\nTrue' },
            { text: 'True\nTrue', why: '0.1 + 0.2 is 0.30000000000000004 in floating point, so `==` fails.' },
            { text: 'False\nFalse', why: '`pytest.approx` allows a tiny tolerance, so it matches.' },
          ],
          explain: 'Compare floats with `pytest.approx`.',
        },
        {
          id: 'e1-5-5',
          type: 'spot-bug',
          prompt: 'The test fails. Which line is wrong: the code or the test?',
          code: `def add(a, b):
    return a - b

def test_add():
    assert add(2, 3) == 5

test_add()`,
          error: 'AssertionError: ',
          answer: 1,
          raiseLine: 4,
          lineWhy: {
            '0': 'The signature is fine.',
            '3': 'A well-named test.',
            '4': 'The test is right: 2 + 3 is 5. It fails because add is wrong.',
            '6': 'Running the test is how we found the bug.',
          },
          explain: '`add` subtracts. The test did its job.',
        },
        {
          id: 'e1-5-6',
          type: 'mcq',
          prompt: 'What makes a good unit test?',
          options: [
            { text: 'One behaviour, a known input, an exact expected output' },
            { text: 'Calling every function once and printing the results', why: 'Printing checks nothing; a test must assert what the right result is.' },
            { text: 'Asserting the code returns whatever it returns now', why: 'That freezes current behaviour, bugs included. Assert what is correct.' },
          ],
          answer: 0,
          explain: 'When it fails, its name and its one assert point straight at the problem.',
        },
        {
          id: 'e1-5-7',
          type: 'mcq',
          prompt: '`tests/notes_tests.py` has five `test_` functions, but pytest runs none. Why?',
          options: [
            { text: 'The file name matches no test pattern' },
            { text: 'Tests must live in the src folder', why: 'A tests/ folder is the usual place. The file name is the problem.' },
            { text: 'pytest needs a test class around them', why: 'Plain test functions are fine without a class.' },
          ],
          answer: 0,
          explain: '"notes_tests.py" matches neither `test_*.py` nor `*_test.py`. Rename it test_notes.py.',
        },
        {
          id: 'e1-5-8',
          type: 'run-code',
          prompt: 'Write `test_double`, asserting that `double(4)` is 8.',
          before: `def double(x):
    return x * 2`,
          solution: 'def test_double():\n    assert double(4) == 8',
          tests: [
            'test_double()',
            'double = lambda x: x + 2',
            'caught = False',
            'try:',
            '    test_double()',
            'except AssertionError:',
            '    caught = True',
            'assert caught, "your test should fail when double is wrong (4 + 2 = 6, not 8)"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'def test_double():\n    assert ...',
          explain: 'A good test passes on correct code and fails on wrong code; the hidden check tried both.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'e1-06',
      title: 'Reading a failure',
      summary: 'Read pytest output from the bottom: the summary, the FAILED line, then the E lines with real values.',
      card: {
        title: 'Reading a failure',
        text: 'When a test fails, pytest shows the assert with the real values filled in, then a short summary. Read from the bottom: the summary says how many failed, `FAILED file::test` names the test, and the `E` lines show what the values were. The test name and the values usually tell you whether the code or the test is wrong.',
        code: `report = """\\
E    assert 4 == 5
E     +  where 4 = add(2, 3)
FAILED test_calc.py::test_add
1 failed, 2 passed in 0.03s"""
last = report.splitlines()[-1]
print(last.split(" in ")[0])`,
        output: '1 failed, 2 passed',
      },
      exercises: [
        {
          id: 'e1-6-1',
          type: 'predict-output',
          prompt: 'Type the name of the failing test.',
          code: `line = "FAILED test_calc.py::test_add"
ident = line.split()[1]
file, name = ident.split("::")
print(name)`,
          answer: 'test_add',
          explain: 'The id is `file::test`: the test name is after the double colon.',
        },
        {
          id: 'e1-6-2',
          type: 'mcq',
          prompt: 'pytest shows `E assert 4 == 5` and `E + where 4 = add(2, 3)`. What happened?',
          options: [
            { text: 'add(2, 3) returned 4; the test wanted 5' },
            { text: 'The test asked for 4 but got 5', why: 'The left side, 4, is what add returned; 5 is what the test expected.' },
            { text: 'add raised an error before returning', why: 'It returned 4. An error would show a traceback with its type instead.' },
          ],
          answer: 0,
          explain: 'pytest rewrites the assert so you see the real values on both sides.',
        },
        {
          id: 'e1-6-3',
          type: 'predict-output',
          prompt: 'Turn the summary into numbers. What does this print?',
          code: `s = "2 failed, 7 passed in 0.10s"
parts = s.split(" in ")[0].split(", ")
print({p.split()[1]: int(p.split()[0])
       for p in parts})`,
          answer: "{'failed': 2, 'passed': 7}",
          options: [
            { text: "{'failed': 2, 'passed': 7}" },
            { text: "{'2': 'failed', '7': 'passed'}", why: 'The key is the word (second item) and the value the number, converted with int.' },
            { text: "{'failed': 2, 'passed': 7, 'in': 0.1}", why: 'Splitting on " in " first drops the timing.' },
          ],
          explain: 'The summary line is the first thing to read: how bad is it?',
        },
        {
          id: 'e1-6-4',
          type: 'mcq',
          prompt: '`assert area(2, 3) == 5` fails with `assert 6 == 5`, for `area(w, h)` that returns `w * h`. Which is wrong?',
          options: [
            { text: 'The test: 2 × 3 is 6' },
            { text: 'The code: area should give 5', why: 'The area of a 2 by 3 rectangle is 6. The expected value in the test is the mistake.' },
            { text: 'pytest: it miscounted', why: 'pytest reports exactly what the code returned.' },
          ],
          answer: 0,
          explain: 'Work out the right answer by hand before blaming the code.',
        },
        {
          id: 'e1-6-5',
          type: 'predict-output',
          prompt: 'An assert with a message. What does this print?',
          code: `x = 4
msg = f"expected 5, got {x}"
try:
    assert x == 5, msg
except AssertionError as e:
    print(e)`,
          answer: 'expected 5, got 4',
          options: [
            { text: 'expected 5, got 4' },
            { text: 'expected 5, got {x}', why: 'It is an f-string, so `{x}` is filled in with 4.' },
            { text: 'AssertionError', why: 'Printing the exception prints its message.' },
          ],
          explain: 'A message makes a failure explain itself, even outside pytest.',
        },
        {
          id: 'e1-6-6',
          type: 'spot-bug',
          prompt: 'The code is right. Which line is wrong?',
          code: `def area(w, h):
    return w * h

def test_area():
    assert area(2, 3) == 5

test_area()`,
          error: 'AssertionError: ',
          answer: 4,
          lineWhy: {
            '0': 'The signature is fine.',
            '1': 'Width times height is the right formula.',
            '3': 'A well-named test.',
            '6': 'Running it is how the mistake showed up.',
          },
          explain: 'The expected value is wrong: 2 × 3 = 6.',
        },
        {
          id: 'e1-6-7',
          type: 'mcq',
          prompt: 'Where do you start reading a long pytest failure?',
          options: [
            { text: 'At the bottom: summary, then FAILED lines' },
            { text: 'At the top, line by line, to the end', why: 'Long tracebacks bury the point. The summary and the E lines say what failed and with which values.' },
            { text: 'Skip it and rerun the tests', why: 'Rerunning gives the same output; reading it tells you what to fix.' },
          ],
          answer: 0,
          explain: 'Bottom up: how many failed, which ones, then the values.',
        },
        {
          id: 'e1-6-8',
          type: 'run-code',
          prompt: 'Set `name` to the failing test\'s name from `line`.',
          before: 'line = "FAILED test_calc.py::test_div"',
          solution: 'name = line.split("::")[1]',
          tests: 'assert name == "test_div", f"the name is after ::, got {name!r}"',
          placeholder: 'name = ...',
          explain: 'Split on "::" and take the second part.',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'e1-07',
      title: 'Ruff and pre-commit',
      summary: 'ruff check finds problems, ruff format lays code out, and pre-commit runs them before every commit.',
      card: {
        title: 'Ruff and pre-commit',
        text: 'Ruff is a fast linter and formatter: `ruff check` finds likely bugs and style problems (F401 is an unused import), `--fix` repairs the safe ones, and `ruff format` lays code out the same way every time. pre-commit runs tools like these before each `git commit`, from a `.pre-commit-config.yaml` you activate once with `pre-commit install`. Together they keep every commit clean without anyone remembering to run them.',
        code: `out = ("a.py:3:8: F401 "
       "\`os\` imported but unused")
where, rest = out.split(": ", 1)
print(where, rest.split()[0])`,
        output: 'a.py:3:8 F401',
      },
      exercises: [
        {
          id: 'e1-7-1',
          type: 'predict-output',
          prompt: 'Count the rule codes in ruff\'s output. What does this print?',
          code: `from collections import Counter
codes = ["F401", "E501", "F401",
         "F841", "F401"]
print(Counter(codes).most_common(1))`,
          answer: "[('F401', 3)]",
          options: [
            { text: "[('F401', 3)]" },
            { text: "[('F401', 5)]", why: 'F401 appears 3 times; there are 5 codes in total.' },
            { text: "('F401', 3)", why: '`most_common(1)` returns a list holding one pair.' },
          ],
          explain: 'Unused imports are the most common finding here; `ruff check --fix` removes them.',
        },
        {
          id: 'e1-7-2',
          type: 'match-pairs',
          prompt: 'Match each tool to its job.',
          pairs: [
            { left: 'ruff check', right: 'finds likely bugs', why: 'The linter: unused imports, undefined names, risky patterns.' },
            { left: 'ruff format', right: 'lays out the code', why: 'The formatter: consistent spacing, quotes and line breaks.' },
            { left: 'pre-commit', right: 'runs tools before commits', why: 'Hooks run on each `git commit`.' },
            { left: 'pytest', right: 'runs the tests', why: 'Checks the code does what it should.' },
          ],
          explain: 'Each tool checks something different; CI runs all of them.',
        },
        {
          id: 'e1-7-3',
          type: 'mcq',
          prompt: 'Ruff reports `F401 \`json\` imported but unused`. What does it mean?',
          options: [
            { text: 'json is imported but never used' },
            { text: 'json is used but never imported', why: 'That would be an undefined-name error. F401 is the opposite: an import nobody uses.' },
            { text: 'json is imported twice', why: 'A duplicate import is a different finding.' },
          ],
          answer: 0,
          explain: 'Usually safe to delete; `ruff check --fix` does it for you.',
        },
        {
          id: 'e1-7-4',
          type: 'mcq',
          prompt: 'When do pre-commit\'s hooks run?',
          options: [
            { text: 'On each git commit, once installed' },
            { text: 'Every time you save a file in the editor', why: 'That is your editor. pre-commit hooks into git.' },
            { text: 'Only when you run pytest on the code', why: 'pytest runs tests; pre-commit runs its hooks on `git commit`.' },
          ],
          answer: 0,
          explain: '`pre-commit install` adds the git hook; `pre-commit run --all-files` runs them by hand.',
        },
        {
          id: 'e1-7-5',
          type: 'predict-output',
          prompt: 'The config as Python data. What does this print?',
          code: `hooks = [{"id": "ruff-check"},
         {"id": "ruff-format"}]
config = {"repos": [{
    "repo": "https://github.com/"
        "astral-sh/ruff-pre-commit",
    "rev": "v0.17.5",
    "hooks": hooks}]}
repo = config["repos"][0]
ids = [h["id"] for h in repo["hooks"]]
print(ids)`,
          answer: "['ruff-check', 'ruff-format']",
          options: [
            { text: "['ruff-check', 'ruff-format']" },
            { text: "['ruff-pre-commit']", why: 'That is the repo the hooks come from. The hook ids are inside "hooks".' },
            { text: "['v0.17.5']", why: '"rev" is the version of the hook repo, not a hook.' },
          ],
          explain: 'Each repo entry has a `rev` and a list of hooks, each with an `id`.',
        },
        {
          id: 'e1-7-6',
          type: 'mcq',
          prompt: 'What is the difference between a linter and a formatter?',
          options: [
            { text: 'A linter finds problems; a formatter fixes layout' },
            { text: 'They are two names for the same tool', why: 'Ruff happens to do both, but `check` and `format` do different jobs.' },
            { text: 'A formatter finds bugs; a linter fixes spacing', why: 'It is the other way round.' },
          ],
          answer: 0,
          explain: 'Formatting ends style arguments; linting catches mistakes.',
        },
        {
          id: 'e1-7-7',
          type: 'fill-blank',
          prompt: 'Activate the hooks in a fresh clone.',
          code: `pre-commit ___`,
          answer: ['install'],
          distractors: [
            { text: 'init', why: 'pre-commit has no `init`; `install` sets up the git hook.' },
            { text: 'format', why: 'Formatting is a hook\'s job, not a pre-commit command.' },
          ],
          explain: 'Each clone runs `pre-commit install` once.',
        },
        {
          id: 'e1-7-8',
          type: 'run-code',
          prompt: 'Set `codes` to the rule code from each line of ruff output.',
          before: `lines = ["a.py:1:8: F401 unused",
         "a.py:9:1: E501 too long"]`,
          solution: 'codes = [l.split()[1] for l in lines]',
          tests: 'assert codes == ["F401", "E501"], f"got {codes}"',
          placeholder: 'codes = ...',
          explain: 'The code is the second word on each line.',
        },
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      id: 'e1-08',
      title: 'Checkpoint',
      checkpoint: true,
      summary: 'You can read a pyproject.toml, manage dependencies with uv, use type hints, and write and read pytest tests.',
      card: {
        title: 'Checkpoint',
        text: 'Everything from this unit, mixed together. For each one, ask: which file, which tool, and what would a teammate cloning the repo need to get the same result?',
      },
      exercises: [
        {
          id: 'e1-8-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `import tomllib
text = """
[project]
name = "evals"
requires-python = ">=3.12"
"""
p = tomllib.loads(text)["project"]
print(p["requires-python"])`,
          answer: '>=3.12',
          options: [
            { text: '>=3.12' },
            { text: '3.12', why: 'The value is the whole string, operator included.' },
            { text: 'evals', why: 'That is `name`. This prints `requires-python`.' },
          ],
          explain: 'requires-python says which Python versions the project supports.',
        },
        {
          id: 'e1-8-2',
          type: 'mcq',
          prompt: 'A teammate clones the repo. What do they run to get the same environment as you?',
          options: [
            { text: 'uv sync' },
            { text: 'uv init', why: '`uv init` creates a new project; this one already exists.' },
            { text: 'uv add everything again', why: 'The dependencies are already recorded and locked; `uv sync` installs them.' },
          ],
          answer: 0,
          explain: '`uv sync` installs exactly what `uv.lock` records.',
        },
        {
          id: 'e1-8-3',
          type: 'predict-output',
          prompt: 'The hint says the result is a float. Type what this prints.',
          code: `def half(x: int) -> float:
    return x / 2

print(half(9))`,
          answer: '4.5',
          typedWrong: [{ answer: '4', why: '`/` is true division and gives 4.5; `//` would round down to 4.' }],
          explain: '9 / 2 is 4.5, which is why the return hint is float, not int.',
        },
        {
          id: 'e1-8-4',
          type: 'fill-blank',
          prompt: 'Make this a test pytest will collect.',
          code: `def ___():
    assert 2 + 2 == 4

test_sum()
print("collected and passed")`,
          answer: ['test_sum'],
          distractors: [
            { text: 'check_sum', why: 'pytest only collects names starting with "test", and the call below needs `test_sum`.' },
            { text: 'sum_test', why: 'The function name must start with "test", not end with it.' },
          ],
          expectOutput: 'collected and passed',
          explain: 'Functions starting with `test` in `test_*.py` files are collected.',
        },
        {
          id: 'e1-8-5',
          type: 'mcq',
          prompt: 'You need `pytest` and `ruff` to work on the project but not to run it. Which command adds them?',
          options: [
            { text: 'uv add --dev pytest ruff' },
            { text: 'uv add pytest ruff', why: 'That makes them runtime dependencies, installed for every user of the package.' },
            { text: 'pip install pytest ruff', why: 'That installs them somewhere but records nothing in the project.' },
          ],
          answer: 0,
          explain: 'Development tools go in the dev group.',
        },
        {
          id: 'e1-8-6',
          type: 'spot-bug',
          prompt: 'Which line breaks the TOML?',
          code: `import tomllib
text = """
[project]
name = notes
version = "0.1.0"
"""
tomllib.loads(text)`,
          error: 'TOMLDecodeError: Invalid value...',
          answer: 3,
          raiseLine: 6,
          lineWhy: {
            '0': 'The import is fine.',
            '1': 'The string starts here.',
            '2': 'A valid table header.',
            '4': 'A quoted version: valid.',
            '5': 'The string ends here.',
            '6': 'The error is reported here, but it comes from the text.',
          },
          explain: 'Strings need quotes in TOML: `name = "notes"`.',
        },
        {
          id: 'e1-8-7',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `import pytest

def test_div():
    with pytest.raises(ValueError):
        int("abc")

test_div()
print("passed")`,
          answer: 'passed',
          options: [
            { text: 'passed' },
            { text: 'ValueError', why: '`pytest.raises` catches the expected ValueError, so the test passes.' },
          ],
          explain: '`int("abc")` raises ValueError, which is exactly what the test expects.',
        },
        {
          id: 'e1-8-8',
          type: 'mcq',
          prompt: 'CI reports `FAILED test_api.py::test_timeout - assert 30 == 10`, and the spec says the timeout is 10 s. Where do you look first?',
          options: [
            { text: 'At the code that sets the timeout' },
            { text: 'At the test, to change 10 to 30', why: 'The spec says 10 s, so the test is right; changing it would hide the bug.' },
            { text: 'At pytest\'s settings', why: 'pytest reported the values correctly; the code returned 30.' },
          ],
          answer: 0,
          explain: 'The test matches the spec, so the code is wrong.',
        },
        {
          id: 'e1-8-9',
          type: 'match-pairs',
          prompt: 'Match each problem to the tool that catches it.',
          pairs: [
            { left: 'unused import', right: 'ruff check', why: 'F401, found by the linter.' },
            { left: 'add() returns the wrong sum', right: 'pytest', why: 'Only a test knows the right answer.' },
            { left: 'str passed where int is hinted', right: 'mypy', why: 'A type checker reads the hints.' },
            { left: 'teammate has other versions', right: 'uv.lock', why: 'The lockfile pins exact versions.' },
          ],
          explain: 'Each kind of mistake has its own safety net.',
        },
        {
          id: 'e1-8-10',
          type: 'run-code',
          prompt: 'Write `test_half`, asserting that `half(9)` is 4.5.',
          before: `def half(x: int) -> float:
    return x / 2`,
          solution: 'def test_half():\n    assert half(9) == 4.5',
          tests: [
            'test_half()',
            'half = lambda x: x // 2',
            'caught = False',
            'try:',
            '    test_half()',
            'except AssertionError:',
            '    caught = True',
            'assert caught, "your test should fail when half rounds down (9 // 2 = 4)"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'def test_half():\n    assert ...',
          explain: 'A test that catches the classic `//` versus `/` mix-up.',
        },
      ],
    },
  ],
  labs: e1Labs,
  library: e1Library,
};
