<script lang="ts">
 import Eye from 'phosphor-svelte/lib/EyeIcon';import EyeSlash from 'phosphor-svelte/lib/EyeSlashIcon';
 let {id,name='currentPassword',label='Mot de passe actuel'}:{id:string;name?:string;label?:string}=$props();let visible=$state(false);
</script>
<label class="label" for={id}>{label}</label><div class="password-field"><input class="input" {id} {name} type={visible?'text':'password'} autocomplete="current-password" required maxlength="128"/><button class="btn password-toggle" type="button" aria-label={visible?'Masquer le mot de passe':'Afficher le mot de passe'} aria-pressed={visible} onclick={()=>visible=!visible}>{#if visible}<EyeSlash size={18}/>{:else}<Eye size={18}/>{/if}</button></div>
