<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles:
- none
Added sections:
- Principle VI: Brazilian Portuguese Documentation
Removed sections:
- none
Templates requiring updates:
- ✅ .specify/templates/plan-template.md (Added language requirement note)
- ✅ .specify/templates/spec-template.md (Added language requirement note)
- ✅ .specify/templates/tasks-template.md (Added language requirement note)
Follow-up TODOs:
- none
-->
# Carmelo App Constitution

## Core Principles

### I. Specification-Driven Delivery
Rules: Every change begins with an approved feature specification recorded in `specs/<feature-branch>/spec.md`; unresolved `[NEEDS CLARIFICATION]` markers block downstream artifacts; business value, not implementation detail, drives scope. Rationale: Written specs keep stakeholders aligned, give the /plan command authoritative inputs, and prevent speculative engineering work.

### II. Plan Before Implementation
Rules: Run `/plan` to produce research, data-model, quickstart, and contract outlines before `/tasks` or coding; every plan must include a Constitution Check section referencing these principles; structure decisions documented in plan.md govern repository updates. Rationale: Planning establishes testable contracts early, catching governance violations before code is written.

### III. Test-Driven Delivery (Non-Negotiable)
Rules: Write contract, integration, and unit tests before implementation; ensure new tests fail before code changes; never merge features with missing or passing-by-default tests; treat quickstart.md as executable verification steps. Rationale: TDD protects quality, ensures regressions surface immediately, and keeps tasks-template expectations enforceable.

### IV. Traceable Artifacts & Documentation
Rules: Maintain a one-to-one linkage between specification items, plan decisions, generated tasks, and code commits; update supporting docs (research.md, quickstart.md, contracts/) whenever requirements evolve; document deviations from plan inside Complexity Tracking with justification. Rationale: Traceability enables audits, simplifies reviews, and keeps automated workflows trustworthy.

### V. Operational Readiness & Observability
Rules: Every feature must declare logging, metrics, and rollback expectations in the plan; observability hooks and alerts ship with feature code; testing scope must include failure modes and recovery paths; release notes in docs capture operational impact. Rationale: Operational insight prevents silent failures and shortens incident response, aligning delivery with production reliability.

### VI. Brazilian Portuguese Documentation
Rules: All project documentation artifacts MUST be written in Brazilian Portuguese (pt-BR), including feature specifications (spec.md), implementation plans (plan.md), research documents (research.md), data models (data-model.md), quickstart guides (quickstart.md), and task lists (tasks.md); code comments and user-facing strings SHOULD follow pt-BR conventions; technical terms may retain English equivalents in parentheses when clarity demands; commit messages and code identifiers remain in English per industry convention. Rationale: Standardizing documentation language ensures consistent communication with Brazilian stakeholders, reduces translation overhead, and aligns artifacts with the primary user base.

## Execution Constraints
Feature work must follow the artifact order: `/specify` → `/plan` → `/tasks` → implementation. Tests belong under `tests/contract`, `tests/integration`, and `tests/unit` following tasks-template conventions, and code lives in the structure ratified by plan.md. Features with external dependencies require explicit entries in research.md and spec requirements for integration guarantees. No feature may bypass the Constitution Check gate in plan.md; violations must be resolved or formally justified before proceeding.

## Workflow Expectations
All feature branches derive from the branch created by `.specify/scripts/bash/create-new-feature.sh`. Pull requests reference the relevant spec directory and summarize compliance with each principle. Reviews confirm failing tests exist prior to implementation work, traceability links are intact, and operational readiness tasks are captured. After implementation, teams execute quickstart.md end-to-end and document outcomes before requesting merge approval.

## Governance
- Amendments require a proposal documenting the motivation, impacted templates, and migration actions; proposals are recorded alongside the constitution in version control.
- Semantic versioning applies: increment MAJOR for breaking governance changes or principle removals, MINOR for new principles or substantive additions, PATCH for clarifications.
- Compliance reviews occur during `/plan` Constitution Check, during PR review, and in a quarterly governance retrospective; findings feed into follow-up tasks.
- Archived constitutions remain accessible via git history; current version must be referenced in every plan.md Constitution Check.

**Version**: 1.1.0 | **Ratified**: 2025-10-04 | **Last Amended**: 2025-10-04
