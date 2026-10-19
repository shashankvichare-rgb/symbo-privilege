/* No recipient list, secrets or backend deployment URLs belong in this file. */
'use strict';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search),token=params.get('token')||history.state?.privilegeToken||'',demo=params.get('demo')==='1';
// Keep token in memory; remove it from address bar/history before subsequent navigation.
if(token)history.replaceState({...history.state,privilegeToken:token},'',location.pathname);
let data,step=0,service='',pending=history.state?.pendingRequest||null,busy=false;
const icons={ac:'<path d="M12 2v20M3.34 7l17.32 10M3.34 17L20.66 7M8 4l4 3 4-3M8 20l4-3 4 3"/>',clean:'<path d="m15 3-5 9m-4-2 8 4-5 8-7-4zM18 13v6m-3-3h6"/>',pest:'<path d="M9 5 7 2m8 3 2-3M8 8h8v9a4 4 0 0 1-8 0zM4 9l4 2m12-2-4 2M4 16h4m12 0h-4M6 22l3-3m9 3-3-3M12 8v13"/>',shoe:'<path d="M3 9v11h18v-5l-8-4-4-6-3 5zM3 16h18M13 11l-2 3m5-2-2 3"/>',wash:'<path d="m5 10 2-6h10l2 6M3 10h18v8H3zM6 18v3m12-3v3M6 13h2m8 0h2"/>'};
const demoServices=[['ac','AC Care','Dry or wet servicing for one AC.',['Dry service','Wet service','Not sure, advise me']],['clean','Festive Home Cleaning','Home cleaning for an eligible 1, 2 or 3 BHK residence.',['1 BHK','2 BHK','3 BHK']],['pest','Home Pest Protection','Pest-control service for an eligible 1, 2 or 3 BHK residence.',['1 BHK','2 BHK','3 BHK']],['shoe','Shoe Revival','Professional cleaning for one eligible pair of shoes.',['One pair']],['wash','Vehicle Refresh','A one-time wash for an eligible car.',['One car']]].map(([id,name,description,variants])=>({id,name,description,variants}));
const demoData={ok:true,recipient:{id:'SYM-TEST-0001',name:'Aarav Mehta',firstName:'Aarav'},remaining:1,validUntil:'2099-12-31',services:demoServices,testRecord:true,policy:{phone:'918657918455',callback:'Your concierge will call to confirm the details and arrange your service.',terms:'DESIGN PREVIEW ONLY. One complimentary service. Location, scope and dates require confirmation. This preview does not save requests.',privacy:'DESIGN PREVIEW ONLY. Do not enter real personal information. No details are transmitted or saved.',version:'PREVIEW',manual:true}};
function error(message){$('error').textContent=message;$('error').hidden=!message;if(message)$('error').scrollIntoView({block:'nearest',behavior:'smooth'});}
async function api(action,request){const response=await fetch('/api/privilege',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,token,request}),cache:'no-store'});const result=await response.json();if(!result.ok){const e=new Error(result.message||'We could not confirm your request. Please retry.');e.code=result.code;throw e;}return result;}
function dateToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function whats(message){return 'https://wa.me/'+(data?.policy.phone||'918657918455')+'?text='+encodeURIComponent(message);}
function policyUI(){const p=data.policy;['terms','modal-terms'].forEach(id=>$(id).textContent=p.terms);['privacy','modal-privacy'].forEach(id=>$(id).textContent=p.privacy);$('policy-version').textContent='Version: '+p.version;
 const phone=p.phone;if(/^91\d{10}$/.test(phone))document.querySelectorAll('[data-phone]').forEach(a=>{a.href='tel:+'+phone;a.textContent='+'+phone.slice(0,2)+' '+phone.slice(2,7)+' '+phone.slice(7);});
 document.querySelectorAll('[data-wa]').forEach(a=>a.href=whats('Hello Symbo Concierge, please help me with my festive privilege. My Privilege ID is '+data.recipient.id+'.'));
}
function renderStep(next){step=next;error('');$('welcome').hidden=next!==0;$('journey').hidden=next===0;$('choose').hidden=next!==1;$('details').hidden=next!==2;$('review').hidden=next!==3;$('steps').textContent='Step '+next+' of 3';$('main').scrollIntoView({block:'start'});}
function selectService(id){service=id;document.querySelectorAll('.service').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.service===id)));const s=data.services.find(x=>x.id===id);$('variant').replaceChildren(...s.variants.map(v=>{const o=document.createElement('option');o.textContent=v;o.value=v;return o;}));$('variant-area').hidden=false;}
function serviceUI(){const parent=$('services');parent.replaceChildren();for(const s of data.services){const button=document.createElement('button');button.type='button';button.className='service';button.dataset.service=s.id;button.setAttribute('aria-pressed','false');const icon=document.createElement('span');icon.className='service-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+(icons[s.id]||'')+'</svg>';const copy=document.createElement('span'),title=document.createElement('strong'),desc=document.createElement('small');title.textContent=s.name;desc.textContent=s.description;copy.append(title,desc);const radio=document.createElement('span');radio.className='radio';radio.setAttribute('aria-hidden','true');button.append(icon,copy,radio);button.addEventListener('click',()=>selectService(s.id));parent.append(button);}}
function readForm(){return Object.fromEntries(new FormData($('details')));}
function review(){const d=readForm(),s=data.services.find(x=>x.id===service);const rows=[['Privilege',s.name+' · '+$('variant').value],['Recipient',d.name],['Callback',d.mobile+' · '+d.callbackWindow+' IST'],['Service location',d.address+'\n'+d.city+' · '+d.pincode],['Preferred date',d.preferredDate],['Alternate date',d.alternateDate||'Not specified'],['Notes',d.notes||'None']];const dl=document.createElement('dl');for(const [key,value]of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;dl.append(dt,dd);}$('summary').replaceChildren(dl);}
$('start').onclick=()=>renderStep(1);
$('back').onclick=()=>{if(!busy)renderStep(Math.max(0,step-1));};
$('to-details').onclick=()=>{if(!service)return error('Choose a privilege to continue.');renderStep(2);};
$('details').onsubmit=event=>{event.preventDefault();const d=readForm();if(d.alternateDate&&d.alternateDate===d.preferredDate)return error('Choose a different alternate date.');review();renderStep(3);};
$('policy-open').onclick=()=>{if(!data){error('Open your personal invitation link to view the applicable terms.');return;}$('policy-dialog').showModal();};$('policy-close').onclick=()=>$('policy-dialog').close();
$('submit').onclick=async()=>{
 if(busy)return;if(!$('consent').checked)return error('Please accept service coordination and the privilege terms.');
 const payload={...readForm(),service,variant:$('variant').value,consent:true,policyVersion:data.policy.version};
 busy=true;$('submit').disabled=true;$('back').disabled=true;$('submit').textContent='Saving your request…';error('');
 try{
  // Store only a payload digest and retry key in this tab's history; never store form details.
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload))))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(!pending||pending.digest!==digest)pending={digest,key:crypto.randomUUID()};
  history.replaceState({...history.state,pendingRequest:pending},'',location.href);
  const result=demo?{ok:true,requestId:'DEMO-NOT-SAVED',policy:data.policy}:await api('submit',{...payload,idempotencyKey:pending.key});
  $('journey').hidden=true;$('welcome').hidden=true;$('success').hidden=false;$('reference').textContent='Reference: '+result.requestId;
  $('callback-copy').textContent=demo?'Design preview only. This request has not been saved.':result.policy.callback;
  if(demo)$('success').querySelector('.small.muted').textContent='Preview only — no request has been saved or sent.';
  $('success-wa').href=whats('Hello Symbo Concierge, '+(demo?'I am previewing the festive privilege journey.':'I have submitted request '+result.requestId+' for '+data.services.find(x=>x.id===service).name+'. My Privilege ID is '+data.recipient.id+'. Please help me with my booking.'));
  $('main').scrollIntoView({block:'start'});
 }catch(e){error(e.message||'We could not confirm the save. Retry the same request to avoid duplicates.');}
 finally{busy=false;$('submit').disabled=false;$('back').disabled=false;$('submit').textContent='Request my privilege →';}
};
(async()=>{try{
 if(!demo&&!token){$('notice').textContent='This is an invitation-only privilege. Scan the QR code on your card to open your personal invitation. For assistance, call +91 86579 18455.';return;}
 data=demo?demoData:await api('lookup');$('notice').hidden=true;$('demo-banner').hidden=!demo;$('test-banner').hidden=demo||!data.testRecord;$('pid').textContent=data.recipient.id;
 policyUI();if(data.remaining<1){$('notice').hidden=false;$('notice').textContent='Your privilege has already been requested. For booking changes, contact your Symbo Concierge on +91 86579 18455.';return;}
 $('greeting').textContent='Welcome, '+data.recipient.firstName+'.';$('name').value=data.recipient.name;$('expiry').textContent=(demo?'Preview expiry: ':'Request by: ')+data.validUntil;
 $('preferredDate').min=dateToday();$('alternateDate').min=dateToday();serviceUI();renderStep(0);
 }catch(e){$('notice').textContent=e.message||'Unable to load your invitation. Please retry your original QR link or contact your concierge.';}})();
