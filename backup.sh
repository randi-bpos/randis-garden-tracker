#!/bin/bash
# Saves a local copy of everything in the garden database (hosted on Neon).
#
# Run it with:   npm run backup
#
# It writes two files:
#   garden-backup.json                  <- always the most recent backup
#   backups/garden-backup-YYYY-MM-DD.json  <- a dated copy, kept forever
#
# Nothing is deleted or changed in the live database — this only reads.
#
# The connection string lives in .env.neon (never committed — this repo is
# public). If it's missing, run:  bash save-neon-url.sh

set -e
cd "$(dirname "$0")"

if [ ! -f .env.neon ]; then
  echo "Missing .env.neon — run 'bash save-neon-url.sh' and paste the"
  echo "connection string from the Neon dashboard (Connect button)."
  exit 1
fi

set -a
source .env.neon
set +a

node --no-warnings export-data.js

# Keep a dated copy so backups build up over time instead of overwriting
mkdir -p backups
STAMP=$(date +%Y-%m-%d)
cp garden-backup.json "backups/garden-backup-$STAMP.json"

echo "Saved a dated copy to backups/garden-backup-$STAMP.json"
