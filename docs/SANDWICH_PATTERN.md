# Sandwich Pattern: LLM = BRAIN / PYTHON = HANDS

> **MANDATORY ENGINEERING PRINCIPLE** for all agents in this repo.

Research across agentic frameworks (LangChain, Semantic Kernel, AutoGen) and engineering best practices (OpenAI/Anthropic) converges on a reliable pattern:

- **LLM = "Brain"** → decision-making, reasoning, planning, intent extraction
- **Python = "Hands"** → deterministic execution, parsing, validation, networking, retries

---

## The Pattern: CODE → LLM → CODE

- **Code (Preparation):** networking, auth, HTML cleaning, pre-filtering, normalization
- **LLM (Reasoning):** analyze clean inputs, infer intent/meaning, decide actions
- **Code (Validation):** validate output types/constraints (dates, enums, integers, schemas) before persisting or executing actions

---

## Application Rules

### 1) HTTP Requests & Responses — Python (Deterministic)

LLMs do not actually execute network calls; they can hallucinate request/response formats.

**Tool Use Pattern:**
- **LLM (Reasoning):** decides which API/tool to call and the parameters
- **Python (Execution):** performs the real call (`httpx`), handles auth, headers, retries
- **Python (Error Handling):** catches failures, returns error to LLM for next step (retry, fallback, HIL)

### 2) JSON Parsing — Python (Deterministic)

API JSON is already structured. Feeding large JSON into an LLM is slow, expensive, and prone to hallucinating keys.

- Always parse JSON in Python: `json.loads()` (fast + accurate)
- Filter in Python first: reduce large payloads to relevant fields BEFORE sending to LLM

### 3) Data Extraction — Hybrid (Context Dependent)

**Unstructured text (PDF, emails, HTML) → LLM**
- Use the LLM for extraction BUT enforce structured outputs (Pydantic schemas)

**Structured data (Excel, API JSON) → Python**
- Use Python (`pandas`, native logic) to locate/filter/aggregate first
- Do NOT send huge tables to the LLM just to find fields
