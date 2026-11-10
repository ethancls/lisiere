<script lang="ts">
 import { enhance } from '$app/forms';
 import Check from 'phosphor-svelte/lib/CheckIcon';
import X from 'phosphor-svelte/lib/XIcon';
import Eye from 'phosphor-svelte/lib/EyeIcon';
import EyeOff from 'phosphor-svelte/lib/EyeSlashIcon';
import ArrowUpRight from 'phosphor-svelte/lib/ArrowUpRightIcon';
 import AuthShell from '#lib/components/AuthShell.svelte';
 let { form } = $props();
 let signup = $state(false);
 let pending = $state(false);
 let password = $state('');
 let confirmation = $state('');
 let visible = $state(false);
 let confirmVisible = $state(false);
 const validLength = $derived(password.length >= 8 && password.length <= 128);
 const matches = $derived(confirmation.length > 0 && confirmation === password);
 function changeMode(value: boolean) {
  signup = value; form = null; password = ''; confirmation = ''; visible = false; confirmVisible = false;
 }
</script>
<svelte:head><title>Lisière | {signup ? 'Inscription' : 'Connexion'}</title></svelte:head>
<AuthShell>
  <span class="eyebrow">Bienvenue chez Lisière</span>
  <h2>{signup ? 'Rejoins l’histoire.' : 'Heureux de te revoir.'}</h2>
  <p class="muted">{signup ? 'Un compte pour explorer et contribuer.' : 'Tes prochaines découvertes sont tout près.'}</p>
  <div class="switch" aria-label="Accès au compte">
   <button type="button" class:active={!signup} aria-pressed={!signup} onclick={()=>changeMode(false)}>Connexion</button>
   <button type="button" class:active={signup} aria-pressed={signup} onclick={()=>changeMode(true)}>Créer un compte</button>
  </div>
  <form method="POST" use:enhance={()=>{
   pending=true;
   return async({result,update})=>{await update({reset:result.type==='success'});pending=false;};
  }}>
   <input type="hidden" name="mode" value={signup?'signup':'login'}/>
   {#if signup}<label for="name">Pseudo<input id="name" name="name" required maxlength="50" autocomplete="username" placeholder="Votre pseudo"/></label>{/if}
   <label for="email">Adresse e-mail<input id="email" type="email" name="email" required autocomplete="email" placeholder="nom@exemple.fr"/></label>
   <label for="password">Mot de passe</label>
   <div class="password-field">
    <input id="password" type={visible?'text':'password'} name="password" bind:value={password} minlength={signup?8:undefined} maxlength="128" required autocomplete={signup?'new-password':'current-password'} placeholder={signup?'Choisissez un mot de passe':'Votre mot de passe'} aria-describedby={signup?'password-rule':undefined}/>
    <button type="button" class="password-toggle" aria-label={visible?'Masquer le mot de passe':'Afficher le mot de passe'} aria-pressed={visible} onclick={()=>visible=!visible}>{#if visible}<EyeOff size={18}/>{:else}<Eye size={18}/>{/if}</button>
   </div>
   {#if signup}
    <p id="password-rule" class="password-rule" class:valid={validLength} class:invalid={password.length>0&&!validLength} aria-live="polite">
     {#if validLength}<Check size={14}/>{:else}<X size={14}/>{/if} Entre 8 et 128 caractères
    </p>
    <label for="confirmation">Confirmer le mot de passe</label>
    <div class="password-field">
     <input id="confirmation" name="confirmation" type={confirmVisible?'text':'password'} bind:value={confirmation} required maxlength="128" autocomplete="new-password" placeholder="Saisissez-le à nouveau" aria-describedby="password-match" aria-invalid={confirmation.length>0&&!matches}/>
     <button type="button" class="password-toggle" aria-label={confirmVisible?'Masquer la confirmation':'Afficher la confirmation'} aria-pressed={confirmVisible} onclick={()=>confirmVisible=!confirmVisible}>{#if confirmVisible}<EyeOff size={18}/>{:else}<Eye size={18}/>{/if}</button>
    </div>
    <p id="password-match" class="password-rule" class:valid={matches} class:invalid={confirmation.length>0&&!matches} aria-live="polite">{#if matches}<Check size={14}/>{:else}<X size={14}/>{/if} Les mots de passe correspondent</p>
   {/if}
   {#if form?.message}<p class="error" role="alert">{form.message}</p>{/if}
   <button class="primary full" disabled={pending||(signup&&(!validLength||!matches))}>{pending?'Chargement…':signup?'Créer mon compte':'Se connecter'}</button>
  </form>
  <a href="/forgot-password" class="forgot-password"><span class="forgot-label">Mot de passe oublié ?</span><span class="forgot-arrow"><ArrowUpRight size={15}/></span></a>
</AuthShell>
<style>
 .password-field{position:relative}.password-field input{padding-right:48px;margin-top:0}
 .password-toggle{position:absolute;right:5px;top:50%;transform:translateY(-50%);width:38px;height:38px;display:grid;place-items:center;color:var(--muted);border-radius:6px}
 .password-toggle:hover{color:var(--text)}
 label[for=password],label[for=confirmation]{margin-bottom:8px}
 .password-rule{display:flex;align-items:center;gap:7px;margin:9px 0 0;font-size:11px;color:var(--muted)}
 .password-rule.valid{color:var(--positive)}.password-rule.invalid{color:var(--negative)}
 :global(.forgot-password){display:flex;align-items:center;justify-content:center;gap:4px;width:fit-content;margin:30px auto 0;padding:5px 0;color:var(--lime);font-size:12px;text-decoration:none}
 .forgot-label{position:relative}
 .forgot-label::after{content:'';position:absolute;left:0;right:0;bottom:-4px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform 180ms ease}
 .forgot-arrow{display:inline-flex;transition:transform 180ms ease}
 :global(.forgot-password:hover) .forgot-label::after,:global(.forgot-password:focus-visible) .forgot-label::after{transform:scaleX(1)}
 :global(.forgot-password:hover) .forgot-arrow,:global(.forgot-password:focus-visible) .forgot-arrow{transform:translate(1px,-1px)}
 @media(prefers-reduced-motion:reduce){.forgot-label::after,.forgot-arrow{transition:none}:global(.forgot-password:hover) .forgot-arrow,:global(.forgot-password:focus-visible) .forgot-arrow{transform:none}}
</style>
