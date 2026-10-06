// pm2: `pm2 start ecosystem.config.cjs` en el droplet (ver README › Despliegue).
// Es .cjs porque package.json es "type": "module" y pm2 carga este archivo con require().
const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');

// Las variables (PORT, HOST, ORIGIN, ADMIN_PASSWORD…) salen de .env, igual que en local.
// Se leen AQUÍ (mismo parser que `node --env-file`) y se pasan a pm2 como `env` explícito,
// porque `--env-file` no pisa variables que ya vengan en el entorno: con un PORT u ORIGIN
// exportado en el shell donde se hizo `pm2 start`, la app los heredaría y pm2 los guardaría
// en su dump para siempre. Con `env` explícito gana .env. Para aplicar un .env cambiado:
// `pm2 startOrReload ecosystem.config.cjs --update-env` (scripts/deploy.sh ya lo hace).
const envFile = path.join(__dirname, '.env');
if (!fs.existsSync(envFile)) {
	throw new Error(`Falta ${envFile}: copia .env.example y llénalo (README › Despliegue).`);
}
const dotenv = parseEnv(fs.readFileSync(envFile, 'utf8'));

module.exports = {
	apps: [
		{
			name: 'blueprints',
			// Rutas absolutas: así funciona igual desde cualquier carpeta (`pm2 start`, `pm2 resurrect`).
			script: path.join(__dirname, 'build/index.js'),
			// DATABASE_URL=./local.db se resuelve contra cwd, o sea esta carpeta.
			cwd: __dirname,
			env: {
				NODE_ENV: 'production',
				// Fechas del SSR (toLocaleDateString('es-MX')) en hora de México, no en UTC del droplet.
				TZ: 'America/Mexico_City',
				// Segundos que adapter-node espera a las peticiones en curso al apagar.
				// Menor que kill_timeout para que el apagado termine solo y no en SIGKILL.
				SHUTDOWN_TIMEOUT: '5',
				// .env manda sobre los tres de arriba si los define.
				...dotenv
			},
			instances: 1,
			exec_mode: 'fork',
			autorestart: true,
			max_memory_restart: '300M',
			// pm2 manda SIGINT; adapter-node deja de aceptar, termina lo que está en curso y sale.
			// pmx: false porque la instrumentación de pm2 (@pm2/io) mantiene vivo el event loop:
			// con ella el proceso nunca sale solo y pm2 lo mata con SIGKILL al vencer kill_timeout
			// (medido: 5.3 s por reinicio con pmx, 0.3 s sin él).
			pmx: false,
			kill_timeout: 8000,
			time: true
		}
	]
};
