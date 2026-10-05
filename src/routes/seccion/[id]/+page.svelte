<script lang="ts">
  // Hoja de una sección creada con + Crear. Por ahora es una hoja en blanco con su rótulo.
  import Encabezado from '$lib/Encabezado.svelte';
  import Rotulo from '$lib/Rotulo.svelte';
  import { codigoHoja } from '$lib/secciones';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const codigo = $derived(codigoHoja(data.seccion.id));
  const fecha = $derived(
    data.seccion.creado
      .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase()
  );
</script>

<svelte:head>
  <title>{data.seccion.nombre} · blueprints</title>
</svelte:head>

<div class="sheet">
  <Encabezado
    etiqueta="Plano {codigo} · Sección"
    titulo={data.seccion.nombre}
    bajada="Hoja en blanco: aquí va lo que planees para esta sección."
    cota="Hoja {codigo}"
  />

  <div class="lienzo">
    <span>Área de dibujo</span>
  </div>

  <footer class="sheet-foot">
    <Rotulo proyecto={data.seccion.nombre} plano={data.seccion.nombre} hoja={codigo} {fecha} />
  </footer>
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

  /* Área vacía de la hoja, delimitada como zona de dibujo. */
  .lienzo {
    flex: 1;
    min-height: 14rem;
    display: grid;
    place-items: center;
    border: 1px dashed rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.02);
  }
  .lienzo span {
    font-family: var(--bp-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
  }

  .sheet-foot {
    display: flex;
    justify-content: flex-end;
  }
</style>
