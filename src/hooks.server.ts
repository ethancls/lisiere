import type { Handle } from '@sveltejs/kit/hooks';
import { json, redirect } from '@sveltejs/kit';
import { building } from '$app/env';
import { auth } from '#lib/server/auth.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';
export const handle: Handle = async ({ event, resolve }) => {
 const session = await auth.api.getSession({ headers: event.request.headers });
 if (session) { event.locals.session = session.session; event.locals.user = session.user; }
 if (!building && !event.url.pathname.startsWith('/api/auth') && !['/login','/forgot-password','/reset-password'].includes(event.url.pathname) && !session) {if(event.url.pathname.startsWith('/api/'))return json({message:'Connexion requise.'},{status:401});redirect(303, '/login');}
 if (event.url.pathname === '/login' && session) redirect(303, '/');
 const savedTheme=event.cookies.get('lisiere-theme');
 const theme=savedTheme==='light'||savedTheme==='dark'?savedTheme:'system';
 return svelteKitHandler({ event, auth, building, resolve: (event) => resolve(event,{
  transformPageChunk: ({html}) => html.replace('%lisiere.theme%',theme)
 }) });
};
