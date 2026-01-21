#!/bin/bash
# ============================================
# Galderma TrackWise AI Autopilot Demo
# Demo Data Seeding Script
# ============================================
#
# This script seeds the TrackWise Simulator with demo data
# for the 4 Killer Demo Moments:
#   1. Auto-close < 3s (recurring complaint)
#   2. Multi-language toggle (PT/EN/ES/FR)
#   3. Memory learning visible (feedback → confidence update)
#   4. CSV Pack + Replay
#
# Usage: ./scripts/seed-demo.sh [API_URL]
#

set -e

# Configuration
API_URL="${1:-http://localhost:8080}"
BATCH_SIZE=10

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Galderma TrackWise AI Autopilot - Demo Data Seeding          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "API URL: $API_URL"
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
# Step 1: Reset existing demo data
# ─────────────────────────────────────────────
echo "Step 1: Resetting existing demo data..."
curl -s -X POST "$API_URL/api/reset" | jq .
echo "✅ Demo data reset"
echo ""

# ─────────────────────────────────────────────
# Step 2: Seed recurring patterns (for Killer Moment #1)
# ─────────────────────────────────────────────
echo "Step 2: Seeding recurring pattern cases..."
curl -s -X POST "$API_URL/api/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 5,
    "use_recurring_patterns": true,
    "product_filter": ["CETAPHIL", "EPIDUO"]
  }' | jq .
echo "✅ Recurring pattern cases created"
echo ""

# ─────────────────────────────────────────────
# Step 3: Seed multi-language cases (for Killer Moment #2)
# ─────────────────────────────────────────────
echo "Step 3: Creating multi-language test cases..."

# Portuguese case
curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Cetaphil Gentle Skin Cleanser - embalagem danificada na entrega",
    "product": "CETAPHIL",
    "source_type": "EMAIL",
    "reporter_name": "Maria Silva",
    "reporter_email": "maria.silva@email.com.br",
    "reporter_country": "BR"
  }' | jq .

# Spanish case
curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Epiduo Forte - irritación severa después del uso",
    "product": "EPIDUO",
    "source_type": "PHONE",
    "reporter_name": "Carlos Rodríguez",
    "reporter_email": "carlos.rodriguez@email.es",
    "reporter_country": "ES"
  }' | jq .

# French case
curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Differin Gel - tube vide à la réception",
    "product": "DIFFERIN",
    "source_type": "WEB_FORM",
    "reporter_name": "Pierre Dupont",
    "reporter_email": "pierre.dupont@email.fr",
    "reporter_country": "FR"
  }' | jq .

echo "✅ Multi-language cases created"
echo ""

# ─────────────────────────────────────────────
# Step 4: Seed cases for memory learning demo (Killer Moment #3)
# ─────────────────────────────────────────────
echo "Step 4: Creating cases for memory learning demo..."

# Create a case that will demonstrate learning
curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "CETAPHIL Moisturizing Cream - product quality issue, texture changed",
    "product": "CETAPHIL",
    "source_type": "EMAIL",
    "reporter_name": "Demo User",
    "reporter_email": "demo@galderma.com",
    "reporter_country": "US",
    "metadata": {
      "demo_purpose": "memory_learning",
      "initial_confidence": 0.75
    }
  }' | jq .

echo "✅ Memory learning demo cases created"
echo ""

# ─────────────────────────────────────────────
# Step 5: Seed historical cases for CSV Pack (Killer Moment #4)
# ─────────────────────────────────────────────
echo "Step 5: Creating historical cases for CSV Pack demo..."
curl -s -X POST "$API_URL/api/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 20,
    "use_recurring_patterns": true,
    "include_resolved": true,
    "date_range_days": 30
  }' | jq .
echo "✅ Historical cases created"
echo ""

# ─────────────────────────────────────────────
# Step 6: Seed edge cases for Guardian demo
# ─────────────────────────────────────────────
echo "Step 6: Creating edge cases for Compliance Guardian demo..."

# HIGH severity case (should trigger human review)
curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "EPIDUO FORTE - severe allergic reaction, hospitalization required",
    "product": "EPIDUO",
    "source_type": "PHONE",
    "reporter_name": "Emergency Contact",
    "reporter_email": "emergency@hospital.com",
    "reporter_country": "US",
    "severity": "HIGH",
    "metadata": {
      "demo_purpose": "guardian_block",
      "expected_action": "HUMAN_REVIEW"
    }
  }' | jq .

# CRITICAL severity case (should escalate immediately)
curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "RESTYLANE - adverse event post-injection, patient requires medical attention",
    "product": "RESTYLANE",
    "source_type": "HCP_REPORT",
    "reporter_name": "Dr. Smith",
    "reporter_email": "dr.smith@clinic.com",
    "reporter_country": "US",
    "severity": "CRITICAL",
    "metadata": {
      "demo_purpose": "guardian_escalate",
      "expected_action": "ESCALATE"
    }
  }' | jq .

echo "✅ Edge cases created"
echo ""

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Demo Data Seeding Complete!                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Getting statistics..."
curl -s "$API_URL/api/stats" | jq .
echo ""
echo "Ready for demo! 🚀"
echo ""
echo "4 Killer Moments to demonstrate:"
echo "  1. Auto-close < 3s - Use recurring pattern cases"
echo "  2. Multi-language toggle - Switch between PT/EN/ES/FR"
echo "  3. Memory learning - Approve/Reject to update confidence"
echo "  4. CSV Pack + Replay - Generate validation documentation"
echo ""
