<script lang="ts">
  // Menú contextual con estilo de plano (clic derecho). Se pinta en el top layer con la API de
  // popover: así no lo recorta ni lo desplaza el panel principal (que tiene overflow: hidden y
  // backdrop-filter). Se cierra con Escape, clic fuera, scroll o al cambiar la ventana; el clic
  // que lo cierra no llega a la página, como en un menú nativo.
  import { onMount } from 'svelte';

  type Opcion = {
    etiqueta: string;
    icono?: 'basura' | 'info' | 'voltear';
    /** Acción destructiva: va en naranja y separada de las anteriores por una línea. */
    peligro?: boolean;
    accion: () => void;
  };
  let {
    x,
    y,
    opciones,
    oncerrar
  }: { x: number; y: number; opciones: Opcion[]; oncerrar: () => void } = $props();

  let menu: HTMLDivElement;

  onMount(() => {
    menu.showPopover?.();

    // Si no cabe a la derecha o abajo del cursor, se abre hacia el otro lado. Se mide con
    // offsetWidth/Height (tamaño real): getBoundingClientRect incluiría la escala de la
    // animación de entrada y lo daría más chico.
    const ancho = menu.offsetWidth;
    const alto = menu.offsetHeight;
    const margen = 8;
    const izquierda = x + ancho > innerWidth - margen ? Math.max(margen, x - ancho) : x;
    const arriba = y + alto > innerHeight - margen ? Math.max(margen, y - alto) : y;
    menu.style.left = `${izquierda}px`;
    menu.style.top = `${arriba}px`;
    menu.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();

    const fuera = (e: PointerEvent) => {
      if (menu.contains(e.target as Node)) return;
      oncerrar();
      if (e.button === 0) tragarClic();
    };
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        oncerrar();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        // Flechas: recorren las opciones en círculo.
        e.preventDefault();
        const items = [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
        const i = items.indexOf(document.activeElement as HTMLButtonElement);
        const paso = e.key === 'ArrowDown' ? 1 : -1;
        items[(i + paso + items.length) % items.length]?.focus();
      }
    };
    const cerrar = () => oncerrar();
    document.addEventListener('pointerdown', fuera, true);
    document.addEventListener('keydown', teclas, true);
    document.addEventListener('scroll', cerrar, true);
    window.addEventListener('resize', cerrar);
    window.addEventListener('blur', cerrar);
    return () => {
      document.removeEventListener('pointerdown', fuera, true);
      document.removeEventListener('keydown', teclas, true);
      document.removeEventListener('scroll', cerrar, true);
      window.removeEventListener('resize', cerrar);
      window.removeEventListener('blur', cerrar);
    };
  });

  // Se come el clic que sigue al pointerdown que cerró el menú.
  function tragarClic() {
    const tragar = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };
    document.addEventListener('click', tragar, { capture: true, once: true });
    setTimeout(() => document.removeEventListener('click', tragar, true), 400);
  }

  // Primero la acción y luego cerrar: la acción todavía ve el estado del menú abierto.
  function elegir(o: Opcion) {
    o.accion();
    oncerrar();
  }
</script>

<div bind:this={menu} popover="manual" class="menu" role="menu" style="left: {x}px; top: {y}px;">
  {#each opciones as o, i (o.etiqueta)}
    {#if o.peligro && i > 0}
      <div class="separador" role="separator"></div>
    {/if}
    <button type="button" role="menuitem" class="item" class:peligro={o.peligro} onclick={() => elegir(o)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        {#if o.icono === 'basura'}
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M10 11v6M14 11v6" />
        {:else if o.icono === 'info'}
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-4.5M12 8h.01" />
        {:else if o.icono === 'voltear'}
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        {/if}
      </svg>
      {o.etiqueta}
    </button>
  {/each}
</div>

<style>
  /* Anula los estilos de navegador de [popover] (centrado, borde, fondo Canvas). */
  .menu {
    position: fixed;
    inset: auto;
    margin: 0;
    min-width: 9.5rem;
    padding: 0.3rem;
    overflow: visible;
    color: #fff;
    background: linear-gradient(135deg, rgba(25, 70, 160, 0.97), rgba(9, 36, 94, 0.97));
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow:
      0 0 18px rgba(255, 255, 255, 0.1),
      0 12px 30px rgba(0, 0, 0, 0.45);
    transform-origin: top left;
    animation: abrir 0.12s ease-out;
  }
  @keyframes abrir {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
  }
  .separador {
    margin: 0.25rem 0.4rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.35);
  }
  .item {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    padding: 0.45rem 0.7rem;
    font-family: var(--bp-font-hand);
    font-size: 1.02rem;
    letter-spacing: 0.02em;
    text-align: left;
    color: #fff;
    background: transparent;
    border: 0;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;
  }
  .item:hover,
  .item:focus-visible {
    background: rgba(255, 255, 255, 0.1);
    outline: none;
  }
  /* Acción destructiva: el naranja de los errores y de la confirmación de borrar. */
  .item.peligro:hover,
  .item.peligro:focus-visible {
    color: #ffc9a8;
    background: rgba(255, 201, 168, 0.16);
  }
</style>
