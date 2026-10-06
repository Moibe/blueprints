<script lang="ts">
  // Pantalla de acceso: una sola contraseña (ADMIN_PASSWORD). El fondo de plano lo pone el layout.
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  let enviando = $state(false);
</script>

<svelte:head>
  <title>Acceso · blueprints</title>
</svelte:head>

<div class="pantalla">
  <form
    method="POST"
    class="hoja"
    use:enhance={() => {
      enviando = true;
      return async ({ update }) => {
        await update();
        enviando = false;
      };
    }}
  >
    <p class="etiqueta">Acceso restringido</p>
    <h1>blueprints</h1>

    <label for="password">Contraseña</label>
    <!-- svelte-ignore a11y_autofocus -->
    <input id="password" name="password" type="password" autocomplete="current-password" autofocus required />

    {#if form?.error}
      <p class="error" role="alert">{form.error}</p>
    {:else if !data.configurada}
      <p class="error" role="alert">Falta ADMIN_PASSWORD en el servidor.</p>
    {/if}

    <button type="submit" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
  </form>
</div>

<style>
  .pantalla {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 1rem;
    box-sizing: border-box;
  }
  .hoja {
    width: min(22rem, 100%);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.75rem 1.5rem;
    background: rgba(7, 31, 79, 0.35);
    backdrop-filter: blur(3px) saturate(110%);
    -webkit-backdrop-filter: blur(3px) saturate(110%);
    border: 1.5px solid var(--bp-line);
    border-radius: var(--bp-radius);
    outline: 1px dashed var(--bp-line-soft);
    outline-offset: -8px;
    box-shadow:
      0 0 18px rgba(255, 255, 255, 0.06),
      0 6px 20px rgba(0, 0, 0, 0.25);
  }
  .etiqueta {
    margin: 0;
    font-family: var(--bp-font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
  }
  h1 {
    margin: 0 0 0.75rem;
    font-family: var(--bp-font-hand);
    font-size: 2rem;
    font-weight: 400;
    letter-spacing: 0.03em;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }
  label {
    font-family: var(--bp-font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.75);
  }
  input {
    font: inherit;
    color: var(--bp-ink);
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid var(--bp-line-soft);
    border-radius: 6px;
    padding: 0.55rem 0.7rem;
  }
  input:focus {
    outline: 2px solid var(--bp-line);
    outline-offset: 1px;
  }
  .error {
    margin: 0;
    font-size: 0.85rem;
    color: #ffd1d1;
  }
  button {
    margin-top: 0.5rem;
    font: inherit;
    letter-spacing: 0.05em;
    color: var(--bp-b);
    background: rgba(255, 255, 255, 0.92);
    border: 0;
    border-radius: 6px;
    padding: 0.6rem;
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    background: #fff;
  }
  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
</style>
