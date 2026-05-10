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

## How To Use

- Read [PRD](./PRD.md) first to understand what the product is.
- Read [Architecture](./architecture.md) before changing auth, routing, or data flows.
- Read [Decision Log](./decision-log.md) before changing an already-chosen pattern.
- Read [Testing Guide](./testing.md) before writing or changing code.
- Read [Sprint 1 Plan](./sprint_plan/SPRINT_1_PLAN.md) for the auth/security baseline.
- Read [Sprint 2 Plan](./sprint_plan/SPRINT_2_PLAN.md) when implementing the session/security sprint.

## Maintenance Rules

- Keep each file short enough that a new session can scan it quickly.
- Update docs when the implementation changes a decision, dependency, or contract.
- Prefer stable facts over chat history.