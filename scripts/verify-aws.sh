#!/bin/bash
# ============================================
# Galderma TrackWise AI Autopilot Demo
# AWS Credentials Verification Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Expected values
EXPECTED_ACCOUNT="176545286005"
EXPECTED_REGION="us-east-2"
EXPECTED_PROFILE="${AWS_PROFILE:-fabio-dev-lpd}"

echo "============================================"
echo "AWS Credentials Verification"
echo "============================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}ERROR: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

echo -e "${GREEN}AWS CLI found${NC}"

# Check if profile exists
if ! aws configure list --profile "$EXPECTED_PROFILE" &> /dev/null; then
    echo -e "${YELLOW}WARNING: Profile '$EXPECTED_PROFILE' not configured${NC}"
    echo ""
    echo "Please configure the profile:"
    echo "  aws configure --profile $EXPECTED_PROFILE"
    echo ""
    echo "Enter the following when prompted:"
    echo "  AWS Access Key ID: <YOUR_ACCESS_KEY_ID>"
    echo "  AWS Secret Access Key: <YOUR_SECRET_ACCESS_KEY>"
    echo "  Default region name: $EXPECTED_REGION"
    echo "  Default output format: json"
    exit 1
fi

echo -e "${GREEN}Profile '$EXPECTED_PROFILE' found${NC}"

# Verify identity
echo ""
echo "Verifying AWS identity..."
IDENTITY=$(aws sts get-caller-identity --profile "$EXPECTED_PROFILE" --output json 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to verify AWS identity${NC}"
    echo "$IDENTITY"
    exit 1
fi

ACCOUNT=$(echo "$IDENTITY" | grep -o '"Account": "[^"]*"' | cut -d'"' -f4)
ARN=$(echo "$IDENTITY" | grep -o '"Arn": "[^"]*"' | cut -d'"' -f4)

echo -e "${GREEN}Identity verified:${NC}"
echo "  Account: $ACCOUNT"
echo "  ARN: $ARN"

# Verify account matches
if [ "$ACCOUNT" != "$EXPECTED_ACCOUNT" ]; then
    echo -e "${RED}ERROR: Account mismatch!${NC}"
    echo "  Expected: $EXPECTED_ACCOUNT"
    echo "  Got: $ACCOUNT"
    exit 1
fi

echo -e "${GREEN}Account verified: $ACCOUNT${NC}"

# Check region
REGION=$(aws configure get region --profile "$EXPECTED_PROFILE")
if [ "$REGION" != "$EXPECTED_REGION" ]; then
    echo -e "${YELLOW}WARNING: Region mismatch${NC}"
    echo "  Expected: $EXPECTED_REGION"
    echo "  Configured: $REGION"
    echo ""
    echo "To fix: aws configure set region $EXPECTED_REGION --profile $EXPECTED_PROFILE"
else
    echo -e "${GREEN}Region verified: $REGION${NC}"
fi

# Check Bedrock access
echo ""
echo "Checking Bedrock access..."
BEDROCK_CHECK=$(aws bedrock list-foundation-models --profile "$EXPECTED_PROFILE" --region "$EXPECTED_REGION" --max-results 1 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}WARNING: Cannot access Bedrock${NC}"
    echo "This may be normal if the account needs Bedrock model access enabled."
    echo ""
else
    echo -e "${GREEN}Bedrock access verified${NC}"
fi

# Check AgentCore access
echo ""
echo "Checking Bedrock AgentCore access..."
AGENTCORE_CHECK=$(aws bedrock-agentcore list-agent-runtimes --profile "$EXPECTED_PROFILE" --region "$EXPECTED_REGION" 2>&1)

if echo "$AGENTCORE_CHECK" | grep -q "UnrecognizedClientException\|AccessDenied"; then
    echo -e "${YELLOW}WARNING: AgentCore may not be available or access denied${NC}"
    echo "This is normal if AgentCore is not yet enabled in this account."
else
    echo -e "${GREEN}AgentCore access available${NC}"
fi

echo ""
echo "============================================"
echo -e "${GREEN}AWS credentials verified successfully!${NC}"
echo "============================================"
echo ""
echo "Environment variables to export:"
echo "  export AWS_PROFILE=$EXPECTED_PROFILE"
echo "  export AWS_REGION=$EXPECTED_REGION"
echo "  export AWS_ACCOUNT_ID=$EXPECTED_ACCOUNT"
echo ""
echo "Or add to .envrc for direnv:"
echo "  echo 'export AWS_PROFILE=$EXPECTED_PROFILE' >> .envrc"
echo "  echo 'export AWS_REGION=$EXPECTED_REGION' >> .envrc"
echo "  echo 'export AWS_ACCOUNT_ID=$EXPECTED_ACCOUNT' >> .envrc"
echo "  direnv allow"
