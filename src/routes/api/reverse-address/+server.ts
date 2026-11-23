import {error,json} from '@sveltejs/kit';
import {reverseAddress} from '#lib/server/reverse-address.ts';
import {boxCommune} from '#lib/server/postgres/box-commune.ts';
import {parseCoordinates} from '#lib/types/coordinates.ts';
import type {RequestHandler} from './$types';

export const GET:RequestHandler=async({url,locals})=>{
 if(!locals.user)error(401,'Connexion requise.');
 const point=parseCoordinates(url.searchParams.get('lat'),url.searchParams.get('lon'));
 if(!point)error(400,'Coordonnées GPS invalides.');
 const [city,address]=await Promise.allSettled([boxCommune(point),reverseAddress(point.latitude,point.longitude)]);
 if(address.status==='rejected')console.warn('IGN address lookup unavailable:',address.reason instanceof Error?address.reason.message:'unknown error');
 return json({
  commune:city.status==='fulfilled'?city.value?.name??null:null,
  communeUnavailable:city.status==='rejected',
  address:address.status==='fulfilled'?address.value:null,
  addressUnavailable:address.status==='rejected'
 },{headers:{'Cache-Control':'private, no-store'}});
};
