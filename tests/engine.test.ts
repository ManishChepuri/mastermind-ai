import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, clean, eligibleKnowledge, parseAction, resolveQuestion, topicOf, visibleState } from '../lib/engine';
import { seedWorkspace, people } from '../lib/data';
import type { Action } from '../lib/types';
import { getQuestionProvider, ProviderConfigurationError } from '../lib/providers';
const action=(overrides:Partial<Action>):Action=>({action:'ask',actionId:crypto.randomUUID(),userId:'alex',projectId:'fraud-scoring',...overrides});
const question='What access does our VM need to read restricted transaction data?';
test('existing evidence answers without a request',()=>{const s=applyAction(seedWorkspace(),action({question:'Why do we need test and production environments?'}));assert.equal(s.requests.length,0);assert.deepEqual(s.messages.at(-1)?.citations,['env']);});
test('missing evidence automatically routes and creates a simulated ticket',()=>{const s=applyAction(seedWorkspace(),action({question}));assert.equal(s.requests.length,1);assert.equal(s.requests[0].toTeam,'security');assert.equal(s.requests[0].jiraKey,'DEMO-301');assert.equal(s.requests[0].jiraStatus,'simulated');});
test('duplicates reuse the open request and retries are idempotent',()=>{let s=seedWorkspace();const a=action({question});applyAction(s,a);applyAction(s,a);assert.equal(s.messages.length,2);applyAction(s,action({question}));assert.equal(s.requests.length,1);assert.equal(s.messages.length,4);});
test('approval gates shared knowledge and reuse prevents another ticket',()=>{const s=applyAction(seedWorkspace(),action({question}));const r=s.requests[0];applyAction(s,action({action:'reply',userId:'jordan',requestId:r.id,answer:'Use a private connection and obtain Security approval.'}));assert.equal(s.knowledge.length,0);applyAction(s,action({action:'approve',userId:'jordan',requestId:r.id}));assert.equal(s.knowledge.length,1);applyAction(s,action({userId:'priya',question}));assert.equal(s.requests.length,1);assert.equal(s.events.filter(e=>e.type==='knowledge_reused').length,1);assert.deepEqual(s.messages.at(-1)?.citations,[`kb-${r.id}`]);});
test('only owning team can answer or approve and responses cannot be overwritten',()=>{const s=applyAction(seedWorkspace(),action({question}));const r=s.requests[0];assert.throws(()=>applyAction(s,action({action:'reply',requestId:r.id,answer:'not authorized'})),/receiving team/);applyAction(s,action({action:'reply',userId:'jordan',requestId:r.id,answer:'approved response'}));assert.throws(()=>applyAction(s,action({action:'reply',userId:'jordan',requestId:r.id,answer:'overwrite'})),/already has/);});
test('permission filtering excludes restricted evidence and redacts planted secrets',()=>{const s=seedWorkspace();const alex=people[0],project=s.projects[0];assert(!eligibleKnowledge(s,alex,project).some(x=>x.id==='regions'));assert(!JSON.stringify(visibleState(s,alex)).includes('RESTRICTED_DEMO_CANARY'));assert(!JSON.stringify(visibleState(s,alex)).includes('Hunter2Example'));const res=resolveQuestion(s,alex,project,'Which regions are approved?');assert.equal(res.outcome,'gap');assert.deepEqual(res.citations,[]);assert.equal(clean('password = abc123'),'password = [redacted]');});
test('out-of-scope teams require expansion before routing',()=>{const s=seedWorkspace();s.projects[0].selectedTeams=['platform'];applyAction(s,action({question}));assert.equal(s.requests.length,0);assert.equal(s.messages.at(-1)?.outcome,'scope');applyAction(s,action({action:'teams',teamIds:['platform','security']}));applyAction(s,action({question}));assert.equal(s.requests.length,1);});
test('unknown ownership asks for clarification without inventing routing',()=>{const s=applyAction(seedWorkspace(),action({question:'What is the future of everything?'}));assert.equal(s.requests.length,0);assert.equal(s.messages.at(-1)?.outcome,'routing');});
test('infrastructure requires fields and is submitted to platform',()=>{const s=seedWorkspace();assert.throws(()=>applyAction(s,action({action:'infra',payload:{purpose:'testing'}})),/required/);applyAction(s,action({action:'infra',payload:{purpose:'test service',environment:'development',os:'Ubuntu',cpu:'2',memory:'8',storage:'50',network:'dev',classification:'internal'}}));assert.equal(s.requests[0].toTeam,'platform');assert.equal(s.requests[0].kind,'infrastructure');assert.equal(s.events[0].type,'infra_submitted');});
test('personal drafts are private until shared and answers keep their audience',()=>{const s=seedWorkspace();applyAction(s,action({action:'connect',externalId:'PAY-118'}));assert.equal(visibleState(s,people.find(p=>p.id==='priya')!).projects.length,1);const draft=s.projects[1];applyAction(s,action({action:'share',projectId:draft.id}));assert.equal(visibleState(s,people.find(p=>p.id==='priya')!).projects.length,2);applyAction(s,action({question}));const r=s.requests[0];applyAction(s,action({action:'reply',userId:'jordan',requestId:r.id,answer:'Private audience answer',approve:true}));assert(!visibleState(s,people.find(p=>p.id==='sam')!).knowledge.length);});

test('unrelated words do not match infrastructure topic fragments',()=>{
 for(const question of ['Who won the contest?', 'What is the gold price?', 'Who produces this product?', 'Are old shoes recyclable?', 'What are the regional sales figures?']){
  const s=applyAction(seedWorkspace(),action({question}));
  assert.equal(s.messages.at(-1)?.outcome,'routing',question);
  assert.equal(s.requests.length,0,question);
  assert.deepEqual(s.messages.at(-1)?.citations,[],question);
 }
 assert.equal(topicOf('Which Terraform modules should we use?'),'modules');
 assert.equal(topicOf('What are our tagging conventions?'),'tags');
});
test('different unanswered questions in the same topic are not silently merged',()=>{
 const s=applyAction(seedWorkspace(),action({question}));
 applyAction(s,action({question:'Which approvals do we need to connect to restricted transaction data?'}));
 assert.equal(s.requests.length,2);
 applyAction(s,action({question:question.toUpperCase().replace('?','!!!')}));
 assert.equal(s.requests.length,2);
 assert.equal(s.messages.at(-1)?.requestId,s.requests[0].id);
});
test('approved answers are scoped to the actual question, not every question in a topic',()=>{
 const s=applyAction(seedWorkspace(),action({question}));
 applyAction(s,action({action:'reply',userId:'jordan',requestId:s.requests[0].id,answer:'Use a private connection.',approve:true}));
 applyAction(s,action({question:'Who grants approval to connect to restricted transaction data?'}));
 assert.equal(s.messages.at(-1)?.outcome,'gap');
 assert.equal(s.requests.length,2);
 assert.equal(s.events.filter(e=>e.type==='knowledge_reused').length,0);
});
test('specific values absent from a general guide become clarification requests',()=>{
 const s=applyAction(seedWorkspace(),action({question:'What exact production latency alert threshold should we set?'}));
 assert.equal(s.messages.at(-1)?.outcome,'gap');
 assert.equal(s.requests[0].toTeam,'observability');
 assert.deepEqual(s.requests[0].citations,['monitoring']);
 assert.match(s.messages.at(-1)?.text??'',/does not verify/);
});
test('restricted-gap response does not describe evidence excluded by project scope',()=>{
 const s=seedWorkspace();s.projects[0].selectedTeams=['security'];
 applyAction(s,action({question}));
 assert.equal(s.messages.at(-1)?.outcome,'gap');
 assert(!s.messages.at(-1)?.text.includes('network overview'));
 assert(!s.messages.at(-1)?.citations?.includes('network'));
});
test('superseded approved answers are not used as current guidance',()=>{
 const s=applyAction(seedWorkspace(),action({question}));
 applyAction(s,action({action:'reply',userId:'jordan',requestId:s.requests[0].id,answer:'Retired answer.',approve:true}));
 s.knowledge[0].status='superseded';
 applyAction(s,action({question}));
 assert.equal(s.messages.at(-1)?.outcome,'gap');
 assert.equal(s.requests.length,2);
});
test('invalid runtime action shapes are rejected before changing workspace state',()=>{
 for(const invalid of [null,[],{action:'ask'},action({question:17 as unknown as string}),action({approve:'false' as unknown as boolean}),action({teamIds:'security' as unknown as Action['teamIds']}),action({payload:{cpu:2 as unknown as string}})]){
  const s=seedWorkspace(),before=JSON.stringify(s);
  assert.throws(()=>applyAction(s,invalid as Action),/Invalid workspace action/);
  assert.equal(JSON.stringify(s),before);
 }
 assert.throws(()=>parseAction(action({action:'invented'})),/Invalid workspace action/);
});
test('a team cannot approve an unanswered question or expose another team audience',()=>{
 const s=applyAction(seedWorkspace(),action({question}));
 assert.throws(()=>applyAction(s,action({action:'approve',userId:'jordan',requestId:s.requests[0].id})),/Answer the question/);
 assert.equal(s.knowledge.length,0);
 assert.equal(s.requests[0].approved,false);
 applyAction(s,action({action:'reply',userId:'jordan',requestId:s.requests[0].id,answer:'Security response.',approve:true}));
 assert.deepEqual(s.knowledge[0].groups,['fraud','security']);
 assert.equal(visibleState(s,people.find(p=>p.id==='sam')!).knowledge.length,0);
 assert(!JSON.stringify(visibleState(s,people.find(p=>p.id==='sam')!)).includes('Security response.'));
});
test('request sender sees the team response immediately before reuse approval',()=>{
 const s=applyAction(seedWorkspace(),action({question}));
 applyAction(s,action({action:'reply',userId:'jordan',requestId:s.requests[0].id,answer:'Here is the missing policy.'}));
 const sender=visibleState(s,people[0]);
 assert.equal(sender.requests[0].status,'answered');
 assert.match(sender.messages.at(-1)?.text??'',/Here is the missing policy/);
 assert.equal(sender.knowledge.length,0);
});
test('provider receives eligible evidence and matches the synchronous demo resolution',async()=>{
 const s=seedWorkspace(),person=people[0],project=s.projects[0];
 const knowledge=eligibleKnowledge(s,person,project);
 assert(!knowledge.some(d=>d.id==='regions'));
 const resolved=await getQuestionProvider('demo').resolve({question,project,knowledge});
 assert.deepEqual(resolved,resolveQuestion(s,person,project,question));
 applyAction(s,action({question}),resolved);
 assert.equal(s.requests[0].toTeam,'security');
 assert.throws(()=>getQuestionProvider('azure'),ProviderConfigurationError);
 assert.throws(()=>getQuestionProvider('unknown'),ProviderConfigurationError);
});
test('injected provider results cannot cite forbidden sources or route outside project scope',()=>{
 const s=seedWorkspace(),before=JSON.stringify(s);
 assert.throws(()=>applyAction(s,action({question}),{text:'Forbidden answer',citations:['regions'],outcome:'answer',searchedCount:1}),/unavailable source/);
 assert.equal(JSON.stringify(s),before);
 s.projects[0].selectedTeams=['platform'];
 assert.throws(()=>applyAction(s,action({question}),{text:'Sending',citations:[],outcome:'gap',suggestedTeam:'security',searchedCount:0}),/responsible team/);
 assert.equal(s.requests.length,0);
 assert.equal(s.messages.length,0);
});
test('a persisted workspace round trip preserves pending requests and idempotency',()=>{
 const a=action({question});
 const s=JSON.parse(JSON.stringify(applyAction(seedWorkspace(),a)));
 applyAction(s,a);
 assert.equal(s.requests.length,1);
 assert.equal(s.messages.length,2);
 assert.equal(s.events.length,2);
});

test('specific shared-policy questions suggest scope expansion before routing',()=>{
 const s=seedWorkspace();s.projects[0].selectedTeams=['platform'];
 applyAction(s,action({question:'What exact data classification do we need?'}));
 assert.equal(s.messages.at(-1)?.outcome,'scope');
 assert.equal(s.messages.at(-1)?.suggestedTeam,'data');
 assert.equal(s.requests.length,0);
});
test('injected answers need citations and have secrets redacted before persistence',()=>{
 const s=seedWorkspace();
 assert.throws(()=>applyAction(s,action({question:'Secrets policy?'}),{text:'Unverified',citations:[],outcome:'answer',searchedCount:1}),/could not be verified/);
 applyAction(s,action({question:'Secrets policy?'}),{text:'password = testing123',citations:['secrets'],outcome:'answer',searchedCount:1});
 assert.equal(s.messages.at(-1)?.text,'password = [redacted]');
});

test('specific policy topics take priority over incidental environment context',()=>{
 const s=seedWorkspace(),person=people[0],project=s.projects[0];
 assert.deepEqual(resolveQuestion(s,person,project,'Which Terraform module should our production environment use?').citations,['modules']);
 assert.deepEqual(resolveQuestion(s,person,project,'What data classification should our test environment use?').citations,['classification']);
 assert.deepEqual(resolveQuestion(s,person,project,'Is the old email intake form still valid?').citations,['vm','old-intake']);
});
