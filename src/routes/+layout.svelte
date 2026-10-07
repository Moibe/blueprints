<script lang="ts">
  // Tailwind v4 + tokens de shadcn. El fondo de plano de :global(body) de abajo GANA:
  // los estilos :global de Svelte van sin @layer, así que pisan el @layer base de Tailwind.
  import '../app.css';
  import { onMount } from 'svelte';
  import { afterNavigate, goto, invalidate } from '$app/navigation';
  import { page } from '$app/state';
  import TopNav from '$lib/TopNav.svelte';
  import Sidebar from '$lib/Sidebar.svelte';
  import CrearSeccionModal from '$lib/CrearSeccionModal.svelte';
  import type { LayoutProps } from './$types';

  let { children, data }: LayoutProps = $props();
  let collapsed = $state(false);

  // + Crear: al crear una sección, refresca la lista del sidebar y abre su hoja.
  let crearAbierto = $state(false);
  async function seccionCreada(id: number) {
    await invalidate('app:secciones');
    await goto(`/seccion/${id}`);
  }

  // En móvil el sidebar flota encima del contenido (ver @media abajo): arranca replegado
  // y se vuelve a replegar al navegar para no tapar la página.
  const isNarrow = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 680px)').matches;
  onMount(() => {
    if (isNarrow()) collapsed = true;
  });
  afterNavigate(({ from }) => {
    if (from && isNarrow()) collapsed = true;
  });

  // View Transitions cuando el browser las soporta para animar el repliegue.
  function withTransition(fn: () => void) {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(fn);
    } else {
      fn();
    }
  }
  function toggleCollapsed() {
    withTransition(() => {
      collapsed = !collapsed;
    });
  }
</script>

{#if page.url.pathname === '/login'}
  <!-- Login: solo el fondo de plano, sin barra ni sidebar. -->
  {@render children()}
{:else}
  <TopNav conSesion={data.conSesion} />
  <Sidebar {collapsed} {toggleCollapsed} secciones={data.secciones} oncrear={() => (crearAbierto = true)} />
  <main class={collapsed ? 'collapsed' : ''}>
    <div class="work-scroll">
      {@render children()}
    </div>
  </main>
  <CrearSeccionModal bind:open={crearAbierto} oncreada={seccionCreada} />
{/if}

<style>
  :global(:root) {
    --topnav-height: 64px;

    /* Paleta de plano (cianotipo). */
    --bp-a: #2160c4;
    --bp-b: #0b2e6f;
    --bp-deep: #071f4f;
    --bp-ink: rgba(255, 255, 255, 0.95);
    --bp-line: rgba(255, 255, 255, 0.9);
    --bp-line-soft: rgba(255, 255, 255, 0.35);
    --bp-grid-minor: rgba(255, 255, 255, 0.07);
    --bp-grid-major: rgba(255, 255, 255, 0.16);

    /* Rotulado a mano (los planes del Coyote) + cotas técnicas. */
    --bp-font-hand: 'Architects Daughter', 'Segoe Print', cursive;
    --bp-font-mono: 'JetBrains Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace;

    --bp-radius: 10px;
  }

  :global(html, body) {
    margin: 0;
    padding: 0;
    height: 100%;
  }
  :global(body) {
    min-height: 100vh;
    /* De arriba hacia abajo: textura de papel, manchas de revelado, cuadrícula mayor,
       cuadrícula menor, viñeta y el gradiente de cianotipo. */
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .07 0 0 0 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='900'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.004' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .09 0 0 0 -.02'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E"),
      linear-gradient(var(--bp-grid-major) 1px, transparent 1px) -1px -1px / 120px 120px,
      linear-gradient(90deg, var(--bp-grid-major) 1px, transparent 1px) -1px -1px / 120px 120px,
      linear-gradient(var(--bp-grid-minor) 1px, transparent 1px) -1px -1px / 24px 24px,
      linear-gradient(90deg, var(--bp-grid-minor) 1px, transparent 1px) -1px -1px / 24px 24px,
      radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(3, 14, 42, 0.5) 100%),
      linear-gradient(135deg, var(--bp-a) 0%, var(--bp-b) 100%);
    background-color: var(--bp-b);
    background-attachment: fixed;
    color: var(--bp-ink);
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }

  :global(::selection) {
    background: rgba(255, 255, 255, 0.9);
    color: var(--bp-b);
  }

  :global(*) {
    scrollbar-width: auto;
    scrollbar-color: rgba(255, 255, 255, 0.5) rgba(255, 255, 255, 0.08);
  }
  :global(::-webkit-scrollbar) {
    width: 14px;
    height: 14px;
  }
  :global(::-webkit-scrollbar-track) {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 999px;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: rgba(255, 255, 255, 0.5);
    border-radius: 999px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  :global(::-webkit-scrollbar-thumb:hover) {
    background: rgba(255, 255, 255, 0.75);
    background-clip: padding-box;
  }

  main {
    position: fixed;
    top: calc(2rem + var(--topnav-height));
    right: 1rem;
    bottom: 1rem;
    box-sizing: border-box;
    background: rgba(7, 31, 79, 0.22);
    backdrop-filter: blur(3px) saturate(110%);
    -webkit-backdrop-filter: blur(3px) saturate(110%);
    border: 1.5px solid var(--bp-line);
    border-radius: var(--bp-radius);
    outline: 1px dashed var(--bp-line-soft);
    outline-offset: -14px;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.04),
      0 0 18px rgba(255, 255, 255, 0.06),
      0 6px 20px rgba(0, 0, 0, 0.18);
    overflow: hidden;
    transition: left 0.22s ease-out;
    left: calc(var(--sidebar-width, 240px) + 2rem);
  }
  main.collapsed {
    left: 2rem;
  }
  /* Móvil: el panel usa todo el ancho y el sidebar (z-index en Sidebar.svelte) flota encima. */
  @media (max-width: 680px) {
    main,
    main.collapsed {
      left: 1rem;
    }
    .work-scroll {
      padding: 0 18px 0 22px;
    }
  }

  /* Reglas de cota en los bordes superior e izquierdo del panel (mayor cada 60px, menor cada 12px). */
  main::before,
  main::after {
    content: '';
    position: absolute;
    pointer-events: none;
    z-index: 1;
  }
  main::before {
    top: 0;
    left: 0;
    right: 0;
    height: 9px;
    background:
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0 1px, transparent 1px 60px) 0 0 / 100% 9px no-repeat,
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.35) 0 1px, transparent 1px 12px) 0 0 / 100% 5px no-repeat;
  }
  main::after {
    top: 0;
    left: 0;
    bottom: 0;
    width: 9px;
    background:
      repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0 1px, transparent 1px 60px) 0 0 / 9px 100% no-repeat,
      repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0 1px, transparent 1px 12px) 0 0 / 5px 100% no-repeat;
  }

  .work-scroll {
    position: absolute;
    top: 22px;
    bottom: 22px;
    left: 0;
    right: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 28px;
  }
</style>
