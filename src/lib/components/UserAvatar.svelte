<script lang="ts">
 import {Avatar} from '@skeletonlabs/skeleton-svelte';
 let {user,size=36}:{user:{id:string;name:string;firstName?:string|null;lastName?:string|null};size?:number}=$props();
 const initials=$derived((user.firstName||user.lastName)?((user.firstName?.trim()[0]??'')+(user.lastName?.trim()[0]??'' )).toLocaleUpperCase('fr'):user.name.trim().split(/\s+/).slice(0,2).map(s=>s[0]??'').join('').toLocaleUpperCase('fr'));
 const colours=['var(--clap-lavender)','var(--clap-peach)','var(--clap-mint)'];
 // Modulo is applied explicitly so colour selection is stable on server and client.
 const index=$derived(Math.abs([...String(user.id)].reduce((hash,ch)=>(Math.imul(hash,31)+ch.charCodeAt(0))|0,0))%colours.length);
</script>
<Avatar class="user-avatar" style={`width:${size}px;height:${size}px;background:${colours[index]};`}><Avatar.Fallback class="user-avatar-fallback">{initials||'?'}</Avatar.Fallback></Avatar>
<style>:global(.user-avatar){display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:50%;overflow:hidden;color:#242731;font-size:13px;font-weight:600;line-height:1;letter-spacing:0;user-select:none}:global(.user-avatar-fallback){display:flex;align-items:center;justify-content:center;width:100%;height:100%}</style>
