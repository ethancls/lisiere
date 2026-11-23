<script lang="ts">
 import Search from 'phosphor-svelte/lib/MagnifyingGlassIcon';
 import X from 'phosphor-svelte/lib/XIcon';
 import {maxPlaceQueryLength,minPlaceQueryLength,type Place} from '#lib/types/places.ts';

 let {onSelect}:{onSelect:(place:Place)=>void}=$props();
 const id=$props.id();
 let input:HTMLInputElement;
 let text=$state(''),open=$state(false),selected=$state(false),composing=$state(false);
 let status=$state<'loading'|'ready'|'error'>('loading'),items=$state<Place[]>([]),highlight=$state(-1),retry=$state(0);
 const query=$derived(text.trim());
 const expanded=$derived(open&&!selected&&!composing&&query.length>=minPlaceQueryLength);
 const activeOption=$derived(expanded&&status==='ready'&&highlight>=0?id+'-'+highlight:undefined);

 $effect(()=>{
  if(!expanded)return;
  void retry;
  const q=query,controller=new AbortController();
  status='loading';items=[];highlight=-1;
  const timer=setTimeout(async()=>{
   try{
    const response=await fetch('/api/places?'+new URLSearchParams({q}),{signal:controller.signal});
    if(!response.ok)throw new Error();
    const results:Place[]=await response.json();
    if(!controller.signal.aborted){items=results;status='ready';}
   }catch{if(!controller.signal.aborted)status='error';}
  },320);
  return()=>{clearTimeout(timer);controller.abort();};
 });

 function choose(place:Place){
  text=place.kind==='municipality'?place.locality:place.label+', '+place.locality;
  open=false;selected=true;input.focus();onSelect(place);
 }
 function keyboard(event:KeyboardEvent){
  if(event.isComposing||composing)return;
  if(event.key==='Escape'&&expanded){event.preventDefault();open=false;return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   if(selected||query.length<minPlaceQueryLength)return;
   event.preventDefault();
   if(!expanded){open=true;return;}
   if(status!=='ready'||!items.length)return;
   highlight=event.key==='ArrowDown'?(highlight+1)%items.length:(highlight<=0?items.length-1:highlight-1);
   document.getElementById(id+'-'+highlight)?.scrollIntoView({block:'nearest'});
  }
  if(event.key==='Enter'&&expanded&&status==='ready'&&items[highlight]){
   event.preventDefault();choose(items[highlight]);
  }
 }
</script>

<div class="place-search" onfocusout={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))open=false;}}>
 <Search size={18}/>
 <input class="input" bind:this={input} value={text} type="text" role="combobox" aria-label="Rechercher un lieu sur la carte"
  aria-autocomplete="list" aria-expanded={expanded} aria-controls={id} aria-activedescendant={activeOption}
  maxlength={maxPlaceQueryLength} autocomplete="off" placeholder="Ville, rue ou code postal"
  onfocus={()=>{if(!selected)open=true;}} onkeydown={keyboard}
  oncompositionstart={()=>composing=true} oncompositionend={()=>composing=false}
  oninput={event=>{text=event.currentTarget.value;selected=false;open=true;}}/>
 {#if text}<button class="clear" type="button" aria-label="Effacer le lieu recherché" onclick={()=>{text='';selected=false;input.focus();}}><X size={16}/></button>{/if}
 <div class="suggestions" hidden={!expanded}>
  <div id={id} role="listbox" aria-label="Lieux proposés">
   {#if expanded&&status==='ready'}
    {#each items as place,i}
     <button type="button" role="option" aria-selected={highlight===i} id={id+'-'+i} tabindex="-1"
      onmousedown={event=>event.preventDefault()} onclick={()=>choose(place)}>
      <strong>{place.label}</strong><span>{place.kind==='municipality'?place.locality.slice(0,5):place.locality}</span>
     </button>
    {/each}
   {/if}
  </div>
  <div role="status" class="search-status" hidden={!expanded||status==='ready'&&items.length>0}>
   {#if status==='loading'}Recherche de lieux…{:else if status==='error'}Recherche indisponible. <button type="button" class="retry" onclick={()=>{input.focus();retry++;}}>Réessayer</button>{:else}Aucun lieu trouvé. Essayez de préciser la commune ou le code postal.{/if}
  </div>
 </div>
</div>

<style>
 .place-search{position:relative;display:flex;align-items:center;gap:12px;min-width:0;height:44px;padding:0 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--muted);z-index:5}
 .place-search:focus-within{outline:2px solid var(--accent);outline-offset:2px}
 .place-search :global(svg){flex-shrink:0}
 .place-search .input{min-width:0;width:100%;height:42px;margin:0;padding:0 28px 0 0;background:transparent;border:0;border-radius:0;box-shadow:none;outline:none;font:inherit;font-size:13px;color:var(--text)}
 .clear{position:absolute;right:6px;top:5px;display:grid;place-items:center;width:32px;height:32px}
 .suggestions{position:absolute;top:calc(100% + 6px);inset-inline:0;max-height:min(320px,50dvh);overflow:auto;padding:4px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:var(--panel-radius);box-shadow:var(--popover-shadow)}
 .suggestions [role=option]{display:flex;flex-direction:column;gap:3px;min-height:44px;width:100%;padding:8px 10px;text-align:left;font-size:13px;border-radius:var(--control-radius)}
 .suggestions [role=option]:hover,.suggestions [aria-selected=true]{background:var(--accent-surface);color:var(--accent)}
 .suggestions strong{font-weight:500}.suggestions span,.search-status{color:var(--text-secondary);font-size:12px}.search-status{padding:8px 10px}
 .retry{min-height:32px;color:var(--accent);text-decoration:underline}
 @media(max-width:760px){.place-search .input{font-size:16px}}
</style>
