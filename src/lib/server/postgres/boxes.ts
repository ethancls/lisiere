import {and,asc,desc,eq,ilike,or,sql,type SQL} from 'drizzle-orm';
import {postgres} from './index';import {boites,communes,departments} from './schema';
import type {Bounds,BoxPage} from '#lib/types/boxes.ts';
export interface BoxQuery {mode:'map'|'table';search:string;page:number;pageSize:number;sort:'name'|'city'|'address';ascending:boolean;bounds?:Bounds}
export async function queryBoxes(query:BoxQuery):Promise<BoxPage>{
 const clauses:SQL[]=[];
 if(query.search){const pattern='%'+query.search.replace(/[\\%_]/g,'\\$&')+'%';clauses.push(or(ilike(boites.refSource,pattern),ilike(boites.address,pattern),ilike(communes.name,pattern),ilike(communes.postalCode,pattern))!);}
 if(query.bounds){
  const {west,east,south,north}=query.bounds;
  const inEnvelope=(w:number,e:number)=>{
   const exact=sql`public.ST_Intersects(public.ST_Transform(${boites.geom},4326),public.ST_MakeEnvelope(${w},${south},${e},${north},4326))`;
   // Lambert-93 cannot project arbitrary global envelopes. Use its index for local French views.
   return w>=-10&&e<=15&&e-w<20&&south>=35&&north<=60
    ? sql`(${boites.geom} && public.ST_Transform(public.ST_Segmentize(public.ST_MakeEnvelope(${w},${south},${e},${north},4326),0.1),2154) AND ${exact})`:exact;
  };
  clauses.push(west<=east?inEnvelope(west,east):or(inEnvelope(west,180),inEnvelope(-180,east))!);
 }
 const where=and(...clauses);
 // Use one snapshot so page contents/count agree during concurrent additions.
 return postgres.transaction(async tx=>{
  const [count]=await tx.select({total:sql<number>`count(*)::int`,totalAll:sql<number>`(select count(*)::int from ${boites})`}).from(boites).innerJoin(communes,eq(boites.communeId,communes.id)).where(where);
  const total=count.total;
  const pageSize=query.mode==='map'?1000:query.pageSize;
  const pages=Math.max(1,Math.ceil(total/pageSize));const page=query.mode==='map'?1:Math.min(query.page,pages);
  const order=query.ascending?asc:desc;
  const name=sql<string>`coalesce(${boites.refSource}, 'Boîte #' || ${boites.id}::text || ' — ' || ${communes.name})`;
  const column=query.sort==='city'?communes.name:query.sort==='address'?boites.address:name;
  const rows=await tx.select({id:boites.id,name,address:boites.address,city:communes.name,postalCode:communes.postalCode,department:departments.name,departmentCode:departments.code,inseeCode:communes.inseeCode,
   latitude:sql<number>`public.ST_Y(public.ST_Transform(${boites.geom},4326))`,longitude:sql<number>`public.ST_X(public.ST_Transform(${boites.geom},4326))`
  }).from(boites).innerJoin(communes,eq(boites.communeId,communes.id)).leftJoin(departments,eq(communes.departmentId,departments.id)).where(where).orderBy(order(column),asc(boites.id)).limit(pageSize).offset((page-1)*pageSize);
  return {items:rows.map(b=>({...b,id:`pg:${b.id}`,address:b.address||'Adresse non renseignée',description:''})),total,totalAll:count.totalAll,page,pageSize,pages,truncated:query.mode==='map'&&total>pageSize};
 },{isolationLevel:'repeatable read',accessMode:'read only'});
}
