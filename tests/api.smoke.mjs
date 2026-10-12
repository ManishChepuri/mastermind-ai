import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
let cookie='';
async function get(user='alex'){const r=await fetch(`${base}/api/workspace?user=${user}`,{headers:{Cookie:cookie}});assert.equal(r.status,200);cookie=(r.headers.get('set-cookie')||cookie).split(';')[0];return r.json();}
async function act(body){const r=await fetch(`${base}/api/workspace`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie,Origin:base},body:JSON.stringify({actionId:crypto.randomUUID(),userId:'alex',projectId:'fraud-scoring',...body})});const json=await r.json();return {status:r.status,json};}
let s=await get();assert.equal(s.projects.length,1);assert(!JSON.stringify(s).includes('RESTRICTED_DEMO_CANARY'));assert(!JSON.stringify(s).includes('Hunter2Example'));
assert.equal((await act({action:'ask',question:'What access does our VM need to read restricted transaction data?'})).status,200);
s=await get();assert.equal(s.requests.length,1);const requestId=s.requests[0].id;
assert.equal((await act({action:'reply',requestId,answer:'No permission'})).status,400);
assert.equal((await act({action:'reply',requestId,userId:'jordan',answer:'Use a dedicated identity and obtain Security approval.',approve:true})).status,200);
assert.equal((await act({action:'ask',userId:'priya',question:'What access does our VM need to read restricted transaction data?'})).status,200);
s=await get('priya');assert.equal(s.requests.length,1);assert.equal(s.events.filter(e=>e.type==='knowledge_reused').length,1);
const before=s.messages.length;await Promise.all([act({action:'ask',question:'Why do we need test and production environments?'}),act({action:'ask',question:'Which Terraform module should we use?'})]);s=await get();assert.equal(s.messages.length,before+4);
assert.equal((await act({action:'infra',payload:{}})).status,400);
const foreign=await fetch(`${base}/api/workspace`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie,Origin:'https://unrelated.example'},body:JSON.stringify({action:'reset',actionId:crypto.randomUUID(),userId:'alex'})});assert.equal(foreign.status,403);
console.log('API smoke passed: persistence, permissions, full request/reuse cycle, concurrent writes, validation, origin protection.');
