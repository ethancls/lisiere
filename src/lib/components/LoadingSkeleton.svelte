<script lang="ts">
 let {variant='line',label='Chargement…',announce=true}: {
  variant?:'line'|'list'|'table-name'|'table-address'|'table-city'|'table-action'|'map'|'field'|'count';label?:string;announce?:boolean
 }=$props();
</script>
<span class="loading-skeleton loading-{variant}" role={announce?'status':undefined} aria-label={announce?label:undefined} aria-hidden={announce?undefined:true}>
 {#if variant==='list'}
  <span class="placeholder-circle skeleton-pulse list-icon"></span><span class="list-lines"><span class="placeholder skeleton-pulse list-title"></span><span class="placeholder skeleton-pulse list-address"></span></span>
 {:else if variant==='table-name'}
  <span class="placeholder skeleton-pulse row-index"></span><span class="placeholder skeleton-pulse row-title"></span>
 {:else}
  <span class="placeholder skeleton-pulse block"></span>
 {/if}
</span>
<style>
 .loading-skeleton{display:flex;align-items:center;gap:12px;min-width:0;max-width:100%}
 .loading-list{padding:16px;border-bottom:1px solid var(--border);min-height:84px}
 .list-icon{display:block;width:24px;min-height:24px;flex-shrink:0}
 .list-lines{display:flex;flex-direction:column;gap:8px;flex:1;min-width:0}
 .list-title{display:block;min-height:12px;height:12px;width:76%}.list-address{display:block;min-height:10px;height:10px;width:94%}
 .loading-table-name{gap:20px;min-height:20px}.row-index{display:block;width:16px;min-height:10px;height:10px;flex-shrink:0}.row-title{display:block;width:160px;min-height:12px;height:12px}
 .block{display:block;width:100%;min-height:12px;height:12px}
 .loading-table-address{width:240px}.loading-table-city{width:110px}.loading-table-action{width:72px}.loading-count{width:64px;height:16px}.loading-count .block{height:10px;min-height:10px}
 .loading-map{position:absolute;inset:0;z-index:0;pointer-events:none;max-width:none}.loading-map .block{width:100%;height:100%;border-radius:0}
 .loading-field{height:46px;margin-top:8px}.loading-field .block{height:100%;border:1px solid var(--border);border-radius:8px}
 .skeleton-pulse{animation:loading-pulse 1.6s ease-in-out infinite}
 @keyframes loading-pulse{0%,100%{opacity:1}50%{opacity:.5}}
 @media(prefers-reduced-motion:reduce){.skeleton-pulse{animation:none}}
 @media(max-width:700px){.loading-list{padding:12px 16px;min-height:72px}.loading-table-name{gap:12px}}
</style>
