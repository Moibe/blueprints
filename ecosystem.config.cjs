// pm2: `pm2 start ecosystem.config.cjs` en el droplet (ver README › Despliegue).
// Es .cjs porque package.json es "type": "module" y pm2 carga este archivo con require().
const path = require('node:path');

module.exports = {
	apps: [
		{
			name: 'blueprints',
			// Rutas absolutas: así funciona igual desde cualquier carpeta (`pm2 start`, `pm2 resurrect`).
			script: path.join(__dirname, 'build/index.js'),
			cwd: __dirname,
			// Las variables (PORT, HOST, ORIGIN, ADMIN_PASSWORD…) salen de .env, igual que en local.
			// DATABASE_URL=./local.db se resuelve contra cwd, o sea esta carpeta.
			node_args: `--env-file=${path.join(__dirname, '.env')}`,
			env: { NODE_ENV: 'production' },
			instances: 1,
			exec_mode: 'fork',
			autorestart: true,
			max_memory_restart: '300M',
			// adapter-node cierra solo al recibir SIGINT: termina las peticiones en curso y sale.
			kill_timeout: 5000,
			time: true
		}
	]
};
