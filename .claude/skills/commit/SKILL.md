---
name: commit
description: Stage and commit changes directly to main using TrailZap's "verb: description" message style. Use when the user asks to commit changes.
disable-model-invocation: true
---

Commit the current changes to `main` (this project commits straight to main — no branch or PR).

1. Run `git status` and `git diff` (and `git diff --staged`) to see what changed.
2. Stage the relevant files (`git add`). If the user named specific files in `$ARGUMENTS`, stage only those; otherwise stage all changes.
3. Write a commit message in TrailZap's style: a lowercase `verb: description` summary line, e.g. `added: saving track`, `fixed: dark theme on hometab`, `converted: home tab to paper`. Pick the verb that fits (added/fixed/converted/removed/updated/refactored). Keep it to one concise line unless the change needs a body.
4. End the commit message with:
   ```
   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```
5. Commit. Do not push unless the user asks.

If `$ARGUMENTS` contains a message, use it as the summary (reformatting to the `verb: description` style if needed).
