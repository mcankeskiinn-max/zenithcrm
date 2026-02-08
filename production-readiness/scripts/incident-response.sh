#!/usr/bin/env bash
set -euo pipefail

# TL;DR: Incident response helper
USER_ID=${1:-}
if [ -z "$USER_ID" ]; then
  echo "Usage: incident-response.sh <user-id>"
  exit 1
fi

npm run report:tenant-violations --user-id="$USER_ID"
