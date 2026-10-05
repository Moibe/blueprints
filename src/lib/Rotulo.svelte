<script lang="ts">
  // Cuadro de rotulación, el de la esquina inferior derecha de un plano. La primera celda
  // muestra "Plano" (texto fijo) o, si se pasa `objetivo`, un "Objetivo" editable en el lugar:
  // clic en la celda → campo; Enter o clic fuera guarda, Escape cancela. Con `renombrar`, el
  // nombre del proyecto también se edita en el lugar.
  import EnLinea from '$lib/EnLinea.svelte';
  import { OBJETIVO_MAX, limpiarTexto } from '$lib/secciones';

  let {
    hoja,
    fecha,
    plano = '',
    objetivo,
    renombrar,
    escala = '1:50',
    proyecto = 'blueprints'
  }: {
    hoja: string;
    fecha: string;
    plano?: string;
    objetivo?: { valor: string | null; onguardar: (valor: string) => Promise<string> };
    renombrar?: { max: number; onguardar: (valor: string) => Promise<string> };
    escala?: string;
    proyecto?: string;
  } = $props();

  // Lo que se ve; tras guardar se sobrescribe con lo que regresó el servidor.
  let mostrado = $derived(objetivo?.valor ?? '');
  let editando = $state(false);
  let borrador = $state('');
  let guardando = $state(false);
  let error = $state('');

  function editar() {
    borrador = mostrado;
    error = '';
    editando = true;
  }

  function enfocar(campo: HTMLTextAreaElement) {
    campo.focus();
    campo.setSelectionRange(campo.value.length, campo.value.length);
  }

  async function guardar() {
    if (!objetivo || !editando || guardando) return;
    const nuevo = limpiarTexto(borrador);
    if (nuevo === mostrado) {
      editando = false;
      return;
    }
    guardando = true;
    error = '';
    try {
      mostrado = await objetivo.onguardar(nuevo);
      editando = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo guardar.';
    } finally {
      guardando = false;
    }
  }

  function teclas(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      guardar();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      editando = false;
      error = '';
    }
  }
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
  <div class="c-grid">
    {#if objetivo}
      <div class="celda-objetivo">
        {#if editando}
          <div class="edicion">
            <span class="k">Objetivo</span>
            <textarea
              use:enfocar
              bind:value={borrador}
              maxlength={OBJETIVO_MAX}
              rows="2"
              placeholder="¿Qué quieres lograr?"
              readonly={guardando}
              onkeydown={teclas}
              onblur={guardar}
            ></textarea>
            {#if error}
              <span class="error" role="alert">{error}</span>
            {:else}
              <span class="ayuda">Enter guarda · Esc cancela</span>
            {/if}
          </div>
        {:else}
          <button type="button" class="editable" onclick={editar}>
            <span class="k">Objetivo</span>
            {#if mostrado}
              <span class="v">{mostrado}</span>
            {:else}
              <span class="sin-valor">Clic para añadir</span>
            {/if}
          </button>
        {/if}
      </div>
    {:else}
      <div><span class="k">Plano</span><span class="v">{plano}</span></div>
    {/if}
    <div><span class="k">Escala</span><span class="v">{escala}</span></div>
    <div><span class="k">Fecha</span><span class="v">{fecha}</span></div>
    <div><span class="k">Hoja</span><span class="v">{hoja}</span></div>
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
    grid-template-columns: 1fr 1fr;
  }
  .c-grid > div {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 0.4rem 0.7rem;
  }
  .c-grid > div:nth-child(odd) {
    border-right: 1px solid rgba(255, 255, 255, 0.6);
  }
  .c-grid > div:nth-child(-n + 2) {
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

  /* Celda Objetivo: sin padding propio, para que el botón cubra toda la celda (el texto y
     el espacio vacío de abajo). */
  .c-grid > div.celda-objetivo {
    padding: 0;
  }
  .editable,
  .edicion {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.4rem 0.7rem;
  }
  .editable {
    min-height: 3rem;
    text-align: left;
    font: inherit;
    color: inherit;
    background: transparent;
    border: 0;
    cursor: text;
    transition: background 0.15s ease;
  }
  .editable:hover {
    background: rgba(255, 255, 255, 0.07);
  }
  .editable:hover .k::after {
    content: ' ✎';
  }
  .editable:focus-visible {
    outline: 1px dashed #fff;
    outline-offset: -4px;
  }
  .sin-valor {
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.35);
  }
  .edicion {
    background: rgba(255, 255, 255, 0.07);
  }
  textarea {
    width: 100%;
    min-height: 1.5em;
    padding: 0.1rem 0.15rem;
    font: inherit;
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    line-height: 1.35;
    color: #fff;
    background: transparent;
    border: 0;
    border-bottom: 1px solid #fff;
    outline: none;
    resize: none;
    field-sizing: content;
    caret-color: #fff;
  }
  textarea::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
  .ayuda,
  .error {
    margin-top: 0.2rem;
    font-size: 0.52rem;
    letter-spacing: 0.08em;
  }
  .ayuda {
    color: rgba(255, 255, 255, 0.45);
  }
  .error {
    color: #ffc9a8;
  }
</style>
