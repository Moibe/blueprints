<script lang="ts">
  // Barra superior de plano: vidrio translúcido con marco punteado, tilt 3D al pasar el
  // mouse y responsive (en móvil colapsa a solo-íconos). Items de ejemplo: reemplázalos.
  import { page } from '$app/state';

  let tiltX = $state(0);
  let tiltY = $state(0);

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

  // Edita estos items por las secciones reales de tu app.
  const items = [
    { href: '/', label: 'Inicio' },
    { href: '/seccion-dos', label: 'Sección dos' },
    { href: '/seccion-tres', label: 'Sección tres' }
  ];
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
  class="topnav"
  style="transform: perspective(900px) rotateX({tiltX}deg) rotateY({tiltY}deg);"
  onmousemove={handleMove}
  onmouseleave={handleLeave}
>
  <a href="/" class="brand" aria-label="Inicio">
    <!-- Escuadra de dibujo -->
    <svg class="brand-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 21V3l18 18Z" />
      <path d="M7 17v-5.5l5.5 5.5Z" />
      <path d="M3 7h2M3 11h1.5M3 15h2M7 21v-2M11 21v-1.5M15 21v-2" stroke-width="1.2" />
    </svg>
    <span class="brand-title">blueprints</span>
  </a>

  <nav class="topnav-nav">
    {#each items as it (it.href)}
      <a href={it.href} class="nav-item" aria-current={page.url.pathname === it.href ? 'page' : undefined}>
        <span class="nav-ico" aria-hidden="true"></span>
        <span class="nav-label">{it.label}</span>
      </a>
    {/each}
  </nav>

  <span class="sheet-ref" aria-hidden="true">ESC 1:50 · HOJA 01</span>
</header>

<style>
  .topnav {
    position: fixed;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    height: var(--topnav-height, 64px);
    padding: 0 1.25rem;
    box-sizing: border-box;
    display: flex;
    align-items: center;
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
    z-index: 9;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: #fff;
    text-decoration: none;
    border-radius: 6px;
    padding: 0.25rem 0.45rem;
    transition: background 0.18s ease;
  }
  .brand:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  .brand-ico {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.35));
  }
  .brand-title {
    font-family: var(--bp-font-hand);
    font-size: 1.5rem;
    line-height: 1;
    letter-spacing: 0.03em;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }

  .topnav-nav {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-left: 1.25rem;
    padding-left: 1.25rem;
    border-left: 1px dashed rgba(255, 255, 255, 0.35);
  }

  .nav-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    color: rgba(255, 255, 255, 0.86);
    text-decoration: none;
    font-family: var(--bp-font-hand);
    font-size: 1.02rem;
    letter-spacing: 0.02em;
    border-radius: 6px;
    border: 1px solid transparent;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
    white-space: nowrap;
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

  /* Marca de centro (círculo con cruz), el "ícono" placeholder de plano. */
  .nav-ico {
    position: relative;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    opacity: 0.8;
  }
  .nav-ico::before,
  .nav-ico::after {
    content: '';
    position: absolute;
    background: currentColor;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .nav-ico::before {
    width: 18px;
    height: 1px;
  }
  .nav-ico::after {
    width: 1px;
    height: 18px;
  }
  .nav-item[aria-current='page'] .nav-ico {
    opacity: 1;
    background: radial-gradient(circle, currentColor 0 2px, transparent 2.5px);
  }

  .sheet-ref {
    margin-left: auto;
    font-family: var(--bp-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
  }

  /* En pantallas chicas: solo íconos (oculta texto y título) para que no se desborde. */
  @media (max-width: 680px) {
    .topnav {
      padding: 0 0.6rem;
    }
    .brand {
      gap: 0;
      padding: 0.25rem;
    }
    .brand-title,
    .sheet-ref {
      display: none;
    }
    .topnav-nav {
      margin-left: 0.5rem;
      padding-left: 0.5rem;
      gap: 0.1rem;
    }
    .nav-item {
      padding: 0.45rem 0.6rem;
    }
    .nav-label {
      display: none;
    }
  }
  @media (max-width: 360px) {
    .topnav {
      padding: 0 0.4rem;
    }
    .topnav-nav {
      margin-left: 0.35rem;
      padding-left: 0.35rem;
    }
    .nav-item {
      padding: 0.45rem 0.45rem;
    }
  }
</style>
