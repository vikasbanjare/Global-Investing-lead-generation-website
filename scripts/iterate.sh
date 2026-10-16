#!/usr/bin/env bash
# Verify one iteration: build, unit test, screenshots + interaction checks, Lighthouse.
# Usage: scripts/iterate.sh NN
set -euo pipefail
cd "$(dirname "$0")/.."
NN="${1:?iteration number, e.g. 01}"
OUT="iterations/screens/iter-$NN"
echo "time (IST): $(TZ=Asia/Kolkata date '+%Y-%m-%d %H:%M')"
npx vite build --logLevel error
node scripts/render-poster.mjs   # phones use a still of the scene; keep it in sync
npx vite build --logLevel error
node scripts/market.test.mjs
node scripts/shoot.mjs "$OUT"
node scripts/lh.mjs "$OUT/lighthouse.json" | tr -d '\n' | sed 's/  */ /g'; echo
node scripts/a11y.mjs | grep -E "violation types"
