<script lang="ts">
  // Modal de + Crear: pide el nombre de la sección nueva y la crea vía POST /api/secciones.
  // Es un <dialog> nativo con estilo de plano: vive en el top layer, así que queda encima de
  // todo aunque las barras tengan transform, y Escape lo cierra solo.
  import { NOMBRE_MAX, limpiarNombre } from '$lib/secciones';

  let {
    open = $bindable(false),
    oncreada
  }: {
    open?: boolean;
    oncreada: (id: number) => void | Promise<void>;
  } = $props();

  let dialog: HTMLDialogElement;
  let input: HTMLInputElement;
  let nombre = $state('');
  let error = $state('');
  let enviando = $state(false);
  // Solo se cierra al hacer clic fuera si el clic también EMPEZÓ fuera (arrastrar para
  // seleccionar texto y soltar sobre el fondo no debe cerrarlo).
  let pulsoEnFondo = false;

  $effect(() => {
    if (open && !dialog.open) {
      nombre = '';
      error = '';
      dialog.showModal();
      input.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  async function crear(e: SubmitEvent) {
    e.preventDefault();
    const limpio = limpiarNombre(nombre);
    if (!limpio || enviando) return;

    enviando = true;
    error = '';
    let res: Response;
    try {
      res = await fetch('/api/secciones', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nombre: limpio })
      });
    } catch {
      error = 'No hay conexión con el servidor.';
      enviando = false;
      return;
    }
    const body: { error?: string; seccion?: { id: number } } = await res.json().catch(() => ({}));
    enviando = false;

    if (!res.ok || !body.seccion) {
      error = body.error ?? 'No se pudo crear la sección.';
      input.focus();
      return;
    }
    open = false;
    await oncreada(body.seccion.id);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  class="modal"
  aria-labelledby="crear-titulo"
  onclose={() => (open = false)}
  onpointerdown={(e) => (pulsoEnFondo = e.target === dialog)}
  onclick={(e) => {
    if (pulsoEnFondo && e.target === dialog) open = false;
  }}
>
  <form class="hoja" onsubmit={crear}>
    <span class="tag">Nueva sección</span>
    <h2 id="crear-titulo">¿Cómo se va a llamar?</h2>

    <label class="campo">
      <span class="campo-label">Nombre</span>
      <input
        bind:this={input}
        bind:value={nombre}
        maxlength={NOMBRE_MAX}
        placeholder="Ej. Planta alta"
        autocomplete="off"
      />
      <span class="contador">{nombre.length}/{NOMBRE_MAX}</span>
    </label>

    {#if error}
      <p class="error" role="alert">{error}</p>
    {/if}

    <div class="acciones">
      <button type="button" class="btn-sec" onclick={() => (open = false)}>Cancelar</button>
      <button type="submit" class="btn-pri" disabled={!limpiarNombre(nombre) || enviando}>
        {enviando ? 'Creando…' : 'Crear'}
      </button>
    </div>
  </form>
</dialog>

<style>
  /* El reset de Tailwind le quita al <dialog> el margin: auto que lo centra. */
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

  /* La hoja: un plano chiquito, con su cuadrícula, borde blanco y marco punteado interior. */
  .hoja {
    width: min(26rem, calc(100vw - 2rem));
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
  .modal[open] .hoja {
    animation: aparecer 0.2s ease-out;
  }
  @keyframes aparecer {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
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
    font-size: 1.7rem;
    line-height: 1.15;
  }

  /* Campo como renglón de rotulado: sin caja, solo la línea de base. */
  .campo {
    position: relative;
    display: block;
    margin-top: 1.1rem;
  }
  .campo-label {
    display: block;
    margin-bottom: 0.2rem;
    font-family: var(--bp-font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
  }
  input {
    width: 100%;
    padding: 0.3rem 3.4rem 0.35rem 0.1rem;
    font-family: var(--bp-font-hand);
    font-size: 1.45rem;
    color: #fff;
    background: transparent;
    border: 0;
    border-bottom: 1.5px solid rgba(255, 255, 255, 0.75);
    outline: none;
    caret-color: #fff;
  }
  input::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
  input:focus {
    border-bottom-color: #fff;
    box-shadow: 0 1px 0 0 #fff;
  }
  .contador {
    position: absolute;
    right: 0.1rem;
    bottom: 0.6rem;
    font-family: var(--bp-font-mono);
    font-size: 0.62rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .error {
    margin: 0.75rem 0 0;
    font-family: var(--bp-font-mono);
    font-size: 0.72rem;
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
    transition: background 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
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
  .btn-pri {
    color: var(--bp-b, #0b2e6f);
    background: rgba(255, 255, 255, 0.92);
    border: 1.5px solid #fff;
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.18);
  }
  .btn-pri:hover:not(:disabled) {
    background: #fff;
    box-shadow: 0 0 18px rgba(255, 255, 255, 0.4);
  }
  .btn-pri:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .btn-sec:focus-visible,
  .btn-pri:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
</style>
