#!/bin/bash
set -euo pipefail

SCRIPT_VERSION=2
TARGET="/etc/hosts"
SCRIPT_PATH="/usr/local/bin/uwork-hosts-write"
MAX_BYTES=1048576
CP_BIN="/bin/cp"

if [ "${1:-}" = "--check" ]; then
  if [ ! -x "$SCRIPT_PATH" ] || [ ! -x "$CP_BIN" ]; then
    exit 1
  fi
  INSTALLED_VERSION="$(grep '^SCRIPT_VERSION=' "$SCRIPT_PATH" 2>/dev/null | cut -d= -f2 || true)"
  if [ "$INSTALLED_VERSION" = "$SCRIPT_VERSION" ]; then
    exit 0
  fi
  exit 1
fi

SRC="${1:-}"
if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
  echo "missing source file" >&2
  exit 1
fi

SIZE=$(wc -c < "$SRC" | tr -d '[:space:]')
if [ "$SIZE" -gt "$MAX_BYTES" ]; then
  echo "file too large" >&2
  exit 1
fi

"$CP_BIN" "$SRC" "$TARGET"
exit 0
