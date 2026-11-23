import {z} from 'zod';

const ignResponse=z.object({
 features:z.array(z.object({
  properties:z.object({
   type:z.string(),distance:z.number().nonnegative(),citycode:z.string(),
   street:z.string().trim().optional(),name:z.string().trim().optional(),
   housenumber:z.string().trim().optional()
  })
 }))
});

export async function reverseAddress(latitude:number,longitude:number,request=globalThis.fetch){
 const url=new URL('https://data.geopf.fr/geocodage/reverse');
 url.search=new URLSearchParams({lat:String(latitude),lon:String(longitude),index:'address',limit:'1'}).toString();
 const response=await request(url,{signal:AbortSignal.timeout(4000),redirect:'error'});
 if(!response.ok)throw new Error('IGN reverse geocoder unavailable');
 const {features}=ignResponse.parse(await response.json());
 const hit=features[0]?.properties;
 if(!hit||hit.distance>60||!['housenumber','street'].includes(hit.type))return null;
 const street=hit.street||(hit.type==='street'?hit.name:undefined);
 if(!street)return null;
 const number=hit.type==='housenumber'?hit.housenumber:undefined;
 const address=number?`${number}, ${street}`:street;
 if(address.length>120||address.includes('\0')||!/^\d{5}$/.test(hit.citycode))return null;
 return {address,inseeCode:hit.citycode};
}
