"""Check the PyTorch unit against real PyTorch.

    npm run verify-torch        (needs a local Python with torch and numpy)

verify-content runs every snippet in the app's runtime, where `import torch`
loads the NumPy stand-in (src/python/epoch_torch.py), and saves each run that
uses torch to reports/torch-runs.json. This script runs the same code with
real PyTorch and compares what it prints and the error it raises. Differences
are listed in reports/torch-crosscheck.md and fail the run.

`python scripts/verify_torch.py --fake FILE` runs the snippets in FILE with
the stand-in instead (for working on the stand-in without Pyodide).
"""

import contextlib
import io
import json
import os
import sys
import traceback
import types
import warnings

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_fake():
    sys.path.insert(0, os.path.join(ROOT, "src", "python"))
    for m in [m for m in sys.modules if m == "torch" or m.startswith("torch.")]:
        del sys.modules[m]
    import epoch_torch

    mod = types.ModuleType("torch")
    sys.modules["torch"] = mod
    epoch_torch.install(mod.__dict__)


def run(src):
    import torch

    torch.manual_seed(0)
    g = {"__name__": "__main__"}
    buf = io.StringIO()
    res = {"stdout": "", "ok": True, "type": None, "msg": None}
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        try:
            with contextlib.redirect_stdout(buf):
                exec(compile(src, "<snippet>", "exec"), g)
        except BaseException as e:  # noqa: BLE001
            res.update(ok=False, type=type(e).__name__, msg=str(e))
            if isinstance(e, SyntaxError):
                res["msg"] = e.msg
    res["stdout"] = buf.getvalue()
    return res, g


def replay(fn, arg):
    """Repeat what verify-content's helper `fn` did, with real PyTorch."""
    import numpy as np

    res, g = run(arg["src"])
    if fn == "_v_run":
        return res
    if fn == "_v_shape":
        if not res["ok"]:
            return {"shape": "error"}
        try:
            return {"shape": str(tuple(eval(arg["target"], g).shape))}
        except Exception:  # noqa: BLE001
            return {"shape": "error"}
    if fn == "_v_pairs":
        if not res["ok"]:
            return {"error": True}
        lefts = [eval(x, g) for x in arg["lefts"]]
        if arg["mode"] == "shape":
            return {"shapes": [str(tuple(np.shape(x))) for x in lefts]}
        rights = [eval(x, g) for x in arg["rights"]]

        def eq(a, b):
            try:
                a2, b2 = np.asarray(a), np.asarray(b)
                return a2.shape == b2.shape and bool(np.array_equal(a2, b2))
            except Exception:  # noqa: BLE001
                return bool(a == b)

        return {"matrix": [[eq(x, y) for y in rights] for x in lefts]}
    raise ValueError(fn)


def clean(s):
    return "\n".join(line.rstrip() for line in (s or "").split("\n")).rstrip("\n")


def first_line(s):
    return (s or "").strip().split("\n")[0]


def main():
    args = sys.argv[1:]
    fake = "--fake" in args
    args = [a for a in args if a != "--fake"]
    path = args[0] if args else os.path.join(ROOT, "reports", "torch-runs.json")
    if fake:
        load_fake()
    import torch

    runs = json.load(open(path, encoding="utf8"))
    diffs = []
    for r in runs:
        fn, arg, exp = r.get("fn", "_v_run"), r.get("arg") or {"src": r["src"]}, r.get("result")
        try:
            got = replay(fn, arg)
        except Exception:  # noqa: BLE001
            got = {"ok": False, "type": "HarnessError", "msg": traceback.format_exc(), "stdout": ""}
        if exp is None:
            print(f"--- {r['where']}\n{got.get('stdout', got)}{'' if got.get('ok', True) else got['type'] + ': ' + str(got['msg'])}")
            continue
        problems = []
        if r.get("probe"):
            # A wrong variant: it only has to stay wrong on real PyTorch too.
            if got.get("ok") and clean(got.get("stdout")) == r["probe"]["expect"]:
                problems.append("a wrong variant gives the expected output on real PyTorch")
            if problems:
                diffs.append((r["where"], arg["src"], problems))
            continue
        if fn != "_v_run":
            want = {k: v for k, v in exp.items() if k in got}
            if got != want:
                problems.append(f"gives {got}; the app gives {want}")
        else:
            if clean(got["stdout"]) != clean(exp["stdout"]):
                problems.append(f"prints\n{clean(got['stdout'])}\nbut the app prints\n{clean(exp['stdout'])}")
            if got["ok"] != exp["ok"] or got["type"] != exp["type"]:
                problems.append(f"raises {got['type']}: {first_line(got['msg'])}; the app raises {exp['type']}: {first_line(exp['msg'])}")
            elif not got["ok"] and first_line(got["msg"]) != first_line(exp["msg"]):
                problems.append(f"message {first_line(got['msg'])!r}; the app says {first_line(exp['msg'])!r}")
        if problems:
            diffs.append((r["where"], arg["src"], problems))

    out = [
        "# PyTorch cross-check",
        "",
        f"Real PyTorch {torch.__version__} against the app's stand-in: {len(runs)} runs compared, {len(diffs)} differ.",
        "",
    ]
    for where, src, problems in diffs:
        out += [f"## {where}", "", "```python", src, "```", ""] + [f"- {p}" for p in problems] + [""]
    if not fake:
        with open(os.path.join(ROOT, "reports", "torch-crosscheck.md"), "w", encoding="utf8") as f:
            f.write("\n".join(out))
    print("\n".join(out[:3]))
    for where, _, problems in diffs[:40]:
        print(f"\n{where}")
        for p in problems:
            print("  " + p.replace("\n", "\n  "))
    sys.exit(1 if diffs else 0)


if __name__ == "__main__":
    main()
