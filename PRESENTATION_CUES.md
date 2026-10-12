# MasterMind: slide-by-slide click cues

Matched against the supplied 10-slide PDF and speaking script. The PDF filename says MasterRoute, but all visible slides correctly say MasterMind. Use main/demo mode for predictable rehearsal; the optional OpenAI branch can produce different wording.

## Before the presentation

1. Open the live workspace in your presenting browser. Choose Reset demo → Start fresh demo once, before rehearsal. This seeds the updated project context and clears prior approvals from the active session.
2. Confirm Alex Chen is selected, Fraud Scoring Service is open, and the five relevant teams include Security Architecture.
3. Open the mock Jira board in a second tab in the same browser and on the same host: `/?view=jira`. Keep it visible in a second window if your display allows. Requests refresh every 2.5 seconds. Each tab remembers its own persona.
4. Keep this exact question copied: **What access does our VM need to read restricted transaction data?**
5. Do not pre-answer or approve it before the live sequence. That would correctly bypass the new-ticket demonstration.

## Click alongside the presenters

| Slide / script time | What you show and click |
| --- | --- |
| 1 · 0:00–0:15 | Workspace with MasterMind branding. No clicks needed. |
| 2 · 0:15–0:45 | Show Alex Chen in the persona selector and the Fraud Scoring Service title. The subtitle describes connecting an environment to restricted transaction data. |
| 3 · 0:45–1:10 | Keep the project visible; the knowledge network shows the relevant teams. Do not demonstrate deployment: MasterMind does not provision anything. |
| 4 · 1:10–1:40 | Let the interview quotes carry the story. Avoid unrelated clicks. |
| 5 · 1:40–2:00 | Click the project question box and paste the exact restricted-data question, but wait to send until slide 6. |
| 6 · 2:00–2:50 | Send as Alex. Show the explanation of missing evidence, Security ownership and mock Jira key. Switch to the board tab: the story appears in To do. Choose Jordan Lee, open the story, click **Use presentation sample answer**, check **Approve this answer for reuse**, then **Send answer**. Close the dialog: Done. Back in the project tab, switch to Priya Shah and ask the exact question. Show the approved answer citation and unchanged story count. |
| 7 · 2:50–3:30 | Open the approved source to show owner, date and approval. Optionally open Connections to show Confluence, SharePoint, Teams and Azure statuses while the speaker distinguishes prototype from production. |
| 8 · 3:30–4:05 | Keep the approved answer visible. The research numbers belong to the slides; the app does not claim those as measured savings. |
| 9 · 4:05–4:25 | Open Insights: one routed request and one reused answer, plus actual session activity. Counts will differ if you rehearsed without resetting. |
| 10 · 4:25–4:50 | Return to the project workspace and leave the approved answer visible for the close. Stop clicking during the final sentence. |

Slide 6 is a busy 50 seconds: rehearse it with the presenters. Mark in review is optional for that short sequence; sending the answer moves directly to Done. To show all three board columns, mark in review and close/reopen the story before answering, allowing extra time.

## The documented-answer branch

The exact restricted-data question intentionally has no complete source at the start. It first becomes answerable after Jordan approves his response. Priya's reuse therefore demonstrates the documented branch for the same question.

If you want a citation before the handoff, use the separate question “Why do we need test and production environments?” and open **Environment tiers & release path**. Do not present it as the answer to restricted-data access. It adds time and is optional.

## Alignment and wording notes

| Presentation detail | Application / suggested wording |
| --- | --- |
| Alex Chen, software engineer, Fraud Scoring Service | Already matches. Updated project context explicitly describes the restricted-data need and Security approval. |
| Jordan in Security, Priya on Alex's team | Already matches Jordan Lee / Security Architecture and Priya Shah / Fraud Engineering. |
| Source, owner and freshness | Open a citation: the detail dialog shows source, owning team, status and updated date. |
| “Every question gets a cited answer or reaches the team that owns it” | Too absolute: unknown owners ask for clarification, and teams outside scope must be added. Say **“Find cited answers or route knowledge gaps to verified owning teams.”** |
| “Anything it can't answer becomes a Jira story” | Say **“When evidence is missing and the owner is verified, it creates a story.”** Provider errors must not become stories. |
| “Current, approved sources” | The library distinguishes current docs, team-approved answers, informal Teams context and superseded documents. Say **“Cited guidance with source status, ownership and approval visible.”** Current status alone does not mean formally approved. |
| Reads Confluence, SharePoint and Teams | The prototype uses fictional examples of these sources. Keep the slide 7 disclosure; say **“The production design connects to these tools; our prototype uses sample records.”** |
| “Next week” Priya asks | A narrative time jump. In the demo you switch personas immediately; no timestamps are fabricated. |
| “Everyone after” / reusable knowledge | Reuse remains permission-scoped. Say **“Authorized teammates can reuse the approved answer.”** |
| Days saved, 12.8×, 30%, 61% | Research/business rationale, not measured MasterMind outcomes. Original research references and interview quotations have not been independently verified in this application alignment review. |
| Production “maps directly onto Azure” | Adapter contracts exist, but live ingestion, identity, retrieval and service wiring still require implementation. Say **“Our planned production architecture uses…”** |

The older project specification appended to the speaking script includes onboarding and broader planning concepts. Those are not in this demo and do not change the agreed existing-project communication scope.

## Prepared Jordan answer

The sample-answer button only fills the editable reply. It does not send, approve, create knowledge, provision a VM or grant data access. It describes a fictional managed-identity, least-privilege, private-network and approval workflow. The presenter still clicks the reuse checkbox and Send answer.
