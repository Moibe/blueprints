<script lang="ts">
  // Pestañas de objetivos sobre el área de dibujo. La activa muestra su nombre editable en el
  // lugar y un botón para borrarla; la última pestaña, "+ Objetivo", crea uno nuevo escribiendo
  // su nombre ahí mismo (Enter crea, Escape cancela).
  import EnLinea from '$lib/EnLinea.svelte';
  import { OBJETIVO_MAX, limpiarTexto } from '$lib/secciones';

  type Pestana = { id: number; nombre: string; total: number; logradas: number };
  let {
    objetivos,
    activo,
    onactivar,
    oncrear,
    onrenombrar,
    onborrar
  }: {
    objetivos: Pestana[];
    activo: number | null;
    onactivar: (id: number) => void;
    oncrear: (nombre: string) => Promise<void>;
    onrenombrar: (id: number, nombre: string) => Promise<string>;
    onborrar: (id: number) => void;
  } = $props();

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
      await oncrear(nombre);
      creando = false;
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo crear.';
    } finally {
      ocupado = false;
    }
  }

  function teclas(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      crear();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      creando = false;
      error = '';
    }
  }
</script>

<div class="pestanas" role="tablist" aria-label="Objetivos">
  {#each objetivos as o (o.id)}
    {@const esActivo = o.id === activo}
    {#if esActivo}
      <div class="pestana activa" role="tab" aria-selected="true">
        <span class="nombre">
          <EnLinea valor={o.nombre} max={OBJETIVO_MAX} etiqueta="Renombrar objetivo" onguardar={(v) => onrenombrar(o.id, v)} />
        </span>
        <span class="conteo" class:completo={o.total > 0 && o.logradas === o.total}>{o.logradas}/{o.total}</span>
        <button type="button" class="borrar" aria-label="Borrar objetivo" onclick={() => onborrar(o.id)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    {:else}
      <button type="button" class="pestana" role="tab" aria-selected="false" onclick={() => onactivar(o.id)}>
        <span class="nombre">{o.nombre}</span>
        <span class="conteo" class:completo={o.total > 0 && o.logradas === o.total}>{o.logradas}/{o.total}</span>
      </button>
    {/if}
  {/each}

  {#if creando}
    <div class="pestana nueva">
      <input
        use:enfocar
        bind:value={borrador}
        maxlength={OBJETIVO_MAX}
        placeholder="Nombre del objetivo…"
        aria-label="Nombre del nuevo objetivo"
        onkeydown={teclas}
        onblur={crear}
      />
      {#if error}<span class="error" role="alert">{error}</span>{/if}
    </div>
  {:else}
    <button type="button" class="pestana agregar" onclick={abrirNuevo}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      Objetivo
    </button>
  {/if}
</div>

<style>
  .pestanas {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.4rem;
    padding: 0 0.4rem;
  }
  /* Pestañas de plano: marco punteado; la activa se vuelve sólida y se funde con el tablero. */
  .pestana {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    max-width: 22rem;
    padding: 0.45rem 0.8rem;
    font-family: var(--bp-font-hand);
    font-size: 1.02rem;
    letter-spacing: 0.02em;
    color: rgba(255, 255, 255, 0.78);
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.45);
    border-bottom: 0;
    border-radius: 6px 6px 0 0;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .pestana:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.75);
  }
  .pestana.activa {
    color: #fff;
    background: rgba(7, 31, 79, 0.55);
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    border-bottom: 0;
    cursor: default;
    margin-bottom: -1px;
    padding-bottom: calc(0.45rem + 1px);
  }
  .nombre {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .activa .nombre {
    overflow: visible;
    white-space: normal;
  }
  .conteo {
    flex-shrink: 0;
    font-family: var(--bp-font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.5);
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
    margin-right: -0.3rem;
    color: rgba(255, 255, 255, 0.45);
    background: transparent;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .borrar:hover {
    color: #ffc9a8;
    background: rgba(255, 201, 168, 0.15);
  }
  .agregar {
    gap: 0.35rem;
    color: rgba(255, 255, 255, 0.6);
  }
  .pestana.nueva {
    flex-direction: column;
    align-items: stretch;
    gap: 0.2rem;
    cursor: default;
    border-style: solid;
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
</style>
