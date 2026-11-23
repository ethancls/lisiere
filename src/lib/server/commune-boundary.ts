import {z} from 'zod';
import type {Coordinates} from '#lib/types/boxes.ts';

const codes=z.array(z.object({code:z.string().regex(/^(?:\d{5}|2[AB]\d{3})$/)}));

export async function communeCode({latitude,longitude}:Coordinates,request=globalThis.fetch){
 const url=new URL('https://geo.api.gouv.fr/communes');
 url.search=new URLSearchParams({lat:String(latitude),lon:String(longitude),fields:'code'}).toString();
 const response=await request(url,{signal:AbortSignal.timeout(4000),redirect:'error'});
 if(!response.ok)throw new Error('Official commune boundaries unavailable');
 const matches=codes.parse(await response.json());
 return matches.length===1?matches[0].code:null;
}
