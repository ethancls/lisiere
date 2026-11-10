<script lang="ts">
 import Check from 'phosphor-svelte/lib/CheckIcon';
import X from 'phosphor-svelte/lib/XIcon';
import Eye from 'phosphor-svelte/lib/EyeIcon';
import EyeOff from 'phosphor-svelte/lib/EyeSlashIcon';
 let { password = $bindable(''), confirmation = $bindable('') }: {password?:string;confirmation?:string} = $props();
 let visible = $state(false); let confirmVisible = $state(false);
 const validLength = $derived(password.length>=8 && password.length<=128);
 const matches = $derived(confirmation.length>0 && confirmation===password);
</script>
<label class="label" for="new-password">Nouveau mot de passe</label>
<div class="password-field"><input class="input" id="new-password" type={visible?'text':'password'} name="password" bind:value={password} minlength="8" maxlength="128" required autocomplete="new-password" placeholder="Choisissez un mot de passe" aria-describedby="password-rule"/><button type="button" class="btn password-toggle" aria-label={visible?'Masquer le mot de passe':'Afficher le mot de passe'} aria-pressed={visible} onclick={()=>visible=!visible}>{#if visible}<EyeOff size={18}/>{:else}<Eye size={18}/>{/if}</button></div>
<p id="password-rule" class="password-rule" class:valid={validLength} class:invalid={password.length>0&&!validLength} aria-live="polite">{#if validLength}<Check size={14}/>{:else}<X size={14}/>{/if} Entre 8 et 128 caractères</p>
<label class="label" for="confirmation">Confirmer le mot de passe</label>
<div class="password-field"><input class="input" id="confirmation" type={confirmVisible?'text':'password'} name="confirmation" bind:value={confirmation} required maxlength="128" autocomplete="new-password" placeholder="Saisissez-le à nouveau" aria-describedby="password-match" aria-invalid={confirmation.length>0&&!matches}/><button type="button" class="btn password-toggle" aria-label={confirmVisible?'Masquer la confirmation':'Afficher la confirmation'} aria-pressed={confirmVisible} onclick={()=>confirmVisible=!confirmVisible}>{#if confirmVisible}<EyeOff size={18}/>{:else}<Eye size={18}/>{/if}</button></div>
<p id="password-match" class="password-rule" class:valid={matches} class:invalid={confirmation.length>0&&!matches} aria-live="polite">{#if matches}<Check size={14}/>{:else}<X size={14}/>{/if} Les mots de passe correspondent</p>
