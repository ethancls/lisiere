<script lang="ts">
 import {Menu,Portal} from '@skeletonlabs/skeleton-svelte';
 import {goto} from '$app/navigation';
 import type {Snippet} from 'svelte';
 import Logo from './Logo.svelte';import ThemeToggle from './ThemeToggle.svelte';import UserAvatar from './UserAvatar.svelte';
 import Search from 'phosphor-svelte/lib/MagnifyingGlassIcon';import X from 'phosphor-svelte/lib/XIcon';import Gear from 'phosphor-svelte/lib/GearIcon';import LogOut from 'phosphor-svelte/lib/SignOutIcon';
 let {user,search=$bindable(''),onSearch,showSearch=true,settings=false,actions}:{user:{id:string;name:string;firstName?:string|null;lastName?:string|null};search?:string;onSearch?:()=>void;showSearch?:boolean;settings?:boolean;actions?:Snippet}=$props();
 let logoutForm:HTMLFormElement;
</script>
<div class="app-header" class:settings-header={!showSearch}>
 <a href="/" aria-label="Lisière, accueil" class="header-brand"><Logo/></a>
 {#if showSearch}<div class="header-search"><Search size={18}/><input class="input" aria-label="Rechercher une boîte" bind:value={search} oninput={()=>onSearch?.()} placeholder="Lieu, ville ou code postal"/>{#if search}<button class="btn clear-search" type="button" aria-label="Effacer la recherche" onclick={()=>{search='';onSearch?.();}}><X size={16}/></button>{/if}</div>{/if}
 <div class="header-actions">{#if actions}<div class="header-primary">{@render actions()}</div>{/if}<ThemeToggle inline/><Menu positioning={{placement:'bottom-end',gutter:8}} onSelect={({value})=>{if(value==='settings')void goto('/settings');if(value==='logout')logoutForm.requestSubmit();}}>
 <Menu.Trigger class="btn profile-trigger" aria-label="Menu du compte" title="Compte"><UserAvatar {user}/></Menu.Trigger>
 <Portal><Menu.Positioner class="account-menu-positioner"><Menu.Content class="card account-menu" aria-label="Compte">
 <Menu.Item value="settings" class="account-menu-item" aria-current={settings?'page':undefined}><Gear size={18}/><Menu.ItemText>Paramètres</Menu.ItemText></Menu.Item>
 <Menu.Item value="logout" class="account-menu-item account-menu-logout"><LogOut size={18}/><Menu.ItemText>Déconnexion</Menu.ItemText></Menu.Item>
 </Menu.Content></Menu.Positioner></Portal>
 </Menu><form method="POST" action="/settings?/logout" bind:this={logoutForm} hidden></form></div>
</div>
<style>
 .app-header{display:grid;grid-template-columns:160px minmax(160px,400px) max-content;justify-content:space-between;align-items:center;gap:24px;min-height:88px;flex-shrink:0;padding:16px 24px;box-sizing:border-box}.settings-header{grid-template-columns:160px max-content}.header-brand{display:flex;align-items:center;width:160px;min-width:0;text-decoration:none}.header-search{display:flex;align-items:center;gap:12px;position:relative;height:44px;min-width:0;border:1px solid var(--border);border-radius:8px;padding:0 12px;color:var(--muted);background:var(--surface)}
 .header-search .input{width:100%;height:42px;min-width:0;margin:0;padding:0 28px 0 0;background:transparent;border:0;border-radius:0;box-shadow:none;outline:none;outline-offset:0;font:inherit;font-size:13px;color:var(--text)}.header-search .input:focus,.header-search .input:focus-visible{outline:none;box-shadow:none;border:0}.header-search:focus-within{outline:2px solid var(--accent);outline-offset:2px}.header-search :global(svg){flex-shrink:0}.clear-search{position:absolute;right:6px;top:5px;display:grid;place-items:center;min-width:32px;width:32px;height:32px;padding:0;background:none;color:var(--muted);border:0}
 .header-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}.header-actions form{display:flex;margin:0}.header-actions form[hidden]{display:none}.header-primary{flex-shrink:0;min-height:40px}:global(.header-primary .primary){display:flex;align-items:center;justify-content:center;gap:8px;height:40px;min-height:40px;width:164px;min-width:164px;padding:0 16px;border-radius:8px;font-size:13px;line-height:20px;font-weight:500;white-space:nowrap;background:var(--accent);color:#183024}:global([data-theme=light] .header-primary .primary){color:#fff}
 :global(.profile-trigger){display:grid;place-items:center;width:40px;height:40px;min-width:40px;padding:0;border:0;border-radius:50%;background:transparent;box-shadow:none}
 :global(.profile-trigger:hover){background:transparent}
 :global(.account-menu-positioner){z-index:60}
 :global(.account-menu){width:200px;padding:4px;background:var(--surface);border:1px solid var(--border);border-radius:var(--panel-radius);box-shadow:var(--popover-shadow);color:var(--text-secondary);outline:none}
 :global(.account-menu-item){display:flex;align-items:center;gap:8px;min-height:40px;padding:8px 12px;cursor:pointer;border:0;background:transparent;font-size:13px;color:var(--text-secondary);border-radius:var(--control-radius);line-height:20px;transition:color 160ms ease,background-color 160ms ease}
 :global(.account-menu-item svg){width:18px;height:18px;flex-shrink:0;transition:color 160ms ease}
 :global(.account-menu-item:hover),:global(.account-menu-item[data-highlighted]){background:var(--accent-surface);color:var(--accent)}
 :global(.account-menu-logout:hover),:global(.account-menu-logout[data-highlighted]){background:var(--negative-surface);color:var(--negative)}
 :global(.account-menu-item:hover svg),:global(.account-menu-item[data-highlighted] svg){color:var(--accent)}
 :global(.account-menu-logout:hover svg),:global(.account-menu-logout[data-highlighted] svg){color:var(--negative)}
 .clear-search:hover{background:transparent;color:var(--accent)}.clear-search :global(svg){width:16px;height:16px}
 .app-header :focus-visible{outline:2px solid var(--accent);outline-offset:3px}.app-header .header-search .input:focus-visible{outline:none}
 @media(max-width:1000px){.app-header{grid-template-columns:140px minmax(120px,1fr) max-content;padding:16px;gap:16px}.settings-header{grid-template-columns:140px max-content}.header-brand{width:140px}.header-actions{gap:4px}}
 @media(max-width:760px){.app-header{grid-template-columns:1fr max-content;gap:12px;padding:16px 12px}.header-search{grid-column:1/-1;grid-row:2}.header-actions{grid-column:2;grid-row:1}.header-brand{width:124px}:global(.header-brand .brand){font-size:25px}:global(.header-brand .brand svg){width:32px;height:32px}.header-search .input{font-size:16px}.header-primary{grid-column:1/-1}:global(.header-primary .primary){width:40px;min-width:40px;padding:0;font-size:0;gap:0}:global(.header-primary .primary svg){width:20px;height:20px}.header-actions{gap:0}}
</style>
