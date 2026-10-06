import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Mismo puerto que tendrá en el droplet. strictPort: si está ocupado, falla en vez de
	// brincar a otro puerto en silencio.
	server: { port: 1000, strictPort: true },
	preview: { port: 1000, strictPort: true },
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-node: corre con `node build` bajo pm2 en el droplet. BUILD_OUT lo usa
			// scripts/deploy.sh para construir en build.next y cambiar de carpeta de un golpe.
			adapter: adapter({ out: process.env.BUILD_OUT ?? 'build' })
		})
	]
});
