---
name: feedback-python-conda
description: "All Python work in this project (and Zain's projects generally) must run inside a conda environment, not base/system Python."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a24eb961-c795-444a-b7f5-2d47cae5170a
---

**Any Python work — running scripts, http.server, package installs, anything — must happen inside a conda environment. Never use base/system Python directly.**

**Why:** Zain interrupted a `python -m http.server` call to enforce this. Mixing system Python with project Python pollutes installs, makes dependency tracking impossible, and breaks reproducibility. Conda envs isolate per-project Python + packages.

**How to apply:**
- Before any Python command, ensure a conda env exists for this project (e.g. `riley-summer-work`). Create with `conda create -n <name> python=<version> -y` if missing.
- To run Python from a script/command non-interactively, use `conda run -n <env> python ...` — that activates the env for the single command without leaving residue in the shell.
- Persist env name + Python version in a project file (e.g. `environment.yml`) so future setup is reproducible.
- Don't `pip install` anything outside the env.
- Applies to any future project too, not just this one.
- Related: [[riley-summer-project]]
