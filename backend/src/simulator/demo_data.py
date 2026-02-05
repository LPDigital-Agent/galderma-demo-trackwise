# ============================================
# Galderma TrackWise AI Autopilot Demo
# Demo Data Generator - Simulated Runs & Ledger
# ============================================
#
# Generates realistic agent run and ledger data
# from existing cases for demo visualization.
# In production, this data comes from DynamoDB
# via AgentCore agents. For demo purposes, we
# deterministically generate it from case state.
#
# ============================================

import hashlib
from datetime import datetime, timedelta
from typing import Any

from .models import Case, CaseStatus, CaseType


# Agent pipeline order (the happy path)
AGENT_PIPELINE = [
    "observer",
    "case_understanding",
    "recurring_detector",
    "compliance_guardian",
    "resolution_composer",
    "writeback",
]

AGENT_DISPLAY = {
    "observer": "Observador",
    "case_understanding": "Compreensão de Caso",
    "recurring_detector": "Detector de Recorrência",
    "compliance_guardian": "Guardião de Conformidade",
    "resolution_composer": "Compositor de Resolução",
    "inquiry_bridge": "Ponte de Consulta",
    "writeback": "Escrituração",
    "memory_curator": "Curador de Memória",
    "csv_pack": "Pacote CSV",
}

MODEL_MAP = {
    "observer": "claude-4.5-haiku",
    "case_understanding": "claude-4.5-haiku",
    "recurring_detector": "claude-4.5-haiku",
    "compliance_guardian": "claude-4.5-opus",
    "resolution_composer": "claude-4.5-opus",
    "inquiry_bridge": "claude-4.5-haiku",
    "writeback": "claude-4.5-haiku",
    "memory_curator": "claude-4.5-haiku",
    "csv_pack": "claude-4.5-haiku",
}


def _deterministic_id(seed: str, prefix: str = "") -> str:
    """Generate a deterministic ID from a seed string."""
    h = hashlib.md5(seed.encode()).hexdigest()[:12]
    return f"{prefix}{h}"


def _time_offset(base: datetime, minutes: float) -> str:
    """Return ISO string offset from base time."""
    return (base + timedelta(minutes=minutes)).isoformat() + "Z"


def generate_runs_for_cases(
    cases: list[Case],
    status_filter: str | None = None,
) -> list[dict[str, Any]]:
    """Generate simulated run data for a list of cases."""
    runs: list[dict[str, Any]] = []

    for case in cases:
        run_id = _deterministic_id(case.case_id, "run-")
        base_time = case.created_at + timedelta(seconds=2)

        # Determine run status based on case status
        if case.status == CaseStatus.CLOSED:
            run_status = "COMPLETED"
            duration_ms = 12400
        elif case.status == CaseStatus.IN_PROGRESS:
            run_status = "RUNNING"
            duration_ms = None
        elif case.status == CaseStatus.PENDING_REVIEW:
            run_status = "PENDING_REVIEW"
            duration_ms = None
        else:
            run_status = "RUNNING"
            duration_ms = None

        if status_filter and run_status != status_filter:
            continue

        # Determine which agents were invoked
        if case.status == CaseStatus.CLOSED:
            agents = list(AGENT_PIPELINE)
            if case.case_type == CaseType.INQUIRY and case.linked_case_id:
                agents.insert(3, "inquiry_bridge")
        elif case.status in (CaseStatus.IN_PROGRESS, CaseStatus.PENDING_REVIEW):
            agents = AGENT_PIPELINE[:3]
        else:
            agents = AGENT_PIPELINE[:1]

        # Generate agent steps
        agent_steps = []
        step_time = 0.0
        for i, agent in enumerate(agents):
            step_duration = 1.2 + (i * 0.8)
            step = {
                "step_number": i + 1,
                "agent_name": agent,
                "step_type": _get_step_type(agent),
                "input_summary": _get_input_summary(agent, case),
                "output_summary": _get_output_summary(agent, case),
                "reasoning": _get_reasoning(agent, case),
                "tools_called": _get_tools_called(agent),
                "started_at": _time_offset(base_time, step_time),
                "completed_at": _time_offset(base_time, step_time + step_duration),
                "duration_ms": int(step_duration * 1000),
                "tokens_used": 350 + (i * 180),
                "model_id": MODEL_MAP.get(agent, "claude-4.5-haiku"),
            }
            agent_steps.append(step)
            step_time += step_duration + 0.3

        run = {
            "run_id": run_id,
            "case_id": case.case_id,
            "status": run_status,
            "mode": "ACT",
            "trigger": "CaseCreated",
            "started_at": _time_offset(base_time, 0),
            "completed_at": _time_offset(base_time, step_time) if run_status == "COMPLETED" else None,
            "duration_ms": duration_ms,
            "agents_invoked": agents,
            "agent_steps": agent_steps,
            "result": "Caso fechado automaticamente com sucesso" if run_status == "COMPLETED" else None,
            "error": None,
        }
        runs.append(run)

    runs.sort(key=lambda r: r["started_at"], reverse=True)
    return runs


def generate_ledger_for_cases(
    cases: list[Case],
    agent_filter: str | None = None,
) -> list[dict[str, Any]]:
    """Generate simulated ledger entries for a list of cases."""
    entries: list[dict[str, Any]] = []
    prev_hash = "0" * 64

    for case in cases:
        run_id = _deterministic_id(case.case_id, "run-")
        base_time = case.created_at + timedelta(seconds=3)
        case_entries = _generate_case_ledger(case, run_id, base_time, prev_hash)

        if agent_filter:
            case_entries = [e for e in case_entries if e["agent_name"] == agent_filter]

        entries.extend(case_entries)
        if case_entries:
            prev_hash = case_entries[-1].get("entry_hash", prev_hash)

    entries.sort(key=lambda e: e["timestamp"], reverse=True)
    return entries


def _generate_case_ledger(
    case: Case,
    run_id: str,
    base_time: datetime,
    prev_hash: str,
) -> list[dict[str, Any]]:
    """Generate ledger entries for a single case."""
    entries: list[dict[str, Any]] = []
    t = 0.0

    # 1. Case Analyzed (Case Understanding)
    entry_id = _deterministic_id(f"{case.case_id}-analyzed", "led-")
    entry_hash = hashlib.sha256(f"{entry_id}{prev_hash}".encode()).hexdigest()
    entries.append({
        "ledger_id": entry_id,
        "run_id": run_id,
        "case_id": case.case_id,
        "agent_name": "case_understanding",
        "action": "CASE_ANALYZED",
        "action_description": f"Reclamação classificada: {case.product_brand} {case.product_name}",
        "timestamp": _time_offset(base_time, t),
        "reasoning": f"Produto identificado como {case.product_brand} {case.product_name}. "
                     f"Categoria: {case.category or 'PACKAGING'}. "
                     f"Severidade avaliada como {case.severity} com base em palavras-chave da reclamação.",
        "decision": f"Severidade: {case.severity}, Categoria: {case.category or 'PACKAGING'}",
        "confidence": 0.92,
        "state_changes": [
            {"field": "status", "before": "OPEN", "after": "IN_PROGRESS"},
        ],
        "policies_evaluated": [],
        "policy_violations": [],
        "model_id": "claude-4.5-haiku",
        "tokens_used": 420,
        "latency_ms": 1200,
        "entry_hash": entry_hash,
        "previous_hash": prev_hash,
    })
    prev_hash = entry_hash
    t += 2.0

    # 2. Pattern Matched (Recurring Detector)
    is_recurring = case.category and case.category.value == "PACKAGING"
    entry_id = _deterministic_id(f"{case.case_id}-pattern", "led-")
    entry_hash = hashlib.sha256(f"{entry_id}{prev_hash}".encode()).hexdigest()
    entries.append({
        "ledger_id": entry_id,
        "run_id": run_id,
        "case_id": case.case_id,
        "agent_name": "recurring_detector",
        "action": "PATTERN_MATCHED" if is_recurring else "CASE_ANALYZED",
        "action_description": (
            f"Padrão recorrente detectado: reclamação de embalagem {case.product_brand}"
            if is_recurring
            else "Nenhum padrão recorrente encontrado"
        ),
        "timestamp": _time_offset(base_time, t),
        "reasoning": (
            "Pontuação de similaridade ponderada: 0.94 (produto: 1.0, categoria: 1.0, semântica: 0.82). "
            "Padrão PKG-SEAL-001 correspondido com ALTA confiança. "
            "Recomendação: AUTO_CLOSE"
            if is_recurring
            else "Nenhum padrão correspondido acima do limite de 0.75. "
            "Pontuações de similaridade abaixo do limite para todos os padrões conhecidos. "
            "Recomendação: HUMAN_REVIEW"
        ),
        "decision": "AUTO_CLOSE" if is_recurring else "HUMAN_REVIEW",
        "confidence": 0.94 if is_recurring else 0.45,
        "state_changes": [],
        "policies_evaluated": [],
        "policy_violations": [],
        "model_id": "claude-4.5-haiku",
        "tokens_used": 380,
        "latency_ms": 1800,
        "memory_strategy": "RecurringPatterns",
        "memory_pattern_id": "PKG-SEAL-001" if is_recurring else None,
        "entry_hash": entry_hash,
        "previous_hash": prev_hash,
    })
    prev_hash = entry_hash
    t += 2.5

    # Only continue pipeline for cases that were processed further
    if case.status not in (CaseStatus.CLOSED, CaseStatus.RESOLVED):
        if not is_recurring:
            # Add human review request for non-recurring
            entry_id = _deterministic_id(f"{case.case_id}-hil", "led-")
            entry_hash = hashlib.sha256(f"{entry_id}{prev_hash}".encode()).hexdigest()
            entries.append({
                "ledger_id": entry_id,
                "run_id": run_id,
                "case_id": case.case_id,
                "agent_name": "compliance_guardian",
                "action": "HUMAN_REVIEW_REQUESTED",
                "action_description": "Revisão humana necessária - confiança abaixo do limite",
                "timestamp": _time_offset(base_time, t),
                "reasoning": "Pontuação de confiança 0.45 está abaixo do limite de 0.90 (POL-003). "
                             "Caso requer revisão de analista humano antes de prosseguir.",
                "decision": "HOLD - Aguardando revisão humana",
                "confidence": 0.45,
                "state_changes": [],
                "policies_evaluated": ["POL-001", "POL-002", "POL-003"],
                "policy_violations": ["POL-003: Confidence below threshold"],
                "model_id": "claude-4.5-opus",
                "tokens_used": 650,
                "latency_ms": 2800,
                "requires_human_action": True,
                "entry_hash": entry_hash,
                "previous_hash": prev_hash,
            })
        return entries

    # 3. Compliance Checked (Guardian)
    entry_id = _deterministic_id(f"{case.case_id}-compliance", "led-")
    entry_hash = hashlib.sha256(f"{entry_id}{prev_hash}".encode()).hexdigest()
    severity_pass = case.severity in ("LOW", "MEDIUM")
    entries.append({
        "ledger_id": entry_id,
        "run_id": run_id,
        "case_id": case.case_id,
        "agent_name": "compliance_guardian",
        "action": "COMPLIANCE_CHECKED",
        "action_description": f"5 políticas de conformidade avaliadas - {'APROVADO' if severity_pass else 'ESCALADO'}",
        "timestamp": _time_offset(base_time, t),
        "reasoning": (
            "POL-001 (Severidade): APROVADO - Severidade LOW permite fechamento automático. "
            "POL-002 (Evidência): APROVADO - Todos os 5 campos obrigatórios presentes. "
            "POL-003 (Confiança): APROVADO - 0.94 >= limite de 0.90. "
            "POL-004 (Eventos Adversos): APROVADO - Sem indicadores de evento adverso. "
            "POL-005 (Regulatório): APROVADO - Sem palavras-chave regulatórias detectadas. "
            "Decisão geral: APPROVE para fechamento automático."
            if severity_pass
            else "POL-001 (Severidade): FALHOU - Severidade HIGH/CRITICAL requer revisão humana. "
            "Decisão geral: ESCALATE para revisor humano."
        ),
        "decision": "APPROVE" if severity_pass else "ESCALATE",
        "confidence": 0.98 if severity_pass else 0.65,
        "state_changes": [],
        "policies_evaluated": ["POL-001", "POL-002", "POL-003", "POL-004", "POL-005"],
        "policy_violations": [] if severity_pass else ["POL-001: Severity too high for auto-close"],
        "model_id": "claude-4.5-opus",
        "tokens_used": 780,
        "latency_ms": 3200,
        "entry_hash": entry_hash,
        "previous_hash": prev_hash,
    })
    prev_hash = entry_hash
    t += 3.0

    # 4. Resolution Generated (Composer)
    entry_id = _deterministic_id(f"{case.case_id}-resolution", "led-")
    entry_hash = hashlib.sha256(f"{entry_id}{prev_hash}".encode()).hexdigest()
    entries.append({
        "ledger_id": entry_id,
        "run_id": run_id,
        "case_id": case.case_id,
        "agent_name": "resolution_composer",
        "action": "RESOLUTION_GENERATED",
        "action_description": f"Resolução composta em 4 idiomas para {case.product_brand}",
        "timestamp": _time_offset(base_time, t),
        "reasoning": (
            f"Template PKG-REPLACE-001 aplicado para categoria de embalagem. "
            f"Personalizado com produto: {case.product_brand} {case.product_name}. "
            f"Texto canônico EN gerado + traduções PT/ES/FR. "
            f"Pontuação de qualidade: 0.95 (todas as traduções passam verificações de comprimento/similaridade)."
        ),
        "decision": "Pacote de resolução criado com 4 variantes linguísticas",
        "confidence": 0.95,
        "state_changes": [],
        "policies_evaluated": [],
        "policy_violations": [],
        "model_id": "claude-4.5-opus",
        "tokens_used": 1200,
        "latency_ms": 4500,
        "memory_strategy": "ResolutionTemplates",
        "entry_hash": entry_hash,
        "previous_hash": prev_hash,
    })
    prev_hash = entry_hash
    t += 3.5

    # 5. Writeback Executed
    entry_id = _deterministic_id(f"{case.case_id}-writeback", "led-")
    entry_hash = hashlib.sha256(f"{entry_id}{prev_hash}".encode()).hexdigest()
    entries.append({
        "ledger_id": entry_id,
        "run_id": run_id,
        "case_id": case.case_id,
        "agent_name": "writeback",
        "action": "WRITEBACK_EXECUTED",
        "action_description": f"Caso {case.case_id} encerrado no TrackWise",
        "timestamp": _time_offset(base_time, t),
        "reasoning": (
            "Verificações pré-voo aprovadas: (1) Conformidade aprovada, "
            "(2) Todas as 4 resoluções de idioma presentes, "
            "(3) Código de resolução PKG-REPLACE-001 válido, "
            "(4) Modo é ACT, (5) Caso ainda OPEN, "
            "(6) Severidade é LOW. "
            "Writeback executado com sucesso na primeira tentativa."
        ),
        "decision": "CLOSED - Resolução aplicada ao TrackWise",
        "confidence": 1.0,
        "state_changes": [
            {"field": "status", "before": "IN_PROGRESS", "after": "CLOSED"},
            {"field": "resolution_text", "before": None, "after": case.resolution_text or "Resolution applied"},
            {"field": "closed_at", "before": None, "after": (case.closed_at or datetime.utcnow()).isoformat()},
        ],
        "policies_evaluated": [],
        "policy_violations": [],
        "model_id": "claude-4.5-haiku",
        "tokens_used": 280,
        "latency_ms": 800,
        "entry_hash": entry_hash,
        "previous_hash": prev_hash,
    })

    return entries


def _get_step_type(agent: str) -> str:
    """Map agent to primary step type."""
    mapping = {
        "observer": "OBSERVE",
        "case_understanding": "THINK",
        "recurring_detector": "LEARN",
        "compliance_guardian": "THINK",
        "resolution_composer": "ACT",
        "inquiry_bridge": "THINK",
        "writeback": "ACT",
        "memory_curator": "LEARN",
    }
    return mapping.get(agent, "THINK")


def _get_input_summary(agent: str, case: Case) -> str:
    """Generate input summary for an agent step."""
    summaries = {
        "observer": f"Envelope de Evento: CasoCriado para {case.case_id}",
        "case_understanding": f"Dados do caso: {case.product_brand} {case.product_name}, '{case.complaint_text[:60]}...'",
        "recurring_detector": f"AnáliseDoCaso: {case.category or 'PACKAGING'}, severidade={case.severity}",
        "compliance_guardian": "ResultadoCorrespondência: confiança=0.94, recomendação=AUTO_CLOSE",
        "resolution_composer": f"DecisãoConformidade: APPROVE, case_id={case.case_id}",
        "inquiry_bridge": f"ReclamaçãoFábricaEncerrada: {case.case_id}, linked_case_id={case.linked_case_id}",
        "writeback": "PacoteResolução: 4 idiomas, código=PKG-REPLACE-001",
    }
    return summaries.get(agent, f"Processando {case.case_id}")


def _get_output_summary(agent: str, case: Case) -> str:
    """Generate output summary for an agent step."""
    summaries = {
        "observer": "Encaminhado para agente de compreensão de caso",
        "case_understanding": f"Categoria: {case.category or 'PACKAGING'}, Severidade: {case.severity}, Recomendação: AUTO_CLOSE",
        "recurring_detector": "Padrão PKG-SEAL-001 correspondido (confiança: 0.94)",
        "compliance_guardian": "APROVADO - Todas as 5 políticas aprovadas",
        "resolution_composer": "Resolução composta em PT/EN/ES/FR (qualidade: 0.95)",
        "inquiry_bridge": "Fechamento em cascata aprovado para consulta vinculada",
        "writeback": f"Caso {case.case_id} encerrado com sucesso no TrackWise",
    }
    return summaries.get(agent, f"Etapa concluída para {case.case_id}")


def _get_reasoning(agent: str, case: Case) -> str:
    """Generate reasoning for an agent step."""
    reasonings = {
        "observer": "Evento validado. Evento CasoCriado detectado. Encaminhando para case_understanding para classificação.",
        "case_understanding": (
            f"Produto identificado: {case.product_brand} {case.product_name}. "
            f"Categoria de reclamação extraída: {case.category or 'PACKAGING'}. "
            f"Severidade avaliada: {case.severity}."
        ),
        "recurring_detector": (
            "Memória RecurringPatterns consultada. Cálculo de similaridade ponderada: "
            "correspondência de produto=1.0 (40%), correspondência de categoria=1.0 (30%), semântica=0.82 (30%). "
            "Pontuação final: 0.94. Acima do limite de 0.75."
        ),
        "compliance_guardian": (
            "5 políticas de conformidade avaliadas. Todas aprovadas para severidade LOW, "
            "alta confiança (0.94), evidência completa, sem indicadores de evento adverso, "
            "sem palavras-chave regulatórias."
        ),
        "resolution_composer": (
            "Template PKG-REPLACE-001 aplicado. Resolução canônica EN gerada. "
            "Traduzido para PT, ES, FR. Verificações de qualidade aprovadas."
        ),
        "writeback": (
            "6 verificações pré-voo aprovadas. Executado close_case via API do simulador. "
            "Sucesso na primeira tentativa. Registrado na memória ResolutionTemplates."
        ),
    }
    return reasonings.get(agent, "Processamento concluído.")


def _get_tools_called(agent: str) -> list[str]:
    """Get tools called by each agent."""
    tools = {
        "observer": ["validate_event", "create_run", "determine_routing", "call_specialist_agent"],
        "case_understanding": ["classify_product", "extract_complaint_category", "assess_severity", "create_case_analysis"],
        "recurring_detector": ["query_recurring_patterns", "calculate_similarity", "determine_recommendation"],
        "compliance_guardian": ["evaluate_all_policies", "create_compliance_decision"],
        "resolution_composer": ["get_resolution_template", "compose_canonical_resolution", "generate_all_languages"],
        "inquiry_bridge": ["get_linked_cases", "check_closure_eligibility", "create_cascade_closure_request"],
        "writeback": ["validate_preflight", "execute_writeback", "log_success"],
    }
    return tools.get(agent, [])


# ============================================
# CSV Pack Generation
# ============================================

def generate_csv_pack(cases: list[Case]) -> dict[str, Any]:
    """Generate a simulated CSV (Computer System Validation) pack.

    Produces 6 compliance artifacts based on current case data.
    In production, this is generated by the csv_pack agent.
    """
    now = datetime.utcnow()
    pack_id = _deterministic_id(f"pack-{now.strftime('%Y%m%d')}", "CSV-")
    closed = [c for c in cases if c.status == CaseStatus.CLOSED]
    ledger_entries = generate_ledger_for_cases(cases)

    artifacts = [
        _generate_urs_artifact(pack_id, cases),
        _generate_risk_assessment_artifact(pack_id, cases, ledger_entries),
        _generate_traceability_artifact(pack_id),
        _generate_test_logs_artifact(pack_id, cases, ledger_entries),
        _generate_version_history_artifact(pack_id),
        _generate_memory_dump_artifact(pack_id, closed),
    ]

    return {
        "pack_id": pack_id,
        "generated_at": now.isoformat() + "Z",
        "total_cases_analyzed": len(cases),
        "closed_cases": len(closed),
        "total_ledger_entries": len(ledger_entries),
        "artifacts": artifacts,
        "compliance_standard": "21 CFR Part 11",
        "status": "COMPLETE",
    }


def _generate_urs_artifact(pack_id: str, cases: list[Case]) -> dict[str, Any]:
    return {
        "artifact_id": f"{pack_id}-URS",
        "artifact_type": "URS",
        "title": "Especificação de Requisitos do Usuário",
        "description": "Define o que o sistema AI Autopilot deve fazer para processamento de reclamações.",
        "status": "APPROVED",
        "sections": [
            {"id": "FR-001", "requirement": "Classificação automática de severidade", "priority": "MANDATORY", "status": "VERIFIED"},
            {"id": "FR-002", "requirement": "Detecção de padrão recorrente via AgentCore Memory", "priority": "MANDATORY", "status": "VERIFIED"},
            {"id": "FR-003", "requirement": "Geração de resolução multilíngue (PT/EN/ES/FR)", "priority": "MANDATORY", "status": "VERIFIED"},
            {"id": "FR-004", "requirement": "Fechamento em cascata de consulta vinculada", "priority": "MANDATORY", "status": "VERIFIED"},
            {"id": "CR-001", "requirement": "Trilha de auditoria imutável com hash chain SHA-256", "priority": "MANDATORY", "status": "VERIFIED"},
            {"id": "CR-002", "requirement": "Portal de conformidade de 5 políticas antes de fechamento automático", "priority": "MANDATORY", "status": "VERIFIED"},
            {"id": "CR-003", "requirement": "Human-in-the-loop para severidade HIGH/CRITICAL", "priority": "MANDATORY", "status": "VERIFIED"},
            {"id": "NFR-001", "requirement": "Latência de processamento < 30 segundos", "priority": "HIGH", "status": "VERIFIED"},
            {"id": "NFR-002", "requirement": "Limite de confiança do agente >= 0.90", "priority": "MANDATORY", "status": "VERIFIED"},
        ],
        "total_requirements": 9,
        "verified": 9,
        "coverage": 100.0,
    }


def _generate_risk_assessment_artifact(
    pack_id: str, cases: list[Case], ledger: list[dict[str, Any]]
) -> dict[str, Any]:
    high_critical = len([c for c in cases if c.severity in ("HIGH", "CRITICAL")])
    return {
        "artifact_id": f"{pack_id}-RA",
        "artifact_type": "RiskAssessment",
        "title": "Avaliação de Risco (FMEA)",
        "description": "Análise de Modo e Efeito de Falha para processamento de reclamações orientado por IA.",
        "status": "APPROVED",
        "methodology": "FMEA",
        "risk_summary": {
            "LOW": len([c for c in cases if c.severity in ("LOW",)]),
            "MEDIUM": len([c for c in cases if c.severity in ("MEDIUM",)]),
            "HIGH": high_critical,
            "CRITICAL": 0,
        },
        "controls": [
            {"id": "CTRL-001", "control": "Aplicação de políticas do Guardião de Conformidade", "risk_mitigated": "Fechamento automático incorreto"},
            {"id": "CTRL-002", "control": "Human-in-the-loop para HIGH/CRITICAL", "risk_mitigated": "Evento de segurança perdido"},
            {"id": "CTRL-003", "control": "Limite de confiança >= 0.90", "risk_mitigated": "Decisões de baixa confiança"},
            {"id": "CTRL-004", "control": "Auto-escalação de evento adverso", "risk_mitigated": "Risco de segurança do paciente"},
            {"id": "CTRL-005", "control": "Ledger de decisão imutável", "risk_mitigated": "Adulteração de trilha de auditoria"},
        ],
        "residual_risk": "ACCEPTABLE",
        "total_decisions_analyzed": len(ledger),
    }


def _generate_traceability_artifact(pack_id: str) -> dict[str, Any]:
    matrix = [
        {"req_id": "FR-001", "test_id": "TC-001", "requirement": "Classificação de severidade", "evidence": "Ledger ai_confidence >= 0.85", "status": "PASS"},
        {"req_id": "FR-002", "test_id": "TC-002", "requirement": "Detecção de padrão", "evidence": "Memória RecurringPatterns", "status": "PASS"},
        {"req_id": "FR-003", "test_id": "TC-003", "requirement": "Geração multilíngue", "evidence": "ResolutionPackage 4 idiomas", "status": "PASS"},
        {"req_id": "FR-004", "test_id": "TC-004", "requirement": "Fechamento em cascata de consulta", "evidence": "Logs do agente InquiryBridge", "status": "PASS"},
        {"req_id": "CR-001", "test_id": "TC-005", "requirement": "Trilha de auditoria imutável", "evidence": "Hash chain SHA-256 verificada", "status": "PASS"},
        {"req_id": "CR-002", "test_id": "TC-006", "requirement": "Portal de conformidade de 5 políticas", "evidence": "Entradas de ledger ComplianceDecision", "status": "PASS"},
        {"req_id": "CR-003", "test_id": "TC-007", "requirement": "Human-in-the-loop", "evidence": "Entradas HUMAN_REVIEW_REQUESTED", "status": "PASS"},
        {"req_id": "NFR-001", "test_id": "TC-008", "requirement": "Latência < 30s", "evidence": "Run duration_ms < 30000", "status": "PASS"},
        {"req_id": "NFR-002", "test_id": "TC-009", "requirement": "Confiança >= 0.90", "evidence": "Pontuações de confiança do ledger", "status": "PASS"},
    ]
    return {
        "artifact_id": f"{pack_id}-TM",
        "artifact_type": "TraceabilityMatrix",
        "title": "Matriz de Rastreabilidade de Requisitos",
        "description": "Vincula cada requisito a casos de teste e evidências.",
        "status": "APPROVED",
        "matrix": matrix,
        "coverage": 100.0,
        "total_requirements": len(matrix),
        "all_passed": True,
    }


def _generate_test_logs_artifact(
    pack_id: str, cases: list[Case], ledger: list[dict[str, Any]]
) -> dict[str, Any]:
    approved = len([e for e in ledger if e.get("decision") == "APPROVE"])
    blocked = len([e for e in ledger if e.get("decision") and "BLOCK" in str(e["decision"])])
    escalated = len([e for e in ledger if e.get("decision") == "ESCALATE"])
    return {
        "artifact_id": f"{pack_id}-TEL",
        "artifact_type": "TestExecutionLogs",
        "title": "Logs de Execução de Testes",
        "description": "Resultados de testes automatizados de execuções de processamento de agentes.",
        "status": "APPROVED",
        "execution_summary": {
            "total_runs": len(cases),
            "successful": approved,
            "blocked": blocked,
            "escalated": escalated,
        },
        "test_environment": {
            "platform": "AWS Bedrock AgentCore",
            "models": ["claude-4.5-opus", "claude-4.5-haiku"],
            "agents": 9,
            "memory_strategies": ["RecurringPatterns", "ResolutionTemplates", "PolicyKnowledge"],
        },
    }


def _generate_version_history_artifact(pack_id: str) -> dict[str, Any]:
    return {
        "artifact_id": f"{pack_id}-VH",
        "artifact_type": "VersionHistory",
        "title": "Histórico de Versões e Controle de Mudanças",
        "description": "Rastreia todas as versões do sistema, atualizações de modelo e mudanças de política.",
        "status": "APPROVED",
        "versions": [
            {"version": "1.0.0", "date": "2026-01-15", "description": "Lançamento inicial - malha de 9 agentes", "author": "AI Autopilot Team"},
            {"version": "1.1.0", "date": "2026-01-22", "description": "Lógica de cascata Inquiry Bridge adicionada", "author": "AI Autopilot Team"},
            {"version": "1.2.0", "date": "2026-02-01", "description": "POL-005 do Guardião de Conformidade adicionada", "author": "AI Autopilot Team"},
            {"version": "1.2.1", "date": "2026-02-04", "description": "Correção de tradução FR do Compositor de Resolução", "author": "AI Autopilot Team"},
        ],
        "current_version": "1.2.1",
        "model_versions": {
            "critical_agents": "claude-4.5-opus",
            "standard_agents": "claude-4.5-haiku",
        },
    }


def _generate_memory_dump_artifact(pack_id: str, closed_cases: list[Case]) -> dict[str, Any]:
    patterns = []
    for i, case in enumerate(closed_cases[:5]):
        patterns.append({
            "pattern_id": _deterministic_id(f"mem-{case.case_id}", "PAT-"),
            "strategy": "RecurringPatterns",
            "product": f"{case.product_brand} {case.product_name}",
            "category": str(case.category or "PACKAGING"),
            "confidence": 0.85 + (i * 0.02),
            "status": "ACTIVE",
            "uses": 3 + i,
        })
    return {
        "artifact_id": f"{pack_id}-MD",
        "artifact_type": "MemoryDump",
        "title": "Dump de Memória AgentCore",
        "description": "Snapshot de todos os padrões aprendidos na Memória AgentCore.",
        "status": "APPROVED",
        "strategies": {
            "RecurringPatterns": len(patterns),
            "ResolutionTemplates": max(1, len(patterns) - 1),
            "PolicyKnowledge": 5,
        },
        "sample_patterns": patterns,
        "total_patterns": len(patterns) + 6,
    }
