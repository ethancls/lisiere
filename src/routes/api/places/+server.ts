import {error,json} from '@sveltejs/kit';
import {searchPlaces} from '#lib/server/places.ts';
import {maxPlaceQueryLength} from '#lib/types/places.ts';
import type {RequestHandler} from './$types';

export const GET:RequestHandler=async({locals,url,request})=>{
 if(!locals.user)error(401,'Connexion requise.');
 const query=url.searchParams.get('q')??'';
 if(query.length>maxPlaceQueryLength)error(400,'Recherche trop longue.');
 try{
  return json(await searchPlaces(query,undefined,request.signal),{headers:{'Cache-Control':'no-store'}});
 }catch{
  error(503,'La recherche de lieux est momentanément indisponible.');
 }
};
