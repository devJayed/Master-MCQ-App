# Development agents

The main Codex conversation coordinates four regular specialists and an optional MCQ domain reviewer. These are development roles; they do not add AI features to the running application.

| Role              | Scope                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| Main Codex        | Planning, file ownership, API contracts, integration, final verification       |
| `backend`         | Express, MongoDB/Mongoose, services, auth, imports                             |
| `frontend`        | Next.js, React, UI, accessibility, bilingual and math rendering                |
| `security_review` | Read-only security findings returned to implementation owners                  |
| `testing`         | Assigned tests, regression checks, available integration/browser verification  |
| `mcq_domain`      | Optional read-only review of question, scoring, syllabus, and import semantics |

## Using the setup

Open this repository in a current Codex client and start a new conversation so project instructions and agent definitions can be loaded. Project configuration must be permitted by the client's trust and managed settings. Agent files inherit the parent model and reasoning effort. Review roles request a read-only sandbox; live runtime permission overrides still take precedence.

The project requests up to three concurrent subagent threads, excluding the main conversation. The main agent stages additional roles within the runtime's effective limit. It handles small tasks directly and delegates independent work according to `AGENTS.md`.

Example prompts:

- "Implement the question filter feature. Use backend and frontend agents with an agreed API contract, then have testing verify it."
- "Review authentication audit logging with security_review. Return findings without changing code."
- "Fix question imports. Use backend for implementation, mcq_domain for semantic review, and testing for regression coverage."

Custom definitions are in `.codex/agents/*.toml`. There is no separate main-agent definition because the current conversation performs that role. The definitions describe responsibilities; they do not install test frameworks or start background agents automatically.

If custom-agent selection is unavailable in the client, the main agent can pass the role instructions to available subagents. If subagents are unavailable altogether, it performs the responsibilities sequentially and reports that limitation.

## Validation and maintenance

Keep role scopes aligned with the actual repository and its package scripts. Assign one writer per file, including shared manifests. Add integration or E2E tooling only as part of a task that requires it. Reviewers report findings; implementation owners apply fixes.

Configuration format and behavior follow the [official Codex subagents documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents). Client support and managed policy can affect activation; syntax validation alone does not prove that an IDE session loaded the roles.
