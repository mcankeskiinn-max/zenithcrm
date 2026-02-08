#!/usr/bin/env bash
set -euo pipefail

# TL;DR: Haftalik audit
npm run check:tenant-consistency
npm run test:coverage:report
