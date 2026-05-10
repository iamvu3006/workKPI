# WorkKPI Docs

This folder is the durable context layer for the project.

Use it as the source of truth when starting a new session or when an AI assistant needs to understand the codebase without guessing.

## Document Map

- [PRD](./PRD.md): product goals, scope, personas, and sprint boundaries.
- [Architecture](./architecture.md): system structure, auth model, data ownership, and route conventions.
- [Decision Log](./decision-log.md): short records of design decisions and why they were made.
- [Testing Guide](./testing.md): TDD approach, test layers, and validation rules.
- [Sprint 1 Plan](./sprint_plan/SPRINT_1_PLAN.md): implementation order, dependencies, and effort estimate for the auth/security sprint.
- [Sprint 2 Plan](./sprint_plan/SPRINT_2_PLAN.md): implementation order, dependencies, and effort estimate for the session lifecycle and abuse-protection sprint.
- [Sprint 3 Plan](./sprint_plan/SPRINT_3_PLAN.md): implementation order, dependencies, and effort estimate for user experience, admin operations, and governance.
- [Sprint 4 Plan](./sprint_plan/SPRINT_4_PLAN.md): implementation order, dependencies, and effort estimate for task foundation and authoring.
- [Sprint 5 Plan](./sprint_plan/SPRINT_5_PLAN.md): implementation order, dependencies, and effort estimate for task lifecycle and collaboration.
- [Sprint 6 Plan](./sprint_plan/SPRINT_6_PLAN.md): implementation order, dependencies, and effort estimate for task views and planning.
- [Sprint 7 Plan](./sprint_plan/SPRINT_7_PLAN.md): implementation order, dependencies, and effort estimate for task automation and structure.
- [Sprint 8 Plan](./sprint_plan/SPRINT_8_PLAN.md): implementation order, dependencies, and effort estimate for KPI metrics and reporting.
- [Sprint 9 Plan](./sprint_plan/SPRINT_9_PLAN.md): implementation order, dependencies, and effort estimate for task platform hardening and edge cases.
- [Sprint 10 Plan](./sprint_plan/SPRINT_10_PLAN.md): implementation order, dependencies, and effort estimate for release readiness and stabilization.

## How To Use

- Read [PRD](./PRD.md) first to understand what the product is.
- Read [Architecture](./architecture.md) before changing auth, routing, or data flows.
- Read [Decision Log](./decision-log.md) before changing an already-chosen pattern.
- Read [Testing Guide](./testing.md) before writing or changing code.
- Read [Sprint 1 Plan](./sprint_plan/SPRINT_1_PLAN.md) for the auth/security baseline.
- Read [Sprint 2 Plan](./sprint_plan/SPRINT_2_PLAN.md) when implementing the session/security sprint.
- Read [Sprint 3 Plan](./sprint_plan/SPRINT_3_PLAN.md) for profile, admin, and governance work.
- Read [Sprint 4 Plan](./sprint_plan/SPRINT_4_PLAN.md) for task authoring and assignment work.
- Read [Sprint 5 Plan](./sprint_plan/SPRINT_5_PLAN.md) for task execution and collaboration work.
- Read [Sprint 6 Plan](./sprint_plan/SPRINT_6_PLAN.md) for task view and planning work.
- Read [Sprint 7 Plan](./sprint_plan/SPRINT_7_PLAN.md) for automation, dependencies, and subtasks.
- Read [Sprint 8 Plan](./sprint_plan/SPRINT_8_PLAN.md) for KPI calculations and reporting.
- Read [Sprint 9 Plan](./sprint_plan/SPRINT_9_PLAN.md) for hardening and edge-case handling.
- Read [Sprint 10 Plan](./sprint_plan/SPRINT_10_PLAN.md) for release readiness and stabilization.

## Maintenance Rules

- Keep each file short enough that a new session can scan it quickly.
- Update docs when the implementation changes a decision, dependency, or contract.
- Prefer stable facts over chat history.