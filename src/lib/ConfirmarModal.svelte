<script lang="ts">
  // Confirmación con estilo de plano (en lugar del confirm() del navegador). <dialog> nativo:
  // vive en el top layer y Escape lo cierra solo.
  let {
    open = $bindable(false),
    titulo,
    detalle,
    accion = 'Borrar',
    onconfirmar,
    onclose
  }: {
    open?: boolean;
    titulo: string;
    detalle: string;
    accion?: string;
    onconfirmar: () => void | Promise<void>;
    /** Se llama al cerrarse por cualquier vía (Cancelar, Escape, clic fuera o tras confirmar). */
    onclose?: () => void;
  } = $props();

  // Id único: puede haber más de una confirmación en la misma página.
  const uid = $props.id();
  let dialog: HTMLDialogElement;
  let ocupado = $state(false);
  let error = $state('');
  let pulsoEnFondo = false;

  $effect(() => {
    if (open && !dialog.open) {
      error = '';
      dialog.showModal();
    } else if (!open && dialog.open) dialog.close();
  });

  // Si la acción falla, el modal se queda abierto y muestra el porqué.
  async function confirmar() {
    if (ocupado) return;
    ocupado = true;
    error = '';
    try {
      await onconfirmar();
      open = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo completar.';
    } finally {
      ocupado = false;
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  class="modal"
  aria-labelledby="{uid}-titulo"
  onclose={() => {
    open = false;
    onclose?.();
  }}
  onpointerdown={(e) => (pulsoEnFondo = e.target === dialog)}
  onclick={(e) => {
    if (pulsoEnFondo && e.target === dialog) open = false;
  }}
>
  <div class="hoja">
    <span class="tag">Confirmar</span>
    <h2 id="{uid}-titulo">{titulo}</h2>
    <p class="detalle">{detalle}</p>
    {#if error}
      <p class="error" role="alert">{error}</p>
    {/if}
    <div class="acciones">
      <button type="button" class="btn-sec" onclick={() => (open = false)}>Cancelar</button>
      <button type="button" class="btn-pri" disabled={ocupado} onclick={confirmar}>
        {ocupado ? 'Un momento…' : accion}
      </button>
    </div>
  </div>
</dialog>

<style>
  .modal {
    margin: auto;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--bp-ink, #fff);
    overflow: visible;
  }
  .modal::backdrop {
    background: rgba(3, 14, 42, 0.55);
    backdrop-filter: blur(3px);
  }
  .hoja {
    width: min(24rem, calc(100vw - 2rem));
    box-sizing: border-box;
    padding: 1.5rem 1.6rem 1.3rem;
    background:
      linear-gradient(var(--bp-grid-minor) 1px, transparent 1px) -1px -1px / 24px 24px,
      linear-gradient(90deg, var(--bp-grid-minor) 1px, transparent 1px) -1px -1px / 24px 24px,
      linear-gradient(135deg, var(--bp-a), var(--bp-b));
    border: 1.5px solid var(--bp-line);
    border-radius: var(--bp-radius);
    outline: 1px dashed var(--bp-line-soft);
    outline-offset: -8px;
    box-shadow:
      0 0 24px rgba(255, 255, 255, 0.12),
      0 18px 48px rgba(0, 0, 0, 0.45);
  }
  .tag {
    font-family: var(--bp-font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.65);
  }
  h2 {
    margin: 0.25rem 0 0;
    font-family: var(--bp-font-hand);
    font-weight: 400;
    font-size: 1.6rem;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .detalle {
    margin: 0.7rem 0 0;
    font-family: var(--bp-font-mono);
    font-size: 0.74rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.75);
  }
  .error {
    margin: 0.6rem 0 0;
    font-family: var(--bp-font-mono);
    font-size: 0.7rem;
    color: #ffc9a8;
  }
  .acciones {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    margin-top: 1.4rem;
  }
  .btn-sec,
  .btn-pri {
    padding: 0.45rem 1.1rem;
    font-family: var(--bp-font-hand);
    font-size: 1.05rem;
    letter-spacing: 0.03em;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.18s ease, border-color 0.18s ease;
  }
  .btn-sec {
    color: rgba(255, 255, 255, 0.9);
    background: transparent;
    border: 1px dashed rgba(255, 255, 255, 0.6);
  }
  .btn-sec:hover {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.85);
  }
  /* Acción destructiva: tinta naranja, el mismo color de los errores del plano. */
  .btn-pri {
    color: #2a1200;
    background: #ffc9a8;
    border: 1.5px solid #ffd9c2;
  }
  .btn-pri:hover:not(:disabled) {
    background: #ffd9c2;
  }
  .btn-pri:disabled {
    opacity: 0.5;
    cursor: wait;
  }
</style>
