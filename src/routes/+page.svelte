<script lang="ts">
 import AppHeader from '#lib/components/AppHeader.svelte';
 import LoadingSkeleton from '#lib/components/LoadingSkeleton.svelte';
 import {onMount} from 'svelte';
 import Map from '#lib/components/Map.svelte';import AddBox from '#lib/components/AddBox.svelte';
 import PageSizeSelect from '#lib/components/PageSizeSelect.svelte';
 import CaretLeft from 'phosphor-svelte/lib/CaretLeftIcon';import CaretRight from 'phosphor-svelte/lib/CaretRightIcon';
 import type {Box,BoxPage,Bounds} from '#lib/types/boxes.ts';
 import MapPin from 'phosphor-svelte/lib/MapPinIcon';import Table from 'phosphor-svelte/lib/TableIcon';import X from 'phosphor-svelte/lib/XIcon';import ArrowUpRight from 'phosphor-svelte/lib/ArrowUpRightIcon';import ArrowsDownUp from 'phosphor-svelte/lib/ArrowsDownUpIcon';
 let {data,form}=$props();let mounted=$state(false),view=$state('map'),search=$state(''),selectedBox=$state<Box|null>(null),focusRequest=$state(0);
 let bounds=$state<Bounds>();let resultsPanel=$state<HTMLElement>();let camera=$state({center:[2.35,48.862] as [number,number],zoom:12.4});
 let sort=$state<'name'|'city'|'address'>('name'),ascending=$state(true),page=$state(1),pageSize=$state(25),refresh=$state(0);
 let mapData=$state<BoxPage>({items:[],total:0,totalAll:0,page:1,pages:1,pageSize:1000,truncated:false});
 let tableData=$state<BoxPage>({items:[],total:0,totalAll:0,page:1,pages:1,pageSize:25,truncated:false});
 let loading=$state(true),loadError=$state('');
 const number=new Intl.NumberFormat('fr-FR');
 const active=$derived(view==='map'?mapData:tableData);
 const current=$derived(selectedBox);
 const visibleBoxes=$derived(mapData.items.slice(0,100));
 function order(key:'name'|'city'|'address'){if(sort===key)ascending=!ascending;else{sort=key;ascending=true;}page=1;}
 function locate(box:Box){selectedBox=box;focusRequest++;view='map';}
 onMount(()=>{mounted=true;});
 $effect(()=>{
  if(!mounted)return;
  const mode=view,q=search.trim(),region=bounds,requestedPage=page,size=pageSize,sortKey=sort,direction=ascending?'asc':'desc',revision=refresh;
  void revision;
  if(mode==='map'&&!region){loading=true;return;}
  const controller=new AbortController();loading=true;loadError='';
  const timer=setTimeout(async()=>{
   const params=new URLSearchParams({mode,q,page:String(requestedPage),pageSize:String(size),sort:sortKey,direction});
   if(mode==='map'&&region)for(const [key,value]of Object.entries(region))params.set(key,String(value));
   try{
    const response=await fetch('/api/boxes?'+params,{signal:controller.signal});
    if(response.status===401){location.href='/login';return;}
    if(!response.ok)throw new Error('Les lieux n’ont pas pu être chargés.');
    const result:BoxPage=await response.json();if(controller.signal.aborted)return;
    if(mode==='map')mapData=result;else tableData=result;
   }catch(e){if(!controller.signal.aborted)loadError=e instanceof Error?e.message:'Chargement indisponible.';}
   finally{if(!controller.signal.aborted)loading=false;}
  },200);
  return()=>{clearTimeout(timer);controller.abort();};
 });
</script>
<svelte:head><title>Lisière | {view==='map'?'Carte':'Tableau'}</title></svelte:head>
<main class="home">
 <AppHeader user={data.user} bind:search onSearch={()=>page=1}>{#snippet actions()}<AddBox center={camera.center} onSaved={box=>{search='';refresh++;locate(box);}}/>{/snippet}</AppHeader>
 <div class="home-toolbar"><div class="home-context"><h1>Boîtes à livres</h1><span>{#if loading}<LoadingSkeleton variant="count" label="Chargement du nombre de lieux"/>{:else}{number.format(active.items.length)} lieu{active.items.length!==1?'x':''} affiché{active.items.length!==1?'s':''} sur {number.format(active.totalAll)}{/if}</span></div><div class="view-control" aria-label="Mode d’affichage"><button class:chosen={view==='map'} aria-pressed={view==='map'} onclick={()=>view='map'}><MapPin size={18}/>Carte</button><button class:chosen={view==='table'} aria-pressed={view==='table'} onclick={()=>view='table'}><Table size={18}/>Tableau</button></div></div>
 {#if form?.success}<div class="home-success" role="status">Boîte ajoutée.</div>{/if}
 <div class="home-content" class:table-view={view==='table'}>
 {#if view==='map'}
  <Map boxes={mapData.items} active={current} onSelect={locate} {focusRequest} panel={resultsPanel} bind:camera onBounds={value=>bounds=value}/>
  <section class="map-results" class:has-selection={!!current} aria-label="Résultats" bind:this={resultsPanel}><div class="results-heading"><h2>Dans cette zone</h2><span aria-live="polite">{#if loading}<LoadingSkeleton variant="count" label="Chargement des lieux"/>{:else}{number.format(mapData.total)}{/if}</span></div><div class="results-scroll" aria-busy={loading}>{#if loading}<div aria-hidden="true">{#each Array(5) as _}<LoadingSkeleton variant="list" announce={false}/>{/each}</div>{:else if loadError}<div class="empty-results" role="alert">{loadError} <button onclick={()=>refresh++}>Réessayer</button></div>{:else}{#each visibleBoxes as b}<button class="result-row" class:chosen={current?.id===b.id} aria-pressed={current?.id===b.id} onclick={()=>locate(b)}><span class="result-pin"><MapPin size={19}/></span><span class="result-text"><strong>{b.name}</strong><span>{b.address} · {b.city}</span></span><ArrowUpRight size={15}/></button>{:else}<p class="empty-results">Aucune boîte dans cette zone. Déplacez la carte ou élargissez la recherche.</p>{/each}{#if mapData.items.length>100}<p class="empty-results">100 lieux affichés dans la liste. Zoomez pour préciser la zone.</p>{/if}{#if mapData.truncated}<p class="empty-results">Zone étendue : les points sont limités à 1 000. Zoomez pour tous les voir.</p>{/if}{/if}</div>
  {#if current}<div class="result-detail"><div><strong>{current.name}</strong><button aria-label="Fermer la fiche" onclick={()=>selectedBox=null}><X size={16}/></button></div>{#if current.description}<p>{current.description}</p>{/if}<p class="detail-address">{current.address}<br/>{current.postalCode} {current.city}</p>{#if current.department}<p class="detail-department">{current.department}{current.departmentCode?' · '+current.departmentCode:''}</p>{/if}<button class="btn detail-recenter" onclick={()=>locate(current)}><MapPin size={16}/>Recentrer sur la boîte</button><a target="_blank" rel="noopener noreferrer" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(current.latitude+','+current.longitude)}>Ouvrir avec Google Maps <ArrowUpRight size={16}/></a></div>{/if}
  </section>
 {:else}
  <div class="home-table-scroll"><table class="home-table"><caption class="sr-only">Boîtes à livres</caption><thead><tr>{#each [{key:'name',label:'Nom'},{key:'address',label:'Adresse'},{key:'city',label:'Ville'}] as column}<th scope="col" aria-sort={sort===column.key?(ascending?'ascending':'descending'):'none'}><button onclick={()=>order(column.key as 'name'|'city'|'address')}>{column.label}<ArrowsDownUp size={14}/></button></th>{/each}<th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody aria-busy={loading}>{#if loading}{#each Array(6) as _}<tr aria-hidden="true"><td><LoadingSkeleton variant="table-name" announce={false}/></td><td><LoadingSkeleton variant="table-address" announce={false}/></td><td><LoadingSkeleton variant="table-city" announce={false}/></td><td><LoadingSkeleton variant="table-action" announce={false}/></td></tr>{/each}<tr class="sr-only"><td colspan="4"><span role="status">Chargement des lieux…</span></td></tr>{:else if loadError}<tr><td colspan="4" class="table-empty"><div role="alert">{loadError} <button onclick={()=>refresh++}>Réessayer</button></div></td></tr>{:else}{#each tableData.items as b,i}<tr><td><span class="row-number">{number.format((tableData.page-1)*tableData.pageSize+i+1)}</span><strong>{b.name}</strong></td><td>{b.address}</td><td>{b.city}</td><td><button class="table-map-link" aria-label={'Localiser '+b.name} onclick={()=>locate(b)}><MapPin size={18}/><span>Localiser</span></button></td></tr>{:else}<tr><td colspan="4" class="table-empty">Aucun résultat. Essayez une autre recherche.</td></tr>{/each}{/if}</tbody></table></div>
  <div class="table-pagination"><div class="page-size-control"><span>Lignes par page</span><PageSizeSelect value={pageSize} disabled={loading} onChange={value=>{pageSize=value;page=1;}}/></div><span class="page-range" aria-live="polite">{tableData.total===0?'0 résultat':`${number.format((tableData.page-1)*tableData.pageSize+1)}–${number.format(Math.min(tableData.page*tableData.pageSize,tableData.total))} sur ${number.format(tableData.total)}`}</span><nav class="page-navigation" aria-label="Pagination du tableau"><button class="btn" disabled={loading||tableData.page<=1} onclick={()=>page=tableData.page-1}><CaretLeft size={16}/><span>Précédent</span></button><span>{number.format(tableData.page)} / {number.format(tableData.pages)}</span><button class="btn" disabled={loading||tableData.page>=tableData.pages} onclick={()=>page=tableData.page+1}><span>Suivant</span><CaretRight size={16}/></button></nav></div>
 {/if}
 </div>

</main>
<style>
 .home{height:100svh;min-height:520px;display:flex;flex-direction:column;background:var(--page);color:var(--text);padding:0}





 .home-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:8px 24px 20px}.home-context{display:flex;align-items:baseline;gap:16px}.home-context h1{font-size:20px;font-weight:500;letter-spacing:-.4px;margin:0}.home-context>span{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}
 .view-control{display:flex;padding:4px;background:var(--surface);border:1px solid var(--border);border-radius:10px;gap:4px}.view-control button{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 16px;min-height:36px;border-radius:6px;font-size:12px;color:var(--text-secondary)}.view-control button.chosen{background:var(--surface-raised);color:var(--text)}
 .home-content{position:relative;flex:1;min-height:0;border:0;border-top:1px solid var(--border);border-radius:0;overflow:hidden;background:var(--surface)}
 .map-results{position:absolute;z-index:4;top:20px;left:20px;width:308px;max-height:calc(100% - 40px);display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--border);border-radius:var(--panel-radius);box-shadow:var(--popover-shadow);overflow:hidden}
 .results-heading{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--border)}.results-heading h2{font-size:13px;font-weight:500;letter-spacing:0}.results-heading>span{font-size:12px;color:var(--muted)}.results-scroll{overflow:auto;flex:1;min-height:0}.result-row{display:flex;align-items:center;gap:12px;text-align:left;width:100%;padding:16px;border-bottom:1px solid var(--border)}.result-row:last-child{border-bottom:0}.result-row.chosen{background:var(--surface-raised)}.result-row:hover :global(svg){color:var(--accent)}.result-pin{display:grid;place-items:center;color:var(--muted)}.result-row.chosen .result-pin{color:#ed9b55}.result-text{flex:1;min-width:0}.result-text strong{display:block;font-size:12px;font-weight:500;line-height:1.5;color:var(--text)}.result-text>span{display:block;font-size:12px;color:var(--text-secondary);line-height:1.5;margin-top:4px}.result-row>:global(svg){color:var(--muted);flex-shrink:0}.empty-results{font-size:13px;color:var(--text-secondary);padding:8px 16px}
 .detail-recenter{display:inline-flex;align-items:center;gap:8px;min-height:36px;background:transparent;color:var(--text-secondary);font-size:12px;font-weight:400}.detail-recenter:hover :global(svg){color:var(--accent)}.result-detail .detail-address{line-height:1.6;margin:12px 0 8px}.result-detail .detail-department{color:var(--muted);margin:0 0 8px}
 .result-detail{flex-shrink:0;padding:16px;border-top:1px solid var(--border)}.result-detail>div{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px}.result-detail button{display:flex;padding:4px}.result-detail p{font-size:12px;color:var(--text-secondary);margin:12px 0}.result-detail a{display:inline-flex;align-items:center;gap:8px;color:var(--accent);font-size:12px;text-decoration:none;margin-top:8px}
 .home-success{padding:8px 24px 16px;font-size:13px;color:var(--positive)}
 .table-view{display:flex;flex-direction:column}.home-table-scroll{flex:1;min-height:0;overflow:auto}.home-table{width:100%;border-collapse:collapse;white-space:nowrap;text-align:left}.home-table th{position:sticky;top:0;background:var(--surface);z-index:1;padding:0 20px;height:52px;border-bottom:1px solid var(--border);color:var(--text-secondary);font-size:12px;font-weight:400;text-transform:none;letter-spacing:0}.home-table th button{display:flex;align-items:center;gap:12px;padding:12px 0;color:inherit}.home-table th[aria-sort=ascending],.home-table th[aria-sort=descending]{color:var(--text)}.home-table td{height:72px;padding:16px 20px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text-secondary)}.home-table td strong{font-weight:500;color:var(--text)}.home-table th button:hover :global(svg){color:var(--accent)}.row-number{display:inline-block;color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums;margin-right:20px;min-width:16px}.table-map-link{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);padding:8px}.table-map-link:hover :global(svg){color:var(--accent)}.home-table .table-empty{height:160px;text-align:center}
 .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.home :focus-visible{outline:2px solid var(--accent);outline-offset:3px}
 @media(max-width:1000px){.home-toolbar{padding-left:16px;padding-right:16px}.map-results{width:280px;left:16px;top:16px}}
 @media(max-width:700px){.home{padding:0;min-height:600px}.home-toolbar{padding:0 12px 12px}.home-context{flex-direction:column;align-items:flex-start;gap:4px}.home-context h1{font-size:16px}.home-context>span{display:block;font-size:11px}.view-control button{padding:8px 10px}.map-results{top:auto;bottom:12px;left:12px;width:calc(100% - 24px);max-height:40%}.results-heading{padding:12px 16px}.result-row{padding:12px 16px}.home-table th,.home-table td{padding-left:16px;padding-right:16px}.home-table td{height:64px}.row-number{margin-right:12px}}

 .table-pagination{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 24px;border-top:1px solid var(--border);font-size:12px;color:var(--text-secondary);font-variant-numeric:tabular-nums}
 .page-size-control,.page-navigation{display:flex;align-items:center;gap:12px;margin:0}.page-range{white-space:nowrap}.page-navigation>span{min-width:48px;text-align:center}.page-navigation button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--control-radius);background:transparent;font-size:12px;font-weight:400;line-height:20px;color:var(--text-secondary);box-shadow:none}.page-navigation button:hover:not(:disabled) :global(svg){color:var(--accent)}.page-navigation button:disabled{cursor:default;opacity:.4}

 .empty-results button,.table-empty button{color:var(--accent);text-decoration:underline;padding:8px}.home-content{isolation:isolate}
 @media(max-width:700px){.table-pagination{flex-wrap:wrap;padding:12px;gap:12px}.page-navigation{width:100%;justify-content:space-between}.page-size-control{gap:8px}.page-range{margin-left:auto}}
 @media(max-width:380px){.home-toolbar{flex-wrap:wrap;gap:12px}.view-control{margin-left:auto}.page-navigation{gap:8px}.page-navigation button{padding:8px}}
 @media(max-width:700px){.map-results.has-selection{max-height:55%}.has-selection .results-heading,.has-selection .results-scroll{display:none}.has-selection .result-detail{border-top:0;overflow:auto;min-height:0;flex-shrink:1}}
</style>
