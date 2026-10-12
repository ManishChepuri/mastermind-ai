import { NextRequest, NextResponse } from 'next/server';
import { people, teams, integrationCatalog } from '@/lib/data';
import { repository } from '@/lib/repository';
import { applyAction, canSeeProject, clean, eligibleKnowledge, parseAction, visibleState, type Resolution } from '@/lib/engine';
import { getQuestionProvider, ProviderConfigurationError } from '@/lib/providers';
import type { Action } from '@/lib/types';
export const dynamic='force-dynamic';
const cookie='mastermind_demo';
function response(data:unknown,id:string,status=200){const r=NextResponse.json(data,{status});r.headers.set('Cache-Control','no-store');r.cookies.set(cookie,id,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30});return r;}
function sessionId(req:NextRequest){const existing=req.cookies.get(cookie)?.value;return existing&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing)?existing:crypto.randomUUID();}
export async function GET(req:NextRequest){
 const id=sessionId(req);
 try {let record=await repository.load(id);if(!record){await repository.create(id);record=await repository.load(id);}if(!record)throw new Error('Workspace could not be opened.');
 const person=people.find(p=>p.id===req.nextUrl.searchParams.get('user'))??people[0];
 return response({...visibleState(record.state,person),people:people.map(({groups,...p})=>p),teams,revision:record.revision,integrations:integrationCatalog},id);
 }catch{return response({error:'Workspace storage is unavailable. Please retry.'},id,503);}
}
export async function POST(req:NextRequest){
 const id=sessionId(req);const origin=req.headers.get('origin');
 if(origin && origin!==req.nextUrl.origin)return response({error:'Cross-origin requests are not allowed.'},id,403);
 let a:Action;
 try {
  const body=await req.text();if(body.length>15000)return response({error:'Request is too large.'},id,413);
  a=parseAction(JSON.parse(body));
  if(!people.some(p=>p.id===a.userId))return response({error:'Invalid demo persona.'},id,400);
 }catch{return response({error:'Invalid workspace action. Check the submitted fields and try again.'},id,400);}
 try {
  if(a.action==='reset'){const newId=crypto.randomUUID();await repository.create(newId);return response({ok:true},newId);}
  for(let attempt=0;attempt<5;attempt++){
   let record=await repository.load(id);if(!record){await repository.create(id);record=await repository.load(id);}if(!record)throw new Error('Workspace unavailable.');
   if(record.state.processed.includes(a.actionId))return response({ok:true},id);
   let resolution:Resolution|undefined;
   if(a.action==='ask'){
    const person=people.find(p=>p.id===a.userId)!;
    const project=record.state.projects.find(p=>p.id===a.projectId&&canSeeProject(p,person));
    if(!project)return response({error:'This project is not available to this persona.'},id,400);
    if(!a.question?.trim())return response({error:'Enter a question between 1 and 2,000 characters.'},id,400);
    resolution=await getQuestionProvider().resolve({question:clean(a.question.trim()),project,knowledge:eligibleKnowledge(record.state,person,project)});
   }
   let changed;
   try{changed=applyAction(record.state,a,resolution);}catch(e){return response({error:e instanceof Error?e.message:'Unable to update this workspace.'},id,400);}
   if(await repository.save(id,changed,record.revision))return response({ok:true},id);
  }
  return response({error:'Another update arrived at the same time. Please retry.'},id,409);
 }catch(e){
  return response({error:e instanceof ProviderConfigurationError?e.message:'Workspace service is unavailable. Please retry.'},id,503);
 }
}
