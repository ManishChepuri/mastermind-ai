# Using MasterMind throughout a project

MasterMind is the place employees return to when their existing project needs information or resources from another team. Start with a project, ask what is blocking your work, and follow the answer or request in the same workspace. The project itself and its delivery plan originate elsewhere.

This demo uses fictional people, project records, and policies. Source retrieval uses curated rules, Jira stories are simulated, and Azure services are not connected. Workflow changes are saved in the demo database.

This branch (`codex/impeccable-redesign`) presents the same workflow through a dark rail, ivory workspace, and a larger knowledge-network canvas. The original interface is preserved on `main`. The existing demo URL shows this alternative after publication. Pending handoff routes and answered nodes reflect stored request state.

## Your first visit

1. Keep **Alex Chen** selected in the sidebar's **Demo persona** selector. The **Fraud Scoring Service** is already connected and shared with Fraud Engineering, so you can start asking immediately.
2. Follow **How work moves here**: choose relevant teams, ask your question, and follow the answer. You can dismiss this guide and restore it from **Workflow & demo guide → Show workspace guidance**. Look at **Your team network**. This project selects Infrastructure Platform, Security Architecture, Network Engineering, Data Governance, and Observability. Use its settings control to adjust the relevant teams; selection never grants additional source access.
3. In **Ask MasterMind**, choose **Why do we need test and production environments?** Open the citation to see the source, owner, and freshness. Existing documentation answers this question without interrupting another team.
4. Ask **What access does our VM need to read restricted transaction data?** The available evidence cannot answer the required controls and approvals. A request goes to Security Architecture, carrying the project context and evidence already found.
5. Open the linked request or **Project requests** to follow its **Sent to team → Team review → Answer received** progress. The receiving team answers in **Team inbox → Incoming**. Its response returns to the originating project conversation and request; **Read latest answer** opens it directly.

For a different existing project, choose **Projects → Connect a project**, select a fictional project record. MasterMind opens its workspace and team-selection dialog immediately. Save the relevant teams, then choose **Share with team** when your team should use that workspace. This does not create a new project or ask you to brainstorm requirements.

## When employees use each part

| Moment in the project | Where to go | What to do next |
| --- | --- | --- |
| Joining existing work | Projects and the project workspace | Open the shared project, inspect context, and confirm the relevant teams. |
| A policy or integration question blocks work | Ask MasterMind | Ask the question; inspect cited evidence or follow the routed request. |
| Another team needs your expertise | Team inbox → Incoming | Review context, mark the request in review if needed, and answer it. |
| Your team is waiting on a response | Team inbox → Waiting for answers, or Project requests | Follow the existing request instead of sending a duplicate. |
| The project needs an environment | Infrastructure request | Complete missing details, review the structured request, and submit it to Platform. |
| A colleague asks the same resolved question | Ask MasterMind or Knowledge | Reuse an approved answer within its permitted audience. |
| Reviewing collaboration activity | Insights | Inspect request volume, outstanding requests, answer reuse, and measured response times. |

Repeat this cycle during development, testing, and release work. MasterMind records questions and handoffs; it does not advance project stages, execute delivery tasks, or provision infrastructure. The answering team decides whether its response can become reusable knowledge. In this demo that audience is fixed to the requesting and answering teams.

## Three minute presentation

Use one browser and a fresh demo. **Workflow & demo guide** opens **How to use MasterMind**, with Alex, Jordan, and Priya shortcuts for this sequence. The Alex and Priya shortcuts prefill the question; send it to perform the step. Shortcuts preserve existing work. Keep the short sample response below ready to paste. Close any open dialog before changing personas through the sidebar. Persona switching lets one presenter show both sides of collaboration; it is not employee authentication.

| Time | Action | Point to explain |
| --- | --- | --- |
| 0:00–0:20 | Open Fraud Scoring Service as Alex. Show its five selected teams. | “The project already exists. This workspace connects the team to the information it needs.” |
| 0:20–0:45 | Ask **Why do we need test and production environments?** Open its citation. | “We check permitted knowledge first. This answer requires no request.” |
| 0:45–1:15 | Ask **What access does our VM need to read restricted transaction data?** Open the generated request. | “Missing detail becomes a focused question for Security, with context and a simulated Jira story.” |
| 1:15–2:00 | Switch to Jordan Lee. Open **Team inbox → Incoming**, paste the response, check **Approve this answer for reuse**, and send. | “The owning team answers here. Approval makes the response reusable within the allowed audience.” |
| 2:00–2:35 | Switch to Priya Shah, open Fraud Scoring Service, and ask the exact same access question. | “A colleague now gets the approved answer immediately. No second request is created.” |
| 2:35–3:00 | Open **Insights**. | “These are the questions, requests, response time, and reuse events we just generated.” |

Fictional Security response:

> Use a private connection and a workload identity scoped to the approved dataset. Security Architecture and the data owner must approve restricted transaction access. Use synthetic records in development until approval is complete.

For a longer demonstration, send Jordan's response without approving reuse first. Show that the response reaches the project, then choose **Approve for knowledge reuse** in the answered request before switching to Priya. This makes the separate response and knowledge-approval decisions explicit.

## Infrastructure request extension

As Alex or Priya, open **Infrastructure request** from the project. Review the suggested development baseline: Ubuntu Linux, 2 CPU cores, 8 GB memory, and 50 GB storage. Keep or edit the business purpose and choose **Development isolated** and **internal** for a synthetic-data example.

Choose **Review request**, inspect every field, then **Submit to Platform**. Switch to **Maya Okafor** and open **Team inbox** to review, mark in review, or answer the request. Platform receives a structured request with context; nothing is provisioned automatically. If the employee is uncertain about a policy or approval, they can ask MasterMind before submitting.

## Demo checks and limits

- Ask the same unanswered question twice: the second question links to the existing open request.
- In a fresh demo, remove Security Architecture from the selected teams before asking the access question: the app asks to expand team selection before routing there.
- Ask an unknown topic such as **What is the future of everything?** The app asks for clarification and sends no request to an invented owner.
- **Connections** clearly distinguishes fictional source data, simulated Jira actions, and disconnected Azure services. Adding keys alone does not enable the unimplemented integrations.
- Reloading preserves the workspace. Separate browsers/private sessions receive separate workspaces; use persona switching within one browser for the full handoff.
- **Reset demo** starts a fresh browser session with the original project. It retains previous database records rather than deleting them.

Use the supported example questions for the presentation. General language understanding, real source ingestion, source ACL synchronization, and live Jira integration remain future work in the [Azure handoff](AZURE_HANDOFF.md).

## Live mock Jira handoff

1. Keep the workspace in one browser tab and open `/?view=jira` in another tab in the same browser. The board refreshes every 2.5 seconds.
2. As Alex, ask: “What access does our VM need to read restricted transaction data?”
3. Chat explains missing evidence and automatically creates DEMO-301 assigned to Jordan Lee on Security. Show the story appear in To do on the board.
4. Switch the board's demo persona to Jordan Lee. Open the story, choose Mark in review, close it: the card moves to In progress.
5. Open it again, supply an answer, optionally approve reuse, and send. Close the dialog: the card moves to Done and Alex receives the answer.
6. Ask the same question as Priya after approval: the existing answer is reused without another story.

The board is explicitly simulated and shares durable request state with MasterMind. No external Jira account is needed. Current release is pushed directly to main; codex/impeccable-redesign retains the redesign branch. Original design remains available at commit 7f76e97.
