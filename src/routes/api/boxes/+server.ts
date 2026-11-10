import {json,error} from '@sveltejs/kit';import type {RequestHandler} from './$types';
import {queryBoxes} from '#lib/server/postgres/boxes.ts';
export const GET:RequestHandler=async({url,locals})=>{
 if(!locals.user)error(401,'Connexion requise.');
 const p=url.searchParams,mode=p.get('mode')??'table',search=(p.get('q')??'').trim();
 const sort=p.get('sort')??'name',direction=p.get('direction')??'asc';
 const page=Number(p.get('page')??1),pageSize=Number(p.get('pageSize')??25);
 if(!['map','table'].includes(mode)||search.length>120||!['name','city','address'].includes(sort)||!['asc','desc'].includes(direction)||!Number.isSafeInteger(page)||page<1||!Number.isInteger(pageSize)||![25,50,100].includes(pageSize))error(400,'Paramètres de recherche invalides.');
 let bounds;
 if(mode==='map'){
  if(!['west','east','south','north'].every(key=>p.has(key)&&p.get(key)!==''))error(400,'Zone géographique requise.');
  const west=Number(p.get('west')),east=Number(p.get('east')),south=Number(p.get('south')),north=Number(p.get('north'));
  if(![west,east,south,north].every(Number.isFinite)||Math.abs(west)>180||Math.abs(east)>180||south < -85.051129||north >85.051129||south>=north)error(400,'Zone géographique invalide.');
  bounds={west,east,south,north};
 }
 try{return json(await queryBoxes({mode:mode as 'map'|'table',search,page,pageSize,sort:sort as 'name'|'city'|'address',ascending:direction==='asc',bounds}),{headers:{'Cache-Control':'private, no-store'}});}
 catch{console.error('Box API query failed');error(503,'Les boîtes ne sont pas disponibles pour le moment.');}
};
