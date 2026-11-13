#!/usr/bin/env bash
set -e

export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.sdks/dotnet}"
if [ -d "$DOTNET_ROOT" ]; then
    export PATH="$DOTNET_ROOT:$PATH"
fi

# Add Node/npm from NVM if available in HOME
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -d "$NVM_DIR/versions/node" ]; then
    NODE_BIN="$(find "$NVM_DIR/versions/node" -maxdepth 2 -type d -name bin 2>/dev/null | sort -V | tail -n 1)"
    [ -n "$NODE_BIN" ] && export PATH="$NODE_BIN:$PATH"
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================="
echo " Running TDMS Verification Suite"
echo "=========================================="

echo "[1/4] Building .NET 10 solution..."
dotnet build "$ROOT_DIR/TDMS.slnx" --nologo -v minimal

echo "[2/4] Running backend unit & logic tests..."
dotnet test "$ROOT_DIR/TDMS.slnx" --nologo --logger "console;verbosity=normal"

if [ -f "$ROOT_DIR/src/TDMS.Spa/package.json" ]; then
    echo "[3/4] Running SPA TypeScript type check..."
    (cd "$ROOT_DIR/src/TDMS.Spa" && npm run typecheck)

    if [ -d "$ROOT_DIR/src/TDMS.Spa/src/test" ]; then
        echo "[4/4] Running SPA Vitest tests..."
        (cd "$ROOT_DIR/src/TDMS.Spa" && npm run test)
    else
        echo "[4/4] Skipping SPA Vitest (no test directory yet)..."
    fi
fi

echo "=========================================="
echo " ✅ All Verification Checks Passed!"
echo "=========================================="
