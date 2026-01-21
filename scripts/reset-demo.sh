#!/bin/bash
# ============================================
# Galderma TrackWise AI Autopilot Demo
# Demo Reset Script
# ============================================
#
# This script resets all demo data to a clean state
# Use between demo presentations
#
# Usage: ./scripts/reset-demo.sh [API_URL]
#

set -e

# Configuration
API_URL="${1:-http://localhost:8080}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Galderma TrackWise AI Autopilot - Demo Reset                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "API URL: $API_URL"
echo ""

# Confirm reset
read -p "⚠️  This will delete all demo data. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""

# Check if API is available
echo "Checking API availability..."
if ! curl -s "$API_URL/ping" > /dev/null; then
    echo "❌ Error: API not available at $API_URL"
    echo "   Make sure the backend is running."
    exit 1
fi
echo "✅ API is available"
echo ""

# ─────────────────────────────────────────────
# Step 1: Get current statistics
# ─────────────────────────────────────────────
echo "Current statistics (before reset):"
curl -s "$API_URL/api/stats" | jq .
echo ""

# ─────────────────────────────────────────────
# Step 2: Reset all data
# ─────────────────────────────────────────────
echo "Resetting all demo data..."
RESULT=$(curl -s -X POST "$API_URL/api/reset")
echo "$RESULT" | jq .
echo ""

# ─────────────────────────────────────────────
# Step 3: Verify reset
# ─────────────────────────────────────────────
echo "Verifying reset..."
STATS=$(curl -s "$API_URL/api/stats")
CASE_COUNT=$(echo "$STATS" | jq -r '.total_cases // 0')

if [[ "$CASE_COUNT" == "0" ]]; then
    echo "✅ All demo data has been reset"
else
    echo "⚠️  Warning: $CASE_COUNT cases still exist"
fi

echo ""
echo "Statistics (after reset):"
echo "$STATS" | jq .
echo ""

# ─────────────────────────────────────────────
# Optional: Re-seed with fresh data
# ─────────────────────────────────────────────
read -p "Would you like to seed fresh demo data? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Running seed script..."
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    bash "$SCRIPT_DIR/seed-demo.sh" "$API_URL"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Reset Complete!                                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
