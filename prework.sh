#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

# Ensure this is a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[prework] not a git repo: $REPO_DIR"
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
remote="origin"
upstream="$remote/$branch"

echo "[prework] repo: $REPO_DIR"
echo "[prework] branch: $branch"

git fetch "$remote"

read -r ahead behind < <(git rev-list --left-right --count "HEAD...$upstream")

dirty=0
if ! git diff --quiet || ! git diff --cached --quiet; then
  dirty=1
fi

if [[ "$dirty" -eq 1 ]]; then
  echo "[prework] ⚠ working tree is dirty. Commit/stash before pull/rebase."
  git status --short
  exit 2
fi

if [[ "$behind" -gt 0 ]]; then
  echo "[prework] local is behind $upstream by $behind commit(s). Rebasing..."
  git pull --rebase "$remote" "$branch"
  echo "[prework] ✅ rebased onto latest $upstream"
else
  echo "[prework] ✅ already up to date with $upstream"
fi

if [[ "$ahead" -gt 0 ]]; then
  echo "[prework] note: local is ahead of $upstream by $ahead commit(s)."
fi
