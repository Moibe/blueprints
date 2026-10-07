<script lang="ts">
  // Hoja de una sección (proyecto): encabezado, rótulo, pila de objetivos y el tablero de
  // tareas del objetivo activo.
  import Encabezado from '$lib/Encabezado.svelte';
  import Rotulo from '$lib/Rotulo.svelte';
  import PilaObjetivos from '$lib/PilaObjetivos.svelte';
  import Tablero from '$lib/Tablero.svelte';
  import ConfirmarModal from '$lib/ConfirmarModal.svelte';
  import { invalidateAll } from '$app/navigation';
  import { NOMBRE_MAX, codigoHoja } from '$lib/secciones';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const codigo = $derived(codigoHoja(data.seccion.id));
  const fecha = $derived(
    data.seccion.creado
      .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase()
  );

  // Copia local de los objetivos (con sus tareas) para reflejar cambios sin recargar. Las fechas
  // llegan como Date desde el load y como string ISO desde los endpoints (JSON).
  type Tarjeta = { id: number; texto: string; hecho: boolean; logrado: Date | string | null; creado: Date | string };
  type Objetivo = { id: number; nombre: string; tarjetas: Tarjeta[] };
  let objetivos = $derived<Objetivo[]>(data.objetivos);
  let activo = $state<number | null>(null);
  // Al entrar a otra sección, o si el activo desapareció, se activa el primero.
  $effect(() => {
    if (activo === null || !objetivos.some((o) => o.id === activo)) activo = objetivos[0]?.id ?? null;
  });
  const objetivoActivo = $derived(objetivos.find((o) => o.id === activo) ?? null);

  const total = $derived(objetivos.reduce((n, o) => n + o.tarjetas.length, 0));
  const logradas = $derived(objetivos.reduce((n, o) => n + o.tarjetas.filter((t) => t.hecho).length, 0));
  // Los totales viven en el rótulo; bajo el título solo queda el aviso de hoja vacía.
  const bajada = $derived(
    objetivos.length === 0 ? 'Hoja en blanco: crea el primer objetivo de este proyecto.' : ''
  );

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

  // El nombre aparece en el título, el rótulo, el sidebar y la pestaña: se recarga todo.
  async function renombrar(nombre: string) {
    const { seccion } = await api(`/api/secciones/${data.seccion.id}`, 'PATCH', { nombre });
    await invalidateAll();
    return seccion.nombre as string;
  }
  const editable = { max: NOMBRE_MAX, onguardar: renombrar };

  async function crearObjetivo(nombre: string) {
    const { objetivo } = await api(`/api/secciones/${data.seccion.id}/objetivos`, 'POST', { nombre });
    objetivos = [...objetivos, objetivo];
    activo = objetivo.id;
  }
  async function renombrarObjetivo(id: number, nombre: string) {
    const { objetivo } = await api(`/api/objetivos/${id}`, 'PATCH', { nombre });
    objetivos = objetivos.map((o) => (o.id === id ? { ...o, nombre: objetivo.nombre } : o));
    return objetivo.nombre as string;
  }

  let porBorrar = $state<{ id: number; nombre: string; tareas: number } | null>(null);
  function pedirBorrar(id: number) {
    const o = objetivos.find((x) => x.id === id);
    if (o) porBorrar = { id, nombre: o.nombre, tareas: o.tarjetas.length };
  }
  async function borrarObjetivo() {
    if (!porBorrar) return;
    const id = porBorrar.id;
    await api(`/api/objetivos/${id}`, 'DELETE');
    // En la pila se queda en el vecino (el que ocupa su lugar, o el anterior si era el último).
    const i = objetivos.findIndex((o) => o.id === id);
    objetivos = objetivos.filter((o) => o.id !== id);
    activo = objetivos[Math.min(i, objetivos.length - 1)]?.id ?? null;
  }

  function tareasCambiaron(id: number, tarjetas: Tarjeta[]) {
    if (objetivos.find((o) => o.id === id)?.tarjetas === tarjetas) return;
    objetivos = objetivos.map((o) => (o.id === id ? { ...o, tarjetas } : o));
  }
</script>

<svelte:head>
  <title>{data.seccion.nombre} · blueprints</title>
</svelte:head>

<div class="sheet">
  <!-- key: al pasar de una sección a otra se reinician (sin ediciones a medias). -->
  <div class="sheet-top">
    {#key data.seccion.id}
      <Encabezado
        etiqueta="Proyecto {codigo}"
        titulo={data.seccion.nombre}
        {bajada}
        cota="Hoja {codigo}"
        {editable}
      />

      <Rotulo
        proyecto={data.seccion.nombre}
        renombrar={editable}
        etiquetaPlano="Objetivo actual"
        plano={objetivoActivo?.nombre ?? '—'}
        destello={objetivoActivo?.id}
        avance={{ objetivos: objetivos.length, tareas: total, logradas }}
        {fecha}
      />
    {/key}
  </div>

  <div class="trabajo">
    <PilaObjetivos
      objetivos={objetivos.map((o) => ({
        id: o.id,
        nombre: o.nombre,
        total: o.tarjetas.length,
        logradas: o.tarjetas.filter((t) => t.hecho).length
      }))}
      {activo}
      onactivar={(id) => (activo = id)}
      oncrear={crearObjetivo}
      onrenombrar={renombrarObjetivo}
      onborrar={pedirBorrar}
    />

    {#if objetivoActivo}
      {#key objetivoActivo.id}
        <Tablero
          objetivoId={objetivoActivo.id}
          objetivo={objetivoActivo.nombre}
          tarjetas={objetivoActivo.tarjetas}
          oncambio={(t) => tareasCambiaron(objetivoActivo.id, t)}
        />
      {/key}
    {:else}
      <div class="sin-objetivos">
        <span>Sin objetivos todavía · usa <strong>+</strong> para crear el primero</span>
      </div>
    {/if}
  </div>
</div>

<!-- Un objetivo con tareas no se borra: en su lugar sale un aviso, sin botón de borrar. -->
<ConfirmarModal
  open={porBorrar !== null}
  titulo={porBorrar?.tareas ? `«${porBorrar.nombre}» tiene tareas` : `¿Borrar «${porBorrar?.nombre ?? ''}»?`}
  detalle={porBorrar?.tareas
    ? `No se puede borrar un objetivo con tareas (tiene ${porBorrar.tareas}). Borra primero sus tareas.`
    : 'Este objetivo no tiene tareas. No se puede deshacer.'}
  accion="Borrar objetivo"
  onconfirmar={porBorrar?.tareas ? undefined : borrarObjetivo}
  onclose={() => (porBorrar = null)}
/>

<style>
  .sheet {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 0.5rem 0 0.25rem;
    box-sizing: border-box;
  }

  /* Si no cabe al lado (pantallas angostas), el rótulo baja debajo del encabezado. */
  .sheet-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .trabajo {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .sin-objetivos {
    flex: 1;
    min-height: 14rem;
    display: grid;
    place-items: center;
    border: 1px dashed rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
    font-family: var(--bp-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
  }
  .sin-objetivos strong {
    font-weight: 400;
    color: rgba(255, 255, 255, 0.8);
  }
</style>
