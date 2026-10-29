const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../apps-script/Code.gs'),'utf8');
function fixture(){
 const rec={PrivilegeID:'SYM-DIW26-10000',FirstName:'Test',LastName:'Recipient',Email:'test@example.com',Mobile:'9000000000',Company:'Demo Only',Designation:'Tester',CardStatus:'Active',TestRecord:true,AllowedServices:'ac,clean,pest,shoe,wash',MaxRedemptions:1,ValidUntil:'',CardIssued:false};
 const settings={CampaignActive:'TRUE',CampaignMode:'TEST',LaunchApproved:'FALSE',PolicyVersion:'test',ServiceabilityMode:'MANUAL',TermsText:'Test terms',PrivacyText:'Test privacy'};
 const requestHeaders='RequestID SubmittedAt PrivilegeID CustomerName CallbackMobile Service ServiceVariant City Pincode Address PreferredDate AlternateDate CallbackWindow Notes ConsentAt Status AssignedTo LastContactedAt ConfirmedServiceDate CompletedAt InternalRemarks IdempotencyKey PayloadHash TestRecord CustomerEmail CustomerCompany CustomerDesignation NotificationStatus NotificationError NotificationSentAt'.split(' ');
 const requests=[],emails=[];let mailFails=false;const services=[{ServiceID:'clean',ServiceName:'Home Cleaning',Enabled:true,ComplimentaryScope:'1 or 2 BHK',Options:'1 BHK; 2 BHK; 3 BHK',ExtraChargeCondition:'3 BHK extra',Conditions:'Conditions apply.'},{ServiceID:'diagnostics',ServiceName:'Diagnostics',Enabled:false,Options:'Package'}];
 function sheet(headers,getRows){return {getDataRange:()=>({getValues:()=>[headers,...getRows().map(o=>headers.map(h=>o[h]??''))]}),appendRow:row=>requests.push(Object.fromEntries(headers.map((h,i)=>[h,row[i]]))),getLastRow:()=>requests.length+1,getRange:(row,col)=>({setValue:v=>{requests[row-2][headers[col-1]]=v;}})};}
 const cache=new Map();const props={SPREADSHEET_ID:'test',BACKEND_SECRET:'s'.repeat(64)};
 let held=false;
 const sandbox={Date,JSON,Number,String,Error,Math,isNaN,MailApp:{sendEmail:(to,subject,body)=>{if(mailFails)throw Error('Mail unavailable');emails.push({to,subject,body});}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperty:(k,v)=>props[k]=v})},
 ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})},
 CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})},
 LockService:{getScriptLock:()=>({tryLock:()=>{held=true;return true;},hasLock:()=>held,releaseLock:()=>held=false})},
 SpreadsheetApp:{flush:()=>{},openById:()=>({getSheetByName:n=>n==='Recipients'?sheet(Object.keys(rec),()=>[rec]):n==='Settings'?sheet(['Key','Value'],()=>Object.entries(settings).map(([Key,Value])=>({Key,Value}))):n==='Services'?sheet(Object.keys(services[0]),()=>services):n==='Requests'?sheet(requestHeaders,()=>requests):null})},
 Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>crypto.createHash('sha256').update(s).digest(),computeHmacSha256Signature:(s,k)=>crypto.createHmac('sha256',k).update(s).digest(),base64EncodeWebSafe:v=>Buffer.from(v).toString('base64url'),base64DecodeWebSafe:v=>Buffer.from(v,'base64url'),newBlob:v=>({getDataAsString:()=>Buffer.from(v).toString()}),formatDate:d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const call=(action,payload,override={})=>sandbox.doPost({postData:{contents:JSON.stringify({action,payload,clientHash:'a'.repeat(64),secret:props.BACKEND_SECRET,...override})}});
 const lookup=()=>call('lookup',{id:rec.PrivilegeID});
 const tomorrow=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+2*86400000));
 const payload=()=>({session:lookup().session,requestKey:crypto.randomUUID(),service:'clean',variant:'3 BHK or larger',city:'Mumbai',pincode:'400001',address:'Test address, not a booking',dateOne:tomorrow,dateTwo:tomorrow,callbackWindow:'10 am – 1 pm',notes:'=IMPORTXML("example")',consent:true});
 return {call,lookup,payload,rec,settings,requests,services,emails,failMail:()=>mailFails=true};
}
test('lookup returns only this recipient; disabled diagnostics excluded',()=>{const f=fixture(),r=f.lookup();assert.equal(r.ok,true);assert.equal(r.recipient.company,'Demo Only');assert.equal(r.services.length,1);assert.ok(!('secret' in r));});
test('invalid secret rejected',()=>{const f=fixture();assert.equal(f.call('lookup',{id:f.rec.PrivilegeID},{secret:'wrong'}).code,'AUTH');});
test('campaign pause blocks lookups',()=>{const f=fixture();f.settings.CampaignActive='FALSE';assert.equal(f.lookup().code,'PAUSED');});
test('unassigned card blocked',()=>{const f=fixture();f.rec.CardStatus='Unassigned';assert.equal(f.lookup().code,'CARD');});
test('real card blocked in TEST mode',()=>{const f=fixture();f.rec.TestRecord=false;f.rec.CardIssued=true;assert.equal(f.lookup().code,'CARD');});
test('LIVE requires launch approval and expiry',()=>{const f=fixture();f.settings.CampaignMode='LIVE';assert.equal(f.lookup().code,'SETUP');f.settings.LaunchApproved='TRUE';f.rec.TestRecord=false;f.rec.CardIssued=true;assert.equal(f.lookup().code,'CARD');f.rec.ValidUntil='2099-12-31';assert.equal(f.lookup().ok,true);});
test('save is idempotent, snapshots company and flags 3 BHK; formula injection escaped',()=>{const f=fixture(),p=f.payload(),r=f.call('submit',p);assert.equal(r.ok,true);assert.equal(f.call('submit',p).requestId,r.requestId);assert.equal(f.requests.length,1);assert.equal(f.requests[0].CustomerCompany,'Demo Only');assert.match(f.requests[0].InternalRemarks,/quote amount above 2 BHK/);assert.match(f.requests[0].Notes,/^'/);assert.equal(f.lookup().code,'USED');});
test('second request key cannot exceed allowance',()=>{const f=fixture(),p=f.payload();f.call('submit',p);p.requestKey=crypto.randomUUID();assert.equal(f.call('submit',p).code,'USED');});
test('edited recipient invalidates previously opened form',()=>{const f=fixture(),p=f.payload();f.rec.FirstName='Different';assert.equal(f.call('submit',p).code,'CHANGED');assert.equal(f.requests.length,0);});
test('modified session rejected',()=>{const f=fixture(),p=f.payload();p.session+='x';assert.equal(f.call('submit',p).code,'SESSION');});
test('invalid service, dates, callback and consent rejected',()=>{for(const [k,v,code] of [['service','diagnostics','SERVICE'],['variant','4 BHK','SERVICE'],['dateOne','2020-01-01','DATES'],['dateTwo','2026-02-30','DATES'],['callbackWindow','Midnight','DETAILS'],['consent',false,'DETAILS']]){const f=fixture(),p=f.payload();p[k]=v;assert.equal(f.call('submit',p).code,code);assert.equal(f.requests.length,0);}});
test('sheet contact cannot be overridden by client',()=>{const f=fixture(),p=f.payload();p.mobile='9999999999';p.company='Spoof';assert.equal(f.call('submit',p).ok,true);assert.equal(f.requests[0].CallbackMobile,'9000000000');assert.equal(f.requests[0].CustomerCompany,'Demo Only');});
test('missing registered contact blocks saving',()=>{const f=fixture();f.rec.Mobile='';const p=f.payload();assert.equal(f.call('submit',p).code,'CONTACT');});
test('lookup throttle stops repeated attempts',()=>{const f=fixture();for(let i=0;i<12;i++)f.lookup();assert.equal(f.lookup().code,'RATE_LIMIT');});
test('changing payload after save cannot silently create another request',()=>{const f=fixture(),p=f.payload();f.call('submit',p);p.city='Delhi';assert.equal(f.call('submit',p).code,'DUPLICATE');assert.equal(f.requests.length,1);});

test('confirmed AC, shoe and car package choices save unchanged to Requests',()=>{
 const packages={ac:['Dry Servicing','Jet Servicing'],shoe:['Canvas / Mesh Sneakers','Suede / Nubuck Shoes','Leather Boots / Formals','Luxury / Designer Sneakers'],wash:['Exterior Foam Wash & Wax','Interior Spa / Deep Cleaning']};
 for(const [id,options] of Object.entries(packages))for(const variant of options){
  const f=fixture();f.services.push({ServiceID:id,ServiceName:id,Enabled:true,Options:options.join('; ')});
  const p={...f.payload(),service:id,variant};assert.equal(f.call('submit',p).ok,true,variant);assert.equal(f.requests[0].ServiceVariant,variant);
 }
});
test('saved request emails Rose once and supports an optional alternate date',()=>{const f=fixture(),p=f.payload();p.dateTwo='';const saved=f.call('submit',p);assert.equal(saved.ok,true);assert.equal(f.emails.length,1);assert.equal(f.emails[0].to,'rose.chellam@symboinsurance.com');assert.equal(f.emails[0].subject,'ALERT | CONCIERGE DUTY - REQUEST RECEIVED');assert.match(f.emails[0].body,/Test address/);assert.equal(f.requests[0].NotificationStatus,'Sent');f.call('submit',p);assert.equal(f.emails.length,1);});
test('mail failure keeps the saved request and records a retryable failure',()=>{const f=fixture(),p=f.payload();f.failMail();assert.equal(f.call('submit',p).ok,true);assert.equal(f.requests[0].NotificationStatus,'Failed');assert.equal(f.requests.length,1);});
test('lookup does not expose the full registered email or phone',()=>{const f=fixture(),r=f.lookup();assert.equal(r.recipient.maskedMobile,'******0000');assert.ok(!('email' in r.recipient));assert.ok(!('mobile' in r.recipient));});
