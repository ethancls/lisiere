<script lang="ts">
 import {bookFields, type BoxBook} from '#lib/types/books.ts';
 import Plus from 'phosphor-svelte/lib/PlusIcon';
 import {tick} from 'svelte';

 let {boxId}: {boxId: string} = $props();
 const endpoint = $derived('/api/boxes/' + encodeURIComponent(boxId.replace(/^pg:/, '')) + '/books');
 let books = $state<BoxBook[]>([]);
 let loading = $state(true), listError = $state(''), retry = $state(0);
 let open = $state(false), pending = $state(false), depositError = $state(''), confirmation = $state('');
 let addButton = $state<HTMLButtonElement>();
 let titleInput = $state<HTMLInputElement>();

 $effect(() => {
  void retry;
  const controller = new AbortController();
  loading = true;
  listError = '';
  void fetch(endpoint, {signal: controller.signal}).then(async response => {
   const data = await response.json();
   if (!response.ok) throw new Error(data.message);
   if (!controller.signal.aborted) books = data.books;
  }).catch(() => {
   if (!controller.signal.aborted) listError = 'Les livres n’ont pas pu être chargés.';
  }).finally(() => {
   if (!controller.signal.aborted) loading = false;
  });
  return () => controller.abort();
 });

 $effect(() => {
  if (open) titleInput?.focus();
  else if (confirmation) addButton?.focus();
 });

 async function submit(event: SubmitEvent & {currentTarget: HTMLFormElement}) {
  event.preventDefault();
  if (pending) return;
  pending = true;
  depositError = '';
  try {
   const response = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
   });
   const data = await response.json();
   if (!response.ok) {
    depositError = data.message ?? 'Le dépôt n’a pas pu être enregistré.';
    return;
   }
   confirmation = 'Livre ajouté à cette boîte.';
   open = false;
   retry++;
  } catch {
   depositError = 'Impossible de confirmer le dépôt. Rechargez la fiche avant de réessayer.';
  } finally {
   pending = false;
  }
 }
</script>

<section class="box-books" aria-label="Livres dans cette boîte">
 <h3>Livres dans cette boîte</h3>
 <p class="confirmation" role="status">{confirmation}</p>
 {#if !open}
  <button class="btn primary" type="button" bind:this={addButton} onclick={() => {
   confirmation = '';
   depositError = '';
   open = true;
  }}><Plus size={16}/>Ajouter un livre</button>
 {:else}
  <form onsubmit={submit} aria-busy={pending}>
   {#each bookFields as {name, label, max, required} (name)}
    <label>
     {label}{#if !required} <span>facultatif</span>{/if}
     {#if name === 'info'}
      <textarea class="input" {name} maxlength={max} rows="2" readonly={pending}></textarea>
     {:else if name === 'title'}
      <input class="input" {name} maxlength={max} {required} readonly={pending} bind:this={titleInput}/>
     {:else}
      <input class="input" {name} maxlength={max} {required} readonly={pending}/>
     {/if}
    </label>
   {/each}
   {#if depositError}<p class="error" role="alert">{depositError}</p>{/if}
   <div class="actions">
    <button class="btn" type="button" disabled={pending} onclick={async () => {
     open = false;
     await tick();
     addButton?.focus();
    }}>Annuler</button>
    <button class="btn primary" disabled={pending}>{pending ? 'Dépôt…' : 'Déposer le livre'}</button>
   </div>
  </form>
 {/if}
 <div aria-busy={loading}>
  {#if loading}<p role="status">Chargement des livres…</p>
  {:else if listError}<p role="alert">{listError}</p><button class="btn" type="button" onclick={() => retry++}>Réessayer</button>
  {:else}
   <ul>
    {#each books as book (book.id)}
     <li>
      <strong>{book.title}</strong>
      {#if book.author}<span>{book.author}</span>{/if}
      {#if book.isbn}<span>ISBN {book.isbn}</span>{/if}
      {#if book.info}<span>{book.info}</span>{/if}
     </li>
    {:else}
     <li>Aucun livre renseigné pour le moment.</li>
    {/each}
   </ul>
  {/if}
 </div>
</section>

<style>
 .box-books{border-top:1px solid var(--border);margin-top:16px;padding-top:16px;font-size:13px;overflow-wrap:anywhere}
 h3{font-size:14px;margin:0 0 8px}
 .confirmation{color:var(--positive);margin:0 0 8px}
 .confirmation:empty{display:none}
 form{display:grid;gap:12px}
 label{display:block;font-weight:500}
 label span,li span{color:var(--text-secondary);font-weight:400}
 label span{margin-inline-start:4px}
 .input{display:block;width:100%;min-height:44px;margin-top:4px;padding:8px;border:1px solid var(--field-border);border-radius:8px;background:var(--field);color:var(--text);font-size:16px}
 .actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
 .btn{min-height:44px}
 ul{padding:0;margin:8px 0 0;list-style:none}
 li{padding:8px 0;border-bottom:1px solid var(--border)}
 li:last-child{border-bottom:0}
 li span{display:block}
</style>
