# MasterMind

MasterMind helps employees on existing projects find answers across teams, request missing information, and reuse approved team responses. It also guides infrastructure requests through a reviewable form. It does not brainstorm goals, plan projects, or provision resources.

This alternative interface uses a dark navigation rail, ivory canvas, Bricolage Grotesque headings, DM Sans body text, and an original red/gold CPU-chip logo. It is a fictional hackathon demonstration, not an official Mastercard product.

Hosted demo: [MasterMind on Sites](https://mastermind.hello566104.chatgpt.site).

The alternative lives on `codex/impeccable-redesign`; the original version remains on `main`. Publishing this branch updates the existing hosted demo URL. See [DESIGN.md](DESIGN.md) for extracted visual tokens and [.impeccable/design.json](.impeccable/design.json) for component previews.

## What works today

- Connect an existing fictional Jira project, review its teams immediately, and share the personal workspace when ready.
- Follow the three-step workspace guide, track request progress, and open the latest team answer from a clear next action.
- Retrieve curated source passages with citations and demo group permissions.
- Route known knowledge gaps to the responsible team and create a **simulated** Jira story.
- Answer requests from a receiving team's inbox; approve an answer for reuse by the requesting and answering teams.
- Prepare, review, and submit infrastructure requests to Platform without provisioning anything.
- Measure questions, open requests, answer reuse, and actual demo response times.
- Persist activity in Cloudflare D1, isolated by a browser's HTTP-only demo cookie.

Retrieval is deterministic topic matching over fictional Confluence, Microsoft Teams, and SharePoint records. There is no live RAG model, Azure connection, external document ingestion, or real Jira ticket creation. Azure and Jira classes are explicit unconfigured placeholders; adding API keys alone does not enable them.

## Run locally

Use Node.js 22.13 or later and npm. From a new checkout:

```sh
git clone https://github.com/ManishChepuri/mastermind-ai.git
cd mastermind-ai
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_gigantic_gressill.sql
npm run dev
```

Open [the local app](http://127.0.0.1:5173/). The initial build creates the local Wrangler configuration. Apply the migration once per fresh local database; do not replay it against an already initialized database. Development and built previews share `.wrangler/state`. The first workspace request seeds its fictional project.

`npm start` previews the built Worker locally; use its printed URL. `npm run install:ci` is the starter's portable wrapper around a locked npm install. `.sites-runtime`, `.vinext`, `.wrangler`, `node_modules`, and build output are local artifacts, not source to commit.

## Architecture

| Layer | Current implementation |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS, Next-compatible app routes |
| Runtime | Vinext with Vite; deployable Cloudflare Worker through Sites |
| API | `GET` and `POST /api/workspace` for persona views and workflow actions |
| Workflow | `lib/engine.ts` with retrieval, routing, permissions, approvals, and event recording |
| Storage | `WorkspaceRepository` backed by Cloudflare D1; JSON workspace plus optimistic revision checks |
| Integrations | Async question-provider seam in `lib/providers.ts`; service contracts in `lib/adapters.ts`; explicit Azure/Jira placeholders |

The demo uses selectable fictional personas, not employee authentication. Separate browsers receive separate workspaces; switch personas within the same browser to demonstrate cross-team collaboration. Reset creates a new demo session and retains the previous database record. Production identity, retention policies, source ACL synchronization, and enterprise tenancy remain future work.

## Verify and extend

```sh
npm test
npm run typecheck
# With the local server running:
node tests/api.smoke.mjs
npm run build
```

Engine tests cover cited answers, gap routing, duplicate requests, idempotency, approval and audience checks, redaction, team selection, unknown ownership, personal workspaces, and infrastructure validation. Use the [demo walkthrough](docs/DEMO.md) for browser acceptance checks and the [Azure handoff](docs/AZURE_HANDOFF.md) for the integration work still required.

Keep credentials server-side. `.env.example` lists planned configuration names; do not commit populated environment files or enter credentials into the demonstration UI. Deployment through Sites uses the declared D1 binding and production migration workflow; a local migration does not initialize a hosted database.

The finalized redesign and mock Jira board are also published directly to `main` at the user’s request. The pre-redesign interface remains available at commit `7f76e97`.
