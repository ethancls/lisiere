import {error,json} from '@sveltejs/kit';
import {reverseAddress} from '#lib/server/reverse-address.ts';
import type {RequestHandler} from './$types';

export const GET:RequestHandler=async({url,locals})=>{
 if(!locals.user)error(401,'Connexion requise.');
 const lat=url.searchParams.get('lat')?.trim(),lon=url.searchParams.get('lon')?.trim();
 const latitude=Number(lat),longitude=Number(lon);
 if(!lat||!lon||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>85.051128||Math.abs(longitude)>180){
  error(400,'Coordonnées GPS invalides.');
 }
 try{
  return json(await reverseAddress(latitude,longitude),{headers:{'Cache-Control':'private, no-store'}});
 }catch{
  error(503,'La suggestion d’adresse est momentanément indisponible.');
 }
};
