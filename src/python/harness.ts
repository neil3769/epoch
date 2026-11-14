// Python helper loaded into Pyodide both in the app's worker and in
// scripts/verify-content.ts, so lessons are checked exactly the way the app
// runs them.
//
// - Captures stdout.
// - Allows top-level `await`, and rewrites a top-level `asyncio.run(x)` line
//   to `await x`: in the browser Pyodide shares the JavaScript event loop and
//   cannot block, so asyncio.run() is not available there.
// - Reports the error type, message and the line number inside the snippet.
export const HARNESS_PY = String.raw`
import ast, contextlib, inspect, io, json, re, sys, traceback

# The simulated-services module (epoch_sim.py) lives here; see installSim.
if "/epoch" not in sys.path:
    sys.path.insert(0, "/epoch")

_EPOCH_RUN = re.compile(r'^asyncio\.run\((.*)\)\s*$', re.M)

def _epoch_prep(src):
    return _EPOCH_RUN.sub(r'await \1', src)

async def _epoch_exec(src, g=None):
    if g is None:
        g = {"__name__": "__main__"}
    # Fresh simulated services (clock, scripts, call logs) for every run.
    sys.modules.pop("epoch_sim", None)
    buf = io.StringIO()
    res = {"stdout": "", "ok": True, "type": None, "msg": None, "line": None}
    try:
        with contextlib.redirect_stdout(buf):
            code = compile(_epoch_prep(src), "<snippet>", "exec",
                           flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
            r = eval(code, g)
            if inspect.iscoroutine(r):
                await r
    except BaseException as e:
        res["ok"] = False
        res["type"] = type(e).__name__
        res["msg"] = str(e)
        if isinstance(e, SyntaxError):
            res["msg"] = e.msg
            res["line"] = e.lineno
        else:
            for frame, lineno in traceback.walk_tb(e.__traceback__):
                if frame.f_code.co_filename == "<snippet>":
                    res["line"] = lineno
    res["stdout"] = buf.getvalue()
    return res, g

async def _epoch_run_json(src):
    res, _ = await _epoch_exec(src)
    return json.dumps(res)
`;

/** Write the simulated-services module where `import epoch_sim` finds it. */
export function installSim(py: { FS: { mkdirTree(p: string): void; writeFile(p: string, d: string): void } }, source: string) {
  py.FS.mkdirTree('/epoch');
  py.FS.writeFile('/epoch/epoch_sim.py', source);
}
