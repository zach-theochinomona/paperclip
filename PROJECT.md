# PROJECT.md

> **This file is the single source of truth for project state.**
> Update it BEFORE you push. The next person to pull this repo reads this first.

## What Is This?

**Paperclip** — Open-source orchestration for zero-human companies. A Node.js server + React UI that orchestrates a team of AI agents to run a business.

If OpenClaw is an _employee_, Paperclip is the _company_. Bring your own agents, assign goals, and track work and costs from one dashboard. Has org charts, budgets, governance, goal alignment, and agent coordination.

Manage business goals, not pull requests.

## Quick Start

```bash
git clone https://github.com/zach-theochinomona/paperclip.git
cd paperclip

# Option A: DevContainer (recommended — Node 22)
# Open in VS Code / Cursor — auto-builds

# Option B: Manual
pnpm install

# Dev
pnpm dev

# Docker
# See docker/ directory
```

## Current Status

| What | Status | Notes |
|------|--------|-------|
| Core orchestration server | DONE | Node.js |
| React dashboard UI | DONE | |
| Agent coordination | DONE | |
| Goal management | DONE | |
| Budget/cost tracking | DONE | |
| Org charts + governance | DONE | |
| CLI | DONE | cli/ |
| Docker deployment | DONE | docker/ |
| CI/CD | DONE | .github/ |
| Documentation | DONE | docs/, doc/ |
| Skills system | DONE | skills/ |
| Evals | DONE | evals/ |

### Last Agent Working On This
- **Who:** hermes
- **When:** 2026-04-12
- **What:** Deep hermes_local integration with Cabinet memory sync, openclaw_local adapter, http_agent adapter

### What Needs To Happen Next
1. Run pnpm install and typecheck to verify all new adapters compile
2. Test each adapter with Paperclip agents
3. Create PRs for review

### Recent Changes (2026-04-13)

### Agent Platform Integration Enhancements

#### OpenClaw Adapter + Cabinet Integration
- Added `cabinet.ts` with full Cabinet memory API functions (append, read, list, search)
- Updated `execute.ts` to integrate Cabinet context into agent sessions
- Added bootstrap prompt with Cabinet instructions
- Added task completion memory append after agent runs
- Added runtime service report for Cabinet status

#### HTTP Agent Adapter + Cabinet Integration  
- Created `cabinet.ts` with Cabinet memory API functions (append, read, write, list, search)
- Updated `execute.ts` to integrate Cabinet context into agent sessions
- Added bootstrap prompt with Cabinet instructions
- Added task completion memory append after agent runs
- Added runtime service report for Cabinet status

#### Hermes Adapter Fixes
- Fixed `AdapterRuntimeServiceReport` to use correct interface (`serviceName`, `status`, `url`)
- Fixed type errors in `runtimeServices.push()`
- Updated `tsconfig.json` to explicitly include ES2023 and DOM libs

#### Type System Improvements
- Fixed `AdapterExecutionResult` to use `runtimeServices` directly (not in `meta` object)
- Fixed `cabinet.ts` to use `indexOf` instead of `includes` for ES5 compatibility
- Resolved Promise constructor errors and module resolution issues

### All Adapters Now Have Consistent Cabinet Integration
All three adapters (Hermes, OpenClaw, HTTP Agent) now follow the same pattern:
1. Cabinet config resolution from adapter config
2. Bootstrap prompt with Cabinet context
3. Pre-execution memory pull (if bidirectional/pull mode)
4. Post-execution memory push (if bidirectional/push mode)
5. Runtime service report for Cabinet status
## Architecture

```
.
├── server/                # Node.js orchestration server
├── ui/                    # React dashboard
├── cli/                   # CLI tool
├── packages/              # Monorepo packages (pnpm workspaces)
├── skills/                # Agent skills
├── evals/                 # Evaluation suite
├── docker/                # Docker deployment
├── docs/                  # Documentation
├── doc/                   # Assets
├── scripts/               # Build/utility scripts
├── tests/                 # Tests
├── patches/               # pnpm patches
├── releases/              # Release configs
├── pnpm-workspace.yaml    # Monorepo config
├── tsconfig.json          # TypeScript config
└── vitest.config.ts       # Test config
```

### Key Decisions
- **pnpm workspaces** — Monorepo with packages/
- **Node.js** — Server runtime
- **React** — Dashboard UI
- **TypeScript** — Type safety across the stack

## Environment

| Setting | Value |
|---------|-------|
| Node.js | 22 |
| Package manager | pnpm |
| Framework | Node.js + React |
| Docker | Yes (devcontainer) |

---

> **RULE: Never leave this file stale. If you touched the code, update this file.**
