<script lang="ts">
 import {Select} from 'bits-ui';
 import CaretDown from 'phosphor-svelte/lib/CaretDownIcon';
 import Check from 'phosphor-svelte/lib/CheckIcon';

 let {value,disabled=false,onChange}:{value:number;disabled?:boolean;onChange:(value:number)=>void}=$props();
 const items=[25,50,100].map(size=>({value:String(size),label:String(size)}));
</script>

<!-- Skeleton v5 only styles native selects. Bits provides the custom listbox. -->
<Select.Root type="single" value={String(value)} {items} {disabled} allowDeselect={false} onValueChange={next=>{if(next)onChange(Number(next));}}>
 <Select.Trigger class="btn page-size-trigger" aria-label="Lignes par page"><span>{value}</span><CaretDown size={16}/></Select.Trigger>
 <Select.Portal>
  <Select.Content class="card choice-list page-size-options" side="top" align="start" sideOffset={8} collisionPadding={12}>
   <Select.Viewport>
    {#each items as item (item.value)}
     <Select.Item value={item.value} label={item.label} class="choice-item">
      {#snippet children({selected})}<span>{item.label}</span><span class="choice-check">{#if selected}<Check size={16}/>{/if}</span>{/snippet}
     </Select.Item>
    {/each}
   </Select.Viewport>
  </Select.Content>
 </Select.Portal>
</Select.Root>

<style>
 :global(.page-size-trigger){display:inline-flex;align-items:center;justify-content:space-between;gap:12px;min-width:76px;min-height:40px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--control-radius);background:var(--surface);color:var(--text);font-size:13px;font-weight:400;line-height:20px;font-variant-numeric:tabular-nums;box-shadow:none}
 :global(.page-size-trigger svg){color:var(--muted);transition:color 160ms ease}
 :global(.page-size-trigger:hover svg),:global(.page-size-trigger[data-state=open] svg){color:var(--accent)}
 :global(.page-size-trigger:focus-visible){outline:2px solid var(--accent);outline-offset:3px}
 :global(.page-size-trigger:disabled){cursor:default;opacity:.4}
 :global(.page-size-options){min-width:var(--bits-select-anchor-width);font-variant-numeric:tabular-nums}
 .choice-check{display:grid;place-items:center;width:16px;height:16px;color:var(--accent)}
</style>
