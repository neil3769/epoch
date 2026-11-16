import type { LibraryPage } from '../schema';

/** Unit E1 summary page: unlocked in the Library when the unit is finished. */
export const e1Library: LibraryPage = {
  unit: 'E1',
  ideas: [
    {
      title: 'A project is described, not just written',
      text: '`uv init` creates `pyproject.toml` (name, version, `requires-python`, dependencies, scripts, build backend), `.python-version`, a README and the package under `src/<name>/`. The src layout makes tests import the installed package, so packaging mistakes show up early.',
    },
    {
      title: 'Dependencies are recorded and locked',
      text: '`uv add pkg` records a runtime dependency; `uv add --dev pkg` puts a tool in the dev group. `uv.lock` pins exact versions and is committed; `.venv` is not. `uv sync` rebuilds the environment from the lock, and `uv run cmd` runs inside it.',
    },
    {
      title: 'Type hints document and get checked by tools',
      text: 'Hints such as `list[float]`, `dict[str, int]` and `int | None` say what goes in and out. Python ignores them at run time; a type checker such as mypy, or your editor, reads them and flags mistakes before the code runs.',
    },
    {
      title: 'Tests are plain functions with plain asserts',
      text: 'pytest collects `test_*.py` / `*_test.py` files and functions starting with `test`. Use `pytest.raises` for expected errors and `pytest.approx` for floats. A good test checks one behaviour with a known right answer, and fails when the code is wrong.',
    },
    {
      title: 'Read failures from the bottom',
      text: 'The summary counts failures, `FAILED file::test` names each one, and the `E` lines show the real values. Work out the right answer yourself to decide whether the code or the test is wrong.',
    },
    {
      title: 'Linters, formatters and hooks',
      text: '`ruff check` finds likely bugs (F401: unused import), `--fix` repairs safe ones, and `ruff format` makes layout consistent. pre-commit runs such tools on every `git commit` from `.pre-commit-config.yaml`, once `pre-commit install` has been run.',
    },
  ],
  rules: [
    'Commit `pyproject.toml` and `uv.lock`; never `.venv`.',
    'Runtime deps with `uv add`, tools with `uv add --dev`.',
    'Run everything through `uv run` (tests, linters, scripts).',
    'Compare versions as numbers, never as strings.',
    'Test names start with `test`; files are `test_*.py`.',
    'Strings in TOML need quotes, versions included.',
  ],
  example: {
    code: [
      'import pytest',
      '',
      'def mean(xs: list[float]) -> float:',
      '    if not xs:',
      '        raise ValueError("empty")',
      '    return sum(xs) / len(xs)',
      '',
      'def test_mean():',
      '    assert mean([1, 2, 3]) == 2',
      '    got = mean([0.1, 0.2])',
      '    assert got == pytest.approx(0.15)',
      '',
      'def test_empty():',
      '    with pytest.raises(ValueError):',
      '        mean([])',
      '',
      'test_mean()',
      'test_empty()',
      'print("2 passed")',
    ].join('\n'),
    output: '2 passed',
    notes: [
      'Type hints document the contract: a list of floats in, a float out.',
      '`pytest.approx` avoids floating-point surprises (0.1 + 0.2 is not exactly 0.3).',
      '`pytest.raises` makes the error case part of the contract too. In a repo, `uv run pytest` finds and runs both tests for you.',
    ],
  },
  mistakes: [
    { mistake: 'Running a global `pytest` instead of `uv run pytest`.', fix: 'Use the project environment so versions match the lock.' },
    { mistake: 'Adding test tools as runtime dependencies.', fix: '`uv add --dev pytest ruff`.' },
    { mistake: 'Naming a test file `notes_tests.py`.', fix: 'Use `test_notes.py` so pytest collects it.' },
    { mistake: 'Changing the test until it passes.', fix: 'Work out the right answer first; fix whichever side is wrong.' },
    { mistake: 'Ignoring `X | None` return types.', fix: 'Check for None before using the result.' },
  ],
  forReal:
    'What the app cannot give you: a real terminal, git and a working repo. In your plan this is week 1: set up the Module 1 repo with uv (pyproject.toml, a src/ layout, ruff, pytest and pre-commit) and get one passing test. Use the uv and pytest "getting started" pages as you go.',
};
