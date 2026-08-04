#!/bin/bash
# Saves a local copy of everything in the garden database.
#
# Run it with:   npm run backup
#
# It writes two files:
#   garden-backup.json                  <- always the most recent backup
#   backups/garden-backup-YYYY-MM-DD.json  <- a dated copy, kept forever
#
# Nothing is deleted or changed in the live database — this only reads.

set -e
cd "$(dirname "$0")"

APP="garden-tracker"
ENV="garden-tracker-env"
REGION="us-east-2"

echo "Looking up the database connection from AWS..."
DATABASE_URL=$(aws elasticbeanstalk describe-configuration-settings \
  --region "$REGION" \
  --application-name "$APP" \
  --environment-name "$ENV" \
  --query "ConfigurationSettings[].OptionSettings[?OptionName=='DATABASE_URL'].Value" \
  --output text)

if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "None" ]; then
  echo "Could not read DATABASE_URL from AWS."
  echo "Check that the AWS CLI is signed in, then try again."
  exit 1
fi

export DATABASE_URL
node export-data.js

# Keep a dated copy so backups build up over time instead of overwriting
mkdir -p backups
STAMP=$(date +%Y-%m-%d)
cp garden-backup.json "backups/garden-backup-$STAMP.json"

echo "Saved a dated copy to backups/garden-backup-$STAMP.json"
