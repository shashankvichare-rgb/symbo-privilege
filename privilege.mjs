// The browser never receives the Apps Script URL or backend secret.
export default async function handler(request) {
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
 const response=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(request.method!=='POST')return response(405,{ok:false,code:'METHOD',message:'POST required.'});
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return response(403,{ok:false,code:'ORIGIN',message:'Open the original invitation page.'});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return response(415,{ok:false,code:'TYPE',message:'JSON required.'});
 const endpoint=process.env.APPS_SCRIPT_URL,secret=process.env.BACKEND_SECRET;
 if(!endpoint||!secret||secret.length<32)return response(503,{ok:false,code:'SETUP',message:'Your concierge page is being set up. Please try again later.'});
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))return response(503,{ok:false,code:'SETUP',message:'Backend deployment URL is not configured correctly.'});
 try{
  // Stream with a hard size cap, even when Content-Length is absent.
  const reader=request.body?.getReader();if(!reader)return response(400,{ok:false,message:'Missing request.'});
  const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return response(413,{ok:false,message:'Request too large.'});}chunks.push(value);}
  const buffer=new Uint8Array(size);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
  const input=JSON.parse(new TextDecoder().decode(buffer));
  if(!['lookup','submit'].includes(input.action)||!/^[a-f0-9]{64}$/.test(input.token||''))return response(400,{ok:false,code:'INVALID',message:'Invalid invitation link.'});
  const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:input.action,token:input.token,request:input.request,secret}),redirect:'follow',signal:AbortSignal.timeout(25000)});
  if(!upstream.ok)throw new Error('Backend unavailable');
  let data;try{data=await upstream.json();}catch{throw new Error('Backend did not return JSON');}if(typeof data.ok!=='boolean')throw new Error('Invalid backend response');
  // Apps Script's ContentService reports logical errors in JSON with HTTP 200.
  return response(data.ok?200:400,data);
 }catch(error){
  if(error instanceof SyntaxError)return response(400,{ok:false,code:'JSON',message:'Invalid request format.'});
  return response(502,{ok:false,code:'UNCONFIRMED',message:'We could not confirm whether your request was saved. Retry the same request; it will not be saved twice.'});
 }
}
export const config={path:'/api/privilege'};
