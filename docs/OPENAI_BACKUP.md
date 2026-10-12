# Direct OpenAI backup

Branch: `codex/openai-backup`. This is an isolated alternative to `main`; it does not require Azure Foundry, Azure AI Search, or Azure credentials. The current deployment and port 5173 remain unchanged.

## Enable locally

1. Create an OpenAI API project key with access to Responses and your selected model. API access/billing is separate from a ChatGPT subscription. Never paste the key into chat, browser settings, or committed files.
2. In this checkout, copy `.env.example` to `.env.local` if it does not exist. Set:

```dotenv
MASTERMIND_RETRIEVAL_PROVIDER=openai
OPENAI_API_KEY=your-private-api-key
OPENAI_MODEL=gpt-4.1-mini
```

Use a model available to your API account that supports Responses structured outputs; the model is configurable. Restart the local server after changing `.env.local`. The development launcher reads that file server-side.

3. Install dependencies with the existing project installation instructions, initialize the local database, and run `npm run dev -- --port 5175`. Open http://localhost:5175 and http://localhost:5175/?view=jira in the same browser.
4. Ask “Why do we need test and production environments?” and inspect the cited source. Ask the restricted-data question and verify missing evidence routes to Security with one mock Jira story. Switch to Jordan, answer and approve reuse, then ask as Priya.
5. To return to deterministic rehearsal, set `MASTERMIND_RETRIEVAL_PROVIDER=demo` and restart. There is no silent fallback on model failure.

## Implemented behavior

The server passes only permitted current documents to the OpenAI Responses API. For this small demo corpus, it supplies the full permitted evidence rather than using an external vector database. It requests structured output, validates citation IDs and exact supporting quotes, and rejects malformed, incomplete, refused or ungrounded responses. Source text is treated as untrusted evidence. This validates provenance, not the semantic truth of every generated claim; evaluate live behavior before relying on it.

Missing evidence routes through the existing server owner map, selected-team checks and idempotent request/Jira workflow. The model cannot choose arbitrary recipients or execute external actions. Unknown ownership asks for clarification. API outages, authentication problems and rate limits create no team requests. Exact approved-answer reuse avoids another model call. The request uses `store:false`; that is not a claim of zero retention under every API policy.

The API key stays server-side. An evidence-size limit, output-token cap and 25-second timeout bound individual requests; these are not an account-wide spending cap. Concurrent database conflicts can cause an additional model call before a successful save. Configure usage limits in your OpenAI project.

## What remains simulated

Documents and selectable employee identities are fictional. Teams, SharePoint and Confluence ingestion is not connected. Jira remains the in-app mock board. Storage is still the existing D1 implementation. Real enterprise identity, source ACL synchronization, ingestion, general semantic owner resolution and external Jira are separate work.

No real API call is considered verified until a private key is supplied and an end-to-end test succeeds. Automated provider tests use mocked API responses and consume no credits.

## Hosting

Do not deploy this branch over the current demo just to try it. Test locally first. Hosted use requires server-side `MASTERMIND_RETRIEVAL_PROVIDER`, `OPENAI_API_KEY`, and `OPENAI_MODEL` secrets/configuration; a local `.env.local` is not uploaded. The existing `.openai/hosting.json` points to the shared production site, so publishing would replace that site.

## Official API references

- [Responses structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [GPT-4.1 mini capabilities](https://developers.openai.com/api/docs/models/gpt-4.1-mini)
