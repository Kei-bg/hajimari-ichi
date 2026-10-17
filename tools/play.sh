#!/bin/sh
# tools/play.mjs を起動する。node が無い環境では VS Code 同梱の Electron を node として使う
here=$(dirname "$0")
if command -v node >/dev/null 2>&1; then exec node "$here/play.mjs" "$@"; fi
ELECTRON_RUN_AS_NODE=1 exec "$LOCALAPPDATA/Programs/Microsoft VS Code/Code.exe" "$here/play.mjs" "$@"
