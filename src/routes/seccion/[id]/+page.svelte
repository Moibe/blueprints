<script lang="ts">
  // Hoja de una sección creada con + Crear: encabezado, rótulo y tablero de tarjetas.
  import Encabezado from '$lib/Encabezado.svelte';
  import Rotulo from '$lib/Rotulo.svelte';
  import Tablero from '$lib/Tablero.svelte';
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

  // Resumen bajo el título: "Hoja en blanco…" si no hay tarjetas, si no "3 tarjetas · 1 lograda".
  // Arranca con lo que trajo el load y se actualiza en vivo con lo que reporta el tablero.
  let total = $derived(data.tarjetas.length);
  let logradas = $derived(data.tarjetas.filter((t) => t.hecho).length);
  const bajada = $derived(
    total === 0
      ? 'Hoja en blanco: aquí va lo que planees para esta sección.'
      : `${total} ${total === 1 ? 'tarjeta' : 'tarjetas'} · ${logradas} ${logradas === 1 ? 'lograda' : 'logradas'}`
  );

  // PATCH a la sección; regresa la sección guardada o lanza un Error con el mensaje del servidor.
  async function actualizar(cambios: { nombre?: string; objetivo?: string }) {
    const res = await fetch(`/api/secciones/${data.seccion.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cambios)
    });
    const body: { error?: string; seccion?: { nombre: string; objetivo: string | null } } = await res
      .json()
      .catch(() => ({}));
    if (!res.ok || !body.seccion) throw new Error(body.error ?? 'No se pudo guardar.');
    return body.seccion;
  }

  async function guardarObjetivo(objetivo: string) {
    return (await actualizar({ objetivo })).objetivo ?? '';
  }

  // El nombre aparece en el título, el rótulo, el sidebar y la pestaña: se recarga todo.
  async function renombrar(nombre: string) {
    const seccion = await actualizar({ nombre });
    await invalidateAll();
    return seccion.nombre;
  }
  const editable = { max: NOMBRE_MAX, onguardar: renombrar };
</script>

<svelte:head>
  <title>{data.seccion.nombre} · blueprints</title>
</svelte:head>

<div class="sheet">
  <!-- Encabezado a la izquierda y cuadro de rotulación arriba a la derecha. -->
  <!-- key: al pasar de una sección a otra se reinician (sin ediciones a medias). -->
  <div class="sheet-top">
    {#key data.seccion.id}
      <Encabezado
        etiqueta="Plano {codigo} · Sección"
        titulo={data.seccion.nombre}
        {bajada}
        cota="Hoja {codigo}"
        {editable}
      />

      <Rotulo
        proyecto={data.seccion.nombre}
        renombrar={editable}
        objetivo={{ valor: data.seccion.objetivo, onguardar: guardarObjetivo }}
        hoja={codigo}
        {fecha}
      />
    {/key}
  </div>

  {#key data.seccion.id}
    <Tablero
      seccionId={data.seccion.id}
      tarjetas={data.tarjetas}
      oncambio={(t, l) => {
        total = t;
        logradas = l;
      }}
    />
  {/key}
</div>

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
</style>
