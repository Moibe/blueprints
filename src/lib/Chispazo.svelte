<script lang="ts">
  // Chispa dorada que recorre un contorno dejándolo dorado a su paso. `d` es el contorno como
  // path cerrado (en px dentro de un cuadro de w×h) y el SVG se coloca encima, en absoluto, a
  // `desfase` px de la esquina del padre (que debe tener position: relative). Con `final` se
  // desvanece. Lo usan las tarjetas al palomearse y el rótulo al cambiar de objetivo.
  let {
    d,
    w,
    h,
    duracion,
    final = false,
    desfase = -1.5
  }: { d: string; w: number; h: number; duracion: number; final?: boolean; desfase?: number } = $props();

  const uid = $props.id();
</script>

<svg
  class="chispazo"
  class:final
  width={w}
  height={h}
  viewBox="0 0 {w} {h}"
  style="--trazo: {duracion}ms; left: {desfase}px; top: {desfase}px;"
  aria-hidden="true"
>
  <defs>
    <filter id="resplandor-{uid}" x="-20%" y="-60%" width="140%" height="220%">
      <feGaussianBlur stdDeviation="3" />
    </filter>
  </defs>
  <path class="rastro-halo" {d} pathLength="1" filter="url(#resplandor-{uid})" />
  <path class="rastro" {d} pathLength="1" />
  <path class="chispa-halo" {d} pathLength="1" filter="url(#resplandor-{uid})" />
  <path class="chispa" {d} pathLength="1" />
</svg>

<style>
  /* Con pathLength=1, 1 equivale a todo el contorno. */
  .chispazo {
    position: absolute;
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
  /* El rastro dorado se va dibujando desde el arranque del contorno. */
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
</style>
