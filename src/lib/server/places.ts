import {z} from 'zod';
import {maxPlaceQueryLength,minPlaceQueryLength,type Place} from '../types/places.ts';

const responseSchema=z.object({features:z.array(z.unknown())});
const featureSchema=z.object({
 geometry:z.object({type:z.literal('Point'),coordinates:z.tuple([z.number().min(-180).max(180),z.number().min(-85.051128).max(85.051128)])}),
 properties:z.object({
  type:z.enum(['municipality','street','housenumber']),
  name:z.string().trim().min(1),
  city:z.string().trim().min(1),
  postcode:z.string().regex(/^\d{5}$/)
 })
});

export async function searchPlaces(input:string,request=globalThis.fetch,signal?:AbortSignal):Promise<Place[]>{
 const query=input.trim().replace(/\s+/g,' ');
 if(query.length<minPlaceQueryLength||query.length>maxPlaceQueryLength)return [];
 const url=new URL('https://data.geopf.fr/geocodage/search');
 const postal=/^\d{5}$/.test(query);
 url.search=new URLSearchParams({q:query,index:'address',limit:'6'}).toString();
 if(postal){url.searchParams.set('type','municipality');url.searchParams.set('postcode',query);}
 const deadline=AbortSignal.timeout(3500);
 const response=await request(url,{credentials:'omit',redirect:'error',signal:signal?AbortSignal.any([signal,deadline]):deadline});
 if(!response.ok)throw new Error('IGN geocoding unavailable');
 const {features}=responseSchema.parse(await response.json());
 const places:Place[]=[];
 for(const feature of features.slice(0,6)){
  const result=featureSchema.safeParse(feature);
  if(!result.success)continue;
  const {geometry,properties:{type,name,city,postcode}}=result.data;
  if(postal&&(postcode!==query||type!=='municipality'))continue;
  const locality=postcode+' '+city;
  if(!places.some(place=>place.label===name&&place.locality===locality))
   places.push({label:name,locality,center:geometry.coordinates,kind:type});
 }
 return places;
}
