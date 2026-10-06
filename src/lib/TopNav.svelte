<script lang="ts">
  // Barra superior de plano: vidrio translúcido con marco punteado, tilt 3D al pasar el
  // mouse. La marca lleva a la home; en móvil queda solo la escuadra.
  let { conSesion = false }: { conSesion?: boolean } = $props();
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

  <span class="sheet-ref" aria-hidden="true">ESC 1:50 · HOJA 01</span>

  {#if conSesion}
    <form method="POST" action="/logout" class="salir">
      <button type="submit">Salir</button>
    </form>
  {/if}
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

  .sheet-ref {
    margin-left: auto;
    font-family: var(--bp-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
  }

  .salir {
    margin: 0 0 0 1.25rem;
  }
  .salir button {
    font-family: var(--bp-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
    background: transparent;
    border: 1px solid var(--bp-line-soft);
    border-radius: 6px;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
    transition:
      background 0.18s ease,
      color 0.18s ease;
  }
  .salir button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  /* En pantallas chicas: solo la escuadra. */
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
  }
  @media (max-width: 360px) {
    .topnav {
      padding: 0 0.4rem;
    }
  }
</style>
