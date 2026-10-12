# MasterMind Azure integration handoff

The current application is a persistent Sites demo with Cloudflare D1 storage, deterministic retrieval, fictional sources, and simulated Jira stories. The contracts below make future integrations easier to isolate, but they are not implemented live connections. Supplying credentials alone will not activate Azure or Jira.

## Existing contracts and wiring

| Contract | Location | Intended responsibility |
| --- | --- | --- |
| `QuestionProvider` | `lib/providers.ts` | Asynchronously resolve a question from server-filtered evidence |
| `KnowledgeConnector` | `lib/adapters.ts` | Fetch source documents with a pagination cursor |
| `SearchProvider` | `lib/adapters.ts` | Search evidence for a question, person, and project |
| `AnswerProvider` | `lib/adapters.ts` | Return grounded text, citation IDs, and a knowledge-gap decision |
| `TicketProvider` | `lib/adapters.ts` | Create a ticket using an idempotency key and destination project |
| `WorkspaceRepository` | `lib/repository.ts` | Load, initialize, and save workspace state with a revision check |

`AzureSearchPlaceholder`, `AzureOpenAIPlaceholder`, and `JiraPlaceholder` throw `IntegrationNotConfigured`. The API invokes `QuestionProvider` asynchronously with server-filtered evidence, then supplies its resolution to the workflow engine. The default demo provider delegates to curated resolution. `MASTERMIND_RETRIEVAL_PROVIDER=azure` fails closed with a configuration error; it does not activate the placeholder search and model classes. Implement a live question provider that composes search and answer services, wire it into the provider factory, and verify the entire flow. The engine still assigns simulated Jira keys directly, so real ticket creation requires additional wiring. The D1 repository is active and can be replaced behind its existing contract.

The starter also includes a generic Sites connector bridge. It is distinct from these product integration contracts and does not mean that Confluence, Teams, SharePoint, or Jira is connected.

## Recommended integration sequence

1. **Identity and source ingestion.** Replace selectable demo personas with verified employee identity and directory group membership. Implement Confluence and Microsoft Graph source adapters for the permitted Teams and SharePoint content. Add stable source IDs, URLs, versions, provenance, ACLs, deletion handling, and incremental synchronization; the current document contract needs extension for these fields.
2. **Azure AI Search.** Ingest and chunk approved source content, create embeddings, and implement hybrid retrieval behind `SearchProvider`. Apply identity and source ACL filters before passages reach the model. Selected teams limit relevance; they never grant access. Synchronize permission changes and deletions, including removal of revoked evidence from the index and caches.
3. **Azure OpenAI through Microsoft Foundry.** Implement `AnswerProvider` with evidence-only generation and validated citation IDs. Retrieve first; distinguish an actual missing answer from timeouts, permission failures, or incomplete ingestion. Do not automatically escalate provider outages as knowledge gaps.
4. **Jira.** Implement `TicketProvider` with per-team project and issue-type mappings, verified owners, scoped credentials, and durable idempotency. Commit the internal request and an outbox entry before ticket creation; process the outbox with the request ID as the idempotency key and store the returned key and URL. Never create external issues inside an optimistic database-save retry. Use retryable failure states without duplicate stories. Keep the application as the response interface until explicit bidirectional synchronization is designed.
5. **Azure Database for PostgreSQL.** Implement the existing repository interface with transactional compare-and-save semantics. Preserve revision checks and request idempotency. Plan migration of retained D1 data deliberately; a connection string does not migrate records. Decide whether to retain JSON workspace storage initially or normalize data when enterprise scale and tenancy require it.

Keep explicit demo/live selection on the server. Mark a connection active only after a health check and end-to-end verification succeed; never silently fall back to fictional answers while labeling them live. Moving hosting to Azure is separate from connecting Azure services to the current Sites deployment.

## Configuration and policy

Retrieval defaults to `MASTERMIND_RETRIEVAL_PROVIDER=demo`; selecting `azure` deliberately returns an unavailable-service error until that implementation exists. `.env.example` and `azureRequirements` describe the planned service variables:

- Search: `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_API_KEY`, `AZURE_SEARCH_INDEX`.
- Model: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`.
- Storage: `AZURE_POSTGRES_CONNECTION_STRING`.
- Jira: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`, `JIRA_ISSUE_TYPE_ID`.

These are configuration placeholders, not a complete provisioning specification. Embedding deployments, index schema, API versions, identity credentials, source consent scopes, and per-team Jira mappings must be added with the implemented adapters. Keep secrets in the server hosting environment or an approved secret store; do not expose them through client bundles, browser forms, logs, or committed files. Prefer workload identities where supported by the chosen hosting arrangement.

Define an explicit authority hierarchy before indexing real company knowledge: governing policies and current approved standards take precedence over informal conversations, and superseded documents cannot override their replacements. A team-approved answer must not override a governing policy. Surface unresolved conflicts for the owning team with provenance. Today the engine only recognizes a curated legacy-intake example; it does not implement a general authority or conflict engine.

Preserve source restrictions in derived answers. The demo uses fictional group checks and a fixed requesting/answering-team audience for approved answers. Production reuse must also preserve the effective source ACLs and revalidate access when permissions change. Source text must be treated as untrusted evidence, never as instructions to execute tools or change permissions.

## Student subscription and Foundry setup

The hackathon provides access to Foundry and an Azure for Students subscription. Provisioning remains deferred. The supplied local `foundry.pdf` walkthrough illustrates student sign-up, creating a Foundry resource and project, opening the Foundry portal, and testing a model in its playground. Its screenshots show an example deployment, not confirmed access for this project's account; do not copy the guide's sample account identifiers or assume its region/model is available.

Azure for Students currently offers eligible students $100 of credit usable within 12 months, defined free service allowances, and no credit-card requirement. This is not unlimited free access to every Azure product. Student credit cannot pay for Azure Marketplace offers. Verify the actual subscription balance and allowance before creating separately billed Search, model, or database resources. [Microsoft Azure for Students](https://azure.microsoft.com/en-us/free/students)

When integration work begins:

1. Confirm the intended subscription and whether organizers provide an existing Foundry resource/project. Prefer that supplied project when authorized; otherwise create a dedicated MasterMind resource group and Foundry project in a region permitted by the subscription.
2. Check deployment permissions, supported regions, and available quota for a small chat model and an embedding model. Record the actual deployment names and endpoints. Microsoft documents Cognitive Services Contributor or equivalent deployment permissions; partner/community models can require Marketplace subscriptions, whereas Azure OpenAI models sold by Azure do not. Prefer an available Azure-sold model for the student-credit path. [Foundry deployment guide](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/deploy-foundry-models)
3. Inspect the Foundry Quota page for the selected model and deployment type. Quota scope may be regional, Global, or Data Zone depending on the model; changing regions does not necessarily create more quota. Do not promise a particular model or capacity until the subscription permits it. [Foundry quotas and limits](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/quotas-limits)
4. Test a minimal playground request, then implement and test the server adapters described above using fictional data. Keep `MASTERMIND_RETRIEVAL_PROVIDER=demo` until the live provider and permission tests pass. Configure usage alerts and record resource cleanup steps; do not upgrade billing or purchase Marketplace offers automatically.

These public offer and deployment constraints were checked on October 12, 2026. Account-specific access, balance, permissions, and quota have not been inspected.

## Acceptance checks before enabling live mode

- A permitted question produces a supported answer with real, accessible source citations.
- Unauthorized and revoked source passages cannot appear in retrieval, generated text, citations, request context, or approved knowledge.
- Existing evidence avoids escalation; genuine gaps route only to a verified owner.
- Search/model outages stay visible as failures and create no spurious requests.
- Policy conflicts and superseded sources are resolved or escalated with provenance.
- Duplicate submissions and Jira retries produce one internal request and one external story.
- Team responses return to the origin; unapproved answers are excluded from shared retrieval.
- Concurrent database writes preserve actions, and migration/rollback restores the expected state.
- Infrastructure requests remain reviewable and do not provision resources.

Before exposing real enterprise data, replace demo session identity, establish tenant isolation and retention, and add integration-level authorization tests. Current regex redaction and unit-tested fictional permissions are useful demo behavior, not a production data-loss-prevention system.

## What the student team should prepare now

1. In https://ai.azure.com, open the hackathon project and deploy a chat model that your subscription actually permits. Name the deployment `mastermind-chat` (or record its existing exact name). Confirm one successful playground response. Do not upgrade billing to bypass a quota error; report the model, region and error instead.
2. From the deployment's code/endpoint view, record the Azure OpenAI resource base endpoint, deployed model name/version, exact deployment name and region. Do not substitute the Foundry project URL ending in `/api/projects/...` for the model inference endpoint.
3. Copy `.env.example` to a local ignored `.env.local` and fill `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, and `AZURE_OPENAI_API_KEY` privately, if key authentication is enabled. Keep `MASTERMIND_RETRIEVAL_PROVIDER=demo` until the adapter is implemented. Hosted credentials must be added separately as server-side hosting secrets. Do not send keys through chat or commit them. If the hackathon requires Entra-only access, provide the non-secret tenant/resource identifiers so workload authentication can be implemented instead.
4. For real retrieval, create Azure AI Search on Free tier if it is offered for your subscription. Record the service endpoint. The implementation will define and populate an ACL-aware index named `mastermind-knowledge`; do not create an arbitrary schema. A query key suffices for runtime queries; ingestion needs separate write authorization. The current planned variables are `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_INDEX`, and `AZURE_SEARCH_API_KEY`. Embedding deployment configuration will be added with vector retrieval.
5. Prepare a handful of fictional or approved sample documents and each document's owning team/access groups. Teams/SharePoint/Confluence ingestion also requires separate organizational authorization; a Foundry key does not grant those permissions.

Send only the endpoint, deployment name, model/version, region, authentication method, and whether the playground succeeded. Credentials alone do not activate this release: the live adapters still need implementation and verification. The mock Jira board requires no Jira credentials.

Official references: [Foundry model endpoints](https://learn.microsoft.com/en-us/azure/ai-studio/ai-services/concepts/endpoints), [create AI Search](https://learn.microsoft.com/en-us/azure/search/search-create-service-portal), [Search API keys](https://learn.microsoft.com/azure/search/search-security-api-keys).
