const COURSES=[
{id:1,t:"Full-Stack Web Development",c:"Programming",l:"Beginner",p:45000,n:64,h:38,r:4.8,e:"💻",g:"#0a84ff,#5e5ce6"},
{id:2,t:"Python for Everyone",c:"Programming",l:"Beginner",p:25000,n:42,h:22,r:4.7,e:"🐍",g:"#30d158,#0a84ff"},
{id:3,t:"Networking & CCTV Installation",c:"Networking",l:"Intermediate",p:35000,n:36,h:20,r:4.6,e:"📡",g:"#ff9f0a,#ff375f"},
{id:4,t:"Cybersecurity Essentials",c:"Security",l:"Intermediate",p:40000,n:48,h:28,r:4.9,e:"🛡️",g:"#5e5ce6,#bf5af2"},
{id:5,t:"Data Analysis with Excel & SQL",c:"Data",l:"Beginner",p:20000,n:30,h:16,r:4.5,e:"📊",g:"#64d2ff,#30d158"},
{id:6,t:"UI/UX Design Masterclass",c:"Design",l:"Beginner",p:30000,n:40,h:24,r:4.8,e:"🎨",g:"#ff375f,#bf5af2"},
{id:7,t:"Computer Repair & Maintenance",c:"Hardware",l:"Beginner",p:18000,n:26,h:14,r:4.4,e:"🖥️",g:"#8e8e93,#0a84ff"},
{id:8,t:"Digital Marketing & Freelancing",c:"Business",l:"Beginner",p:22000,n:34,h:18,r:4.6,e:"🚀",g:"#ff9f0a,#ffd60a"}];
const LESSONS=["Welcome & course roadmap","Setting up your tools","Core concepts explained","Hands-on project: part 1","Hands-on project: part 2","Quiz & review"];
const naira=n=>"₦"+n.toLocaleString("en-NG");
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
(function(){document.documentElement.dataset.theme=store.get("theme",matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")})();
function toggleTheme(){const d=document.documentElement,n=d.dataset.theme==="dark"?"light":"dark";d.dataset.theme=n;store.set("theme",n);document.querySelectorAll(".tt").forEach(b=>b.textContent=n==="dark"?"☀️":"🌙")}
document.addEventListener("DOMContentLoaded",()=>document.querySelectorAll(".tt").forEach(b=>{b.textContent=document.documentElement.dataset.theme==="dark"?"☀️":"🌙";b.onclick=toggleTheme}));
