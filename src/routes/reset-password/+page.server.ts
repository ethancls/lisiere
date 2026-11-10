import { fail } from '@sveltejs/kit';
import { auth } from '#lib/server/auth.ts';
import { ORIGIN } from '$app/env/private';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = ({url,setHeaders}) => {
 setHeaders({'Referrer-Policy':'no-referrer','Cache-Control':'no-store'});
 return {token:url.searchParams.get('token')??'',invalid:!!url.searchParams.get('error')||!url.searchParams.get('token')};
};
export const actions: Actions = {
 default: async ({request}) => {
  const f=await request.formData(); const password=String(f.get('password')??'');const token=String(f.get('token')??'');
  if(password.length<8||password.length>128) return fail(400,{error:'Le mot de passe doit contenir entre 8 et 128 caractères.',invalid:false});
  if(password!==f.get('confirmation')) return fail(400,{error:'Les mots de passe ne correspondent pas.',invalid:false});
  if(!token||token.length>256) return fail(400,{error:'Ce lien est invalide ou a expiré.',invalid:true});
  const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.delete('content-length');
  const response=await auth.handler(new Request(`${ORIGIN}/api/auth/reset-password`,{method:'POST',headers,body:JSON.stringify({token,newPassword:password})}));
  if(response.status===429) return fail(429,{error:'Trop de tentatives. Réessayez dans quelques minutes.',invalid:false});
  if(!response.ok) return fail(400,{error:'Ce lien est invalide ou a expiré.',invalid:true});
  return {success:true};
 }
};
