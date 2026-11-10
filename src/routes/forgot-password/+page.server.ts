import { fail } from '@sveltejs/kit';
import { ORIGIN } from '$app/env/private';
import { auth } from '#lib/server/auth.ts';
import type { Actions } from './$types';
export const actions: Actions = {
 default: async ({request}) => {
  const f=await request.formData(); const email=String(f.get('email')??'').trim();
  if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400,{error:'Saisissez une adresse e-mail valide.'});
  // Forward through the auth HTTP handler to retain Better Auth's API rate limits.
  const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.delete('content-length');
  const response=await auth.handler(new Request(`${ORIGIN}/api/auth/request-password-reset`,{
   method:'POST',headers,
   body:JSON.stringify({email,redirectTo:`${ORIGIN}/reset-password`})
  ,}));
  if(response.status===429) return fail(429,{error:'Trop de demandes. Réessayez dans quelques minutes.'});
  if(!response.ok) {
   console.error('Password reset request failed', {status:response.status});
   return fail(503,{error:'Le lien n’a pas pu être envoyé. Réessayez dans un instant.'});
  }
  return {sent:true};
 }
};
