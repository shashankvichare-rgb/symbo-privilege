// Paste into the Apps Script project bound to your existing private spreadsheet.
// This code NEVER creates, changes or regenerates card IDs or recipient records.
function initializeProperties() {
  var p=PropertiesService.getScriptProperties();
  if (!p.getProperty('SPREADSHEET_ID')) p.setProperty('SPREADSHEET_ID','10zMXtm79Iri3OruEj7Z9Kz23iqbxygI1Od0tg2uKXFo');
  if (!p.getProperty('BACKEND_SECRET')) p.setProperty('BACKEND_SECRET',Utilities.getUuid()+Utilities.getUuid());
}
function output_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function fail_(code,message) { var e=new Error(message); e.publicCode=code; throw e; }
function truth_(v) { return String(v).toLowerCase()==='true'; }
function secret_() { return PropertiesService.getScriptProperties().getProperty('BACKEND_SECRET')||''; }
var ALERT_RECIPIENT = 'rose.chellam@symboinsurance.com';
var ALERT_SUBJECT = 'ALERT | CONCIERGE DUTY - REQUEST RECEIVED';
var ALERT_HEADERS = ['NotificationStatus','NotificationError','NotificationSentAt'];
function installConciergeAlerts() {
  var sheet=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')).getSheetByName('Requests');
  var headers=sheet.getDataRange().getValues()[0];
  ALERT_HEADERS.forEach(function(h){if(headers.indexOf(h)<0){headers.push(h);if(sheet.getMaxColumns()<headers.length)sheet.insertColumnsAfter(sheet.getMaxColumns(),headers.length-sheet.getMaxColumns());sheet.getRange(1,headers.length).setValue(h);}});
  var triggers=ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='retryConciergeAlerts';});
  if(!triggers.length)ScriptApp.newTrigger('retryConciergeAlerts').timeBased().everyMinutes(5).create();
}
function setAlertFields_(sheet,headers,row,status,error,sentAt) {
  [['NotificationStatus',status],['NotificationError',error||''],['NotificationSentAt',sentAt||'']].forEach(function(pair){var index=headers.indexOf(pair[0]);if(index>=0)sheet.getRange(row,index+1).setValue(pair[1]);});
}
function sendAlert_(sheet,headers,row,record) {
  var fields=[['Request reference',record.RequestID],['Test record',truth_(record.TestRecord)?'YES':'NO'],['Submitted at',record.SubmittedAt],['Privilege ID',record.PrivilegeID],['Name',record.CustomerName],['Company',record.CustomerCompany],['Email',record.CustomerEmail],['Mobile',record.CallbackMobile],['Service',record.Service],['Service option',record.ServiceVariant],['City',record.City],['Pincode',record.Pincode],['Address',record.Address],['Preferred date',record.PreferredDate],['Alternate date',record.AlternateDate||'Not provided'],['Preferred callback time',record.CallbackWindow],['Notes',record.Notes||'None'],['Status',record.Status],['Internal remarks',record.InternalRemarks]];
  try {
    MailApp.sendEmail(ALERT_RECIPIENT,ALERT_SUBJECT,fields.map(function(x){return x[0]+': '+String(x[1]||'');}).join('\n'));
    setAlertFields_(sheet,headers,row,'Sent','',new Date().toISOString());
  } catch(e) {setAlertFields_(sheet,headers,row,'Failed',String(e.message||e).slice(0,400),'');}
}
function retryConciergeAlerts() {
  var lock=LockService.getScriptLock();if(!lock.tryLock(5000))return;
  try {
    var book=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
    var t=table_(book,'Requests');
    if(ALERT_HEADERS.some(function(h){return t.headers.indexOf(h)<0;}))return;
    t.rows.forEach(function(r,i){if(r.RequestID&&['Pending','Failed'].indexOf(String(r.NotificationStatus))>=0)sendAlert_(t.sheet,t.headers,i+2,r);});
  } finally {lock.releaseLock();}
}
function same_(a,b) { a=String(a);b=String(b);var x=a.length^b.length;for(var i=0;i<Math.max(a.length,b.length);i++)x|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return x===0; }
function hash_(s) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s)).replace(/=+$/,''); }
function mac_(s) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(s,secret_())).replace(/=+$/,''); }
function table_(book,name) {
  var sheet=book.getSheetByName(name); if(!sheet)fail_('SETUP','The concierge service is being prepared.');
  var data=sheet.getDataRange().getValues(); var headers=data.shift();
  return {sheet:sheet,headers:headers,rows:data.map(function(row){var o={};headers.forEach(function(h,i){o[h]=row[i];});return o;})};
}
function fingerprint_(r) {return hash_(JSON.stringify([r.PrivilegeID,r.FirstName,r.LastName,r.Email,String(r.Mobile),r.Company,r.Designation,r.TestRecord]));}
function session_(r) { var text=Utilities.base64EncodeWebSafe(JSON.stringify({id:r.PrivilegeID,fp:fingerprint_(r),exp:Date.now()+1800000})).replace(/=+$/,'');return text+'.'+mac_(text); }
function decodeSession_(token) {
  if(typeof token!=='string'||token.length>1500)fail_('SESSION','Please reload and enter your card ID again.');
  var parts=token.split('.');if(parts.length!==2||!same_(mac_(parts[0]),parts[1]))fail_('SESSION','Please reload and enter your card ID again.');
  var value;try{value=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());}catch(e){fail_('SESSION','Please reload and enter your card ID again.');}
  if(!value||value.exp<Date.now())fail_('SESSION','Your session has expired. Please reload and enter your card ID again.');
  return value;
}
function rate_(client,action) {
  if(!/^[a-f0-9]{64}$/.test(client||''))fail_('INVALID','Invalid connection.');
  var cache=CacheService.getScriptCache();var bucket=Math.floor(Date.now()/600000);
  var key='rate:'+client+':'+action+':'+bucket;var count=Number(cache.get(key)||0);
  if(count>= (action==='lookup'?12:20))fail_('RATE_LIMIT','Too many attempts. Please wait 10 minutes or contact your concierge.');
  cache.put(key,String(count+1),600);
}
function dateKey_(v) {
  if(v instanceof Date)return Utilities.formatDate(v,'Asia/Kolkata','yyyy-MM-dd');
  return String(v||'').trim();
}
function validDate_(s) {return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
function recipient_(book,id,settings) {
  if(!/^SYM-DIW26-\d{5}$/.test(id||''))fail_('CARD','We could not open this card. Check the ID or contact your concierge.');
  var matches=table_(book,'Recipients').rows.filter(function(r){return r.PrivilegeID===id;});
  if(matches.length!==1)fail_('CARD','We could not open this card. Check the ID or contact your concierge.');
  var r=matches[0];var test=truth_(r.TestRecord);
  if(r.CardStatus!=='Active'||(!test&&!truth_(r.CardIssued))||(settings.CampaignMode==='TEST'&&!test))fail_('CARD','We could not open this card. Check the ID or contact your concierge.');
  var today=Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd');var until=dateKey_(r.ValidUntil);
  if((!test&&!validDate_(until))||(until&&(!validDate_(until)||until<today)))fail_('CARD','This card is unavailable. Please contact your concierge.');
  if(!r.FirstName||!r.Company)fail_('CARD','Your card details are being prepared. Please contact your concierge.');
  return r;
}
function services_(book,r) {
  var allowed=String(r.AllowedServices||'').split(',').map(function(x){return x.trim();});
  return table_(book,'Services').rows.filter(function(s){return truth_(s.Enabled)&&allowed.indexOf(s.ServiceID)>=0;}).map(function(s){return {
    id:String(s.ServiceID),name:String(s.ServiceName),desc:String(s.ComplimentaryScope||''),
    options:String(s.Options||'').split(';').map(function(x){x=x.trim();return (s.ServiceID==='clean'||s.ServiceID==='pest')&&x==='3 BHK'?'3 BHK or larger':x;}).filter(Boolean),
    extra:String(s.ExtraChargeCondition||''),conditions:String(s.Conditions||'')
  };});
}
function allowance_(r,requests) {
  var max=Number(r.MaxRedemptions);if(!Number.isInteger(max)||max<1)fail_('CARD','Please contact your concierge about this card.');
  // Only an explicit staff status of Released returns an allowance. Cancellation alone does not.
  var used=requests.filter(function(q){return q.PrivilegeID===r.PrivilegeID&&q.Status!=='Released';}).length;
  if(used>=max)fail_('USED','A request has already been received for this card. Please contact your concierge for changes.');
}
function text_(o,key,max,min) {var s=String(o[key]||'').trim();if(s.length<(min||0)||s.length>max)fail_('DETAILS','Please check '+key+'.');return s;}
function safeCell_(v) {return typeof v==='string'&&/^[\s]*[=+\-@]/.test(v)?"'"+v:v;}
function doGet() {return output_({ok:false,message:'Please use symboconcierge.in.'});}
function doPost(e) {
  var lock;
  try {
    if(!e||!e.postData||e.postData.contents.length>16000)fail_('INVALID','Invalid request.');
    var body=JSON.parse(e.postData.contents);
    if(secret_().length<32||!same_(body.secret||'',secret_()))fail_('AUTH','Invalid request.');
    if(['lookup','submit'].indexOf(body.action)<0)fail_('INVALID','Invalid request.');
    lock=LockService.getScriptLock();if(!lock.tryLock(5000))fail_('BUSY','Please wait a moment and retry.');
    rate_(body.clientHash,body.action);
    var book=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
    var settings={};table_(book,'Settings').rows.forEach(function(r){settings[r.Key]=String(r.Value);});
    if(!truth_(settings.CampaignActive))fail_('PAUSED','Your concierge experience is being prepared. Please try again shortly.');
    if(['TEST','LIVE'].indexOf(settings.CampaignMode)<0)fail_('SETUP','The concierge service is being prepared.');
    if(settings.CampaignMode==='LIVE'&&(!truth_(settings.LaunchApproved)||!settings.PolicyVersion))fail_('SETUP','The concierge service is being prepared.');
    var p=body.payload||{};var session=body.action==='submit'?decodeSession_(p.session):null;
    var r=recipient_(book,session?session.id:p.id,settings);
    if(session&&session.fp!==fingerprint_(r))fail_('CHANGED','Your card details have changed. Please reload and enter your ID again.');
    var requests=table_(book,'Requests');
    if(body.action==='lookup') {
      allowance_(r,requests.rows);
      var mobile=String(r.Mobile||'').replace(/\D/g,'').replace(/^91(?=\d{10}$)/,'');
      var contactReady=/^[6-9]\d{9}$/.test(mobile)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r.Email||''));
      return output_({ok:true,session:session_(r),recipient:{id:r.PrivilegeID,firstName:r.FirstName,lastName:r.LastName,company:r.Company,maskedMobile:mobile.length===10?'******'+mobile.slice(-4):'',contactReady:contactReady},
        services:services_(book,r),copy:{greeting:settings.GreetingTemplate,headline:settings.HeroHeadline,description:settings.HeroDescription,terms:settings.TermsText,privacy:settings.PrivacyText,callback:settings.CallbackPromise},test:truth_(r.TestRecord)});
    }
    if(!/^[a-f0-9-]{36}$/i.test(p.requestKey||''))fail_('INVALID','Invalid request reference. Please reload.');
    var previous=requests.rows.find(function(q){return q.PrivilegeID===r.PrivilegeID&&q.IdempotencyKey===p.requestKey;});
    var payloadHash=hash_(JSON.stringify([p.service,p.variant,p.city,p.pincode,p.address,p.dateOne,p.dateTwo,p.callbackWindow,p.notes,p.consent]));
    if(previous){if(previous.PayloadHash!==payloadHash)fail_('DUPLICATE','A request was already saved. Contact the concierge to change it.');return output_({ok:true,requestId:previous.RequestID,duplicate:true});}
    allowance_(r,requests.rows);
    var service=services_(book,r).find(function(s){return s.id===p.service;});
    if(!service||service.options.indexOf(p.variant)<0)fail_('SERVICE','Please select an available service and option.');
    var phone=String(r.Mobile||'').replace(/\D/g,'').replace(/^91(?=\d{10}$)/,'');
    if(!/^[6-9]\d{9}$/.test(phone))fail_('CONTACT','Please ask your concierge to add or correct the mobile number registered on your card.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(r.Email||'')))fail_('CONTACT','Please ask your concierge to add or correct the email registered on your card.');
    var city=text_(p,'city',100,2),address=text_(p,'address',500,8),pin=text_(p,'pincode',6,6),notes=text_(p,'notes',300,0);
    if(!/^[1-9]\d{5}$/.test(pin))fail_('DETAILS','Please enter a valid six-digit pincode.');
    if(settings.ServiceabilityMode==='ALLOWLIST'&&String(settings.ServicePincodes||'').split(',').map(function(x){return x.trim();}).indexOf(pin)<0)fail_('COVERAGE','Please contact your concierge to check coverage at this pincode.');
    if(['MANUAL','ALLOWLIST'].indexOf(settings.ServiceabilityMode)<0)fail_('SETUP','Please contact your concierge to check location coverage.');
    var today=Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd');
    if(!validDate_(p.dateOne)||(p.dateTwo&&(!validDate_(p.dateTwo)||p.dateTwo<p.dateOne))||p.dateOne<=today)fail_('DATES','Choose a future preferred date and, if provided, an alternate date on or after it.');
    if(['10 am – 1 pm','1 pm – 4 pm','4 pm – 7 pm'].indexOf(p.callbackWindow)<0||p.consent!==true)fail_('DETAILS','Select a callback window and accept the terms.');
    var requestId='SC-'+Utilities.getUuid().slice(0,8).toUpperCase();var now=new Date().toISOString();
    var extra=(service.id==='clean'||service.id==='pest')&&p.variant==='3 BHK or larger';
    var record={RequestID:requestId,SubmittedAt:now,PrivilegeID:r.PrivilegeID,CustomerName:[r.FirstName,r.LastName].filter(Boolean).join(' '),CallbackMobile:phone,Service:service.name,ServiceVariant:p.variant,City:city,Pincode:pin,Address:address,PreferredDate:p.dateOne,AlternateDate:p.dateTwo||'',CallbackWindow:p.callbackWindow,Notes:notes,ConsentAt:now,Status:'New',AssignedTo:'',LastContactedAt:'',ConfirmedServiceDate:'',CompletedAt:'',InternalRemarks:(extra?'3 BHK or larger: quote amount above 2 BHK and get approval before booking. ':'')+'Policy version: '+(settings.PolicyVersion||'TEST DRAFT'),IdempotencyKey:p.requestKey,PayloadHash:payloadHash,TestRecord:truth_(r.TestRecord),CustomerEmail:String(r.Email||''),CustomerCompany:String(r.Company||''),CustomerDesignation:String(r.Designation||''),NotificationStatus:'Pending',NotificationError:'',NotificationSentAt:''};
    ['RequestID','PrivilegeID','IdempotencyKey','PayloadHash','CustomerCompany','CustomerEmail'].concat(ALERT_HEADERS).forEach(function(h){if(requests.headers.indexOf(h)<0)fail_('SETUP','The request sheet needs configuration.');});
    requests.sheet.appendRow(requests.headers.map(function(h){return safeCell_(record[h]===undefined?'':record[h]);}));
    SpreadsheetApp.flush();try{sendAlert_(requests.sheet,requests.headers,requests.sheet.getLastRow(),record);}catch(notificationError){console.error('Concierge alert update failed: '+notificationError);}return output_({ok:true,requestId:requestId});
  } catch(error) {return output_({ok:false,code:error.publicCode||'UNAVAILABLE',message:error.publicCode?error.message:'The service is temporarily unavailable. Please try again or contact your concierge.'});}
  finally {if(lock&&lock.hasLock())lock.releaseLock();}
}
