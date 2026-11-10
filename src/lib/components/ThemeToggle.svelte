<script lang="ts">
 import { onMount } from 'svelte';
 import Moon from 'phosphor-svelte/lib/MoonIcon';
import Sun from 'phosphor-svelte/lib/SunIcon';
 let {inline=false}:{inline?:boolean}=$props();
 let light=$state(false);
 onMount(()=>{light=document.documentElement.dataset.theme==='light';});
 function toggle(){
  light=!light;
  document.documentElement.dataset.theme=light?'light':'dark';
  document.cookie='lisiere-theme='+(light?'light':'dark')+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
  try{localStorage.setItem('lisiere-theme',light?'light':'dark');}catch{/* Theme remains usable when storage is blocked. */}
 }
</script>
<button class="theme-toggle" class:inline type="button" onclick={toggle} aria-label={light?'Activer le thème sombre':'Activer le thème clair'} title={light?'Thème sombre':'Thème clair'}>
 {#if light}<Moon size={18} weight="regular"/>{:else}<Sun size={18} weight="regular"/>{/if}
</button>
<style>
 .theme-toggle{position:absolute;top:24px;right:24px;z-index:2;display:grid;place-items:center;width:44px;height:44px;border:0;background:transparent;color:var(--text-secondary);transition:color 160ms ease,background-color 160ms ease}
 .theme-toggle.inline{position:static;inset:auto;flex:0 0 40px;width:40px;height:40px}
 .theme-toggle:hover{color:var(--accent);background:transparent}
 .theme-toggle:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
 @media(max-width:700px){.theme-toggle{top:22px;right:24px}}
</style>
