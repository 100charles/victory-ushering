#!/usr/bin/env bash
# Publishes index.html, and only index.html, to https://victory-malolos-ushering.vercel.app
# (Vercel free plan). Run from Git Bash:  ./publish.sh
# Needs the Vercel CLI signed in to the account that owns the project (run `npx vercel login` once).
# Pushing to GitHub does NOT publish; this script does.
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cp index.html "$tmp/"
mkdir "$tmp/.vercel"
printf '{"projectId":"prj_OQi49AraiEknn0RFLxQxFtCGWTgs","orgId":"team_B08WrThnLqdo0mVcZSux8cBg"}' > "$tmp/.vercel/project.json"
printf '/*\n!/index.html\n' > "$tmp/.vercelignore"
cd "$tmp"
npx vercel deploy --prod --yes
echo "Live: https://victory-malolos-ushering.vercel.app"
