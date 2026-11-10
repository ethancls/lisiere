import { RESEND_API_KEY, RESEND_FROM } from '$app/env/private';
import { Resend } from 'resend';
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
export async function sendPasswordReset(to: string, url: string) {
 if (!RESEND_API_KEY || !RESEND_FROM) throw new Error('Email configuration missing');
 const {data,error} = await new Resend(RESEND_API_KEY).emails.send({
  from: RESEND_FROM, to, subject: 'Réinitialisez votre mot de passe — Lisière',
  text: `Réinitialisez votre mot de passe Lisière : ${url}\n\nCe lien est valable 30 minutes et ne peut être utilisé qu’une fois.\nSi vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.`,
  html: `<div style="background:#101211;padding:40px 24px;font-family:Arial,sans-serif;color:#eeeee9"><div style="max-width:480px;margin:auto"><p style="color:#b7ef74;font-size:28px;font-weight:bold">lisière.</p><h1 style="font-size:24px">Nouveau mot de passe</h1><p>Vous avez demandé à réinitialiser votre mot de passe.</p><p style="margin:32px 0"><a href="${escapeHtml(url)}" style="background:#b7ef74;color:#183024;text-decoration:none;padding:14px 22px;border-radius:24px;display:inline-block">Choisir un mot de passe</a></p><p style="color:#aab8ad;font-size:13px">Ce lien est valable 30 minutes et ne peut être utilisé qu’une fois.</p><p style="color:#aab8ad;font-size:13px">Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p></div></div>`
 });
 if(error) {console.error('Reset email provider rejected request',{code:error.name});throw new Error('Reset email delivery failed');}
 console.info('Reset email accepted',{id:data?.id});
}

export async function sendAccountEmail(to:string,url:string,kind:'verify'|'approve',newEmail?:string){
 const title=kind==='verify'?'Confirmez votre adresse e-mail':'Confirmez le changement d’adresse';
 const message=kind==='verify'?'Confirmez cette adresse pour l’utiliser avec votre compte Lisière.':`Vous avez demandé à utiliser l’adresse ${newEmail??''} pour votre compte Lisière.`;
 const {error}=await new Resend(RESEND_API_KEY).emails.send({from:RESEND_FROM,to,subject:`${title} — Lisière`,text:`${message}\n\n${url}\n\nCe lien est valable 30 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.`,html:`<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;color:#20251f"><p style="color:#3c661f;font-size:26px">lisière.</p><h1 style="font-size:22px">${title}</h1><p>${escapeHtml(message)}</p><p style="margin:32px 0"><a style="padding:14px 20px;border-radius:8px;background:#3c661f;color:#fff;text-decoration:none" href="${escapeHtml(url)}">Confirmer</a></p><p>Ce lien est valable 30 minutes.</p><p>Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p></div>`});
 if(error){console.error('Account email rejected',{code:error.name});throw new Error('Account email delivery failed');}
}
