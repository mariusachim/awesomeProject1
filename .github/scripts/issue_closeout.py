#!/usr/bin/env python3
"""The Effort and System Changes section that a pull request carries to its issue.

Usage:
  issue_closeout.py hook   Claude Code PostToolUse hook: after `gh pr create` or `gh pr edit`, give Claude the section
  issue_closeout.py check  in GitHub Actions: fail when the PR title names no issue or the section is incomplete
  issue_closeout.py close  in GitHub Actions: post the section on the issue and close the issue
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

YES_NO = r"yes|no"
LINKS = r"none|.*(#\d+|https?://|\]\().*"
# (label, allowed value, placeholder in the template). The hook fills the first two from the transcript.
FIELDS = [
    ("Token cost equivalent of the implementer run", r"\$\d+(\.\d+)?", "MISSING"),
    ("Model", r"claude-[\w.-]+", "MISSING"),
    ("Frontend changes", YES_NO, "yes/no"),
    ("Backend changes", YES_NO, "yes/no"),
    ("DB migration needed", YES_NO, "yes/no"),
    ("3rd party integration work", YES_NO, "yes/no"),
    ("Infra changes", YES_NO, "yes/no"),
    ("Deployment side-effects risk level", r"low|medium|high", "low/medium/high"),
    ("New tasks created", LINKS, "none, or links to the new issues"),
    ("Diagrams updated", LINKS, "none, or links to the diagrams"),
    ("Closes the issue", YES_NO, "yes/no"),
]
LABELS = [f[0] for f in FIELDS]

# The list prices live in the ponytail plugin: its replyCost prices one reply from the reply's model and usage.
PRICE_JS = ("const { replyCost } = require(process.argv[1]);"
            "const replies = JSON.parse(require('fs').readFileSync(0, 'utf8'));"
            "process.stdout.write(JSON.stringify(replies.map(([model, usage]) => replyCost(model, usage))));")

HOW_TO_FILL = """Put this section at the end of the PR body with `gh pr edit {number} --body-file -` and a quoted heredoc.
Keep the Effort lines as they are: they are the cost of this Claude session so far, at API list prices.
Replace each placeholder from the issue and the diff:
- Frontend changes, Backend changes, DB migration needed, 3rd party integration work, Infra changes: yes or no.
- Deployment side-effects risk level: high when the deployment changes stored data, a public API or the infrastructure.
- New tasks created: links to the issues that you created for follow-up work, or none.
- Diagrams updated: links to the diagram files that the diff changes, or none.
- Closes the issue: no when more work on the issue follows in another pull request, else yes."""


def render(values):
    lines = lambda labels: "\n".join(f"- {label}: {values[label]}" for label in labels)
    return (f"### Effort\n\nPaid by the Claude subscription.\n\n{lines(LABELS[:2])}\n\n"
            f"### System Changes\n\n{lines(LABELS[2:-1])}\n\n{lines(LABELS[-1:])}\n")


def parse(body):
    """Return the value of each field ("MISSING" when absent) and a list of the invalid fields."""
    values, problems = {}, []
    for label, allowed, _ in FIELDS:
        m = re.search(rf"^[-*\s]*{re.escape(label)}\s*:\s*(.*?)\s*$", body or "", re.M)
        value = m[1] if m else ""
        if not re.fullmatch(allowed, value, re.I):
            problems.append(f"{label}: {value or 'missing'} (allowed: {allowed})")
        values[label] = value or "MISSING"
    return values, problems


def issue_of(title):
    m = re.match(r"[a-z]+\(#(\d+)\)!?:", title or "")
    return m[1] if m else None


def check(pr):
    """Return the issue number and the problems that block the merge."""
    issue = issue_of(pr["title"])
    problems = [] if issue else [f"PR title {pr['title']!r} does not start with <type>(#<issue>):"]
    return issue, problems + parse(pr["body"])[1]


def ponytail_band():
    """Return the ponytail hook file that exports replyCost, from the plugin that Claude Code installed."""
    config = Path(os.environ.get("CLAUDE_CONFIG_DIR") or Path.home() / ".claude")
    plugins = json.loads((config / "plugins" / "installed_plugins.json").read_text())["plugins"]
    for name, installs in plugins.items():
        if name.startswith("ponytail@") and installs:
            return Path(installs[0]["installPath"]) / "hooks" / "ponytail-band-import.js"
    raise ValueError(f"The ponytail plugin is not installed in {config}.")


def session_cost(transcript):
    """Return the list-price cost in USD of a Claude Code session, its subagents included, and its main model."""
    # shortcut: side calls that the transcript does not log (titles, compaction) are left out,
    # so it runs a little under Claude Code's own total.
    main = Path(transcript)
    replies, model = {}, None
    for path in [main, *sorted(main.with_suffix("").glob("subagents/*.jsonl"))]:
        with open(path) as f:
            for line in f:
                if '"assistant"' not in line:
                    continue
                try:
                    r = json.loads(line)
                except ValueError:
                    continue  # the last line can be half written while the session runs
                m = r.get("message") or {}
                if r.get("type") != "assistant" or not str(m.get("model")).startswith("claude-") or not m.get("id"):
                    continue
                # Claude Code writes one record per content block, each with the usage of the whole reply.
                replies[m["id"]] = (m["model"], m.get("usage") or {})
                model = m["model"] if path == main else model
    replies = list(replies.values())
    costs = json.loads(subprocess.run(["node", "-e", PRICE_JS, str(ponytail_band())], input=json.dumps(replies),
                                      check=True, stdout=subprocess.PIPE, text=True).stdout)
    unpriced = sorted({name for (name, _), cost in zip(replies, costs) if cost is None})
    if unpriced:
        raise ValueError(f"The ponytail plugin has no list price for {', '.join(unpriced)}, or a reply used fast mode.")
    return sum(costs), model


def gh(*args):
    return subprocess.run(["gh", *args], check=True, stdout=subprocess.PIPE, text=True).stdout


def hook(event):
    """Return the hook exit code and the message for Claude: 2 when the PR that the command made cannot merge yet."""
    # shortcut: watches only `gh pr`; a PR made another way still meets the required check.
    if not re.search(r"\bgh\s+pr\s+(create|edit)\b", (event.get("tool_input") or {}).get("command", "")):
        return 0, ""
    url = re.search(r"https://github\.com/[\w.-]+/[\w.-]+/pull/\d+", json.dumps(event.get("tool_response")))
    if not url:
        return 0, ""
    pr = json.loads(gh("pr", "view", url[0], "--json", "number,title,body"))
    problems = check(pr)[1]
    if not problems:
        return 0, ""
    values = {label: placeholder for label, _, placeholder in FIELDS}
    try:
        cost, model = session_cost(event["transcript_path"])
        values[LABELS[0]], values["Model"] = f"${cost:.2f}", model or "MISSING"
    except (KeyError, OSError, ValueError, subprocess.CalledProcessError) as e:
        problems.append(f"The hook cannot count the cost: {e!r}. Do not write the cost or the model yourself; tell the user.")
    lines = "\n".join(f"- {p}" for p in problems)
    return 2, (f"issue-closeout: PR #{pr['number']} cannot merge yet.\n{lines}\n\n"
               f"{HOW_TO_FILL.format(number=pr['number'])}\n\n{render(values)}")


def close(pr):
    issue, problems = check(pr)
    if issue:
        values = parse(pr["body"])[0]
        marker = f"<!-- issue-closeout pr=#{pr['number']} -->"
        # The marker keeps a re-run from posting the section twice.
        if marker not in gh("issue", "view", issue, "--json", "comments", "--jq", ".comments[].body"):
            gh("issue", "comment", issue, "--body", f"{render(values)}\n{marker}")
        # Only an explicit "no" keeps the issue open, for example a spec PR before the PR that builds it.
        if values["Closes the issue"].lower() != "no":
            gh("issue", "close", issue, "--reason", "completed")
    return problems


def fail(problems):
    for p in problems:
        print(f"::error::{p}")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    cmd = sys.argv[1:2]
    if cmd == ["hook"]:
        code, message = hook(json.load(sys.stdin))
        print(message, file=sys.stderr, end="")
        sys.exit(code)
    elif cmd in (["check"], ["close"]):
        with open(os.environ["GITHUB_EVENT_PATH"]) as f:
            pr = json.load(f)["pull_request"]
        fail(check(pr)[1] if cmd == ["check"] else close(pr))
    else:
        sys.exit(__doc__)
