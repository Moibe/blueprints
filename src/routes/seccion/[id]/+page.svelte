<script lang="ts">
  // Hoja de una sección creada con + Crear: encabezado, rótulo y tablero de tarjetas.
  import Encabezado from '$lib/Encabezado.svelte';
  import Rotulo from '$lib/Rotulo.svelte';
  import Tablero from '$lib/Tablero.svelte';
  import { codigoHoja } from '$lib/secciones';
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

  // Guarda el objetivo editado en el rótulo; regresa el valor ya limpio que guardó el servidor.
  async function guardarObjetivo(objetivo: string) {
    const res = await fetch(`/api/secciones/${data.seccion.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ objetivo })
    });
    const body: { error?: string; seccion?: { objetivo: string | null } } = await res
      .json()
      .catch(() => ({}));
    if (!res.ok || !body.seccion) throw new Error(body.error ?? 'No se pudo guardar.');
    return body.seccion.objetivo ?? '';
  }
</script>

<svelte:head>
  <title>{data.seccion.nombre} · blueprints</title>
</svelte:head>

<div class="sheet">
  <!-- Encabezado a la izquierda y cuadro de rotulación arriba a la derecha. -->
  <div class="sheet-top">
    <Encabezado
      etiqueta="Plano {codigo} · Sección"
      titulo={data.seccion.nombre}
      {bajada}
      cota="Hoja {codigo}"
    />

    <!-- key: al pasar de una sección a otra se reinicia el rótulo (sin edición a medias). -->
    {#key data.seccion.id}
      <Rotulo
        proyecto={data.seccion.nombre}
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
