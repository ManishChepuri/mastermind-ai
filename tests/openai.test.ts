import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAIQuestionProvider } from '../lib/openai-provider';
import { ProviderConfigurationError } from '../lib/providers';
import { applyAction, eligibleKnowledge } from '../lib/engine';
import { people, seedWorkspace } from '../lib/data';
import type { Knowledge } from '../lib/types';

const gapQuestion='What access does our VM need to read restricted transaction data?';
const answerQuestion='Why do we need test and production environments?';
const fixture=()=>{
 const state=seedWorkspace();
 return {state,project:state.projects[0],knowledge:eligibleKnowledge(state,people[0],state.projects[0])};
};
const payload=(result:unknown)=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});
const ok=(result:unknown)=>new Response(JSON.stringify(payload(result)),{status:200,headers:{'Content-Type':'application/json'}});
function mockProvider(response:()=>Response|Promise<Response>){
 let calls=0;
 const fetchImpl=(async()=>{calls++;return response();}) as typeof fetch;
 return {provider:new OpenAIQuestionProvider({apiKey:'test-key-not-real',model:'test-model',fetchImpl}),calls:()=>calls};
}
const grounded={sufficient:true,answer:'Test validates integrations before production.',citations:[{id:'env',quote:'Test validates integrations in an isolated environment.'}]};

test('OpenAI sends a server-side Responses request with storage disabled and only supplied evidence',async()=>{
 const {project,knowledge}=fixture();
 let calls=0;
 const fetchImpl=(async(url:RequestInfo|URL,init?:RequestInit)=>{
  calls++;
  assert.equal(String(url),'https://api.openai.com/v1/responses');
  assert.equal(init?.method,'POST');
  assert.equal(new Headers(init?.headers).get('authorization'),'Bearer test-key-not-real');
  const body=JSON.parse(String(init?.body));
  assert.equal(body.store,false);
  assert.equal(body.model,'test-model');
  assert.equal(typeof body.instructions,'string');
  assert(body.instructions.length>0);
  assert(Number.isFinite(body.max_output_tokens)&&body.max_output_tokens>0);
  const input=JSON.parse(body.input);
  assert.equal(input.question,answerQuestion);
  assert(input.project);
  assert(Array.isArray(input.evidence));
  assert(!body.input.includes('RESTRICTED_DEMO_CANARY'));
  assert(!body.input.includes('Hunter2Example'));
  return ok(grounded);
 }) as typeof fetch;
 const provider=new OpenAIQuestionProvider({apiKey:'test-key-not-real',model:'test-model',fetchImpl});
 const result=await provider.resolve({question:answerQuestion,project,knowledge});
 assert.equal(calls,1);
 assert.equal(result.outcome,'answer');
 assert.deepEqual(result.citations,['env']);
});

test('grounded model answers preserve the verified citation and avoid creating a Jira request',async()=>{
 const {state,project,knowledge}=fixture();
 const {provider}=mockProvider(()=>ok(grounded));
 const result=await provider.resolve({question:answerQuestion,project,knowledge});
 assert.equal(result.text,grounded.answer);
 applyAction(state,{action:'ask',actionId:crypto.randomUUID(),userId:'alex',projectId:project.id,question:answerQuestion},result);
 assert.equal(state.requests.length,0);
 assert.deepEqual(state.messages.at(-1)?.citations,['env']);
});

test('insufficient evidence routes through the trusted owner map and creates the assigned simulated story',async()=>{
 const {state,project,knowledge}=fixture();
 const {provider}=mockProvider(()=>ok({sufficient:false,answer:'Ask Payments Analytics instead.',citations:[]}));
 const result=await provider.resolve({question:gapQuestion,project,knowledge});
 assert.equal(result.outcome,'gap');
 assert.equal(result.suggestedTeam,'security');
 applyAction(state,{action:'ask',actionId:crypto.randomUUID(),userId:'alex',projectId:project.id,question:gapQuestion},result);
 assert.equal(state.requests[0].toTeam,'security');
 assert.equal(state.requests[0].assigneeId,'jordan');
 assert.equal(state.requests[0].jiraStatus,'simulated');
});

test('teams outside the project scope stop before any model call',async()=>{
 const {project,knowledge}=fixture();
 project.selectedTeams=['platform'];
 const mocked=mockProvider(()=>{throw new Error('Unexpected network call');});
 const result=await mocked.provider.resolve({question:gapQuestion,project,knowledge});
 assert.equal(result.outcome,'scope');
 assert.equal(result.suggestedTeam,'security');
 assert.equal(mocked.calls(),0);
});

test('approved exact-question knowledge is reused without a model call',async()=>{
 const {project,knowledge}=fixture();
 const approved:Knowledge={id:'approved-1',title:gapQuestion,content:'Use a reviewed private connection.',team:'security',source:'Approved answer',keywords:[],groups:['fraud','security'],updatedAt:'2026-10-12',status:'current',approved:true};
 const mocked=mockProvider(()=>{throw new Error('Unexpected network call');});
 const result=await mocked.provider.resolve({question:gapQuestion,project,knowledge:[...knowledge,approved]});
 assert.equal(result.reused,true);
 assert.deepEqual(result.citations,['approved-1']);
 assert.equal(mocked.calls(),0);
});

const badResults:[string,unknown][]=[
 ['citation to an unavailable source',{...grounded,citations:[{id:'regions',quote:'North Lab'}]}],
 ['trivial one-character quote',{...grounded,citations:[{id:'env',quote:'T'}]}],
 ['fabricated quote',{...grounded,citations:[{id:'env',quote:'Production always costs exactly $100.'}]}],
 ['uncited sufficient answer',{...grounded,citations:[]}],
 ['empty sufficient answer',{...grounded,answer:'   '}],
 ['unexpected model routing field',{...grounded,toTeam:'analytics'}],
];
for(const [name,result] of badResults){
 test(`rejects ${name} without producing workflow mutations`,async()=>{
  const {state,project,knowledge}=fixture(),before=JSON.stringify(state);
  const {provider}=mockProvider(()=>ok(result));
  await assert.rejects(provider.resolve({question:answerQuestion,project,knowledge}),ProviderConfigurationError);
  assert.equal(JSON.stringify(state),before);
 });
}

test('superseded sources cannot substantiate a current answer',async()=>{
 const {project,knowledge}=fixture();
 const retired=knowledge.find(d=>d.id==='old-intake')!;
 const {provider}=mockProvider(()=>ok({sufficient:true,answer:'Use the retired intake.',citations:[{id:retired.id,quote:retired.content}]}));
 await assert.rejects(provider.resolve({question:answerQuestion,project,knowledge}),ProviderConfigurationError);
});

test('model refusal and incomplete responses are errors, not missing-document requests',async()=>{
 const {project,knowledge}=fixture();
 for(const response of [
  {status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'Cannot answer.'}]}]},
  {...payload(grounded),status:'incomplete',incomplete_details:{reason:'max_output_tokens'}},
 ]){
  const {provider}=mockProvider(()=>new Response(JSON.stringify(response),{status:200}));
  await assert.rejects(provider.resolve({question:gapQuestion,project,knowledge}),ProviderConfigurationError);
 }
});

test('malformed HTTP JSON and malformed structured output fail closed',async()=>{
 const {project,knowledge}=fixture();
 for(const response of [
  new Response('not json',{status:200}),
  new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{broken'}]}]}),{status:200}),
 ]){
  const {provider}=mockProvider(()=>response);
  await assert.rejects(provider.resolve({question:gapQuestion,project,knowledge}),ProviderConfigurationError);
 }
});

test('rate limits and network failures surface as provider errors without a demo fallback',async()=>{
 const {project,knowledge}=fixture();
 for(const response of [
  ()=>new Response(JSON.stringify({error:{message:'rate limited'}}),{status:429}),
  ()=>{throw new TypeError('Network unavailable');},
 ]){
  const mocked=mockProvider(response);
  await assert.rejects(mocked.provider.resolve({question:gapQuestion,project,knowledge}),ProviderConfigurationError);
  assert(mocked.calls()>0);
 }
});
