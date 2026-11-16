import type { Lab } from '../schema';

/*
 * Unit E1 labs. Lab 1: write pytest-style tests for a function; the hidden
 * checks run each test on the real function (must pass) and on a broken one
 * (must fail), so a test that checks nothing is caught. Lab 2 starts every
 * step from an empty function and reads a pyproject.toml with tomllib.
 */

/** Hidden helper: the learner's test must fail when `slugify` is swapped for `broken`. */
const mustCatch = (test: string, broken: string, why: string) =>
  [
    '_real = slugify',
    `slugify = ${broken}`,
    '_caught = False',
    'try:',
    `    ${test}()`,
    'except Exception:',
    '    _caught = True',
    'slugify = _real',
    `assert _caught, "${why}"`,
  ].join('\n');

export const e1Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'e1-lab-1',
    title: 'Tests that catch bugs',
    intro:
      'Write pytest tests for a small, typed function, the way you would in a real repo. Each test is checked twice: it must pass on the real function and fail on a broken one. Then add a requirement, watch your new test fail, and fix the code.',
    summary: 'You wrote tests that pass on good code and fail on bad code, then used a failing test to drive a fix.',
    minutes: 12,
    unlockAfter: 'e1-05',
    given: [
      'def slugify(title: str) -> str:',
      '    words = title.lower().split()',
      '    return "-".join(words)',
    ].join('\n'),
    steps: [
      {
        goal: 'Write `test_basic`: `slugify("Hello World")` should be `"hello-world"`.',
        starter: 'def test_basic():\n    assert ___',
        solution: 'def test_basic():\n    got = slugify("Hello World")\n    assert got == "hello-world"',
        tests: ['test_basic()', mustCatch('test_basic', 'lambda t: t.lower()', 'test_basic should fail when slugify forgets the hyphens')].join('\n'),
        hints: [
          'Call slugify on "Hello World" and assert the result equals "hello-world".',
          'def test_basic():\n    got = slugify(___)\n    assert got == ___',
        ],
        explain: 'Your test passed on the real function and failed on one that keeps the space: it checks something real.',
      },
      {
        goal: 'Write `test_extra_spaces`: leading, trailing and repeated spaces should not make extra hyphens. `"  Many   spaces "` becomes `"many-spaces"`.',
        starter: 'def test_extra_spaces():\n    ___',
        solution: 'def test_extra_spaces():\n    got = slugify("  Many   spaces ")\n    assert got == "many-spaces"',
        tests: [
          'test_extra_spaces()',
          mustCatch('test_extra_spaces', 'lambda t: "-".join(t.lower().split(" "))', 'test_extra_spaces should fail when every single space becomes a hyphen'),
        ].join('\n'),
        hints: [
          'Same shape as test_basic, with the messy input and its clean result.',
          'def test_extra_spaces():\n    got = slugify(___)\n    assert got == ___',
        ],
        explain: 'Edge cases (extra spaces, empty input) are where real bugs hide.',
      },
      {
        goal: 'Write `test_empty`: `slugify("")` should be `""`.',
        starter: 'def test_empty():\n    ___',
        solution: 'def test_empty():\n    assert slugify("") == ""',
        tests: [
          'test_empty()',
          mustCatch('test_empty', 'lambda t: t.lower().split()[0]', 'test_empty should fail for a slugify that crashes on empty text'),
        ].join('\n'),
        hints: ['Empty in, empty out.', 'def test_empty():\n    assert slugify(___) == ___'],
        explain: 'A broken version that crashes on "" also fails your test: an error counts as a failure.',
      },
      {
        goal: 'New requirement: punctuation is dropped, so `"Hi, there!"` gives `"hi-there"`. Write `test_punctuation`, then redefine `slugify` so all four tests pass.',
        starter:
          'def test_punctuation():\n    got = slugify("Hi, there!")\n    assert got == "hi-there"\n\ndef slugify(title: str) -> str:\n    keep = [c for c in title.lower()\n        if ___]\n    text = "".join(keep)\n    return "-".join(text.split())',
        solution:
          'def test_punctuation():\n    got = slugify("Hi, there!")\n    assert got == "hi-there"\n\ndef slugify(title: str) -> str:\n    keep = [c for c in title.lower()\n        if c.isalnum() or c == " "]\n    text = "".join(keep)\n    return "-".join(text.split())',
        tests: [
          'for t in (test_basic, test_extra_spaces, test_empty, test_punctuation):',
          '    t()',
          'assert slugify("Rock & Roll 2!") == "rock-roll-2", f"punctuation should go, words and digits stay; got {slugify(\'Rock & Roll 2!\')!r}"',
        ].join('\n'),
        hints: [
          'Keep a character if it is a letter or digit (`c.isalnum()`) or a space; then split and join as before.',
          '    keep = [c for c in title.lower()\n        if c.___() or c == ___]',
        ],
        explain: 'Test first, see it fail, then fix the code until every test passes: the old tests make sure the fix broke nothing.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'e1-lab-2',
    title: 'Read a pyproject',
    intro:
      'Write small tools that read a `pyproject.toml` the way uv and pip do: the name and version, the dependency names, the dev tools, and a list of problems. Every step starts from an empty function.',
    summary: 'You wrote a pyproject checker: it reads the metadata and dependencies with tomllib and reports what is missing.',
    minutes: 12,
    unlockAfter: 'e1-08',
    given: [
      'import re',
      'import tomllib',
      '',
      '# what ends a package name',
      'SEP = r"[<>=!~;\\[ ]"',
      '',
      'TEXT = """',
      '[project]',
      'name = "notes-api"',
      'version = "0.1.0"',
      'requires-python = ">=3.12"',
      'dependencies = [',
      '    "httpx>=0.28",',
      '    "pydantic>=2.12,<3",',
      ']',
      '',
      '[dependency-groups]',
      'dev = ["pytest>=9", "ruff"]',
      '"""',
    ].join('\n'),
    steps: [
      {
        goal: 'Write `name_version(text)`: the project\'s name and version as one string, such as "notes-api 0.1.0".',
        starter: 'def name_version(text):\n    pass',
        solution: 'def name_version(text):\n    p = tomllib.loads(text)["project"]\n    n, v = p["name"], p["version"]\n    return f"{n} {v}"',
        tests: [
          'got = name_version(TEXT)',
          'assert got == "notes-api 0.1.0", f"got {got!r}"',
          'other = \'[project]\\nname = "x"\\nversion = "2.0"\'',
          'assert name_version(other) == "x 2.0", "it should work for any pyproject text"',
        ].join('\n'),
        hints: [
          'Parse with `tomllib.loads`, take the "project" table, and join its name and version.',
          'def name_version(text):\n    p = tomllib.loads(text)[___]\n    n, v = p["name"], p[___]\n    return f"{n} {v}"',
        ],
      },
      {
        goal: 'Write `dep_names(text)`: the names of the `[project]` dependencies without their version rules, such as `["httpx", "pydantic"]`.',
        starter: 'def dep_names(text):\n    pass',
        solution:
          'def dep_names(text):\n    p = tomllib.loads(text)["project"]\n    deps = p.get("dependencies", [])\n    return [re.split(SEP, d)[0]\n            for d in deps]',
        tests: [
          'got = dep_names(TEXT)',
          'assert got == ["httpx", "pydantic"], f"got {got}"',
          'assert dep_names(\'[project]\\nname = "x"\') == [], "no dependencies: an empty list"',
          'assert dep_names(\'[project]\\ndependencies = ["rich ~= 13.0"]\') == ["rich"], "names stop at a space or operator"',
        ].join('\n'),
        hints: [
          'A name ends at the first character matched by `SEP` (an operator, `;`, `[` or a space). `re.split(SEP, d)` and keep the first piece.',
          'def dep_names(text):\n    p = tomllib.loads(text)["project"]\n    deps = p.get(___, [])\n    return [re.split(SEP, d)[___]\n            for d in deps]',
        ],
        explain: 'Tools use a proper requirement parser (the `packaging` library); this covers the common cases.',
      },
      {
        goal: 'Write `dev_names(text)`: the names in the `dev` dependency group, or `[]` if there is none.',
        starter: 'def dev_names(text):\n    pass',
        solution:
          'def dev_names(text):\n    d = tomllib.loads(text)\n    g = d.get("dependency-groups", {})\n    dev = g.get("dev", [])\n    return [re.split(SEP, x)[0]\n            for x in dev]',
        tests: [
          'got = dev_names(TEXT)',
          'assert got == ["pytest", "ruff"], f"got {got}"',
          'assert dev_names(\'[project]\\nname = "x"\') == [], "no dependency-groups table: an empty list"',
        ].join('\n'),
        hints: [
          'Use `.get` with a default at each level, so a missing table gives an empty list instead of a KeyError.',
          'def dev_names(text):\n    d = tomllib.loads(text)\n    g = d.get(___, {})\n    dev = g.get(___, [])\n    return [re.split(SEP, x)[0]\n            for x in dev]',
        ],
      },
      {
        goal: 'Write `problems(text)`: a list of strings, in this order: "no requires-python" if it is missing, "no build-system" if there is no `[build-system]`, and "pytest in dependencies" if pytest is a `[project]` dependency.',
        starter: 'def problems(text):\n    pass',
        solution:
          'def problems(text):\n    d = tomllib.loads(text)\n    p = d["project"]\n    checks = [\n        ("requires-python" not in p,\n         "no requires-python"),\n        ("build-system" not in d,\n         "no build-system"),\n        ("pytest" in dep_names(text),\n         "pytest in dependencies"),\n    ]\n    return [m for b, m in checks if b]',
        tests: [
          'got = problems(TEXT)',
          'assert got == ["no build-system"], f"the sample has everything except [build-system]; got {got}"',
          'bad = \'[project]\\nname = "x"\\ndependencies = ["pytest>=9"]\'',
          'got = problems(bad)',
          'assert got == ["no requires-python", "no build-system", "pytest in dependencies"], f"got {got}"',
          'good = TEXT + \'\\n[build-system]\\nrequires = ["uv_build"]\\nbuild-backend = "uv_build"\\n\'',
          'assert problems(good) == [], f"a complete file has no problems; got {problems(good)}"',
        ].join('\n'),
        hints: [
          'Make (failed?, message) pairs for the three checks, then keep the messages whose check failed; reuse `dep_names` for the last.',
          'def problems(text):\n    d = tomllib.loads(text)\n    p = d["project"]\n    checks = [\n        ("requires-python" not in p,\n         "no requires-python"),\n        (___ not in d,\n         "no build-system"),\n        ("pytest" in dep_names(text),\n         "pytest in dependencies"),\n    ]\n    return [m for b, m in ___ if b]',
        ],
        explain: 'Checks like these can run in CI so a broken pyproject never reaches main.',
      },
    ],
  },
];
