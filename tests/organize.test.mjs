import test from "node:test";
import assert from "node:assert/strict";
import { loadSource, loadDashboardHandler } from "./source-loader.mjs";

const input = { text: "Explain why the sky is blue", provider: "openrouter" };
const rawPlan = {
  tasks: [{ id: "task_1", title: "Finish report", priority: "high" }],
  dailyPlan: [{ taskId: "task_1", task: "Finish report", time: "09:00" }],
  focusTask: { taskId: "task_1", title: "Finish report", reason: "Due today" },
  insight: "Start with the report.",
  notes: [{ title: "Sky color", content: "Air scatters shorter wavelengths more strongly." }],
};
const plan = {
  ...rawPlan, notes: [{ ...rawPlan.notes[0], id: "note-1" }],
};
const aiOptions = { provider: "openrouter", apiKey: "test-only" };
function ai(fetch, options = {}) {
  return loadSource("lib/ai.ts", {globals: { fetch }, ...options}).module;
}
const completion = (value, finish_reason = "stop") => Response.json({choices:[{message:{content:JSON.stringify(value)},finish_reason}]});

test("AI result contains linked tasks, schedule and factual notes", async () => {
  let signal;
  const result = await ai(async (_, init) => {signal = init.signal; return completion(rawPlan);}).organizeThoughts(input.text, aiOptions);
  assert.equal(result.tasks[0].title, "Finish report");
  assert.equal(result.dailyPlan[0].taskId, result.tasks[0].id);
  assert.equal(result.focusTask.taskId, result.tasks[0].id);
  assert.match(result.notes[0].content, /scatters/);
  assert.equal(signal.aborted, false);
});

test("notes-only results are accepted without manufacturing tasks", async () => {
  const result = await ai(async () => completion({notes:rawPlan.notes})).organizeThoughts(input.text, aiOptions);
  assert.equal(result.tasks.length, 0);
  assert.equal(result.focusTask.title, "");
  assert.equal(result.notes.length, 1);
});

test("empty, malformed and blank AI results fail explicitly", async () => {
  for (const value of [{}, null, [], {tasks:[]}, {notes:{}}, {notes:[{title:"Q",content:" "}]}, {tasks:[null]}, {tasks:[{title:" "}]}, {...rawPlan,dailyPlan:{}}]) {
    await assert.rejects(ai(async () => completion(value)).organizeThoughts(input.text, aiOptions), /empty or incomplete/);
  }
});

test("truncated or invalid JSON does not become a successful fallback", async () => {
  await assert.rejects(ai(async () => completion(rawPlan,"length")).organizeThoughts(input.text, aiOptions), /incomplete/);
  await assert.rejects(ai(async () => Response.json({choices:[{message:{content:'{"tasks":'}}]})).organizeThoughts(input.text, aiOptions));
});

test("provider failures explain credentials, credits, rate limits and outages", async () => {
  for (const [status, code] of [[401,"INVALID_API_KEY"],[403,"INVALID_API_KEY"],[402,"PROVIDER_CREDITS"],[429,"RATE_LIMITED"],[503,"PROVIDER_UNAVAILABLE"]]) {
    await assert.rejects(ai(async () => new Response("",{status})).organizeThoughts(input.text, aiOptions), e => e.code === code);
  }
  await assert.rejects(ai(async () => {throw new TypeError("network");}).organizeThoughts(input.text, aiOptions), e => e.code === "PROVIDER_UNAVAILABLE");
});

test("missing key is visible, never a question converted into a task", async () => {
  await assert.rejects(ai(() => {throw new Error("must not fetch");}).organizeThoughts(input.text,{provider:"openrouter"}), e => e.code === "MISSING_API_KEY");
});

test("OpenRouter has a deadline even if fetch ignores abort", async () => {
  let signal;
  const pendingAi = ai((_,init) => {signal=init.signal; return new Promise(()=>{});}, {timerScale:0.001});
  await assert.rejects(pendingAi.organizeThoughts(input.text,aiOptions), {name:"RequestTimeoutError"});
  assert.equal(signal.aborted,true);
});

test("Gemini uses cancellation, a bounded single attempt, and the same validation", async () => {
  let config;
  const {module} = loadSource("lib/ai.ts", {mocks:{"@google/genai":{GoogleGenAI: class {
    models = {generateContent: async (request) => {config=request.config; return {text:JSON.stringify(rawPlan)};}};
  }}}});
  const result = await module.organizeThoughts(input.text,{provider:"gemini",apiKey:"test-only"});
  assert.equal(result.notes.length,1);
  assert.equal(config.httpOptions.retryOptions.attempts,1);
  assert.equal(config.httpOptions.timeout,25000);
  assert.ok(config.abortSignal);
});

test("Gemini timeout and rate limit fail without local fallback", async () => {
  for (const outcome of ["hang","rate"]) {
    const {module} = loadSource("lib/ai.ts", {timerScale:0.001,mocks:{"@google/genai":{GoogleGenAI:class {
      models = {generateContent: () => {if(outcome==="hang") return new Promise(()=>{}); throw Object.assign(new Error("rate"),{status:429});}};
    }}}});
    await assert.rejects(module.organizeThoughts(input.text,{provider:"gemini",apiKey:"test-only"}), e => outcome==="hang" ? e.name==="RequestTimeoutError" : e.code==="RATE_LIMITED");
  }
});

test("browser request accepts useful results and preserves server error messages", async () => {
  let response = Response.json(plan);
  const {module} = loadSource("lib/organize-client.ts",{globals:{fetch:async()=>response}});
  assert.equal((await module.requestOrganize(input,new AbortController().signal)).notes.length,1);
  response=Response.json({error:"Check your API key"},{status:502});
  await assert.rejects(module.requestOrganize(input,new AbortController().signal), /Check your API key/);
  response=new Response("Bad gateway",{status:502});
  await assert.rejects(module.requestOrganize(input,new AbortController().signal), /service is unavailable/);
  response=Response.json({});
  await assert.rejects(module.requestOrganize(input,new AbortController().signal), /empty or incomplete/);
});

test("browser timeout covers response body, offline failure and cancellation", async () => {
  const {module} = loadSource("lib/organize-client.ts",{timerScale:0.001,globals:{fetch:async()=>({ok:true,json:()=>new Promise(()=>{})})}});
  await assert.rejects(module.requestOrganize(input,new AbortController().signal), /took too long/);
  const offline=loadSource("lib/organize-client.ts",{globals:{fetch:async()=>{throw new TypeError("offline");}}}).module;
  await assert.rejects(offline.requestOrganize(input,new AbortController().signal), /Check your connection/);
  const controller=new AbortController(); controller.abort();
  await assert.rejects(module.requestOrganize(input,controller.signal),{name:"AbortError"});
});

test("dashboard applies results immediately and clears processing", async () => {
  const {context,state}=loadDashboardHandler(async()=>plan);
  await context.run(input);
  assert.equal(state.isProcessing,false);
  assert.equal(state.tasks[0].title,"Finish report");
  assert.match(state.organizeNotice,/Answers are in Notes/);
});

test("dashboard errors preserve existing work, allow retry, and notes-only preserve tasks", async () => {
  let fail=true;
  const {context,state}=loadDashboardHandler(async()=>{if(fail)throw new Error("Try another model");return {...plan,tasks:[],dailyPlan:[]};});
  await context.run(input);
  assert.equal(state.isProcessing,false);
  assert.equal(state.organizeError,"Try another model");
  assert.equal(state.tasks[0].id,"existing");
  fail=false;
  await context.run(context.lastOrganizeInput.current);
  assert.equal(state.organizeError,"");
  assert.equal(state.tasks[0].id,"existing");
  assert.equal(state.notes.length,1);
});

test("duplicate clicks are ignored; cancelled late results cannot overwrite a retry", async () => {
  let calls=0, resolveFirst;
  const {context,state}=loadDashboardHandler(()=>{calls++;return calls===1 ? new Promise(resolve=>{resolveFirst=resolve;}) : Promise.resolve(plan);});
  const first=context.run(input);
  await context.run(input);
  assert.equal(calls,1);
  context.cancel();
  assert.equal(state.isProcessing,false);
  await context.run(input);
  resolveFirst({...plan,tasks:[{title:"Stale result"}]});
  await first;
  assert.equal(state.tasks[0].title,"Finish report");
  assert.equal(state.isProcessing,false);
});

function route({user={id:"test-user"},authError=null,keyError=null,decryptError=false,organize=async()=>plan,authHang=false}={}) {
  const db={select(){return this;},eq(){return this;},abortSignal(){return this;},async maybeSingle(){return {data:decryptError?{encrypted_key:"test"}:null,error:keyError};}};
  return loadSource("app/api/organize/route.ts",{timerScale:0.001,mocks:{
    "next/server":{NextResponse:{json:(value,init)=>Response.json(value,init)}},
    "@/lib/supabase/server":{createClient:async()=>({auth:{getUser:()=>authHang?new Promise(()=>{}):Promise.resolve({data:{user},error:authError})},from:()=>db})},
    "@/lib/supabase/admin":{createAdminClient:()=>null},
    "@/lib/vault":{decryptApiKey:()=>{throw new Error("test decryption failure");}},
    "@/lib/ai":{organizeThoughts:organize},
  }}).module;
}
const request=(body=input)=>new Request("http://localhost/api/organize",{method:"POST",body:JSON.stringify(body)});

test("route validates input and reports auth/key lookup/decryption failures", async () => {
  for (const [options,body,status,code] of [
    [{},{text:" "},400,"INVALID_INPUT"],
    [{},{...input,provider:"bad"},400,"INVALID_INPUT"],
    [{user:null},input,401,"SIGN_IN_REQUIRED"],
    [{keyError:{message:"db error"}},input,503,"SETTINGS_UNAVAILABLE"],
    [{decryptError:true},input,503,"KEY_UNAVAILABLE"],
  ]) {
    const response=await route(options).POST(request(body));
    assert.equal(response.status,status);
    assert.equal((await response.json()).code,code);
  }
});

test("route deadline includes authentication and success returns results", async () => {
  const timeout=await route({authHang:true}).POST(request());
  assert.equal(timeout.status,504);
  assert.equal((await timeout.json()).code,"TIMEOUT");
  const success=await route().POST(request());
  assert.equal(success.status,200);
  assert.equal((await success.json()).tasks[0].title,"Finish report");
});

test("public authentication routes do not wait on Supabase; dashboard remains protected", async () => {
  let calls=0;
  const {module}=loadSource("middleware.ts",{globals:{process:{env:{NEXT_PUBLIC_SUPABASE_URL:"https://test.invalid",NEXT_PUBLIC_SUPABASE_ANON_KEY:"test"}}},mocks:{
    "@supabase/ssr":{createServerClient:()=>({auth:{getSession:async()=>{calls++;return {data:{session:null}};}}})},
    "next/server":{NextResponse:{next:()=>({kind:"next"}),redirect:url=>({kind:"redirect",url:String(url)})}},
  }});
  for(const pathname of ["/login","/signup"]){
    const result=await module.middleware({nextUrl:{pathname},url:`http://localhost${pathname}`});
    assert.equal(result.kind,"next");
  }
  assert.equal(calls,0);
  const dashboard=await module.middleware({nextUrl:{pathname:"/dashboard"},url:"http://localhost/dashboard"});
  assert.equal(dashboard.url,"http://localhost/login");
  assert.equal(calls,1);
});
