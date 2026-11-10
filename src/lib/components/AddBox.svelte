<script lang="ts">
 import {Dialog,Combobox,Portal,useListCollection} from '@skeletonlabs/skeleton-svelte';
 import {enhance} from '$app/forms';
 import LoadingSkeleton from './LoadingSkeleton.svelte';
 import LocationPicker from './LocationPicker.svelte';
 import Plus from 'phosphor-svelte/lib/PlusIcon';import X from 'phosphor-svelte/lib/XIcon';import CaretDown from 'phosphor-svelte/lib/CaretDownIcon';import Check from 'phosphor-svelte/lib/CheckIcon';import MapPin from 'phosphor-svelte/lib/MapPinIcon';
 import type {Box,Coordinates} from '#lib/types/boxes.ts';
 type City={id:number;name:string;postalCode:string};
 let {center=[2.35,48.862],onSaved}:{center?:[number,number];onSaved?:(box:Box)=>void}=$props();
 let open=$state(false),pending=$state(false),error=$state('');
 let address=$state(''),reference=$state(''),position=$state<Coordinates|null>(null);
 let latitude=$state<number|undefined>(),longitude=$state<number|undefined>();
 let communes=$state<City[]>([]),citiesLoading=$state(false),citiesError=$state(''),retry=$state(0);
 let cityId=$state(''),cityInput=$state(''),cityFilter=$state('');
 const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
 const cityLabel=(city:City)=>`${city.name} (${city.postalCode})`;
 const matchingCities=$derived(communes.filter(city=>normalize(cityLabel(city)).includes(normalize(cityFilter))));
 const collection=$derived(useListCollection({items:matchingCities,itemToString:cityLabel,itemToValue:(city:City)=>String(city.id)}));
 const valid=$derived(!!address.trim()&&!!cityId&&!!position);
 function setPosition(value:Coordinates){position=value;latitude=Number(value.latitude.toFixed(7));longitude=Number(value.longitude.toFixed(7));}
 function updateCoordinates(){
  position=latitude!==undefined&&longitude!==undefined&&Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=85.051128&&Math.abs(longitude)<=180?{latitude,longitude}:null;
 }
 function reset(){address='';reference='';cityId='';cityInput='';cityFilter='';position=null;latitude=undefined;longitude=undefined;error='';}
 $effect(()=>{
  if(!open||communes.length)return;void retry;
  const controller=new AbortController();citiesLoading=true;citiesError='';
  void fetch('/api/communes',{signal:controller.signal}).then(async response=>{
   if(!response.ok)throw Error('Les communes n’ont pas pu être chargées.');const items:City[]=await response.json();
   if(!controller.signal.aborted)communes=items;
  }).catch(failure=>{if(!controller.signal.aborted)citiesError=failure.message;}).finally(()=>{if(!controller.signal.aborted)citiesLoading=false;});
  return()=>controller.abort();
 });
</script>
<Dialog {open} onOpenChange={event=>{if(!pending){open=event.open;error='';}}} closeOnInteractOutside={false} initialFocusEl={()=>matchMedia('(max-width:700px)').matches?document.querySelector<HTMLElement>('.box-dialog'):document.getElementById('box-address')}>
 <Dialog.Trigger class="btn primary"><Plus size={18}/>Ajouter une boîte</Dialog.Trigger>
 {#if open}<Portal>
  <Dialog.Backdrop class="box-backdrop"/>
  <Dialog.Positioner class="box-positioner">
   <Dialog.Content class="card box-dialog">
    <div class="box-dialog-heading"><div><Dialog.Title class="box-title">Ajouter une boîte</Dialog.Title><Dialog.Description class="box-description">Placez le repère et indiquez l’adresse.</Dialog.Description></div><Dialog.CloseTrigger class="btn icon" disabled={pending} aria-label="Fermer le formulaire"><X size={18}/></Dialog.CloseTrigger></div>
    <form method="POST" action="?/add" use:enhance={()=>{
     pending=true;error='';
     return async({result,update})=>{
      try{
       if(result.type==='success'||result.type==='failure'||result.type==='redirect')await update({reset:false,invalidateAll:result.type==='success'});
       if(result.type==='success'&&result.data?.box){const box=result.data.box as Box;open=false;reset();onSaved?.(box);}
       else if(result.type==='failure')error=String(result.data?.error??'Vérifiez les informations du formulaire.');
       else if(result.type==='error')error='La boîte n’a pas pu être enregistrée. Réessayez.';
      }catch{error='L’enregistrement n’a pas abouti. Vérifiez votre connexion et réessayez.';}finally{pending=false;}
     };
    }}>
     <div class="box-form-body">
      <div class="box-fields">
       <label class="label" for="box-address">Adresse</label><input class="input" id="box-address" name="address" bind:value={address} required maxlength="120" autocomplete="street-address" placeholder="12, rue des Lilas"/>
       {#if citiesLoading}<div class="commune-loading"><span class="label">Commune</span><LoadingSkeleton variant="field" label="Chargement des communes"/></div>{:else}
        <Combobox {collection} value={cityId?[cityId]:[]} inputValue={cityInput} disabled={!!citiesError} openOnClick allowCustomValue={false} positioning={{sameWidth:true,placement:'bottom-start',gutter:4}} onInputValueChange={event=>{cityInput=event.inputValue;if(event.reason==='input-change'||event.reason==='clear-trigger'){cityFilter=event.inputValue;cityId='';}}} onValueChange={event=>{cityId=event.value[0]??'';const city=communes.find(city=>String(city.id)===cityId);if(city){cityInput=cityLabel(city);cityFilter='';}}}>
         <Combobox.Label class="label">Commune</Combobox.Label><Combobox.Control class="city-control"><Combobox.Input class="input" placeholder="Commune ou code postal" aria-describedby="commune-help"/><Combobox.Trigger class="btn city-trigger" aria-label="Afficher les communes"><CaretDown size={16}/></Combobox.Trigger></Combobox.Control>
         <Portal disabled><Combobox.Positioner class="city-positioner"><Combobox.Content class="card choice-list city-options">{#each matchingCities as city (city.id)}<Combobox.Item item={city} class="choice-item"><Combobox.ItemText>{cityLabel(city)}</Combobox.ItemText><Combobox.ItemIndicator><Check size={16}/></Combobox.ItemIndicator></Combobox.Item>{:else}<p class="city-empty">Aucune commune trouvée</p>{/each}</Combobox.Content></Combobox.Positioner></Portal>
        </Combobox>
       {/if}
       <input type="hidden" name="communeId" value={cityId}/>
       <p id="commune-help" class="box-field-note">Choisissez une commune de la liste.</p>
       {#if citiesError}<p class="error" role="alert">{citiesError}<button type="button" class="btn" onclick={()=>retry++}>Réessayer</button></p>{/if}
       <label class="label" for="box-reference">Référence <span class="optional">facultatif</span></label><input class="input" id="box-reference" name="reference" bind:value={reference} maxlength="50" placeholder="Ex. Boîte du square"/>
       <div class="position-summary" aria-live="polite"><MapPin size={18}/><span>{position?'Emplacement choisi':'Emplacement à choisir'}</span></div>
       <details class="manual-coordinates"><summary>Saisir les coordonnées</summary><div class="box-coordinates"><div><label class="label" for="box-latitude">Latitude</label><input class="input" id="box-latitude" type="number" step="any" min="-85.051128" max="85.051128" bind:value={latitude} oninput={event=>{latitude=Number.isNaN(event.currentTarget.valueAsNumber)?undefined:event.currentTarget.valueAsNumber;updateCoordinates();}} placeholder="48.8566"/></div><div><label class="label" for="box-longitude">Longitude</label><input class="input" id="box-longitude" type="number" step="any" min="-180" max="180" bind:value={longitude} oninput={event=>{longitude=Number.isNaN(event.currentTarget.valueAsNumber)?undefined:event.currentTarget.valueAsNumber;updateCoordinates();}} placeholder="2.3522"/></div></div></details>
       <input type="hidden" name="latitude" value={position?.latitude??''}/><input type="hidden" name="longitude" value={position?.longitude??''}/>
      </div>
      <div class="box-map"><LocationPicker bind:value={position} {center} onChange={setPosition}/></div>
     </div>
     <div class="box-form-footer">{#if error}<p class="error" role="alert">{error}</p>{/if}<div><Dialog.CloseTrigger class="btn box-cancel" disabled={pending}>Annuler</Dialog.CloseTrigger><button class="btn primary" disabled={pending||!valid||citiesLoading}>{pending?'Enregistrement…':'Ajouter la boîte'}</button></div></div>
    </form>
   </Dialog.Content>
  </Dialog.Positioner>
 </Portal>{/if}
</Dialog>
<style>
 :global(.box-backdrop){position:fixed;inset:0;background:#0009;z-index:80}
 :global(.box-positioner){position:fixed;inset:0;z-index:81;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto}
 :global(.box-dialog){position:relative;inset:auto;translate:none;transform:none;display:block;width:min(960px,100%);max-width:none;max-height:calc(100svh - 48px);margin:auto;padding:0;border:1px solid var(--border);border-radius:16px;background:var(--surface);color:var(--text);box-shadow:var(--popover-shadow);overflow:auto;outline:none}
 .box-dialog-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:24px;border-bottom:1px solid var(--border)}:global(.box-title){margin:0;font-family:Manrope,sans-serif;font-size:24px;font-weight:500;letter-spacing:-.4px;line-height:1.3}:global(.box-description){color:var(--text-secondary);font-size:13px;line-height:1.6;margin:8px 0 0}
 .box-form-body{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:24px;padding:24px}.box-fields{min-width:0}.box-fields :global(.label){display:block;font-size:13px;font-weight:500;color:var(--text);margin:20px 0 8px}.box-fields>:global(.label:first-child){margin-top:0}.box-fields :global(.input){display:block;width:100%;min-height:44px;margin:0;padding:12px;border:1px solid var(--field-border);border-radius:8px;background:var(--field);color:var(--text);font-size:14px;line-height:20px;box-shadow:none}.box-fields :global(.input:focus-visible){outline:2px solid var(--accent);outline-offset:2px}
 .box-field-note{font-size:12px;color:var(--muted);line-height:1.5;margin:8px 0 0}.optional{font-size:12px;color:var(--muted);font-weight:400;margin-left:4px}.box-map{min-width:0;min-height:360px}
 :global(.city-control){position:relative}:global(.city-control .input){padding-right:44px}:global(.city-trigger){position:absolute;right:2px;top:2px;display:grid;place-items:center;width:40px;height:40px;padding:0;color:var(--muted);background:transparent;box-shadow:none}:global(.city-positioner){z-index:85}:global(.city-options){max-height:240px;width:100%}:global(.city-options .choice-item){align-items:flex-start;font-size:13px}:global(.city-options [data-part=item-indicator]){color:var(--accent);flex-shrink:0}.city-empty{padding:8px 12px;margin:0;font-size:13px;color:var(--muted)}
 .position-summary{display:flex;align-items:center;gap:8px;color:var(--accent);padding:16px 0 8px;margin-top:16px;font-size:13px}.manual-coordinates{margin-top:8px;font-size:12px;color:var(--text-secondary)}.manual-coordinates summary{cursor:pointer;width:fit-content;padding:8px 0}.box-coordinates{display:grid;grid-template-columns:1fr 1fr;gap:12px}.box-coordinates .label{margin-top:8px}.commune-loading{margin-top:20px}.commune-loading :global(.loading-field){margin-top:0}
 .box-form-footer{padding:16px 24px;border-top:1px solid var(--border);background:var(--surface);position:sticky;bottom:0;z-index:2}.box-form-footer>div{display:flex;align-items:center;justify-content:flex-end;gap:12px}.box-form-footer .error{margin:0 0 16px}.box-form-footer :global(.btn){min-height:44px;padding:12px 20px;font-size:13px;font-weight:500;line-height:20px;border-radius:8px;box-shadow:none}.box-form-footer :global(.box-cancel){border:1px solid var(--border);background:transparent;color:var(--text-secondary)}.box-form-footer .primary:disabled{opacity:1;background:var(--surface-raised);color:var(--muted);cursor:default}
 @media(max-width:700px){:global(.box-positioner){padding:12px}:global(.box-dialog){max-height:calc(100svh - 24px)}.box-dialog-heading{padding:20px;gap:12px}.box-form-body{display:flex;flex-direction:column;gap:20px;padding:20px}.box-map{order:-1;min-height:280px}.box-fields :global(.input){font-size:16px}.box-form-footer{padding:16px 20px}.box-form-footer>div{justify-content:space-between}.box-form-footer .primary{flex:1}}
</style>
