const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../public');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'service-content.js'),'utf8'),context);
const catalog=context.window.SYMBO_SERVICE_CONTENT;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const terms=id=>JSON.stringify(catalog[id]);
test('all five services have named descriptions, conditions and detailed sections',()=>{
 assert.deepEqual(Object.keys(catalog),['ac','clean','pest','shoe','wash']);
 for(const service of Object.values(catalog)){
  assert.ok(service.name&&service.desc&&service.note&&service.question);
  assert.ok(service.sections.length>=5);
  for(const section of service.sections)assert.ok(section.title&&section.items.length&&section.items.every(Boolean));
 }
});
test('confirmed exceptions are preserved without removing other exclusions',()=>{
 assert.match(terms('wash'),/Dry cabin vacuuming of seats, floors and boot/);
 assert.match(terms('wash'),/Underbody water spray/);
 assert.match(terms('wash'),/Hydraulic underbody cleaning/);
 assert.match(terms('wash'),/Floor-mat cleaning/);
 assert.match(terms('shoe'),/Luxury \/ Designer Sneakers \| included/);
 assert.match(terms('pest'),/one visit only/);
 assert.match(terms('pest'),/AMC\) is not included/);
 assert.match(terms('ac'),/premium plans only/);
 assert.match(terms('clean'),/Cabinet interiors are cleaned only if completely empty/);
 for(const id of ['clean','pest'])assert.match(terms(id),/3 BHK/);
});
test('public copy does not expose supplier costs or use removed wording',()=>{
 const publicCopy=html+JSON.stringify(catalog);
 assert.doesNotMatch(publicCopy,/manually|One benefit · Personally arranged|No OTP|Inr 600|excluding taxes/i);
 assert.match(html,/Your Festive Privileges/);
 assert.match(html,/Three steps\. Leave the rest to us\./);
 assert.match(html,/Services curated by Symbo/);
});
test('details show name and company only; sticky CTA and service script are wired',()=>{
 const section=html.match(/<legend>Your details<\/legend>([\s\S]*?)<\/fieldset>/)[1];
 assert.deepEqual([...section.matchAll(/<input id="([^"]+)"/g)].map(m=>m[1]),['fullName','company']);
 assert.match(html,/id="welcomeSticky"/);
 assert.match(css,/\.welcome-sticky \{ position: fixed/);
 assert.match(css,/#main:focus \{ outline: none/);
 assert.ok(html.indexOf('src="service-content.js')<html.indexOf('src="app.js'));
});
