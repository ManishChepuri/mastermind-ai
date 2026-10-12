# MasterMind: quick website walkthrough

MasterMind helps employees on an existing project find answers across teams. Search existing knowledge first, ask the owning team when information is missing, and reuse approved answers later.

## Open the demo

- Live workspace: https://infranav-team-workspace.hello566104.chatgpt.site/
- Live mock Jira board: https://infranav-team-workspace.hello566104.chatgpt.site/?view=jira
- Local workspace when the server is running: http://localhost:5173/

Open workspace and board in two tabs or windows in the **same browser and on the same host**. They share a demo session and refresh every 2.5 seconds. Safari and Chrome have separate sessions. Use the menu button to open navigation on a narrow screen. The demo persona selector is at the bottom of navigation.

## The three-minute demo

### 1. Find an answer already documented — Alex

Choose **Alex Chen** and open **Fraud Scoring Service**. Under **Ask MasterMind**, ask:

> Why do we need test and production environments?

Open the cited **Environment tiers & release path** source. Explain: “We check permitted knowledge before interrupting another team.” No Jira story is needed.

### 2. Reveal a knowledge gap — Alex

Ask:

> What access does our VM need to read restricted transaction data?

The answer explains that the evidence is insufficient and sends the question to Security. A mock story (normally **DEMO-301** in a fresh session) is assigned to **Jordan Lee**. Open the **Jira board**: the story appears in **To do**. Click it to show the project context and supporting sources.

### 3. Respond as the owning team — Jordan

On the board, choose **Jordan Lee** using the persona selector. Open the story and click **Mark in review**. Close the dialog to show it in **In progress**.

Reopen it and enter this fictional demo response:

> Use a managed identity with least-privilege read access. Obtain Data Governance and Security approval, keep the VM on the approved private network, and enable access logging.

Check **Approve this answer for reuse**, then click **Send answer**. Close the dialog: the story moves to **Done**. Alex's workspace receives the response. These controls move the story; dragging cards is not implemented.

### 4. Reuse the answer — Priya

Choose **Priya Shah**, open the same project, and ask the exact restricted-data question again. MasterMind returns the approved answer without creating another story. Open **Insights** to show actual request and reuse counts.

## Other useful screens

| Screen or action | What to show |
| --- | --- |
| Projects → Connect a project | Connect existing work, select relevant teams, then share the personal draft with your team. MasterMind does not brainstorm or create project goals. |
| Workspace → Edit scope | Select the teams relevant to this project. Team selection does not grant document permissions. |
| Team inbox | Switch between incoming questions, waiting requests, and received answers. |
| Knowledge | Find and inspect permitted sources and approved answers. |
| Infrastructure request | Explain the need, fill resource/network/data fields, review, then submit to Platform. Nothing is provisioned automatically. |
| Connections | See which services are simulated or planned. |
| Demo guide | Open guided role-switching shortcuts. |

## Before presenting

- Use **Reset demo** in the footer and confirm **Start fresh demo** if you want a clean run. This starts a new session; previous records remain stored.
- Stay in one browser and use either the hosted URL or localhost consistently.
- Switch personas intentionally; each tab keeps its own persona, while requests are shared within that browser session.
- If a question is already pending, MasterMind links the same story instead of making a duplicate.
- For reliable rehearsal use the exact questions above in demo mode.

## Be accurate with judges

The current main release uses fictional documents, selectable demo identities, deterministic retrieval, and a simulated Jira board. The communication workflow and saved state work end to end. Azure Foundry and external Teams/Confluence/Jira integrations are not live.

The separate `codex/openai-backup` branch implements optional OpenAI-generated answers over the same permitted sample sources. It needs a private API key and live validation. See `docs/OPENAI_BACKUP.md` on that branch.

## Can this run on Vercel?

Yes, after a deployment adaptation. The present build uses Vinext/Vite with Cloudflare Worker bindings and D1. Importing this repository into Vercel unchanged is not a verified deployment path.

A straightforward migration is to use the standard Next.js build/runtime, replace the D1 repository with a server-accessible database adapter such as PostgreSQL while preserving revision checks, and configure provider secrets in Vercel. Then test persistence, permissions, and the full question-to-answer flow. This migration has not been performed.

Reference: https://vercel.com/docs/frameworks/full-stack/nextjs
