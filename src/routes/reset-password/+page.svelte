<script lang="ts">
 import { enhance } from '$app/forms'; import ArrowLeft from 'phosphor-svelte/lib/ArrowLeftIcon';
import Check from 'phosphor-svelte/lib/CheckIcon';
 import AuthShell from '#lib/components/AuthShell.svelte'; import NewPassword from '#lib/components/NewPassword.svelte';
 let {data,form}=$props(); let password=$state(''),confirmation=$state(''),pending=$state(false);
 const valid=$derived(password.length>=8&&password.length<=128&&password===confirmation);
</script>
<svelte:head><title>Lisière | Nouveau mot de passe</title><meta name="referrer" content="no-referrer"/></svelte:head>
<AuthShell>
 <span class="eyebrow">Votre compte</span>
 {#if form?.success}
  <div class="auth-state-icon"><Check size={28}/></div><h2>Mot de passe modifié</h2><p class="muted" role="status">Vous pouvez vous connecter avec votre nouveau mot de passe.</p><a class="primary full" href="/login">Se connecter</a>
 {:else if data.invalid||form?.invalid}
  <h2>Lien expiré ou invalide</h2><p class="muted">Demandez un nouveau lien pour réinitialiser votre mot de passe.</p><a class="primary full" href="/forgot-password">Recevoir un nouveau lien</a>
 {:else}
  <h2>Nouveau mot de passe</h2><p class="muted">Choisissez un mot de passe pour votre compte.</p>
  <form method="POST" use:enhance={()=>{pending=true;return async({result,update})=>{await update({reset:result.type==='success'});pending=false;};}}>
   <input type="hidden" name="token" value={data.token}/><NewPassword bind:password bind:confirmation/>
   {#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
   <button class="primary full" disabled={pending||!valid}>{pending?'Enregistrement…':'Enregistrer le mot de passe'}</button>
  </form>
 {/if}
 <a class="auth-back" href="/login"><ArrowLeft size={15}/> Retour à la connexion</a>
</AuthShell>
