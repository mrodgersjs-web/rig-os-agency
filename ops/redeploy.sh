#!/bin/bash
# ── RIG OS Agency — safe redeploy ───────────────────────────────────────
#
# THE BUG THIS EXISTS TO PREVENT
#
# `npm run build` writes into `.next`. If `next start` is serving from that
# same directory, the build swaps chunks and client-reference manifests out
# from under the live process, and every request after that fails with:
#
#   Invariant: The client reference manifest for route "/x" does not exist.
#
# ~/.agentic-os/logs/dashboard.log has 298 of those. It is why a route sweep
# once caught 101/147 pages at HTTP 500 while the very same pages returned 200
# minutes later: the pages were never broken, the SERVER was serving a
# half-replaced build. launchd's KeepAlive eventually restarts it, so the
# outage self-heals and leaves almost no trace — which is precisely what makes
# it dangerous.
#
# THE FIX
#
# Build into a scratch dist dir, verify the build actually produced artifacts,
# and only then stop / swap / start. Live downtime is the restart (~2s) instead
# of "until somebody notices".
#
# Usage:  bash ops/redeploy.sh
# Exit 0 only if the new build is live AND /api/agency/health answers.

set -euo pipefail

APP="/Users/rig128gb/Developer/rig-os-agency"
STAGE=".next-build"
LIVE=".next"
PREV=".next-prev"
PORT=3737
LABEL="gui/501/com.rig.agent-os-server"

cd "$APP"

echo "▸ building into $STAGE (live server untouched)"
NEXT_DIST_DIR="$STAGE" npm run build

# A build that "succeeded" but produced no BUILD_ID is not a build. Verifying
# the artifact rather than the exit code is the whole doctrine.
if [ ! -f "$STAGE/BUILD_ID" ]; then
  echo "✗ build produced no $STAGE/BUILD_ID — refusing to swap. Live server left alone."
  exit 1
fi
NEW_ID="$(cat "$STAGE/BUILD_ID")"
OLD_ID="$(cat "$LIVE/BUILD_ID" 2>/dev/null || echo none)"
echo "▸ staged build $NEW_ID (live is $OLD_ID)"

# Swap. Keep the previous build so a bad deploy can be rolled back by hand.
echo "▸ swapping in"
rm -rf "$PREV"
[ -d "$LIVE" ] && mv "$LIVE" "$PREV"
mv "$STAGE" "$LIVE"

echo "▸ restarting $LABEL"
launchctl kickstart -k "$LABEL"

# Verify the ARTIFACT, not the report: poll until health actually answers.
echo -n "▸ waiting for health"
for _ in $(seq 1 60); do
  if curl -sf -o /dev/null "http://127.0.0.1:$PORT/api/agency/health"; then
    echo " — up"
    SERVED="$(cat "$LIVE/BUILD_ID")"
    echo "✓ live build: $SERVED"
    [ "$SERVED" = "$NEW_ID" ] || { echo "✗ served build != staged build"; exit 1; }
    exit 0
  fi
  echo -n "."
  sleep 2
done

echo ""
echo "✗ health never came up. Roll back with:"
echo "    rm -rf $APP/$LIVE && mv $APP/$PREV $APP/$LIVE && launchctl kickstart -k $LABEL"
exit 1
