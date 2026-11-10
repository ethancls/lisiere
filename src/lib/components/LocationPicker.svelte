<script lang="ts">
 import {onMount,untrack} from 'svelte';
 import type * as GL from 'maplibre-gl';
 import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
 import 'maplibre-gl/dist/maplibre-gl.css';
 import Crosshair from 'phosphor-svelte/lib/CrosshairIcon';
 import LoadingSkeleton from './LoadingSkeleton.svelte';
 import type {Coordinates} from '#lib/types/boxes.ts';
 let {value=$bindable(null),center=[2.35,48.862],onChange}:{value?:Coordinates|null;center?:[number,number];onChange?:(value:Coordinates)=>void}=$props();
 let container:HTMLDivElement;
 let map=$state<GL.Map>();let marker:GL.Marker|undefined;
 let ready=$state(false),error=$state(''),locating=$state(false),locationError=$state('');
 let applyPosition:((position:Coordinates,fly?:boolean)=>void)|undefined;
 function locate(){
  if(!navigator.geolocation){locationError='La géolocalisation est indisponible. Choisissez le point sur la carte.';return;}
  locating=true;locationError='';
  navigator.geolocation.getCurrentPosition(position=>{
   locating=false;applyPosition?.({latitude:position.coords.latitude,longitude:position.coords.longitude},true);
  },failure=>{locating=false;locationError=failure.code===1?'La localisation est bloquée. Autorisez-la dans votre navigateur ou placez le repère sur la carte.':'Position indisponible. Placez le repère sur la carte.';},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
 }
 onMount(()=>{
  let disposed=false,m:GL.Map|undefined,resize:ResizeObserver|undefined,theme:MutationObserver|undefined;
  const initial=untrack(()=>value),initialCenter=untrack(()=>center);
  void(async()=>{try{
   const gl=await import('maplibre-gl');if(disposed)return;gl.setWorkerUrl(workerUrl);
   const style=()=>`https://tiles.openfreemap.org/styles/${document.documentElement.dataset.theme==='light'?'positron':'dark'}`;
   m=new gl.Map({container,center:initial?[initial.longitude,initial.latitude]:initialCenter,zoom:initial?16:12.4,style:style(),attributionControl:false});
   m.addControl(new gl.NavigationControl({showCompass:false}),'top-right');
   const instance=m;
   const update=(position:Coordinates)=>{value=position;onChange?.(position);};
   applyPosition=(position,fly=false)=>{
    if(disposed)return;
    if(!marker){
     marker=new gl.Marker({color:'#ed9b55',draggable:true}).setLngLat([position.longitude,position.latitude]).addTo(instance);
     marker.getElement().setAttribute('aria-label','Emplacement de la boîte, déplaçable avec les flèches du clavier');
     marker.on('dragend',()=>{const p=marker!.getLngLat();update({latitude:p.lat,longitude:((p.lng+180)%360+360)%360-180});});
    }else marker.setLngLat([position.longitude,position.latitude]);
    update(position);
    if(fly)instance.easeTo({center:[position.longitude,position.latitude],zoom:Math.max(instance.getZoom(),16),duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:400});
   };
   if(initial)applyPosition(initial);
   instance.on('click',event=>applyPosition?.({latitude:event.lngLat.lat,longitude:((event.lngLat.lng+180)%360+360)%360-180}));
   instance.on('style.load',()=>{ready=true;error='';});
   instance.on('error',()=>{if(!instance.isStyleLoaded())error='Le fond de carte ne se charge pas. Vous pouvez saisir les coordonnées ci-dessous.';});
   resize=new ResizeObserver(()=>instance.resize());resize.observe(container);
   theme=new MutationObserver(()=>{ready=false;instance.setStyle(style());});theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
   map=instance;
  }catch{if(!disposed)error='La carte est indisponible. Saisissez les coordonnées ci-dessous.';}})();
  return()=>{disposed=true;applyPosition=undefined;resize?.disconnect();theme?.disconnect();marker?.remove();marker=undefined;m?.remove();};
 });
 $effect(()=>{const position=value;if(map&&!position){marker?.remove();marker=undefined;}if(map&&position)untrack(()=>{if(!marker||Math.abs(marker.getLngLat().lat-position.latitude)>1e-9||Math.abs(marker.getLngLat().lng-position.longitude)>1e-9)applyPosition?.(position);});});
</script>
<div class="location-picker">
 <div class="picker-map" bind:this={container}></div>
 {#if !ready&&!error}<LoadingSkeleton variant="map" label="Chargement de la carte de positionnement"/>{/if}
 <button type="button" class="btn picker-locate" disabled={!map||locating} onclick={locate}><Crosshair size={18}/>{locating?'Localisation…':'Me localiser'}</button>
 {#if error||locationError}<p class="picker-error" role="alert">{locationError||error}</p>{/if}
 <p class="picker-hint" aria-live="polite">{value?'Déplacez le repère pour ajuster la position':'Cliquez sur la carte pour placer la boîte'}</p>
</div>
<style>
 .location-picker{position:relative;min-height:320px;height:100%;background:var(--surface-raised);border-radius:var(--panel-radius);overflow:hidden}.picker-map{width:100%;height:100%;min-height:320px}.picker-map :global(.maplibregl-canvas){cursor:crosshair}.picker-map :global(.maplibregl-marker){cursor:grab}.picker-map :global(.maplibregl-marker:focus-visible){outline:2px solid var(--accent);outline-offset:4px}
 .picker-locate{position:absolute;top:12px;left:12px;z-index:1;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font-size:13px;font-weight:400;line-height:20px;box-shadow:var(--popover-shadow)}.picker-locate:hover :global(svg){color:var(--accent)}
 .picker-hint{position:absolute;bottom:12px;left:12px;right:12px;width:fit-content;max-width:calc(100% - 24px);padding:8px 12px;border-radius:8px;background:var(--surface);color:var(--text-secondary);font-size:12px;line-height:1.5;margin:0;pointer-events:none}
 .picker-error{position:absolute;top:64px;left:12px;right:12px;padding:12px;background:var(--surface);color:var(--negative);border-radius:8px;font-size:12px;margin:0;z-index:1}
 :global(.picker-map .maplibregl-ctrl-group){background:var(--surface);border:1px solid var(--border);box-shadow:none;border-radius:8px}:global([data-theme=dark] .picker-map .maplibregl-ctrl-icon){filter:invert(1)}
 @media(max-width:700px){.location-picker,.picker-map{min-height:280px;height:280px}}
</style>
