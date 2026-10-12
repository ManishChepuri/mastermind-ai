import { documents, teams, people, externalProjects } from './data';
import { z } from 'zod';
import type { Action, Knowledge, Person, Project, TeamId, Workspace } from './types';
export const clean = (text:string) => text.replace(/\b(password|api[_ -]?key|token|secret)\s*[:=]\s*[^\s,;]+/gi,'$1 = [redacted]').replace(/\b\d{3}-\d{2}-\d{4}\b/g,'[redacted]').replace(/\b(?:\d[ -]*?){13,19}\b/g,'[redacted]');
export const normalized = (q:string) => q.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
// The demo classifier recognizes only explicit infrastructure terms. Word boundaries
// matter: "contest", "gold" and "regional sales" are not infrastructure evidence.
export function topicOf(q:string):string {
 const s=normalized(q);
 if(/\b(restricted|transaction)\b.*\b(access|read|approval|approvals|connect|connection)\b|\b(access|read|approval|approvals|connect|connection)\b.*\b(restricted|transaction)\b/.test(s)) return 'restricted-access';
 if(/\bregions?\b/.test(s))return 'regions';
 if(/\b(monitoring|monitor|alerts?|observability|latency|dashboards?)\b/.test(s))return 'monitoring';
 if(/\b(intake|legacy infrastructure|old infrastructure)\b|\b(old|legacy)\b.*\b(email|form|process)\b/.test(s))return 'intake';
 if(/\b(terraform|modules?|iac|infrastructure as code)\b/.test(s))return 'modules';
 if(/\b(classification|classify|confidential)\b/.test(s))return 'classification';
 if(/\bretention\b|\bdelete\b.*\b(data|datasets?|records?)\b/.test(s))return 'retention';
 if(/\b(secrets?|passwords?|credentials?|key vault)\b/.test(s))return 'secrets';
 if(/\b(naming|tags?|tagging)\b/.test(s))return 'tags';
 if(/\benvironments?\b|\b(test|prod|production|staging|development)\b.*\b(test|prod|production|staging|development|tiers?|deployment|workloads?)\b/.test(s))return 'environment';
 if(/\b(vms?|virtual machines?|provision|provisioning|compute)\b/.test(s))return 'vm';
 if(/\b(network|firewall|zones?|vnet|connectivity)\b/.test(s))return 'network';
 if(/\b(pipeline|release)\b/.test(s))return 'release';
 return s;
}
// Approval applies to this answer to this question, not every question in its topic.
// Semantic equivalence belongs in a future verified retrieval adapter.
const sameQuestion=(left:string,right:string)=>normalized(left)===normalized(right);
const actionSchema=z.object({
 action:z.enum(['connect','reply','approve','review','retry-jira','teams','share','ask','infra','reset']),
 actionId:z.string().uuid(), userId:z.string().min(1).max(100),
 projectId:z.string().min(1).max(100).optional(), requestId:z.string().min(1).max(100).optional(),
 externalId:z.string().min(1).max(100).optional(), question:z.string().max(2000).optional(),
 answer:z.string().max(6000).optional(), approve:z.boolean().optional(), shared:z.boolean().optional(),
 teamIds:z.array(z.enum(['fraud','platform','security','network','data','observability','analytics'])).max(7).optional(),
 payload:z.record(z.string().max(100),z.string().max(2000)).optional(),
});
export function parseAction(value:unknown):Action {
 const result=actionSchema.safeParse(value);
 if(!result.success)throw new Error('Invalid workspace action. Check the submitted fields and try again.');
 return result.data;
}
export function ownerFor(q:string):TeamId|undefined {
 const topic=topicOf(q);
 if(['restricted-access','secrets'].includes(topic))return 'security';
 if(['regions','network'].includes(topic))return 'network';
 if(['classification','retention'].includes(topic))return 'data';
 if(topic==='monitoring')return 'observability';
 if(['environment','intake','modules','tags','vm'].includes(topic))return 'platform';
 if(topic==='release')return 'fraud';
 return undefined;
}
export function hasAccess(doc:Knowledge,person:Person){return doc.groups.some(g=>person.groups.includes(g));}
export function canSeeProject(p:Project,person:Person){return p.creatorId===person.id || (p.shared && p.ownerTeam===person.team);}
export function eligibleKnowledge(state:Workspace,person:Person,project:Project){
 return [...documents,...state.knowledge.filter(k=>k.approved)].filter(d=>hasAccess(d,person)&&(project.selectedTeams.includes(d.team)||d.team===project.ownerTeam||['classification','tags'].includes(d.id)));
}
const topicDocs:Record<string,string[]> = {environment:['env'],intake:['vm','old-intake'],modules:['modules'],classification:['classification'],retention:['retention'],secrets:['secrets'],tags:['tags'],vm:['vm'],network:['network'],monitoring:['monitoring'],release:['teams-release'],regions:['regions']};
export type Resolution = {text:string; citations:string[]; outcome:'answer'|'gap'|'scope'|'routing'; suggestedTeam?:TeamId; searchedCount:number; reused?:boolean};
export function resolveQuestion(state:Workspace,person:Person,project:Project,question:string):Resolution {
 return resolvePermittedQuestion(project,question,eligibleKnowledge(state,person,project));
}
export function resolvePermittedQuestion(project:Project,question:string,allowed:Knowledge[]):Resolution {
 const topic=topicOf(question), owner=ownerFor(question);
 const kb=allowed.find(d=>d.approved && d.status==='current' && sameQuestion(d.title,question));
 if(kb)return {text:clean(kb.content),citations:[kb.id],outcome:'answer',searchedCount:allowed.length,reused:true};
 if(owner && !project.selectedTeams.includes(owner)&&owner!==project.ownerTeam && !['classification','tags'].includes(topic))return {text:`${teams.find(t=>t.id===owner)?.name} owns this topic and is outside this project's selected teams. Add that team to the project to search its permitted sources and route this question if needed.`,citations:[],outcome:'scope',suggestedTeam:owner,searchedCount:allowed.length};
 const selected=(topicDocs[topic]??[]).map(id=>allowed.find(d=>d.id===id)).filter(Boolean) as Knowledge[];
 // A general guide cannot establish a specific threshold, schedule, price or address.
 // Keep its evidence attached while asking the owning team for the missing detail.
 const needsSpecificDetail=/\b(exact|specific|ip address|cidr|port number|how much|cost|price|budget|sla|slo|thresholds?|how many days|how long|retention period|deadline|when will|which version|what version)\b/.test(normalized(question));
 if(selected.length && needsSpecificDetail && owner && !project.selectedTeams.includes(owner) && owner!==project.ownerTeam)return {text:`The shared guide does not verify the specific detail you requested. Add ${teams.find(t=>t.id===owner)?.name} to this project to request clarification.`,citations:selected.filter(d=>d.status==='current').map(d=>d.id),outcome:'scope',suggestedTeam:owner,searchedCount:allowed.length};
 if(selected.length && needsSpecificDetail && owner)return {text:`I found related guidance, but it does not verify the specific detail you requested. I've sent the question to ${teams.find(t=>t.id===owner)?.name} for clarification.`,citations:selected.filter(d=>d.status==='current').map(d=>d.id),outcome:'gap',suggestedTeam:owner,searchedCount:allowed.length};
 if(selected.length){
  const text=topic==='intake'?'The old email intake is retired. Use the current VM provisioning guide and the infrastructure request builder. '+selected.filter(d=>d.status==='current').map(d=>d.content).join('\n\n'):selected.map(d=>d.content).join('\n\n');
  return {text:clean(text),citations:selected.map(d=>d.id),outcome:'answer',searchedCount:allowed.length};
 }
 if(topic==='restricted-access')return {text:'The permitted sources do not establish the access controls or approvals required for this request. I have sent the unanswered question to Security Architecture with the project context.',citations:allowed.filter(d=>['network','classification'].includes(d.id)).map(d=>d.id),outcome:'gap',suggestedTeam:'security',searchedCount:allowed.length};
 if(owner)return {text:`I couldn't find an adequate answer in this project's permitted sources. I've requested clarification from ${teams.find(t=>t.id===owner)?.name}.`,citations:[],outcome:'gap',suggestedTeam:owner,searchedCount:allowed.length};
 return {text:'I could not verify an answer or identify the responsible team from the available sources. Please clarify the system or topic—for example, network connectivity, data retention, or VM provisioning. No request has been sent.',citations:[],outcome:'routing',searchedCount:allowed.length};
}
const uid=()=>crypto.randomUUID();
const now=()=>new Date().toISOString();
function event(s:Workspace,type:Workspace['events'][number]['type'],person:Person,projectId:string,requestId?:string){s.events.push({id:uid(),type,at:now(),userId:person.id,projectId,requestId});}
export function applyAction(s:Workspace,input:Action,providedResolution?:Resolution):Workspace {
 const a=parseAction(input);
 const person=people.find(p=>p.id===a.userId);if(!person)throw new Error('Choose a valid demo persona.');
 if(s.processed.includes(a.actionId))return s;
 if(a.action==='connect'){
  const ext=externalProjects.find(p=>p.externalId===a.externalId);if(!ext)throw new Error('Select an existing project.');
  const existing=s.projects.find(p=>p.externalId===ext.externalId && canSeeProject(p,person));
  if(!existing)s.projects.push({...ext,ownerTeam:person.team,id:uid(),selectedTeams:[...ext.selectedTeams],creatorId:person.id,shared:false,connectedAt:now()});
 }else if(['reply','approve','review'].includes(a.action)){
  const r=s.requests.find(r=>r.id===a.requestId);if(!r || r.toTeam!==person.team)throw new Error('Only the receiving team can update this request.');
  if(a.action==='review'){if(r.status==='answered')throw new Error('This request is already answered.');r.status='in_review';}
  else {
   if(a.action==='reply'){
    if(r.status==='answered')throw new Error('This request already has a response.');
    if(!a.answer?.trim()||a.answer.length>6000)throw new Error('Enter a response between 1 and 6,000 characters.');
    r.answer=clean(a.answer.trim());r.answeredAt=now();r.responderId=person.id;r.status='answered';event(s,'request_answered',person,r.projectId,r.id);
    s.messages.push({id:uid(),projectId:r.projectId,userId:r.fromUser,role:'assistant',text:`${person.name} · ${teams.find(t=>t.id===person.team)?.name}\n\n${r.answer}`,time:now(),requestId:r.id});
   }
   if((a.approve || a.action==='approve')&&r.kind==='question'&&!r.approved){
    if(!r.answer)throw new Error('Answer the question before approving reuse.');
    r.approved=true;s.knowledge.push({id:`kb-${r.id}`,title:r.title,team:r.toTeam,source:'Approved team answer',content:r.answer,keywords:[topicOf(r.title)],groups:[...r.audience],updatedAt:now().slice(0,10),status:'current',approved:true,requestId:r.id});event(s,'knowledge_approved',person,r.projectId,r.id);
   }
  }
 }else if(a.action==='retry-jira'){
  const r=s.requests.find(r=>r.id===a.requestId);if(!r||![r.toTeam,r.fromTeam].includes(person.team))throw new Error('Request unavailable.');
  r.jiraStatus='simulated';
 }else{
  const project=s.projects.find(p=>p.id===a.projectId);if(!project||!canSeeProject(project,person))throw new Error('This project is not available to this persona.');
  if(a.action==='teams'){
   if(!a.teamIds?.length||a.teamIds.some(id=>!teams.some(t=>t.id===id)))throw new Error('Select at least one valid team.');project.selectedTeams=[...new Set(a.teamIds)];
  }else if(a.action==='share')project.shared=true;
  else if(a.action==='ask'){
   if(!a.question?.trim()||a.question.length>2000)throw new Error('Enter a question between 1 and 2,000 characters.');
   const question=clean(a.question.trim());const resolution={...(providedResolution??resolveQuestion(s,person,project,question))};
   resolution.text=clean(resolution.text);
   if(resolution.outcome==='answer'&&!resolution.citations.length)throw new Error('The answer could not be verified against a permitted source. Please retry.');
   const permittedIds=new Set(eligibleKnowledge(s,person,project).map(d=>d.id));
   if(resolution.citations.some(id=>!permittedIds.has(id)))throw new Error('The answer included an unavailable source. Please retry.');
   if(resolution.outcome==='gap'&&(!resolution.suggestedTeam||!teams.some(t=>t.id===resolution.suggestedTeam)))throw new Error('The responsible team could not be verified. Please clarify the question.');
   if(resolution.suggestedTeam&&resolution.outcome==='gap'&&!project.selectedTeams.includes(resolution.suggestedTeam)&&resolution.suggestedTeam!==project.ownerTeam)throw new Error('Add the responsible team to the project before requesting information.');
   s.messages.push({id:uid(),projectId:project.id,userId:person.id,role:'user',text:question,time:now()});event(s,'question',person,project.id);
   let requestId:string|undefined;
   if(resolution.outcome==='gap'&&resolution.suggestedTeam){
    const existing=s.requests.find(r=>r.projectId===project.id&&r.toTeam===resolution.suggestedTeam&&r.kind==='question'&&r.status!=='answered'&&sameQuestion(r.title,question));
    if(existing){requestId=existing.id;resolution.text='This question is already with '+teams.find(t=>t.id===existing.toTeam)?.name+'. I have linked the existing request and mock Jira story '+existing.jiraKey+'; no duplicate was created.';}
    else {
     requestId=`REQ-${String(s.requests.length+101).padStart(3,'0')}`;
     const assignee=people.find(p=>p.team===resolution.suggestedTeam);
     const jiraKey=`DEMO-${s.requests.length+301}`;
     resolution.text+=` A mock Jira story, ${jiraKey}, was created automatically on the ${teams.find(t=>t.id===resolution.suggestedTeam)?.name} board${assignee?` and assigned to ${assignee.name}`:''}.`;
     s.requests.push({id:requestId,projectId:project.id,fromUser:person.id,fromTeam:person.team,toTeam:resolution.suggestedTeam,kind:'question',title:question,context:project.description+'\n\nEvidence reviewed: '+(resolution.citations.map(id=>documents.find(d=>d.id===id)?.title).join(', ')||'No adequate permitted evidence found.'),status:'open',createdAt:now(),approved:false,assigneeId:assignee?.id,jiraKey,jiraStatus:'simulated',audience:[person.team,resolution.suggestedTeam],citations:resolution.citations});event(s,'request_created',person,project.id,requestId);
    }
   }else if(resolution.outcome==='answer'){event(s,'answer_found',person,project.id);if(resolution.reused)event(s,'knowledge_reused',person,project.id);}
   s.messages.push({id:uid(),projectId:project.id,userId:person.id,role:'assistant',time:now(),...resolution,requestId});
  }else if(a.action==='infra'){
   const p=a.payload??{};const required=['purpose','environment','os','cpu','memory','storage','network','classification'];
   if(required.some(k=>!p[k]?.trim()))throw new Error('Complete all required infrastructure request fields.');
   if(!['development','test','staging','production'].includes(p.environment)||!['public','internal','confidential','restricted'].includes(p.classification))throw new Error('Choose a valid environment and data classification.');
   for(const k of ['cpu','memory','storage'])if(!Number.isFinite(Number(p[k]))||Number(p[k])<=0||Number(p[k])>100000)throw new Error('Resource sizes must be positive, reasonable numbers.');
   if(Object.values(p).some(v=>v.length>2000))throw new Error('Request fields must be under 2,000 characters.');
   const id=`REQ-${s.requests.length+101}`;
   s.requests.push({id,projectId:project.id,fromUser:person.id,fromTeam:person.team,toTeam:'platform',kind:'infrastructure',title:`${project.name} · ${p.environment} environment`,context:clean(p.purpose),status:'open',createdAt:now(),approved:false,jiraKey:`DEMO-${s.requests.length+301}`,jiraStatus:'simulated',audience:[person.team,'platform'],citations:['vm'],payload:Object.fromEntries(Object.entries(p).map(([k,v])=>[k,clean(v)]))});event(s,'infra_submitted',person,project.id,id);
  }else throw new Error('Unknown workspace action.');
 }
 s.processed=[...s.processed,a.actionId].slice(-500);return s;
}
export function visibleState(s:Workspace,p:Person){
 const projects=s.projects.filter(project=>canSeeProject(project,p));const ids=new Set(projects.map(x=>x.id));
 const requests=s.requests.filter(r=>r.toTeam===p.team||ids.has(r.projectId));
 const relevantIds=new Set(requests.map(r=>r.projectId));
 return {...s,projects,requests,messages:s.messages.filter(m=>ids.has(m.projectId)),knowledge:s.knowledge.filter(k=>hasAccess(k,p)),events:s.events.filter(e=>ids.has(e.projectId)||requests.some(r=>r.id===e.requestId)),processed:[],requestProjects:s.projects.filter(pr=>relevantIds.has(pr.id)).map(pr=>({id:pr.id,name:pr.name})),documents:documents.filter(d=>hasAccess(d,p)).map(d=>({...d,content:clean(d.content)}))};
}
