<script lang="ts">import '../skeleton.css';import '../app.css'; let { children } = $props();</script>
<svelte:head><title>Lisière | Explorer</title><meta name="description" content="Découvrez les boîtes à livres autour de vous et partagez vos prochaines lectures."/><link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2"/></svelte:head>
{@render children()}
