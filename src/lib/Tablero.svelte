<script lang="ts">
  // Área de dibujo de un objetivo: clic en el espacio vacío crea una tarea; clic en su texto
  // lo edita (Enter o clic fuera guarda, Escape cancela, dejarla vacía la borra); la paloma de
  // la derecha la marca como completada; clic derecho sobre ella la borra (con confirmación).
  import { untrack } from 'svelte';
  import { flip } from 'svelte/animate';
  import { scale } from 'svelte/transition';
  import ConfirmarModal from '$lib/ConfirmarModal.svelte';
  import { TARJETA_MAX, limpiarTexto } from '$lib/secciones';

  // Fechas: Date desde el load, string ISO desde los endpoints (JSON).
  type Tarjeta = {
    id: number;
    texto: string;
    hecho: boolean;
    logrado: Date | string | null;
    creado: Date | string;
  };

  const formatoFecha = (f: Date | string) =>
    new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  let {
    objetivoId,
    tarjetas,
    oncambio
  }: {
    objetivoId: number;
    tarjetas: Tarjeta[];
    /** Avisa al padre de la lista actual de tareas (para el resumen y el siguiente objetivo). */
    oncambio?: (tarjetas: Tarjeta[]) => void;
  } = $props();

  let lista = $derived(tarjetas);
  // untrack: el callback del padre puede cambiar de identidad en cada render; si el efecto lo
  // rastreara, se dispararía en bucle.
  $effect(() => {
    const actual = lista;
    untrack(() => oncambio?.(actual));
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
          const { tarjeta } = await api(`/api/objetivos/${objetivoId}/tarjetas`, 'POST', { texto });
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

  // Palomear es un momento: una chispa dorada recorre el contorno de la tarjeta dejándolo
  // dorado a su paso y, al cerrar la vuelta, la tarjeta destella y aparece la paloma.
  const DURACION_TRAZO = 1500;
  const DURACION_FINAL = 900;
  type Animacion = { d: string; w: number; h: number; fase: 'trazo' | 'final' };
  let animaciones: Record<number, Animacion> = $state({});

  const esperar = (ms: number) => new Promise((listo) => setTimeout(listo, ms));

  // Contorno de la tarjeta como path cerrado sobre la línea del borde (1.5px, radio 6px), en
  // sentido horario y arrancando en el borde de arriba, justo sobre la paloma.
  function contorno(w: number, h: number) {
    const b = 0.75;
    const r = 5.25;
    const x0 = w - 27.5;
    return (
      `M${x0} ${b}H${w - b - r}A${r} ${r} 0 0 1 ${w - b} ${b + r}V${h - b - r}` +
      `A${r} ${r} 0 0 1 ${w - b - r} ${h - b}H${b + r}A${r} ${r} 0 0 1 ${b} ${h - b - r}` +
      `V${b + r}A${r} ${r} 0 0 1 ${b + r} ${b}H${x0}Z`
    );
  }

  function alternar(t: Tarjeta, tarjeta: HTMLElement | null) {
    if (animaciones[t.id]) return;
    if (t.hecho) desmarcar(t);
    else if (tarjeta) completar(t, tarjeta);
  }

  // El guardado corre en paralelo con el trazo; la tarjeta queda lograda cuando la chispa
  // cierra la vuelta. Si el servidor falla, la animación se corta y la tarjeta queda igual.
  async function completar(t: Tarjeta, tarjeta: HTMLElement) {
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const w = tarjeta.offsetWidth;
    const h = tarjeta.offsetHeight;
    if (!sinMovimiento) animaciones[t.id] = { d: contorno(w, h), w, h, fase: 'trazo' };

    const [res] = await Promise.all([
      api(`/api/tarjetas/${t.id}`, 'PATCH', { hecho: true }).catch(() => null),
      esperar(sinMovimiento ? 0 : DURACION_TRAZO)
    ]);
    if (!res) {
      delete animaciones[t.id];
      return;
    }
    lista = lista.map((x) => (x.id === t.id ? res.tarjeta : x));
    if (sinMovimiento) return;

    animaciones[t.id].fase = 'final';
    await esperar(DURACION_FINAL);
    delete animaciones[t.id];
  }

  // Desmarcar es inmediato (optimista) y se revierte si el servidor falla.
  async function desmarcar(t: Tarjeta) {
    lista = lista.map((x) => (x.id === t.id ? { ...x, hecho: false, logrado: null } : x));
    try {
      const { tarjeta } = await api(`/api/tarjetas/${t.id}`, 'PATCH', { hecho: false });
      lista = lista.map((x) => (x.id === t.id ? tarjeta : x));
    } catch {
      lista = lista.map((x) => (x.id === t.id ? t : x));
    }
  }

  // Clic derecho sobre una tarea → confirmación para borrarla. Mientras se edita su texto se
  // deja el menú normal del navegador (copiar, pegar, ortografía).
  let porBorrar = $state<Tarjeta | null>(null);
  function pedirBorrar(e: MouseEvent, t: Tarjeta) {
    if (editando === t.id) return;
    e.preventDefault();
    porBorrar = t;
  }
  async function borrar() {
    if (!porBorrar) return;
    const id = porBorrar.id;
    await api(`/api/tarjetas/${id}`, 'DELETE');
    lista = lista.filter((t) => t.id !== id);
  }

  // Salida y reacomodo de tarjetas (sin animación si el sistema pide reducir movimiento).
  const reducido =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="tablero" onclick={nueva}>
  {#each lista as t (t.id)}
    {@const anim = animaciones[t.id]}
    <article
      class="tarjeta"
      class:hecho={t.hecho}
      class:trazando={anim?.fase === 'trazo'}
      class:recien={anim?.fase === 'final'}
      class:por-borrar={porBorrar?.id === t.id}
      oncontextmenu={(e) => pedirBorrar(e, t)}
      out:scale={{ duration: reducido ? 0 : 180, start: 0.85, opacity: 0 }}
      animate:flip={{ duration: reducido ? 0 : 220 }}
    >
      {#if anim}
        <svg
          class="chispazo"
          class:final={anim.fase === 'final'}
          width={anim.w}
          height={anim.h}
          viewBox="0 0 {anim.w} {anim.h}"
          style="--trazo: {DURACION_TRAZO}ms"
          aria-hidden="true"
        >
          <defs>
            <filter id="resplandor-{t.id}" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <path class="rastro-halo" d={anim.d} pathLength="1" filter="url(#resplandor-{t.id})" />
          <path class="rastro" d={anim.d} pathLength="1" />
          <path class="chispa-halo" d={anim.d} pathLength="1" filter="url(#resplandor-{t.id})" />
          <path class="chispa" d={anim.d} pathLength="1" />
        </svg>
      {/if}
      <div class="cuerpo">
        {#if editando === t.id}
          {@render campo()}
        {:else}
          <button type="button" class="texto" onclick={() => editar(t)}>{t.texto}</button>
        {/if}
        {#if t.hecho && t.logrado}
          <span class="fecha logrado">✓ Logrado el {formatoFecha(t.logrado)}</span>
        {:else if !t.hecho}
          <span class="fecha">Creada el {formatoFecha(t.creado)}</span>
        {/if}
      </div>
      <button
        type="button"
        class="check"
        aria-pressed={t.hecho}
        aria-label={t.hecho ? 'Marcar como pendiente' : 'Marcar como completada'}
        onclick={(e) => alternar(t, e.currentTarget.closest('article'))}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" /></svg>
      </button>
    </article>
  {/each}

  {#if editando === 'nueva'}
    <article class="tarjeta nueva">
      <div class="cuerpo">{@render campo()}</div>
    </article>
  {/if}

  {#if lista.length === 0 && editando === null}
    <span class="aviso">Clic aquí para agregar una tarea</span>
  {/if}
</div>

<ConfirmarModal
  open={porBorrar !== null}
  titulo="¿Borrar esta tarea?"
  detalle={porBorrar ? `«${porBorrar.texto}». No se puede deshacer.` : ''}
  accion="Borrar tarea"
  onconfirmar={borrar}
  onclose={() => (porBorrar = null)}
/>

{#snippet campo()}
  <textarea
    use:enfocar
    bind:value={borrador}
    maxlength={TARJETA_MAX}
    rows="2"
    placeholder="Escribe la tarea…"
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
    position: relative;
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
  /* La tarjeta que se está por borrar (mientras la confirmación está abierta). */
  .tarjeta.por-borrar {
    border-color: #ffc9a8;
    box-shadow:
      0 0 0 1px rgba(255, 201, 168, 0.35),
      0 0 16px rgba(255, 201, 168, 0.45);
  }
  .tarjeta.nueva {
    border-style: dashed;
  }
  /* Lograda: el contorno se queda dorado. */
  .tarjeta.hecho {
    border-color: #f5c542;
    box-shadow:
      0 0 0 1px rgba(245, 197, 66, 0.12),
      0 0 14px rgba(245, 197, 66, 0.28),
      0 4px 14px rgba(0, 0, 0, 0.18);
  }

  /* Chispazo: SVG sobre el borde (de ahí el -1.5px, el grosor del borde). Con pathLength=1,
     1 equivale a todo el contorno. */
  .chispazo {
    position: absolute;
    left: -1.5px;
    top: -1.5px;
    overflow: visible;
    pointer-events: none;
    transition: opacity 0.6s ease 0.2s;
  }
  .chispazo.final {
    opacity: 0;
  }
  .chispazo path {
    fill: none;
    stroke-linecap: round;
  }
  /* El rastro dorado se va dibujando desde el arranque, sobre la paloma. */
  .rastro,
  .rastro-halo {
    stroke-dasharray: 1 1;
    stroke-dashoffset: 1;
    animation: dorar var(--trazo) cubic-bezier(0.6, 0, 0.35, 1) forwards;
  }
  .rastro {
    stroke: #f5c542;
    stroke-width: 2;
  }
  .rastro-halo {
    stroke: #ffd666;
    stroke-width: 6;
    opacity: 0.7;
  }
  /* La chispa es un trazo cortito que viaja en la punta del rastro, con el mismo timing,
     y titila. */
  .chispa {
    stroke: #fffbe8;
    stroke-width: 4;
    stroke-dasharray: 0.012 0.988;
    animation:
      viajar-chispa var(--trazo) cubic-bezier(0.6, 0, 0.35, 1) forwards,
      titilar 0.11s steps(2) infinite alternate;
  }
  .chispa-halo {
    stroke: #ffe08a;
    stroke-width: 14;
    stroke-dasharray: 0.04 0.96;
    animation:
      viajar-halo var(--trazo) cubic-bezier(0.6, 0, 0.35, 1) forwards,
      titilar 0.11s steps(2) infinite alternate;
  }
  @keyframes dorar {
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes viajar-chispa {
    from {
      stroke-dashoffset: 0.012;
    }
    to {
      stroke-dashoffset: -0.988;
    }
  }
  @keyframes viajar-halo {
    from {
      stroke-dashoffset: 0.04;
    }
    to {
      stroke-dashoffset: -0.96;
    }
  }
  @keyframes titilar {
    from {
      opacity: 1;
    }
    to {
      opacity: 0.65;
    }
  }

  /* Al cerrar la vuelta: destello de la tarjeta, rebote de la paloma y se dibuja la ✓. */
  .tarjeta.recien {
    animation: destello 0.9s ease-out;
  }
  @keyframes destello {
    from {
      box-shadow:
        0 0 0 2px rgba(255, 224, 138, 0.9),
        0 0 34px 6px rgba(255, 214, 102, 0.75),
        0 4px 14px rgba(0, 0, 0, 0.18);
    }
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
  .fecha {
    margin-top: 0.45rem;
    font-family: var(--bp-font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.5);
  }
  .fecha.logrado {
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
  /* Mientras la chispa da la vuelta, el círculo se pone dorado y gira. */
  .trazando .check {
    border: 1.5px dashed #f5c542;
    color: transparent;
    animation: girar 1s linear infinite;
  }
  .recien .check {
    animation: rebote 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .recien .check path {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: dorar 0.35s ease-out 0.12s forwards;
  }
  @keyframes girar {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes rebote {
    0% {
      transform: scale(0.3);
    }
    60% {
      transform: scale(1.25);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
