"""A small stand-in for PyTorch, so Epoch's PyTorch unit runs in the browser.

Pyodide cannot load PyTorch, so `import torch` in the app loads this module
instead (through the thin `torch.py` facade). It copies PyTorch's interface
for what unit F9 teaches: tensors, autograd, nn.Module, the common layers and
losses, SGD and Adam, Dataset and DataLoader, devices. It prints tensors and
raises errors with the same text as PyTorch, and every snippet in the unit is
also run against real PyTorch by scripts/verify_torch.py.

DIFFERENCES lists what is not like the real thing.
"""

import builtins as _b
import math
import sys
import types

import numpy as np

DIFFERENCES = """\
- Runs on NumPy, on the CPU only: there is no GPU, and torch.cuda.is_available() is False.
- Random numbers (torch.randn, layer initial weights, shuffling) differ from real PyTorch,
  even with the same torch.manual_seed. Results that do not depend on them match.
- Covers what this unit uses; many functions and options of real PyTorch are missing.
"""

_float, _int, _bool, _sum, _max, _min, _abs, _round = (
    _b.float, _b.int, _b.bool, _b.sum, _b.max, _b.min, _b.abs, _b.round)

_rng = np.random.default_rng(0)


def manual_seed(seed):
    global _rng
    _rng = np.random.default_rng(seed)


# ----------------------------------------------------------------- dtypes ---


class dtype:
    def __init__(self, name, np_dtype, short):
        self.name = name
        self.np = np.dtype(np_dtype)
        self.short = short

    @property
    def is_floating_point(self):
        return self.np.kind == "f"

    def __repr__(self):
        return f"torch.{self.name}"


float32 = dtype("float32", np.float32, "Float")
float64 = dtype("float64", np.float64, "Double")
float16 = dtype("float16", np.float16, "Half")
int64 = dtype("int64", np.int64, "Long")
int32 = dtype("int32", np.int32, "Int")
int16 = dtype("int16", np.int16, "Short")
int8 = dtype("int8", np.int8, "Char")
uint8 = dtype("uint8", np.uint8, "Byte")
bool_ = dtype("bool", np.bool_, "Bool")
_DTYPES = {d.np: d for d in (float32, float64, float16, int64, int32, int16, int8, uint8, bool_)}
_CAT = {"b": 0, "u": 1, "i": 1, "f": 2}


def _dt(arr):
    return _DTYPES.get(arr.dtype, float32)


def _default_for(cat):
    return {0: bool_, 1: int64, 2: float32}[cat]


class Size(tuple):
    def __repr__(self):
        return f"torch.Size({list(self)})"

    __str__ = __repr__

    def numel(self):
        return _int(np.prod(self)) if self else 1


class device:
    def __init__(self, type="cpu", index=None):
        if isinstance(type, device):
            type = type.type
        self.type = str(type).split(":")[0]

    def __repr__(self):
        return f"device(type='{self.type}')"

    def __str__(self):
        return self.type

    def __eq__(self, other):
        return str(self) == str(other)

    __hash__ = object.__hash__


class _Cuda:
    @staticmethod
    def is_available():
        return False

    @staticmethod
    def device_count():
        return 0


cuda = _Cuda()


class _Mps:
    @staticmethod
    def is_available():
        return False


backends = types.SimpleNamespace(mps=_Mps())


def _no_cuda():
    raise AssertionError("Torch not compiled with CUDA enabled")


# --------------------------------------------------------------- grad mode ---

_grad_on = [True]


class no_grad:
    def __enter__(self):
        self.prev = _grad_on[0]
        _grad_on[0] = False

    def __exit__(self, *exc):
        _grad_on[0] = self.prev
        return False

    def __call__(self, fn):
        def wrapped(*a, **k):
            with no_grad():
                return fn(*a, **k)

        return wrapped


class enable_grad(no_grad):
    def __enter__(self):
        self.prev = _grad_on[0]
        _grad_on[0] = True


def is_grad_enabled():
    return _grad_on[0]


class _Node:
    def __init__(self, name, inputs, backward, saves):
        self.name = name
        self.inputs = inputs
        self.backward = backward
        self.saves = saves
        self.freed = False

    def __repr__(self):
        return f"<{self.name} object at 0x{id(self):x}>"

    def name_(self):
        return self.name


_FREED = (
    "Trying to backward through the graph a second time (or directly access saved tensors after they "
    "have already been freed). Saved intermediate values of the graph are freed when you call .backward() "
    "or autograd.grad(). Specify retain_graph=True if you need to backward through the graph a second time "
    "or if you need to access saved tensors after calling backward."
)

# ----------------------------------------------------------------- printing ---


class _Formatter:
    def __init__(self, a):
        self.kind = a.dtype.kind
        self.int_mode = True
        self.sci = False
        self.width = 1
        flat = a.reshape(-1)
        if self.kind == "b":
            self.width = _max([len(str(_bool(v))) for v in flat], default=1)
        elif self.kind in "iu":
            self.width = _max([len(str(_int(v))) for v in flat], default=1)
        else:
            vals = [_float(v) for v in flat if np.isfinite(v) and v != 0]
            if not vals:
                return
            amin = _min(_abs(v) for v in vals)
            amax = _max(_abs(v) for v in vals)
            self.int_mode = all(v == math.ceil(v) for v in vals)
            if self.int_mode:
                if amax / amin > 1000.0 or amax > 1.0e8:
                    self.sci = True
                    self.width = _max(len(f"{v:.4e}") for v in vals)
                else:
                    self.width = _max(len(f"{v:.0f}") + 1 for v in vals)
            elif amax / amin > 1000.0 or amax > 1.0e8 or amin < 1.0e-4:
                self.sci = True
                self.width = _max(len(f"{v:.4e}") for v in vals)
            else:
                self.width = _max(len(f"{v:.4f}") for v in vals)

    def __call__(self, v):
        if self.kind == "b":
            s = str(_bool(v))
        elif self.kind in "iu":
            s = str(_int(v))
        else:
            v = _float(v)
            if self.sci:
                s = f"{v:.4e}"
            elif self.int_mode:
                s = f"{v:.0f}"
                if not (math.isinf(v) or math.isnan(v)):
                    s += "."
            else:
                s = f"{v:.4f}"
        return " " * (self.width - len(s)) + s


def _tstr(a, indent, fmt):
    if a.ndim == 0:
        return fmt(a.item())
    if a.ndim == 1:
        elems = [fmt(v) for v in a]
        per_line = _max(1, math.floor((80 - indent) / (fmt.width + 2)))
        lines = [", ".join(elems[i:i + per_line]) for i in range(0, len(elems), per_line)]
        return "[" + (",\n" + " " * (indent + 1)).join(lines) + "]"
    slices = [_tstr(a[i], indent + 1, fmt) for i in range(a.shape[0])]
    return "[" + ("," + "\n" * (a.ndim - 1) + " " * (indent + 1)).join(slices) + "]"


def _add_suffixes(s, suffixes, indent):
    out = [s]
    last = len(s) - s.rfind("\n") + 1
    for suf in suffixes:
        if last + len(suf) + 2 > 80:
            out.append(",\n" + " " * indent + suf)
            last = indent + len(suf)
        else:
            out.append(", " + suf)
            last += len(suf) + 2
    out.append(")")
    return "".join(out)


def _repr(t, prefix="tensor("):
    a = t._a
    indent = len(prefix)
    suffixes = []
    dt = t.dtype
    if a.size == 0:
        body = "[]" if a.ndim == 1 else str(np.zeros(a.shape).tolist())
        if a.ndim != 1:
            suffixes.append(f"size={tuple(a.shape)}")
        if dt is not float32:
            suffixes.append(f"dtype={dt!r}")
    else:
        body = _tstr(a, indent, _Formatter(a))
        if dt not in (float32, int64, bool_):
            suffixes.append(f"dtype={dt!r}")
    if t._fn is not None:
        suffixes.append(f"grad_fn=<{t._fn.name}>")
    elif t.requires_grad:
        suffixes.append("requires_grad=True")
    return _add_suffixes(prefix + body, suffixes, indent)


# ------------------------------------------------------------------ tensor ---


def _to_np(data, dt=None):
    if isinstance(data, Tensor):
        arr = data._a.copy()
    elif isinstance(data, np.ndarray):
        arr = data.copy()
    else:
        def plain(x):
            if isinstance(x, Tensor):
                return x._a.tolist()
            if isinstance(x, (list, tuple)):
                return [plain(y) for y in x]
            return x

        arr = np.array(plain(data))
        if arr.dtype.kind == "f":
            arr = arr.astype(np.float32)
        elif arr.dtype.kind in "iu":
            arr = arr.astype(np.int64)
    if dt is not None:
        arr = arr.astype(dt.np)
    return arr


def _check_grad_dtype(arr):
    if arr.dtype.kind != "f":
        raise RuntimeError("Only Tensors of floating point and complex dtype can require gradients")


class Tensor:
    __array_priority__ = 100

    def __init__(self, arr, requires_grad=False, _fn=None, _weak=False):
        self._a = arr if isinstance(arr, np.ndarray) else np.asarray(arr)
        self.requires_grad = requires_grad
        self.grad = None
        self._fn = _fn
        self._weak = _weak

    # -- basic facts --
    @property
    def shape(self):
        return Size(self._a.shape)

    def size(self, dim=None):
        return Size(self._a.shape) if dim is None else self._a.shape[dim]

    @property
    def dtype(self):
        return _dt(self._a)

    @property
    def device(self):
        return device("cpu")

    @property
    def ndim(self):
        return self._a.ndim

    def dim(self):
        return self._a.ndim

    def numel(self):
        return _int(self._a.size)

    def is_floating_point(self):
        return self._a.dtype.kind == "f"

    @property
    def is_leaf(self):
        return self._fn is None

    @property
    def grad_fn(self):
        return self._fn

    @property
    def data(self):
        return Tensor(self._a)

    @data.setter
    def data(self, other):
        self._a = other._a if isinstance(other, Tensor) else np.asarray(other)

    @property
    def T(self):
        if self.ndim < 2:
            return self
        return _wrap(self._a.T, [self], "PermuteBackward0", lambda g: [g.T], False)

    @property
    def mT(self):
        return self.transpose(-2, -1)

    def __repr__(self):
        return _repr(self)

    def __len__(self):
        if self.ndim == 0:
            raise TypeError("len() of a 0-d tensor")
        return self._a.shape[0]

    def __iter__(self):
        if self.ndim == 0:
            raise TypeError("iteration over a 0-d tensor")
        return (self[i] for i in range(len(self)))

    def __hash__(self):
        return id(self)

    def __array__(self, dtype=None, copy=None):
        if self.requires_grad:
            raise RuntimeError("Can't call numpy() on Tensor that requires grad. Use tensor.detach().numpy() instead.")
        return self._a if dtype is None else self._a.astype(dtype)

    def __bool__(self):
        if self._a.size != 1:
            raise RuntimeError("Boolean value of Tensor with more than one value is ambiguous")
        return _bool(self._a.reshape(-1)[0])

    def __float__(self):
        return _float(self.item())

    def __int__(self):
        return _int(self.item())

    def __index__(self):
        if self._a.dtype.kind not in "iu" or self._a.size != 1:
            raise TypeError("only integer tensors of a single element can be converted to an index")
        return _int(self.item())

    def __format__(self, spec):
        if self.ndim == 0:
            return format(self.item(), spec)
        return format(repr(self), spec)

    def item(self):
        if self._a.size != 1:
            raise RuntimeError(f"a Tensor with {self._a.size} elements cannot be converted to Scalar")
        return self._a.reshape(-1)[0].item()

    def tolist(self):
        return self._a.tolist()

    def numpy(self):
        if self.requires_grad:
            raise RuntimeError("Can't call numpy() on Tensor that requires grad. Use tensor.detach().numpy() instead.")
        return self._a

    # -- conversion --
    def to(self, *args, **kwargs):
        out = self
        for a in list(args) + list(kwargs.values()):
            if isinstance(a, dtype):
                out = out._cast(a)
            elif isinstance(a, (str, device)) and str(device(a)) != "cpu":
                _no_cuda()
        return out

    def cpu(self):
        return self

    def cuda(self, device=None):
        if device is not None and str(device).startswith("cpu"):
            raise RuntimeError("Invalid device, must be cuda device")
        _no_cuda()

    def _cast(self, dt):
        if self.dtype is dt:
            return self
        out = _wrap(self._a.astype(dt.np), [self], "ToCopyBackward0", lambda g: [g], False)
        if dt.np.kind != "f":
            out.requires_grad, out._fn = False, None
        return out

    def float(self):
        return self._cast(float32)

    def double(self):
        return self._cast(float64)

    def long(self):
        return self._cast(int64)

    def int(self):
        return self._cast(int32)

    def bool(self):
        return self._cast(bool_)

    def type(self, dt=None):
        if dt is None:
            return f"torch.{self.dtype.short}Tensor"
        return self._cast(dt)

    def detach(self):
        return Tensor(self._a)

    def clone(self):
        return _wrap(self._a.copy(), [self], "CloneBackward0", lambda g: [g], False)

    def requires_grad_(self, flag=True):
        if flag:
            _check_grad_dtype(self._a)
        self.requires_grad = flag
        return self

    def retain_grad(self):
        pass

    # -- in place (no graph) --
    def _inplace(self, value):
        if self.requires_grad and self.is_leaf and _grad_on[0]:
            raise RuntimeError("a leaf Variable that requires grad is being used in an in-place operation.")
        v = value._a if isinstance(value, Tensor) else np.asarray(value)
        _broadcast_shape(self._a.shape, v.shape)
        self._a[...] = v.astype(self._a.dtype)
        return self

    def zero_(self):
        return self._inplace(np.zeros_like(self._a))

    def fill_(self, v):
        return self._inplace(np.full_like(self._a, _scalar(v)))

    def copy_(self, src):
        return self._inplace(_t(src)._a)

    def add_(self, other, alpha=1):
        return self._inplace(self._a + _t(other)._a * alpha)

    def sub_(self, other, alpha=1):
        return self._inplace(self._a - _t(other)._a * alpha)

    def mul_(self, other):
        return self._inplace(self._a * _t(other)._a)

    def div_(self, other):
        return self._inplace(self._a / _t(other)._a)

    def clamp_(self, min=None, max=None):
        return self._inplace(np.clip(self._a, min, max))

    def normal_(self, mean=0.0, std=1.0):
        return self._inplace(_rng.normal(mean, std, self._a.shape))

    def uniform_(self, a=0.0, b=1.0):
        return self._inplace(_rng.uniform(a, b, self._a.shape))

    def __iadd__(self, o):
        return self.add_(o)

    def __isub__(self, o):
        return self.sub_(o)

    def __imul__(self, o):
        return self.mul_(o)

    def __itruediv__(self, o):
        return self.div_(o)

    def __setitem__(self, idx, value):
        if self.requires_grad and self.is_leaf and _grad_on[0]:
            raise RuntimeError("a leaf Variable that requires grad is being used in an in-place operation.")
        self._a[_np_index(idx)] = _t(value)._a

    # -- autograd --
    def backward(self, gradient=None, retain_graph=False):
        if not self.requires_grad:
            raise RuntimeError("element 0 of tensors does not require grad and does not have a grad_fn")
        if gradient is None:
            if self._a.size != 1:
                raise RuntimeError("grad can be implicitly created only for scalar outputs")
            g0 = np.ones_like(self._a)
        else:
            g0 = _t(gradient)._a.astype(self._a.dtype)
        order, seen = [], set()
        stack = [(self, False)]
        while stack:
            t, done = stack.pop()
            if done:
                order.append(t)
                continue
            if id(t) in seen:
                continue
            seen.add(id(t))
            stack.append((t, True))
            if t._fn is not None:
                for p in t._fn.inputs:
                    if p.requires_grad and id(p) not in seen:
                        stack.append((p, False))
        grads = {id(self): g0}
        for t in reversed(order):
            g = grads.pop(id(t), None)
            if g is None:
                continue
            if t._fn is None:
                g = g.astype(t._a.dtype)
                if t.grad is None:
                    t.grad = Tensor(g.copy())
                else:
                    t.grad = Tensor(t.grad._a + g)
                continue
            if t._fn.freed and t._fn.saves:
                raise RuntimeError(_FREED)
            gs = t._fn.backward(g)
            if not retain_graph:
                t._fn.freed = True
            for p, gp in zip(t._fn.inputs, gs):
                if gp is None or not p.requires_grad:
                    continue
                gp = _unbroadcast(np.asarray(gp, dtype=p._a.dtype), p._a.shape)
                grads[id(p)] = grads[id(p)] + gp if id(p) in grads else gp

    # -- arithmetic --
    def __add__(self, o):
        return _binary(self, o, np.add, "AddBackward0", lambda g, a, b: (g, g), False)

    def __radd__(self, o):
        return _binary(o, self, np.add, "AddBackward0", lambda g, a, b: (g, g), False)

    def __sub__(self, o):
        return _binary(self, o, np.subtract, "SubBackward0", lambda g, a, b: (g, -g), False)

    def __rsub__(self, o):
        return _binary(o, self, np.subtract, "RsubBackward1", lambda g, a, b: (g, -g), False)

    def __mul__(self, o):
        return _binary(self, o, np.multiply, "MulBackward0", lambda g, a, b: (g * b, g * a), True)

    def __rmul__(self, o):
        return _binary(o, self, np.multiply, "MulBackward0", lambda g, a, b: (g * b, g * a), True)

    def __truediv__(self, o):
        return _binary(self, o, np.true_divide, "DivBackward0", lambda g, a, b: (g / b, -g * a / (b * b)), True, true_div=True)

    def __rtruediv__(self, o):
        return _binary(o, self, np.true_divide, "DivBackward0", lambda g, a, b: (g / b, -g * a / (b * b)), True, true_div=True)

    def __floordiv__(self, o):
        return _binary(self, o, np.floor_divide, "DivBackward0", lambda g, a, b: (None, None), False)

    def __mod__(self, o):
        return _binary(self, o, np.mod, "RemainderBackward0", lambda g, a, b: (g, None), False)

    def __pow__(self, o):
        if not isinstance(o, Tensor):
            p = o
            return _wrap(np.power(self._a, p).astype(self._a.dtype if self._a.dtype.kind == "f" or isinstance(p, _int) else np.float32),
                         [self], "PowBackward0", lambda g: [g * p * np.power(self._a, p - 1)], True)
        return _binary(self, o, np.power, "PowBackward1",
                       lambda g, a, b: (g * b * np.power(a, b - 1), g * np.power(a, b) * np.log(np.where(a > 0, a, 1))), True)

    def __rpow__(self, o):
        return _binary(o, self, np.power, "PowBackward2",
                       lambda g, a, b: (None, g * np.power(a, b) * np.log(np.where(a > 0, a, 1))), True)

    def __neg__(self):
        return _wrap(-self._a, [self], "NegBackward0", lambda g: [-g], False)

    def __pos__(self):
        return self

    def __abs__(self):
        return self.abs()

    def __matmul__(self, o):
        return matmul(self, o)

    def __rmatmul__(self, o):
        return matmul(o, self)

    def __eq__(self, o):
        return _compare(self, o, np.equal)

    def __ne__(self, o):
        return _compare(self, o, np.not_equal)

    def __lt__(self, o):
        return _compare(self, o, np.less)

    def __le__(self, o):
        return _compare(self, o, np.less_equal)

    def __gt__(self, o):
        return _compare(self, o, np.greater)

    def __ge__(self, o):
        return _compare(self, o, np.greater_equal)

    def __and__(self, o):
        return Tensor(np.logical_and(self._a, _t(o)._a))

    def __or__(self, o):
        return Tensor(np.logical_or(self._a, _t(o)._a))

    def __invert__(self):
        return Tensor(~self._a)

    def add(self, o):
        return self + o

    def sub(self, o):
        return self - o

    def mul(self, o):
        return self * o

    def div(self, o):
        return self / o

    def pow(self, o):
        return self ** o

    def matmul(self, o):
        return matmul(self, o)

    def mm(self, o):
        return matmul(self, o)

    def eq(self, o):
        return self == o

    # -- elementwise functions --
    def _unary(self, f, name, d, saves=True):
        a = self._a if self._a.dtype.kind == "f" else self._a.astype(np.float32)
        out = f(a).astype(a.dtype)
        return _wrap(out, [self], name, lambda g: [g * d(a, out)], saves)

    def exp(self):
        return self._unary(np.exp, "ExpBackward0", lambda a, o: o)

    def log(self):
        with np.errstate(divide="ignore", invalid="ignore"):
            return self._unary(np.log, "LogBackward0", lambda a, o: 1 / a)

    def sqrt(self):
        return self._unary(np.sqrt, "SqrtBackward0", lambda a, o: 0.5 / o)

    def sin(self):
        return self._unary(np.sin, "SinBackward0", lambda a, o: np.cos(a))

    def cos(self):
        return self._unary(np.cos, "CosBackward0", lambda a, o: -np.sin(a))

    def tanh(self):
        return self._unary(np.tanh, "TanhBackward0", lambda a, o: 1 - o * o)

    def sigmoid(self):
        return self._unary(lambda a: 1 / (1 + np.exp(-a)), "SigmoidBackward0", lambda a, o: o * (1 - o))

    def relu(self):
        out = np.maximum(self._a, 0).astype(self._a.dtype)
        return _wrap(out, [self], "ReluBackward0", lambda g: [g * (self._a > 0)], True)

    def abs(self):
        return _wrap(np.abs(self._a), [self], "AbsBackward0", lambda g: [g * np.sign(self._a)], True)

    def clamp(self, min=None, max=None):
        a = self._a
        out = np.clip(a, min, max).astype(a.dtype)
        keep = np.ones(a.shape, bool)
        if min is not None:
            keep &= a >= min
        if max is not None:
            keep &= a <= max
        return _wrap(out, [self], "ClampBackward1", lambda g: [g * keep], True)

    clip = clamp

    def round(self, decimals=0):
        return Tensor(np.round(self._a, decimals).astype(self._a.dtype))

    def softmax(self, dim):
        return softmax(self, dim)

    def log_softmax(self, dim):
        return log_softmax(self, dim)

    # -- reductions --
    def sum(self, dim=None, keepdim=False):
        a = self._a
        nd = a.dtype if a.dtype.kind == "f" else np.int64
        out = np.asarray(a.sum(axis=dim, keepdims=keepdim, dtype=nd))
        name = "SumBackward0" if dim is None else "SumBackward1"
        return _wrap(out, [self], name, lambda g: [_expand_back(g, a.shape, dim, keepdim)], False)

    def mean(self, dim=None, keepdim=False):
        a = self._a
        if a.dtype.kind != "f":
            raise RuntimeError(
                "mean(): could not infer output dtype. Input dtype must be either a floating point or complex dtype. "
                f"Got: {self.dtype.short}")
        out = np.asarray(a.mean(axis=dim, keepdims=keepdim)).astype(a.dtype)
        n = a.size if dim is None else np.prod([a.shape[d] for d in (dim if isinstance(dim, (tuple, list)) else [dim])])
        name = "MeanBackward0" if dim is None else "MeanBackward1"
        return _wrap(out, [self], name, lambda g: [_expand_back(g, a.shape, dim, keepdim) / n], False)

    def std(self, dim=None, keepdim=False, unbiased=True):
        return Tensor(np.asarray(self._a.std(axis=dim, keepdims=keepdim, ddof=1 if unbiased else 0)).astype(self._a.dtype))

    def var(self, dim=None, keepdim=False, unbiased=True):
        return Tensor(np.asarray(self._a.var(axis=dim, keepdims=keepdim, ddof=1 if unbiased else 0)).astype(self._a.dtype))

    def _minmax(self, dim, keepdim, pick, argpick, name):
        a = self._a
        if dim is None:
            i = np.unravel_index(argpick(a), a.shape)

            def back(g):
                z = np.zeros_like(a)
                z[i] = g
                return [z]

            return _wrap(np.asarray(a[i]), [self], name, back, True)
        values = np.asarray(pick(a, axis=dim, keepdims=keepdim))
        idx = np.asarray(argpick(a, axis=dim, keepdims=keepdim)).astype(np.int64)

        def back(g):
            z = np.zeros_like(a)
            ii = idx if keepdim else np.expand_dims(idx, dim)
            gg = g if keepdim else np.expand_dims(g, dim)
            np.put_along_axis(z, ii, gg, axis=dim)
            return [z]

        vals = _wrap(values, [self], name, back, True)
        return _MinMax(name.split("Backward")[0].lower(), vals, Tensor(idx))

    def max(self, dim=None, keepdim=False):
        if isinstance(dim, Tensor):
            return maximum(self, dim)
        return self._minmax(dim, keepdim, np.max, np.argmax, "MaxBackward1" if dim is None else "MaxBackward0")

    def min(self, dim=None, keepdim=False):
        return self._minmax(dim, keepdim, np.min, np.argmin, "MinBackward1" if dim is None else "MinBackward0")

    def argmax(self, dim=None, keepdim=False):
        if dim is None:
            return Tensor(np.asarray(np.argmax(self._a), dtype=np.int64))
        return Tensor(np.asarray(np.argmax(self._a, axis=dim, keepdims=keepdim), dtype=np.int64))

    def argmin(self, dim=None, keepdim=False):
        if dim is None:
            return Tensor(np.asarray(np.argmin(self._a), dtype=np.int64))
        return Tensor(np.asarray(np.argmin(self._a, axis=dim, keepdims=keepdim), dtype=np.int64))

    def all(self):
        return Tensor(np.asarray(self._a.all()))

    def any(self):
        return Tensor(np.asarray(self._a.any()))

    # -- shape --
    def view(self, *shape):
        return self._reshape(shape, "ViewBackward0")

    def reshape(self, *shape):
        return self._reshape(shape, "ViewBackward0")

    def view_as(self, other):
        return self._reshape(tuple(other.shape), "ViewBackward0")

    def _reshape(self, shape, name):
        if len(shape) == 1 and isinstance(shape[0], (tuple, list, Size)):
            shape = tuple(shape[0])
        shape = tuple(_int(s) for s in shape)
        n = self._a.size
        known = _int(np.prod([s for s in shape if s != -1])) if shape else 1
        bad = shape.count(-1) > 1 or (-1 not in shape and known != n) or (-1 in shape and (known == 0 or n % known))
        if bad:
            raise RuntimeError(f"shape '{list(shape)}' is invalid for input of size {n}")
        old = self._a.shape
        return _wrap(self._a.reshape(shape), [self], name, lambda g: [g.reshape(old)], False)

    def flatten(self, start_dim=0, end_dim=-1):
        s = list(self._a.shape)
        if not s:
            return self.reshape(1)
        _check_dim(start_dim, len(s))
        _check_dim(end_dim, len(s))
        start_dim %= len(s)
        end = end_dim % len(s)
        new = s[:start_dim] + [_int(np.prod(s[start_dim:end + 1]))] + s[end + 1:]
        return self.reshape(new)

    def unsqueeze(self, dim):
        _check_dim(dim, self.ndim + 1)
        d = dim if dim >= 0 else self.ndim + 1 + dim
        old = self._a.shape
        return _wrap(np.expand_dims(self._a, d), [self], "UnsqueezeBackward0", lambda g: [g.reshape(old)], False)

    def squeeze(self, dim=None):
        old = self._a.shape
        if dim is None:
            out = self._a.reshape([s for s in old if s != 1])
        elif _check_dim(dim, len(old)) or (old and old[dim] == 1):
            out = np.squeeze(self._a, axis=dim)
        else:
            out = self._a
        return _wrap(out, [self], "SqueezeBackward0", lambda g: [g.reshape(old)], False)

    def t(self):
        if self.ndim > 2:
            raise RuntimeError(f"t() expects a tensor with <= 2 dimensions, but self is {self.ndim}D")
        return self.T

    def transpose(self, d0, d1):
        return _wrap(np.swapaxes(self._a, d0, d1), [self], "TransposeBackward0", lambda g: [np.swapaxes(g, d0, d1)], False)

    def permute(self, *dims):
        if len(dims) == 1 and isinstance(dims[0], (tuple, list)):
            dims = tuple(dims[0])
        inv = np.argsort(dims)
        return _wrap(np.transpose(self._a, dims), [self], "PermuteBackward0", lambda g: [np.transpose(g, inv)], False)

    def expand(self, *shape):
        if len(shape) == 1 and isinstance(shape[0], (tuple, list)):
            shape = tuple(shape[0])
        shape = tuple(o if s == -1 else s for s, o in zip(shape, (1,) * (len(shape) - self.ndim) + self._a.shape))
        return _wrap(np.broadcast_to(self._a, shape).copy(), [self], "ExpandBackward0", lambda g: [g], False)

    def repeat(self, *reps):
        return Tensor(np.tile(self._a, reps))

    def __getitem__(self, idx):
        i = _np_index(idx)
        a = self._a
        try:
            out = a[i]
        except IndexError as e:
            msg = str(e)
            if "out of bounds" in msg and isinstance(idx, _int):
                raise IndexError(f"index {idx} is out of bounds for dimension 0 with size {a.shape[0]}") from None
            raise

        def back(g):
            z = np.zeros_like(a)
            np.add.at(z, i, g)
            return [z]

        return _wrap(np.array(out), [self], "SelectBackward0" if isinstance(idx, _int) else "IndexBackward0", back, False)


class _MinMax(tuple):
    def __new__(cls, name, values, indices):
        obj = tuple.__new__(cls, (values, indices))
        obj._name = name
        return obj

    @property
    def values(self):
        return self[0]

    @property
    def indices(self):
        return self[1]

    def __repr__(self):
        return f"torch.return_types.{self._name}(\nvalues={self[0]!r},\nindices={self[1]!r})"


class Parameter(Tensor):
    def __init__(self, data=None, requires_grad=True):
        arr = np.zeros(0, np.float32) if data is None else (data._a if isinstance(data, Tensor) else np.asarray(data))
        super().__init__(arr, requires_grad)

    def __repr__(self):
        return "Parameter containing:\n" + _repr(self)


# ------------------------------------------------------------- op helpers ---


def _check_dim(dim, ndim):
    n = _max(ndim, 1)
    if not -n <= dim < n:
        raise IndexError(f"Dimension out of range (expected to be in range of [{-n}, {n - 1}], but got {dim})")
    return False


def _scalar(v):
    return v.item() if isinstance(v, Tensor) else v


def _t(x):
    if isinstance(x, Tensor):
        return x
    if isinstance(x, (_bool, np.bool_)):
        return Tensor(np.asarray(x), _weak=True)
    if isinstance(x, (_int, np.integer)):
        return Tensor(np.asarray(x, np.int64), _weak=True)
    if isinstance(x, (_float, np.floating)):
        return Tensor(np.asarray(x, np.float32), _weak=True)
    return Tensor(_to_np(x))


def _np_index(idx):
    if isinstance(idx, Tensor):
        return idx._a
    if isinstance(idx, tuple):
        return tuple(i._a if isinstance(i, Tensor) else i for i in idx)
    if isinstance(idx, list):
        return np.asarray(idx)
    return idx


def _result_dtype(a, b, true_div=False):
    ca, cb = _CAT[a._a.dtype.kind], _CAT[b._a.dtype.kind]
    if a._weak and not b._weak:
        dt = _default_for(ca) if ca > cb else b.dtype
    elif b._weak and not a._weak:
        dt = _default_for(cb) if cb > ca else a.dtype
    elif ca != cb:
        dt = a.dtype if ca > cb else b.dtype
    elif a._weak and b._weak:
        dt = _default_for(ca)
    else:
        dt = a.dtype if a._a.dtype.itemsize >= b._a.dtype.itemsize else b.dtype
    if true_div and _CAT[dt.np.kind] < 2:
        dt = float32
    return dt


def _broadcast_shape(sa, sb):
    n = _max(len(sa), len(sb))
    pa = (1,) * (n - len(sa)) + tuple(sa)
    pb = (1,) * (n - len(sb)) + tuple(sb)
    out = []
    for i in range(n - 1, -1, -1):
        x, y = pa[i], pb[i]
        if x != y and x != 1 and y != 1:
            raise RuntimeError(f"The size of tensor a ({x}) must match the size of tensor b ({y}) at non-singleton dimension {i}")
        out.append(_max(x, y) if x and y else 0)
    return tuple(reversed(out))


def _unbroadcast(g, shape):
    if g.shape == tuple(shape):
        return g
    while g.ndim > len(shape):
        g = g.sum(axis=0)
    for i, s in enumerate(shape):
        if s == 1 and g.shape[i] != 1:
            g = g.sum(axis=i, keepdims=True)
    return g.reshape(shape)


def _expand_back(g, shape, dim, keepdim):
    if dim is not None and not keepdim:
        dims = dim if isinstance(dim, (tuple, list)) else [dim]
        for d in sorted(d % len(shape) for d in dims):
            g = np.expand_dims(g, d)
    return np.broadcast_to(g, shape).copy()


def _wrap(arr, inputs, name, backward, saves):
    t = Tensor(np.asarray(arr))
    if _grad_on[0] and any(p.requires_grad for p in inputs):
        t.requires_grad = True
        t._fn = _Node(name, inputs, backward, saves)
    return t


def _binary(a, b, f, name, grads, saves, true_div=False):
    a, b = _t(a), _t(b)
    dt = _result_dtype(a, b, true_div)
    _broadcast_shape(a._a.shape, b._a.shape)
    x, y = a._a.astype(dt.np), b._a.astype(dt.np)
    with np.errstate(divide="ignore", invalid="ignore"):
        out = np.asarray(f(x, y)).astype(dt.np)

    def back(g):
        ga, gb = grads(g, x, y)
        return [ga, gb]

    return _wrap(out, [a, b], name, back, saves)


def _compare(a, b, f):
    a, b = _t(a), _t(b)
    dt = _result_dtype(a, b)
    _broadcast_shape(a._a.shape, b._a.shape)
    return Tensor(np.asarray(f(a._a.astype(dt.np), b._a.astype(dt.np))))


def _shape_str(s):
    return "x".join(str(v) for v in s)


def matmul(a, b):
    a, b = _t(a), _t(b)
    x, y = a._a, b._a
    if a.dtype is not b.dtype:
        if x.ndim == 1 and y.ndim == 1:
            raise RuntimeError(f"dot : expected both vectors to have same dtype, but found {a.dtype.short} and {b.dtype.short}")
        if y.ndim == 1 or x.ndim == 1:
            raise RuntimeError(f"expected scalar type {a.dtype.short} but found {b.dtype.short}")
        # The real message names C types, which differ between platforms.
        raise RuntimeError(f"expected m1 and m2 to have the same dtype, but got: {_cname(a.dtype)} != {_cname(b.dtype)}")
    if x.ndim == 0 or y.ndim == 0:
        raise RuntimeError("both arguments to matmul need to be at least 1D, but they are "
                           f"{x.ndim}D and {y.ndim}D")
    if x.ndim == 2 and y.ndim == 2 and x.shape[1] != y.shape[0]:
        raise RuntimeError(f"mat1 and mat2 shapes cannot be multiplied ({_shape_str(x.shape)} and {_shape_str(y.shape)})")
    if x.ndim == 1 and y.ndim == 1 and x.shape[0] != y.shape[0]:
        raise RuntimeError(
            f"inconsistent tensor size, expected tensor [{x.shape[0]}] and src [{y.shape[0]}] to have the same "
            f"number of elements, but got {x.shape[0]} and {y.shape[0]} elements respectively")
    if x.ndim == 2 and y.ndim == 1 and x.shape[1] != y.shape[0]:
        raise RuntimeError(f"size mismatch, got input ({x.shape[0]}), mat ({_shape_str(x.shape)}), vec ({y.shape[0]})")
    if x.ndim == 1 and y.ndim == 2 and x.shape[0] != y.shape[0]:
        raise RuntimeError(f"size mismatch, got input ({y.shape[1]}), mat ({_shape_str(y.T.shape)}), vec ({x.shape[0]})")
    if x.shape[-1] != (y.shape[-2] if y.ndim > 1 else y.shape[0]):
        raise RuntimeError(f"Expected size for first two dimensions of batch2 tensor to be: [{y.shape[0]}, {x.shape[-1]}] "
                           f"but got: [{y.shape[0]}, {y.shape[-2]}].")
    out = np.matmul(x, y)
    x2 = x[None, :] if x.ndim == 1 else x
    y2 = y[:, None] if y.ndim == 1 else y

    def back(g):
        g2 = g
        if x.ndim == 1 and y.ndim == 1:
            g2 = np.asarray(g).reshape(1, 1)
        elif x.ndim == 1:
            g2 = np.expand_dims(g, -2)
        elif y.ndim == 1:
            g2 = np.expand_dims(g, -1)
        gx = np.matmul(g2, np.swapaxes(y2, -1, -2))
        gy = np.matmul(np.swapaxes(x2, -1, -2), g2)
        gx = _unbroadcast(gx, x2.shape).reshape(x.shape)
        gy = _unbroadcast(gy, y2.shape).reshape(y.shape)
        return [gx, gy]

    name = "MmBackward0" if x.ndim == 2 and y.ndim == 2 else "DotBackward0" if x.ndim == 1 and y.ndim == 1 else \
        "MvBackward0" if y.ndim == 1 and x.ndim == 2 else "UnsafeViewBackward0" if x.ndim > 2 else "SqueezeBackward4"
    return _wrap(np.asarray(out), [a, b], name, back, True)


def _cname(dt):
    return {"Float": "float", "Double": "double", "Long": "long int", "Int": "int", "Bool": "bool", "Half": "c10::Half"}.get(dt.short, dt.short)


mm = matmul


def softmax(x, dim):
    x = _t(x)
    a = x._a - x._a.max(axis=dim, keepdims=True)
    e = np.exp(a)
    s = (e / e.sum(axis=dim, keepdims=True)).astype(x._a.dtype)
    return _wrap(s, [x], "SoftmaxBackward0", lambda g: [s * (g - (g * s).sum(axis=dim, keepdims=True))], True)


def log_softmax(x, dim):
    x = _t(x)
    a = x._a - x._a.max(axis=dim, keepdims=True)
    ls = (a - np.log(np.exp(a).sum(axis=dim, keepdims=True))).astype(x._a.dtype)
    return _wrap(ls, [x], "LogSoftmaxBackward0", lambda g: [g - np.exp(ls) * g.sum(axis=dim, keepdims=True)], True)


def maximum(a, b):
    a, b = _t(a), _t(b)
    return _binary(a, b, np.maximum, "MaximumBackward0", lambda g, x, y: (g * (x >= y), g * (x < y)), True)


def where(cond, a, b):
    a, b = _t(a), _t(b)
    c = _t(cond)._a.astype(bool)
    dt = _result_dtype(a, b)
    out = np.where(c, a._a, b._a).astype(dt.np)
    return _wrap(out, [a, b], "WhereBackward0", lambda g: [g * c, g * ~c], True)


def cat(tensors, dim=0):
    ts = [_t(t) for t in tensors]
    out = np.concatenate([t._a for t in ts], axis=dim)
    sizes = np.cumsum([t._a.shape[dim] for t in ts])[:-1]
    return _wrap(out, ts, "CatBackward0", lambda g: np.split(g, sizes, axis=dim), False)


concat = cat


def stack(tensors, dim=0):
    ts = [_t(t) for t in tensors]
    shapes = {tuple(t._a.shape) for t in ts}
    if len(shapes) > 1:
        s = [list(t._a.shape) for t in ts]
        raise RuntimeError(f"stack expects each tensor to be equal size, but got {s[0]} at entry 0 and "
                           f"{next(x for x in s if x != s[0])} at entry {next(i for i, x in enumerate(s) if x != s[0])}")
    out = np.stack([t._a for t in ts], axis=dim)
    return _wrap(out, ts, "StackBackward0", lambda g: [np.take(g, i, axis=dim) for i in range(len(ts))], False)


# --------------------------------------------------------------- factories ---


def tensor(data, dtype=None, requires_grad=False, device=None):
    if device is not None and str(device) != "cpu":
        _no_cuda()
    arr = _to_np(data, dtype)
    if requires_grad:
        _check_grad_dtype(arr)
    return Tensor(arr, requires_grad)


def as_tensor(data, dtype=None):
    if isinstance(data, Tensor) and (dtype is None or data.dtype is dtype):
        return data
    return tensor(data, dtype)


def from_numpy(arr):
    return Tensor(arr)


def is_tensor(x):
    return isinstance(x, Tensor)


def _size_args(size):
    if len(size) == 1 and isinstance(size[0], (tuple, list, Size)):
        return tuple(size[0])
    return tuple(size)


def _factory(arr, dtype, requires_grad):
    if dtype is not None:
        arr = arr.astype(dtype.np)
    if requires_grad:
        _check_grad_dtype(arr)
    return Tensor(arr, requires_grad)


def zeros(*size, dtype=None, requires_grad=False, device=None):
    return _factory(np.zeros(_size_args(size), np.float32), dtype, requires_grad)


def ones(*size, dtype=None, requires_grad=False, device=None):
    return _factory(np.ones(_size_args(size), np.float32), dtype, requires_grad)


def full(size, fill_value, dtype=None, requires_grad=False):
    base = np.float32 if isinstance(fill_value, _float) else np.int64 if isinstance(fill_value, _int) else None
    return _factory(np.full(tuple(size), fill_value, base), dtype, requires_grad)


def empty(*size, dtype=None, requires_grad=False):
    return zeros(*size, dtype=dtype, requires_grad=requires_grad)


def zeros_like(t, dtype=None, requires_grad=False):
    return _factory(np.zeros_like(t._a), dtype, requires_grad)


def ones_like(t, dtype=None, requires_grad=False):
    return _factory(np.ones_like(t._a), dtype, requires_grad)


def rand(*size, dtype=None, requires_grad=False):
    return _factory(_rng.random(_size_args(size)).astype(np.float32), dtype, requires_grad)


def randn(*size, dtype=None, requires_grad=False):
    return _factory(_rng.standard_normal(_size_args(size)).astype(np.float32), dtype, requires_grad)


def randint(low, high=None, size=(), dtype=None):
    if high is None:
        low, high = 0, low
    return _factory(_rng.integers(low, high, tuple(size)).astype(np.int64), dtype, False)


def randperm(n):
    return Tensor(_rng.permutation(n).astype(np.int64))


def arange(start, end=None, step=1, dtype=None, requires_grad=False):
    if end is None:
        start, end = 0, start
    is_int = all(isinstance(v, _int) for v in (start, end, step))
    arr = np.arange(start, end, step, dtype=np.int64 if is_int else np.float32)
    return _factory(arr, dtype, requires_grad)


def linspace(start, end, steps, dtype=None, requires_grad=False):
    return _factory(np.linspace(start, end, steps).astype(np.float32), dtype, requires_grad)


def eye(n, m=None, dtype=None):
    return _factory(np.eye(n, m, dtype=np.float32), dtype, False)


def allclose(a, b, rtol=1e-05, atol=1e-08):
    return _bool(np.allclose(_t(a)._a, _t(b)._a, rtol=rtol, atol=atol))


def equal(a, b):
    return _bool(a._a.shape == b._a.shape and np.array_equal(a._a, b._a))


def numel(t):
    return t.numel()


def _fn(name):
    return lambda x, *a, **k: getattr(_t(x), name)(*a, **k)


# ---------------------------------------------------------------------- nn ---


class Module:
    def __init__(self):
        object.__setattr__(self, "_parameters", {})
        object.__setattr__(self, "_modules", {})
        object.__setattr__(self, "training", True)

    def __setattr__(self, name, value):
        d = self.__dict__
        if isinstance(value, Parameter):
            if "_parameters" not in d:
                raise AttributeError("cannot assign parameters before Module.__init__() call")
            d["_modules"].pop(name, None)
            d["_parameters"][name] = value
        elif isinstance(value, Module):
            if "_modules" not in d:
                raise AttributeError("cannot assign module before Module.__init__() call")
            d["_parameters"].pop(name, None)
            d["_modules"][name] = value
        else:
            if "_parameters" in d and name in d["_parameters"]:
                if value is not None:
                    raise TypeError(f"cannot assign '{type(value).__module__}.{type(value).__name__}' as parameter "
                                    f"'{name}' (torch.nn.Parameter or None expected)")
                d["_parameters"][name] = None
                return
            object.__setattr__(self, name, value)

    def __getattr__(self, name):
        d = self.__dict__
        if "_parameters" in d and name in d["_parameters"]:
            return d["_parameters"][name]
        if "_modules" in d and name in d["_modules"]:
            return d["_modules"][name]
        raise AttributeError(f"'{type(self).__name__}' object has no attribute '{name}'")

    def __call__(self, *args, **kwargs):
        return self.forward(*args, **kwargs)

    def forward(self, *args, **kwargs):
        raise NotImplementedError(f'Module [{type(self).__name__}] is missing the required "forward" function')

    def named_parameters(self, prefix="", recurse=True):
        seen = set()
        for name, p in self._named_params(prefix):
            if id(p) not in seen:
                seen.add(id(p))
                yield name, p

    def _named_params(self, prefix):
        for name, p in self.__dict__.get("_parameters", {}).items():
            if p is not None:
                yield prefix + name, p
        for name, m in self.__dict__.get("_modules", {}).items():
            if m is not None:
                yield from m._named_params(prefix + name + ".")

    def parameters(self, recurse=True):
        for _, p in self.named_parameters():
            yield p

    def named_children(self):
        yield from self.__dict__.get("_modules", {}).items()

    def children(self):
        for _, m in self.named_children():
            yield m

    def modules(self):
        yield self
        for m in self.children():
            yield from m.modules()

    def train(self, mode=True):
        object.__setattr__(self, "training", mode)
        for m in self.children():
            m.train(mode)
        return self

    def eval(self):
        return self.train(False)

    def zero_grad(self, set_to_none=True):
        for p in self.parameters():
            p.grad = None

    def requires_grad_(self, flag=True):
        for p in self.parameters():
            p.requires_grad = flag
        return self

    def to(self, *args, **kwargs):
        for a in list(args) + list(kwargs.values()):
            if isinstance(a, (str, device)) and str(device(a)) != "cpu":
                _no_cuda()
            if isinstance(a, dtype):
                for p in self.parameters():
                    p._a = p._a.astype(a.np)
        return self

    def cpu(self):
        return self

    def cuda(self, *a):
        _no_cuda()

    def state_dict(self):
        return {k: Tensor(v._a.copy()) for k, v in self.named_parameters()}

    def load_state_dict(self, sd):
        own = dict(self.named_parameters())
        missing = [k for k in own if k not in sd]
        unexpected = [k for k in sd if k not in own]
        if missing or unexpected:
            raise RuntimeError(f"Error(s) in loading state_dict for {type(self).__name__}:\n\t"
                               f"Missing key(s) in state_dict: {missing}. Unexpected key(s) in state_dict: {unexpected}.")
        for k, v in sd.items():
            own[k]._a[...] = v._a
        return None

    def apply(self, fn):
        for m in self.children():
            m.apply(fn)
        fn(self)
        return self

    def extra_repr(self):
        return ""

    def __repr__(self):
        extra = self.extra_repr()
        lines = extra.split("\n") if extra else []
        for name, m in self.named_children():
            r = repr(m).replace("\n", "\n  ")
            lines.append(f"({name}): {r}")
        main = type(self).__name__ + "("
        if lines:
            if len(lines) == 1 and not list(self.named_children()):
                return main + lines[0] + ")"
            return main + "\n  " + "\n  ".join(lines) + "\n)"
        return main + ")"


class Linear(Module):
    def __init__(self, in_features, out_features, bias=True):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        k = 1 / math.sqrt(in_features)
        self.weight = Parameter(Tensor(_rng.uniform(-k, k, (out_features, in_features)).astype(np.float32)))
        if bias:
            self.bias = Parameter(Tensor(_rng.uniform(-k, k, (out_features,)).astype(np.float32)))
        else:
            self.bias = None

    def forward(self, input):
        return linear(input, self.weight, self.bias)

    def extra_repr(self):
        return f"in_features={self.in_features}, out_features={self.out_features}, bias={self.bias is not None}"


def linear(x, weight, bias=None):
    x = _t(x)
    if x.dtype is not weight.dtype:
        raise RuntimeError(f"mat1 and mat2 must have the same dtype, but got {x.dtype.short} and {weight.dtype.short}")
    if x.shape[-1] != weight.shape[1]:
        rows = _int(np.prod(x.shape[:-1])) if x.ndim > 1 else 1
        raise RuntimeError(f"mat1 and mat2 shapes cannot be multiplied ({rows}x{x.shape[-1]} and "
                           f"{weight.shape[1]}x{weight.shape[0]})")
    out = matmul(x, weight.T)
    return out + bias if bias is not None else out


class ReLU(Module):
    def __init__(self, inplace=False):
        super().__init__()

    def forward(self, input):
        return _t(input).relu()


class Sigmoid(Module):
    def forward(self, input):
        return _t(input).sigmoid()


class Tanh(Module):
    def forward(self, input):
        return _t(input).tanh()


class Identity(Module):
    def forward(self, x):
        return x


class Softmax(Module):
    def __init__(self, dim=None):
        super().__init__()
        self.dim = dim

    def forward(self, x):
        return softmax(x, self.dim)

    def extra_repr(self):
        return f"dim={self.dim}"


class Flatten(Module):
    def __init__(self, start_dim=1, end_dim=-1):
        super().__init__()
        self.start_dim, self.end_dim = start_dim, end_dim

    def forward(self, x):
        return x.flatten(self.start_dim, self.end_dim)

    def extra_repr(self):
        return f"start_dim={self.start_dim}, end_dim={self.end_dim}"


class Dropout(Module):
    def __init__(self, p=0.5, inplace=False):
        super().__init__()
        self.p = p

    def forward(self, x):
        if not self.training or self.p == 0:
            return x
        keep = (_rng.random(x._a.shape) >= self.p).astype(x._a.dtype) / (1 - self.p)
        return x * Tensor(keep)

    def extra_repr(self):
        return f"p={self.p}, inplace=False"


class Sequential(Module):
    def __init__(self, *mods):
        super().__init__()
        for i, m in enumerate(mods):
            self._modules[str(i)] = m

    def forward(self, x):
        for m in self._modules.values():
            x = m(x)
        return x

    def __getitem__(self, i):
        mods = list(self._modules.values())
        if isinstance(i, slice):
            return Sequential(*mods[i])
        return mods[i]

    def __len__(self):
        return len(self._modules)

    def __iter__(self):
        return iter(self._modules.values())

    def append(self, m):
        self._modules[str(len(self._modules))] = m
        return self


class ModuleList(Module):
    def __init__(self, mods=()):
        super().__init__()
        for i, m in enumerate(mods):
            self._modules[str(i)] = m

    def __getitem__(self, i):
        return list(self._modules.values())[i]

    def __len__(self):
        return len(self._modules)

    def __iter__(self):
        return iter(self._modules.values())

    def append(self, m):
        self._modules[str(len(self._modules))] = m
        return self


def _reduce(x, reduction):
    if reduction == "mean":
        return x.mean()
    if reduction == "sum":
        return x.sum()
    return x


def mse_loss(input, target, reduction="mean"):
    d = input - target
    out = _reduce(d * d, reduction)
    if out._fn is not None:
        out._fn.name = "MseLossBackward0"
    return out


def l1_loss(input, target, reduction="mean"):
    out = _reduce((input - target).abs(), reduction)
    if out._fn is not None:
        out._fn.name = "L1LossBackward0"
    return out


def cross_entropy(input, target, reduction="mean"):
    input, target = _t(input), _t(target)
    if target.dtype.is_floating_point and target.shape == input.shape:
        out = _reduce(-(log_softmax(input, 1) * target).sum(1), reduction)
    else:
        if target._a.dtype.kind not in "iu":
            raise RuntimeError(f"expected scalar type Long but found {target.dtype.short}")
        if input.ndim == 1:
            input, target = input.unsqueeze(0), target.reshape(1)
        n, c = input.shape
        if target._a.shape != (n,):
            raise ValueError(f"Expected input batch_size ({n}) to match target batch_size ({target._a.size}).")
        if target._a.size and (target._a.max() >= c or target._a.min() < 0):
            raise IndexError(f"Target {_int(target._a.max())} is out of bounds.")
        picked = log_softmax(input, 1)[Tensor(np.arange(n)), target]
        out = _reduce(-picked, reduction)
    if out._fn is not None:
        out._fn.name = "NllLossBackward0"
    return out


def binary_cross_entropy_with_logits(input, target, reduction="mean"):
    x, t = _t(input), _t(target)
    if x.shape != t.shape:
        raise ValueError(f"Target size ({t.shape}) must be the same as input size ({x.shape})")
    out = _reduce(x.relu() - x * t + ((-x.abs()).exp() + 1).log(), reduction)
    if out._fn is not None:
        out._fn.name = "BinaryCrossEntropyWithLogitsBackward0"
    return out


def binary_cross_entropy(input, target, reduction="mean"):
    x, t = _t(input), _t(target)
    out = _reduce(-(t * x.log() + (1 - t) * (1 - x).log()), reduction)
    if out._fn is not None:
        out._fn.name = "BinaryCrossEntropyBackward0"
    return out


class _Loss(Module):
    def __init__(self, f, reduction="mean"):
        super().__init__()
        object.__setattr__(self, "_f", f)
        self.reduction = reduction

    def forward(self, input, target):
        return self._f(input, target, reduction=self.reduction)


class MSELoss(_Loss):
    def __init__(self, reduction="mean"):
        super().__init__(mse_loss, reduction)


class L1Loss(_Loss):
    def __init__(self, reduction="mean"):
        super().__init__(l1_loss, reduction)


class CrossEntropyLoss(_Loss):
    def __init__(self, reduction="mean"):
        super().__init__(cross_entropy, reduction)


class BCEWithLogitsLoss(_Loss):
    def __init__(self, reduction="mean"):
        super().__init__(binary_cross_entropy_with_logits, reduction)


class BCELoss(_Loss):
    def __init__(self, reduction="mean"):
        super().__init__(binary_cross_entropy, reduction)


def _init_fill(t, arr):
    with no_grad():
        t._a[...] = arr
    return t


init = types.SimpleNamespace(
    zeros_=lambda t: _init_fill(t, 0),
    ones_=lambda t: _init_fill(t, 1),
    constant_=lambda t, v: _init_fill(t, v),
    normal_=lambda t, mean=0.0, std=1.0: _init_fill(t, _rng.normal(mean, std, t._a.shape)),
    uniform_=lambda t, a=0.0, b=1.0: _init_fill(t, _rng.uniform(a, b, t._a.shape)),
)

# ------------------------------------------------------------------- optim ---


class Optimizer:
    def __init__(self, params, defaults):
        params = list(params)
        if not params:
            raise ValueError("optimizer got an empty parameter list")
        self.param_groups = [dict(defaults, params=params)]
        self.state = {}
        self.defaults = defaults

    def zero_grad(self, set_to_none=True):
        for g in self.param_groups:
            for p in g["params"]:
                if set_to_none:
                    p.grad = None
                elif p.grad is not None:
                    p.grad._a[...] = 0


class SGD(Optimizer):
    def __init__(self, params, lr=0.001, momentum=0, weight_decay=0):
        super().__init__(params, dict(lr=lr, momentum=momentum, weight_decay=weight_decay))

    def step(self):
        for g in self.param_groups:
            for p in g["params"]:
                if p.grad is None:
                    continue
                d = p.grad._a
                if g["weight_decay"]:
                    d = d + g["weight_decay"] * p._a
                if g["momentum"]:
                    buf = self.state.get(id(p))
                    buf = d.copy() if buf is None else g["momentum"] * buf + d
                    self.state[id(p)] = buf
                    d = buf
                p._a[...] = p._a - g["lr"] * d


class Adam(Optimizer):
    def __init__(self, params, lr=0.001, betas=(0.9, 0.999), eps=1e-08, weight_decay=0):
        super().__init__(params, dict(lr=lr, betas=betas, eps=eps, weight_decay=weight_decay))

    def step(self):
        for g in self.param_groups:
            b1, b2 = g["betas"]
            for p in g["params"]:
                if p.grad is None:
                    continue
                d = p.grad._a
                if g["weight_decay"]:
                    d = d + g["weight_decay"] * p._a
                s = self.state.setdefault(id(p), {"step": 0, "m": np.zeros_like(p._a), "v": np.zeros_like(p._a)})
                s["step"] += 1
                s["m"] = b1 * s["m"] + (1 - b1) * d
                s["v"] = b2 * s["v"] + (1 - b2) * d * d
                mh = s["m"] / (1 - b1 ** s["step"])
                vh = s["v"] / (1 - b2 ** s["step"])
                p._a[...] = p._a - g["lr"] * mh / (np.sqrt(vh) + g["eps"])


# -------------------------------------------------------------------- data ---


class Dataset:
    def __getitem__(self, i):
        raise NotImplementedError

    def __len__(self):
        raise NotImplementedError


class TensorDataset(Dataset):
    def __init__(self, *tensors):
        if any(t.shape[0] != tensors[0].shape[0] for t in tensors):
            raise AssertionError("Size mismatch between tensors")
        self.tensors = tensors

    def __getitem__(self, i):
        return tuple(t[i] for t in self.tensors)

    def __len__(self):
        return self.tensors[0].shape[0]


class Subset(Dataset):
    def __init__(self, dataset, indices):
        self.dataset, self.indices = dataset, list(indices)

    def __getitem__(self, i):
        return self.dataset[self.indices[i]]

    def __len__(self):
        return len(self.indices)


def random_split(dataset, lengths, generator=None):
    n = len(dataset)
    if all(isinstance(x, _float) for x in lengths) and _abs(_sum(lengths) - 1) < 1e-9:
        counts = [math.floor(n * f) for f in lengths]
        for i in range(n - _sum(counts)):
            counts[i % len(counts)] += 1
        lengths = counts
    if _sum(lengths) != n:
        raise ValueError("Sum of input lengths does not equal the length of the input dataset!")
    perm = _rng.permutation(n).tolist()
    out, start = [], 0
    for k in lengths:
        out.append(Subset(dataset, perm[start:start + k]))
        start += k
    return out


def default_collate(batch):
    first = batch[0]
    if isinstance(first, Tensor):
        return stack(batch)
    if isinstance(first, (tuple, list)):
        return [default_collate(list(x)) for x in zip(*batch)]
    if isinstance(first, dict):
        return {k: default_collate([b[k] for b in batch]) for k in first}
    if isinstance(first, _bool):
        return Tensor(np.array(batch))
    if isinstance(first, _int):
        return Tensor(np.array(batch, np.int64))
    if isinstance(first, _float):
        return Tensor(np.array(batch, np.float64))
    return batch


class SequentialSampler:
    def __init__(self, data_source):
        self.data_source = data_source

    def __iter__(self):
        return iter(range(len(self.data_source)))

    def __len__(self):
        return len(self.data_source)


class RandomSampler(SequentialSampler):
    def __iter__(self):
        return iter(_rng.permutation(len(self.data_source)).tolist())


class DataLoader:
    def __init__(self, dataset, batch_size=1, shuffle=False, drop_last=False, collate_fn=None, num_workers=0):
        self.dataset = dataset
        self.batch_size = batch_size
        self.drop_last = drop_last
        self.collate_fn = collate_fn or default_collate
        self.sampler = RandomSampler(dataset) if shuffle else SequentialSampler(dataset)

    def __iter__(self):
        n = len(self.dataset)
        order = list(self.sampler)
        for i in range(0, n, self.batch_size):
            idx = order[i:i + self.batch_size]
            if self.drop_last and len(idx) < self.batch_size:
                return
            yield self.collate_fn([self.dataset[j] for j in idx])

    def __len__(self):
        n = len(self.dataset)
        return n // self.batch_size if self.drop_last else math.ceil(n / self.batch_size)


# ------------------------------------------------------------------ install ---


def install(g):
    """Fill the `torch` module's namespace and register its submodules."""
    name = g["__name__"]
    F = types.ModuleType(name + ".nn.functional")
    for k, v in dict(
        linear=linear, relu=lambda x: _t(x).relu(), sigmoid=lambda x: _t(x).sigmoid(), tanh=lambda x: _t(x).tanh(),
        softmax=softmax, log_softmax=log_softmax, mse_loss=mse_loss, l1_loss=l1_loss, cross_entropy=cross_entropy,
        binary_cross_entropy_with_logits=binary_cross_entropy_with_logits, binary_cross_entropy=binary_cross_entropy,
    ).items():
        setattr(F, k, v)
    nn = types.ModuleType(name + ".nn")
    for k, v in dict(
        Module=Module, Parameter=Parameter, Linear=Linear, ReLU=ReLU, Sigmoid=Sigmoid, Tanh=Tanh, Identity=Identity,
        Softmax=Softmax, Flatten=Flatten, Dropout=Dropout, Sequential=Sequential, ModuleList=ModuleList,
        MSELoss=MSELoss, L1Loss=L1Loss, CrossEntropyLoss=CrossEntropyLoss, BCEWithLogitsLoss=BCEWithLogitsLoss,
        BCELoss=BCELoss, functional=F, init=init,
    ).items():
        setattr(nn, k, v)
    optim = types.ModuleType(name + ".optim")
    optim.SGD, optim.Adam, optim.Optimizer = SGD, Adam, Optimizer
    utils = types.ModuleType(name + ".utils")
    data = types.ModuleType(name + ".utils.data")
    for k, v in dict(Dataset=Dataset, TensorDataset=TensorDataset, DataLoader=DataLoader, Subset=Subset,
                     random_split=random_split, default_collate=default_collate,
                     RandomSampler=RandomSampler, SequentialSampler=SequentialSampler).items():
        setattr(data, k, v)
    utils.data = data
    public = dict(
        Tensor=Tensor, Size=Size, dtype=dtype, device=device, cuda=cuda, backends=backends,
        float32=float32, float=float32, float64=float64, double=float64, float16=float16, half=float16,
        int64=int64, long=int64, int32=int32, int=int32, int16=int16, int8=int8, uint8=uint8, bool=bool_,
        manual_seed=manual_seed, no_grad=no_grad, enable_grad=enable_grad, is_grad_enabled=is_grad_enabled,
        tensor=tensor, as_tensor=as_tensor, from_numpy=from_numpy, is_tensor=is_tensor,
        zeros=zeros, ones=ones, full=full, empty=empty, zeros_like=zeros_like, ones_like=ones_like,
        rand=rand, randn=randn, randint=randint, randperm=randperm, arange=arange, linspace=linspace, eye=eye,
        matmul=matmul, mm=mm, softmax=softmax, log_softmax=log_softmax, maximum=maximum, where=where,
        cat=cat, concat=concat, stack=stack, allclose=allclose, equal=equal, numel=numel,
        exp=_fn("exp"), log=_fn("log"), sqrt=_fn("sqrt"), abs=_fn("abs"), relu=_fn("relu"), sigmoid=_fn("sigmoid"),
        tanh=_fn("tanh"), sin=_fn("sin"), cos=_fn("cos"), sum=_fn("sum"), mean=_fn("mean"), max=_fn("max"),
        min=_fn("min"), argmax=_fn("argmax"), argmin=_fn("argmin"), clamp=_fn("clamp"), round=_fn("round"),
        reshape=_fn("reshape"), flatten=_fn("flatten"), unsqueeze=_fn("unsqueeze"), squeeze=_fn("squeeze"),
        transpose=_fn("transpose"), std=_fn("std"), var=_fn("var"),
        nn=nn, optim=optim, utils=utils, __version__="2.7.1+epoch", DIFFERENCES=DIFFERENCES,
    )
    g.update(public)
    g["__path__"] = []
    Tensor.__module__ = name
    device.__name__ = device.__qualname__ = "torch.device"
    Parameter.__module__ = name + ".nn.parameter"
    for mod_name, mod in [("nn", nn), ("nn.functional", F), ("optim", optim), ("utils", utils), ("utils.data", data)]:
        sys.modules[f"{name}.{mod_name}"] = mod
