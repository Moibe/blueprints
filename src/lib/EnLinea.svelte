<script lang="ts">
  // Texto de una línea editable en el lugar: clic → campo; Enter o clic fuera guarda, Escape
  // cancela. Hereda la tipografía del contenedor (sirve igual en un h1 que en el rótulo).
  // No acepta vacío; `onguardar` regresa el valor que quedó guardado o lanza un Error con el
  // mensaje a mostrar.
  import { limpiarTexto } from '$lib/secciones';

  let {
    valor,
    max,
    etiqueta,
    titulo,
    onguardar
  }: {
    valor: string;
    max: number;
    etiqueta: string;
    /** Lo que se asoma al pasar el mouse; por omisión, `etiqueta`. Útil donde el texto se
     *  recorta y conviene asomar el completo. */
    titulo?: string;
    onguardar: (valor: string) => Promise<string>;
  } = $props();

  let mostrado = $derived(valor);
  let editando = $state(false);
  let borrador = $state('');
  let guardando = $state(false);
  let error = $state('');

  function editar() {
    borrador = mostrado;
    error = '';
    editando = true;
  }

  function enfocar(campo: HTMLInputElement) {
    campo.focus();
  }

  async function guardar() {
    if (!editando || guardando) return;
    const nuevo = limpiarTexto(borrador);
    if (!nuevo) {
      error = 'No puede quedar vacío.';
      return;
    }
    if (nuevo === mostrado) {
      editando = false;
      error = '';
      return;
    }
    guardando = true;
    error = '';
    try {
      mostrado = await onguardar(nuevo);
      editando = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo guardar.';
    } finally {
      guardando = false;
    }
  }

  function teclas(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      guardar();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      editando = false;
      error = '';
    }
  }
</script>

{#if editando}
  <input
    class="campo"
    use:enfocar
    bind:value={borrador}
    maxlength={max}
    aria-label={etiqueta}
    readonly={guardando}
    onkeydown={teclas}
    onblur={guardar}
  />
  {#if error}
    <span class="error" role="alert">{error}</span>
  {/if}
{:else}
  <button type="button" class="texto" title={titulo ?? etiqueta} onclick={editar}>{mostrado}</button>
{/if}

<style>
  .texto,
  .campo {
    margin: 0;
    padding: 0;
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
    line-height: inherit;
  }
  .texto {
    text-align: left;
    background: none;
    border: 0;
    border-bottom: 1px dashed transparent;
    cursor: text;
    overflow-wrap: anywhere;
    transition: border-color 0.15s ease;
  }
  .texto:hover {
    border-bottom-color: rgba(255, 255, 255, 0.5);
  }
  /* El lápiz siempre ocupa su lugar (invisible) para que nada cambie de ancho al pasar el
     mouse. */
  .texto::after {
    content: ' ✎';
    font-size: 0.45em;
    vertical-align: middle;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  .texto:hover::after,
  .texto:focus-visible::after {
    opacity: 0.7;
  }
  .texto:focus-visible {
    outline: 1px dashed #fff;
    outline-offset: 3px;
  }
  .campo {
    min-width: 6ch;
    max-width: 100%;
    field-sizing: content;
    background: rgba(255, 255, 255, 0.06);
    border: 0;
    border-bottom: 1.5px solid #fff;
    outline: none;
    caret-color: #fff;
  }
  .error {
    display: block;
    margin-top: 0.3rem;
    font-family: var(--bp-font-mono);
    font-size: 0.65rem;
    font-weight: 400;
    letter-spacing: 0.06em;
    line-height: 1.4;
    color: #ffc9a8;
    text-shadow: none;
  }
</style>
