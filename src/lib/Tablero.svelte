<script lang="ts">
  // Área de dibujo de una sección: clic en el espacio vacío crea una tarjeta; clic en su texto
  // lo edita (Enter o clic fuera guarda, Escape cancela, dejarla vacía la borra); la paloma de
  // la derecha la marca como completada.
  import { TARJETA_MAX, limpiarTexto } from '$lib/secciones';

  // logrado: Date desde el load, string ISO desde los endpoints (JSON).
  type Tarjeta = { id: number; texto: string; hecho: boolean; logrado: Date | string | null };

  const formatoFecha = (f: Date | string) =>
    new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  let {
    seccionId,
    tarjetas,
    oncambio
  }: {
    seccionId: number;
    tarjetas: Tarjeta[];
    /** Avisa al padre cuántas tarjetas hay y cuántas están logradas (para el resumen). */
    oncambio?: (total: number, logradas: number) => void;
  } = $props();

  let lista = $derived(tarjetas);
  $effect(() => {
    oncambio?.(lista.length, lista.filter((t) => t.hecho).length);
  });
  let editando = $state<number | 'nueva' | null>(null);
  let borrador = $state('');
  let error = $state('');
  let ocupado = false;

  async function api(url: string, method: string, body?: object) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? 'No se pudo guardar.');
    return data;
  }

  function enfocar(campo: HTMLTextAreaElement) {
    campo.focus();
    campo.setSelectionRange(campo.value.length, campo.value.length);
  }

  // Solo el espacio vacío crea tarjeta (no los clics sobre una tarjeta).
  function nueva(e: MouseEvent) {
    if (e.target !== e.currentTarget || editando !== null) return;
    borrador = '';
    error = '';
    editando = 'nueva';
  }

  function editar(t: Tarjeta) {
    borrador = t.texto;
    error = '';
    editando = t.id;
  }

  async function guardar() {
    if (editando === null || ocupado) return;
    const cual = editando;
    const texto = limpiarTexto(borrador);
    ocupado = true;
    try {
      if (cual === 'nueva') {
        if (texto) {
          const { tarjeta } = await api(`/api/secciones/${seccionId}/tarjetas`, 'POST', { texto });
          lista = [...lista, tarjeta];
        }
      } else if (!texto) {
        await api(`/api/tarjetas/${cual}`, 'DELETE');
        lista = lista.filter((t) => t.id !== cual);
      } else if (texto !== lista.find((t) => t.id === cual)?.texto) {
        const { tarjeta } = await api(`/api/tarjetas/${cual}`, 'PATCH', { texto });
        lista = lista.map((t) => (t.id === cual ? tarjeta : t));
      }
      editando = null;
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo guardar.';
    } finally {
      ocupado = false;
    }
  }

  function teclas(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      guardar();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      editando = null;
      error = '';
    }
  }

  // Optimista: se palomea al instante y se revierte si el servidor falla.
  async function alternar(t: Tarjeta) {
    const hecho = !t.hecho;
    const antes = t;
    lista = lista.map((x) => (x.id === t.id ? { ...x, hecho, logrado: hecho ? new Date() : null } : x));
    try {
      const { tarjeta } = await api(`/api/tarjetas/${t.id}`, 'PATCH', { hecho });
      lista = lista.map((x) => (x.id === t.id ? tarjeta : x));
    } catch {
      lista = lista.map((x) => (x.id === t.id ? antes : x));
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="tablero" onclick={nueva}>
  {#each lista as t (t.id)}
    <article class="tarjeta" class:hecho={t.hecho}>
      <div class="cuerpo">
        {#if editando === t.id}
          {@render campo()}
        {:else}
          <button type="button" class="texto" onclick={() => editar(t)}>{t.texto}</button>
        {/if}
        {#if t.hecho && t.logrado}
          <span class="logrado">✓ Logrado el {formatoFecha(t.logrado)}</span>
        {/if}
      </div>
      <button
        type="button"
        class="check"
        aria-pressed={t.hecho}
        aria-label={t.hecho ? 'Marcar como pendiente' : 'Marcar como completada'}
        onclick={() => alternar(t)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </button>
    </article>
  {/each}

  {#if editando === 'nueva'}
    <article class="tarjeta nueva">
      <div class="cuerpo">{@render campo()}</div>
    </article>
  {/if}

  {#if lista.length === 0 && editando === null}
    <span class="aviso">Clic aquí para agregar una tarjeta</span>
  {/if}
</div>

{#snippet campo()}
  <textarea
    use:enfocar
    bind:value={borrador}
    maxlength={TARJETA_MAX}
    rows="2"
    placeholder="Escribe la tarjeta…"
    onkeydown={teclas}
    onblur={guardar}
  ></textarea>
  {#if error}<span class="error" role="alert">{error}</span>{/if}
{/snippet}

<style>
  .tablero {
    position: relative;
    flex: 1;
    min-height: 14rem;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 0.9rem;
    padding: 1rem;
    border: 1px dashed rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
    cursor: copy;
  }
  .aviso {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-family: var(--bp-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }

  .tarjeta {
    width: 15rem;
    min-height: 4.2rem;
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.7rem 0.75rem 0.7rem 0.9rem;
    border: 1.5px solid rgba(255, 255, 255, 0.85);
    border-radius: 6px;
    background: rgba(7, 31, 79, 0.45);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    cursor: default;
    transition: border-color 0.2s ease;
  }
  .tarjeta.nueva {
    border-style: dashed;
  }
  .tarjeta.hecho {
    border-color: rgba(134, 239, 172, 0.75);
  }
  .cuerpo {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .texto {
    text-align: left;
    font-family: var(--bp-font-hand);
    font-size: 1.05rem;
    line-height: 1.35;
    color: #fff;
    background: none;
    border: 0;
    padding: 0;
    cursor: text;
    overflow-wrap: anywhere;
  }
  .hecho .texto {
    text-decoration: line-through;
    opacity: 0.55;
  }
  .logrado {
    margin-top: 0.45rem;
    font-family: var(--bp-font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    color: #86efac;
  }
  textarea {
    width: 100%;
    min-height: 1.5em;
    padding: 0;
    font-family: var(--bp-font-hand);
    font-size: 1.05rem;
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
    color: rgba(255, 255, 255, 0.4);
  }
  .error {
    margin-top: 0.3rem;
    font-family: var(--bp-font-mono);
    font-size: 0.6rem;
    color: #ffc9a8;
  }

  /* Paloma: círculo punteado vacío; verde y con brillo cuando está completada. */
  .check {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1.5px dashed rgba(255, 255, 255, 0.6);
    background: transparent;
    color: transparent;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  }
  .check:hover {
    border: 1.5px solid #4ade80;
    color: rgba(74, 222, 128, 0.7);
  }
  .hecho .check {
    border: 1.5px solid #22c55e;
    background: #22c55e;
    color: #fff;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
  }
  .check:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
</style>
