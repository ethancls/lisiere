import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import type { Actions } from './$types';
export const actions: Actions = {
 default: async ({ request }) => {
  const f = await request.formData();
  const email = String(f.get('email') ?? '').trim();
  const password = String(f.get('password') ?? '');
  const name = String(f.get('name') ?? '').trim();
  const signup = f.get('mode') === 'signup';
  if(signup && (!name||name.length>50)) return fail(400,{message:'Le pseudo doit contenir entre 1 et 50 caractères.'});
  if(signup && (password.length<8||password.length>128)) return fail(400,{message:'Choisissez un mot de passe de 8 à 128 caractères.'});
  if(signup && password!==f.get('confirmation')) return fail(400,{message:'Les mots de passe ne correspondent pas.'});
  try {
   if(signup) await auth.api.signUpEmail({body:{email,password,name}});
   else await auth.api.signInEmail({body:{email,password}});
  } catch(e) {
   if(e instanceof APIError) {
    const code=e.body?.code;
    if(e.status==='TOO_MANY_REQUESTS') return fail(429,{message:'Trop de tentatives. Réessayez dans quelques minutes.'});
    if(!signup && (code==='INVALID_EMAIL_OR_PASSWORD'||code==='INVALID_PASSWORD'||code==='USER_NOT_FOUND')) return fail(400,{message:'Adresse e-mail ou mot de passe incorrect.'});
    if(code==='INVALID_EMAIL') return fail(400,{message:'Saisissez une adresse e-mail valide.'});
    return fail(400,{message:signup?'Impossible de créer ce compte. Vérifiez vos informations ou essayez de vous connecter.':'La connexion est indisponible pour le moment. Réessayez dans un instant.'});
   }
   console.error('Account access failed');
   return fail(500,{message:'Le service est indisponible pour le moment. Réessayez dans un instant.'});
  }
  redirect(303,'/');
 }
};
