const D="0123456789ABCDEF",NAMES={2:"Binary",8:"Octal",10:"Decimal",16:"Hexadecimal"},MAXF=12;
const $=id=>document.getElementById(id);
let S={from:10,to:2,a:"",op:null,b:"",err:""};

// exact rational arithmetic with BigInt
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a};
const norm=(n,d)=>{if(d<0n){n=-n;d=-d}const g=gcd(n,d)||1n;return{n:n/g,d:d/g}};
function parse(s,b){
  if(!s||s==="-"||s===".")return null;
  const neg=s[0]==="-";if(neg)s=s.slice(1);
  const[i,f=""]=s.split("."),B=BigInt(b);let n=0n;
  for(const c of i+f)n=n*B+BigInt(D.indexOf(c));
  return norm(neg?-n:n,B**BigInt(f.length));
}
function fmt(r,b,max=MAXF){
  const neg=r.n<0n,n=neg?-r.n:r.n,B=BigInt(b);
  let rem=n%r.d,out=(n/r.d).toString(b).toUpperCase(),fs="";
  for(let k=0;rem&&k<max;k++){rem*=B;fs+=D[Number(rem/r.d)];rem%=r.d}
  return{s:(neg?"-":"")+out+(fs?"."+fs:""),exact:rem===0n};
}
function calc(){
  const A=parse(S.a,S.from);if(!A)return null;
  if(!S.op||!parse(S.b,S.from))return A;
  const B=parse(S.b,S.from);
  switch(S.op){
    case"+":return norm(A.n*B.d+B.n*A.d,A.d*B.d);
    case"−":return norm(A.n*B.d-B.n*A.d,A.d*B.d);
    case"×":return norm(A.n*B.n,A.d*B.d);
    case"÷":if(B.n===0n){S.err="Can't divide by zero.";return null}
      return norm(A.n*B.d,A.d*B.n);
  }
}
function conv(s,from,to){const r=parse(s,from);return r?fmt(r,to).s:s}

function setFrom(nb){
  S.a=conv(S.a,S.from,nb);S.b=conv(S.b,S.from,nb);S.from=nb;$("from").value=nb;buildKeys();
}
function press(k){
  S.err="";
  const cur=S.op?"b":"a";
  if(D.includes(k)){if(D.indexOf(k)<S.from&&S[cur].length<24)S[cur]+=k}
  else if(k==="."){if(!S[cur].includes("."))S[cur]+=S[cur]===""||S[cur]==="-"?"0.":"."}
  else if(k==="±"){S[cur]=S[cur][0]==="-"?S[cur].slice(1):"-"+S[cur]}
  else if(k==="⌫"){if(S[cur])S[cur]=S[cur].slice(0,-1);else if(S.op)S.op=null}
  else if(k==="AC"){S.a="";S.b="";S.op=null}
  else if("+−×÷".includes(k)){
    if(S.a===""||S.a==="-")return render();
    if(S.op&&parse(S.b,S.from))fold();
    S.op=k;
  }
  else if(k==="="){if(S.op&&parse(S.b,S.from))fold()}
  render();
}
function fold(){const r=calc();if(r){S.a=fmt(r,S.from).s;S.op=null;S.b=""}}

function buildKeys(){
  const L=["AC","⌫","±","÷","D","E","F","×","A","B","C","−","7","8","9","+","4","5","6","=","1","2","3",".","0"];
  $("keys").innerHTML=L.map(k=>{
    const cls="+−×÷".includes(k)?"op":k==="="?"eq":k==="0"?"wide":"";
    const dis=D.includes(k)&&D.indexOf(k)>=S.from?"disabled":"";
    return`<button class="${cls}" data-k="${k}" ${dis}>${k}</button>`}).join("");
}
function render(){
  const r=calc();
  $("expr").innerHTML=(S.a||"")+(S.op?` <b>${S.op}</b> ${S.b}`:"");
  let txt="0",note="";
  if(r){const f=fmt(r,S.to);txt=f.s;if(!f.exact)note=`Approximate: cut off after ${MAXF} fractional digits`}
  $("result").textContent=txt;$("note").textContent=note;$("err").textContent=S.err;
  $("all").innerHTML=[2,8,10,16].map(b=>`<span>${NAMES[b]}: <b>${r?fmt(r,b,8).s:"–"}</b></span>`).join("");
}
function init(){
  const opts=[...Array(15)].map((_,i)=>i+2).map(b=>`<option value="${b}">${b}${NAMES[b]?" – "+NAMES[b]:""}</option>`).join("");
  $("from").innerHTML=opts;$("to").innerHTML=opts;$("from").value=10;$("to").value=2;
  $("from").onchange=e=>{setFrom(+e.target.value);render()};
  $("to").onchange=e=>{S.to=+e.target.value;render()};
  $("swap").onclick=()=>{const t=S.to;S.to=S.from;$("to").value=S.to;setFrom(t);render()};
  $("keys").onclick=e=>{const b=e.target.closest("button");if(b&&!b.disabled)press(b.dataset.k)};
  document.addEventListener("keydown",e=>{
    if(e.target.tagName==="SELECT")return;
    const m={"*":"×","/":"÷","-":"−","Enter":"=","Backspace":"⌫","Escape":"AC"};
    const k=m[e.key]||e.key.toUpperCase();
    if(D.includes(k)||"+−×÷=.⌫".includes(k)||k==="AC"){e.preventDefault();press(k)}
  });
  buildKeys();render();
}
init();
