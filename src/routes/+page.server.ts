import {auth} from '#lib/server/auth.ts';
import {postgres} from '#lib/server/postgres/index.ts';
import {boites,communes,departments} from '#lib/server/postgres/schema.ts';
import {eq,sql} from 'drizzle-orm';
import {fail,redirect} from '@sveltejs/kit';
import type {Actions,PageServerLoad} from './$types';
export const load:PageServerLoad=({locals})=>({user:{id:locals.user!.id,name:locals.user!.name,firstName:locals.user!.firstName??null,lastName:locals.user!.lastName??null}});
export const actions:Actions={
 add:async({request,locals})=>{
  if(!locals.user)redirect(303,'/login');
  const f=await request.formData();
  const address=String(f.get('address')??'').trim(),reference=String(f.get('reference')??'').trim();
  const lat=String(f.get('latitude')??'').trim(),lng=String(f.get('longitude')??'').trim();
  const latitude=Number(lat),longitude=Number(lng),communeId=Number(f.get('communeId'));
  if(!address||address.length>120)return fail(400,{error:'Saisissez une adresse de 120 caractères maximum.'});
  if(reference.length>50)return fail(400,{error:'La référence ne doit pas dépasser 50 caractères.'});
  if(!Number.isSafeInteger(communeId)||communeId<=0)return fail(400,{error:'Sélectionnez une commune dans la liste.'});
  if(!lat||!lng||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>85.051128||Math.abs(longitude)>180)return fail(400,{error:'Saisissez des coordonnées GPS valides.'});
  try{
   const [city]=await postgres.select({id:communes.id,name:communes.name,postalCode:communes.postalCode,inseeCode:communes.inseeCode,department:departments.name,departmentCode:departments.code}).from(communes).leftJoin(departments,eq(communes.departmentId,departments.id)).where(eq(communes.id,communeId));
   if(!city)return fail(400,{error:'Cette commune est introuvable. Sélectionnez une commune dans la liste.'});
   const [created]=await postgres.insert(boites).values({address,refSource:reference||null,communeId,geom:sql`public.ST_Transform(public.ST_SetSRID(public.ST_MakePoint(${longitude},${latitude}),4326),2154)`}).returning({id:boites.id});
   return {success:true,box:{id:'pg:'+created.id,name:reference||`Boîte #${created.id} — ${city.name}`,address,city:city.name,postalCode:city.postalCode,inseeCode:city.inseeCode,department:city.department,departmentCode:city.departmentCode,latitude,longitude,description:''}};
  }catch(e){
   const cause=e instanceof Error&&'cause' in e?e.cause:e;
   if(cause&&typeof cause==='object'&&'code' in cause&&cause.code==='23505')return fail(409,{error:'Une boîte utilise déjà cette référence.'});
   console.error('PostgreSQL box insert failed');return fail(503,{error:'La boîte n’a pas pu être enregistrée. Réessayez dans un instant.'});
  }
 },
 logout:async({request})=>{await auth.api.signOut({headers:request.headers});redirect(303,'/login');}
};
