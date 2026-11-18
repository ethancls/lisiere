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
  <div class="story-copy">
   <span class="eyebrow">Un livre. Une rencontre.</span>
   <h1>Les belles histoires commencent <em>au coin de la rue.</em></h1>
   <p>Trouvez une boîte à livres, déposez un coup de cœur. Et laissez les histoires voyager.</p>
  </div>
  <img class="story-art" src="/clap-bibliotheque.webp" alt="" width="720" height="1672"/>
 </section>
 <main class="auth-form"><div class="auth-card">{@render children()}</div></main>
</div>

<style>
 .auth-shell {
  --story-paper: #252534;
  --story-light: #353449;
  --story-rule: var(--clap-peach);
  --story-ink: var(--text);
  --story-wash: #373f57;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.22fr) minmax(0, 1fr);
  min-height: 100svh;
  background: var(--page);
  color: var(--text);
 }
 :global(:root[data-theme=light]) .auth-shell {
  --story-paper: #f4e8db;
  --story-light: #f9f1e7;
  --story-rule: var(--clap-brown);
  --story-ink: #283461;
  --story-wash: #c5dfeb;
 }
 .auth-story {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr;
  align-content: start;
  align-items: start;
  gap: 32px;
  padding: clamp(24px, 4vw, 64px);
  background: radial-gradient(ellipse at top left, var(--story-light), transparent 80%), var(--story-paper);
  border-radius: 0 40px 40px 0;
 }
 .story-copy {
  align-self: center;
  padding-block: 0 32px;
  max-width: min(62%, 34rem);
 }
 .story-copy .eyebrow {
  display: inline-block;
  border-top: 2px solid var(--story-rule);
  padding-top: 12px;
 }
 .story-copy h1 {
  position: relative;
  isolation: isolate;
  margin: 20px 0;
  color: var(--story-ink);
  font-size: clamp(28px, 3.5vw, 60px);
  font-weight: 800;
  line-height: 1.04;
  letter-spacing: -.035em;
 }
 .story-copy h1::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: -8px -8px 15% -12px;
  border-radius: 24% 49% 31% 36% / 40% 33% 48% 32%;
  background: var(--story-wash);
 }
 .story-copy em {
  display: block;
  margin-top: 4px;
  color: var(--story-text);
  font-family: Georgia, serif;
  font-weight: 400;
 }
 .story-copy p {
  max-width: 33ch;
  margin: 20px 0 0;
  color: var(--text-secondary);
 }
 .story-art {
  position: absolute;
  z-index: -1;
  right: 0;
  bottom: 0;
  width: min(36%, 320px);
  height: auto;
 }
 .auth-form {
  display: grid;
  place-items: center;
  padding: 80px clamp(24px, 5vw, 88px) 48px;
 }
 .auth-card {
  width: min(100%, 400px);
 }
 .auth-card :global(h2) {
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.12;
 }
 .auth-card :global(.switch) {
  margin-block: 24px;
 }
 .auth-card :global(.switch button.active) {
  box-shadow: inset 0 -2px var(--accent);
  color: var(--accent);
  font-weight: 700;
 }
 .auth-card :global(.primary:disabled) {
  color: var(--text-secondary);
 }
 @media (max-width: 700px) {
  .auth-shell {
   grid-template-columns: minmax(0, 1fr);
   grid-template-rows: auto 1fr;
  }
  .auth-story {
   gap: 16px;
   padding: 16px 24px 24px;
   border-radius: 0 0 28px 28px;
  }
  .story-copy {
   max-width: 72%;
   padding: 0;
  }
  .story-copy .eyebrow, .story-copy p {
   display: none;
  }
  .story-copy h1 {
   margin: 0;
   font-size: clamp(22px, 5.8vw, 32px);
  }
  .story-art {
   top: 70px;
   bottom: auto;
   width: min(27%, 160px);
  }
  .auth-form {
   place-items: start center;
   padding: 28px 24px 40px;
  }
 }
</style>
