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
    "include_recurring": true
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
    "product_brand": "CETAPHIL",
    "product_name": "Gentle Skin Cleanser",
    "complaint_text": "Embalagem danificada na entrega. Produto vazou durante o transporte.",
    "customer_name": "Maria Silva",
    "customer_email": "maria.silva@email.com.br",
    "case_type": "COMPLAINT",
    "category": "PACKAGING"
  }' | jq .

# Spanish case
curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "product_brand": "EPIDUO",
    "product_name": "Epiduo Forte Gel",
    "complaint_text": "Irritación severa después del uso. Enrojecimiento y picazón.",
    "customer_name": "Carlos Rodríguez",
    "customer_email": "carlos.rodriguez@email.es",
    "case_type": "COMPLAINT",
    "category": "SAFETY"
  }' | jq .

# French case
curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "product_brand": "DIFFERIN",
    "product_name": "Adapalene Gel 0.1%",
    "complaint_text": "Tube vide à la réception. Pas de produit à lintérieur.",
    "customer_name": "Pierre Dupont",
    "customer_email": "pierre.dupont@email.fr",
    "case_type": "COMPLAINT",
    "category": "QUALITY"
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
    "product_brand": "CETAPHIL",
    "product_name": "Moisturizing Lotion",
    "complaint_text": "Product quality issue - texture has changed from previous purchase.",
    "customer_name": "Demo User",
    "customer_email": "demo@galderma.com",
    "case_type": "COMPLAINT",
    "category": "QUALITY"
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
    "include_recurring": true,
    "include_linked_inquiries": true
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
    "product_brand": "EPIDUO",
    "product_name": "Epiduo Forte Gel",
    "complaint_text": "Severe allergic reaction after applying product. Patient was hospitalized for observation.",
    "customer_name": "Emergency Contact",
    "customer_email": "emergency@hospital.com",
    "case_type": "ADVERSE_EVENT",
    "category": "SAFETY"
  }' | jq .

# CRITICAL severity case (should escalate immediately)
curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "product_brand": "RESTYLANE",
    "product_name": "Restylane Lyft",
    "complaint_text": "Adverse event post-injection. Patient requires immediate medical attention.",
    "customer_name": "Dr. Smith",
    "customer_email": "dr.smith@clinic.com",
    "case_type": "ADVERSE_EVENT",
    "category": "SAFETY"
  }' | jq .

# Additional LOW severity cases for auto-close demo
curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "product_brand": "CETAPHIL",
    "product_name": "Daily Facial Moisturizer SPF 15",
    "complaint_text": "Missing instruction leaflet inside the box.",
    "customer_name": "John Smith",
    "customer_email": "john.smith@email.com",
    "case_type": "COMPLAINT",
    "category": "DOCUMENTATION"
  }' | jq .

curl -s -X POST "$API_URL/api/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "product_brand": "BENZAC",
    "product_name": "Benzac AC Gel 5%",
    "complaint_text": "Box arrived slightly dented but product is fine.",
    "customer_name": "Jane Doe",
    "customer_email": "jane.doe@email.com",
    "case_type": "COMPLAINT",
    "category": "PACKAGING"
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
