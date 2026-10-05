<script lang="ts">
  // Cuadro de rotulación, el de la esquina de un plano. Con `renombrar`, el nombre del
  // proyecto se edita en el lugar (clic → campo; Enter o clic fuera guarda, Escape cancela).
  // Con `avance`, una segunda columna muestra cuántos objetivos y tareas lleva el proyecto.
  import EnLinea from '$lib/EnLinea.svelte';

  let {
    fecha,
    etiquetaPlano = 'Plano',
    plano,
    renombrar,
    avance,
    proyecto = 'blueprints'
  }: {
    fecha: string;
    /** Rótulo de la primera celda: "Plano" en la home, "Siguiente objetivo" en una sección. */
    etiquetaPlano?: string;
    plano: string;
    renombrar?: { max: number; onguardar: (valor: string) => Promise<string> };
    avance?: { objetivos: number; tareas: number; logradas: number };
    proyecto?: string;
  } = $props();

  const tareas = $derived(
    !avance ? '' : avance.tareas === 0 ? 'Sin tareas' : `${avance.logradas} de ${avance.tareas} logradas`
  );
  const completo = $derived(!!avance && avance.tareas > 0 && avance.logradas === avance.tareas);
</script>

<aside class="cartouche" aria-label="Cuadro de rotulación">
  <div class="c-head">
    <span class="k">Proyecto</span>
    <span class="v hand">
      {#if renombrar}
        <EnLinea valor={proyecto} max={renombrar.max} etiqueta="Renombrar" onguardar={renombrar.onguardar} />
      {:else}
        {proyecto}
      {/if}
    </span>
  </div>
  <!-- Con avance: 2×2 (a la izquierda lo del proyecto, a la derecha sus totales); sin él, apilado. -->
  <div class="c-grid" class:dos={!!avance}>
    <div><span class="k">{etiquetaPlano}</span><span class="v">{plano}</span></div>
    {#if avance}
      <div><span class="k">Objetivos</span><span class="v">{avance.objetivos}</span></div>
    {/if}
    <div><span class="k">Fecha</span><span class="v">{fecha}</span></div>
    {#if avance}
      <div><span class="k">Tareas</span><span class="v" class:completo>{tareas}</span></div>
    {/if}
  </div>
</aside>

<style>
  .cartouche {
    min-width: 17rem;
    max-width: 22rem;
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    font-family: var(--bp-font-mono);
    background: rgba(7, 31, 79, 0.25);
  }
  .c-head {
    display: flex;
    flex-direction: column;
    padding: 0.45rem 0.7rem 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  }
  .c-grid {
    display: grid;
  }
  .c-grid.dos {
    grid-template-columns: 1fr 1fr;
  }
  .c-grid > div {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 0.4rem 0.7rem;
  }
  .c-grid:not(.dos) > div + div {
    border-top: 1px solid rgba(255, 255, 255, 0.6);
  }
  .c-grid.dos > div:nth-child(odd) {
    border-right: 1px solid rgba(255, 255, 255, 0.6);
  }
  .c-grid.dos > div:nth-child(-n + 2) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  }
  .k {
    font-size: 0.58rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }
  .v {
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    color: #fff;
    overflow-wrap: anywhere;
  }
  .v.hand {
    font-family: var(--bp-font-hand);
    font-size: 1.35rem;
    letter-spacing: 0.03em;
    line-height: 1.2;
  }
  /* Todas las tareas logradas: el mismo dorado del contorno de las tarjetas. */
  .v.completo {
    color: #f5c542;
  }
</style>
