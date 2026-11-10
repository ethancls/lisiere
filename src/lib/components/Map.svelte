<script lang="ts">
 import LoadingSkeleton from './LoadingSkeleton.svelte';
 import {onMount,tick,untrack} from 'svelte';import type * as GL from 'maplibre-gl';
 import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';import 'maplibre-gl/dist/maplibre-gl.css';
 import type {Box,Bounds} from '#lib/types/boxes.ts';
 let {boxes,active=null,onSelect,onBounds,focusRequest=0,panel,camera=$bindable({center:[2.35,48.862] as [number,number],zoom:12.4})}: {
  boxes:Box[];active?:Box|null;onSelect?:(box:Box)=>void;onBounds?:(bounds:Bounds)=>void;focusRequest?:number;panel?:HTMLElement;camera?:{center:[number,number];zoom:number}
 }=$props();
 let container:HTMLDivElement;let map=$state<GL.Map>();let ready=$state(false),error=$state('');
 let MarkerConstructor:typeof GL.Marker|undefined,activeMarker:GL.Marker|undefined;
 const padding=()=>{
  const rect=container.getBoundingClientRect(),overlay=panel?.getBoundingClientRect();
  if(!overlay)return {left:24,right:24,top:24,bottom:24};
  return rect.width>700
   ?{left:Math.min(rect.width*.55,overlay.right-rect.left+24),right:48,top:32,bottom:32}
   :{left:24,right:24,top:32,bottom:Math.min(rect.height*.65,rect.bottom-overlay.top+24)};
 };
 const style=()=>`https://tiles.openfreemap.org/styles/${document.documentElement.dataset.theme==='light'?'positron':'dark'}`;
 const geojson=()=>({type:'FeatureCollection' as const,features:boxes.filter(b=>b.id!==active?.id).map(b=>({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:[b.longitude,b.latitude]},properties:{id:b.id}}))});
 onMount(()=>{
  let cancelled=false;let m:GL.Map|undefined,observer:MutationObserver|undefined,resizeObserver:ResizeObserver|undefined;
  void (async()=>{
   try{
    const gl=await import('maplibre-gl');if(cancelled)return;gl.setWorkerUrl(workerUrl);MarkerConstructor=gl.Marker;
    const instance=new gl.Map({container,style:style(),center:camera.center,zoom:camera.zoom,attributionControl:false});m=instance;
    instance.addControl(new gl.NavigationControl({showCompass:false}),'top-right');
    const publish=()=>{
     const b=instance.getBounds(),center=instance.getCenter();camera={center:[center.lng,center.lat],zoom:instance.getZoom()};
     const wrap=(x:number)=>((x+180)%360+360)%360-180;
     const world=b.getEast()-b.getWest()>=360;
     onBounds?.({west:world?-180:wrap(b.getWest()),east:world?180:wrap(b.getEast()),south:Math.max(-85.051128,b.getSouth()),north:Math.min(85.051128,b.getNorth())});
    };
    instance.on('moveend',publish);instance.on('style.load',()=>{
     instance.addSource('boxes',{type:'geojson',data:geojson(),cluster:true,clusterRadius:42,clusterMaxZoom:13});
     instance.addLayer({id:'box-clusters',type:'circle',source:'boxes',filter:['has','point_count'],paint:{'circle-color':'#b7ef74','circle-radius':['step',['get','point_count'],16,100,21],'circle-stroke-width':1.5,'circle-stroke-color':'#203722'}});
     instance.addLayer({id:'box-cluster-count',type:'symbol',source:'boxes',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Noto Sans Regular'],'text-size':12},paint:{'text-color':'#203722'}});
     instance.addLayer({id:'box-points',type:'circle',source:'boxes',filter:['!', ['has','point_count']],paint:{'circle-color':'#b7ef74','circle-radius':6,'circle-stroke-width':1.5,'circle-stroke-color':'#203722'}});
     ready=true;error='';
    });
    instance.on('click','box-clusters',async event=>{
     const f=event.features?.[0];if(!f||f.geometry.type!=='Point')return;
     try{const zoom=await(instance.getSource('boxes') as GL.GeoJSONSource).getClusterExpansionZoom(Number(f.properties.cluster_id));instance.easeTo({center:f.geometry.coordinates as [number,number],zoom,padding:{top:0,right:0,bottom:0,left:0}});}catch{/* source can change while a new viewport loads */}
    });
    instance.on('click','box-points',event=>{const id=event.features?.[0]?.properties?.id;const box=boxes.find(box=>box.id===String(id));if(box)onSelect?.(box);});
    for(const layer of ['box-clusters','box-points']){instance.on('mouseenter',layer,()=>instance.getCanvas().style.cursor='pointer');instance.on('mouseleave',layer,()=>instance.getCanvas().style.cursor='');}
    instance.on('error',event=>{if(event.error?.message?.includes('Failed to fetch')&&!instance.isStyleLoaded())error='Le fond de carte ne peut pas être chargé. La vue tableau reste disponible.';});
    observer=new MutationObserver(()=>{ready=false;instance.setStyle(style());});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    resizeObserver=new ResizeObserver(()=>{instance.resize();publish();});resizeObserver.observe(container);
    map=instance;publish();
   }catch{if(!cancelled)error='La carte est indisponible. Utilisez la vue tableau.';}
  })();
  return()=>{cancelled=true;observer?.disconnect();resizeObserver?.disconnect();activeMarker?.remove();activeMarker=undefined;m?.remove();};
 });
 $effect(()=>{if(map&&ready){(map.getSource('boxes') as GL.GeoJSONSource|undefined)?.setData(geojson());}});
 $effect(()=>{
  if(!map||!MarkerConstructor)return;
  if(active){
   if(!activeMarker){activeMarker=new MarkerConstructor({color:'#ed9b55',scale:1.25,className:'selected-box-marker'}).setLngLat([active.longitude,active.latitude]).addTo(map);}
   else activeMarker.setLngLat([active.longitude,active.latitude]);
   activeMarker.getElement().setAttribute('aria-label','Boîte sélectionnée : '+active.name);
  }else{activeMarker?.remove();activeMarker=undefined;}
 });
 $effect(()=>{
  const instance=map,target=active,request=focusRequest;void request;
  if(!instance||!target)return;
  let cancelled=false;
  void tick().then(()=>{if(cancelled)return;untrack(()=>{const inset=padding();instance.easeTo({center:[target.longitude,target.latitude],zoom:Math.max(instance.getZoom(),15),padding:{left:0,right:0,top:0,bottom:0},offset:[(inset.left-inset.right)/2,(inset.top-inset.bottom)/2],duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:450});});});
  return()=>{cancelled=true;};
 });
</script>
<div class="home-map" bind:this={container}></div>
{#if error}<div class="map-status" role="alert">{error}</div>{:else if !ready}<LoadingSkeleton variant="map" label="Chargement de la carte"/>{/if}
<style>
 .home-map{height:100%;width:100%;min-height:0}.map-status{position:absolute;top:16px;left:50%;transform:translateX(-50%);padding:12px 16px;max-width:400px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;font-size:12px;z-index:1}
 :global(.home-map .maplibregl-ctrl-group){background:var(--surface);border:1px solid var(--border);box-shadow:none;border-radius:8px;overflow:hidden}:global(.home-map .maplibregl-ctrl-group button){width:36px;height:36px}:global([data-theme=dark] .home-map .maplibregl-ctrl-icon){filter:invert(1)}
 :global(.selected-box-marker){z-index:3;filter:drop-shadow(0 2px 3px #0005)}
 @media(max-width:700px){.map-status{top:16px;left:12px;transform:none;max-width:calc(100% - 76px)}}
</style>
