<script lang="ts">
 import { enhance } from '$app/forms'; import ArrowLeft from 'phosphor-svelte/lib/ArrowLeftIcon';
import MailCheck from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
 import AuthShell from '#lib/components/AuthShell.svelte';
 let {form}=$props(); let pending=$state(false);
</script>
<svelte:head><title>Lisière | Mot de passe oublié</title></svelte:head>
<AuthShell>
 <span class="eyebrow">Votre compte</span>
 {#if form?.sent}
  <div class="auth-state-icon"><MailCheck size={28}/></div><h2>Vérifiez vos e-mails</h2>
  <p class="muted" role="status">Si un compte correspond à cette adresse, vous recevrez un lien de réinitialisation.</p>
  <p class="small muted">Le lien est valable 30 minutes. Pensez à vérifier vos courriers indésirables.</p>
 {:else}
  <h2>Mot de passe oublié ?</h2><p class="muted">Indiquez votre adresse e-mail pour recevoir un lien de réinitialisation.</p>
  <form method="POST" use:enhance={()=>{pending=true;return async({update})=>{await update({reset:false});pending=false;};}}>
   <label for="email">Adresse e-mail<input id="email" name="email" type="email" required maxlength="254" autocomplete="email" placeholder="nom@exemple.fr"/></label>
   {#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
   <button class="primary full" disabled={pending}>{pending?'Envoi…':'Recevoir le lien'}</button>
  </form>
 {/if}
 <a class="auth-back" href="/login"><ArrowLeft size={15}/> Retour à la connexion</a>
</AuthShell>
