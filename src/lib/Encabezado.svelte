<script lang="ts">
  // Encabezado de hoja: etiqueta técnica, título rotulado a mano, bajada y línea de cota.
  // Con `editable`, el título se puede renombrar en el lugar (clic en él).
  import Cota from '$lib/Cota.svelte';
  import EnLinea from '$lib/EnLinea.svelte';

  let {
    etiqueta,
    titulo,
    bajada = '',
    cota,
    editable
  }: {
    etiqueta: string;
    titulo: string;
    /** Línea bajo el título; vacía = no se muestra. */
    bajada?: string;
    cota: string;
    editable?: { max: number; onguardar: (valor: string) => Promise<string> };
  } = $props();
</script>

<header class="sheet-head" class:sin-bajada={!bajada}>
  <span class="tag">{etiqueta}</span>
  <h1>
    {#if editable}
      <EnLinea valor={titulo} max={editable.max} etiqueta="Renombrar" onguardar={editable.onguardar} />
    {:else}
      {titulo}
    {/if}
  </h1>
  {#if bajada}
    <p class="lead">{bajada}</p>
  {/if}
  <Cota label={cota} />
</header>

<style>
  /* Ancho al contenido, para que la cota mida lo mismo que el título. */
  .sheet-head {
    width: fit-content;
    max-width: 100%;
  }
  .tag {
    font-family: var(--bp-font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.65);
  }
  h1 {
    margin: 0.35rem 0 0.15rem;
    font-family: var(--bp-font-hand);
    font-weight: 400;
    font-size: clamp(2.6rem, 6vw, 3.8rem);
    line-height: 1.05;
    letter-spacing: 0.02em;
    overflow-wrap: anywhere;
    text-shadow: 0 0 14px rgba(255, 255, 255, 0.25);
  }
  /* Sin bajada, la cota se separa del título lo mismo que la separaba la bajada. */
  .sin-bajada h1 {
    margin-bottom: 0.7rem;
  }
  .lead {
    margin: 0 0 0.6rem;
    font-family: var(--bp-font-hand);
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.8);
  }
</style>
