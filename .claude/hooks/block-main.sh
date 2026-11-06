#!/bin/sh
# PreToolUse guard for Bash: no commit or push to main (see CLAUDE.md, "Never commit to main").
# Exit 2 blocks the tool call and shows the message on stderr to Claude.
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

# Only "git commit"/"git push" in command position (line start or after ; & | ( ), not inside text such as an issue body.
printf '%s' "$cmd" | grep -Eq '(^|[;&|(])[[:space:]]*git[[:space:]]+(commit|push)' || exit 0

dir=$(printf '%s' "$input" | jq -r '.cwd // empty')
branch=$(git -C "${dir:-.}" branch --show-current 2>/dev/null)

# shortcut: does not see "git -C <dir> commit" or a "cd" inside the command, add parsing if Claude starts using those
if [ "$branch" = "main" ]; then
  echo "Blocked: you are on main. Create a branch first: git switch -c <type>/<issue>-<slug> (see CLAUDE.md)." >&2
  exit 2
fi

if printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+push[^;&|]*[ :/]main([ ;&|)]|$)'; then
  echo "Blocked: do not push to main. Push your branch and open a PR (see CLAUDE.md)." >&2
  exit 2
fi
