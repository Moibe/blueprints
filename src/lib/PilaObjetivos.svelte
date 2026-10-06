<script lang="ts">
  // Objetivos como una pila de hojas sobre el área de dibujo: se ve uno a la vez (las demás
  // asoman detrás) y se recorren con las flechas ‹ › de sus orillas o con ← → del teclado. La
  // hoja del frente muestra su nombre (editable en el lugar), su avance de tareas y el botón
  // para borrarla;
  // "+" crea un objetivo escribiendo su nombre ahí mismo (Enter crea, Escape cancela).
  import { fly } from 'svelte/transition';
  import EnLinea from '$lib/EnLinea.svelte';
  import { OBJETIVO_MAX, limpiarTexto } from '$lib/secciones';

  type Hoja = { id: number; nombre: string; total: number; logradas: number };
  let {
    objetivos,
    activo,
    onactivar,
    oncrear,
    onrenombrar,
    onborrar
  }: {
    objetivos: Hoja[];
    activo: number | null;
    onactivar: (id: number) => void;
    oncrear: (nombre: string) => Promise<void>;
    onrenombrar: (id: number, nombre: string) => Promise<string>;
    onborrar: (id: number) => void;
  } = $props();

  const indice = $derived(objetivos.findIndex((o) => o.id === activo));
  const actual = $derived(indice >= 0 ? objetivos[indice] : null);
  // Hojas que asoman detrás de la del frente: hasta dos, para sugerir la pila.
  const capas = $derived(Math.min(Math.max(objetivos.length - 1, 0), 2));
  // Lado del último movimiento: la hoja nueva entra por ahí.
  let direccion = $state(1);
  const sinMovimiento =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ir(paso: number) {
    const destino = objetivos[indice + paso];
    if (!destino) return;
    direccion = paso;
    onactivar(destino.id);
  }

  // Avance de tareas: sin tareas no se muestra nada; con tareas, "logradas de total".
  const conteo = (o: Hoja) => (o.total === 0 ? '' : o.logradas === 0 ? `${o.total}` : `${o.logradas} de ${o.total}`);

  let creando = $state(false);
  let borrador = $state('');
  let error = $state('');
  let ocupado = false;

  function enfocar(campo: HTMLInputElement) {
    campo.focus();
  }

  function abrirNuevo() {
    borrador = '';
    error = '';
    creando = true;
  }

  async function crear() {
    if (!creando || ocupado) return;
    const nombre = limpiarTexto(borrador);
    if (!nombre) {
      creando = false;
      return;
    }
    ocupado = true;
    try {
      direccion = 1;
      await oncrear(nombre);
      creando = false;
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo crear.';
    } finally {
      ocupado = false;
    }
  }

  function teclasNuevo(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      crear();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      creando = false;
      error = '';
    }
  }

  // ← → recorren la pila cuando el foco está en ella (salvo escribiendo en un campo).
  function teclasPila(e: KeyboardEvent) {
    if (creando || (e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      ir(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      ir(1);
    }
  }
</script>

<!-- Las flechas del teclado solo agregan un atajo; los botones ‹ › son el control real. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="pila" role="group" aria-label="Objetivos" onkeydown={teclasPila}>
  {#if creando}
    <div class="hoja nueva">
      <input
        use:enfocar
        bind:value={borrador}
        maxlength={OBJETIVO_MAX}
        placeholder="Nombre del objetivo…"
        aria-label="Nombre del nuevo objetivo"
        onkeydown={teclasNuevo}
        onblur={crear}
      />
      {#if error}<span class="error" role="alert">{error}</span>{/if}
    </div>
  {:else}
    {#if actual}
      <div class="hojas" class:capa1={capas >= 1} class:capa2={capas >= 2}>
        <!-- Las flechas van fijas en las orillas de la hoja (no se vuelven a crear al cambiar de
             objetivo, así no pierden el foco); solo el contenido cambia y entra deslizándose. -->
        <div class="hoja frente">
          <button type="button" class="flecha" aria-label="Objetivo anterior" title="Objetivo anterior" aria-disabled={indice <= 0} onclick={() => ir(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div class="contenido" aria-live="polite">
            {#key actual.id}
              <div class="actual" in:fly={{ x: sinMovimiento ? 0 : 8 * direccion, duration: sinMovimiento ? 0 : 180 }}>
                <span class="nombre">
                  <EnLinea valor={actual.nombre} max={OBJETIVO_MAX} etiqueta="Renombrar objetivo" onguardar={(v) => onrenombrar(actual.id, v)} />
                </span>
                <span class="conteo" class:completo={actual.total > 0 && actual.logradas === actual.total} title="Tareas logradas">{conteo(actual)}</span>
                <button
                  type="button"
                  class="borrar"
                  class:bloqueado={actual.total > 0}
                  aria-label="Borrar objetivo"
                  title={actual.total > 0 ? 'Tiene tareas: no se puede borrar' : 'Borrar objetivo'}
                  onclick={() => onborrar(actual.id)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            {/key}
          </div>
          <button type="button" class="flecha" aria-label="Objetivo siguiente" title="Objetivo siguiente" aria-disabled={indice >= objetivos.length - 1} onclick={() => ir(1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>
      {#if objetivos.length > 1}
        <span class="posicion" title="Objetivo {indice + 1} de {objetivos.length}">{indice + 1} / {objetivos.length}</span>
      {/if}
    {/if}

    <button type="button" class="hoja agregar" aria-label="Agregar objetivo" title="Agregar objetivo" onclick={abrirNuevo}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
    </button>
  {/if}
</div>

<style>
  .pila {
    display: flex;
    align-items: flex-end;
    gap: 0.45rem;
    padding: 0 0.4rem;
    /* Deja ver las hojas que asoman arriba de la del frente. */
    padding-top: 10px;
  }

  /* Hoja de plano tipo pestaña: sólida y fundida con el tablero de abajo. */
  .hoja {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    max-width: 26rem;
    padding: 0.45rem 0.8rem calc(0.45rem + 1px);
    margin-bottom: -1px;
    font-family: var(--bp-font-hand);
    font-size: 1.02rem;
    letter-spacing: 0.02em;
    color: #fff;
    background: rgba(7, 31, 79, 0.55);
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    border-bottom: 0;
    border-radius: 6px 6px 0 0;
  }
  /* La del frente lleva las flechas en sus orillas, separadas del objetivo por una línea
     punteada. */
  .hoja.frente {
    gap: 0.2rem;
    padding-inline: 0.3rem;
  }
  .contenido {
    min-width: 0;
    padding: 0 0.55rem;
    border-inline: 1px dashed rgba(255, 255, 255, 0.25);
  }
  .actual {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  /* Las hojas de atrás: solo su borde de arriba y el derecho, desfasados, para que asomen sin
     tapar a la del frente. */
  .hojas {
    position: relative;
    display: flex;
    min-width: 0;
  }
  .hojas.capa1::before,
  .hojas.capa2::after {
    content: '';
    position: absolute;
    inset: 0;
    border-top: 1px dashed rgba(255, 255, 255, 0.45);
    border-right: 1px dashed rgba(255, 255, 255, 0.45);
    border-radius: 0 6px 0 0;
    pointer-events: none;
  }
  .hojas.capa1::before {
    transform: translate(5px, -5px);
  }
  .hojas.capa2::after {
    transform: translate(10px, -10px);
    opacity: 0.6;
  }
  /* Lugar para lo que asoma a la derecha, para que no se encime con lo que sigue. */
  .hojas.capa1 {
    margin-right: 5px;
  }
  .hojas.capa2 {
    margin-right: 10px;
  }

  .nombre {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .conteo {
    flex-shrink: 0;
    font-family: var(--bp-font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    /* Cero sin rayita: a este tamaño el de JetBrains Mono se confunde con un 8. */
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'zero' 0;
    color: rgba(255, 255, 255, 0.55);
  }
  .conteo:empty {
    display: none;
  }
  .conteo.completo {
    color: #f5c542;
  }
  .borrar {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    margin-right: -0.25rem;
    color: rgba(255, 255, 255, 0.45);
    background: transparent;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .borrar:hover:not(.bloqueado) {
    color: #ffc9a8;
    background: rgba(255, 201, 168, 0.15);
  }
  /* Con tareas no se puede borrar: la × se apaga (al pulsarla sale un aviso con el porqué). */
  .borrar.bloqueado {
    opacity: 0.4;
    cursor: help;
  }

  /* Flechas ‹ › en las orillas de la hoja del frente. En los extremos van con aria-disabled
     (no disabled) para que no suelten el foco: así ← → siguen funcionando al llegar al final. */
  .flecha {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    color: rgba(255, 255, 255, 0.85);
    background: transparent;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .flecha:hover:not([aria-disabled='true']) {
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
  }
  .flecha[aria-disabled='true'] {
    opacity: 0.25;
    cursor: default;
  }
  .flecha:focus-visible,
  .agregar:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
  .posicion {
    align-self: center;
    flex-shrink: 0;
    font-family: var(--bp-font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.1em;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'zero' 0;
    color: rgba(255, 255, 255, 0.55);
  }

  /* "+": pestaña punteada del alto de una hoja de una línea (borde + padding + 1 renglón +
     el pixel que la hoja baja sobre el tablero), aunque el nombre del objetivo ocupe varias. */
  .agregar {
    height: calc(1lh + 0.9rem + 2px);
    justify-content: center;
    min-width: 2.4rem;
    margin-left: 0.2rem;
    padding: 0.45rem 0.6rem;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.45);
    border-bottom: 0;
    margin-bottom: 0;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .agregar:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.75);
  }

  .hoja.nueva {
    flex-direction: column;
    align-items: stretch;
    gap: 0.2rem;
  }
  .nueva input {
    width: 16rem;
    max-width: 60vw;
    padding: 0 0.1rem 0.1rem;
    font: inherit;
    color: #fff;
    background: transparent;
    border: 0;
    border-bottom: 1px solid #fff;
    outline: none;
    caret-color: #fff;
  }
  .nueva input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  .error {
    font-family: var(--bp-font-mono);
    font-size: 0.6rem;
    color: #ffc9a8;
  }

  /* En celular el "x / y" le quita a la hoja el ancho que necesita; las flechas y las hojas
     que asoman ya dicen que hay más. */
  @media (max-width: 520px) {
    .pila {
      gap: 0.35rem;
    }
    .posicion {
      display: none;
    }
  }
</style>
