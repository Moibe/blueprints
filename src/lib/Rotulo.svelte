<script lang="ts">
  // Cuadro de rotulación, el de la esquina inferior derecha de un plano.
  let {
    plano,
    hoja,
    fecha,
    escala = '1:50',
    proyecto = 'blueprints'
  }: { plano: string; hoja: string; fecha: string; escala?: string; proyecto?: string } = $props();
</script>

<aside class="cartouche" aria-label="Cuadro de rotulación">
  <div class="c-head">
    <span class="k">Proyecto</span>
    <span class="v hand">{proyecto}</span>
  </div>
  <div class="c-grid">
    <div><span class="k">Plano</span><span class="v">{plano}</span></div>
    <div><span class="k">Escala</span><span class="v">{escala}</span></div>
    <div><span class="k">Fecha</span><span class="v">{fecha}</span></div>
    <div><span class="k">Hoja</span><span class="v">{hoja}</span></div>
  </div>
</aside>

<style>
  .cartouche {
    min-width: 17rem;
    max-width: 22rem;
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    font-family: var(--bp-font-mono);
    background: rgba(7, 31, 79, 0.25);
  }
  .c-head {
    display: flex;
    flex-direction: column;
    padding: 0.45rem 0.7rem 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  }
  .c-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .c-grid > div {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 0.4rem 0.7rem;
  }
  .c-grid > div:nth-child(odd) {
    border-right: 1px solid rgba(255, 255, 255, 0.6);
  }
  .c-grid > div:nth-child(-n + 2) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  }
  .k {
    font-size: 0.58rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }
  .v {
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    color: #fff;
    overflow-wrap: anywhere;
  }
  .v.hand {
    font-family: var(--bp-font-hand);
    font-size: 1.35rem;
    letter-spacing: 0.03em;
    line-height: 1.2;
  }
</style>
