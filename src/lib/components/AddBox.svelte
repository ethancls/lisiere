<script lang="ts">
 import {Dialog,Portal} from '@skeletonlabs/skeleton-svelte';
 import {enhance} from '$app/forms';
 import {untrack} from 'svelte';
 import {parseCoordinates} from '#lib/types/coordinates.ts';
 import LocationPicker from './LocationPicker.svelte';
 import Plus from 'phosphor-svelte/lib/PlusIcon';import X from 'phosphor-svelte/lib/XIcon';import MapPin from 'phosphor-svelte/lib/MapPinIcon';
 import type {Box,Coordinates} from '#lib/types/boxes.ts';
 type Suggestion={commune:string|null;communeUnavailable:boolean;address:string|null;addressUnavailable:boolean};
 let {center=[2.35,48.862],onSaved}:{center?:[number,number];onSaved?:(box:Box)=>void}=$props();
 let open=$state(false),pending=$state(false),error=$state('');
 let address=$state(''),reference=$state(''),position=$state<Coordinates|null>(null);
 let latitude=$state<number|undefined>(),longitude=$state<number|undefined>();
 let addressEdited=$state(false),retry=$state(0);
 let result=$state<Suggestion|null>(null),loading=$state(false),lookupFailed=$state(false);
 const valid=$derived(!!address.trim()&&!!result?.commune&&!!position&&!loading);
 function setPosition(value:Coordinates){position=value;latitude=value.latitude;longitude=value.longitude;}
 function updateCoordinates(){position=parseCoordinates(String(latitude??''),String(longitude??''));}
 function reset(){addressEdited=false;address='';reference='';position=null;latitude=undefined;longitude=undefined;error='';}
 $effect(()=>{
  const point=position;
  if(!open)return;
  void retry;
  result=null;lookupFailed=false;loading=!!point;error='';
  if(!untrack(()=>addressEdited))address='';
  if(!point)return;
  const controller=new AbortController();
  const query=new URLSearchParams({lat:String(point.latitude),lon:String(point.longitude)});
  const timer=setTimeout(()=>{
   void fetch('/api/reverse-address?'+query,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])})
    .then(async response=>{
     if(!response.ok)throw new Error();
     const suggestion:Suggestion=await response.json();
     if(controller.signal.aborted)return;
     result=suggestion;
     if(suggestion.address&&!addressEdited)address=suggestion.address;
    }).catch(()=>{if(!controller.signal.aborted)lookupFailed=true;})
    .finally(()=>{if(!controller.signal.aborted)loading=false;});
  },250);
  return()=>{clearTimeout(timer);controller.abort();};
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
       <label class="label" for="box-address">Adresse</label><input class="input" id="box-address" name="address" bind:value={address} oninput={()=>addressEdited=true} required maxlength="120" autocomplete="street-address" placeholder="12, rue des Lilas" aria-describedby="address-help"/>
       <p id="address-help" class="box-field-note" role="status">
        {#if result?.address&&!addressEdited}Adresse approximative suggérée (IGN), à vérifier.
        {:else if result?.addressUnavailable||lookupFailed}Suggestion d’adresse indisponible. Vous pouvez la saisir.
        {:else if result&&!result.address}Aucune adresse proche trouvée. Vous pouvez la saisir.
        {/if}
       </p>
       <p class="box-field-note commune-status" role="status">
        {#if loading}Vérification de la commune…
        {:else if lookupFailed||result?.communeUnavailable}La commune n’a pas pu être vérifiée. Réessayez ou déplacez le repère.
        {:else if result?.commune}Commune détectée : <strong>{result.commune}</strong>
        {:else if result}Aucune commune du catalogue pour ce point. Déplacez le repère.
        {:else if latitude!==undefined||longitude!==undefined}Saisissez deux coordonnées GPS valides.
        {:else}Placez le repère pour déterminer la commune.
        {/if}
       </p>
       {#if lookupFailed||result?.communeUnavailable||result?.addressUnavailable}<button type="button" class="btn" onclick={()=>retry++}>Réessayer la recherche</button>{/if}
       <label class="label" for="box-reference">Référence <span class="optional">facultatif</span></label><input class="input" id="box-reference" name="reference" bind:value={reference} maxlength="50" placeholder="Ex. Boîte du square"/>
       <div class="position-summary" aria-live="polite"><MapPin size={18}/><span>{position?'Emplacement choisi':'Emplacement à choisir'}</span></div>
       <details class="manual-coordinates"><summary>Saisir les coordonnées</summary><div class="box-coordinates"><div><label class="label" for="box-latitude">Latitude</label><input class="input" id="box-latitude" type="number" step="any" min="-85.051128" max="85.051128" bind:value={latitude} oninput={event=>{latitude=Number.isNaN(event.currentTarget.valueAsNumber)?undefined:event.currentTarget.valueAsNumber;updateCoordinates();}} placeholder="48.8566"/></div><div><label class="label" for="box-longitude">Longitude</label><input class="input" id="box-longitude" type="number" step="any" min="-180" max="180" bind:value={longitude} oninput={event=>{longitude=Number.isNaN(event.currentTarget.valueAsNumber)?undefined:event.currentTarget.valueAsNumber;updateCoordinates();}} placeholder="2.3522"/></div></div></details>
       <input type="hidden" name="latitude" value={position?.latitude??''}/><input type="hidden" name="longitude" value={position?.longitude??''}/>
      </div>
      <div class="box-map"><LocationPicker bind:value={position} {center} onChange={setPosition}/></div>
     </div>
     <div class="box-form-footer">{#if error}<p class="error" role="alert">{error}</p>{/if}<div><Dialog.CloseTrigger class="btn box-cancel" disabled={pending}>Annuler</Dialog.CloseTrigger><button class="btn primary" disabled={pending||!valid}>{pending?'Enregistrement…':'Ajouter la boîte'}</button></div></div>
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
 .commune-status{margin-top:16px;color:var(--text-secondary)}
 .position-summary{display:flex;align-items:center;gap:8px;color:var(--accent);padding:16px 0 8px;margin-top:16px;font-size:13px}.manual-coordinates{margin-top:8px;font-size:12px;color:var(--text-secondary)}.manual-coordinates summary{cursor:pointer;width:fit-content;padding:8px 0}.box-coordinates{display:grid;grid-template-columns:1fr 1fr;gap:12px}.box-coordinates .label{margin-top:8px}
 .box-form-footer{padding:16px 24px;border-top:1px solid var(--border);background:var(--surface);position:sticky;bottom:0;z-index:2}.box-form-footer>div{display:flex;align-items:center;justify-content:flex-end;gap:12px}.box-form-footer .error{margin:0 0 16px}.box-form-footer :global(.btn){min-height:44px;padding:12px 20px;font-size:13px;font-weight:500;line-height:20px;border-radius:8px;box-shadow:none}.box-form-footer :global(.box-cancel){border:1px solid var(--border);background:transparent;color:var(--text-secondary)}.box-form-footer .primary:disabled{opacity:1;background:var(--surface-raised);color:var(--muted);cursor:default}
 @media(max-width:700px){:global(.box-positioner){padding:12px}:global(.box-dialog){max-height:calc(100svh - 24px)}.box-dialog-heading{padding:20px;gap:12px}.box-form-body{display:flex;flex-direction:column;gap:20px;padding:20px}.box-map{order:-1;min-height:280px}.box-fields :global(.input){font-size:16px}.box-form-footer{padding:16px 20px}.box-form-footer>div{justify-content:space-between}.box-form-footer .primary{flex:1}}
</style>
