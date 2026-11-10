<script lang="ts">
 import type { Snippet } from 'svelte';
 import ThemeToggle from './ThemeToggle.svelte';
 import Logo from './Logo.svelte';
 let { children }: { children: Snippet } = $props();
</script>
<div class="auth-shell">
 <ThemeToggle/>
 <section class="auth-story">
  <Logo/>
  <div><span class="eyebrow">Un livre. Une rencontre.</span><h1>Les belles histoires<br/>commencent<br/><em>au coin de la rue.</em></h1><p>Trouvez une boîte à livres, déposez un coup de cœur.<br/>Et laissez les histoires voyager.</p></div>

 </section>
 <main class="auth-form"><div class="auth-card">{@render children()}</div></main>
</div>
