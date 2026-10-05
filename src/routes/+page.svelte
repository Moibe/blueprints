<script lang="ts">
  // Hoja de EJEMPLO para ver el look de plano: rótulo, planta con cotas y cuadro de
  // rotulación. El chrome (navbar/sidebar + fondo de cianotipo) vive en el layout.
  // Reemplaza todo esto por el contenido real de tu app.
  import Encabezado from '$lib/Encabezado.svelte';
  import Rotulo from '$lib/Rotulo.svelte';

  const fecha = new Date()
    .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();
</script>

<div class="sheet">
  <Encabezado
    etiqueta="Plano N.º 001 · Diseño general"
    titulo="blueprints"
    bajada="Lienzo en blanco: aquí van tus planes."
    cota="Lienzo · 100%"
  />

  <figure class="plan">
    <svg viewBox="-6 -6 470 300" role="img" aria-label="Planta arquitectónica de ejemplo">
      <defs>
        <!-- Temblor sutil de trazo a mano -->
        <filter id="trazo" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="2.2" />
        </filter>
      </defs>

      <g filter="url(#trazo)" fill="none" stroke="currentColor" stroke-linecap="round">
        <!-- Muros exteriores (con huecos para ventanas y puerta de entrada) -->
        <path class="muro" d="M40 40H90M170 40H300M380 40H440V280H220M180 280H40V150M40 90V40" />
        <!-- Muros interiores -->
        <path class="muro-int" d="M240 40V220M240 260V280M40 160H150M190 160H240M240 180H340M380 180H440" />

        <!-- Ventanas -->
        <g class="fino">
          <rect x="90" y="36" width="80" height="8" />
          <path d="M90 40H170" />
          <rect x="300" y="36" width="80" height="8" />
          <path d="M300 40H380" />
          <rect x="36" y="90" width="8" height="60" />
          <path d="M40 90V150" />
        </g>

        <!-- Puertas: hoja + abatimiento -->
        <g class="fino">
          <path d="M240 220H280" />
          <path class="giro" d="M280 220A40 40 0 0 1 240 260" />
          <path d="M150 160V200" />
          <path class="giro" d="M150 200A40 40 0 0 0 190 160" />
          <path d="M380 180V140" />
          <path class="giro" d="M380 140A40 40 0 0 0 340 180" />
          <path d="M180 280V240" />
          <path class="giro" d="M180 240A40 40 0 0 1 220 280" />
        </g>

        <!-- Cotas -->
        <g class="cota">
          <path d="M40 34V8M440 34V8M40 16H440M36 20l8-8M436 20l8-8" />
          <path d="M34 40H8M34 280H8M16 40V280M12 44l8-8M12 284l8-8" />
        </g>
      </g>

      <g class="rotulo" fill="currentColor" text-anchor="middle">
        <text x="140" y="98">RECÁMARA</text>
        <text x="110" y="226">ESTANCIA</text>
        <text x="340" y="108">COCINA</text>
        <text x="340" y="236">TALLER</text>
      </g>
      <g class="area" fill="currentColor" text-anchor="middle">
        <text x="140" y="116">14.4 m²</text>
        <text x="110" y="244">14.4 m²</text>
        <text x="340" y="126">16.2 m²</text>
        <text x="340" y="254">12.0 m²</text>
        <text x="240" y="11">12.00</text>
        <text x="11" y="160" transform="rotate(-90 11 160)">7.20</text>
      </g>
    </svg>
    <figcaption>Planta baja · Esc. 1:50</figcaption>
  </figure>

  <footer class="sheet-foot">
    <div class="notes">
      <p class="notes-title">Notas</p>
      <ol>
        <li>Hoja de ejemplo: reemplázala por el contenido de tu app.</li>
        <li>Cotas en metros, salvo indicación.</li>
        <li>Verificar medidas en obra antes de construir el cohete.</li>
      </ol>
    </div>

    <Rotulo plano="Inicio" {fecha} />
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

  /* Planta */
  .plan {
    margin: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    color: #fff;
  }
  .plan svg {
    width: min(100%, 540px);
    height: auto;
    overflow: visible;
    filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.35));
  }
  .muro {
    stroke-width: 4;
  }
  .muro-int {
    stroke-width: 2.6;
  }
  .fino {
    stroke-width: 1.1;
  }
  .giro {
    stroke-dasharray: 3 3;
  }
  .cota {
    stroke-width: 0.9;
    opacity: 0.8;
  }
  .rotulo text {
    font-family: var(--bp-font-hand);
    font-size: 15px;
    letter-spacing: 0.06em;
  }
  .area text {
    font-family: var(--bp-font-mono);
    font-size: 8.5px;
    letter-spacing: 0.08em;
    opacity: 0.75;
  }
  figcaption {
    font-family: var(--bp-font-hand);
    font-size: 1.05rem;
    color: rgba(255, 255, 255, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.6);
    padding: 0 0.6rem 0.1rem;
  }

  /* Pie: notas + cuadro de rotulación */
  .sheet-foot {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  .notes {
    font-family: var(--bp-font-mono);
    font-size: 0.72rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.72);
    max-width: 26rem;
  }
  .notes-title {
    margin: 0 0 0.2rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.9);
  }
  .notes ol {
    margin: 0;
    padding-left: 1.3rem;
    list-style: decimal;
  }
</style>
