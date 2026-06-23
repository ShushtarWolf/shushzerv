#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

export GITHUB_TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN required}"

push_staged() {
  local msg="$1"
  if git diff --cached --quiet; then
    return 0
  fi
  git commit -m "$msg"
  echo ">>> Pushing: $msg"
  GIT_TERMINAL_PROMPT=0 git -c credential.helper='!f() { echo username=ShushtarWolf; echo password='"${GITHUB_TOKEN}"'; }; f' \
    -c http.postBuffer=524288000 -c core.compression=0 \
    push origin main
}

add_and_push() {
  local msg="$1"
  shift
  git add "$@"
  push_staged "$msg"
}

# Batch 1: all code, no heavy assets
git add -A
git reset HEAD public/demo public/docs USER-GUIDE-FA.pdf USER-GUIDE-FA.print.html USER-GUIDE-VISUAL-FA.pdf scripts/batch-push.sh 2>/dev/null || true
push_staged "Add platform code and configuration updates"

add_and_push "Add demo club images" public/demo/clubs
add_and_push "Add demo coach images (1/2)" public/demo/coaches/coach-{1,2,3,4,5}.jpg
add_and_push "Add demo coach images (2/2)" public/demo/coaches/coach-{6,7,8,9,10}.jpg
add_and_push "Add demo news images" public/demo/news

mapfile -t guides < <(find public/docs/guide -type f 2>/dev/null | sort)
batch=()
n=1
for f in "${guides[@]}"; do
  batch+=("$f")
  if ((${#batch[@]} >= 8)); then
    add_and_push "Add user guide screenshots (part ${n})" "${batch[@]}"
    batch=()
    n=$((n + 1))
  fi
done
add_and_push "Add user guide screenshots (final)" "${batch[@]}"

add_and_push "Add site tour export" public/docs/site-tour-export public/docs/site-tour.flow.json public/docs/site-tour.html
add_and_push "Add user guide PDFs" USER-GUIDE-FA.pdf USER-GUIDE-FA.print.html USER-GUIDE-VISUAL-FA.pdf
add_and_push "Add public docs PDFs and archive" public/docs/USER-GUIDE-FA.pdf public/docs/USER-GUIDE-VISUAL-FA.html public/docs/USER-GUIDE-VISUAL-FA.pdf public/docs/site-tour-export.zip

git add -A
push_staged "Finalize remaining files"

git branch --set-upstream-to=origin/main main 2>/dev/null || true
echo "SUCCESS: $(git rev-parse --short HEAD) on $(git remote get-url origin)"
