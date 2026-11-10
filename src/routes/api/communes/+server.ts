import {json,error} from '@sveltejs/kit';import type {RequestHandler} from './$types';
import {postgres} from '#lib/server/postgres/index.ts';import {communes} from '#lib/server/postgres/schema.ts';
export const GET:RequestHandler=async({locals})=>{
 if(!locals.user)error(401,'Connexion requise.');
 try{return json(await postgres.select({id:communes.id,name:communes.name,postalCode:communes.postalCode}).from(communes).orderBy(communes.name,communes.postalCode),{headers:{'Cache-Control':'private, max-age=300'}});}
 catch{error(503,'Les communes sont momentanément indisponibles.');}
};
