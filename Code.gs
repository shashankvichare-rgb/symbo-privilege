/* Symbo Privilege • bound to the existing campaign spreadsheet. No OTP.
 * Deploy as owner / Anyone. BACKEND_SECRET is checked on every POST.
 * Requests are only accepted after explicit TEST/LIVE configuration.
 */
var SOURCE_ID = '10zMXtm79Iri3OruEj7Z9Kz23iqbxygI1Od0tg2uKXFo';
var RH = ['PrivilegeID','Name','Designation','Company','Email','Mobile','QRToken','AllowedServices','MaxRedemptions','ValidUntil','Active','QRURL','CardIssued'];
var QH = ['RequestID','SubmittedAt','PrivilegeID','CustomerName','CallbackMobile','Service','ServiceVariant','City','Pincode','Address','PreferredDate','AlternateDate','CallbackWindow','Notes','ConsentAt','Status','AssignedTo','LastContactedAt','ConfirmedServiceDate','CompletedAt','InternalRemarks','IdempotencyKey','PayloadHash','TestRecord'];
var SERVICE = {
 ac: {name:'AC Care',description:'Dry or wet servicing for one AC.',variants:['Dry service','Wet service','Not sure, advise me']},
 clean: {name:'Festive Home Cleaning',description:'Home cleaning for an eligible 1, 2 or 3 BHK residence.',variants:['1 BHK','2 BHK','3 BHK']},
 pest: {name:'Home Pest Protection',description:'Pest-control service for an eligible 1, 2 or 3 BHK residence.',variants:['1 BHK','2 BHK','3 BHK']},
 shoe: {name:'Shoe Revival',description:'Professional cleaning for one eligible pair of shoes.',variants:['One pair']},
 wash: {name:'Vehicle Refresh',description:'A one-time wash for an eligible car.',variants:['One car']}
};
function onOpen(){ SpreadsheetApp.getUi().createMenu('Symbo Privilege')
 .addItem('1. Set up campaign tabs','setupCampaign')
 .addItem('2. Generate missing tokens and QR links','generateLinks')
 .addItem('3. Validate recipient configuration','validateRecipients')
 .addToUi(); }
function book_(){var id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'); if(!id) fail_('SETUP','Run setupCampaign first.');return SpreadsheetApp.openById(id);}
function fail_(code,message){var e=new Error(message);e.code=code;throw e;}
function text_(v){return v===null||v===undefined?'':String(v).trim();}
function safe_(v){var s=String(v===undefined?'':v);return /^[\s]*[=+@\-]/.test(s)?"'"+s:s;}
function tab_(ss,name,headers){var s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);if(s.getLastRow()===0)s.getRange(1,1,1,headers.length).setValues([headers]);
 var h=s.getRange(1,1,1,headers.length).getValues()[0];if(JSON.stringify(h)!==JSON.stringify(headers))fail_('SCHEMA','Unexpected columns in '+name+'. Restore documented headers before continuing.');return s;}
function table_(ss,name,headers){var s=ss.getSheetByName(name);if(!s)fail_('SETUP','Missing '+name+' tab.');var all=s.getDataRange().getValues();if(JSON.stringify(all[0])!==JSON.stringify(headers))fail_('SCHEMA','Unexpected '+name+' headers.');return {sheet:s,rows:all.slice(1).filter(function(r){return r.some(function(v){return v!=='';});}).map(function(r){var o={};headers.forEach(function(h,i){o[h]=r[i];});return o;})};}
function settings_(ss){var s=ss.getSheetByName('Settings');if(!s)fail_('SETUP','Missing Settings.');var a=s.getDataRange().getValues(),o={};a.slice(1).forEach(function(r){o[r[0]]=text_(r[1]);});return o;}
function yes_(v){return v===true||text_(v).toUpperCase()==='TRUE';}
function test_(id){return /^SYM-TEST-\d{4}$/.test(id);}
function setupCampaign(){
 var ss=SpreadsheetApp.getActiveSpreadsheet();if(ss.getId()!==SOURCE_ID)throw new Error('Open Apps Script from the original Symbo Privilege sheet.');
 var lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
 var props=PropertiesService.getScriptProperties();props.setProperty('SPREADSHEET_ID',ss.getId());
 if(!props.getProperty('BACKEND_SECRET'))props.setProperty('BACKEND_SECRET',Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,''));
 var rec=tab_(ss,'Recipients',RH),req=tab_(ss,'Requests',QH),set=tab_(ss,'Settings',['Key','Value','Notes']);
 if(rec.getLastRow()===1){
  var source=ss.getSheetByName('Sheet1');if(!source)throw new Error('Sheet1 not found. No contacts copied.');
  var old=source.getDataRange().getValues();if(JSON.stringify(old[0].slice(0,6))!==JSON.stringify(RH.slice(0,6)))throw new Error('Sheet1 header mismatch.');
  var seed=old.slice(1).filter(function(r){return text_(r[0]);}).map(function(r){var isTest=test_(text_(r[0]));return [r[0],r[1],r[2],r[3],r[4],text_(r[5])==='Leave blank'?'':r[5],'','ac,clean,pest,shoe,wash',1,'',isTest,'',false];});
  if(seed.length){rec.getRange(2,1,seed.length,RH.length).setNumberFormat('@').setValues(seed.map(function(r){return r.map(safe_);}));}
 }
 if(set.getLastRow()===1){var settings=[
 ['CampaignName','Symbo Privilege — Diwali 2026','Displayed title'],
 ['WebsiteURL','','Final HTTPS Netlify origin only; no trailing path'],
 ['ConciergeNumber','918657918455','Digits incl. country code'],
 ['CallbackPromise','Your concierge will call to confirm the details and arrange your service.','Set only an operationally approved callback promise'],
 ['CampaignActive','TRUE','FALSE pauses lookup and new submissions'],
 ['CampaignMode','TEST','TEST accepts only SYM-TEST IDs; LIVE accepts active real and test IDs'],
 ['LaunchApproved','FALSE','Set TRUE only after offer, privacy and operations review'],
 ['ServiceabilityMode','MANUAL','MANUAL: concierge checks pincode. ALLOWLIST: use ServicePincodes'],
 ['ServicePincodes','','Comma-separated six digit pincodes for ALLOWLIST; applies to all five services'],
 ['TermsText','Choose one complimentary service from your permitted options. Requested dates and location availability are confirmed by your concierge. No payment is collected on this page.','Draft: replace/approve before live launch. Include scope, extras, expiry, cancellation, transferability'],
 ['PrivacyText','We use the details you submit to coordinate your requested service and may share necessary booking details with the selected fulfilment partner.','Draft: add approved legal entity, contact, retention and rights information'],
 ['PolicyVersion','','Enter an approved policy version or date before LIVE launch']
 ];set.getRange(2,1,settings.length,3).setValues(settings);}
 [rec,req,set].forEach(function(s){s.setFrozenRows(1);s.getRange(1,1,1,s.getLastColumn()).setFontWeight('bold').setBackground('#013a51').setFontColor('#ffffff');});
 rec.getRange('F2:G'+rec.getMaxRows()).setNumberFormat('@');req.getRange('E2:E'+req.getMaxRows()).setNumberFormat('@');req.getRange('I2:I'+req.getMaxRows()).setNumberFormat('@');
 var statuses=['New','Contact attempted','Customer reached','Eligibility checked','Vendor assigned','Booking confirmed','Completed','Cancelled','Unable to fulfil'];
 req.getRange(2,16,req.getMaxRows()-1,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(statuses,true).setAllowInvalid(false).build());
 SpreadsheetApp.flush();
 }finally{lock.releaseLock();}
 ss.toast('Ready. Sheet1 is unchanged. Fill TEST expiry dates, then generate links.');
}
function date_(v){if(v instanceof Date)return Utilities.formatDate(v,'Asia/Kolkata','yyyy-MM-dd');return text_(v);}
function today_(){return Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd');}
function iso_(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;var d=new Date(s+'T00:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
function website_(v){if(!/^https:\/\/[a-z0-9][a-z0-9.-]*(?::\d+)?\/?$/i.test(v))fail_('SETUP','Set WebsiteURL to the final HTTPS site origin.');return v.replace(/\/$/,'');}
function generateLinks(){var ss=book_(),lock=LockService.getScriptLock();lock.waitLock(20000);try{
 var t=table_(ss,'Recipients',RH),site=website_(settings_(ss).WebsiteURL);var seen={};
 // Validate all IDs before any write; fill blank IDs once without row-number formulas.
 t.rows.forEach(function(r){if(r.PrivilegeID){if(seen[r.PrivilegeID])fail_('DUPLICATE_ID','Duplicate PrivilegeID.');seen[r.PrivilegeID]=true;}});
 var data=t.sheet.getDataRange().getValues().slice(1),i=1;
 data.forEach(function(r){if(!r.some(function(v){return v!=='';}))return;
 if(!text_(r[0])){while(seen['SYM-DIW26-'+String(i).padStart(4,'0')])i++;r[0]='SYM-DIW26-'+String(i++).padStart(4,'0');seen[r[0]]=true;}
 if(!text_(r[6]))r[6]=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
 if(!/^[a-f0-9]{64}$/.test(text_(r[6])))fail_('TOKEN','Invalid token. Do not edit or regenerate issued tokens.');
 r[11]=site+'/?token='+r[6];
 });
 var tokens=data.filter(function(r){return r[0];}).map(function(r){return r[6];});if(new Set(tokens).size!==tokens.length)fail_('TOKEN','Duplicate QR tokens.');
 // Only write ID/token/URL columns; preserve recipient fields, booleans and dates.
 data.forEach(function(r,index){if(!r[0])return;t.sheet.getRange(index+2,1).setValue(r[0]);t.sheet.getRange(index+2,7).setValue(r[6]);t.sheet.getRange(index+2,12).setValue(r[11]);});
 SpreadsheetApp.flush();ss.toast('Tokens preserved; missing tokens and links generated.');
 }finally{lock.releaseLock();}}
function validateRecipients(){var ss=book_(),t=table_(ss,'Recipients',RH),errors=[],ids={},tokens={};t.rows.forEach(function(r){
 var id=text_(r.PrivilegeID);if(!id||ids[id])errors.push(id+': missing/duplicate ID');ids[id]=true;
 if(!/^[a-f0-9]{64}$/.test(text_(r.QRToken))||tokens[r.QRToken])errors.push(id+': missing/duplicate token');tokens[r.QRToken]=true;
 try{rowConfig_(r);}catch(e){errors.push(id+': '+e.message);}
 });SpreadsheetApp.getUi().alert(errors.length?errors.join('\n'):'All recipient rows have valid configuration.');}
function rowConfig_(r){var services=text_(r.AllowedServices).split(',').map(function(x){return x.trim();}).filter(Boolean),n=Number(r.MaxRedemptions),date=date_(r.ValidUntil);
 if(!services.length||services.some(function(x){return !SERVICE[x];}))fail_('SETUP','Invalid AllowedServices.');
 if(!Number.isInteger(n)||n<1||n>10)fail_('SETUP','MaxRedemptions must be 1–10.');
 if(!iso_(date))fail_('SETUP','ValidUntil must be YYYY-MM-DD.');return {services:services,max:n,date:date};}
function policy_(s){return {phone:s.ConciergeNumber||'918657918455',callback:s.CallbackPromise,terms:s.TermsText,privacy:s.PrivacyText,version:s.PolicyVersion||'TEST-DRAFT',manual:s.ServiceabilityMode==='MANUAL'};}
function eligible_(ss,token){
 if(!/^[a-f0-9]{64}$/.test(text_(token)))fail_('INVALID','This privilege link is invalid. Please contact your concierge.');
 var s=settings_(ss);if(!yes_(s.CampaignActive))fail_('PAUSED','Requests are currently paused. Please contact your concierge.');
 if(['TEST','LIVE'].indexOf(s.CampaignMode)<0)fail_('SETUP','Campaign mode is not configured.');
 if(s.CampaignMode==='LIVE'&&(!yes_(s.LaunchApproved)||!s.PolicyVersion||!s.TermsText||!s.PrivacyText))fail_('SETUP','The campaign is not ready to accept requests.');
 if(['MANUAL','ALLOWLIST'].indexOf(s.ServiceabilityMode)<0)fail_('SETUP','Serviceability is not configured.');
 var matches=table_(ss,'Recipients',RH).rows.filter(function(r){return text_(r.QRToken)===token;});if(matches.length!==1)fail_('INVALID','This privilege link is invalid. Please contact your concierge.');
 var r=matches[0];if(s.CampaignMode==='TEST'&&!test_(text_(r.PrivilegeID)))fail_('NOT_LIVE','This invitation is not active yet.');
 if(!yes_(r.Active))fail_('INACTIVE','This invitation is not active. Please contact your concierge.');
 var cfg=rowConfig_(r);if(cfg.date<today_())fail_('EXPIRED','This invitation has expired. Please contact your concierge.');
 return {recipient:r,config:cfg,settings:s};
}
function used_(rows,id){return rows.filter(function(q){return q.PrivilegeID===id;}).length;} // All statuses count; no automatic allowance restoration.
function lookup_(ss,token){var e=eligible_(ss,token),r=e.recipient,used=used_(table_(ss,'Requests',QH).rows,r.PrivilegeID);
 return {ok:true,recipient:{id:r.PrivilegeID,name:r.Name,firstName:text_(r.Name).split(/\s+/)[0]},services:e.config.services.map(function(k){var s=SERVICE[k];return {id:k,name:s.name,description:s.description,variants:s.variants};}),remaining:Math.max(0,e.config.max-used),validUntil:e.config.date,testRecord:test_(r.PrivilegeID),policy:policy_(e.settings)};
}
function field_(p,key,min,max){var v=text_(p[key]);if(v.length<min||v.length>max)fail_('VALIDATION','Check '+key+'.');return v;}
function cleanRequest_(p,e){if(!p||typeof p!=='object'||Array.isArray(p))fail_('VALIDATION','Invalid request.');
 if(text_(p.website))fail_('VALIDATION','Unable to submit.');
 var service=field_(p,'service',1,20);if(e.config.services.indexOf(service)<0)fail_('SERVICE','That service is not included with this invitation.');
 var variant=field_(p,'variant',1,50);if(SERVICE[service].variants.indexOf(variant)<0)fail_('VALIDATION','Choose a valid service option.');
 var mobile=field_(p,'mobile',10,16).replace(/[\s+()-]/g,'');if(mobile.length===12&&mobile.indexOf('91')===0)mobile=mobile.slice(2);if(!/^[6-9]\d{9}$/.test(mobile))fail_('VALIDATION','Enter a valid 10-digit Indian mobile number.');
 var pin=field_(p,'pincode',6,6);if(!/^[1-9]\d{5}$/.test(pin))fail_('VALIDATION','Enter a valid six-digit pincode.');
 if(e.settings.ServiceabilityMode==='ALLOWLIST'&&text_(e.settings.ServicePincodes).split(',').map(function(v){return v.trim();}).indexOf(pin)<0)fail_('UNAVAILABLE','This pincode is not available. Contact your concierge for help.');
 var preferred=field_(p,'preferredDate',10,10),alternate=text_(p.alternateDate);if(!iso_(preferred)||preferred<today_())fail_('VALIDATION','Choose a current or future preferred date.');
 if(alternate&&(!iso_(alternate)||alternate<today_()||alternate===preferred))fail_('VALIDATION','Choose a different current or future alternate date.');
 var window=field_(p,'callbackWindow',1,30);if(['10 am – 1 pm','1 pm – 4 pm','4 pm – 7 pm'].indexOf(window)<0)fail_('VALIDATION','Choose a callback window.');
 if(p.consent!==true)fail_('CONSENT','Please accept service coordination and the terms.');
 if(p.policyVersion!==policy_(e.settings).version)fail_('POLICY_CHANGED','Terms have changed. Reload the page and review them.');
 var key=field_(p,'idempotencyKey',16,80);if(!/^[a-zA-Z0-9-]+$/.test(key))fail_('VALIDATION','Invalid request reference. Reload and retry.');
 return {name:field_(p,'name',1,120),mobile:mobile,service:service,variant:variant,city:field_(p,'city',2,100),pincode:pin,address:field_(p,'address',8,600),preferredDate:preferred,alternateDate:alternate,callbackWindow:window,notes:field_(p,'notes',0,1000),policyVersion:p.policyVersion,idempotencyKey:key};
}
function hash_(v){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,v).map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');}
function submit_(ss,token,p){var lock=LockService.getScriptLock();if(!lock.tryLock(15000))fail_('BUSY','Please retry in a moment.');try{
 var e=eligible_(ss,token),c=cleanRequest_(p,e),q=table_(ss,'Requests',QH),digest=hash_(JSON.stringify(c)),prior=q.rows.filter(function(r){return r.PrivilegeID===e.recipient.PrivilegeID&&r.IdempotencyKey===c.idempotencyKey;});
 if(prior.length){if(prior[0].PayloadHash!==digest)fail_('RETRY_CHANGED','This request was already saved with different details. Contact your concierge.');return {ok:true,requestId:prior[0].RequestID,replayed:true,policy:policy_(e.settings),testRecord:test_(e.recipient.PrivilegeID)};}
 if(used_(q.rows,e.recipient.PrivilegeID)>=e.config.max)fail_('REDEEMED','Your privilege has already been requested. Contact your concierge for changes.');
 var now=new Date().toISOString(),id='REQ-2026-'+Utilities.getUuid().replace(/-/g,'').slice(0,12).toUpperCase();
 var row=[id,now,e.recipient.PrivilegeID,c.name,c.mobile,c.service,c.variant,c.city,c.pincode,c.address,c.preferredDate,c.alternateDate,c.callbackWindow,c.notes,now,'New','','','','','Policy '+c.policyVersion,c.idempotencyKey,digest,test_(e.recipient.PrivilegeID)?'TRUE':'FALSE'];
 q.sheet.getRange(q.sheet.getLastRow()+1,1,1,QH.length).setNumberFormat('@').setValues([row.map(safe_)]);SpreadsheetApp.flush();
 return {ok:true,requestId:id,replayed:false,policy:policy_(e.settings),testRecord:test_(e.recipient.PrivilegeID)};
 }finally{lock.releaseLock();}}
function doGet(){return json_({ok:false,code:'METHOD',message:'Use the concierge website to submit your request.'});}
function doPost(event){try{
 if(!event||!event.postData||event.postData.contents.length>20000)fail_('VALIDATION','Invalid request.');var body=JSON.parse(event.postData.contents),secret=PropertiesService.getScriptProperties().getProperty('BACKEND_SECRET');
 if(!secret||secret.length<32||!equal_(text_(body.secret),secret))fail_('AUTH','Unable to authorise this request.');
 var ss=book_();if(body.action==='lookup')return json_(lookup_(ss,body.token));if(body.action==='submit')return json_(submit_(ss,body.token,body.request));fail_('ACTION','Invalid action.');
 }catch(e){return json_({ok:false,code:e.code||'SERVER',message:e.code?e.message:'We could not confirm your request. Please retry or contact your concierge.'});}}
function equal_(a,b){if(a.length!==b.length)return false;var n=0;for(var i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
