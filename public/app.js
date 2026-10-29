(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const phone = "918657918455";
  const windows = ["10 am – 1 pm", "1 pm – 4 pm", "4 pm – 7 pm"];
  const state = {screen:"welcome", recipient:null, session:"", services:[], service:"", variant:"", callback:"", copy:{}, key:crypto.randomUUID(), busy:false, submitted:false};
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const chosen = () => state.services.find(s => s.id === state.service);
  const catalog = window.SYMBO_SERVICE_CONTENT || {};
  const paths = {
    ac:'<rect x="3" y="4" width="18" height="8" rx="2"/><path d="M6 9h12M7 15v5m5-5v3m5-3v5"/>',
    clean:'<path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7m2-15v4m-2-2h4"/>',
    pest:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
    shoe:'<path d="M3 15 6 6l5 5 4 2 5 1 1 6H3zm0 2h18m-9-5-2 2m5-1-2 2"/>',
    wash:'<path d="m5 10 2-6h10l2 6M3 10h18v9H3zm3 9v2m12-2v2M6 14h2m8 0h2"/>',
    diagnostics:'<path d="M12 4v16M4 12h16"/>'
  };
  const icon = id => '<svg viewBox="0 0 24 24" aria-hidden="true">'+(paths[id]||paths.diagnostics)+'</svg>';
  $$("[data-gift-icon]").forEach(el=>{el.innerHTML=icon(el.dataset.giftIcon);});
  let dialogTrigger=null;
  function openDialog(trigger){dialogTrigger=trigger;$("#infoDialog").showModal();$("#infoDialog .dialog-inner").scrollTop=0;}
  function serviceInfo(id,trigger){
    const service=state.services.find(s=>s.id===id);if(!service)return;
    const content=catalog[id];
    $("#dialogEyebrow").textContent="Inclusions, exclusions & conditions";
    $("#dialogTitle").textContent=service.name;
    const sections=content?content.sections:[{title:"Service details",items:[service.desc,service.conditions,service.extra].filter(Boolean)}];
    $("#dialogBody").innerHTML='<p class="scope-note">'+esc(content?content.note:service.desc)+'</p>'+sections.map(section=>'<section class="service-terms-section"><h3>'+esc(section.title)+'</h3><ul>'+section.items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul></section>').join('')+'<p class="service-booking-note">Your concierge will confirm availability, scope and your preferred timing. Submitting a request does not confirm a booking.</p>';
    openDialog(trigger);
  }
  function screen(name) {
    state.screen=name;
    const showWelcomeAction=name==="welcome"&&!!state.recipient;
    $("#welcomeSticky").hidden=!showWelcomeAction;
    document.body.classList.toggle("has-welcome-action",showWelcomeAction);
    $$("[data-screen]").forEach(el=>{el.hidden=el.dataset.screen!==name;el.classList.toggle("is-active",!el.hidden);});
    const step={choose:1,details:2,review:3}[name];
    $("#stepStatus").hidden=!step;
    $("#backButton").hidden=!step;
    $("#privilegeChip").hidden=!!step;
    if(step){$("#stepText").textContent="Step "+step+" of 3";$$(".step-bars i").forEach((el,i)=>el.classList.toggle("is-filled",i<step));}
    window.scrollTo(0,0); $("#main").focus({preventScroll:true});
  }
  async function api(action,payload) {
    const response=await fetch("/.netlify/functions/concierge",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,payload}),cache:"no-store",signal:AbortSignal.timeout(25000)});
    let result;try {result=await response.json();} catch {throw new Error("The concierge connection is not ready yet. Please try again later.");}
    if(!response.ok || !result.ok)throw new Error(result.message||"Please try again or contact your concierge.");
    return result;
  }
  function helpLinks() {
    const message="Hello Symbo Concierge, I need help with my Diwali card."+(state.recipient?"\nPrivilege ID: "+state.recipient.id:"");
    $$(".whatsapp-help").forEach(a=>{a.href="https://wa.me/"+phone+"?text="+encodeURIComponent(message);a.target="_blank";a.rel="noopener noreferrer";});
  }
  function field(id,value){$("#"+id).value=value||"";}
  function fillRecipient(r) {
    field("fullName",[r.firstName,r.lastName].filter(Boolean).join(" "));
    field("company",r.company);
    $("#welcomeName").textContent=(state.copy.greeting||"Hey {FirstName},").replace("{FirstName}",r.firstName);
    $("#welcomeName").hidden=false;$("#privilegeChip").textContent=r.id;
    $("#recipientSummary").innerHTML="<strong>Your details</strong><dl class='recipient-details'><dt>Name</dt><dd>"+esc([r.firstName,r.lastName].filter(Boolean).join(" "))+"</dd><dt>Company Name</dt><dd>"+esc(r.company)+"</dd></dl>";
    $("#recipientSummary").hidden=false;
    if(state.copy.headline)$("#welcome-title").textContent=String(state.copy.headline).replace(/—/g,'-');
    if(state.copy.description)$("#heroDescription").textContent=String(state.copy.description).replace(/—/g,'-');
    $("#contactHint").textContent=r.contactReady===false?"Your registered contact details need an update. Please contact your concierge before submitting.":"We will call your registered number "+(r.maskedMobile||"on file")+". If your details are incorrect, contact your concierge before submitting.";
  }
  function renderServices(){
    $("#serviceList").innerHTML=state.services.map(s=>'<div class="service-card"><label class="service-option'+(s.id===state.service?' is-selected':'')+'"><input class="service-radio" type="radio" name="serviceChoice" value="'+esc(s.id)+'"'+(s.id===state.service?' checked':'')+'><span class="service-icon">'+icon(s.id)+'</span><span class="service-copy"><strong>'+esc(s.name)+'</strong><small>'+esc(s.desc)+'</small>'+(s.id==="clean"||s.id==="pest"?'<small class="service-charge">Complimentary up to 2 BHK. Additional charges for larger homes.</small>':'')+'</span><span class="radio-mark" aria-hidden="true">'+(s.id===state.service?'✓':'')+'</span></label><button type="button" class="service-info" data-service-info="'+esc(s.id)+'" aria-label="'+esc(s.name)+': check benefits and exclusions"><span aria-hidden="true">ⓘ</span> Check benefits &amp; exclusions</button></div>').join("");
    $$(".service-radio").forEach(input=>input.onchange=()=>{
      state.service=input.value;state.variant=chosen().options.length===1?chosen().options[0]:"";
      $$(".service-radio").forEach(el=>{el.closest(".service-option").classList.toggle("is-selected",el.checked);el.closest(".service-option").querySelector(".radio-mark").textContent=el.checked?"✓":"";});
      renderOptions();$("#choiceDialog").showModal();
    });
  }
  function renderOptions(){
    const s=chosen();$("#subError").hidden=true;
    if(!s)return;
    $("#choiceTitle").textContent=s.name;
    $("#subQuestion").textContent=catalog[s.id]?.question||"Choose your preference";
    $("#subOptions").innerHTML=s.options.map(v=>'<button class="pill'+(v===state.variant?' is-selected':'')+'" type="button" data-sub="'+esc(v)+'" aria-pressed="'+(v===state.variant)+'">'+esc(v)+(v==="3 BHK or larger"?" · additional charges":"")+'</button>').join("");
    $$("[data-sub]").forEach(b=>b.onclick=()=>{state.variant=b.dataset.sub;renderOptions();$$("[data-sub]").find(el=>el.dataset.sub===state.variant)?.focus({preventScroll:true});});
    $("#serviceConditions").hidden=false;
    $("#serviceConditions").textContent=catalog[s.id]?.note||[s.conditions,s.extra].filter(Boolean).join(" ");
  }
  function read(){
    const result={service:state.service,variant:state.variant,callbackWindow:state.callback,consent:$("#consent").checked};
    ["city","pincode","address","dateOne","dateTwo","notes"].forEach(k=>result[k]=$("#"+k).value.trim());
    return result;
  }
  function indiaTomorrow(){
    const now=new Date(Date.now()+86400000);
    return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  }
  function validate(){
    const p=read(),errors={city:p.city.length<2?"Enter your city.":"",pincode:!/^[1-9]\d{5}$/.test(p.pincode)?"Enter a six-digit pincode.":"",address:p.address.length<8?"Enter the full service address.":"",dateOne:!p.dateOne||p.dateOne<indiaTomorrow()?"Choose a future date.":"",dateTwo:p.dateTwo&&p.dateTwo<p.dateOne?"Choose an alternate date on or after your preferred date.":""};
    Object.entries(errors).forEach(([id,message])=>{const el=$("#"+id),parent=el.closest(".field");parent.classList.toggle("has-error",!!message);parent.querySelector(".field-error").textContent=message;el.setAttribute("aria-invalid",!!message);});
    $("#callError").textContent=p.callbackWindow?"":"Choose a callback window.";
    $("#consentError").textContent=p.consent?"":"Please accept the terms so we can arrange your service.";
    const first=Object.keys(errors).find(k=>errors[k]);if(first)$("#"+first).focus();
    return !first&&p.callbackWindow&&p.consent;
  }
  function renderReview(){
    const p=read(),r=state.recipient,s=chosen();
    const pairs=[["Name",[r.firstName,r.lastName].filter(Boolean).join(" ")],["Company Name",r.company],["Service",s.name+" · "+p.variant],["Address",p.address+", "+p.city+" – "+p.pincode],["Preferred date",p.dateOne],["Alternate date",p.dateTwo],["Callback window",p.callbackWindow],["Notes",p.notes]];
    if((s.id==="clean"||s.id==="pest")&&p.variant==="3 BHK or larger")pairs.push(["Additional charges","Your concierge will quote the amount above the 2 BHK coverage before booking."]);
    $("#reviewCard").innerHTML='<dl class="review-section">'+pairs.map(([k,v])=>"<dt>"+esc(k)+"</dt><dd>"+esc(v||"-")+"</dd>").join("")+"</dl>";
  }
  function followup(requestId){
    const s=chosen(),r=state.recipient;
    const message=["Hello Symbo Concierge,","I have submitted my Diwali service request.","Request reference: "+requestId,"Privilege ID: "+r.id,"Name: "+[r.firstName,r.lastName].filter(Boolean).join(" "),"Company: "+r.company,"Service: "+s.name+" | "+state.variant,"Please call me on my registered number to arrange it."].join("\n");
    $("#openWhatsappAgain").href="https://wa.me/"+phone+"?text="+encodeURIComponent(message);
    $("#successSummary").textContent="Request "+requestId+" · "+s.name+" · "+state.variant;
  }
  $("#entryForm").addEventListener("submit",async e=>{
    e.preventDefault();if(state.busy)return;
    const digits=$("#cardDigits").value;
    if(!/^\d{5}$/.test(digits)){$("#entryError").textContent="Enter the five digits printed on your card.";return;}
    state.busy=true;$("#lookupButton").disabled=true;$("#lookupButton").textContent="Opening your invitation…";$("#entryError").textContent="";
    try{
      const result=await api("lookup",{id:"SYM-DIW26-"+digits});
      state.recipient=result.recipient;state.session=result.session;state.services=result.services.map(s=>({...s,name:s.name||catalog[s.id]?.name,desc:s.desc||catalog[s.id]?.desc}));state.copy=result.copy||{};
      if(!state.services.length)throw new Error("No benefits are available yet. Please contact your concierge.");
      fillRecipient(state.recipient);renderServices();helpLinks();$("#entryDialog").close();screen("welcome");
    }catch(err){$("#entryError").textContent=err.name==="TimeoutError"?"The connection timed out. Please try again.":err.message;}
    finally{state.busy=false;$("#lookupButton").disabled=false;$("#lookupButton").textContent="Open my privileges →";}
  });
  $("#cardDigits").addEventListener("input",e=>e.target.value=e.target.value.replace(/\D/g,"").slice(0,5));
  $("#entryDialog").addEventListener("cancel",e=>e.preventDefault());
  document.addEventListener("click",e=>{
    const action=e.target.closest("[data-action]")?.dataset.action;
    if(state.busy)return;
    const info=e.target.closest("[data-service-info],[data-current-service-info]");
    if(info){serviceInfo(info.dataset.serviceInfo||state.service,info);return;}
    if(action==="start"){if(!state.recipient){$("#entryDialog").showModal();return;}screen("choose");}
    if(action==="change-service")screen("choose");
    if(action==="edit-details")screen("details");
    if(action==="restart")location.href=location.pathname;
    const dialog=e.target.closest("[data-dialog]")?.dataset.dialog;
    if(dialog){
      $("#dialogEyebrow").textContent="Symbo Concierge";
      $("#dialogTitle").textContent=dialog==="terms"?"Privilege terms":"Privacy note";
      $("#dialogBody").textContent=String(dialog==="terms"?(state.copy.terms||"Choose one complimentary service. For Home Cleaning and Pest Control, Symbo covers the cost up to the 2 BHK service; the concierge will quote additional charges for larger homes before booking. Conditions apply."):(state.copy.privacy||"Symbo uses your details to coordinate the requested service and may share necessary booking details with the fulfilment partner. Requests submitted here are saved to a private operations sheet.")).replace(/—/g,'-');
      openDialog(e.target.closest("[data-dialog]"));
    }
  });
  $("#backButton").onclick=()=>{if(!state.busy)screen({choose:"welcome",details:"choose",review:"details"}[state.screen]||"welcome");};
  function advanceChoice(){
    if(!chosen()){alert("Please choose a service.");return;}
    if(!state.variant){$("#subError").hidden=false;return;}
    if($("#choiceDialog").open)$("#choiceDialog").close();
    $("#selectedIcon").innerHTML=icon(state.service);$("#selectedLabel").textContent=chosen().name+" · "+state.variant;screen("details");
  }
  $("#choiceContinue").onclick=advanceChoice;
  $("#choiceClose").onclick=()=>$("#choiceDialog").close();
  $("#chooseContinue").onclick=()=>{if(!chosen()){alert("Please choose a service.");return;}if(!state.variant){renderOptions();$("#choiceDialog").showModal();return;}advanceChoice();};
  $("#callWindows").innerHTML=windows.map(w=>'<button class="pill" type="button" data-window="'+w+'" role="radio" aria-checked="false">'+w+'</button>').join("");
  $$("[data-window]").forEach(b=>b.onclick=()=>{state.callback=b.dataset.window;$$("[data-window]").forEach(x=>{x.classList.toggle("is-selected",x===b);x.setAttribute("aria-checked",x===b);});$("#callError").textContent="";});
  $("#requestForm").onsubmit=e=>{e.preventDefault();if(validate()){renderReview();screen("review");}};
  $("#submitRequest").onclick=async()=>{
    if(state.busy||state.submitted)return;
    state.busy=true;$("#submitRequest").disabled=true;$("#submitRequest").textContent="Saving your request…";$("#submitError").textContent="";
    try {
      const result=await api("submit",{...read(),session:state.session,requestKey:state.key});
      state.submitted=true;followup(result.requestId);screen("success");
    } catch(err){$("#submitError").textContent=err.name==="TimeoutError"?"We could not confirm the result. Keep this page open and retry; the same request reference will be reused.":err.message;}
    finally{state.busy=false;$("#submitRequest").disabled=false;$("#submitRequest").textContent="Submit my request";}
  };
  $("#dateOne").min=indiaTomorrow();$("#dateTwo").min=indiaTomorrow();
  $("#dateOne").onchange=()=>{$("#dateTwo").min=$("#dateOne").value||indiaTomorrow();};
  $("#pincode").oninput=e=>e.target.value=e.target.value.replace(/\D/g,"").slice(0,6);
  $$(".dialog-close,.dialog-done").forEach(b=>b.onclick=()=>$("#infoDialog").close());
  $("#infoDialog").addEventListener("close",()=>{dialogTrigger?.focus({preventScroll:true});dialogTrigger=null;});
  helpLinks();screen("welcome");$("#entryDialog").showModal();
})();

