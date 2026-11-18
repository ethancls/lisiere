<script lang="ts">import '../skeleton.css';import '../app.css'; let { children } = $props();</script>
<svelte:head><title>CLAP | Explorer</title><meta name="description" content="CLAP, Collectif pour la Lecture Accessible et Partagée. Découvrez les boîtes à livres autour de vous et partagez vos prochaines lectures."/><link rel="icon" type="image/png" href="/clap-favicon.png"/></svelte:head>
{@render children()}
