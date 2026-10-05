<script lang="ts">
  // Barra lateral de plano con el mismo tilt 3D que la superior. Incluye el handle
  // para replegar/mostrar. Publica su ancho real a la variable CSS --sidebar-width
  // para que el panel de contenido se ajuste solo. Lista las secciones creadas con + Crear.
  import { fly } from 'svelte/transition';
  import { page } from '$app/state';
  import { codigoHoja } from '$lib/secciones';

  let {
    collapsed = false,
    toggleCollapsed,
    secciones,
    oncrear
  }: {
    collapsed?: boolean;
    toggleCollapsed: () => void;
    secciones: { id: number; nombre: string }[];
    oncrear: () => void;
  } = $props();

  let tiltX = $state(0);
  let tiltY = $state(0);
  let sidebarWidth = $state(240);

  // Cada sección es una hoja del plano: /seccion/<id>, con su clave A-01, A-02…
  const items = $derived(
    secciones.map((s) => ({ href: `/seccion/${s.id}`, label: s.nombre, code: codigoHoja(s.id) }))
  );

  $effect(() => {
    if (typeof document !== 'undefined' && !collapsed) {
      document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    }
  });

  function handleMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const MAX = 1.2;
    tiltX = -ny * MAX;
    tiltY = nx * MAX;
  }
  function handleLeave() {
    tiltX = 0;
    tiltY = 0;
  }
  function handleCollapseClick(e: MouseEvent) {
    e.stopPropagation();
    tiltX = 0;
    tiltY = 0;
    toggleCollapsed();
  }
</script>

{#if !collapsed}
  <aside
    class="sidebar"
    style="transform: perspective(900px) rotateX({tiltX}deg) rotateY({tiltY}deg);"
    bind:clientWidth={sidebarWidth}
    onmousemove={handleMove}
    onmouseleave={handleLeave}
  >
    <button type="button" class="create-btn" onclick={oncrear}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      <span>Crear</span>
    </button>

    <p class="sidebar-label">Índice de planos</p>

    <nav>
      {#each items as it (it.href)}
        <a
          href={it.href}
          class="nav-item"
          aria-current={page.url.pathname === it.href ? 'page' : undefined}
          in:fly={{ x: -10, duration: 220 }}
        >
          <!-- Plano: hoja con la esquina doblada, un rectángulo y su cota (línea de medida con topes). -->
          <svg class="nav-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path class="hoja" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path class="planta" d="M8.5 13.5h7v4.5h-7z" />
            <path class="cota" d="M8.5 10.3v1.6M15.5 10.3v1.6M8.5 11.1h7" />
          </svg>
          <span class="nav-label">{it.label}</span>
          <span class="nav-code">{it.code}</span>
        </a>
      {:else}
        <p class="vacio">Aún no hay secciones.<br />Crea la primera con <strong>+ Crear</strong>.</p>
      {/each}
    </nav>

    <div class="sidebar-footer">
      <button type="button" class="collapse-btn" onclick={handleCollapseClick} aria-label="Replegar barra">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
    </div>
  </aside>
{:else}
  <button type="button" class="reveal-handle" onclick={toggleCollapsed} aria-label="Mostrar barra">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
  </button>
{/if}

<style>
  .sidebar {
    position: fixed;
    top: calc(2rem + var(--topnav-height, 64px));
    left: 1rem;
    bottom: 1rem;
    box-sizing: border-box;
    width: max-content;
    min-width: 240px;
    max-width: 380px;
    padding: 1.4rem 1rem 1.1rem;
    display: flex;
    flex-direction: column;
    background: rgba(7, 31, 79, 0.22);
    backdrop-filter: blur(3px) saturate(110%);
    -webkit-backdrop-filter: blur(3px) saturate(110%);
    border: 1.5px solid var(--bp-line, #fff);
    border-radius: var(--bp-radius, 10px);
    outline: 1px dashed var(--bp-line-soft, rgba(255, 255, 255, 0.35));
    outline-offset: -6px;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.04),
      0 0 18px rgba(255, 255, 255, 0.06),
      0 6px 20px rgba(0, 0, 0, 0.18);
    transition: transform 0.18s ease-out;
    will-change: transform;
    user-select: none;
  }

  /* Móvil: flota encima del panel de contenido, con fondo casi opaco para que se lea. */
  @media (max-width: 680px) {
    .sidebar {
      z-index: 8;
      background: rgba(7, 31, 79, 0.92);
    }
  }

  /* Acción principal: tinta blanca invertida (relleno blanco, texto azul) con marco punteado interior. */
  .create-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    margin: 0 0 1.1rem;
    padding: 0.6rem 1rem;
    font-family: var(--bp-font-hand);
    font-size: 1.15rem;
    letter-spacing: 0.04em;
    color: var(--bp-b, #0b2e6f);
    background: rgba(255, 255, 255, 0.92);
    border: 1.5px solid #fff;
    border-radius: 6px;
    outline: 1px dashed rgba(11, 46, 111, 0.4);
    outline-offset: -5px;
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.18);
    cursor: pointer;
    transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  }
  .create-btn:hover {
    background: #fff;
    box-shadow: 0 0 18px rgba(255, 255, 255, 0.4);
    transform: translateY(-1px);
  }
  .create-btn:active {
    transform: translateY(0);
  }
  .create-btn:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 3px;
  }

  .sidebar-label {
    margin: 0 0 0.9rem;
    padding: 0 0.4rem 0.55rem;
    font-family: var(--bp-font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
    border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  nav::-webkit-scrollbar {
    display: none;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.6rem 0.85rem;
    color: rgba(255, 255, 255, 0.88);
    text-decoration: none;
    font-family: var(--bp-font-hand);
    font-size: 1.05rem;
    letter-spacing: 0.02em;
    border-radius: 6px;
    border: 1px solid transparent;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  }
  .nav-item:hover {
    color: #fff;
    border: 1px dashed rgba(255, 255, 255, 0.55);
    background: rgba(255, 255, 255, 0.05);
  }
  .nav-item[aria-current='page'] {
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.85);
  }
  /* Nombres largos: el sidebar crece hasta su max-width y luego se cortan con "…". */
  .nav-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vacio {
    margin: 0.2rem 0 0;
    padding: 0.9rem 0.8rem;
    font-family: var(--bp-font-hand);
    font-size: 0.98rem;
    line-height: 1.45;
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    border: 1px dashed rgba(255, 255, 255, 0.3);
    border-radius: 6px;
  }
  .vacio strong {
    font-weight: 400;
    color: #fff;
  }
  .nav-code {
    font-family: var(--bp-font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.5);
  }
  .nav-item[aria-current='page'] .nav-code {
    color: rgba(255, 255, 255, 0.85);
  }

  /* Icono de plano. En la sección activa la hoja se rellena un poco. */
  .nav-ico {
    flex-shrink: 0;
    opacity: 0.8;
    transition: opacity 0.18s ease;
  }
  .nav-ico .planta {
    stroke-width: 1.3;
  }
  .nav-ico .cota {
    stroke-width: 1;
  }
  .nav-ico .hoja {
    transition: fill 0.18s ease;
  }
  .nav-item:hover .nav-ico {
    opacity: 1;
  }
  .nav-item[aria-current='page'] .nav-ico {
    opacity: 1;
  }
  .nav-item[aria-current='page'] .nav-ico .hoja {
    fill: rgba(255, 255, 255, 0.18);
  }

  .sidebar-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.3);
  }
  .collapse-btn,
  .reveal-handle {
    background: rgba(255, 255, 255, 0.04);
    border: 1px dashed rgba(255, 255, 255, 0.5);
    border-radius: 6px;
    padding: 0.4rem 0.5rem;
    color: rgba(255, 255, 255, 0.88);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: inherit;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  }
  .collapse-btn:hover,
  .reveal-handle:hover {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.85);
    color: #fff;
  }
  .reveal-handle {
    position: fixed;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.55rem 0.45rem;
    border-radius: 8px;
    border: 1.5px solid var(--bp-line, #fff);
    background: rgba(7, 31, 79, 0.35);
    backdrop-filter: blur(3px) saturate(110%);
    -webkit-backdrop-filter: blur(3px) saturate(110%);
    box-shadow:
      0 0 18px rgba(255, 255, 255, 0.06),
      0 6px 20px rgba(0, 0, 0, 0.18);
    z-index: 10;
  }
</style>
