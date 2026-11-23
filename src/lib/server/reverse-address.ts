import {z} from 'zod';

const ignResponse=z.object({
 features:z.array(z.object({
  properties:z.object({
   type:z.string(),distance:z.number().nonnegative(),
   street:z.string().trim().optional(),name:z.string().trim().optional(),
   housenumber:z.string().trim().optional()
  })
 }))
});

export async function reverseAddress(latitude:number,longitude:number,request=globalThis.fetch){
 const url=new URL('https://data.geopf.fr/geocodage/reverse');
 url.search=new URLSearchParams({lat:String(latitude),lon:String(longitude),index:'address',limit:'1'}).toString();
 let payload:unknown;
 for(const timeout of [4000,3000]){
  let failure:string|undefined;
  let status:number|undefined;
  try{
   const response=await request(url,{signal:AbortSignal.timeout(timeout),redirect:'error'});
   if(response.ok){payload=await response.json();break;}
   void response.body?.cancel().catch(()=>{});
   status=response.status;
  }catch(error){
   if(error instanceof Error&&error.name==='TimeoutError')failure='timeout';
   else if(error instanceof TypeError)failure='network';
   else if(error instanceof SyntaxError)throw new Error('invalid JSON');
   else throw new Error('unexpected request failure');
  }
  if(status!==undefined){
   failure=`HTTP ${status}`;
   if(![502,503,504].includes(status))throw new Error(failure);
  }
  if(timeout===3000)throw new Error(failure);
  await new Promise(resolve=>setTimeout(resolve,150));
 }
 const parsed=ignResponse.safeParse(payload);
 if(!parsed.success)throw new Error('invalid response shape');
 const {features}=parsed.data;
 const hit=features[0]?.properties;
 if(!hit||hit.distance>60||!['housenumber','street'].includes(hit.type))return null;
 const street=hit.street||(hit.type==='street'?hit.name:undefined);
 if(!street)return null;
 const number=hit.type==='housenumber'?hit.housenumber:undefined;
 const address=number?`${number}, ${street}`:street;
 if(address.length>120||address.includes('\0'))return null;
 return address;
}
