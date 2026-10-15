#!/bin/bash
# Saves the Neon connection string to .env.neon without showing it on screen.
# .env.neon is in .gitignore, so it never gets uploaded to GitHub.

cd "$(dirname "$0")"
read -r -s -p "Paste Neon connection string, then press Enter: " URL
echo
if [[ "$URL" != postgres* ]]; then
  echo "That doesn't look like a connection string (it should start with postgresql://). Nothing saved."
  exit 1
fi
printf "DATABASE_URL='%s'\n" "$URL" > .env.neon
echo "Saved."
