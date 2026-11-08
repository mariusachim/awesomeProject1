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

# USD per million tokens at API list prices: input, 5-minute cache write, 1-hour cache write, cache read, output.
# Copied from the ponytail band (hooks/ponytail-band-import.js), which checked them on 2026-10-17 against
# https://platform.claude.com/docs/en/about-claude/pricing. Add a model here when the hook says it has no price.
OPUS = (5, 6.25, 10, 0.5, 25)
PRICES = {
    "claude-fable-5-1": (10, 12.5, 20, 0.25, 50),
    "claude-fable-5": (10, 12.5, 20, 1, 50),
    "claude-opus-5-5": (4, 5, 8, 0.2, 20),
    "claude-opus-5": OPUS,
    "claude-opus-4-8": OPUS,
    "claude-opus-4-7": OPUS,
    "claude-opus-4-6": OPUS,
    "claude-opus-4-5": OPUS,
    "claude-sonnet-5-5": (2, 2.5, 4, 0.1, 10),
    "claude-sonnet-5": (2, 2.5, 4, 0.2, 10),
    "claude-sonnet-4-6": (3, 3.75, 6, 0.3, 15),
    "claude-sonnet-4-5": (3, 3.75, 6, 0.3, 15),
    "claude-haiku-5-5": (0.1, 0.125, 0.2, 0.01, 0.5),
    "claude-haiku-4-5": (1, 1.25, 2, 0.1, 5),
}

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


def reply_cost(model, usage):
    price = PRICES.get(re.sub(r"\[.*\]$|-\d{8}$", "", model))
    if price is None:
        raise ValueError(f"No list price for {model}. Add it to PRICES in .github/scripts/issue_closeout.py.")
    split = usage.get("cache_creation") or {}
    w1 = split.get("ephemeral_1h_input_tokens", 0)
    w5 = split.get("ephemeral_5m_input_tokens", usage.get("cache_creation_input_tokens", 0) - w1)
    tokens = (usage.get("input_tokens", 0), w5, w1, usage.get("cache_read_input_tokens", 0), usage.get("output_tokens", 0))
    return sum(t * p for t, p in zip(tokens, price)) / 1e6


def session_cost(transcript):
    """Return the list-price cost in USD of a Claude Code session, its subagents included, and its main model."""
    # shortcut: tokens only, at standard speed; side calls that the transcript does not log (titles, compaction),
    # web searches, fast mode and long-context prices are left out, so it runs 5-15% under Claude Code's own total.
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
    return sum(reply_cost(*reply) for reply in replies.values()), model


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
    except (KeyError, OSError, ValueError) as e:
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
