let cat="All";const $=s=>document.querySelector(s);
const user=()=>store.get("user",null);
function render(){const q=$("#q").value.toLowerCase();
$("#grid").innerHTML=COURSES.filter(c=>(cat==="All"||c.c===cat)&&c.t.toLowerCase().includes(q)).map(c=>`<div class="card glass" onclick="openCourse(${c.id})"><div class="thumb" style="background:linear-gradient(135deg,${c.g})">${c.e}</div><div class="b"><div class="tag">${c.c}</div><h3>${c.t}</h3><div class="meta"><span>⭐ ${c.r}</span><span>${c.n} lessons</span><span>${c.h}h</span><span>${c.l}</span></div><div class="price"><span>${naira(c.p)}</span><span style="color:var(--acc);font-size:14px">View →</span></div></div></div>`).join("")||"<p class=lead>No courses found.</p>"}
function chips(){const cs=["All",...new Set(COURSES.map(c=>c.c))];$("#chips").innerHTML=cs.map(c=>`<button class="chip ${c===cat?"on":""}" onclick="cat='${c}';chips();render()">${c}</button>`).join("")}
const open=h=>{$("#sheet").innerHTML=`<span class="x" onclick="closeM()">✕</span>`+h;$("#modal").classList.add("open")};
function closeM(){$("#modal").classList.remove("open")}
$("#modal").onclick=e=>{if(e.target.id==="modal")closeM()};
function openCourse(id){const c=COURSES.find(x=>x.id===id);open(`<div class="thumb" style="background:linear-gradient(135deg,${c.g});border-radius:16px;margin-bottom:14px">${c.e}</div><h3>${c.t}</h3><p>${c.l} · ${c.n} lessons · ${c.h} hours · ⭐ ${c.r}</p><ul class="ls">${LESSONS.slice(0,4).map((l,i)=>`<li><span>${i+1}. ${l}</span><span>🔒</span></li>`).join("")}</ul><button class="btn pri" onclick="enrol(${id})">Enrol · ${naira(c.p)}</button>`)}
function enrol(id){if(!user())return openAuth("signup",id);const e=store.get("enrol",[]);if(!e.find(x=>x.id===id))e.push({id,done:0,paid:true,date:new Date().toISOString()});store.set("enrol",e);location.href="dashboard.html"}
function openAuth(m,after){const s=m==="signup";open(`<h3>${s?"Create your account":"Welcome back"}</h3><p>${s?"Join Your IT Class and start learning.":"Log in to continue learning."}</p>${s?'<input id="nm" placeholder="Full name">':""}<input id="em" type="email" placeholder="Email"><input id="pw" type="password" placeholder="Password"><button class="btn pri" onclick="auth(${s},${after||0})">${s?"Sign up":"Log in"}</button><div class="sw">${s?'Have an account? <a onclick="openAuth(\'login\')">Log in</a>':'New here? <a onclick="openAuth(\'signup\')">Sign up</a>'}</div>`)}
function auth(s,after){const em=$("#em").value.trim(),pw=$("#pw").value;if(!em||pw.length<6)return alert("Enter a valid email and a password of 6+ characters.");
/* DEMO ONLY: replace with real API + hashed passwords in Phase 1 */
store.set("user",{name:s?$("#nm").value||em.split("@")[0]:em.split("@")[0],email:em});after?enrol(after):location.href="dashboard.html"}
$("#q").oninput=render;$("#dashLink").onclick=e=>{e.preventDefault();user()?location.href="dashboard.html":openAuth("login")};
if(user()){$("#loginBtn").remove();$("#signBtn").textContent="My dashboard";$("#signBtn").onclick=()=>location.href="dashboard.html"}
chips();render();
