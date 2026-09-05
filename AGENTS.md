# Project agent workflow

This repository is an HSC ICT MCQ portal: Next.js/React in `apps/web` and Express/Mongoose in `apps/api`, managed with npm workspaces.

## Main agent

The main Codex conversation coordinates the work; it is not a separate custom subagent. Understand the request, inspect existing behavior, define acceptance criteria, delegate bounded tasks, integrate changes, and report actual validation results.

Use specialized subagents for independent work when that improves speed or review quality. Small, localized tasks can stay with the main agent. Use only the roles needed. Respect the runtime concurrency limit; stage remaining roles instead of spawning all at once. Subagents should return to the main agent rather than delegate further unless explicitly assigned to do so.

## Roles

- `backend`: implementation in `apps/api`, including routes, models, services, authentication, imports, and migrations.
- `frontend`: implementation in `apps/web`, including pages, components, API integration, responsive UI, accessibility, and Bangla/English content.
- `security_review`: read-only review of authentication, authorization, input handling, uploads, rich content, and sensitive data exposure.
- `testing`: tests and verification across both workspaces; production fixes return to their implementation owner.
- `mcq_domain`: read-only review when question types, scoring, syllabus hierarchy, or imports change.

Definitions live in `.codex/agents/`. If the client cannot select custom roles, pass the relevant file's instructions explicitly to an available subagent and preserve its stated scope. If delegation is unavailable, perform the relevant responsibilities sequentially and disclose that limitation.

## Coordination

- Give each task an objective, explicit file ownership, dependencies, acceptance criteria, and expected output.
- Agree on request/response shapes, error handling, and permissions before parallel frontend/backend implementation.
- Assign one writer per file. Reviewers may read shared files but return findings to the owner. Assign shared manifests and lockfile changes to one owner, usually the main agent.
- Preserve existing user changes. Do not revert another agent's work or commit, push, deploy, seed, or migrate a database unless authorized by the user's task.
- Review security-sensitive changes with `security_review`; review question/scoring/import semantics with `mcq_domain` when useful. Act on concrete findings and recheck affected behavior.
- Each agent returns changed or reviewed files, findings with evidence, checks run and their outcomes, and unresolved limitations. The main agent verifies the integrated diff before completion.

## Project conventions

- Follow existing JavaScript/JSX, module, formatting, and component conventions. Avoid unrelated framework or dependency changes.
- Enforce identity, roles, and record access on the API. UI route protection is not authorization.
- Preserve guest practice and student/teacher/moderator boundaries. Never log passwords, tokens, or complete authentication payloads.
- Preserve question types, answer validity, scoring, syllabus relationships, Bangla/English content, and mathematical rendering. Inspect actual model and service rules before changing them.
- Use isolated fixtures for tests. Do not use production data or send real email during automated checks.

## Validation

Run commands from the repository root unless stated otherwise:

- API tests: `npm run test -w @jayed/api`.
- Frontend build: `npm run build -w @jayed/web`.
- Frontend lint script: `npm run lint -w @jayed/web`; inspect compatibility before relying on it because the existing script uses `next lint`.
- Formatting: use the installed Prettier on changed supported files; avoid a repository-wide rewrite.

Choose checks appropriate to the change. Add meaningful regression tests for changed behavior, not tests that merely repeat implementation details. API integration and browser E2E tooling are not established by these agent definitions: inspect available tooling before claiming coverage or adding infrastructure. Report unavailable checks honestly. Documentation/configuration-only changes need configuration and diff validation rather than application test runs.
