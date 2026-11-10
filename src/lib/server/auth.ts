import { ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

import { postgres } from './postgres';
import * as pgSchema from './postgres/schema';
import {z} from 'zod';
import { sendPasswordReset,sendAccountEmail } from './email';

export const auth = betterAuth({
	baseURL: ORIGIN,
 trustedOrigins: [ORIGIN, 'http://localhost:5173'],
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(postgres,{provider:'pg',schema:pgSchema}),
    advanced: {database:{generateId:({model})=>model==='user'?false:crypto.randomUUID()}},
    user:{
        additionalFields:{
            firstName:{type:'string',required:false,validator:{input:z.string().trim().max(80)}},
            lastName:{type:'string',required:false,validator:{input:z.string().trim().max(80)}}
        },
        changeEmail:{enabled:true,updateEmailWithoutVerification:false,sendChangeEmailConfirmation:async({user,newEmail,url})=>{await sendAccountEmail(user.email,url,'approve',newEmail);}}
    },
    emailVerification:{expiresIn:1800,sendOnSignUp:false,sendVerificationEmail:async({user,url})=>{await sendAccountEmail(user.email,url,'verify');}},
    emailAndPassword: {
        enabled: true,
        resetPasswordTokenExpiresIn: 30 * 60,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({user,url}) => { await sendPasswordReset(user.email,url); }
    },
    rateLimit: {
        enabled: true,
        customRules: {
            '/request-password-reset': {window:60,max:3},
            '/reset-password': {window:60,max:5},
            '/change-email':{window:60,max:3},
            '/change-password':{window:60,max:5}
        }
    },
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
