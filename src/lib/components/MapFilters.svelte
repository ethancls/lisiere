<script lang="ts">
 import CaretDown from 'phosphor-svelte/lib/CaretDownIcon';
 import FunnelSimple from 'phosphor-svelte/lib/FunnelSimpleIcon';
 import {maxBookTitleLength,maxBookGenreLength} from '#lib/types/books.ts';
 import {countBoxFilters,emptyBoxFilters,maxStreetLength,type BoxFilters,type FilterCommune} from '#lib/types/boxes.ts';

 let {filters,onChange}:{filters:BoxFilters;onChange:(filters:BoxFilters)=>void}=$props();
 let open=$state(false),options=$state<FilterCommune[]|null>(null),failed=$state(false),retry=$state(0);
 const count=$derived(countBoxFilters(filters));
 const departments=$derived([...new Map((options??[]).flatMap(({department:d})=>d?[[d.id,d] as const]:[])).values()].sort((a,b)=>a.code.localeCompare(b.code,'fr',{numeric:true})));
 const communes=$derived((options??[]).filter(item=>filters.department===null||item.department?.id===filters.department));

 $effect(()=>{
  if(!open||options)return;
  void retry;
  const controller=new AbortController();
  failed=false;
  void fetch('/api/communes',{signal:controller.signal}).then(async response=>{
   if(!response.ok)throw new Error();
   const data:FilterCommune[]=await response.json();
   if(!controller.signal.aborted)options=data;
  }).catch(()=>{if(!controller.signal.aborted)failed=true;});
  return()=>controller.abort();
 });

 function changeDepartment(value:string){
  const department=Number(value)||null;
  const commune=department!==null&&options?.find(item=>item.id===filters.commune)?.department?.id!==department?null:filters.commune;
  onChange({...filters,department,commune});
 }
</script>

<details class="map-filters" bind:open>
 <summary><FunnelSimple size={18}/> Filtres de la carte {#if count}<span class="filter-count" aria-label={count+' filtres actifs'}>{count}</span>{/if}<CaretDown size={16} class="caret"/></summary>
 <div class="fields">
  <label>Département
   <select class="input" disabled={!options} value={filters.department??''} onchange={event=>changeDepartment(event.currentTarget.value)}>
    <option value="">Tous les départements</option>
    {#each departments as item (item.id)}<option value={item.id}>{item.code} · {item.name}</option>{/each}
   </select>
  </label>
  <label>Commune
   <select class="input" disabled={!options} value={filters.commune??''} onchange={event=>onChange({...filters,commune:Number(event.currentTarget.value)||null})}>
    <option value="">Toutes les communes</option>
    {#each communes as item (item.id)}<option value={item.id}>{item.name} · {item.postalCode}</option>{/each}
   </select>
  </label>
  <label>Nom de rue
   <input class="input" value={filters.street} maxlength={maxStreetLength} placeholder="Ex. République" oninput={event=>onChange({...filters,street:event.currentTarget.value})}/>
  </label>
  <label>Livres dans les boîtes
   <select class="input" value={filters.books} onchange={event=>onChange({...filters,books:event.currentTarget.value as BoxFilters['books']})}>
    <option value="all">Toutes les boîtes</option><option value="with">Avec des livres</option><option value="without">Sans livre</option>
   </select>
  </label>
  <label>Titre du livre
   <input class="input" value={filters.title} maxlength={maxBookTitleLength} placeholder="Ex. Le Petit Prince" oninput={event=>onChange({...filters,title:event.currentTarget.value})}/>
  </label>
  <label>Genre du livre
   <input class="input" value={filters.genre} maxlength={maxBookGenreLength} placeholder="Ex. Roman" oninput={event=>onChange({...filters,genre:event.currentTarget.value})}/>
  </label>
  <button class="btn reset" type="button" disabled={!count} onclick={()=>onChange({...emptyBoxFilters})}>Réinitialiser</button>
 </div>
 {#if failed}<p class="filter-note" role="alert">Les communes et départements n’ont pas pu être chargés. <button type="button" onclick={()=>retry++}>Réessayer</button></p>
 {:else if !options}<p class="filter-note" role="status">Chargement des communes et départements…</p>{/if}
 {#if filters.books==='without'&&(filters.title.trim()||filters.genre.trim())}<p class="filter-note" role="status">Une boîte sans livre ne peut pas correspondre à un titre ou à un genre.</p>{/if}
</details>

<style>
 .map-filters{flex-shrink:0;margin:0 24px 12px;border:1px solid var(--border);border-radius:var(--control-radius);background:var(--surface)}
 summary{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 12px;cursor:pointer;font-size:13px;font-weight:500;list-style:none}
 summary::-webkit-details-marker{display:none}
 summary :global(.caret){margin-left:auto}
 details[open] summary :global(.caret){transform:rotate(180deg)}
 .filter-count{padding:2px 7px;border-radius:99px;background:var(--accent-surface);color:var(--accent);font-size:12px}
 .fields{display:grid;grid-template-columns:repeat(6,minmax(0,1fr)) auto;align-items:end;gap:10px;padding:0 12px 12px}
 label{display:grid;gap:4px;min-width:0;margin:0;font-size:12px;color:var(--text-secondary)}
 .input,.reset{min-width:0;min-height:44px;padding:6px 8px;font-size:13px}
 select.input{border:1px solid var(--field-border)}
 .filter-note{margin:0;padding:0 12px 10px;color:var(--text-secondary);font-size:12px}
 .filter-note button{color:var(--accent);text-decoration:underline}
 @media(max-width:1000px){.map-filters{margin-inline:16px}.fields{grid-template-columns:repeat(3,minmax(0,1fr))}}
 @media(max-width:700px){.map-filters{margin-inline:12px}.fields{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 8px}.input{font-size:16px}}
</style>
