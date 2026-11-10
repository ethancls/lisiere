import {auth} from '#lib/server/auth.ts';import {ORIGIN} from '$app/env/private';
import {fail,redirect} from '@sveltejs/kit';import {APIError} from 'better-auth/api';
import type {Actions,PageServerLoad} from './$types';
export const load:PageServerLoad=({locals,url})=>{
 if(!locals.user)redirect(303,'/login');
 const u=locals.user;
 return {user:{id:u.id,name:u.name,firstName:u.firstName??'',lastName:u.lastName??'',email:u.email},emailConfirmed:url.searchParams.get('email')==='verified'&&url.searchParams.get('previous')!==u.email&&!url.searchParams.has('error'),emailPending:url.searchParams.get('email')==='verified'&&url.searchParams.get('previous')===u.email&&!url.searchParams.has('error'),verificationError:url.searchParams.has('error')};
};
function failure(section:string,e:unknown){
 if(e instanceof APIError){
  if(e.body?.code==='INVALID_PASSWORD')return fail(400,{section,error:'Le mot de passe actuel est incorrect.'});
  if(e.status==='UNAUTHORIZED')return fail(401,{section,error:'Votre session a expiré. Reconnectez-vous.'});
  if(e.status==='TOO_MANY_REQUESTS')return fail(429,{section,error:'Trop de tentatives. Réessayez dans quelques minutes.'});
 }
 console.error('Account settings update failed',{section});
 return fail(400,{section,error:section==='profile'?'Le profil n’a pas pu être enregistré. Ce pseudo est peut-être déjà utilisé.':'La modification n’a pas pu être effectuée. Réessayez dans un instant.'});
}
export const actions:Actions={
 profile:async({request,locals})=>{
  if(!locals.user)redirect(303,'/login');
  const f=await request.formData();const name=String(f.get('name')??'').trim(),firstName=String(f.get('firstName')??'').trim(),lastName=String(f.get('lastName')??'').trim();
  if(!name||name.length>50||firstName.length>80||lastName.length>80)return fail(400,{section:'profile',error:'Vérifiez les champs : pseudo de 1 à 50 caractères, nom et prénom de 80 caractères maximum.'});
  try{await auth.api.updateUser({headers:request.headers,body:{name,firstName,lastName}});return {section:'profile',success:'Profil enregistré.'};}catch(e){return failure('profile',e);}
 },
 password:async({request,locals})=>{
  if(!locals.user)redirect(303,'/login');
  const f=await request.formData();const password=String(f.get('password')??''),confirmation=String(f.get('confirmation')??''),currentPassword=String(f.get('currentPassword')??'');
  if(password.length<8||password.length>128||password!==confirmation)return fail(400,{section:'password',error:'Les mots de passe doivent correspondre et contenir entre 8 et 128 caractères.'});
  if(!currentPassword||currentPassword.length>128)return fail(400,{section:'password',error:'Saisissez votre mot de passe actuel.'});
  try{await auth.api.changePassword({headers:request.headers,body:{currentPassword,newPassword:password,revokeOtherSessions:true}});return {section:'password',success:'Mot de passe modifié. Les autres sessions ont été déconnectées.'};}catch(e){return failure('password',e);}
 },
 email:async({request,locals})=>{
  if(!locals.user)redirect(303,'/login');
  const f=await request.formData();const newEmail=String(f.get('email')??'').trim().toLowerCase(),password=String(f.get('currentPassword')??'');
  if(newEmail.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(newEmail))return fail(400,{section:'email',error:'Saisissez une adresse e-mail valide.'});
  if(newEmail===locals.user.email.toLowerCase())return fail(400,{section:'email',error:'Cette adresse est déjà celle de votre compte.'});
  if(!password||password.length>128)return fail(400,{section:'email',error:'Saisissez votre mot de passe actuel.'});
  try{
   await auth.api.verifyPassword({headers:request.headers,body:{password}});
   await auth.api.changeEmail({headers:request.headers,body:{newEmail,callbackURL:ORIGIN+'/settings?email=verified&previous='+encodeURIComponent(locals.user.email)}});
   return {section:'email',success:'Si cette adresse est disponible, un lien de confirmation vous sera envoyé. Votre adresse actuelle reste active jusqu’à la validation.'};
  }catch(e){return failure('email',e);}
 },
 logout:async({request})=>{await auth.api.signOut({headers:request.headers});redirect(303,'/login');}
};
