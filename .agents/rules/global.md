---
trigger: always_on
glob:
description:
---

# Branch policy
- Always work on `main`. Do not create or use feature branches.
- Keep all modifications and commits on `main`.

# AI handoff log
- Read `.agents/ai-change-log.md` before starting any task.
- Append a new entry to `.agents/ai-change-log.md` when finishing work.
- Each entry must include date, summary, files touched, and tests run.
