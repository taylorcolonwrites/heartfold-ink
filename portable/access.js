'use strict';
const status=document.getElementById('status'),form=document.getElementById('accessForm');
async function send(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),d=await r.json();if(!r.ok)throw Error(d.error||'Unable to complete this request.');return d}
const token=new URLSearchParams(location.hash.slice(1)).get('token');if(token){history.replaceState(null,'','/access/');status.textContent='Opening your secure link…';send('/api/access/consume',{token}).then(d=>location.replace(d.url)).catch(e=>{status.textContent=e.message})}
form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;try{const d=await send('/api/access/request',Object.fromEntries(new FormData(form)));status.textContent=d.message}catch(e){status.textContent=e.message}finally{button.disabled=false}};
