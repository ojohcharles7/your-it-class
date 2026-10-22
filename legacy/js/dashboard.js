const u=store.get("user",null);if(!u)location.href="index.html";
const $=s=>document.querySelector(s);let en=store.get("enrol",[]);
$("#hi").textContent="Hello, "+(u?u.name:"")+" 👋";
const C=id=>COURSES.find(c=>c.id===id);
const prog=e=>Math.round(e.done/LESSONS.length*100);
const views={
home(){const avg=en.length?Math.round(en.reduce((a,e)=>a+prog(e),0)/en.length):0;
return `<div class="kpis"><div class="glass"><b>${en.length}</b><small>Enrolled</small></div><div class="glass"><b>${avg}%</b><small>Avg. progress</small></div><div class="glass"><b>${en.filter(e=>prog(e)===100).length}</b><small>Completed</small></div></div><h3 style="margin-bottom:8px">Continue learning</h3>${list()}`},
courses(){return list()},
exams(){return en.length?en.map(e=>{const c=C(e.id),ready=prog(e)===100;return `<div class="row"><span>${c.e} ${c.t} — Final exam</span>${ready?`<button class="btn pri" onclick="alert('Exam engine arrives in Phase 7.')">Start exam</button>`:'<span class="warn">Finish lessons to unlock</span>'}</div>`}).join(""):empty()},
pay(){return en.length?en.map(e=>`<div class="row"><span>${C(e.id).t}<br><small style="color:var(--mut)">${new Date(e.date).toLocaleDateString("en-NG")}</small></span><span><b>${naira(C(e.id).p)}</b> <span class="ok">Paid</span></span></div>`).join(""):empty()}};
const empty=()=>`<p class="lead">You haven't enrolled yet.</p><a class="btn pri" href="index.html#courses">Browse courses</a>`;
function list(){return en.length?en.map(e=>{const c=C(e.id);return `<div class="glass" style="padding:16px;margin-bottom:12px;cursor:pointer" onclick="watch(${e.id})"><div style="display:flex;gap:14px;align-items:center"><div class="thumb" style="width:64px;height:64px;height:64px;border-radius:16px;font-size:28px;background:linear-gradient(135deg,${c.g})">${c.e}</div><div style="flex:1"><b>${c.t}</b><div class="meta">${e.done}/${LESSONS.length} lessons · ${prog(e)}%</div><div class="bar"><i style="width:${prog(e)}%"></i></div></div></div></div>`}).join(""):empty()}
function watch(id){const e=en.find(x=>x.id===id),c=C(id);$("#view").innerHTML=`<button class="btn" onclick="show('courses')">← Back</button><h3 style="margin:14px 0">${c.t}</h3><div class="player" style="background-image:linear-gradient(135deg,${c.g})">▶</div><p class="lead">Lesson player placeholder — YouTube/uploaded video embeds go here.</p>${LESSONS.map((l,i)=>`<div class="row"><span>${i<e.done?"✅":"▶️"} ${i+1}. ${l}</span>${i===e.done?`<button class="btn pri" onclick="finish(${id})">Mark complete</button>`:""}</div>`).join("")}`}
function finish(id){const e=en.find(x=>x.id===id);if(e.done<LESSONS.length)e.done++;store.set("enrol",en);watch(id)}
function show(v){document.querySelectorAll(".side a[data-v]").forEach(a=>a.classList.toggle("on",a.dataset.v===v));$("#view").innerHTML=views[v]()}
document.querySelectorAll(".side a[data-v]").forEach(a=>a.onclick=()=>show(a.dataset.v));
$("#out").onclick=()=>{localStorage.removeItem("user");location.href="index.html"};
show("home");
