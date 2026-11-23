import {json,error} from '@sveltejs/kit';import type {RequestHandler} from './$types';
import {queryBoxes} from '#lib/server/postgres/boxes.ts';
import {countBoxFilters,emptyBoxFilters,maxStreetLength,type BoxFilters} from '#lib/types/boxes.ts';
import {maxBookTitleLength,maxBookGenreLength} from '#lib/types/books.ts';
export const GET:RequestHandler=async({url,locals})=>{
 if(!locals.user)error(401,'Connexion requise.');
 const p=url.searchParams,mode=p.get('mode')??'table',search=(p.get('q')??'').trim();
 const sort=p.get('sort')??'name',direction=p.get('direction')??'asc';
 const page=Number(p.get('page')??1),pageSize=Number(p.get('pageSize')??25);
 if(!['map','table'].includes(mode)||search.length>120||!['name','city','address'].includes(sort)||!['asc','desc'].includes(direction)||!Number.isSafeInteger(page)||page<1||!Number.isInteger(pageSize)||![25,50,100].includes(pageSize))error(400,'Paramètres de recherche invalides.');
 let bounds,filters=emptyBoxFilters;
 if(mode==='map'){
  const id=(key:string)=>{
   const value=p.get(key);
   if(value===null)return null;
   const parsed=Number(value);
   if(!/^\d+$/.test(value)||parsed<1||parsed>2147483647)error(400,'Filtre géographique invalide.');
   return parsed;
  };
  const books=p.get('books')??'all',title=(p.get('title')??'').trim(),genre=(p.get('genre')??'').trim();
  if((books!=='all'&&books!=='with'&&books!=='without')||[...title].length>maxBookTitleLength||[...genre].length>maxBookGenreLength||title.includes('\0')||genre.includes('\0'))error(400,'Filtres de livres invalides.');
  const street=(p.get('street')??'').trim();
  if(street.length>maxStreetLength||street.includes('\0'))error(400,'Nom de rue invalide.');
  filters={street,commune:id('commune'),department:id('department'),books,title,genre} satisfies BoxFilters;
 }
 if(mode==='map'&&(!countBoxFilters(filters)||['west','east','south','north'].some(key=>p.has(key)))){
  if(!['west','east','south','north'].every(key=>p.has(key)&&p.get(key)!==''))error(400,'Zone géographique requise.');
  const west=Number(p.get('west')),east=Number(p.get('east')),south=Number(p.get('south')),north=Number(p.get('north'));
  if(![west,east,south,north].every(Number.isFinite)||Math.abs(west)>180||Math.abs(east)>180||south < -85.051129||north >85.051129||south>=north)error(400,'Zone géographique invalide.');
  bounds={west,east,south,north};
 }
 try{return json(await queryBoxes({mode:mode as 'map'|'table',search,page,pageSize,sort:sort as 'name'|'city'|'address',ascending:direction==='asc',bounds,filters}),{headers:{'Cache-Control':'private, no-store'}});}
 catch{console.error('Box API query failed');error(503,'Les boîtes ne sont pas disponibles pour le moment.');}
};
