#!/usr/bin/env bash
set -euo pipefail

# TL;DR: Gunluk kontroller
npm run report:tenant-violations --since=yesterday
npm run report:bypass-abuse --since=yesterday
npm run report:suspicious-activity --since=yesterday
