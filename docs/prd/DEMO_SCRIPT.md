# Demo Script: Galderma TrackWise AI Autopilot

> **Version**: 1.0
> **Last Updated**: January 2026
> **Duration**: 15-20 minutes
> **Parent Document**: [PRD.md](./PRD.md)

---

## Table of Contents

1. [Demo Overview](#1-demo-overview)
2. [Pre-Demo Checklist](#2-pre-demo-checklist)
3. [Opening Narrative](#3-opening-narrative)
4. [Demo Flow (9 Steps)](#4-demo-flow-9-steps)
5. [Killer Moments](#5-killer-moments)
6. [Persona-Specific Talking Points](#6-persona-specific-talking-points)
7. [Objection Handling](#7-objection-handling)
8. [Troubleshooting](#8-troubleshooting)
9. [Closing & Next Steps](#9-closing--next-steps)

---

## 1. Demo Overview

### 1.1 Demo Objective

Demonstrate that **multi-agent AI can assume the cognitive load** of TrackWise complaint handling while being **more observable and auditable than human processes**.

### 1.2 Key Messages

| Priority | Message |
|----------|---------|
| **Primary** | "AI agents can observe, learn, remember, and execute—while every step is visible, replayable, and exportable for audit/CSV." |
| **Secondary** | "This is not a black box. Every decision has evidence, rationale, and traceability." |
| **Tertiary** | "The system learns from feedback and improves over time." |

### 1.3 Demo Timing

| Phase | Duration | Steps |
|-------|----------|-------|
| Opening | 2 min | Context setting |
| Core Demo | 10-12 min | Steps 1-7 |
| Killer Moments | 3-4 min | Steps 8-9 |
| Q&A Buffer | 3-5 min | Questions |

### 1.4 Killer Moments Summary

| # | Moment | When | Impact |
|---|--------|------|--------|
| 1 | Auto-close in real-time | Step 3 | "Wow, it just resolved it!" |
| 2 | Multi-language instant switch | Step 4 | "All 4 languages instantly!" |
| 3 | Memory learning visible | Step 5 | "It's actually learning!" |
| 4 | CSV Pack + Replay | Steps 8-9 | "Full audit trail ready" |

---

## 2. Pre-Demo Checklist

### 2.1 Technical Setup

| Item | Check | Notes |
|------|-------|-------|
| Browser: Chrome latest | ☐ | Clear cache before demo |
| Resolution: 1920x1080 | ☐ | Optimal for Agent Room UI |
| Network: Stable connection | ☐ | Test latency to us-east-2 |
| Demo environment: Running | ☐ | Verify all agents healthy |
| Simulator: Reset to clean state | ☐ | Run `reset-demo-data` script |
| Memory: Clear learning from previous demos | ☐ | Optional, keeps some patterns |

### 2.2 Environment Verification

```bash
# Health check all agents
curl https://demo.galderma-trackwise.example.com/api/health

# Expected response:
{
  "status": "healthy",
  "agents": {
    "observer": "healthy",
    "case_understanding": "healthy",
    "recurring_detector": "healthy",
    "compliance_guardian": "healthy",
    "resolution_composer": "healthy",
    "inquiry_bridge": "healthy",
    "writeback": "healthy",
    "memory_curator": "healthy",
    "csv_pack": "healthy"
  }
}
```

### 2.3 Demo Data Preparation

Pre-loaded mock cases:
- **3 recurring complaints** (packaging seal defects - known pattern)
- **1 high-severity complaint** (adverse event - should NOT auto-close)
- **1 missing data complaint** (incomplete fields - should flag for review)

---

## 3. Opening Narrative

### 3.1 Context Setting (1-2 minutes)

**Presenter says:**

> "Good morning! Today I want to show you something that changes how we think about QMS automation.
>
> **The problem**: Your QA teams spend countless hours on repetitive tasks in TrackWise—categorizing complaints, linking inquiries, writing closure summaries. And despite all that effort, audit trails often have gaps, and knowledge doesn't transfer when people leave.
>
> **The opportunity**: What if AI agents could handle the cognitive load—not just the mechanical work—while being MORE observable and auditable than human processes?
>
> Let me show you what that looks like in practice."

### 3.2 UI Orientation (30 seconds)

**Point to key UI elements:**

> "This is the Agent Room—think of it as mission control for your AI workforce.
>
> - On the left: navigation to Cases, A2A Network view, Memory, Audit Ledger
> - Center: live timeline of everything agents are doing
> - Top: notice we're in **Observe** mode right now—agents watch but don't act
> - That 'DEMO / SIMULATED DATA' badge reminds us this is sandbox data"

---

## 4. Demo Flow (9 Steps)

### Step 1: Start in Observe Mode

**Time**: 30 seconds

**Action**: Point to mode indicator showing "Observe" (gray badge with eye icon)

**Presenter says:**

> "We always start in Observe mode. Agents analyze everything but don't take any actions. This is how you'd run initially—let the AI show what it WOULD do, before trusting it to actually do it."

**UI State**:
- Mode badge: 👁️ Observe (gray)
- Timeline: Empty, waiting for events
- Right panel: No run selected

---

### Step 2: Create Simulated Complaints

**Time**: 1-2 minutes

**Action**: Navigate to Cases → Click "Create Simulated Batch" → Select pre-configured set

**Presenter says:**

> "Let's simulate a batch of complaints coming in—like you'd see any Monday morning.
>
> I'm creating 5 cases:
> - Three packaging seal defects (a known recurring issue)
> - One high-severity adverse event
> - One with missing required fields
>
> Watch the timeline..."

**Click**: "Create 5 Cases" button

**UI State**:
- Cases appear in list
- Timeline starts populating with "ComplaintCreated" events
- Observer Agent badges flash as it processes each

**Talk through**:

> "See how the Observer agent immediately picks up each event? It's normalizing and routing to the Case Understanding agent."

---

### Step 3: Watch Agents Running Live — **KILLER MOMENT #1**

**Time**: 2-3 minutes

**Action**: Watch timeline as agents process the first recurring complaint

**Presenter says:**

> "Now watch the magic happen. The Case Understanding agent extracts structure—product, category, severity. The Recurring Detector searches memory for similar patterns..."

**As each agent appears in timeline**:

| Agent | Talking Point |
|-------|---------------|
| Observer | "Event captured, normalized" |
| Case Understanding | "Extracted: Cetaphil, Packaging, Seal Defect" |
| Recurring Detector | "Found 12 similar cases in memory!" |
| Compliance Guardian | "Checking policies... all passed" |
| Resolution Composer | "Generating resolution in 4 languages" |
| Writeback | "And... case closed!" |

**KILLER MOMENT**: Point to the case status changing from OPEN to CLOSED in real-time.

> "**That's it.** From event to resolution in under 3 seconds. No human touched it. But—and this is crucial—every single step is logged, reasoned, and auditable."

**Click on the run** in the timeline to show the detail panel:

> "Click any run to see exactly what each agent did, what inputs it received, what outputs it produced, and WHY it made each decision."

---

### Step 4: Multi-language Instant Switch — **KILLER MOMENT #2**

**Time**: 1-2 minutes

**Action**: In the run detail panel, switch language toggle from EN → PT → ES → FR

**Presenter says:**

> "Now, one of our differentiators: multi-language support. This resolution was generated in FOUR languages simultaneously—Portuguese, English, Spanish, French."

**Click language toggle: EN → PT**

> "Instant switch to Portuguese. No re-processing."

**Click: PT → ES**

> "Spanish."

**Click: ES → FR**

> "French. All generated at run time, all instantly available."

**Emphasize**:

> "For a global organization like Galderma, this means consistent messaging across regions without waiting for translations or risking inconsistency."

---

### Step 5: Train Mode — **KILLER MOMENT #3**

**Time**: 2-3 minutes

**Action**: Switch mode from Observe → Train

**Presenter says:**

> "Now let's show how the system learns. I'm switching to Train mode."

**Click mode toggle: Observe → Train**

> "In Train mode, agents still don't auto-close, but they show recommendations AND collect feedback."

**Create a new complaint** (or select one pending):

> "Let's say this agent made a recommendation, but I disagree with the category. Watch what happens when I provide feedback."

**Click Thumbs Down** or **Click "Correct Category"** and select a different one:

> "I just told the system 'this isn't quite right.' Now watch the Memory Curator..."

**Point to timeline showing Memory Curator**:

> "Memory Curator received the feedback signal, decreased confidence in that pattern, and logged a feedback event. The system literally just learned from my correction."

**Navigate to Memory view**:

> "If I go to Memory, I can see all learned patterns, their confidence scores, and how they've evolved over time. This is visible, traceable learning—not a black box."

**KILLER MOMENT**: Show the confidence score update in Memory Inspector.

---

### Step 6: Act Mode — Safe Auto-close

**Time**: 1-2 minutes

**Action**: Switch mode from Train → Act

**Presenter says:**

> "Now the moment of truth. Switching to Act mode—agents will actually execute writebacks."

**Click mode toggle: Train → Act**

> "From now on, when confidence is high enough and all policies pass, agents will auto-close."

**Create a new recurring complaint** (same pattern as before):

> "Another packaging seal defect comes in..."

**Watch timeline**:

> "Pattern matched, policies passed, closure generated, and... closed. Fully autonomous."

---

### Step 7: High Severity Escalation

**Time**: 1 minute

**Action**: Show the high-severity case that was NOT auto-closed

**Presenter says:**

> "But here's what makes this trustworthy. Remember I created a high-severity adverse event case? Let me show you what happened to that one."

**Click on the high-severity case**:

> "Notice the status: ESCALATED, not closed. The Compliance Guardian blocked auto-closure because severity was HIGH."

**Show the run detail**:

> "Look at the policy check: POL-002 (Severity Escalation) FAILED. The agent correctly identified this needs human review."

**Key message**:

> "The system knows its limits. High-impact decisions always go to humans. This is Human-in-the-Loop by design, not by accident."

---

### Step 8: Replay a Run — **KILLER MOMENT #4 (Part 1)**

**Time**: 1-2 minutes

**Action**: Navigate to a completed run → Click "Replay"

**Presenter says:**

> "For compliance auditors, reproducibility is everything. Let me show you the Replay feature."

**Click "Replay" on a successful auto-close run**:

> "I can now step through this run exactly as it happened. Every agent, every decision, every timestamp."

**Click "Step" button to advance through each agent**:

| Step | What to say |
|------|-------------|
| Observer | "Event received at 10:30:00.100" |
| Case Understanding | "Classification completed at 10:30:00.470" |
| Recurring Detector | "Pattern PAT-001 matched with 94% confidence" |
| Compliance Guardian | "All 3 policies passed" |
| Resolution Composer | "4 language variants generated" |
| Writeback | "Executed at 10:30:02.220" |

> "This is your flight recorder. If anyone asks 'why did the system do X?', you have complete, timestamped evidence."

---

### Step 9: Generate CSV Validation Pack — **KILLER MOMENT #4 (Part 2)**

**Time**: 1-2 minutes

**Action**: Navigate to CSV Pack → Click "Generate Pack"

**Presenter says:**

> "Finally, for those validation-minded folks—and I know compliance teams love this—let me show you the CSV Pack generator."

**Navigate to CSV Pack page**:

> "CSV here means Computer System Validation, not Comma Separated Values. This generates the documentation you need for 21 CFR Part 11 readiness."

**Click "Generate Pack"**:

> "Watch the CSV Pack agent orchestrate the generation..."

**Show timeline with Code Interpreter activity**:

> "It's using the AgentCore Code Interpreter to assemble the traceability matrix, test logs, and evidence."

**When complete, click "Download Pack"**:

> "The pack includes:
> - Demo URS (User Requirements Specification)
> - Risk Assessment
> - Traceability Matrix (requirements → tests → evidence)
> - Test Execution Logs
> - Version Manifest (which model versions, prompt hashes)
>
> All auto-generated from actual run data."

**Key message**:

> "For a validation team, this is months of work reduced to one click. Obviously this is demo-level illustration, but the structure shows HOW production CSV documentation would be assembled automatically."

---

## 5. Killer Moments

### 5.1 Summary Table

| # | Moment | Demo Step | Duration | Key Visual |
|---|--------|-----------|----------|------------|
| 1 | **Auto-close in real-time** | Step 3 | 10 sec | Case status OPEN → CLOSED |
| 2 | **Multi-language instant switch** | Step 4 | 15 sec | Language toggle: EN→PT→ES→FR |
| 3 | **Memory learning visible** | Step 5 | 20 sec | Confidence score update |
| 4 | **CSV Pack + Replay** | Steps 8-9 | 30 sec | Download validation pack |

### 5.2 If Only Showing ONE Killer Moment

**Choose**: Auto-close in real-time (Step 3)

> "Watch the timeline as a complaint comes in... classified... pattern matched... policies checked... resolution generated in 4 languages... and closed. Under 3 seconds, fully autonomous, completely auditable."

---

## 6. Persona-Specific Talking Points

### 6.1 QA Operations Lead

**Focus**: Efficiency, volume handling, daily workflow relief

| Topic | Talking Point |
|-------|---------------|
| Volume | "Imagine your Monday morning backlog of 50 cases auto-triaged before you get your coffee" |
| Consistency | "Every case gets the same thorough analysis—no tired Friday afternoon shortcuts" |
| Time savings | "Recurring complaints that used to take 15 minutes each? 3 seconds." |
| Knowledge retention | "When your best analyst retires, their knowledge is in the Memory—it doesn't walk out the door" |

### 6.2 Compliance/Validation Lead

**Focus**: Audit trails, evidence, traceability, Part 11

| Topic | Talking Point |
|-------|---------------|
| Audit trail | "Every decision has before/after snapshots, timestamped, hash-linked" |
| Evidence | "Not just WHAT was decided, but WHY—the reasoning is logged" |
| Traceability | "Requirements → test cases → evidence, automatically linked" |
| Reproducibility | "Any run can be replayed step-by-step for auditors" |
| CSV readiness | "Validation documentation assembled from actual execution data, not manual documentation" |

### 6.3 IT Security Architect

**Focus**: Identity, permissions, control, no black boxes

| Topic | Talking Point |
|-------|---------------|
| Identity | "Every agent has its own identity via AgentCore Identity—we know exactly who did what" |
| Permissions | "Writeback agent can ONLY execute pre-approved actions from Compliance Guardian" |
| Observability | "Full CloudWatch integration—logs, traces, metrics for every agent" |
| No black box | "You can see every decision, every reasoning chain—this isn't magic, it's engineering" |
| Mode control | "Observe mode lets you watch without risk; Act mode requires explicit enablement" |

### 6.4 Executive Sponsor

**Focus**: ROI, risk, time-to-value, competitive advantage

| Topic | Talking Point |
|-------|---------------|
| ROI | "70-80% of complaints are recurring patterns—all can be auto-resolved" |
| Risk | "High-impact decisions ALWAYS go to humans—the system knows its limits" |
| Speed | "Time-to-resolution drops from hours to seconds for routine cases" |
| Competitive | "This is the future of QMS—be ahead of your competitors, not catching up" |
| Scalability | "Same system handles 50 cases or 500—no headcount increase" |

---

## 7. Objection Handling

### 7.1 "How do we know the AI won't make mistakes?"

**Response**:

> "Great question. First, the system has guardrails—Compliance Guardian blocks any action that doesn't pass policy checks. HIGH/CRITICAL cases always go to humans.
>
> Second, everything is auditable. If a mistake happens, you have complete visibility into WHY—and you can correct it through feedback, which the system learns from.
>
> Third, you control the mode. Start in Observe, watch for weeks, only enable Act when you're confident. The system proves itself before you trust it."

### 7.2 "Is this FDA-compliant?"

**Response**:

> "This demo is designed to SUPPORT compliance—showing the patterns you'd need for Part 11 readiness. It generates audit trails, version manifests, and traceability.
>
> For production use, you'd need your own validation activities. But the architecture provides the hooks—immutable ledger, timestamped logs, electronic signatures via Cognito."

### 7.3 "What if agents hallucinate?"

**Response**:

> "Three layers of protection:
> 1. Structured outputs—agents don't generate freeform text, they fill templates
> 2. Evidence linking—every pattern match references real historical cases
> 3. Compliance Guardian—validates evidence completeness before approving any action
>
> And if something slips through? The audit trail shows exactly what happened, and feedback corrects future behavior."

### 7.4 "Why not just use ChatGPT?"

**Response**:

> "ChatGPT is a single AI assistant. This is a SYSTEM of specialized agents with:
> - Persistent memory that learns
> - Compliance guardrails that enforce policy
> - Full observability and audit trails
> - Integration with your QMS data model
>
> It's the difference between a smart assistant and an autonomous workforce."

### 7.5 "How long to implement?"

**Response**:

> "This demo shows the target state. For production:
> - Phase 1 (Core Wow): 4-6 weeks for MVP with 3 agents
> - Phase 2 (Full): 8-12 weeks for all 9 agents + validation pack
>
> Plus your own validation activities. But you can start seeing value in Phase 1."

---

## 8. Troubleshooting

### 8.1 Common Issues

| Issue | Symptom | Quick Fix |
|-------|---------|-----------|
| Agent not responding | Timeline stuck | Refresh page, check `/api/health` |
| Slow response | >5 sec per step | Check network, may be LLM latency |
| Writeback failed | Error in timeline | Check simulator is running |
| Memory query empty | No patterns found | Run seed script to populate |

### 8.2 Graceful Recovery

**If something breaks mid-demo**:

> "Let me pull up what this WOULD look like..."

**Backup options**:
1. Switch to pre-recorded video of the flow
2. Show static screenshots with narration
3. Navigate to Ledger to show completed historical runs

**Script**:

> "In a live system, you'd also have alerting and auto-recovery. Let me show you a successful run from earlier..."

### 8.3 Reset Between Demos

```bash
# Quick reset script
./scripts/reset-demo.sh

# This:
# - Clears all cases from simulator
# - Resets Memory to baseline patterns
# - Clears run history
# - Keeps agent deployments intact
```

---

## 9. Closing & Next Steps

### 9.1 Summary Statement

**Presenter says:**

> "So, what have we seen today?
>
> - AI agents that can **observe, learn, remember, and act** on complaints
> - **Every step visible** in the Agent Room timeline
> - **Multi-language support** for global operations
> - **Compliance-ready** audit trails and validation documentation
> - **Human-in-the-loop** when it matters—the system knows its limits
>
> This isn't replacing your QA team. It's giving them superpowers—letting them focus on the hard cases while AI handles the routine."

### 9.2 Call to Action Options

| Audience Interest | Suggested Next Step |
|-------------------|---------------------|
| High interest | "Let's schedule a technical deep-dive with your IT team" |
| Moderate interest | "Can we get you a sandbox environment to explore?" |
| Compliance-focused | "Let's set up a call with our validation team to discuss Part 11 approach" |
| Still evaluating | "I'll send over the architecture documentation—happy to answer questions" |

### 9.3 Materials to Share

| Document | Purpose |
|----------|---------|
| PRD.md | Full requirements document |
| AGENT_ARCHITECTURE.md | Technical agent specifications |
| UI_DESIGN_SYSTEM.md | Design patterns |
| This demo script | Reproduce the demo |

---

## Appendix: Demo Environment URLs

| Environment | URL | Notes |
|-------------|-----|-------|
| Production Demo | `https://demo.galderma-trackwise.example.com` | Main demo site |
| Health Check | `https://demo.galderma-trackwise.example.com/api/health` | Agent status |
| CloudWatch | AWS Console | Observability dashboard |
| Reset Script | `./scripts/reset-demo.sh` | Clean state |

---

## Related Documents

- [PRD.md](./PRD.md) - Main requirements document
- [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) - Agent specifications
- [UI_DESIGN_SYSTEM.md](./UI_DESIGN_SYSTEM.md) - Design system
- [BUILD_SPEC.md](./BUILD_SPEC.md) - Implementation guide

---

*Demo script designed for 15-20 minute presentation with killer moments highlighted for maximum impact.*
