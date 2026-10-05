<script lang="ts">
  // Línea de cota: topes a los lados, flechas en los extremos y el texto al centro.
  let { label }: { label: string } = $props();
</script>

<div class="dim" aria-hidden="true"><i></i><span>{label}</span><i></i></div>

<style>
  .dim {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    height: 14px;
    border-left: 1px solid rgba(255, 255, 255, 0.75);
    border-right: 1px solid rgba(255, 255, 255, 0.75);
  }
  .dim i {
    position: relative;
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.75);
  }
  .dim i::before {
    content: '';
    position: absolute;
    top: -3px;
    border-style: solid;
  }
  .dim i:first-child::before {
    left: 0;
    border-width: 3.5px 9px 3.5px 0;
    border-color: transparent rgba(255, 255, 255, 0.9) transparent transparent;
  }
  .dim i:last-child::before {
    right: 0;
    border-width: 3.5px 0 3.5px 9px;
    border-color: transparent transparent transparent rgba(255, 255, 255, 0.9);
  }
  .dim span {
    font-family: var(--bp-font-mono);
    font-size: 0.64rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.72);
    white-space: nowrap;
  }
</style>
